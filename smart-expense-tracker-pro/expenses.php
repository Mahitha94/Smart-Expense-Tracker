<?php
/**
 * Smart Expense Tracker Pro - Expenses Management
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Expenses";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Expense Management</h1>
            <p class="text-muted">Track and organize your personal and professional expenditure.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-primary" onclick="document.getElementById('addExpenseModal').style.display='block'">
                <i class="fa-solid fa-plus"></i> Add New Expense
            </button>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Add/Edit form mockup -->
        <div class="card" id="addExpenseFormContainer">
            <div class="card-header">
                <h3>Add New Expense</h3>
            </div>
            <div class="card-body">
                <form action="expenses.php" method="POST" class="needs-validation">
                    <div class="form-group">
                        <label for="amount">Amount ($)</label>
                        <input type="number" step="0.01" class="form-control" id="amount" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select class="form-control" id="category" required>
                            <option value="">Choose category...</option>
                            <option value="Food">Food & Dining</option>
                            <option value="Rent">Housing / Rent</option>
                            <option value="Transport">Transportation</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other Expenses</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expense_date">Date</label>
                        <input type="date" class="form-control" id="expense_date" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <input type="text" class="form-control" id="description" placeholder="Starbucks, Uber, etc.">
                    </div>
                    <div class="form-group">
                        <label for="receipt">Upload Receipt (Optional)</label>
                        <input type="file" class="form-control" id="receipt">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Save Expense</button>
                </form>
            </div>
        </div>

        <!-- Filter and expense listing -->
        <div class="card">
            <div class="card-header">
                <h3>Expense History</h3>
                <div class="header-search">
                    <input type="text" class="form-control" placeholder="Search expenses...">
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Mock records -->
                            <tr>
                                <td>June 30, 2026</td>
                                <td><span class="badge badge-light-primary">Food</span></td>
                                <td>McDonald's Lunch</td>
                                <td class="text-danger font-weight-bold">-$12.50</td>
                                <td>
                                    <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                            <tr>
                                <td>June 28, 2026</td>
                                <td><span class="badge badge-light-warning">Transport</span></td>
                                <td>Gas station refill</td>
                                <td class="text-danger font-weight-bold">-$45.00</td>
                                <td>
                                    <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>
<script src="assets/js/expense.js"></script>

<?php include 'includes/footer.php'; ?>
