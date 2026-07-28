<?php
/**
 * Smart Expense Tracker Pro - Expenses API Endpoint
 * Handles AJAX / Fetch requests from the frontend to manage expenses in MySQL
 * Features secure prepared PDO statements, filtering, sorting, and dynamic category resolution
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

// Helper to resolve category ID from name, creating it dynamically if it doesn't exist
function get_category_id($pdo, $category_name, $type = 'expense') {
    // Sanitize category name
    $category_name = trim($category_name);
    if (empty($category_name)) {
        $category_name = 'Others';
    }

    // Standardize category name mappings for student database compatibility
    if (strcasecmp($category_name, 'Food') === 0) {
        $category_name = 'Food & Dining';
    } else if (strcasecmp($category_name, 'Utilities') === 0 || strcasecmp($category_name, 'Rent') === 0 || strcasecmp($category_name, 'Bills') === 0) {
        $category_name = 'Housing & Utilities';
    } else if (strcasecmp($category_name, 'Travel') === 0 || strcasecmp($category_name, 'Fuel') === 0) {
        $category_name = 'Transportation';
    } else if (strcasecmp($category_name, 'Entertainment') === 0) {
        $category_name = 'Entertainment';
    } else if (strcasecmp($category_name, 'Shopping') === 0) {
        $category_name = 'Shopping';
    }

    // Try to find category
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND type = ?");
    $stmt->execute([$category_name, $type]);
    $cat = $stmt->fetch();

    if ($cat) {
        return $cat['id'];
    }

    // Create dynamic category if missing
    try {
        $stmt_insert = $pdo->prepare("INSERT INTO categories (name, type, color, icon) VALUES (?, ?, '#6366f1', 'icon-folder')");
        $stmt_insert->execute([$category_name, $type]);
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        // Fallback to "Other" category (id 9 or name Other) if insert fails
        $stmt_fallback = $pdo->prepare("SELECT id FROM categories WHERE name = 'Other' OR name = 'Others' LIMIT 1");
        $stmt_fallback->execute();
        $fallback_cat = $stmt_fallback->fetch();
        return $fallback_cat ? $fallback_cat['id'] : 1;
    }
}

switch ($method) {
    case 'GET':
        // Fetch expenses for authenticated user with filters and sorting
        try {
            $query = "SELECT e.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon 
                      FROM expenses e 
                      JOIN categories c ON e.category_id = c.id 
                      WHERE e.user_id = :user_id";
            
            $params = [':user_id' => $user_id];

            // 1. Search filter (on description)
            if (!empty($_GET['search'])) {
                $query .= " AND e.description LIKE :search";
                $params[':search'] = '%' . $_GET['search'] . '%';
            }

            // 2. Category filter
            if (!empty($_GET['category']) && $_GET['category'] !== 'all') {
                $query .= " AND LOWER(c.name) = LOWER(:category)";
                $params[':category'] = $_GET['category'];
            }

            // 3. Date filters
            if (!empty($_GET['start_date'])) {
                $query .= " AND e.expense_date >= :start_date";
                $params[':start_date'] = $_GET['start_date'];
            }
            if (!empty($_GET['end_date'])) {
                $query .= " AND e.expense_date <= :end_date";
                $params[':end_date'] = $_GET['end_date'];
            }

            // 4. Amount filters
            if (!empty($_GET['min_amount'])) {
                $query .= " AND e.amount >= :min_amount";
                $params[':min_amount'] = floatval($_GET['min_amount']);
            }
            if (!empty($_GET['max_amount'])) {
                $query .= " AND e.amount <= :max_amount";
                $params[':max_amount'] = floatval($_GET['max_amount']);
            }

            // 5. Sort options
            $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'newest';
            switch ($sort_by) {
                case 'oldest':
                    $query .= " ORDER BY e.expense_date ASC, e.id ASC";
                    break;
                case 'highest':
                    $query .= " ORDER BY e.amount DESC";
                    break;
                case 'lowest':
                    $query .= " ORDER BY e.amount ASC";
                    break;
                case 'newest':
                default:
                    $query .= " ORDER BY e.expense_date DESC, e.id DESC";
                    break;
            }

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $expenses = $stmt->fetchAll();

            // Format expenses for output compatible with the frontend
            $formatted = [];
            foreach ($expenses as $exp) {
                $formatted[] = [
                    'id' => 'db_exp_' . $exp['id'],
                    'db_id' => $exp['id'],
                    'date' => $exp['expense_date'],
                    'category' => $exp['category_name'],
                    'description' => $exp['description'],
                    'amount' => floatval($exp['amount']),
                    'type' => 'expense',
                    'status' => 'Completed', // Default database status
                    'receiptUrl' => $exp['receipt_path']
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
        // Add or Update expense
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Support regular form post or JSON payload
        $title = isset($input['title']) ? $input['title'] : (isset($_POST['title']) ? $_POST['title'] : '');
        $description = isset($input['description']) ? $input['description'] : (isset($_POST['description']) ? $_POST['description'] : $title);
        $amount = isset($input['amount']) ? floatval($input['amount']) : (isset($_POST['amount']) ? floatval($_POST['amount']) : 0.0);
        $category = isset($input['category']) ? $input['category'] : (isset($_POST['category']) ? $_POST['category'] : 'Others');
        $date = isset($input['date']) ? $input['date'] : (isset($_POST['date']) ? $_POST['date'] : date('Y-m-d'));
        $receipt_path = isset($input['receiptUrl']) ? $input['receiptUrl'] : (isset($_POST['receiptUrl']) ? $_POST['receiptUrl'] : null);
        $id = isset($input['id']) ? $input['id'] : (isset($_POST['id']) ? $_POST['id'] : null);

        // Extract db_id if it comes as a string key e.g., 'db_exp_12'
        if ($id && strpos($id, 'db_exp_') === 0) {
            $id = intval(substr($id, 7));
        }

        // Validation checks
        if (empty($description)) {
            $description = $title;
        }
        if (empty($title)) {
            $title = $description;
        }

        if (empty($title)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Title/Description is required']);
            exit();
        }
        if ($amount < 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Amount cannot be negative']);
            exit();
        }
        if (empty($category)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Category is required']);
            exit();
        }
        if (empty($date)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Date is required']);
            exit();
        }

        $category_id = get_category_id($pdo, $category);

        try {
            if ($id) {
                // UPDATE action
                $stmt = $pdo->prepare("UPDATE expenses SET category_id = ?, amount = ?, description = ?, receipt_path = ?, expense_date = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$category_id, $amount, $description, $receipt_path, $date, $id, $user_id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Expense updated successfully',
                    'data' => [
                        'id' => 'db_exp_' . $id,
                        'date' => $date,
                        'category' => $category,
                        'description' => $description,
                        'amount' => $amount,
                        'type' => 'expense',
                        'status' => 'Completed',
                        'receiptUrl' => $receipt_path
                    ]
                ]);
            } else {
                // INSERT action
                $stmt = $pdo->prepare("INSERT INTO expenses (user_id, category_id, amount, description, receipt_path, expense_date) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $category_id, $amount, $description, $receipt_path, $date]);
                $new_id = $pdo->lastInsertId();

                echo json_encode([
                    'success' => true,
                    'message' => 'Expense recorded successfully',
                    'data' => [
                        'id' => 'db_exp_' . $new_id,
                        'date' => $date,
                        'category' => $category,
                        'description' => $description,
                        'amount' => $amount,
                        'type' => 'expense',
                        'status' => 'Completed',
                        'receiptUrl' => $receipt_path
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
        // Delete an expense
        $input = json_decode(file_get_contents('php://input'), true);
        $id = isset($input['id']) ? $input['id'] : (isset($_GET['id']) ? $_GET['id'] : null);

        if ($id && strpos($id, 'db_exp_') === 0) {
            $id = intval(substr($id, 7));
        }

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Expense ID is required for deletion']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Expense deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Expense record not found or unauthorized'
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
