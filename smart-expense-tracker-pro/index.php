<?php
/**
 * Smart Expense Tracker Pro - Landing/Redirect Page
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

// Start session to check if user is logged in
session_start();

// If user is already logged in, redirect to dashboard. Else, redirect to login.
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit();
} else {
    header("Location: login.php");
    exit();
}
?>
