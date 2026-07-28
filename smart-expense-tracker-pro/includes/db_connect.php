<?php
/**
 * Smart Expense Tracker Pro - Database Connector
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 * Uses modern PHP Data Objects (PDO) for secure, SQL-injection proof transactions
 */

// Database Credentials (Configure to match your local XAMPP/WAMP environment)
$db_host = "localhost";
$db_name = "smart_expense_tracker";
$db_user = "root";
$db_pass = ""; // Default XAMPP MySQL password is empty
$db_port = "3306";
$db_charset = "utf8mb4";

try {
    // Construct PDO Connection DSN
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset={$db_charset}";
    
    // Configure robust attributes for PDO
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on SQL errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays by default
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Disable emulation to use native prepared statements
    ];
    
    // Create connection object
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    
    // PDO Connected successfully
} catch (PDOException $e) {
    // In production, log errors to a file rather than printing to screen
    // For local student projects, rendering a clear error page helps debugging immensely.
    die("<h3>Smart Expense Tracker Pro: Database connection failed</h3>" . 
        "<p>Please verify your local server (XAMPP/WAMP) is running, MySQL server is active, and database <strong>smart_expense_tracker</strong> has been imported via `db.sql`.</p>" .
        "<br><em>Error Debug Details: " . htmlspecialchars($e->getMessage()) . "</em>");
}
?>
