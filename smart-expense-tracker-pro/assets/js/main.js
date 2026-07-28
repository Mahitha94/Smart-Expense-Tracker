/**
 * Smart Expense Tracker Pro - main.js
 * Core global interactions (sidebar navigation, notification triggers, theme toggle, modals)
 */

document.addEventListener("DOMContentLoaded", function () {
    // 1. Sidebar Toggle Button
    const toggleBtn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.querySelector(".main-wrapper");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            sidebar.classList.toggle("collapsed");
            if (mainContent) {
                mainContent.classList.toggle("expanded");
            }
        });
    }

    // 2. User Profile Dropdown Toggle
    const profileTrigger = document.getElementById("profileDropdownTrigger");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener("click", function (e) {
            e.stopPropagation();
            profileDropdown.classList.toggle("active");
            if (notificationDropdown) {
                notificationDropdown.classList.remove("active");
            }
        });
    }

    // 3. Notification Dropdown Toggle
    const notificationTrigger = document.getElementById("notificationTrigger");
    const notificationDropdown = document.getElementById("notificationDropdown");

    if (notificationTrigger && notificationDropdown) {
        notificationTrigger.addEventListener("click", function (e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle("active");
            if (profileDropdown) {
                profileDropdown.classList.remove("active");
            }
        });
    }

    // Close dropdowns when clicking elsewhere
    document.addEventListener("click", function (e) {
        if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileTrigger) {
            profileDropdown.classList.remove("active");
        }
        if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== notificationTrigger) {
            notificationDropdown.classList.remove("active");
        }
    });

    // 4. Dark/Light Theme Toggle
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const htmlElement = document.documentElement;

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem("tracker-theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function () {
            const currentTheme = htmlElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            
            htmlElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("tracker-theme", newTheme);
            updateThemeIcon(newTheme);

            // Re-render charts with new theme colors if active
            if (typeof renderAllCharts === 'function') {
                renderAllCharts();
            }
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector("i");
        if (icon) {
            if (theme === "dark") {
                icon.className = "fa-solid fa-sun";
                themeToggleBtn.setAttribute("title", "Switch to Light Mode");
            } else {
                icon.className = "fa-solid fa-moon";
                themeToggleBtn.setAttribute("title", "Toggle Dark Mode");
            }
        }
    }

    // 5. Modal close on backdrop click
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    });

    console.log("Smart Expense Tracker Pro: Main modules initialized successfully!");
});
