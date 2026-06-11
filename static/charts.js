// static/js/charts.js - Chart logic and interactive features

// Global chart instances
let categoryChart = null;
let trendChart = null;

// Global variables for data caching
let cachedSummaryData = null;
let cachedTrendsData = null;

// ==================== Currency Formatting ====================
function getCurrencySymbol() {
    try {
        const map = window.CURRENCY_MAP || {};
        const code = window.APP_CURRENCY_CODE || 'USD';
        return (map[code] && map[code].symbol) || '$';
    } catch (e) {
        return '$';
    }
}

function formatCurrency(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    const symbol = getCurrencySymbol();
    // Simple formatting: symbol followed by 2 decimals
    return `${symbol}${num.toFixed(2)}`;
}

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Charts.js initialized');
    
    // Initialize charts if we're on the dashboard
    if (document.getElementById('category-chart')) {
        initializeCharts();
    }
    
    // Setup event listeners for filters
    setupFilterListeners();
    
    // Setup modal close handlers
    setupModalHandlers();
});

// ==================== Chart Initialization ====================
function initializeCharts() {
    // Create empty charts initially
    const ctxCategory = document.getElementById('category-chart')?.getContext('2d');
    const ctxTrend = document.getElementById('trend-chart')?.getContext('2d');
    
    if (ctxCategory) {
        categoryChart = new Chart(ctxCategory, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#6366f1'],
                    borderWidth: 0
                }]
            },
            options: getCategoryChartOptions()
        });
    }
    
    if (ctxTrend) {
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Expenses',
                    data: new Array(12).fill(0),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: getTrendChartOptions()
        });
    }
}

// ==================== Chart Configuration ====================
function getCategoryChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#f3f4f6',
                    font: {
                        size: 12,
                        family: 'Inter'
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#9ca3af',
                borderColor: '#6366f1',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                    }
                }
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };
}

function getTrendChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#f3f4f6',
                    font: {
                        size: 12,
                        family: 'Inter'
                    },
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#9ca3af',
                borderColor: '#6366f1',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        return `Expenses: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(75, 85, 99, 0.3)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                },
                title: {
                    display: true,
                    text: `Amount (${getCurrencySymbol()})`,
                    color: '#9ca3af',
                    font: {
                        size: 12
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#9ca3af'
                },
                title: {
                    display: true,
                    text: 'Month',
                    color: '#9ca3af',
                    font: {
                        size: 12
                    }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        elements: {
            point: {
                radius: 4,
                hoverRadius: 6,
                backgroundColor: '#6366f1',
                borderColor: '#ffffff',
                borderWidth: 2
            },
            line: {
                borderWidth: 3
            }
        }
    };
}

// ==================== Update Functions ====================
async function updateCategoryChart(categoriesData) {
    if (!categoryChart) return;
    
    // If no data, show placeholder
    if (!categoriesData || categoriesData.length === 0) {
        categoryChart.data.labels = ['No Expenses'];
        categoryChart.data.datasets[0].data = [1];
        categoryChart.data.datasets[0].backgroundColor = ['#374151'];
        categoryChart.update();
        return;
    }
    
    // Extract labels and values
    const labels = categoriesData.map(cat => cat.category);
    const values = categoriesData.map(cat => cat.total);
    
    // Dynamic color palette based on number of categories
    const colors = generateColorPalette(categoriesData.length);
    
    // Update chart data
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = values;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.data.datasets[0].borderColor = colors.map(() => 'rgba(255, 255, 255, 0.1)');
    categoryChart.data.datasets[0].borderWidth = 2;
    
    // Smooth update
    categoryChart.update({
        duration: 800,
        easing: 'easeInOutQuart'
    });
    
    // Add animation for center text (optional)
    addCenterTextToDoughnut();
}

async function updateTrendChart(trendsData) {
    if (!trendChart) return;
    
    // Prepare monthly data
    const monthlyData = new Array(12).fill(0);
    trendsData.forEach(trend => {
        const monthIndex = parseInt(trend.month) - 1;
        monthlyData[monthIndex] = trend.total;
    });
    
    // Update chart data
    trendChart.data.datasets[0].data = monthlyData;
    
    // Calculate gradient for fill
    const ctx = trendChart.canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    trendChart.data.datasets[0].backgroundColor = gradient;
    
    // Smooth update
    trendChart.update({
        duration: 800,
        easing: 'easeInOutQuart'
    });
}

// ==================== Helper Functions ====================
function generateColorPalette(count) {
    const baseColors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f43f5e', // Rose
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#14b8a6', // Teal
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#6b7280', // Gray
        '#8b5cf6'  // Violet
    ];
    
    // If we need more colors than available, generate them
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // Generate additional colors
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 137) % 360; // Golden ratio approximation
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

function addCenterTextToDoughnut() {
    // Optional: Add custom text in center of doughnut chart
    const chartCanvas = document.getElementById('category-chart');
    if (!chartCanvas) return;
    
    // Get total from cached data
    if (cachedSummaryData && cachedSummaryData.total > 0) {
        const ctx = chartCanvas.getContext('2d');
        const centerX = chartCanvas.width / 2;
        const centerY = chartCanvas.height / 2;
        
        // This would require custom plugin or HTML overlay
        // For simplicity, we'll rely on the summary card instead
    }
}

// ==================== Filter Setup ====================
function setupFilterListeners() {
    // Month filter change
    const monthSelect = document.getElementById('month-select');
    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            refreshDashboard();
        });
    }
    
    // Year filter change
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            refreshDashboard();
            loadTrends(); // Reload trends when year changes
        });
    }
    
    // Category filter for expenses page
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            loadExpenses();
        });
    }
}

// ==================== Data Loading Functions ====================
async function refreshDashboard() {
    const month = document.getElementById('month-select')?.value;
    const year = document.getElementById('year-select')?.value;
    
    if (!month || !year) return;
    
    // Show loading state
    showLoadingState();
    
    try {
        await loadSummary(month, year);
        await loadRecentExpenses(month, year);
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showErrorToast('Failed to load dashboard data');
    } finally {
        hideLoadingState();
    }
}

async function loadSummary(month, year) {
    try {
        const response = await fetch(`/api/summary/${year}/${month}`);
        if (!response.ok) throw new Error('Failed to load summary');
        
        const data = await response.json();
        cachedSummaryData = data;
        
        // Update summary cards
        updateSummaryCards(data);
        
        // Update category chart
        await updateCategoryChart(data.categories);
        
        return data;
    } catch (error) {
        console.error('Error loading summary:', error);
        throw error;
    }
}

async function loadTrends() {
    const year = document.getElementById('year-select')?.value;
    if (!year) return;
    
    try {
        const response = await fetch(`/api/trends/${year}`);
        if (!response.ok) throw new Error('Failed to load trends');
        
        const trends = await response.json();
        cachedTrendsData = trends;
        
        // Update trend chart
        await updateTrendChart(trends);
        
        return trends;
    } catch (error) {
        console.error('Error loading trends:', error);
        showErrorToast('Failed to load spending trends');
    }
}

async function loadRecentExpenses(month, year, limit = 5) {
    try {
        const response = await fetch(`/api/expenses?month=${month}&year=${year}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to load expenses');
        
        const expenses = await response.json();
        displayRecentExpenses(expenses);
        
        return expenses;
    } catch (error) {
        console.error('Error loading recent expenses:', error);
        displayRecentExpenses([]);
    }
}

async function loadExpenses() {
    const month = document.getElementById('filter-month')?.value;
    const year = document.getElementById('filter-year')?.value;
    const category = document.getElementById('filter-category')?.value;
    
    if (!month || !year) return;
    
    try {
        let url = `/api/expenses?month=${month}&year=${year}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to load expenses');
        
        let expenses = await response.json();
        
        // Filter by category if selected
        if (category && category !== '') {
            expenses = expenses.filter(exp => exp.category === category);
        }
        
        displayExpensesTable(expenses);
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        showErrorToast('Failed to load expenses');
    }
}

// ==================== UI Update Functions ====================
function updateSummaryCards(data) {
    // Update total expenses
    const totalExpensesEl = document.getElementById('total-expenses');
    if (totalExpensesEl) {
        totalExpensesEl.textContent = formatCurrency(data.total);
        addNumberAnimation(totalExpensesEl);
    }
    
    // Update total transactions
    const totalTransactionsEl = document.getElementById('total-transactions');
    if (totalTransactionsEl && data.expense_count !== undefined) {
        totalTransactionsEl.textContent = data.expense_count;
        addNumberAnimation(totalTransactionsEl);
    }
    
    // Update average expense
    const averageExpenseEl = document.getElementById('average-expense');
    if (averageExpenseEl && data.expense_count > 0) {
        const average = data.total / data.expense_count;
        averageExpenseEl.textContent = formatCurrency(average);
        addNumberAnimation(averageExpenseEl);
    }
    
    // Update top category
    const topCategoryEl = document.getElementById('top-category');
    if (topCategoryEl && data.categories && data.categories.length > 0) {
        topCategoryEl.textContent = data.categories[0].category;
    } else if (topCategoryEl) {
        topCategoryEl.textContent = '-';
    }
}

function displayRecentExpenses(expenses) {
    const tbody = document.getElementById('recent-expenses-list');
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No expenses found for this period</td>
            </tr>
        `;
        return;
    }
    
    // Show only top 5 most recent
    const recentExpenses = expenses.slice(0, 5);
    
    tbody.innerHTML = recentExpenses.map(expense => `
        <tr>
            <td>${formatDate(expense.expense_date)}</td>
            <td><span class="category-badge">${escapeHtml(expense.category)}</span></td>
            <td>${escapeHtml(expense.description || '-')}</td>
            <td class="amount">${formatCurrency(parseFloat(expense.amount))}</td>
        </tr>
    `).join('');
    
    // Add fade-in animation to new rows
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s forwards`;
        row.style.opacity = '0';
    });
}

function displayExpensesTable(expenses) {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No expenses found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => `
        <tr data-expense-id="${expense.id}">
            <td>${formatDate(expense.expense_date)}</td>
            <td><span class="category-badge">${escapeHtml(expense.category)}</span></td>
            <td>${escapeHtml(expense.description || '-')}</td>
            <td class="amount">${formatCurrency(parseFloat(expense.amount))}</td>
            <td>
                <button onclick="editExpense(${expense.id})" class="action-btn edit-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteExpense(${expense.id})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== Expense CRUD Operations ====================
async function addExpense() {
    const amount = parseFloat(document.getElementById('expense-amount')?.value);
    const category = document.getElementById('expense-category')?.value;
    const description = document.getElementById('expense-description')?.value;
    const expenseDate = document.getElementById('expense-date')?.value;
    
    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
        showErrorToast('Please enter a valid amount');
        return;
    }
    
    if (!category) {
        showErrorToast('Please select a category');
        return;
    }
    
    if (!expenseDate) {
        showErrorToast('Please select a date');
        return;
    }
    
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                category: category,
                description: description || '',
                expense_date: expenseDate
            })
        });
        
        if (response.ok) {
            showSuccessToast('Expense added successfully!');
            closeModal();
            
            // Refresh data
            const month = document.getElementById('month-select')?.value;
            const year = document.getElementById('year-select')?.value;
            
            if (month && year) {
                await loadSummary(month, year);
                await loadRecentExpenses(month, year);
                await loadTrends();
            }
            
            // If on expenses page, refresh that too
            if (document.getElementById('expenses-table-body')) {
                await loadExpenses();
            }
        } else {
            const error = await response.json();
            showErrorToast(error.error || 'Failed to add expense');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showErrorToast('Failed to add expense');
    }
}

async function editExpense(expenseId) {
    try {
        const response = await fetch(`/api/expenses?month=1&year=2024`); // Get expense by ID
        // Note: You'll need to add a GET endpoint for single expense
        // For now, we'll show a modal to edit
        showEditModal(expenseId);
    } catch (error) {
        console.error('Error editing expense:', error);
        showErrorToast('Failed to load expense for editing');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccessToast('Expense deleted successfully!');
            
            // Refresh data
            const month = document.getElementById('filter-month')?.value || 
                         document.getElementById('month-select')?.value;
            const year = document.getElementById('filter-year')?.value || 
                        document.getElementById('year-select')?.value;
            
            if (month && year) {
                await loadExpenses();
                
                // If on dashboard, refresh dashboard too
                if (document.getElementById('recent-expenses-list')) {
                    await loadSummary(month, year);
                    await loadRecentExpenses(month, year);
                    await loadTrends();
                }
            }
        } else {
            showErrorToast('Failed to delete expense');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        showErrorToast('Failed to delete expense');
    }
}

// ==================== Modal Functions ====================
function showAddExpenseModal() {
    const modal = document.getElementById('expense-modal');
    if (!modal) return;
    
    document.getElementById('modal-title').textContent = 'Add New Expense';
    document.getElementById('expense-id').value = '';
    document.getElementById('expense-form').reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    
    modal.style.display = 'flex';
}

function showEditModal(expenseId) {
    // This would fetch expense data and populate the modal
    // For now, just show add modal
    showAddExpenseModal();
    document.getElementById('modal-title').textContent = 'Edit Expense';
    document.getElementById('expense-id').value = expenseId;
}

function closeModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupModalHandlers() {
    // Close modal when clicking outside
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }
}

// ==================== Toast Notifications ====================
function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showToast(message, type) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 10px;
    `;
    closeBtn.onclick = () => toast.remove();
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast && toast.remove) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// ==================== Loading States ====================
function showLoadingState() {
    // Add loading overlay or spinner
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 14, 26, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9998;
    `;
    loader.innerHTML = `
        <div class="spinner"></div>
    `;
    
    // Add spinner styles if not exists
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(99, 102, 241, 0.2);
                border-top-color: #6366f1;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(loader);
}

function hideLoadingState() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

// ==================== Utility Functions ====================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addNumberAnimation(element) {
    if (!element) return;
    element.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function setBudget() {
    const budgetInput = document.getElementById('budget-input');
    if (!budgetInput) return;
    
    const budget = parseFloat(budgetInput.value);
    if (isNaN(budget) || budget <= 0) {
        showErrorToast('Please enter a valid budget amount');
        return;
    }
    
    const month = document.getElementById('month-select')?.value;
    const year = document.getElementById('year-select')?.value;
    
    if (month && year) {
        const budgetKey = `budget_${year}_${month}`;
        localStorage.setItem(budgetKey, budget);
        
        // Update remaining budget display
        if (cachedSummaryData && cachedSummaryData.total) {
            const remaining = budget - cachedSummaryData.total;
            const budgetRemainingEl = document.getElementById('budget-remaining');
            if (budgetRemainingEl) {
                budgetRemainingEl.textContent = formatCurrency(remaining);
                if (remaining < 0) {
                    budgetRemainingEl.style.color = '#ef4444';
                } else if (remaining < budget * 0.2) {
                    budgetRemainingEl.style.color = '#f59e0b';
                } else {
                    budgetRemainingEl.style.color = '#10b981';
                }
            }
        }
        
        showSuccessToast(`Monthly budget of ${formatCurrency(budget)} set!`);
    }
}

// ==================== Export Functions (for global access) ====================
// Make functions globally available
window.refreshDashboard = refreshDashboard;
window.loadExpenses = loadExpenses;
window.addExpense = addExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.showAddExpenseModal = showAddExpenseModal;
window.closeModal = closeModal;
window.setBudget = setBudget;
window.loadTrends = loadTrends;

// ==================== Auto-refresh on page visibility ====================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible again, refresh data
        const month = document.getElementById('month-select')?.value;
        const year = document.getElementById('year-select')?.value;
        if (month && year && window.location.pathname.includes('dashboard')) {
            refreshDashboard();
        }
    }
});

console.log('✅ Charts.js fully loaded and ready!');