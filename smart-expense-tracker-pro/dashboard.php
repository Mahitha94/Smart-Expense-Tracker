<?php
/**
 * Smart Expense Tracker Pro - Dashboard Page
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

// Authentication guard - protects this page from guests
check_auth();

$page_title = "Dashboard";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<!-- Main Content Area -->
<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Dashboard Overview</h1>
            <p class="text-muted">Welcome back, <span class="user-highlight"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Alex Johnson'); ?></span>! Here is your real-time financial health.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-outline">
                <i class="fa-solid fa-cloud-arrow-down"></i> Export Report
            </button>
            <button class="btn btn-primary" onclick="window.location.href='expenses.php'">
                <i class="fa-solid fa-plus"></i> Add Transaction
            </button>
        </div>
    </div>

    <!-- 1. Six Premium Dashboard Cards -->
    <div class="stats-grid">
        <!-- Card 1: Total Balance -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Total Balance</span>
                    <h2 class="stat-value text-primary">$4,850.00</h2>
                    <span class="stat-delta text-success">
                        <i class="fa-solid fa-arrow-up-right"></i> +12% this month
                    </span>
                </div>
                <div class="stat-icon bg-light-primary">
                    <i class="fa-solid fa-wallet text-primary"></i>
                </div>
            </div>
        </div>

        <!-- Card 2: Total Income -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Total Income</span>
                    <h2 class="stat-value text-success">$6,200.00</h2>
                    <span class="stat-delta text-success">
                        <i class="fa-solid fa-arrow-up-right"></i> +8% from last month
                    </span>
                </div>
                <div class="stat-icon bg-light-success">
                    <i class="fa-solid fa-arrow-trend-up text-success"></i>
                </div>
            </div>
        </div>

        <!-- Card 3: Total Expenses -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Total Expenses</span>
                    <h2 class="stat-value text-danger">$1,350.00</h2>
                    <span class="stat-delta text-danger">
                        <i class="fa-solid fa-arrow-down-right"></i> -5% from last month
                    </span>
                </div>
                <div class="stat-icon bg-light-danger">
                    <i class="fa-solid fa-receipt text-danger"></i>
                </div>
            </div>
        </div>

        <!-- Card 4: Total Savings -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Total Savings</span>
                    <h2 class="stat-value text-success">$1,200.00</h2>
                    <span class="stat-delta text-success">
                        <i class="fa-solid fa-piggy-bank text-success"></i> +15% this month
                    </span>
                </div>
                <div class="stat-icon bg-light-success">
                    <i class="fa-solid fa-basket-shopping text-success"></i>
                </div>
            </div>
        </div>

        <!-- Card 5: Remaining Budget -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Remaining Budget</span>
                    <h2 class="stat-value text-warning">$650.00</h2>
                    <span class="stat-delta text-warning">
                        <i class="fa-solid fa-scale-balanced"></i> 32.5% left
                    </span>
                </div>
                <div class="stat-icon bg-light-warning">
                    <i class="fa-solid fa-scale-balanced text-warning"></i>
                </div>
            </div>
        </div>

        <!-- Card 6: Financial Health Score -->
        <div class="card stat-card">
            <div class="card-body">
                <div class="stat-info">
                    <span class="stat-label">Financial Health</span>
                    <h2 class="stat-value text-primary">85/100</h2>
                    <span class="stat-delta text-success">
                        <i class="fa-solid fa-circle-check"></i> Excellent
                    </span>
                </div>
                <div class="stat-icon bg-light-primary">
                    <i class="fa-solid fa-heart-pulse text-primary"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. Main Two-Column Bento Layout -->
    <div class="dashboard-grid">
        
        <!-- LEFT COLUMN: Charts & Recent Transactions -->
        <div class="dashboard-left-col">
            
            <!-- Charts subgrid containing all 4 requested charts -->
            <div class="charts-subgrid">
                
                <!-- Chart A: Income vs Expense Bar Chart -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3>Income vs Expenses</h3>
                        <span class="text-muted text-xs">Last 6 Months</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container-wrapper">
                            <canvas id="incomeVsExpenseChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart B: Expense Category Pie Chart -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3>Category Distribution</h3>
                        <span class="text-muted text-xs">Current Month</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container-wrapper">
                            <canvas id="categoryDistributionChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart C: Monthly Expense Line Chart -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3>Monthly Spending Trend</h3>
                        <span class="text-muted text-xs">Expense Flow</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container-wrapper">
                            <canvas id="monthlyExpenseChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Chart D: Savings Progress Doughnut Chart -->
                <div class="card chart-card">
                    <div class="card-header">
                        <h3>Savings Progress</h3>
                        <span class="text-muted text-xs">Goal Ratio</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container-wrapper">
                            <canvas id="savingsProgressChart"></canvas>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Recent Transactions Table Card -->
            <div class="card recent-transactions-card">
                <div class="card-header">
                    <div class="transactions-table-header">
                        <h3>Recent Transactions</h3>
                        <div class="header-filters">
                            <button class="btn btn-sm btn-outline active">All</button>
                            <button class="btn btn-sm btn-outline">Expenses</button>
                            <button class="btn btn-sm btn-outline">Income</button>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>July 01, 2026</td>
                                    <td>Starbucks Coffee</td>
                                    <td><span class="badge badge-light-danger">Food & Dining</span></td>
                                    <td><span class="text-danger font-weight-bold">Expense</span></td>
                                    <td class="font-weight-bold text-danger">-$5.40</td>
                                    <td>
                                        <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>June 30, 2026</td>
                                    <td>Freelance Coding Project</td>
                                    <td><span class="badge badge-light-success">Income</span></td>
                                    <td><span class="text-success font-weight-bold">Income</span></td>
                                    <td class="font-weight-bold text-success">+$1,200.00</td>
                                    <td>
                                        <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>June 29, 2026</td>
                                    <td>Apartment Rent Payment</td>
                                    <td><span class="badge badge-light-danger">Housing</span></td>
                                    <td><span class="text-danger font-weight-bold">Expense</span></td>
                                    <td class="font-weight-bold text-danger">-$850.00</td>
                                    <td>
                                        <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>June 28, 2026</td>
                                    <td>Subway Lunch</td>
                                    <td><span class="badge badge-light-danger">Food & Dining</span></td>
                                    <td><span class="text-danger font-weight-bold">Expense</span></td>
                                    <td class="font-weight-bold text-danger">-$12.50</td>
                                    <td>
                                        <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn btn-icon btn-sm text-danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>June 27, 2026</td>
                                    <td>Monthly Salary Deposit</td>
                                    <td><span class="badge badge-light-success">Salary</span></td>
                                    <td><span class="text-success font-weight-bold">Income</span></td>
                                    <td class="font-weight-bold text-success">+$5,000.00</td>
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

        <!-- RIGHT SIDE PANEL: Quick Actions, Financial Summaries, Savings Target, and Financial Health Status -->
        <div class="right-panel-wrapper">
            
            <!-- Quick Actions Panel -->
            <div class="card quick-actions-card">
                <div class="card-header">
                    <h3>Quick Operations</h3>
                </div>
                <div class="card-body">
                    <div class="quick-actions-grid">
                        <button class="action-quick-btn" onclick="window.location.href='expenses.php'">
                            <i class="fa-solid fa-receipt text-danger"></i>
                            <span>+ Add Expense</span>
                        </button>
                        <button class="action-quick-btn" onclick="window.location.href='income.php'">
                            <i class="fa-solid fa-wallet text-success"></i>
                            <span>+ Add Income</span>
                        </button>
                        <button class="action-quick-btn" onclick="window.location.href='budget.php'">
                            <i class="fa-solid fa-sliders text-warning"></i>
                            <span>+ Set Budget</span>
                        </button>
                        <button class="action-quick-btn" onclick="window.location.href='savings.php'">
                            <i class="fa-solid fa-bullseye text-primary"></i>
                            <span>+ Create Goal</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Financial Health Status Panel -->
            <div class="card">
                <div class="card-header">
                    <h3>Financial Health Status</h3>
                </div>
                <div class="card-body">
                    <div class="health-score-container">
                        <!-- SVG Radial Gauge -->
                        <div class="health-gauge-box">
                            <svg class="health-score-circle" viewBox="0 0 160 160">
                                <defs>
                                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#6366f1" />
                                        <stop offset="100%" stop-color="#10b981" />
                                    </linearGradient>
                                </defs>
                                <circle class="health-score-circle-bg" cx="80" cy="80" r="70"></circle>
                                <circle class="health-score-circle-progress" cx="80" cy="80" r="70"></circle>
                            </svg>
                            <div class="health-score-text">
                                <span class="health-number">85</span>
                                <span class="health-max">/ 100</span>
                            </div>
                        </div>
                        
                        <div class="health-status-badge bg-light-success text-success">
                            <i class="fa-solid fa-heart-pulse"></i> 🟢 SAFE STATUS
                        </div>
                    </div>

                    <ul class="recommendations-list">
                        <li class="recommendation-item">
                            <i class="fa-solid fa-circle-info text-primary"></i>
                            <span><strong>Smart Advice:</strong> You've spent only 45% of your food budget. Keep it up!</span>
                        </li>
                        <li class="recommendation-item">
                            <i class="fa-solid fa-circle-check text-success"></i>
                            <span><strong>Goal tip:</strong> Saving an extra $50 this week puts you 4 days ahead of "Laptop" goal.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Budget Progress Panel -->
            <div class="card">
                <div class="card-header">
                    <h3>Budget Progress</h3>
                    <a href="budget.php" class="view-all-link">Manage Budgets</a>
                </div>
                <div class="card-body">
                    <div class="summary-progress-item">
                        <div class="progress-header">
                            <span class="progress-title">Food & Dining</span>
                            <span>$250.00 / $500.00</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar bg-primary" style="width: 50%"></div>
                        </div>
                    </div>

                    <div class="summary-progress-item">
                        <div class="progress-header">
                            <span class="progress-title">Transportation</span>
                            <span>$120.00 / $300.00</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar bg-warning" style="width: 40%"></div>
                        </div>
                    </div>

                    <div class="summary-progress-item">
                        <div class="progress-header">
                            <span class="progress-title">Entertainment</span>
                            <span>$180.00 / $200.00</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar bg-danger" style="width: 90%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Savings Goal Progress Card -->
            <div class="card">
                <div class="card-header">
                    <h3>Savings Goals Progress</h3>
                    <a href="savings.php" class="view-all-link">View All</a>
                </div>
                <div class="card-body" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="savings-summary-item">
                        <div class="savings-summary-icon">
                            <i class="fa-solid fa-laptop"></i>
                        </div>
                        <div class="savings-summary-info">
                            <span class="savings-summary-title">New Macbook Pro</span>
                            <span class="savings-summary-fraction">$1,200.00 saved of $1,500.00 target</span>
                            <div class="progress-bar-container" style="height: 6px; margin-top: 0.5rem;">
                                <div class="progress-bar bg-success" style="width: 80%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </div>
</main>

<!-- JS Scripts -->
<script src="assets/js/main.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/charts.js"></script>

<?php include 'includes/footer.php'; ?>
