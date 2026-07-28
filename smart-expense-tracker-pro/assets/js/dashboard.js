/**
 * Smart Expense Tracker Pro - dashboard.js
 * Dashboard card interaction, quick summaries calculation triggers
 */

document.addEventListener("DOMContentLoaded", function () {
    // Boilerplate helper for live card state
    console.log("Dashboard analytics loaded.");

    // Hook up dynamic greeting according to local user times
    const hours = new Date().getHours();
    const greetingText = document.querySelector(".content-header p .user-highlight");
    
    if (greetingText) {
        let greeting = "Good morning";
        if (hours >= 12 && hours < 17) {
            greeting = "Good afternoon";
        } else if (hours >= 17) {
            greeting = "Good evening";
        }
        console.log(`${greeting} dynamic greeted successfully.`);
    }
});
