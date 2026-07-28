/**
 * Smart Expense Tracker Pro - charts.js
 * Theme-aware, interactive visualizations using Chart.js
 * Renders Category distribution, Income vs Expense, Monthly trend, and Savings progress
 */

let chartsInstances = {};

function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        primary: style.getPropertyValue('--primary').trim() || '#6366f1',
        success: style.getPropertyValue('--success').trim() || '#10b981',
        danger: style.getPropertyValue('--danger').trim() || '#ef4444',
        warning: style.getPropertyValue('--warning').trim() || '#f59e0b',
        darkMuted: style.getPropertyValue('--dark-muted').trim() || '#64748b',
        dark: style.getPropertyValue('--dark').trim() || '#0f172a',
        gridColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(148, 163, 184, 0.08)'
    };
}

// 1. Income vs Expense Bar Chart
function renderIncomeVsExpenseChart() {
    const canvas = document.getElementById('incomeVsExpenseChart');
    if (!canvas) return;

    if (chartsInstances['incomeVsExpenseChart']) {
        chartsInstances['incomeVsExpenseChart'].destroy();
    }

    const colors = getThemeColors();
    const ctx = canvas.getContext('2d');

    chartsInstances['incomeVsExpenseChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Income',
                    data: [4200, 4800, 5100, 5800, 6000, 6200],
                    backgroundColor: colors.success,
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Expenses',
                    data: [1100, 1500, 1200, 1800, 1400, 1350],
                    backgroundColor: colors.danger,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.darkMuted,
                        font: { family: 'Inter', weight: '600', size: 11 }
                    }
                },
                tooltip: {
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.darkMuted, font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: colors.gridColor },
                    ticks: { color: colors.darkMuted, font: { family: 'Inter' } }
                }
            }
        }
    });
}

// 2. Expense Category Pie Chart (Donut style)
function renderCategoryDistributionChart() {
    const canvas = document.getElementById('categoryDistributionChart');
    if (!canvas) return;

    if (chartsInstances['categoryDistributionChart']) {
        chartsInstances['categoryDistributionChart'].destroy();
    }

    const colors = getThemeColors();
    const ctx = canvas.getContext('2d');

    chartsInstances['categoryDistributionChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Food & Dining', 'Housing', 'Entertainment', 'Transport', 'Utilities'],
            datasets: [{
                data: [250, 850, 180, 120, 150],
                backgroundColor: [
                    colors.primary,
                    colors.warning,
                    colors.danger,
                    colors.success,
                    '#a855f7'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: colors.darkMuted,
                        font: { family: 'Inter', weight: '500', size: 11 },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    padding: 10,
                    cornerRadius: 8
                }
            }
        }
    });
}

// 3. Monthly Expense Trend Line Chart
function renderMonthlyExpenseChart() {
    const canvas = document.getElementById('monthlyExpenseChart');
    if (!canvas) return;

    if (chartsInstances['monthlyExpenseChart']) {
        chartsInstances['monthlyExpenseChart'].destroy();
    }

    const colors = getThemeColors();
    const ctx = canvas.getContext('2d');

    // Create a smooth gradient background for the line chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, colors.primary + '30'); // 30% opacity
    gradient.addColorStop(1, colors.primary + '00'); // 0% opacity

    chartsInstances['monthlyExpenseChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Spending',
                data: [1100, 1500, 1200, 1800, 1400, 1350],
                borderColor: colors.primary,
                borderWidth: 3,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointBackgroundColor: colors.primary,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.darkMuted, font: { family: 'Inter' } }
                },
                y: {
                    grid: { color: colors.gridColor },
                    ticks: { color: colors.darkMuted, font: { family: 'Inter' } }
                }
            }
        }
    });
}

// 4. Savings Progress Doughnut Chart
function renderSavingsProgressChart() {
    const canvas = document.getElementById('savingsProgressChart');
    if (!canvas) return;

    if (chartsInstances['savingsProgressChart']) {
        chartsInstances['savingsProgressChart'].destroy();
    }

    const colors = getThemeColors();
    const ctx = canvas.getContext('2d');

    chartsInstances['savingsProgressChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Saved', 'Remaining Target'],
            datasets: [{
                data: [1200, 300], // 80% saved, 20% remaining
                backgroundColor: [
                    colors.success,
                    colors.gridColor
                ],
                borderWidth: 0,
                hoverOffset: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += '$' + context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Core hook to render all charts
function renderAllCharts() {
    renderIncomeVsExpenseChart();
    renderCategoryDistributionChart();
    renderMonthlyExpenseChart();
    renderSavingsProgressChart();
}

document.addEventListener("DOMContentLoaded", function () {
    // Render charts on load
    renderAllCharts();
    
    // Animate radial health score ring if present
    const progressRing = document.querySelector('.health-score-circle-progress');
    if (progressRing) {
        setTimeout(() => {
            // Health score is 85/100, which is 85% of 440 circumference (dasharray)
            // Circumference of radius 70 is 2 * PI * r = 2 * 3.14159 * 70 = 439.8 (approx 440)
            // Offset for 85% progress: 440 - (440 * 0.85) = 66
            progressRing.style.strokeDashoffset = '66';
        }, 300);
    }
});
