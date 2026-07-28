/**
 * Smart Expense Tracker Pro - expense.js
 * Client-side validation, receipt upload check, and interactive category list filters
 */

document.addEventListener("DOMContentLoaded", function () {
    const expenseForm = document.querySelector("#addExpenseFormContainer form");
    
    if (expenseForm) {
        expenseForm.addEventListener("submit", function (e) {
            const amountInput = document.getElementById("amount");
            if (amountInput && parseFloat(amountInput.value) <= 0) {
                e.preventDefault();
                alert("Please enter a positive amount greater than 0.");
            }
        });
    }

    // Receipt file type validator
    const receiptInput = document.getElementById("receipt");
    if (receiptInput) {
        receiptInput.addEventListener("change", function () {
            const file = this.files[0];
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            
            if (file && !allowedTypes.includes(file.type)) {
                alert("Invalid file format. Please upload JPEG, PNG, or PDF file.");
                this.value = ""; // clear input
            }
        });
    }
});
