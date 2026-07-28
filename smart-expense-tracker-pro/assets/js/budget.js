/**
 * Smart Expense Tracker Pro - budget.js
 * Budget target calculations, overbudget alerts warning notifications
 */

document.addEventListener("DOMContentLoaded", function () {
    const budgetForm = document.querySelector("form[action='budget.php']");
    
    if (budgetForm) {
        budgetForm.addEventListener("submit", function (e) {
            const limitInput = document.getElementById("budget_amount");
            if (limitInput && parseInt(limitInput.value) <= 0) {
                e.preventDefault();
                alert("Monthly budget limit must be greater than 0.");
            }
        });
    }
});
