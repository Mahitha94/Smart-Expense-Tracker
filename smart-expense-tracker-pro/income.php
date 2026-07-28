<?php
/**
 * Smart Expense Tracker Pro - Income Management
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Income";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Income Streams</h1>
            <p class="text-muted">Monitor salary, freelancing projects, and other secondary revenue streams.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-success">
                <i class="fa-solid fa-plus"></i> Add Income
            </button>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Add Income form -->
        <div class="card">
            <div class="card-header">
                <h3>Add Income Entry</h3>
            </div>
            <div class="card-body">
                <form action="income.php" method="POST">
                    <div class="form-group">
                        <label for="amount">Amount ($)</label>
                        <input type="number" step="0.01" class="form-control" id="amount" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="source">Source Category</label>
                        <select class="form-control" id="source" required>
                            <option value="">Choose source...</option>
                            <option value="Salary">Primary Salary</option>
                            <option value="Freelance">Freelance Projects</option>
                            <option value="Investments">Investment Return</option>
                            <option value="Gifts">Gifts & Grants</option>
                            <option value="Other">Other Revenue</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="income_date">Date</label>
                        <input type="date" class="form-control" id="income_date" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label for="description">Memo / Note</label>
                        <input type="text" class="form-control" id="description" placeholder="Project milestone, bonus, etc.">
                    </div>
                    <button type="submit" class="btn btn-success btn-block">Record Income</button>
                </form>
            </div>
        </div>

        <!-- History card -->
        <div class="card">
            <div class="card-header">
                <h3>Income History</h3>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>June 28, 2026</td>
                                <td><span class="badge badge-light-success">Salary</span></td>
                                <td>Monthly Company Paycheck</td>
                                <td class="text-success font-weight-bold">+$5,000.00</td>
                                <td>
                                    <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                            <tr>
                                <td>June 15, 2026</td>
                                <td><span class="badge badge-light-success">Freelance</span></td>
                                <td>Consulting Mobile App Project</td>
                                <td class="text-success font-weight-bold">+$1,200.00</td>
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
<script src="assets/js/income.js"></script>

<?php include 'includes/footer.php'; ?>
