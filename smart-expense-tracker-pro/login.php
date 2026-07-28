<?php
/**
 * Smart Expense Tracker Pro - Login Page
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

require_once 'includes/auth.php';

// Prevent logged-in users from accessing login page
if (is_logged_in()) {
    header("Location: dashboard.php");
    exit();
}

$error = "";
// Login submission logic will be implemented in subsequent modules.
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Smart Expense Tracker Pro</title>
    <!-- Combined CSS files -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/login.css">
    <link rel="stylesheet" href="assets/css/components.css">
    <link rel="stylesheet" href="assets/css/responsive.css">
</head>
<body class="login-body">
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h2>Smart Expense Tracker <span class="accent">Pro</span></h2>
                <p>Welcome back! Please sign in to your account.</p>
            </div>
            
            <?php if (!empty($error)): ?>
                <div class="alert alert-danger"><?php echo $error; ?></div>
            <?php endif; ?>

            <form action="login.php" method="POST" id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="Enter your email" required autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="Enter your password" required autocomplete="current-password">
                </div>

                <div class="form-actions">
                    <div class="remember-me">
                        <input type="checkbox" id="remember" name="remember">
                        <label for="remember">Remember me</label>
                    </div>
                    <a href="#" class="forgot-password-link">Forgot Password?</a>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Sign In</button>
            </form>

            <div class="login-footer">
                <p>Don't have an account? <a href="register.php" class="auth-link">Register here</a></p>
            </div>
        </div>
    </div>

    <!-- Main JS Bundle -->
    <script src="assets/js/main.js"></script>
</body>
</html>
