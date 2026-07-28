<?php
/**
 * Smart Expense Tracker Pro - Lateral Sidebar Navigation
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

// Active state helper function for page highlighting
function is_active($page_name) {
    $current_file = basename($_SERVER['PHP_SELF']);
    return ($current_file === $page_name) ? "active" : "";
}
?>

<!-- Lateral Sidebar -->
<aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
        <i class="fa-solid fa-wallet text-primary"></i>
        <span>Smart Tracker</span>
    </div>
    
    <div class="sidebar-menu-wrapper">
        <ul class="sidebar-menu">
            <li class="<?php echo is_active('dashboard.php'); ?>">
                <a href="dashboard.php" class="sidebar-link">
                    <i class="fa-solid fa-house"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="<?php echo is_active('expenses.php'); ?>">
                <a href="expenses.php" class="sidebar-link">
                    <i class="fa-solid fa-receipt"></i>
                    <span>Expenses</span>
                </a>
            </li>
            <li class="<?php echo is_active('income.php'); ?>">
                <a href="income.php" class="sidebar-link">
                    <i class="fa-solid fa-wallet"></i>
                    <span>Income</span>
                </a>
            </li>
            <li class="<?php echo is_active('budget.php'); ?>">
                <a href="budget.php" class="sidebar-link">
                    <i class="fa-solid fa-sliders"></i>
                    <span>Budget Planner</span>
                </a>
            </li>
            <li class="<?php echo is_active('savings.php'); ?>">
                <a href="savings.php" class="sidebar-link">
                    <i class="fa-solid fa-bullseye"></i>
                    <span>Savings Goals</span>
                </a>
            </li>
            <li class="<?php echo is_active('reports.php'); ?>">
                <a href="reports.php" class="sidebar-link">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>Reports</span>
                </a>
            </li>
            <li class="notification-sidebar-item">
                <a href="#" class="sidebar-link" id="sidebarNotificationToggle">
                    <i class="fa-solid fa-bell"></i>
                    <span>Notifications</span>
                    <span class="badge bg-light-danger badge-pill">3</span>
                </a>
            </li>
        </ul>
    </div>

    <!-- Sidebar Footer segment -->
    <div class="sidebar-footer">
        <ul class="sidebar-menu">
            <li class="<?php echo is_active('profile.php'); ?>">
                <a href="profile.php" class="sidebar-link">
                    <i class="fa-solid fa-user"></i>
                    <span>Profile</span>
                </a>
            </li>
            <li class="<?php echo is_active('settings.php'); ?>">
                <a href="settings.php" class="sidebar-link">
                    <i class="fa-solid fa-gear"></i>
                    <span>Settings</span>
                </a>
            </li>
            <li>
                <a href="logout.php" class="sidebar-link text-danger">
                    <i class="fa-solid fa-right-from-bracket text-danger"></i>
                    <span class="text-danger">Logout</span>
                </a>
            </li>
        </ul>
    </div>
</aside>

<style>
/* CSS specific to sidebar inside layout with glassmorphic look */
.sidebar {
    position: fixed;
    top: var(--header-height);
    left: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: var(--card-bg);
    backdrop-filter: var(--card-backdrop);
    -webkit-backdrop-filter: var(--card-backdrop);
    border-right: 1px solid var(--light-border);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.5rem 1rem;
    z-index: 999;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem 1.5rem 1rem;
    border-bottom: 1px solid var(--light-border);
    margin-bottom: 1rem;
}

.sidebar-brand i {
    font-size: 1.25rem;
}

.sidebar-brand span {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--dark);
    letter-spacing: -0.025em;
}

.sidebar-menu-wrapper {
    flex: 1;
    overflow-y: auto;
}

.sidebar-menu {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0;
    margin: 0;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--dark-muted);
    transition: all 0.2s ease;
    position: relative;
}

.sidebar-link i {
    width: 20px;
    font-size: 1rem;
    text-align: center;
    color: var(--dark-muted);
    transition: color 0.2s ease;
}

.sidebar-link:hover {
    background-color: var(--primary-light);
    color: var(--primary);
}

.sidebar-link:hover i {
    color: var(--primary);
}

.sidebar-menu li.active .sidebar-link {
    background-color: var(--primary);
    color: var(--white);
    font-weight: 600;
}

.sidebar-menu li.active .sidebar-link i {
    color: var(--white);
}

.sidebar-footer {
    border-top: 1px solid var(--light-border);
    padding-top: 1rem;
    margin-top: 1rem;
}

.badge-pill {
    margin-left: auto;
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
}
</style>
