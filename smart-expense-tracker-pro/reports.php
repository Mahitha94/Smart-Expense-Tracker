<?php
/**
 * Smart Expense Tracker Pro - Reports & Analytics
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Reports & Analytics";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Financial Reports</h1>
            <p class="text-muted">Analyze your cashflow trends, export data as PDF/CSV, and check category distributions.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-outline"><i class="fa-solid fa-file-pdf"></i> PDF Report</button>
            <button class="btn btn-primary"><i class="fa-solid fa-download"></i> CSV Export</button>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Filter Card -->
        <div class="card md:col-span-3">
            <div class="card-header">
                <h3>Filter Report Data</h3>
            </div>
            <div class="card-body">
                <form action="reports.php" method="GET" class="filter-flex">
                    <div class="form-group mb-0">
                        <label for="time_frame">Time Range</label>
                        <select class="form-control" id="time_frame">
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="this_year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div class="form-group mb-0">
                        <label for="filter_category">Category</label>
                        <select class="form-control" id="filter_category">
                            <option value="all">All Categories</option>
                            <option value="Food">Food & Dining</option>
                            <option value="Rent">Housing</option>
                            <option value="Transport">Transportation</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="align-self: flex-end;">Apply Filters</button>
                </form>
            </div>
        </div>

        <!-- Breakdown Card 1 -->
        <div class="card">
            <div class="card-header">
                <h3>Category Distribution</h3>
            </div>
            <div class="card-body">
                <div class="chart-container" id="categoryDistributionChart">
                    <div class="chart-placeholder">
                        <p class="text-muted text-xs">PIE / DONUT Chart Canvas</p>
                        <!-- Pie slices placeholder -->
                        <div class="pie-chart-visual">
                            <div class="pie-segment bg-primary" style="transform: rotate(0deg); width: 100px; height: 100px; border-radius: 50%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Breakdown Card 2 -->
        <div class="card">
            <div class="card-header">
                <h3>Monthly Cash Flow Breakdown</h3>
            </div>
            <div class="card-body">
                <div class="chart-container" id="cashFlowBarChart">
                    <div class="chart-placeholder">
                        <p class="text-muted text-xs">BAR Chart Canvas</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>
<script src="assets/js/charts.js"></script>

<?php include 'includes/footer.php'; ?>
