<?php
/**
 * Smart Expense Tracker Pro - Settings Page
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Settings";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Application Settings</h1>
            <p class="text-muted">Configure currency preferences, email alert thresholds, and dashboard layouts.</p>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="card">
            <div class="card-header">
                <h3>Preferences</h3>
            </div>
            <div class="card-body">
                <form action="settings.php" method="POST">
                    <div class="form-group">
                        <label for="currency">Primary Currency</label>
                        <select class="form-control" id="currency" name="currency">
                            <option value="USD">USD ($) - US Dollar</option>
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="GBP">GBP (£) - British Pound</option>
                            <option value="INR">INR (₹) - Indian Rupee</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="alert_level">Overbudget Warning Trigger</label>
                        <select class="form-control" id="alert_level" name="alert_level">
                            <option value="75">75% of budget reached</option>
                            <option value="85" selected>85% of budget reached</option>
                            <option value="95">95% of budget reached</option>
                            <option value="100">100% of budget reached</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-setting">
                            <input type="checkbox" id="email_notify" name="email_notify" checked>
                            <label for="email_notify">Send weekly summary report via email</label>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">Save Preferences</button>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>App Status & Export</h3>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <strong>College Project Metadata:</strong><br>
                    Module Version: 1.0 (Boilerplate Architecture)<br>
                    Database State: Configured (db.sql template ready)<br>
                </div>
                
                <p class="text-muted text-xs mb-4">Export all your transactions and account data into JSON format for offline backups.</p>
                <button class="btn btn-outline btn-block">Download Full Data (JSON)</button>
            </div>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>

<?php include 'includes/footer.php'; ?>
