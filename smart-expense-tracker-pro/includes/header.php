<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . " - Smart Expense Tracker Pro" : "Smart Expense Tracker Pro"; ?></title>
    <!-- Font Awesome CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Core and specific component styles -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/components.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/responsive.css">
</head>
<body>
    <div class="app-container">
        <!-- Top Navigation Header -->
        <header class="top-navbar">
            <div class="nav-left">
                <button class="btn-sidebar-toggle" id="sidebarToggle">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <div class="brand-wrapper">
                    <div class="logo-box">
                        <i class="fa-solid fa-brain-circuit text-primary"></i>
                    </div>
                    <h3>Smart Expense Tracker <span class="logo-accent">Pro</span></h3>
                </div>
            </div>

            <!-- Search bar & actions -->
            <div class="nav-center">
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" placeholder="Search transactions, budgets or goals..." id="globalSearch">
                </div>
            </div>

            <div class="nav-right">
                <!-- Theme Toggle Button -->
                <button class="action-btn" id="themeToggleBtn" title="Toggle Dark/Light Mode">
                    <i class="fa-solid fa-moon"></i>
                </button>

                <!-- Notifications icon -->
                <div class="notification-wrapper" id="notificationTrigger">
                    <button class="action-btn">
                        <i class="fa-solid fa-bell"></i>
                        <span class="notification-badge">3</span>
                    </button>
                    <!-- Notifications Dropdown -->
                    <div class="notification-dropdown" id="notificationDropdown">
                        <div class="dropdown-header">
                            <h4>Notifications</h4>
                            <span class="mark-read">Mark all as read</span>
                        </div>
                        <div class="dropdown-body">
                            <div class="notification-item unread">
                                <div class="item-icon bg-light-danger"><i class="fa-solid fa-triangle-exclamation text-danger"></i></div>
                                <div class="item-content">
                                    <p><strong>Overbudget Warning!</strong> Food & Dining category is at 90% of limit.</p>
                                    <span class="time">2 mins ago</span>
                                </div>
                            </div>
                            <div class="notification-item unread">
                                <div class="item-icon bg-light-success"><i class="fa-solid fa-piggy-bank text-success"></i></div>
                                <div class="item-content">
                                    <p><strong>Goal Milestone!</strong> "New Laptop" goal has crossed 75% progress.</p>
                                    <span class="time">1 hour ago</span>
                                </div>
                            </div>
                            <div class="notification-item">
                                <div class="item-icon bg-light-primary"><i class="fa-solid fa-circle-info text-primary"></i></div>
                                <div class="item-content">
                                    <p><strong>Salary Credited!</strong> Standard monthly deposit cleared.</p>
                                    <span class="time">1 day ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- User profile dropdown trigger -->
                <div class="profile-trigger" id="profileDropdownTrigger">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="User Profile" class="avatar-img">
                    <div class="user-meta desktop-only">
                        <span class="username"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Alex Johnson'); ?></span>
                        <span class="user-role">Student Account</span>
                    </div>
                    <i class="fa-solid fa-chevron-down chevron-icon"></i>
                </div>

                <!-- Profile Dropdown Menu -->
                <div class="profile-dropdown" id="profileDropdown">
                    <div class="profile-dropdown-header">
                        <p class="name"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'Alex Johnson'); ?></p>
                        <p class="email"><?php echo htmlspecialchars($_SESSION['user_email'] ?? 'alex.johnson@college.edu'); ?></p>
                    </div>
                    <hr class="dropdown-divider">
                    <a href="profile.php"><i class="fa-solid fa-user dropdown-icon"></i> My Profile</a>
                    <a href="settings.php"><i class="fa-solid fa-gear dropdown-icon"></i> Settings</a>
                    <a href="reports.php"><i class="fa-solid fa-chart-column dropdown-icon"></i> Reports</a>
                    <hr class="dropdown-divider">
                    <a href="logout.php" class="text-danger"><i class="fa-solid fa-right-from-bracket dropdown-icon text-danger"></i> Logout</a>
                </div>
            </div>
        </header>
        
        <!-- Main page Wrapper containing content and sidebar -->
        <div class="main-wrapper">
