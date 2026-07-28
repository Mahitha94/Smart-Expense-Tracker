<?php
/**
 * Smart Expense Tracker Pro - User Profile
 * College Mini Project - Module 1 (Architecture & Boilerplate)
 */

require_once 'includes/auth.php';

check_auth();

$page_title = "My Profile";
include 'includes/header.php';
include 'includes/sidebar.php';
?>

<main class="main-content" id="mainContent">
    <div class="content-header">
        <div>
            <h1>User Profile</h1>
            <p class="text-muted">Manage your personal credentials, contact info, and profile avatar.</p>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="card">
            <div class="card-header">
                <h3>Profile Information</h3>
            </div>
            <div class="card-body">
                <form action="profile.php" method="POST" enctype="multipart/form-data">
                    <div class="profile-avatar-section text-center mb-4">
                        <div class="avatar-container mb-2">
                            <img src="assets/images/default-avatar.png" alt="Avatar" class="profile-avatar-img" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">
                        </div>
                        <div class="avatar-upload">
                            <label for="avatar_file" class="btn btn-sm btn-outline">Change Avatar</label>
                            <input type="file" id="avatar_file" name="avatar" style="display: none;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="profile_name">Full Name</label>
                        <input type="text" class="form-control" id="profile_name" name="fullname" value="<?php echo htmlspecialchars($_SESSION['user_name'] ?? 'College Student'); ?>" required>
                    </div>

                    <div class="form-group">
                        <label for="profile_email">Email Address</label>
                        <input type="email" class="form-control" id="profile_email" name="email" value="<?php echo htmlspecialchars($_SESSION['user_email'] ?? 'student@college.edu'); ?>" required>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">Update Profile</button>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>Change Password</h3>
            </div>
            <div class="card-body">
                <form action="profile.php" method="POST">
                    <div class="form-group">
                        <label for="current_password">Current Password</label>
                        <input type="password" class="form-control" id="current_password" name="current_password" required>
                    </div>

                    <div class="form-group">
                        <label for="new_password">New Password</label>
                        <input type="password" class="form-control" id="new_password" name="new_password" required>
                    </div>

                    <div class="form-group">
                        <label for="confirm_new_password">Confirm New Password</label>
                        <input type="password" class="form-control" id="confirm_new_password" name="confirm_new_password" required>
                    </div>

                    <button type="submit" class="btn btn-danger btn-block">Change Password</button>
                </form>
            </div>
        </div>
    </div>
</main>

<script src="assets/js/main.js"></script>

<?php include 'includes/footer.php'; ?>
