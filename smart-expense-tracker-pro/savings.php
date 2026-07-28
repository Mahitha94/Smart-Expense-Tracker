<?php
/**
 * Smart Expense Tracker Pro - Savings & Goals
 * College Mini Project - Module 2 (Complete Frontend UI)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "Savings Goals";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>Savings Goals</h1>
            <p class="text-muted">Create milestones for your dream purchases, emergency funds, or investments.</p>
        </div>
        <div class="header-actions">
            <button class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> Add New Goal
            </button>
        </div>
    </div>

    <!-- Savings Goals Grid Layout -->
    <div class="stats-grid mb-4">
        <!-- Goal 1 -->
        <div class="card goal-card">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                    <div>
                        <h4 class="font-weight-bold text-dark mb-1">New MacBook Pro</h4>
                        <p class="text-muted text-xs">Target date: Dec 2026</p>
                    </div>
                    <div class="goal-percentage text-primary font-weight-bold text-lg">75%</div>
                </div>
                <div class="progress-bar-container bg-light mb-3" style="height: 10px; border-radius: 5px;">
                    <div class="progress-bar bg-primary" style="width: 75%; height: 100%; border-radius: 5px;"></div>
                </div>
                <div class="d-flex justify-content-between text-xs text-muted">
                    <span>Saved: <strong>$1,500.00</strong></span>
                    <span>Target: <strong>$2,000.00</strong></span>
                </div>
            </div>
        </div>

        <!-- Goal 2 -->
        <div class="card goal-card">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                    <div>
                        <h4 class="font-weight-bold text-dark mb-1">Emergency Fund</h4>
                        <p class="text-muted text-xs">Target date: Ongoing</p>
                    </div>
                    <div class="goal-percentage text-success font-weight-bold text-lg">40%</div>
                </div>
                <div class="progress-bar-container bg-light mb-3" style="height: 10px; border-radius: 5px;">
                    <div class="progress-bar bg-success" style="width: 40%; height: 100%; border-radius: 5px;"></div>
                </div>
                <div class="d-flex justify-content-between text-xs text-muted">
                    <span>Saved: <strong>$2,000.00</strong></span>
                    <span>Target: <strong>$5,000.00</strong></span>
                </div>
            </div>
        </div>

        <!-- Goal 3 -->
        <div class="card goal-card">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                    <div>
                        <h4 class="font-weight-bold text-dark mb-1">Europe Summer Trip</h4>
                        <p class="text-muted text-xs">Target date: June 2027</p>
                    </div>
                    <div class="goal-percentage text-warning font-weight-bold text-lg">15%</div>
                </div>
                <div class="progress-bar-container bg-light mb-3" style="height: 10px; border-radius: 5px;">
                    <div class="progress-bar bg-warning" style="width: 15%; height: 100%; border-radius: 5px;"></div>
                </div>
                <div class="d-flex justify-content-between text-xs text-muted">
                    <span>Saved: <strong>$450.00</strong></span>
                    <span>Target: <strong>$3,000.00</strong></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Allocation Logs -->
    <div class="card">
        <div class="card-header">
            <h3>Recent Savings Contributions</h3>
        </div>
        <div class="card-body p-0">
            <table class="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Goal Name</th>
                        <th>Amount Deposited</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>June 28, 2026</td>
                        <td>New MacBook Pro</td>
                        <td class="text-success font-weight-bold">+$250.00</td>
                        <td>
                            <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        </td>
                    </tr>
                    <tr>
                        <td>June 15, 2026</td>
                        <td>Emergency Fund</td>
                        <td class="text-success font-weight-bold">+$500.00</td>
                        <td>
                            <button class="btn btn-icon btn-sm" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>

<?php include 'includes/footer.php'; ?>
