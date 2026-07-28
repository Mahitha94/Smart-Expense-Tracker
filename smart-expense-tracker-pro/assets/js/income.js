/**
 * Smart Expense Tracker Pro - income.js
 * Client-side validation for income streams recording
 */

document.addEventListener("DOMContentLoaded", function () {
    const incomeForm = document.querySelector("form[action='income.php']");
    
    if (incomeForm) {
        incomeForm.addEventListener("submit", function (e) {
            const amountInput = incomeForm.querySelector("#amount");
            if (amountInput && parseFloat(amountInput.value) <= 0) {
                e.preventDefault();
                alert("Please enter a positive income amount.");
            }
        });
    }
});
