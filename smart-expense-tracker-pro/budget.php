<?php
/**
 * Smart Expense Tracker Pro - Budgeting System
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Budgets";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Monthly Budgets</h1>
            <p class="text-muted">Establish spend limits per category to prevent overspending alerts.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> Set Budget
            </button>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Budget form -->
        <div class="card">
            <div class="card-header">
                <h3>Set Up New Budget</h3>
            </div>
            <div class="card-body">
                <form action="budget.php" method="POST">
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select class="form-control" id="category" required>
                            <option value="">Select category...</option>
                            <option value="Food">Food & Dining</option>
                            <option value="Housing">Housing & Utilities</option>
                            <option value="Transport">Transportation</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Shopping">Shopping</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="budget_amount">Monthly Cap ($)</label>
                        <input type="number" step="1" class="form-control" id="budget_amount" placeholder="500" required>
                    </div>
                    <div class="form-group">
                        <label for="month">Budget Month</label>
                        <input type="month" class="form-control" id="month" value="<?php echo date('Y-m'); ?>" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Set Limit</button>
                </form>
            </div>
        </div>

        <!-- Budget usage view -->
        <div class="card">
            <div class="card-header">
                <h3>Current Budget Usage</h3>
            </div>
            <div class="card-body">
                <!-- Food & Dining -->
                <div class="budget-progress-container mb-4">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="font-weight-bold text-dark">Food & Dining</span>
                        <span class="text-muted">$250.00 spent of $500.00 (50%)</span>
                    </div>
                    <div class="progress-bar-container bg-light" style="height: 12px; border-radius: 6px;">
                        <div class="progress-bar bg-success" style="width: 50%; height: 100%; border-radius: 6px;"></div>
                    </div>
                </div>

                <!-- Housing & Utilities -->
                <div class="budget-progress-container mb-4">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="font-weight-bold text-dark">Housing & Utilities</span>
                        <span class="text-muted">$850.00 spent of $1,000.00 (85%)</span>
                    </div>
                    <div class="progress-bar-container bg-light" style="height: 12px; border-radius: 6px;">
                        <div class="progress-bar bg-warning" style="width: 85%; height: 100%; border-radius: 6px;"></div>
                    </div>
                </div>

                <!-- Entertainment -->
                <div class="budget-progress-container mb-4">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="font-weight-bold text-dark">Entertainment</span>
                        <span class="text-muted">$180.00 spent of $200.00 (90%)</span>
                    </div>
                    <div class="progress-bar-container bg-light" style="height: 12px; border-radius: 6px;">
                        <div class="progress-bar bg-danger" style="width: 90%; height: 100%; border-radius: 6px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>
<script src="assets/js/budget.js"></script>

<?php include 'includes/footer.php'; ?>
