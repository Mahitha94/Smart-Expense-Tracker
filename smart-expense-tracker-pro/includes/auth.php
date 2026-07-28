<?php
/**
 * Smart Expense Tracker Pro - Session & Authentication Guards
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if the current user is authenticated
 * @return bool
 */
function is_logged_in() {
    return isset($_SESSION['user_id']);
}

/**
 * Access guard - forces redirection to login.php if session is inactive
 * Standard helper to protect private pages
 */
function check_auth() {
    if (!is_logged_in()) {
        // Since we are in Module 1, we can optionally auto-seed a dummy session if user visits pages to make the boilerplate interactive!
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = "College Student";
        $_SESSION['user_email'] = "student@college.edu";
        $_SESSION['user_currency'] = "USD";
        
        // In Module 2, this will be replaced with direct redirection:
        /*
        header("Location: login.php");
        exit();
        */
    }
}
?>
