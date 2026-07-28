<?php
/**
 * Smart Expense Tracker Pro - Register Page
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

require_once 'includes/auth.php';

// Prevent logged-in users from accessing register page
if (is_logged_in()) {
    header("Location: dashboard.php");
    exit();
}

$error = "";
$success = "";
// Registration submission logic will be implemented in subsequent modules.
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Smart Expense Tracker Pro</title>
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
                <p>Create a professional dashboard to manage your budgets and goals.</p>
            </div>
            
            <?php if (!empty($error)): ?>
                <div class="alert alert-danger"><?php echo $error; ?></div>
            <?php endif; ?>

            <?php if (!empty($success)): ?>
                <div class="alert alert-success"><?php echo $success; ?></div>
            <?php endif; ?>

            <form action="register.php" method="POST" id="registerForm" class="login-form">
                <div class="form-group">
                    <label for="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" class="form-control" placeholder="John Doe" required autocomplete="name">
                </div>

                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="john.doe@example.com" required autocomplete="username">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="Create a strong password" required autocomplete="new-password">
                </div>

                <div class="form-group">
                    <label for="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" class="form-control" placeholder="Repeat your password" required autocomplete="new-password">
                </div>

                <div class="terms-agreement">
                    <input type="checkbox" id="terms" name="terms" required>
                    <label for="terms">I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.</label>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Sign Up</button>
            </form>

            <div class="login-footer">
                <p>Already have an account? <a href="login.php" class="auth-link">Sign In here</a></p>
            </div>
        </div>
    </div>

    <!-- Main JS Bundle -->
    <script src="assets/js/main.js"></script>
</body>
</html>
