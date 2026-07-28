<?php
/**
 * Smart Expense Tracker Pro - Income API Endpoint
 * Handles AJAX / Fetch requests from the frontend to manage income in MySQL
 * Features secure prepared PDO statements, filtering, and sorting
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../includes/auth.php';
require_once '../includes/db_connect.php';

// Ensure user is authenticated, using session
check_auth();
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1; // Fallback to user 1 for development/testing

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $query = "SELECT * FROM income WHERE user_id = :user_id";
            $params = [':user_id' => $user_id];

            // 1. Search filter (on source_name or description)
            if (!empty($_GET['search'])) {
                $query .= " AND (source_name LIKE :search OR description LIKE :search)";
                $params[':search'] = '%' . $_GET['search'] . '%';
            }

            // 2. Sort options
            $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'newest';
            switch ($sort_by) {
                case 'oldest':
                    $query .= " ORDER BY income_date ASC, id ASC";
                    break;
                case 'highest':
                    $query .= " ORDER BY amount DESC";
                    break;
                case 'lowest':
                    $query .= " ORDER BY amount ASC";
                    break;
                case 'newest':
                default:
                    $query .= " ORDER BY income_date DESC, id DESC";
                    break;
            }

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $incomes = $stmt->fetchAll();

            // Format incomes for output compatible with frontend
            $formatted = [];
            foreach ($incomes as $inc) {
                $formatted[] = [
                    'id' => 'db_inc_' . $inc['id'],
                    'db_id' => $inc['id'],
                    'date' => $inc['income_date'],
                    'category' => $inc['source_name'], // map source_name to category
                    'description' => $inc['description'],
                    'amount' => floatval($inc['amount']),
                    'type' => 'income',
                    'status' => 'Completed', // Default
                    'currency' => 'INR' // Default to INR
                ];
            }

            echo json_encode([
                'success' => true,
                'data' => $formatted
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $source_name = isset($input['category']) ? $input['category'] : (isset($_POST['category']) ? $_POST['category'] : 'Other');
        $amount = isset($input['amount']) ? floatval($input['amount']) : (isset($_POST['amount']) ? floatval($_POST['amount']) : 0.0);
        $description = isset($input['description']) ? $input['description'] : (isset($_POST['description']) ? $_POST['description'] : $source_name);
        $date = isset($input['date']) ? $input['date'] : (isset($_POST['date']) ? $_POST['date'] : date('Y-m-d'));
        $id = isset($input['id']) ? $input['id'] : (isset($_POST['id']) ? $_POST['id'] : null);

        if ($id && strpos($id, 'db_inc_') === 0) {
            $id = intval(substr($id, 7));
        }

        // Validation checks
        if (empty($source_name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Income Source (Category) is required']);
            exit();
        }
        if ($amount < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Amount cannot be negative']);
            exit();
        }
        if (empty($date)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Date is required']);
            exit();
        }

        try {
            if ($id) {
                // UPDATE action
                $stmt = $pdo->prepare("UPDATE income SET source_name = ?, amount = ?, description = ?, income_date = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$source_name, $amount, $description, $date, $id, $user_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Income updated successfully',
                    'data' => [
                        'id' => 'db_inc_' . $id,
                        'date' => $date,
                        'category' => $source_name,
                        'description' => $description,
                        'amount' => $amount,
                        'type' => 'income',
                        'status' => 'Completed',
                        'currency' => 'INR'
                    ]
                ]);
            } else {
                // INSERT action
                $stmt = $pdo->prepare("INSERT INTO income (user_id, source_name, amount, description, income_date) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $source_name, $amount, $description, $date]);
                $new_id = $pdo->lastInsertId();

                echo json_encode([
                    'success' => true,
                    'message' => 'Income recorded successfully',
                    'data' => [
                        'id' => 'db_inc_' . $new_id,
                        'date' => $date,
                        'category' => $source_name,
                        'description' => $description,
                        'amount' => $amount,
                        'type' => 'income',
                        'status' => 'Completed',
                        'currency' => 'INR'
                    ]
                ]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database operation failed: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? $input['id'] : (isset($_GET['id']) ? $_GET['id'] : null);

        if ($id && strpos($id, 'db_inc_') === 0) {
            $id = intval(substr($id, 7));
        }

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Income ID is required for deletion']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM income WHERE id = ? AND user_id = ?");
            $stmt->execute([id, $user_id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Income deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Income record not found or unauthorized'
                ]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Delete operation failed: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
