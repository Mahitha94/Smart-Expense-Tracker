import React, { useState, useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

// Define the transaction type
interface Transaction {
  id: string;
  date: string;
  time?: string;          // Expense Time
  category: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  status: "Completed" | "Pending";
  title?: string;         // Expense Title
  paymentMethod?: string; // Payment Method
  currency?: string;      // Currency
  receiptUrl?: string;    // Receipt Upload URL/Filename
}

// Define the budget type
interface Budget {
  category: string;
  limit: number;
  spent: number;
}

// Define the savings goal type
interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
}

// Define the notification type
interface AppNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  type: "info" | "success" | "warning";
}

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("tracker_logged_in") === "true";
  });
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Auto-dismiss floating toast notification after 4 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Registration States
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regCurrency, setRegCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">("INR");

  // Client-Side Secure Password Hash Generator (SHA-256)
  const hashPassword = async (password: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Fallback secure hashing simulation if SubtleCrypto is unavailable in some contexts
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return "hash_" + Math.abs(hash);
    }
  };

  // Seed default registered users
  useEffect(() => {
    const seedUsers = async () => {
      const savedUsers = localStorage.getItem("tracker_users");
      if (!savedUsers) {
        // Pre-hash default user credentials
        const passwordHash = await hashPassword("password123");
        const defaultUsers = [
          {
            name: "Mahitha",
            username: "mahitha",
            email: "mahitha@finance.pro",
            phone: "+91 98765 43210",
            passwordHash: passwordHash,
            currency: "INR"
          }
        ];
        localStorage.setItem("tracker_users", JSON.stringify(defaultUsers));
      }
    };
    seedUsers();
  }, []);

  // App Core States
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("tracker-theme");
    return (saved as "dark" | "light") || "dark";
  });
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "expense" | "income">("all");

  // Budget Wizard States
  const [isWizardDone, setIsWizardDone] = useState<boolean>(true);
  const [wizardMonthlyIncome, setWizardMonthlyIncome] = useState<string>("");
  const [wizardCurrency, setWizardCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">("INR");
  const [wizardBudgets, setWizardBudgets] = useState({
    savings: 0,
    food: 0,
    transport: 0,
    shopping: 0,
    bills: 0,
    entertainment: 0,
    healthcare: 0,
    education: 0,
    emergency: 0,
    others: 0
  });

  // Automatically update recommended budgets when wizard income changes
  useEffect(() => {
    const income = parseFloat(wizardMonthlyIncome) || 0;
    setWizardBudgets({
      savings: Math.round(income * 0.20),
      food: Math.round(income * 0.15),
      transport: Math.round(income * 0.10),
      shopping: Math.round(income * 0.10),
      bills: Math.round(income * 0.20),
      entertainment: Math.round(income * 0.05),
      healthcare: Math.round(income * 0.05),
      education: Math.round(income * 0.05),
      emergency: Math.round(income * 0.05),
      others: Math.round(income * 0.05)
    });
  }, [wizardMonthlyIncome]);

  // Handle Wizard Save
  const handleSaveWizardBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeNum = parseFloat(wizardMonthlyIncome);
    if (isNaN(incomeNum) || incomeNum <= 0) {
      alert("Please enter a valid monthly income greater than 0!");
      return;
    }

    const totalAllocated = (Object.values(wizardBudgets) as number[]).reduce((sum, v) => sum + v, 0);
    if (totalAllocated > incomeNum) {
      alert(`Cannot save budget! The total allocated budget (${getCurrencySymbol(wizardCurrency)}${totalAllocated.toLocaleString()}) exceeds your given monthly income of ${getCurrencySymbol(wizardCurrency)}${incomeNum.toLocaleString()}. Please adjust your category limits so the total stays within your given income.`);
      return;
    }

    // 1. Build and save budgets state
    const newBudgetsList: Budget[] = [
      { category: "Savings", limit: wizardBudgets.savings, spent: 0 },
      { category: "Food", limit: wizardBudgets.food, spent: 0 },
      { category: "Transport", limit: wizardBudgets.transport, spent: 0 },
      { category: "Shopping", limit: wizardBudgets.shopping, spent: 0 },
      { category: "Bills", limit: wizardBudgets.bills, spent: 0 },
      { category: "Entertainment", limit: wizardBudgets.entertainment, spent: 0 },
      { category: "Healthcare", limit: wizardBudgets.healthcare, spent: 0 },
      { category: "Education", limit: wizardBudgets.education, spent: 0 },
      { category: "Emergency Fund", limit: wizardBudgets.emergency, spent: 0 },
      { category: "Others", limit: wizardBudgets.others, spent: 0 }
    ];
    setBudgets(newBudgetsList);
    localStorage.setItem("tracker_budgets", JSON.stringify(newBudgetsList));

    // 2. Set global currency
    setGlobalCurrency(wizardCurrency);
    localStorage.setItem("tracker-currency", wizardCurrency);

    // 3. Create an initial Salary transaction for their Monthly Income
    const initialIncome: Transaction = {
      id: "t_init_" + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      category: "Salary",
      title: "Initial Monthly Budget Income",
      description: "Allocated Monthly Income from first-time setup",
      amount: incomeNum,
      type: "income",
      status: "Completed",
      paymentMethod: "Bank Transfer",
      currency: wizardCurrency
    };
    setTransactions(prev => [initialIncome, ...prev]);

    // 4. Mark wizard as complete in localStorage and local state
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_budget_wizard_done_${email}`, "true");
    setIsWizardDone(true);

    // 5. Add a success toast
    const wizardNotify: AppNotification = {
      id: "not_wiz_" + Date.now(),
      text: `Smart Budget initialized successfully with Monthly Income of ${getCurrencySymbol(wizardCurrency)}${incomeNum.toLocaleString()}!`,
      time: "Just now",
      unread: true,
      type: "success"
    };
    setNotifications(prev => [wizardNotify, ...prev]);
  };

  const handleSaveFirstIncomeAndBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setFirstIncomeError(null);
    const incomeNum = parseFloat(firstIncomeAmount);
    if (isNaN(incomeNum) || incomeNum <= 0) {
      setFirstIncomeError("Please enter a valid monthly income greater than 0!");
      return;
    }

    const totalAllocated = (Object.values(firstBudgets) as number[]).reduce((sum, v) => sum + v, 0);
    if (totalAllocated > incomeNum) {
      setFirstIncomeError(`Cannot save budget! Total allocated budget (${getCurrencySymbol(firstIncomeCurrency)}${totalAllocated.toLocaleString()}) exceeds your given monthly income of ${getCurrencySymbol(firstIncomeCurrency)}${incomeNum.toLocaleString()} by ${getCurrencySymbol(firstIncomeCurrency)}${(totalAllocated - incomeNum).toLocaleString()}. Please adjust your category limits.`);
      return;
    }

    // 1. Build and save budgets state
    const newBudgetsList: Budget[] = [
      { category: "Savings", limit: firstBudgets.savings, spent: 0 },
      { category: "Food", limit: firstBudgets.food, spent: 0 },
      { category: "Transport", limit: firstBudgets.transport, spent: 0 },
      { category: "Shopping", limit: firstBudgets.shopping, spent: 0 },
      { category: "Bills & Utilities", limit: firstBudgets.bills, spent: 0 },
      { category: "Entertainment", limit: firstBudgets.entertainment, spent: 0 },
      { category: "Healthcare", limit: firstBudgets.healthcare, spent: 0 },
      { category: "Education", limit: firstBudgets.education, spent: 0 },
      { category: "Emergency Fund", limit: firstBudgets.emergency, spent: 0 },
      { category: "Others", limit: firstBudgets.others, spent: 0 }
    ];
    setBudgets(newBudgetsList);

    // 2. Set global currency
    setGlobalCurrency(firstIncomeCurrency);

    // 3. Create an initial Salary transaction for their Monthly Income
    const initialIncome: Transaction = {
      id: "t_init_" + Date.now(),
      date: firstIncomeDate,
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      category: "Salary",
      title: "Initial Monthly Budget Income",
      description: "Allocated Monthly Income from first-time setup",
      amount: incomeNum,
      type: "income",
      status: "Completed",
      paymentMethod: "Bank Transfer",
      currency: firstIncomeCurrency
    };
    setTransactions(prev => [initialIncome, ...prev]);

    // 4. Mark wizard as complete
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_budget_wizard_done_${email}`, "true");
    setIsWizardDone(true);
    setIsAddFirstIncomeModalOpen(false);

    // 5. Add a success notification
    const wizardNotifyFirst: AppNotification = {
      id: "not_wiz_" + Date.now(),
      text: `Smart Budget initialized successfully with Monthly Income of ${getCurrencySymbol(firstIncomeCurrency)}${incomeNum.toLocaleString()}!`,
      time: "Just now",
      unread: true,
      type: "success"
    };
    setNotifications(prev => [wizardNotifyFirst, ...prev]);
  };

  // Modals States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Custom Modals and Views for Module 3 (Expense Management)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Transaction | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Custom Modals and States for Module 5 (First Login & Budget Planner)
  const [isAddFirstIncomeModalOpen, setIsAddFirstIncomeModalOpen] = useState(false);
  const [firstIncomeStep, setFirstIncomeStep] = useState<1 | 2>(1); // Step 1: Income details, Step 2: Editable Budget cards
  const [firstIncomeError, setFirstIncomeError] = useState<string | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [firstIncomeAmount, setFirstIncomeAmount] = useState("");
  const [firstIncomeDate, setFirstIncomeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [firstIncomeCurrency, setFirstIncomeCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">("INR");
  const [firstBudgets, setFirstBudgets] = useState({
    savings: 0,
    food: 0,
    transport: 0,
    shopping: 0,
    bills: 0,
    entertainment: 0,
    healthcare: 0,
    education: 0,
    emergency: 0,
    others: 0
  });

  // Global Currency State
  const [globalCurrency, setGlobalCurrency] = useState<"INR" | "USD" | "EUR" | "GBP">(() => {
    const saved = localStorage.getItem("tracker-currency");
    return (saved as "INR" | "USD" | "EUR" | "GBP") || "INR";
  });

  const getCurrencySymbol = (currencyCode: string) => {
    switch (currencyCode) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "INR":
      default: return "₹";
    }
  };

  const currencySymbol = getCurrencySymbol(globalCurrency);

  // Form Fields State for Expenses
  const [expenseForm, setExpenseForm] = useState({
    id: "",
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    paymentMethod: "Cash",
    description: "",
    currency: "INR",
    receiptUrl: "",
    receiptName: "",
    status: "Completed" as "Completed" | "Pending"
  });

  const resetExpenseForm = () => {
    setExpenseForm({
      id: "",
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      paymentMethod: "Cash",
      description: "",
      currency: globalCurrency,
      receiptUrl: "",
      receiptName: "",
      status: "Completed"
    });
  };

  // Form Fields State for Income
  const [incomeForm, setIncomeForm] = useState({
    id: "",
    category: "Salary",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    currency: "INR",
    status: "Completed" as "Completed" | "Pending"
  });

  const resetIncomeForm = () => {
    setIncomeForm({
      id: "",
      category: "Salary",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      currency: globalCurrency,
      status: "Completed"
    });
  };

  // Module 3 Expenses Filters State
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseMonthFilter, setExpenseMonthFilter] = useState("all");
  const [expenseStartDate, setExpenseStartDate] = useState("");
  const [expenseEndDate, setExpenseEndDate] = useState("");
  const [expenseMaxAmount, setExpenseMaxAmount] = useState("");
  const [expenseSortBy, setExpenseSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Module 3 Income Filters State
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState("all");
  const [incomeMonthFilter, setIncomeMonthFilter] = useState("all");
  const [incomeStartDate, setIncomeStartDate] = useState("");
  const [incomeEndDate, setIncomeEndDate] = useState("");
  const [incomeMaxAmount, setIncomeMaxAmount] = useState("");
  const [incomeSortBy, setIncomeSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Form Fields State for other items
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "Food & Dining", date: new Date().toISOString().split('T')[0], status: "Completed" as "Completed" | "Pending" });
  const [newIncome, setNewIncome] = useState({ description: "", amount: "", category: "Salary", date: new Date().toISOString().split('T')[0], status: "Completed" as "Completed" | "Pending" });
  const [newBudget, setNewBudget] = useState({ category: "Food & Dining", limit: "" });
  const [newGoal, setNewGoal] = useState({ name: "", target: "", saved: "", icon: "fa-laptop" });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: "1", text: "Welcome to Smart Expense Tracker Pro! Your profile is configured.", time: "2m ago", unread: true, type: "success" },
    { id: "2", text: "Budget warning: Entertainment spent is at 90% of limit.", time: "2h ago", unread: true, type: "warning" },
    { id: "3", text: "Goal reached! You completed 'New MacBook Pro' target.", time: "1d ago", unread: false, type: "success" }
  ]);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Get currently active email during initial render
  const initialEmail = (() => {
    const savedProfile = localStorage.getItem("tracker_profile");
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile).email || "mahitha@finance.pro";
      } catch (e) {
        return "mahitha@finance.pro";
      }
    }
    return "mahitha@finance.pro";
  })();

  // Initial Sample Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const email = initialEmail;
    const saved = localStorage.getItem(`tracker_transactions_${email}`);
    if (saved) return JSON.parse(saved);
    if (email === "mahitha@finance.pro") {
      return [
        { id: "t1", date: "2026-07-01", time: "08:30", category: "Food", title: "Starbucks Breakfast", description: "Morning coffee & croissant with team", amount: 1200.00, type: "expense", status: "Completed", paymentMethod: "UPI", currency: "INR" },
        { id: "t2", date: "2026-06-30", time: "11:00", category: "Freelancing", title: "Freelance UI Work", description: "Freelance UI Designing Payment", amount: 85000.00, type: "income", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
        { id: "t3", date: "2026-06-29", time: "10:00", category: "Rent", title: "Apartment Rent", description: "July Apartment Rental Payment", amount: 25000.00, type: "expense", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
        { id: "t4", date: "2026-06-28", time: "13:00", category: "Food", title: "Subway Deluxe Lunch", description: "Subway Deluxe Lunch with colleagues", amount: 1500.00, type: "expense", status: "Completed", paymentMethod: "Cash", currency: "INR" },
        { id: "t5", date: "2026-06-27", time: "09:00", category: "Salary", title: "Corporate Salary", description: "Monthly Corporate Salary Paycheck", amount: 250000.00, type: "income", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
        { id: "t6", date: "2026-06-25", time: "20:00", category: "Entertainment", title: "Netflix Premium", description: "Netflix Premium Annual Renewal", amount: 8000.00, type: "expense", status: "Completed", paymentMethod: "Credit Card", currency: "INR" },
        { id: "t7", date: "2026-06-24", time: "17:15", category: "Fuel", title: "Chevron Gas Refill", description: "Chevron Gas Station Refill", amount: 5000.00, type: "expense", status: "Completed", paymentMethod: "Credit Card", currency: "INR" },
        { id: "t8", date: "2026-06-22", time: "15:30", category: "Utilities", title: "Fiber Internet Bill", description: "High-Speed Fiber Optic Internet", amount: 2500.00, type: "expense", status: "Completed", paymentMethod: "Debit Card", currency: "INR" },
        { id: "t9", date: "2026-06-21", time: "14:00", category: "Shopping", title: "Target Groceries", description: "Weekly home groceries", amount: 6500.00, type: "expense", status: "Completed", paymentMethod: "Wallet", currency: "INR" },
        { id: "t10", date: "2026-06-18", time: "11:15", category: "Travel", title: "Uber Commute", description: "Uber ride to client office", amount: 1800.00, type: "expense", status: "Completed", paymentMethod: "UPI", currency: "INR" }
      ];
    }
    return [];
  });

  // Initial Sample Budgets
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const email = initialEmail;
    const saved = localStorage.getItem(`tracker_budgets_${email}`);
    if (saved) return JSON.parse(saved);
    if (email === "mahitha@finance.pro") {
      return [
        { category: "Food", limit: 15000, spent: 2700 },
        { category: "Travel", limit: 10000, spent: 1800 },
        { category: "Entertainment", limit: 12000, spent: 8000 },
        { category: "Rent", limit: 30000, spent: 25000 },
        { category: "Utilities", limit: 8000, spent: 2500 },
        { category: "Fuel", limit: 8000, spent: 5000 },
        { category: "Shopping", limit: 15000, spent: 6500 }
      ];
    }
    return [];
  });

  // Initial Savings Goals
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const email = initialEmail;
    const saved = localStorage.getItem(`tracker_savings_goals_${email}`);
    if (saved) return JSON.parse(saved);
    if (email === "mahitha@finance.pro") {
      return [
        { id: "g1", name: "New Macbook Pro", target: 150000, saved: 120000, icon: "fa-laptop" },
        { id: "g2", name: "Emergency Fund", target: 500000, saved: 320000, icon: "fa-shield-halved" },
        { id: "g3", name: "Japan Summer Trip", target: 400000, saved: 180000, icon: "fa-plane" }
      ];
    }
    return [];
  });

  // User Profile Info
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("tracker_profile");
    if (saved) return JSON.parse(saved);
    return {
      name: "Mahitha",
      email: "mahitha@finance.pro",
      role: "Premium Financial Executive",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
    };
  });

  useEffect(() => {
    localStorage.setItem("tracker_profile", JSON.stringify(profile));
  }, [profile]);

  // Automatically update recommended budgets in our new first-income modal
  useEffect(() => {
    const income = parseFloat(firstIncomeAmount) || 0;
    setFirstBudgets({
      savings: Math.round(income * 0.20),
      food: Math.round(income * 0.15),
      transport: Math.round(income * 0.10),
      shopping: Math.round(income * 0.10),
      bills: Math.round(income * 0.20),
      entertainment: Math.round(income * 0.05),
      healthcare: Math.round(income * 0.05),
      education: Math.round(income * 0.05),
      emergency: Math.round(income * 0.05),
      others: Math.round(income * 0.05)
    });
  }, [firstIncomeAmount]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("tracker_logged_in", isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_transactions_${email}`, JSON.stringify(transactions));
    localStorage.setItem("tracker_transactions", JSON.stringify(transactions));
  }, [transactions, profile.email]);

  useEffect(() => {
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_budgets_${email}`, JSON.stringify(budgets));
    localStorage.setItem("tracker_budgets", JSON.stringify(budgets));
  }, [budgets, profile.email]);

  useEffect(() => {
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_savings_goals_${email}`, JSON.stringify(savingsGoals));
    localStorage.setItem("tracker_savings_goals", JSON.stringify(savingsGoals));
  }, [savingsGoals, profile.email]);

  useEffect(() => {
    const email = profile.email || "mahitha@finance.pro";
    localStorage.setItem(`tracker_currency_${email}`, globalCurrency);
    localStorage.setItem("tracker-currency", globalCurrency);
  }, [globalCurrency, profile.email]);

  useEffect(() => {
    localStorage.setItem("tracker-theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Recalculate Budget Spent values whenever transactions change
  useEffect(() => {
    const isCategoryMatch = (budgetCat: string, transCat: string): boolean => {
      const b = budgetCat.toLowerCase().trim();
      const t = transCat.toLowerCase().trim();
      if (b === t) return true;
      if (b === "bills & utilities") {
        return t === "bills" || t === "utilities" || t === "rent" || t === "insurance" || t === "bills & utilities";
      }
      if (b === "food") {
        return t === "food" || t === "food & dining";
      }
      if (b === "transport") {
        return t === "transport" || t === "transportation" || t === "fuel" || t === "travel";
      }
      if (b === "savings") {
        return t === "savings" || t === "investment";
      }
      if (b === "emergency fund") {
        return t === "emergency" || t === "emergency fund";
      }
      return false;
    };

    setBudgets(prevBudgets => {
      return prevBudgets.map(b => {
        const spentForCat = transactions
          .filter(t => t.type === "expense")
          .filter(t => {
            if (isCategoryMatch(b.category, t.category)) return true;
            if (b.category.toLowerCase() === "others") {
              const matchesAnyOther = prevBudgets.some(otherB => {
                if (otherB.category.toLowerCase() === "others") return false;
                return isCategoryMatch(otherB.category, t.category);
              });
              return !matchesAnyOther;
            }
            return false;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...b, spent: parseFloat(spentForCat.toFixed(2)) };
      });
    });
  }, [transactions]);

  // Calculations for KPI Cards
  const totalIncome = parseFloat(transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0).toFixed(2));
  const totalExpenses = parseFloat(transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0).toFixed(2));
  const totalBalance = parseFloat((totalIncome - totalExpenses).toFixed(2));
  const totalSavings = parseFloat(savingsGoals.reduce((sum, g) => sum + g.saved, 0).toFixed(2));
  
  // Total Limit of Budgets & Total spent of those budgets
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = parseFloat((totalBudgetLimit - totalBudgetSpent).toFixed(2));

  // Module 3: Detailed Expenses KPI Calculations
  const expenseTransactionsList = transactions.filter(t => t.type === "expense");
  
  const totalMonthlyExpenses = parseFloat(
    expenseTransactionsList
      .filter(t => t.date.startsWith("2026-07"))
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2)
  );

  const todaysExpenses = parseFloat(
    expenseTransactionsList
      .filter(t => t.date === "2026-07-01")
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2)
  );

  const categorySums: Record<string, number> = {};
  expenseTransactionsList.forEach(t => {
    categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;
  });
  let highestExpenseCategory = "N/A";
  let highestExpenseCatAmount = 0;
  Object.entries(categorySums).forEach(([cat, sum]) => {
    if (sum > highestExpenseCatAmount) {
      highestExpenseCatAmount = sum;
      highestExpenseCategory = cat;
    }
  });

  const averageDailyExpense = parseFloat((totalMonthlyExpenses / 30).toFixed(2));

  // Dynamic Financial Health Score Calculator (Based on saving ratio, budget thresholds, and debt index)
  const expenseToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 0;
  let computedHealthScore = 100;
  if (totalIncome === 0) {
    computedHealthScore = 0;
  } else {
    if (expenseToIncomeRatio > 0.8) computedHealthScore -= 30;
    else if (expenseToIncomeRatio > 0.5) computedHealthScore -= 15;
    else if (expenseToIncomeRatio > 0.2) computedHealthScore -= 5;

    const overBudgetCounts = budgets.filter(b => b.spent > b.limit).length;
    computedHealthScore -= overBudgetCounts * 10;
    computedHealthScore = Math.max(10, Math.min(100, computedHealthScore));
  }

  const healthStatus = totalIncome === 0 ? "NOT_AVAILABLE" : (computedHealthScore >= 80 ? "SAFE" : computedHealthScore >= 50 ? "WARNING" : "CRITICAL");

  // Improved Financial Health indicators
  const budgetUsagePercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;
  const savingsRatePercent = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome).toFixed(2) : "0.00";

  let healthReason = "";
  if (totalIncome === 0) {
    healthReason = "Your financial health report will appear dynamically once you set up your income and track expenses.";
  } else if (computedHealthScore >= 80) {
    healthReason = "Your expenses are well within limits, and your savings rate is healthy.";
  } else if (computedHealthScore >= 50) {
    healthReason = "High spend ratio or category limit breached. Monitor subscription & entertainment costs.";
  } else {
    healthReason = "Emergency condition! Expenses exceed income or multiple category budgets are blown.";
  }

  let healthRecommendation = "";
  if (totalIncome === 0) {
    healthRecommendation = "Begin by adding your monthly income in the Welcome card above to generate your customized smart budget.";
  } else if (computedHealthScore >= 80) {
    healthRecommendation = "Excellent financial discipline. Continue saving regularly.";
  } else if (computedHealthScore >= 50) {
    healthRecommendation = "Reduce non-essential shopping to rebuild your cash buffer.";
  } else {
    healthRecommendation = "Freeze discretionary spending and review all active budget thresholds.";
  }

  // Dynamic Recommendations based on computed health
  const getRecommendations = () => {
    const list = [];
    if (expenseToIncomeRatio < 0.4) {
      list.push("Budget is highly healthy and optimal.");
    } else if (expenseToIncomeRatio > 0.7) {
      list.push("High expense ratio detected! Review subscription renewals.");
    }
    
    const foodBudget = budgets.find(b => b.category === "Food & Dining");
    if (foodBudget && foodBudget.spent < foodBudget.limit * 0.8) {
      list.push("Food spending is beautifully balanced.");
    } else {
      list.push("Food spending is approaching limit. Limit dine-outs.");
    }

    const entertainmentBudget = budgets.find(b => b.category === "Entertainment");
    if (entertainmentBudget && entertainmentBudget.spent > entertainmentBudget.limit * 0.9) {
      list.push("Shopping & entertainment increased slightly this month.");
    } else {
      list.push("Entertainment spending remains well within green thresholds.");
    }
    return list;
  };

  // References to Chart Canvas
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);

  // References to active Chart.js instances to avoid duplication
  const chartInstances = useRef<{
    bar: Chart | null;
    pie: Chart | null;
    line: Chart | null;
    doughnut: Chart | null;
  }>({ bar: null, pie: null, line: null, doughnut: null });

  // Redraw charts whenever transactions/budget/theme/activeTab changes
  useEffect(() => {
    if (!isLoggedIn || (activeTab !== "dashboard" && activeTab !== "reports")) return;

    const currencySymbol = getCurrencySymbol(globalCurrency);

    const colors = {
      primary: "#6366f1",
      success: "#10b981",
      danger: "#ef4444",
      warning: "#f59e0b",
      info: "#06b6d4",
      purple: "#a855f7",
      muted: theme === "dark" ? "#94a3b8" : "#64748b",
      grid: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(148, 163, 184, 0.08)",
      text: theme === "dark" ? "#f1f5f9" : "#0f172a"
    };

    // 1. Income vs Expense Bar Chart (Monthly split)
    if (barChartRef.current) {
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      const ctx = barChartRef.current.getContext("2d");
      if (ctx) {
        chartInstances.current.bar = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            datasets: [
              {
                label: `Income (${currencySymbol})`,
                data: [4200, 4800, 5100, 5800, 6000, 6200, totalIncome],
                backgroundColor: colors.success,
                borderRadius: 6,
                borderSkipped: false
              },
              {
                label: `Expenses (${currencySymbol})`,
                data: [1100, 1500, 1200, 1800, 1400, 1350, totalExpenses],
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
                position: "top",
                labels: { color: colors.muted, font: { family: "Inter", weight: 500 } }
              },
              tooltip: { padding: 10, cornerRadius: 8 }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: colors.muted, font: { family: "Inter" } }
              },
              y: {
                grid: { color: colors.grid },
                ticks: { color: colors.muted, font: { family: "Inter" } }
              }
            }
          }
        });
      }
    }

    // 2. Expense Category Pie Chart (Doughnut style)
    if (pieChartRef.current) {
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      const ctx = pieChartRef.current.getContext("2d");
      if (ctx) {
        const catMap: Record<string, number> = {};
        transactions.filter(t => t.type === "expense").forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(catMap);
        const data = Object.values(catMap);

        chartInstances.current.pie = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: labels.length > 0 ? labels : ["No Expenses"],
            datasets: [{
              data: data.length > 0 ? data : [1],
              backgroundColor: [
                colors.primary,
                colors.warning,
                colors.danger,
                colors.success,
                colors.info,
                colors.purple,
                "#ec4899"
              ],
              borderWidth: 0,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
              legend: {
                position: "right",
                labels: { color: colors.muted, font: { family: "Inter", size: 11, weight: 500 }, boxWidth: 10 }
              },
              tooltip: { padding: 10, cornerRadius: 8 }
            }
          }
        });
      }
    }

    // 3. Monthly Expense Trend Line Chart
    if (lineChartRef.current) {
      if (chartInstances.current.line) chartInstances.current.line.destroy();
      const ctx = lineChartRef.current.getContext("2d");
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, colors.primary + "40");
        gradient.addColorStop(1, colors.primary + "00");

        chartInstances.current.line = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            datasets: [{
              label: `Spending Trend (${currencySymbol})`,
              data: [1100, 1500, 1200, 1800, 1400, 1350, totalExpenses],
              borderColor: colors.primary,
              borderWidth: 3,
              fill: true,
              backgroundColor: gradient,
              tension: 0.4,
              pointBackgroundColor: colors.primary,
              pointHoverRadius: 6,
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { padding: 10, cornerRadius: 8 }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: colors.muted, font: { family: "Inter" } }
              },
              y: {
                grid: { color: colors.grid },
                ticks: { color: colors.muted, font: { family: "Inter" } }
              }
            }
          }
        });
      }
    }

    // 4. Savings Goal Doughnut Chart
    if (doughnutChartRef.current) {
      if (chartInstances.current.doughnut) chartInstances.current.doughnut.destroy();
      const ctx = doughnutChartRef.current.getContext("2d");
      if (ctx) {
        const totalSavedGoals = savingsGoals.reduce((sum, g) => sum + g.saved, 0);
        const totalTargetGoals = savingsGoals.reduce((sum, g) => sum + g.target, 0);
        const remainingGoalAmount = Math.max(0, totalTargetGoals - totalSavedGoals);

        chartInstances.current.doughnut = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Total Saved", "Remaining Goal Target"],
            datasets: [{
              data: [totalSavedGoals, remainingGoalAmount],
              backgroundColor: [colors.success, theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(148, 163, 184, 0.2)"],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "80%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return ` ${context.label}: ${currencySymbol}${context.raw}`;
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      // Cleanup all charts on component unmount
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      if (chartInstances.current.line) chartInstances.current.line.destroy();
      if (chartInstances.current.doughnut) chartInstances.current.doughnut.destroy();
    };
  }, [isLoggedIn, activeTab, transactions, budgets, savingsGoals, theme, globalCurrency]);

  // Handle Login Action with Security Validation & Database Matching
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Invalid credentials");
      setToastNotification({ message: "Invalid credentials", type: "error" });
      return;
    }
    
    setIsAuthLoading(true);

    // Simulate database query latency
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const savedUsersStr = localStorage.getItem("tracker_users");
      const users = savedUsersStr ? JSON.parse(savedUsersStr) : [];
      
      const inputHash = await hashPassword(loginPassword);
      
      // Match user by email & hashed password
      const matchedUser = users.find(
        (u: any) => u.email.toLowerCase() === loginEmail.toLowerCase().trim() && u.passwordHash === inputHash
      );

      if (matchedUser) {
        setLoginError(null);
        // Log in successfully
        const targetEmail = matchedUser.email;
        const newProfile = {
          name: matchedUser.name,
          email: matchedUser.email,
          role: "Premium Financial Executive",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
        };
        setProfile(newProfile);
        localStorage.setItem("tracker_profile", JSON.stringify(newProfile));

        // Load user-specific budgets
        const savedBudgets = localStorage.getItem(`tracker_budgets_${targetEmail}`);
        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        } else if (targetEmail === "mahitha@finance.pro") {
          setBudgets([
            { category: "Food", limit: 15000, spent: 2700 },
            { category: "Travel", limit: 10000, spent: 1800 },
            { category: "Entertainment", limit: 12000, spent: 8000 },
            { category: "Rent", limit: 30000, spent: 25000 },
            { category: "Utilities", limit: 8000, spent: 2500 },
            { category: "Fuel", limit: 8000, spent: 5000 },
            { category: "Shopping", limit: 15000, spent: 6500 }
          ]);
        } else {
          setBudgets([]);
        }

        // Load user-specific transactions
        const savedTrans = localStorage.getItem(`tracker_transactions_${targetEmail}`);
        if (savedTrans) {
          setTransactions(JSON.parse(savedTrans));
        } else if (targetEmail === "mahitha@finance.pro") {
          setTransactions([
            { id: "t1", date: "2026-07-01", time: "08:30", category: "Food", title: "Starbucks Breakfast", description: "Morning coffee & croissant with team", amount: 1200.00, type: "expense", status: "Completed", paymentMethod: "UPI", currency: "INR" },
            { id: "t2", date: "2026-06-30", time: "11:00", category: "Freelancing", title: "Freelance UI Work", description: "Freelance UI Designing Payment", amount: 85000.00, type: "income", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
            { id: "t3", date: "2026-06-29", time: "10:00", category: "Rent", title: "Apartment Rent", description: "July Apartment Rental Payment", amount: 25000.00, type: "expense", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
            { id: "t4", date: "2026-06-28", time: "13:00", category: "Food", title: "Subway Deluxe Lunch", description: "Subway Deluxe Lunch with colleagues", amount: 1500.00, type: "expense", status: "Completed", paymentMethod: "Cash", currency: "INR" },
            { id: "t5", date: "2026-06-27", time: "09:00", category: "Salary", title: "Corporate Salary", description: "Monthly Corporate Salary Paycheck", amount: 250000.00, type: "income", status: "Completed", paymentMethod: "Net Banking", currency: "INR" },
            { id: "t6", date: "2026-06-25", time: "20:00", category: "Entertainment", title: "Netflix Premium", description: "Netflix Premium Annual Renewal", amount: 8000.00, type: "expense", status: "Completed", paymentMethod: "Credit Card", currency: "INR" },
            { id: "t7", date: "2026-06-24", time: "17:15", category: "Fuel", title: "Chevron Gas Refill", description: "Chevron Gas Station Refill", amount: 5000.00, type: "expense", status: "Completed", paymentMethod: "Credit Card", currency: "INR" },
            { id: "t8", date: "2026-06-22", time: "15:30", category: "Utilities", title: "Fiber Internet Bill", description: "High-Speed Fiber Optic Internet", amount: 2500.00, type: "expense", status: "Completed", paymentMethod: "Debit Card", currency: "INR" },
            { id: "t9", date: "2026-06-21", time: "14:00", category: "Shopping", title: "Target Groceries", description: "Weekly home groceries", amount: 6500.00, type: "expense", status: "Completed", paymentMethod: "Wallet", currency: "INR" },
            { id: "t10", date: "2026-06-18", time: "11:15", category: "Travel", title: "Uber Commute", description: "Uber ride to client office", amount: 1800.00, type: "expense", status: "Completed", paymentMethod: "UPI", currency: "INR" }
          ]);
        } else {
          setTransactions([]);
        }

        // Load user-specific savings goals
        const savedGoals = localStorage.getItem(`tracker_savings_goals_${targetEmail}`);
        if (savedGoals) {
          setSavingsGoals(JSON.parse(savedGoals));
        } else if (targetEmail === "mahitha@finance.pro") {
          setSavingsGoals([
            { id: "g1", name: "New Macbook Pro", target: 150000, saved: 120000, icon: "fa-laptop" },
            { id: "g2", name: "Emergency Fund", target: 500000, saved: 320000, icon: "fa-shield-halved" },
            { id: "g3", name: "Japan Summer Trip", target: 400000, saved: 180000, icon: "fa-plane" }
          ]);
        } else {
          setSavingsGoals([]);
        }

        const savedCurrency = localStorage.getItem(`tracker_currency_${targetEmail}`) || matchedUser.currency || "INR";
        setGlobalCurrency(savedCurrency as "INR" | "USD" | "EUR" | "GBP");

        setIsLoggedIn(true);
        setActiveTab("dashboard");
        setLoginEmail("");
        setLoginPassword("");
        
        // Track logged in email and wizard status
        localStorage.setItem("tracker_logged_in_email", matchedUser.email);
        setIsWizardDone(true);
        
        // Success Toast Notification
        const loginNotify: AppNotification = {
          id: "not_" + Date.now(),
          text: `Logged in securely as ${matchedUser.name}. Session activated.`,
          time: "Just now",
          unread: true,
          type: "success"
        };
        setNotifications(prev => [loginNotify, ...prev]);
      } else {
        setLoginError("Invalid credentials");
        setToastNotification({ message: "Invalid credentials", type: "error" });
      }
    } catch (err) {
      setLoginError("Invalid credentials");
      setToastNotification({ message: "Invalid credentials", type: "error" });
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Create Account Action with complete form validation & password strength check
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field existence validation
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword || !regConfirmPassword) {
      alert("Error: All fields are required to create an account!");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      alert("Error: Please enter a valid email address!");
      return;
    }

    // Password matching validation
    if (regPassword !== regConfirmPassword) {
      alert("Error: Passwords do not match!");
      return;
    }

    // Password strength requirement check
    if (regPassword.length < 6) {
      alert("Error: Password must be at least 6 characters long!");
      return;
    }

    setIsAuthLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const savedUsersStr = localStorage.getItem("tracker_users");
      const users = savedUsersStr ? JSON.parse(savedUsersStr) : [];

      // Email and Username uniqueness checks
      const isEmailTaken = users.some((u: any) => u.email.toLowerCase() === regEmail.toLowerCase().trim());
      const isUsernameTaken = users.some((u: any) => u.username.toLowerCase() === regUsername.toLowerCase().trim());

      if (isEmailTaken) {
        alert("Registration Failed: This email address is already registered!");
        setIsAuthLoading(false);
        return;
      }

      if (isUsernameTaken) {
        alert("Registration Failed: This username is already taken! Please select another one.");
        setIsAuthLoading(false);
        return;
      }

      // Password hashing using cryptographically strong SHA-256
      const pwdHash = await hashPassword(regPassword);

      // Save user to simulated SQL database list
      const newUser = {
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        passwordHash: pwdHash,
        currency: regCurrency
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem("tracker_users", JSON.stringify(updatedUsers));

      alert(`Account created successfully for ${regName}! You can now login.`);

      // Reset form fields
      setRegName("");
      setRegUsername("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegConfirmPassword("");
      
      // Auto transition to Login view
      setLoginEmail(newUser.email);
      setAuthView("login");

    } catch (err) {
      alert("System Error: An error occurred while creating your account.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Logout Action
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("tracker_logged_in");
    localStorage.removeItem("tracker_logged_in_email");
    setIsWizardDone(true);
    setActiveTab("dashboard");
    setAuthView("landing");
  };

  // Handle Edit Expense Action
  const handleEditExpenseClick = (t: Transaction) => {
    setExpenseForm({
      id: t.id,
      title: t.title || t.description.split(" - ")[0] || t.description,
      amount: t.amount.toString(),
      category: t.category,
      date: t.date,
      time: t.time || "12:00",
      paymentMethod: t.paymentMethod || "Cash",
      description: t.description,
      currency: t.currency || "USD",
      receiptUrl: t.receiptUrl || "",
      receiptName: t.receiptUrl ? "Uploaded Receipt" : "",
      status: t.status
    });
    setIsExpenseModalOpen(true);
  };

  // Trigger Delete Confirmation Modal
  const handleDeleteTransaction = (id: string) => {
    setExpenseToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm Delete Action (Handles state and PHP Sync)
  const handleDeleteExpenseConfirm = () => {
    if (!expenseToDeleteId) return;

    // AJAX/Fetch sync to PHP backend
    fetch("/smart-expense-tracker-pro/api/expenses_api.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: expenseToDeleteId })
    })
    .then(res => res.json())
    .then(data => {
      console.log("PHP delete synced:", data);
    })
    .catch(err => {
      console.log("PHP backend offline (using local storage fallback):", err);
    });

    setTransactions(prev => prev.filter(t => t.id !== expenseToDeleteId));
    setIsDeleteConfirmOpen(false);
    setExpenseToDeleteId(null);

    // Toast Notification
    const notify: AppNotification = {
      id: "not_" + Date.now(),
      text: "Expense record deleted successfully.",
      time: "Just now",
      unread: true,
      type: "info"
    };
    setNotifications(prev => [notify, ...prev]);
  };

  // Unified Save Expense (Add or Edit) Handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!expenseForm.title.trim()) {
      alert("Expense Title is required!");
      return;
    }
    const amountNum = parseFloat(expenseForm.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      alert("Expense Amount must be a non-negative number!");
      return;
    }
    if (!expenseForm.category) {
      alert("Category is required!");
      return;
    }
    if (!expenseForm.date) {
      alert("Date is required!");
      return;
    }

    // Check future dates
    const selectedDate = new Date(expenseForm.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      alert("Error: Date cannot be in the future!");
      return;
    }

    const isEdit = expenseForm.id !== "";
    
    const expenseItem: Transaction = {
      id: isEdit ? expenseForm.id : "exp_" + Date.now(),
      date: expenseForm.date,
      time: expenseForm.time,
      category: expenseForm.category,
      description: expenseForm.description || expenseForm.title,
      title: expenseForm.title,
      amount: amountNum,
      type: "expense",
      status: expenseForm.status,
      paymentMethod: expenseForm.paymentMethod,
      currency: expenseForm.currency,
      receiptUrl: expenseForm.receiptUrl
    };

    // AJAX/Fetch sync to PHP backend
    fetch("/smart-expense-tracker-pro/api/expenses_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: isEdit ? expenseForm.id : undefined,
        title: expenseForm.title,
        amount: amountNum,
        category: expenseForm.category,
        date: expenseForm.date,
        description: expenseForm.description,
        receiptUrl: expenseForm.receiptUrl
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("PHP save synced:", data);
    })
    .catch(err => {
      console.log("PHP backend offline (using local storage fallback):", err);
    });

    if (isEdit) {
      setTransactions(prev => prev.map(t => t.id === expenseForm.id ? expenseItem : t));
    } else {
      setTransactions(prev => [expenseItem, ...prev]);
    }

    // Check if new spent violates budget limit
    const matchedBudget = budgets.find(b => b.category.toLowerCase() === expenseForm.category.toLowerCase());
    if (matchedBudget) {
      const oldAmount = isEdit ? (transactions.find(t => t.id === expenseForm.id)?.amount || 0) : 0;
      const netChange = amountNum - oldAmount;
      const newSpent = matchedBudget.spent + netChange;
      if (newSpent > matchedBudget.limit) {
        const notify: AppNotification = {
          id: "not_" + Date.now(),
          text: `Budget Alert: ${expenseForm.category} limit exceeded by $${(newSpent - matchedBudget.limit).toFixed(2)}!`,
          time: "Just now",
          unread: true,
          type: "warning"
        };
        setNotifications(prev => [notify, ...prev]);
      }
    }

    // Save success notification
    const saveNotify: AppNotification = {
      id: "not_" + Date.now(),
      text: isEdit ? "Expense record updated successfully." : "New expense recorded successfully.",
      time: "Just now",
      unread: true,
      type: "success"
    };
    setNotifications(prev => [saveNotify, ...prev]);

    setIsExpenseModalOpen(false);
    resetExpenseForm();
  };

  // Add / Edit Income Helper
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    const amountNum = parseFloat(incomeForm.amount);
    if (isNaN(amountNum) || amountNum < 0) {
      alert("Income Amount must be a non-negative number!");
      return;
    }
    if (!incomeForm.category) {
      alert("Category is required!");
      return;
    }
    if (!incomeForm.date) {
      alert("Date is required!");
      return;
    }

    // Check future dates
    const selectedDate = new Date(incomeForm.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      alert("Error: Date cannot be in the future!");
      return;
    }

    let notes = incomeForm.description.trim();
    if (!notes) {
      notes = incomeForm.category + " Deposit";
    }

    const isEdit = incomeForm.id !== "";
    
    const incomeItem: Transaction = {
      id: isEdit ? incomeForm.id : "inc_" + Date.now(),
      date: incomeForm.date,
      time: "00:00",
      category: incomeForm.category,
      description: notes,
      title: notes,
      amount: amountNum,
      type: "income",
      status: incomeForm.status,
      currency: incomeForm.currency
    };

    // AJAX/Fetch sync to PHP backend
    fetch("/smart-expense-tracker-pro/api/income_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: isEdit ? incomeForm.id : undefined,
        source_name: incomeForm.category,
        amount: amountNum,
        description: incomeForm.description,
        date: incomeForm.date
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("PHP save synced:", data);
    })
    .catch(err => {
      console.log("PHP backend offline (using local storage fallback):", err);
    });

    if (isEdit) {
      setTransactions(prev => prev.map(t => t.id === incomeForm.id ? incomeItem : t));
    } else {
      setTransactions(prev => [incomeItem, ...prev]);
    }

    // Save success notification
    const saveNotify: AppNotification = {
      id: "not_" + Date.now(),
      text: isEdit ? "Income record updated successfully." : "New income recorded successfully.",
      time: "Just now",
      unread: true,
      type: "success"
    };
    setNotifications(prev => [saveNotify, ...prev]);

    setIsIncomeModalOpen(false);
    resetIncomeForm();
  };

  // Set Budget Helper
  const [budgetModalError, setBudgetModalError] = useState<string | null>(null);

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetModalError(null);
    const limitNum = parseFloat(newBudget.limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setBudgetModalError("Please enter a valid budget limit greater than 0!");
      return;
    }

    const existingIndex = budgets.findIndex(b => b.category.toLowerCase() === newBudget.category.toLowerCase());
    let prospectiveBudgets: Budget[];
    if (existingIndex >= 0) {
      prospectiveBudgets = budgets.map((b, i) => i === existingIndex ? { ...b, limit: limitNum } : b);
    } else {
      prospectiveBudgets = [...budgets, { category: newBudget.category, limit: limitNum, spent: 0 }];
    }

    const prospectiveTotal = prospectiveBudgets.reduce((sum, b) => sum + b.limit, 0);

    if (totalIncome > 0 && prospectiveTotal > totalIncome) {
      setBudgetModalError(`Cannot save budget! Total allocated budget (${getCurrencySymbol(globalCurrency)}${prospectiveTotal.toLocaleString()}) exceeds your given monthly income of ${getCurrencySymbol(globalCurrency)}${totalIncome.toLocaleString()} by ${getCurrencySymbol(globalCurrency)}${(prospectiveTotal - totalIncome).toLocaleString()}. Please reduce this category limit.`);
      return;
    }

    setBudgets(prospectiveBudgets);

    const saveNotify: AppNotification = {
      id: "not_budget_" + Date.now(),
      text: `Budget for "${newBudget.category}" updated to ${getCurrencySymbol(globalCurrency)}${limitNum.toLocaleString()}.`,
      time: "Just now",
      unread: true,
      type: "success"
    };
    setNotifications(prev => [saveNotify, ...prev]);

    setNewBudget({ category: "Food & Dining", limit: "" });
    setBudgetModalError(null);
    setIsBudgetModalOpen(false);
  };

  // Create Goals Helper
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(newGoal.target);
    const savedNum = parseFloat(newGoal.saved || "0");
    if (!newGoal.name || isNaN(targetNum) || targetNum <= 0) return;

    const goalItem: SavingsGoal = {
      id: "goal_" + Date.now(),
      name: newGoal.name,
      target: targetNum,
      saved: Math.min(targetNum, Math.max(0, savedNum)),
      icon: newGoal.icon
    };

    setSavingsGoals(prev => [...prev, goalItem]);
    setNewGoal({ name: "", target: "", saved: "", icon: "fa-laptop" });
    setIsGoalModalOpen(false);
  };

  // Update Goal Savings contribution
  const handleContributeToGoal = (id: string, contributionAmount: string) => {
    const contribution = parseFloat(contributionAmount);
    if (isNaN(contribution) || contribution <= 0) return;

    setSavingsGoals(prev => {
      return prev.map(g => {
        if (g.id === id) {
          const newSaved = Math.min(g.target, g.saved + contribution);
          if (newSaved === g.target && g.saved < g.target) {
            // Trigger target reached notification
            const notify: AppNotification = {
              id: "not_" + Date.now(),
              text: `Congratulations! Goal reached: You have completed '${g.name}' target of $${g.target}!`,
              time: "Just now",
              unread: true,
              type: "success"
            };
            setNotifications(ns => [notify, ...ns]);
          }
          return { ...g, saved: newSaved };
        }
        return g;
      });
    });
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Export handlers for Corporate Ledger Export Portal
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      setToastNotification({ message: "No transactions available to export", type: "info" });
      return;
    }
    const headers = ["Transaction ID", "Type", "Title / Description", "Category", "Amount", "Currency", "Date", "Status"];
    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.type}"`,
      `"${(t.title || t.description || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.amount,
      `"${globalCurrency}"`,
      `"${t.date}"`,
      `"${t.status || 'Completed'}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Corporate_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastNotification({ message: "CSV Spreadsheet exported successfully!", type: "success" });
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      setToastNotification({ message: "No transaction data available for PDF statement", type: "info" });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setToastNotification({ message: "Pop-up blocked. Please allow pop-ups to open PDF statement.", type: "error" });
      return;
    }

    const symbol = getCurrencySymbol(globalCurrency);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = transactions.map((t, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px; font-size: 11px; font-weight: bold; color: ${t.type === 'income' ? '#059669' : '#dc2626'}; text-transform: uppercase;">${t.type}</td>
        <td style="padding: 8px; font-size: 11px;">${t.title || t.description || 'Transaction'}</td>
        <td style="padding: 8px; font-size: 11px;">${t.category}</td>
        <td style="padding: 8px; font-size: 11px; font-weight: bold; text-align: right;">${symbol}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td style="padding: 8px; font-size: 11px; text-align: center;">${t.date}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Corporate Financial Statement - ${profile.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
            .card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .card-value { font-size: 18px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 800; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Corporate Financial Audit Statement</h1>
              <p class="subtitle">Official Ledger Record &bull; Generated for ${profile.name}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; font-weight: bold; margin: 0; color: #4f46e5;">SMART EXPENSE TRACKER PRO</p>
              <p style="font-size: 10px; color: #64748b; margin-top: 2px;">Issue Date: ${today}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="card">
              <div class="card-label">Total Deposits</div>
              <div class="card-value" style="color: #059669;">${symbol}${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
              <div class="card-label">Total Outgoings</div>
              <div class="card-value" style="color: #dc2626;">${symbol}${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
              <div class="card-label">Allocated Savings</div>
              <div class="card-value" style="color: #9333ea;">${symbol}${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
              <div class="card-label">Net Liquidity</div>
              <div class="card-value" style="color: ${totalBalance >= 0 ? '#059669' : '#dc2626'};">${symbol}${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 12px;">Transaction History Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Description</th>
                <th>Category</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: center;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            This statement is cryptographically compiled from the Smart Expense Tracker Pro ledger database for taxation & auditing purposes.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    setToastNotification({ message: "PDF Statement generated successfully!", type: "success" });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = transactionTypeFilter === "all" || t.type === transactionTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`min-h-screen font-sans antialiased transition-all duration-300 radial-bg ${theme === "dark" ? "dark text-slate-100 bg-slate-950" : "text-slate-900 bg-slate-50"}`}>
      
      {/* Floating Toast Notification Pop-up */}
      {toastNotification && (
        <div className="fixed top-6 right-6 z-[9999] transition-all animate-bounce">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
            toastNotification.type === "error" 
              ? "bg-red-600 text-white border-red-500 shadow-red-500/20" 
              : toastNotification.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20"
          }`}>
            <i className={`fa-solid ${
              toastNotification.type === "error" ? "fa-circle-exclamation text-base text-white" : toastNotification.type === "success" ? "fa-circle-check text-base text-white" : "fa-circle-info text-base text-white"
            }`}></i>
            <span>{toastNotification.message}</span>
            <button 
              onClick={() => setToastNotification(null)}
              className="ml-2 hover:opacity-75 transition-opacity text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none animate-glow"></div>
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none animate-glow"></div>

      {/* 1. Sleek Authentication Gateway & Landing Page */}
      {!isLoggedIn ? (
        <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
          
          {/* Landing Page View */}
          {authView === "landing" && (
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>
              
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💰</span>
                  <span className="text-sm font-bold tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase">Premium Platform</span>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight leading-tight">
                    Smart Expense <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Tracker Pro</span>
                  </h1>
                  <p className="text-lg font-bold text-purple-600 tracking-wide font-sans">
                    Manage Smart. Save Smart.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    Track your expenses. Monitor your savings. Achieve your financial goals. Establish safe spending thresholds, compile dynamic visual charts, and manage wealth efficiently.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <i className="fa-solid fa-shield-halved text-sm"></i>
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">Vault Security</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                      Simulated secure sessions, hashing, and custom ledger balances.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <i className="fa-solid fa-chart-pie text-sm"></i>
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">Dynamic Reports</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                      Full category pie charts and monthly cash flow metrics.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setAuthView("login")}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-600 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-700 dark:hover:to-indigo-700 text-gray-900 dark:text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    🔐 Login
                  </button>
                  <button
                    onClick={() => setAuthView("register")}
                    className="flex-1 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  >
                    ✨ Create Account
                  </button>
                </div>
              </div>

              <div className="w-full md:w-80 space-y-4">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Platform Statistics</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Active Households</span>
                      <span className="font-bold text-slate-800">12,400+</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Savings Target Ratio</span>
                      <span className="font-bold text-emerald-500">84.2%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">System Uptime</span>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">99.9% LIVE</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-4">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 italic leading-relaxed text-center">
                      "Since implementing Smart Expense Tracker Pro, my financial health score rose from Critical to Safe!"
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold text-center mt-1">
                      — Verified User
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Screen */}
          {authView === "login" && (
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>
              
              <button
                onClick={() => setAuthView("landing")}
                className="absolute top-6 left-6 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 transition-all text-xs flex items-center gap-1.5 font-bold"
              >
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>

              <div className="text-center mt-4 mb-8">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-purple-600">
                  <i className="fa-solid fa-wallet text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white">Sign In to Pro Suite</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-1">Unlock your financial overview ledger</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-sm text-red-500"></i>
                    <span>{loginError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">Registered Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. mahitha@finance.pro"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">Security Key</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 accent-purple-600" />
                    Remember login
                  </label>
                  <a href="#forgot" className="text-purple-600 font-bold hover:underline">Forgot key PIN?</a>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-600 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-700 dark:hover:to-indigo-700 text-gray-900 dark:text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <>Verifying Credentials...</>
                  ) : (
                    <>Sign In &nbsp;<i className="fa-solid fa-arrow-right-to-bracket"></i></>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-100 pt-5">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  New user?{" "}
                  <button onClick={() => setAuthView("register")} className="text-purple-600 font-bold hover:underline">
                    Create Account
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* Create Account Screen */}
          {authView === "register" && (
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>
              
              <button
                onClick={() => setAuthView("landing")}
                className="absolute top-6 left-6 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 transition-all text-xs flex items-center gap-1.5 font-bold"
              >
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>

              <div className="text-center mt-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <i className="fa-solid fa-user-plus text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white">Establish Pro Account</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-1">Register your details for instant secure tracking</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Mahitha"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. mahitha"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. mahitha@finance.pro"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Security Key (Password)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Confirm Security Key</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Password Strength and Matching Indicators */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">Strength Checker</span>
                    {(() => {
                      const strength = regPassword ? (regPassword.length < 6 ? { text: "Too Short", color: "text-red-500 bg-red-50" } : regPassword.length < 10 ? { text: "Medium Strength", color: "text-amber-500 bg-amber-50" } : { text: "Excellent/Strong", color: "text-emerald-500 bg-emerald-50" }) : { text: "Enter password", color: "text-slate-600 dark:text-slate-400 dark:text-slate-400 bg-slate-50" };
                      return (
                        <div className={`px-2 py-1 rounded text-[10px] font-bold inline-block ${strength.color}`}>
                          {strength.text}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">Match Indicator</span>
                    {regPassword && regConfirmPassword ? (
                      regPassword === regConfirmPassword ? (
                        <div className="px-2 py-1 rounded text-[10px] font-bold inline-block text-emerald-500 bg-emerald-50">
                          <i className="fa-solid fa-circle-check"></i> Matching
                        </div>
                      ) : (
                        <div className="px-2 py-1 rounded text-[10px] font-bold inline-block text-red-500 bg-red-50">
                          <i className="fa-solid fa-circle-xmark"></i> Mismatch
                        </div>
                      )
                    ) : (
                      <div className="px-2 py-1 rounded text-[10px] font-bold inline-block text-slate-600 dark:text-slate-400 dark:text-slate-400 bg-slate-50">
                        Pending input
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Default Base Currency</label>
                  <select
                    value={regCurrency}
                    onChange={(e: any) => setRegCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs transition-all focus:border-purple-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-500 dark:to-teal-600 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-gray-900 dark:text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <>Provisioning Vault...</>
                  ) : (
                    <>Create Account &nbsp;<i className="fa-solid fa-user-check"></i></>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-100 pt-5">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <button onClick={() => setAuthView("login")} className="text-purple-600 font-bold hover:underline">
                    Sign In
                  </button>
                </span>
              </div>
            </div>
          )}

        </div>
      ) : (
        
        /* 2. Full Application Shell */
        <div className="flex min-h-screen relative overflow-hidden">
          
          {/* First Login Set Monthly Budget Wizard Overlay */}
          {!isWizardDone && (
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800/80 overflow-hidden relative my-8">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600"></div>
                <div className="p-8 space-y-6">
                  
                  {/* Wizard Header */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
                      <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-black dark:text-slate-100 tracking-tight">Set Your Monthly Budget</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">Establish your monthly income and base currency to generate custom recommended category budget thresholds</p>
                  </div>

                  <form onSubmit={handleSaveWizardBudget} className="space-y-6">
                    {/* Part 1: Income and Currency inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Monthly Income (Required)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs font-bold font-mono">
                            {getCurrencySymbol(wizardCurrency)}
                          </span>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 50000"
                            value={wizardMonthlyIncome}
                            onChange={(e) => setWizardMonthlyIncome(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-purple-500 dark:focus:border-purple-500 text-xs text-slate-800 dark:text-slate-100 font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono">Base Currency</label>
                        <select
                          value={wizardCurrency}
                          onChange={(e: any) => setWizardCurrency(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-purple-500 text-xs text-slate-800 dark:text-slate-100 font-bold"
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                          <option value="GBP">GBP (£) - British Pound</option>
                        </select>
                      </div>
                    </div>

                    {/* Part 2: Recommended budget generation view */}
                    <div className="bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Recommended Category Allocations</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-0.5">Based on standard percentage-split logic. You can edit any value directly before saving.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
                        {[
                          { key: "savings", label: "Savings (20%)", color: "text-emerald-500" },
                          { key: "food", label: "Food (15%)", color: "text-amber-500" },
                          { key: "transport", label: "Transport (10%)", color: "text-indigo-500" },
                          { key: "shopping", label: "Shopping (10%)", color: "text-pink-500" },
                          { key: "bills", label: "Bills & Utilities (20%)", color: "text-blue-500" },
                          { key: "entertainment", label: "Entertainment (5%)", color: "text-purple-500" },
                          { key: "healthcare", label: "Healthcare (5%)", color: "text-red-500" },
                          { key: "education", label: "Education (5%)", color: "text-teal-500" },
                          { key: "emergency", label: "Emergency Fund (5%)", color: "text-rose-500" },
                          { key: "others", label: "Others (5%)", color: "text-slate-600 dark:text-slate-400" }
                        ].map((cat) => (
                          <div key={cat.key} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full bg-current ${cat.color}`}></span>
                              {cat.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">{getCurrencySymbol(wizardCurrency)}</span>
                              <input
                                type="number"
                                min="0"
                                value={wizardBudgets[cat.key as keyof typeof wizardBudgets] || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setWizardBudgets(prev => ({ ...prev, [cat.key]: val }));
                                }}
                                className="w-20 px-2 py-1 text-right border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-purple-500 dark:focus:border-purple-500 bg-transparent"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Allocation verification */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-400">Total Allocated:</span>
                        <span className="font-mono font-black text-purple-600">
                          {getCurrencySymbol(wizardCurrency)}
                          {(Object.values(wizardBudgets) as number[]).reduce((sum, v) => sum + v, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-600 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-700 dark:hover:to-indigo-700 text-gray-900 dark:text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                    >
                      Initialize Budget and Enter Platform
                    </button>

                  </form>
                </div>
              </div>
            </div>
          )}

          {/* LEFT SIDEBAR PANEL */}
          <aside className="w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/80 flex flex-col fixed h-full z-30 transition-all duration-300">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <i className="fa-solid fa-wallet text-gray-900 dark:text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Smart Expense
                  </h2>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase font-black tracking-widest">
                    Tracker Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items (Display only the requested) */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {([
                { id: "dashboard", label: "Dashboard", icon: "fa-house" },
                { id: "expenses", label: "Expenses", icon: "fa-receipt", color: "text-red-500" },
                { id: "income", label: "Income", icon: "fa-wallet", color: "text-emerald-500" },
                { id: "budget", label: "Budget Planner", icon: "fa-sliders", color: "text-amber-500" },
                { id: "savings", label: "Savings Goals", icon: "fa-bullseye", color: "text-indigo-500" },
                { id: "reports", label: "Reports", icon: "fa-chart-simple" },
                { id: "profile", label: "Profile", icon: "fa-user" },
                { id: "settings", label: "Settings", icon: "fa-gear" },
              ] as { id: string; label: string; icon: string; color?: string; count?: number }[]).map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-600 text-gray-900 dark:text-white shadow-md shadow-indigo-500/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center text-sm ${isActive ? "text-gray-900 dark:text-white" : item.color || "text-slate-600 dark:text-slate-400 dark:text-slate-400"}`}>
                        <i className={`fa-solid ${item.icon}`}></i>
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className="bg-red-100 dark:bg-red-500 text-red-700 dark:text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 mt-6 transition-all"
              >
                <span className="w-5 text-center text-sm">
                  <i className="fa-solid fa-right-from-bracket"></i>
                </span>
                <span>Logout</span>
              </button>
            </nav>

            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium">
                V3.4.0 Secure Live Platform
              </span>
            </div>
          </aside>

          {/* MAIN CONTAINER PANEL */}
          <div className="flex-1 pl-64 min-h-screen flex flex-col">
            
            {/* TOP NAVIGATION BAR */}
            <header className="h-20 glass-panel border-b border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between px-8 sticky top-0 z-20">
              
              {/* Search Bar */}
              <div className="w-96 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 text-sm">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets, records or categories..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-xs transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-6">

                {/* Global Currency Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono hidden md:inline">Currency:</span>
                  <select
                    value={globalCurrency}
                    onChange={(e) => setGlobalCurrency(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 transition-all"
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
                
                {/* Theme Selector */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all"
                  title="Toggle Visual Theme"
                >
                  <i className={`fa-solid ${theme === "dark" ? "fa-sun text-amber-500" : "fa-moon"}`}></i>
                </button>

                {/* Notifications Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all relative"
                  >
                    <i className="fa-solid fa-bell"></i>
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 dark:bg-red-500 border-2 border-slate-200 dark:border-slate-950 text-red-700 dark:text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {notifications.filter(n => n.unread).length}
                      </span>
                    )}
                  </button>

                  {/* Dropdown for notifications */}
                  {isNotificationsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 glass-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
                        <span className="font-bold text-xs">Unread Notifications</span>
                        <button onClick={markAllNotificationsAsRead} className="text-[10px] text-indigo-500 hover:underline">
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-4 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">
                            No notifications to display
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`px-4 py-3 border-b border-slate-200/10 dark:border-slate-800/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 text-xs flex gap-2 ${n.unread ? "bg-indigo-500/5" : ""}`}>
                              <span className="mt-0.5">
                                {n.type === "success" && <i className="fa-solid fa-circle-check text-emerald-500"></i>}
                                {n.type === "warning" && <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>}
                                {n.type === "info" && <i className="fa-solid fa-circle-info text-blue-500"></i>}
                              </span>
                              <div>
                                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">{n.text}</p>
                                <span className="text-[9px] text-slate-600 dark:text-slate-400 dark:text-slate-400 block mt-1">{n.time}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

                {/* Profile Widget */}
                <div className="relative">
                  <div
                    onClick={() => {
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsNotificationsDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all select-none"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div className="hidden md:block text-left">
                      <h4 className="text-xs font-bold leading-tight">{profile.name}</h4>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium block">
                        {profile.role}
                      </span>
                    </div>
                    <i className="fa-solid fa-chevron-down text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 pr-2"></i>
                  </div>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-slate-200/50 dark:border-slate-800/50">
                        <p className="font-bold text-xs">{profile.name}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400">{profile.email}</p>
                      </div>
                      <button
                        onClick={() => { setActiveTab("profile"); setIsProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-user text-slate-600 dark:text-slate-400 dark:text-slate-400"></i> My Profile
                      </button>
                      <button
                        onClick={() => { setActiveTab("settings"); setIsProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-gear text-slate-600 dark:text-slate-400 dark:text-slate-400"></i> Account Settings
                      </button>
                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </header>

            {/* CORE APP VIEW ENGINE */}
            <main className="flex-1 p-8 space-y-8 overflow-y-auto">
              
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && (
                <>
                  {/* WELCOME BANNER HEADER (Greeting) */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight text-black dark:text-white font-sans">
                        {(() => {
                          const hr = new Date().getHours();
                          let greet = "Good Morning";
                          if (hr >= 12 && hr < 17) greet = "Good Afternoon";
                          else if (hr >= 17 || hr < 4) greet = "Good Evening";
                          return `${greet}, ${profile.name} 👋`;
                        })()}
                      </h1>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-1">
                        Let's manage your finances today.
                      </p>
                    </div>
                    
                    {/* Timestamp Info */}
                    <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2 text-purple-600 dark:text-purple-400 font-mono text-xs">
                      <i className="fa-regular fa-calendar-days"></i>
                      <span>{new Date().toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* WELCOME CARD FOR NEW USERS */}
                  {totalIncome === 0 && (
                    <div className="bg-gradient-to-br from-purple-100 via-indigo-100 to-indigo-200 dark:from-purple-600 dark:via-indigo-600 dark:to-indigo-700 rounded-3xl p-8 text-gray-900 dark:text-white shadow-xl relative overflow-hidden border border-purple-500/20">
                      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-900/10 dark:text-white/10 text-9xl font-black select-none pointer-events-none hidden lg:block">
                        GROW
                      </div>
                      <div className="relative z-10 space-y-6 max-w-2xl">
                        <div className="space-y-2">
                          <h2 className="text-3xl font-black tracking-tight text-black dark:text-white">👋 Welcome, {profile.name}</h2>
                          <p className="text-purple-100 font-medium text-sm leading-relaxed">
                            Welcome to Smart Expense Tracker Pro. Start by adding your monthly income to generate your personalized budget plan.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2">
                          <button
                            onClick={() => {
                              setFirstIncomeAmount("");
                              setFirstIncomeStep(1);
                              setIsAddFirstIncomeModalOpen(true);
                            }}
                            className="px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            ➕ Add First Income
                          </button>
                          <button
                            onClick={() => alert("Smart Expense Tracker Pro helps you automate budget distributions (20% Savings, 15% Food, 10% Transport, 10% Shopping, etc.) and provides dynamic health analysis.")}
                            className="px-6 py-3 bg-slate-200/50 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all border border-slate-300 dark:border-white/20 active:scale-95 cursor-pointer"
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FINANCIAL HEALTH HERO SECTION (LARGEST TOP CARD) */}
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-purple-200/50 dark:border-purple-500/20 shadow-md bg-white dark:bg-slate-900">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      
                      {/* Left: Score Column */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 lg:border-r border-slate-200/50 dark:border-slate-800/50 pr-6 shrink-0">
                        {/* Score Gauge */}
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="transparent" />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              className={healthStatus === "SAFE" ? "stroke-emerald-500" : healthStatus === "WARNING" ? "stroke-amber-500" : healthStatus === "NOT_AVAILABLE" ? "stroke-slate-200 dark:stroke-slate-700" : "stroke-red-500"}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray="251.2"
                              strokeDashoffset={healthStatus === "NOT_AVAILABLE" ? 251.2 : 251.2 - (251.2 * computedHealthScore) / 100}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 1s ease" }}
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-black tracking-tight text-violet-600 dark:text-slate-100">
                              {healthStatus === "NOT_AVAILABLE" ? "N/A" : computedHealthScore}
                            </span>
                            {healthStatus !== "NOT_AVAILABLE" && <span className="text-[10px] text-violet-600 dark:text-slate-400 font-bold block">/100</span>}
                          </div>
                        </div>

                        <div className="text-center sm:text-left space-y-1">
                          <span className="text-[9px] font-black text-violet-600 dark:text-purple-400 uppercase tracking-widest block">Financial Health</span>
                          <h2 className="text-2xl font-black text-violet-600 dark:text-white">
                            {healthStatus === "NOT_AVAILABLE" ? "Not Available" : `${computedHealthScore}/100`}
                          </h2>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 mt-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${healthStatus === "SAFE" ? "bg-emerald-500 animate-pulse" : healthStatus === "WARNING" ? "bg-amber-500 animate-pulse" : healthStatus === "NOT_AVAILABLE" ? "bg-slate-400" : "bg-red-500 animate-pulse"}`}></span>
                            <span className={healthStatus === "SAFE" ? "text-emerald-500" : healthStatus === "WARNING" ? "text-amber-500" : healthStatus === "NOT_AVAILABLE" ? "text-slate-600 dark:text-slate-400 dark:text-slate-400" : "text-red-500"}>
                              {healthStatus === "NOT_AVAILABLE" ? "Not Available" : healthStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: 3 Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1 py-1">
                        {/* Metric 1 */}
                        <div className="bg-slate-100/30 dark:bg-slate-900/10 p-4 border border-slate-200/30 dark:border-slate-800/30 rounded-xl flex flex-col justify-between">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">Budget Used</span>
                          <div>
                            <span className="text-2xl font-black text-black dark:text-slate-100">{budgetUsagePercent}%</span>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Metric 2 */}
                        <div className="bg-slate-100/30 dark:bg-slate-900/10 p-4 border border-slate-200/30 dark:border-slate-800/30 rounded-xl flex flex-col justify-between">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">Savings Rate</span>
                          <div>
                            <span className="text-2xl font-black text-black dark:text-slate-100">{savingsRatePercent}%</span>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, savingsRatePercent))}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Metric 3 */}
                        <div className="bg-slate-100/30 dark:bg-slate-900/10 p-4 border border-slate-200/30 dark:border-slate-800/30 rounded-xl flex flex-col justify-between">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">Expense Ratio</span>
                          <div>
                            <span className="text-2xl font-black text-black dark:text-slate-100">{(parseFloat(expenseRatio) * 100).toFixed(0)}%</span>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-red-400 h-full rounded-full" style={{ width: `${Math.min(100, parseFloat(expenseRatio) * 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dynamic Report & Recommendations */}
                      <div className="flex-1 space-y-3.5 flex flex-col justify-center min-w-[280px]">
                        <div className="bg-slate-100/30 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                          <span className="text-[9px] uppercase font-black tracking-widest text-black dark:text-slate-400 block mb-1">Monthly Expense Health Report</span>
                          <div className="text-[11px] text-black dark:text-slate-300 leading-relaxed font-semibold">
                            You spent {getCurrencySymbol(globalCurrency)}{totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 0 })} this month. 
                            {categorySums["Food"] ? ` Food spending represents ${Math.round(categorySums["Food"] / (totalMonthlyExpenses || 1) * 100)}% of your expenses.` : ""}
                            {categorySums["Shopping"] ? ` Shopping represents ${Math.round(categorySums["Shopping"] / (totalMonthlyExpenses || 1) * 100)}%.` : ""}
                          </div>
                        </div>
                        
                        <div className="bg-purple-500/5 dark:bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/10">
                          <span className="text-[9px] uppercase font-black tracking-widest text-purple-400 block mb-1">Recommendation</span>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 leading-snug font-bold">
                            {healthRecommendation}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Quick Actions</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Add Expense */}
                      <button
                        onClick={() => { resetExpenseForm(); setIsExpenseModalOpen(true); }}
                        className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-red-500/20 active:translate-y-0 transition-all text-left cursor-pointer group w-full"
                      >
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-500 group-hover:text-red-700 dark:group-hover:text-white transition-all shrink-0">
                          <i className="fa-solid fa-plus text-sm"></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Add Expense</h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold mt-0.5">Record outgoings</p>
                        </div>
                      </button>

                      {/* Add Income */}
                      <button
                        onClick={() => { resetIncomeForm(); setIsIncomeModalOpen(true); }}
                        className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-500/20 active:translate-y-0 transition-all text-left cursor-pointer group w-full"
                      >
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500 group-hover:text-emerald-700 dark:group-hover:text-white transition-all shrink-0">
                          <i className="fa-solid fa-wallet text-sm"></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Add Income</h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold mt-0.5">Record cash inflow</p>
                        </div>
                      </button>

                      {/* Smart Budget */}
                      <button
                        onClick={() => {
                          if (totalIncome > 0) {
                            setFirstIncomeAmount(totalIncome.toString());
                            setFirstIncomeStep(2);
                          } else {
                            setFirstIncomeAmount("");
                            setFirstIncomeStep(1);
                          }
                          setIsAddFirstIncomeModalOpen(true);
                        }}
                        className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-purple-500/20 active:translate-y-0 transition-all text-left cursor-pointer group w-full"
                      >
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-600 group-hover:text-purple-700 dark:group-hover:text-white transition-all shrink-0">
                          <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Smart Budget</h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold mt-0.5">Plan target ratios</p>
                        </div>
                      </button>

                      {/* View Reports */}
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-500/20 active:translate-y-0 transition-all text-left cursor-pointer group w-full"
                      >
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-white transition-all shrink-0">
                          <i className="fa-solid fa-chart-simple text-sm"></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">View Reports</h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold mt-0.5">Audit cash flows</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* FOUR SUMMARY KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Card 1: Total Balance */}
                    <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Balance</span>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500 group-hover:text-indigo-700 dark:group-hover:text-white transition-all">
                          <i className="fa-solid fa-scale-balanced text-sm"></i>
                        </div>
                      </div>
                      <div>
                        <h3 className={`text-2xl font-black tracking-tight ${totalBalance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500"}`}>
                          {getCurrencySymbol(globalCurrency)}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold block mt-1">
                          Net spendable funds
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Monthly Income */}
                    <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Monthly Income</span>
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500 group-hover:text-emerald-700 dark:group-hover:text-white transition-all">
                          <i className="fa-solid fa-arrow-trend-up text-sm"></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                          {getCurrencySymbol(globalCurrency)}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                          <i className="fa-solid fa-circle-check"></i> Active revenue streams
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Monthly Expenses */}
                    <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Monthly Expenses</span>
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-500 group-hover:text-red-700 dark:group-hover:text-white transition-all">
                          <i className="fa-solid fa-receipt text-sm"></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-red-500">
                          {getCurrencySymbol(globalCurrency)}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-[10px] text-red-500 font-bold block mt-1">
                          <i className="fa-solid fa-arrow-trend-down"></i> Outgoing bills & purchases
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Total Savings */}
                    <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Savings</span>
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-100 dark:group-hover:bg-purple-600 group-hover:text-purple-700 dark:group-hover:text-white transition-all">
                          <i className="fa-solid fa-piggy-bank text-sm"></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                          {getCurrencySymbol(globalCurrency)}{totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-[10px] text-purple-600 font-bold block mt-1">
                          <i className="fa-solid fa-circle-arrow-up"></i> Savings goals reserve
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* TWO-COLUMN BENTO GRID: BUDGET PROGRESS AND RECENT TRANSACTIONS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left 2/3 Column: Budget Progress with Smart Warnings */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Budget Progress</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">Real-time usage versus allocated category caps</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md font-mono font-bold">
                            {budgets.length} Categories
                          </span>
                        </div>

                        {budgets.length === 0 ? (
                          <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium">
                            <i className="fa-solid fa-triangle-exclamation text-xl text-purple-400 block mb-2"></i>
                            Budget: Not Created. Please add your first income to generate recommended budget limits.
                          </div>
                        ) : (
                          <>
                            {/* Smart Warnings list */}
                            <div className="space-y-2 mb-6">
                              {budgets.map((b) => {
                                const ratio = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                                let alertEl = null;

                                if (b.spent > b.limit) {
                                  alertEl = {
                                    icon: "🔴",
                                    text: `Budget Exceeded: You exceeded your ${b.category} budget by ${getCurrencySymbol(globalCurrency)}${(b.spent - b.limit).toLocaleString()}!`,
                                    bg: "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-400"
                                  };
                                } else if (ratio >= 80) {
                                  alertEl = {
                                    icon: "🟡",
                                    text: `Near Budget Limit: You have used ${ratio.toFixed(0)}% of your ${b.category} budget.`,
                                    bg: "bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-400"
                                  };
                                } else {
                                  alertEl = {
                                    icon: "🟢",
                                    text: `Within Budget: Your ${b.category} budget is healthy (${ratio.toFixed(0)}% spent).`,
                                    bg: "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  };
                                }

                                return (
                                  <div key={`alert-${b.category}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[11px] font-bold ${alertEl.bg}`}>
                                    <span>{alertEl.icon}</span>
                                    <span>{alertEl.text}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Progress bars */}
                            <div className="space-y-4">
                              {budgets.map((b) => {
                                const ratio = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                                const isOver = b.spent > b.limit;
                                return (
                                  <div key={`progress-${b.category}`} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                      <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isOver ? "bg-red-500 animate-pulse" : ratio >= 80 ? "bg-amber-500" : "bg-purple-500"}`}></span>
                                        {b.category}
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                        {getCurrencySymbol(globalCurrency)}{b.spent.toLocaleString(undefined, { minimumFractionDigits: 0 })} / {getCurrencySymbol(globalCurrency)}{b.limit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          isOver ? "bg-red-500" : ratio >= 80 ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"
                                        }`}
                                        style={{ width: `${Math.min(100, ratio)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right 1/3 Column: Recent Transactions list */}
                    <div className="space-y-6">
                      <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Recent Transactions</h3>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400">Latest 5 ledger entries</p>
                            </div>
                            <button
                              onClick={() => setActiveTab("expenses")}
                              className="text-xs text-purple-600 font-bold hover:underline"
                            >
                              View All
                            </button>
                          </div>

                          <div className="space-y-3">
                            {transactions.length === 0 ? (
                              <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium">
                                <i className="fa-solid fa-receipt text-xl text-slate-400 dark:text-slate-500 block mb-2"></i>
                                No transactions available yet.
                              </div>
                            ) : (
                              transactions.slice(0, 5).map((t) => {
                                const isIncome = t.type === "income";
                                return (
                                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:translate-x-1 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                                        isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500"
                                      }`}>
                                        <i className={`fa-solid ${isIncome ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}></i>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{t.title || t.description}</h4>
                                        <p className="text-[9px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">{t.category} • {new Date(t.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</p>
                                      </div>
                                    </div>
                                    <span className={`text-xs font-black font-mono ${isIncome ? "text-emerald-500" : "text-red-500"}`}>
                                      {isIncome ? "+" : "-"}{getCurrencySymbol(t.currency || globalCurrency)}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              )}

              {/* TAB 2: EXPENSES RECORDS */}
              {activeTab === "expenses" && (() => {
                // Compute filtered expenses
                const filteredExpenses = transactions
                  .filter(t => t.type === "expense")
                  .filter(t => {
                    const matchSearch = expenseSearch ? (
                      t.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                      (t.title && t.title.toLowerCase().includes(expenseSearch.toLowerCase()))
                    ) : true;
                    const matchCategory = expenseCategoryFilter !== "all" ? t.category.toLowerCase() === expenseCategoryFilter.toLowerCase() : true;
                    const matchMonth = expenseMonthFilter !== "all" ? t.date.startsWith(expenseMonthFilter) : true;
                    const matchStartDate = expenseStartDate ? t.date >= expenseStartDate : true;
                    const matchEndDate = expenseEndDate ? t.date <= expenseEndDate : true;
                    const matchMaxAmount = expenseMaxAmount ? t.amount <= parseFloat(expenseMaxAmount) : true;

                    return matchSearch && matchCategory && matchMonth && matchStartDate && matchEndDate && matchMaxAmount;
                  })
                  .sort((a, b) => {
                    if (expenseSortBy === "oldest") {
                      return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
                    } else if (expenseSortBy === "highest") {
                      return b.amount - a.amount;
                    } else if (expenseSortBy === "lowest") {
                      return a.amount - b.amount;
                    } else { // "newest"
                      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
                    }
                  });

                return (
                  <div className="space-y-6">
                    {/* PROFESSIONAL HEADER */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Expense Ledger</h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Audit, monitor, and configure corporate and personal outflows in real-time</p>
                      </div>
                      <button
                        onClick={() => { resetExpenseForm(); setIsExpenseModalOpen(true); }}
                        className="px-5 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-600 text-gray-900 dark:text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <i className="fa-solid fa-plus text-sm"></i> Add Expense
                      </button>
                    </div>

                    {/* EXPENSE SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* CARD 1: TOTAL MONTHLY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Total Monthly (July)</span>
                          <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-calendar-days"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                          <i className="fa-solid fa-circle-nodes"></i> System synchronizing active
                        </span>
                      </div>

                      {/* CARD 2: TODAY'S EXPENSE */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Today's Expense</span>
                          <span className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{todaysExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
                          Reference date: July 1, 2026
                        </span>
                      </div>

                      {/* CARD 3: HIGHEST CATEGORY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Highest Category</span>
                          <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-tags"></i>
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{highestExpenseCategory}</h2>
                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-1">
                          Cumulative: {currencySymbol}{highestExpenseCatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* CARD 4: AVERAGE DAILY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Daily Avg (July)</span>
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-chart-line"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{averageDailyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
                          Index basis: 30-day amortized
                        </span>
                      </div>
                    </div>

                    {/* FILTERS PANEL */}
                    <div className="glass-card p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400"><i className="fa-solid fa-sliders text-indigo-500"></i> &nbsp;Advanced Operations Filters</h3>
                        {(expenseSearch || expenseCategoryFilter !== "all" || expenseMonthFilter !== "all" || expenseStartDate || expenseEndDate || expenseMaxAmount) && (
                          <button
                            onClick={() => {
                              setExpenseSearch("");
                              setExpenseCategoryFilter("all");
                              setExpenseMonthFilter("all");
                              setExpenseStartDate("");
                              setExpenseEndDate("");
                              setExpenseMaxAmount("");
                            }}
                            className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"
                          >
                            <i className="fa-solid fa-rotate-left"></i> Reset Filters
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* 1. Search */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Search Description</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs">
                              <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                              type="text"
                              placeholder="Search vendors, titles..."
                              value={expenseSearch}
                              onChange={(e) => setExpenseSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* 2. Category Dropdown */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Category Node</label>
                          <select
                            value={expenseCategoryFilter}
                            onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                          >
                            <option value="all">All Categories</option>
                            <option value="Food">Food</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Transport">Transport</option>
                            <option value="Bills">Bills</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Education">Education</option>
                            <option value="Fuel">Fuel</option>
                            <option value="Rent">Rent</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Investment">Investment</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>

                        {/* 3. Filter by Month */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Filter by Month</label>
                          <select
                            value={expenseMonthFilter}
                            onChange={(e) => setExpenseMonthFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                          >
                            <option value="all">All Months</option>
                            {Array.from(new Set(transactions.filter(t => t.type === "expense").map(t => t.date.substring(0, 7)))).sort().reverse().map((m: any) => {
                              const [yr, mo] = (m as string).split("-");
                              const dt = new Date(parseInt(yr), parseInt(mo) - 1, 1);
                              return (
                                <option key={m} value={m}>
                                  {dt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* 4. Start Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">From Date</label>
                          <input
                            type="date"
                            value={expenseStartDate}
                            onChange={(e) => setExpenseStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                          />
                        </div>

                        {/* 5. End Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">To Date</label>
                          <input
                            type="date"
                            value={expenseEndDate}
                            onChange={(e) => setExpenseEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                          />
                        </div>

                        {/* 6. Max Amount */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Max Cap Amount</label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            value={expenseMaxAmount}
                            onChange={(e) => setExpenseMaxAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Sorting & Result Counts Row */}
                      <div className="flex justify-between items-center pt-2 text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">
                        <span>Showing <strong className="text-indigo-500">{filteredExpenses.length}</strong> outflow entries</span>
                        <div className="flex items-center gap-2">
                          <span>Sort by:</span>
                          <select
                            value={expenseSortBy}
                            onChange={(e) => setExpenseSortBy(e.target.value as any)}
                            className="bg-transparent text-indigo-500 hover:underline outline-none cursor-pointer font-black"
                          >
                            <option value="newest">Newest Dates</option>
                            <option value="oldest">Oldest Dates</option>
                            <option value="highest">Highest Values</option>
                            <option value="lowest">Lowest Values</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* TABLE AREA */}
                    <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-slate-200/40 dark:border-slate-800/30">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-[10px] font-black text-slate-600 dark:text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">
                              <th className="px-6 py-4">Date & Time</th>
                              <th className="px-6 py-4">Expense Title</th>
                              <th className="px-6 py-4">Category Node</th>
                              <th className="px-6 py-4 text-right">Outflow Amount</th>
                              <th className="px-6 py-4">Payment Node</th>
                              <th className="px-6 py-4">Description</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                            {transactions.filter(t => t.type === "expense").length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-600 dark:text-slate-400 dark:text-slate-400">
                                  <div className="flex flex-col items-center justify-center space-y-2">
                                    <i className="fa-solid fa-receipt text-slate-400 dark:text-slate-500 text-3xl mb-1"></i>
                                    <span className="font-bold text-sm block">No expenses added yet.</span>
                                    <span className="text-[10px]">Your outgoing expenses will appear here after you record them.</span>
                                  </div>
                                </td>
                              </tr>
                            ) : filteredExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">
                                  <div className="flex flex-col items-center justify-center gap-3">
                                    <span className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 dark:text-slate-400"><i className="fa-solid fa-folder-open text-xl"></i></span>
                                    <span>No expense transaction nodes found matching your query criteria.</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredExpenses.map((t) => {
                                // Category specific colors
                                const isCritical = t.amount > 300;
                                return (
                                  <tr key={t.id} className="text-xs hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors group">
                                    {/* Date & Time */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                                        {new Date(t.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-0.5">
                                        <i className="fa-solid fa-clock text-[9px]"></i> {t.time || "12:00 PM"}
                                      </div>
                                    </td>

                                    {/* Expense Title */}
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                      {t.title || t.description.split(" - ")[0] || t.description}
                                    </td>

                                    {/* Category Node */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-500/5 text-indigo-500 border-indigo-500/15">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                                        {t.category}
                                      </span>
                                    </td>

                                    {/* Outflow Amount */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                      <span className={`font-black text-[13px] ${isCritical ? "text-red-500" : "text-slate-800 dark:text-slate-100"}`}>
                                        -{t.currency || "USD"} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </span>
                                    </td>

                                    {/* Payment Method */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                                        <i className="fa-solid fa-credit-card text-[9px]"></i> {t.paymentMethod || "Cash"}
                                      </span>
                                    </td>

                                    {/* Description */}
                                    <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-slate-400 dark:text-slate-400" title={t.description}>
                                      {t.description}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                        t.status === "Completed"
                                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                                          : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                                      }`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                        {t.status}
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <div className="flex justify-center items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => { setViewingExpense(t); setIsViewModalOpen(true); }}
                                          className="w-7 h-7 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-all"
                                          title="View Details"
                                        >
                                          <i className="fa-solid fa-eye text-[11px]"></i>
                                        </button>
                                        <button
                                          onClick={() => handleEditExpenseClick(t)}
                                          className="w-7 h-7 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-all"
                                          title="Edit Record"
                                        >
                                          <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTransaction(t.id)}
                                          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"
                                          title="Delete Record"
                                        >
                                          <i className="fa-solid fa-trash-can text-[11px]"></i>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: INCOME RECORDS */}
              {activeTab === "income" && (() => {
                const incomeTransactionsList = transactions.filter(t => t.type === "income");
                
                const totalMonthlyIncome = parseFloat(
                  incomeTransactionsList
                    .filter(t => t.date.startsWith("2026-07"))
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)
                );

                const todaysIncome = parseFloat(
                  incomeTransactionsList
                    .filter(t => t.date === "2026-07-01")
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)
                );

                const incomeCategorySums: Record<string, number> = {};
                incomeTransactionsList.forEach(t => {
                  incomeCategorySums[t.category] = (incomeCategorySums[t.category] || 0) + t.amount;
                });
                let highestIncomeCategory = "N/A";
                let highestIncomeCatAmount = 0;
                Object.entries(incomeCategorySums).forEach(([cat, sum]) => {
                  if (sum > highestIncomeCatAmount) {
                    highestIncomeCatAmount = sum;
                    highestIncomeCategory = cat;
                  }
                });

                const averageDailyIncome = parseFloat((totalMonthlyIncome / 30).toFixed(2));

                const filteredIncomeTransactions = transactions
                  .filter(t => t.type === "income")
                  .filter(t => {
                    if (incomeSearch && !t.description.toLowerCase().includes(incomeSearch.toLowerCase()) && !(t.title || "").toLowerCase().includes(incomeSearch.toLowerCase())) {
                      return false;
                    }
                    if (incomeCategoryFilter !== "all" && t.category.toLowerCase() !== incomeCategoryFilter.toLowerCase()) {
                      return false;
                    }
                    if (incomeMonthFilter !== "all" && !t.date.startsWith(incomeMonthFilter)) {
                      return false;
                    }
                    if (incomeStartDate && t.date < incomeStartDate) {
                      return false;
                    }
                    if (incomeEndDate && t.date > incomeEndDate) {
                      return false;
                    }
                    if (incomeMaxAmount && t.amount > parseFloat(incomeMaxAmount)) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    if (incomeSortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
                    if (incomeSortBy === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
                    if (incomeSortBy === "highest") return b.amount - a.amount;
                    if (incomeSortBy === "lowest") return a.amount - b.amount;
                    return 0;
                  });

                return (
                  <div className="space-y-6">
                    {/* PROFESSIONAL HEADER */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Income Ledger</h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Audit, monitor, and record incoming money streams and revenue channels</p>
                      </div>
                      <button
                        onClick={() => { resetIncomeForm(); setIsIncomeModalOpen(true); }}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-500 dark:to-teal-600 text-gray-900 dark:text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <i className="fa-solid fa-wallet text-sm"></i> Record Income Deposit
                      </button>
                    </div>

                    {/* INCOME SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* CARD 1: TOTAL MONTHLY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Total Monthly Income</span>
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-calendar-days"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{totalMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                          <i className="fa-solid fa-circle-nodes"></i> Synchronizing Active
                        </span>
                      </div>

                      {/* CARD 2: TODAY'S INCOME */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Today's Income</span>
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{todaysIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
                          Reference date: July 1, 2026
                        </span>
                      </div>

                      {/* CARD 3: HIGHEST CATEGORY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Highest Source</span>
                          <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-tags"></i>
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{highestIncomeCategory}</h2>
                        <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mt-1">
                          Cumulative: {currencySymbol}{highestIncomeCatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* CARD 4: AVERAGE DAILY */}
                      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all"></div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400">Daily Avg (July)</span>
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">
                            <i className="fa-solid fa-chart-line"></i>
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{currencySymbol}{averageDailyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
                          Index basis: 30-day amortized
                        </span>
                      </div>
                    </div>

                    {/* FILTERS PANEL */}
                    <div className="glass-card p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400"><i className="fa-solid fa-sliders text-emerald-500"></i> &nbsp;Advanced Operations Filters</h3>
                        {(incomeSearch || incomeCategoryFilter !== "all" || incomeMonthFilter !== "all" || incomeStartDate || incomeEndDate || incomeMaxAmount) && (
                          <button
                            onClick={() => {
                              setIncomeSearch("");
                              setIncomeCategoryFilter("all");
                              setIncomeMonthFilter("all");
                              setIncomeStartDate("");
                              setIncomeEndDate("");
                              setIncomeMaxAmount("");
                            }}
                            className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1"
                          >
                            <i className="fa-solid fa-rotate-left"></i> Reset Filters
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* 1. Search */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Search Source</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs">
                              <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input
                              type="text"
                              placeholder="Search description, payer..."
                              value={incomeSearch}
                              onChange={(e) => setIncomeSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* 2. Category Dropdown */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Category Source</label>
                          <select
                            value={incomeCategoryFilter}
                            onChange={(e) => setIncomeCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                          >
                            <option value="all">All Categories</option>
                            <option value="Salary">Salary</option>
                            <option value="Business">Business</option>
                            <option value="Freelancing">Freelancing</option>
                            <option value="Investment">Investment</option>
                            <option value="Gift">Gift</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* 3. Filter by Month */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Filter by Month</label>
                          <select
                            value={incomeMonthFilter}
                            onChange={(e) => setIncomeMonthFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                          >
                            <option value="all">All Months</option>
                            {Array.from(new Set(transactions.filter(t => t.type === "income").map(t => t.date.substring(0, 7)))).sort().reverse().map((m: any) => {
                              const [yr, mo] = (m as string).split("-");
                              const dt = new Date(parseInt(yr), parseInt(mo) - 1, 1);
                              return (
                                <option key={m} value={m}>
                                  {dt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* 4. From Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">From Date</label>
                          <input
                            type="date"
                            value={incomeStartDate}
                            onChange={(e) => setIncomeStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                          />
                        </div>

                        {/* 5. To Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">To Date</label>
                          <input
                            type="date"
                            value={incomeEndDate}
                            onChange={(e) => setIncomeEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                          />
                        </div>

                        {/* 6. Max Amount */}
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Max Amount</label>
                          <input
                            type="number"
                            placeholder="e.g. 50000"
                            value={incomeMaxAmount}
                            onChange={(e) => setIncomeMaxAmount(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Sorting & Item Count indicator */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-semibold border-t border-slate-200/50 dark:border-slate-800/50">
                        <div>
                          Showing <span className="text-slate-800 dark:text-slate-100 font-bold">{filteredIncomeTransactions.length}</span> of <span className="text-slate-800 dark:text-slate-100 font-bold">{incomeTransactionsList.length}</span> recorded deposits
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Sort By:</span>
                          <select
                            value={incomeSortBy}
                            onChange={(e) => setIncomeSortBy(e.target.value as any)}
                            className="bg-transparent border-none text-emerald-500 font-bold outline-none text-[11px] cursor-pointer"
                          >
                            <option value="newest">Newest Deposits First</option>
                            <option value="oldest">Oldest Deposits First</option>
                            <option value="highest">Highest Amount</option>
                            <option value="lowest">Lowest Amount</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* INCOME LEDGER TABLE */}
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Category / Source</th>
                              <th className="px-6 py-4">Description</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {incomeTransactionsList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-600 dark:text-slate-400 dark:text-slate-400">
                                  <div className="flex flex-col items-center justify-center space-y-2">
                                    <i className="fa-solid fa-wallet text-slate-400 dark:text-slate-500 text-3xl mb-1"></i>
                                    <span className="font-bold text-sm block">No income added yet.</span>
                                    <span className="text-[10px]">Your cash inflows will appear here after you record them.</span>
                                  </div>
                                </td>
                              </tr>
                            ) : filteredIncomeTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">
                                  No income records matched the selected filters.
                                </td>
                              </tr>
                            ) : (
                              filteredIncomeTransactions.map((t) => (
                                <tr key={t.id} className="text-xs hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors group">
                                  {/* Date Node */}
                                  <td className="px-6 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-400 whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>

                                  {/* Category Node */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/5 text-emerald-500 border-emerald-500/15">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                      {t.category}
                                    </span>
                                  </td>

                                  {/* Description */}
                                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate" title={t.description}>
                                    {t.description}
                                  </td>

                                  {/* Amount */}
                                  <td className="px-6 py-4 text-right whitespace-nowrap font-black text-emerald-500 text-[13px]">
                                    +{getCurrencySymbol(t.currency || globalCurrency)}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>

                                  {/* Status */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                      t.status === "Completed"
                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10"
                                        : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                      {t.status}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex justify-center items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => { setViewingExpense(t); setIsViewModalOpen(true); }}
                                        className="w-7 h-7 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-all"
                                        title="View Details"
                                      >
                                        <i className="fa-solid fa-eye text-[11px]"></i>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setIncomeForm({
                                            id: t.id,
                                            category: t.category,
                                            amount: t.amount.toString(),
                                            date: t.date,
                                            description: t.description,
                                            currency: t.currency || globalCurrency,
                                            status: t.status as any
                                          });
                                          setIsIncomeModalOpen(true);
                                        }}
                                        className="w-7 h-7 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-all"
                                        title="Edit Deposit"
                                      >
                                        <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(t.id)}
                                        className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-red-500 flex items-center justify-center transition-all"
                                        title="Delete Deposit"
                                      >
                                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: BUDGET PLANNER */}
              {activeTab === "budget" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Budget Allocation</h1>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Configure threshold allocations to mitigate overflow risk</p>
                    </div>
                    <button
                      onClick={() => {
                        setBudgetModalError(null);
                        setIsBudgetModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-500 dark:to-yellow-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-sliders"></i> Create Budget Limit
                    </button>
                  </div>

                  {/* DIRECT ON-SCREEN EXCEED WARNING BANNER */}
                  {(() => {
                    const totalAllocated = budgets.reduce((sum, b) => sum + b.limit, 0);
                    const isExceeded = totalIncome > 0 && totalAllocated > totalIncome;
                    if (!isExceeded) return null;
                    return (
                      <div className="bg-red-500/10 border-2 border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 text-red-500 font-black text-lg">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-red-600 dark:text-red-300">Budget Limit Exceeded!</h4>
                            <p className="text-xs text-red-500/90 font-medium mt-0.5">
                              Your total allocated budget ({getCurrencySymbol(globalCurrency)}{totalAllocated.toLocaleString()}) exceeds your given monthly income of {getCurrencySymbol(globalCurrency)}{totalIncome.toLocaleString()} by {getCurrencySymbol(globalCurrency)}{(totalAllocated - totalIncome).toLocaleString()}. Please adjust your limits so total budget stays within your income.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setBudgetModalError(null);
                            setIsBudgetModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-red-500 text-white font-bold text-xs rounded-xl shrink-0 hover:bg-red-600 transition-all cursor-pointer shadow-md"
                        >
                          Adjust Budget
                        </button>
                      </div>
                    );
                  })()}

                  {budgets.length === 0 ? (
                    <div className="glass-card p-12 text-center text-slate-600 dark:text-slate-400 dark:text-slate-400 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                        <i className="fa-solid fa-sliders text-3xl"></i>
                      </div>
                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Budget = Not Created</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Your budget targets will appear dynamically once you set up your income.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {budgets.map((b, i) => {
                        const ratio = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                        const isOver = b.spent > b.limit;
                        return (
                          <div key={i} className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{b.category}</h3>
                                <div className="flex items-center gap-2">
                                  {isOver ? (
                                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded">OVER BUDGET</span>
                                  ) : (
                                    <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-bold px-2 py-0.5 rounded">{ratio.toFixed(0)}% SPENT</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setBudgetModalError(null);
                                      setNewBudget({ category: b.category, limit: b.limit.toString() });
                                      setIsBudgetModalOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors text-xs cursor-pointer"
                                    title="Edit Budget Limit"
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-baseline gap-1 mt-1 mb-5">
                                <span className="text-2xl font-black">{currencySymbol}{b.spent}</span>
                                <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 text-xs font-medium">of {currencySymbol}{b.limit} limit</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOver ? "bg-red-500" : ratio > 80 ? "bg-amber-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${Math.min(100, ratio)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium">
                                <span>Remaining: {currencySymbol}{(b.limit - b.spent).toFixed(2)}</span>
                                <span>Allocated Max: {currencySymbol}{b.limit}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SAVINGS GOALS */}
              {activeTab === "savings" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Savings & Wealth Goals</h1>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Configure targeted saving vaults and deposit logs</p>
                    </div>
                    <button
                      onClick={() => setIsGoalModalOpen(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                      <i className="fa-solid fa-bullseye"></i> Set Saving Target
                    </button>
                  </div>

                  {savingsGoals.length === 0 ? (
                    <div className="glass-card p-12 text-center text-slate-600 dark:text-slate-400 dark:text-slate-400 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                        <i className="fa-solid fa-bullseye text-3xl"></i>
                      </div>
                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">No savings targets set yet.</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Create targeted savings vaults to track and log your security and purchase goals.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savingsGoals.map((g) => {
                        const ratio = (g.saved / g.target) * 100;
                        return (
                          <div key={g.id} className="glass-card p-6 rounded-2xl space-y-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                                <i className={`fa-solid ${g.icon} text-lg`}></i>
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{g.name}</h3>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400">Security savings vault</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span>Saved Progress</span>
                                <span className="font-mono">{ratio.toFixed(1)}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${ratio}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-1.5 font-medium">
                                <span>Current: {currencySymbol}{g.saved}</span>
                                <span>Target: {currencySymbol}{g.target}</span>
                              </div>
                            </div>

                            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">Contribution Deposit</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder={`Amount (${currencySymbol})`}
                                  id={`contrib_${g.id}`}
                                  className="flex-1 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs"
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`contrib_${g.id}`) as HTMLInputElement;
                                    if (input) {
                                      handleContributeToGoal(g.id, input.value);
                                      input.value = "";
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500 text-emerald-700 dark:text-white font-bold text-xs rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-600 transition-all shrink-0"
                                >
                                  Deposit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: REPORTS & STATS */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Reports & Financial Auditing</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Configure filtering parameters and export compiled PDFs/CSVs</p>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="glass-card p-12 text-center text-slate-600 dark:text-slate-400 dark:text-slate-400 rounded-3xl flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                        <i className="fa-solid fa-chart-column text-3xl"></i>
                      </div>
                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">No reports available yet.</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Reports will appear after you start tracking your finances.
                        </p>
                      </div>
                      <button
                        onClick={() => { setActiveTab("dashboard"); }}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-500 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-600 dark:hover:to-indigo-700 text-gray-900 dark:text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* General Summary Node */}
                        <div className="glass-card p-6 rounded-2xl space-y-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Statement Ledger Balance Sheet</h3>
                          <div className="space-y-3 font-mono text-xs">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span>Total Recorded Deposits:</span>
                              <span className="text-emerald-500 font-bold">{getCurrencySymbol(globalCurrency)}{totalIncome.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span>Total Recorded Outgoings:</span>
                              <span className="text-red-500 font-bold">{getCurrencySymbol(globalCurrency)}{totalExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <span>Allocated Savings Commitments:</span>
                              <span className="text-purple-500 font-bold">{getCurrencySymbol(globalCurrency)}{totalSavings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm pt-2">
                              <span>Net Cash Flow Liquidity:</span>
                              <span className={totalBalance >= 0 ? "text-emerald-500" : "text-red-500"}>
                                {getCurrencySymbol(globalCurrency)}{totalBalance.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Export Terminal */}
                        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <div>
                            <h3 className="font-bold text-sm mb-1 text-slate-800 dark:text-slate-200">Corporate Ledger Export Portal</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">Download cryptographically signed records for taxation auditing</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-6">
                            <button 
                              onClick={handleExportPDF}
                              className="py-3 bg-purple-100 dark:bg-purple-500 text-purple-700 dark:text-white font-bold text-xs rounded-xl hover:bg-purple-200 dark:hover:bg-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15 cursor-pointer active:scale-95"
                            >
                              <i className="fa-solid fa-file-pdf"></i> PDF Statement
                            </button>
                            <button 
                              onClick={handleExportCSV}
                              className="py-3 bg-emerald-100 dark:bg-emerald-500 text-emerald-700 dark:text-white font-bold text-xs rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 cursor-pointer active:scale-95"
                            >
                              <i className="fa-solid fa-download"></i> CSV Spreadsheet
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Analysis Reports & Charts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Chart 1: Income vs Expense Bar Chart */}
                        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans">Income vs Expenses</h3>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono">Last 6 Months</span>
                          </div>
                          <div className="h-56 relative w-full flex items-center justify-center">
                            <canvas ref={barChartRef}></canvas>
                          </div>
                        </div>

                        {/* Chart 2: Monthly Expense Trend Line Chart */}
                        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans">Monthly Spending Trend</h3>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono">Continuous Stream</span>
                          </div>
                          <div className="h-56 relative w-full flex items-center justify-center">
                            <canvas ref={lineChartRef}></canvas>
                          </div>
                        </div>

                        {/* Chart 3: Expense Category Distribution Pie Chart */}
                        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans">Category Distribution</h3>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono">Breakdown Ratios</span>
                          </div>
                          <div className="h-56 relative w-full flex items-center justify-center">
                            <canvas ref={pieChartRef}></canvas>
                          </div>
                        </div>

                        {/* Chart 4: Savings Goal Doughnut Chart */}
                        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans">Savings Target Progress</h3>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 font-mono">Overall Ratio</span>
                          </div>
                          <div className="h-56 relative w-full flex items-center justify-center">
                            <canvas ref={doughnutChartRef}></canvas>
                          </div>
                        </div>
                      </div>

                      {/* Budget Usage Progress Section */}
                      <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 mt-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Budget Usage Progress</h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Overview of spent amounts against your category budget caps</p>
                          </div>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md font-mono font-bold">
                            {budgets.length} Budget Targets
                          </span>
                        </div>

                        {budgets.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 font-medium">
                            <i className="fa-solid fa-sliders text-xl text-purple-400 block mb-2"></i>
                            Budget not created yet. Use the Smart Budget tool to generate your targets!
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {budgets.map((b) => {
                              const ratio = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                              const isOver = b.spent > b.limit;
                              const currencySymbol = getCurrencySymbol(globalCurrency);
                              return (
                                <div key={`report-budget-${b.category}`} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
                                    <span className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${isOver ? "bg-red-500 animate-pulse" : ratio >= 80 ? "bg-amber-500" : "bg-purple-500"}`}></span>
                                      {b.category}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                      {currencySymbol}{b.spent.toLocaleString()} / {currencySymbol}{b.limit.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isOver ? "bg-red-500" : ratio >= 80 ? "bg-amber-500" : "bg-indigo-500"
                                      }`}
                                      style={{ width: `${Math.min(100, ratio)}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className={isOver ? "text-red-500" : ratio >= 80 ? "text-amber-500" : "text-emerald-500"}>
                                      {isOver ? `Exceeded by ${currencySymbol}${(b.spent - b.limit).toLocaleString()}` : `${Math.round(100 - ratio)}% Remaining`}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400">
                                      {Math.round(ratio)}% Used
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 7: PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">My Profile Settings</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Update authentication details and user bio configurations</p>
                  </div>

                  <div className="glass-card p-8 rounded-2xl max-w-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl shrink-0">
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <h3 className="text-lg font-bold">{profile.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400">{profile.role}</p>
                        <p className="text-[11px] text-indigo-500 font-semibold">{profile.email}</p>
                      </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); alert("Profile records synchronized!"); }} className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">User Handle Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">Corporate Position</label>
                        <input
                          type="text"
                          value={profile.role}
                          onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button type="submit" className="px-5 py-2.5 bg-indigo-100 dark:bg-indigo-500 text-indigo-700 dark:text-white font-bold text-xs rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-600 transition-all">
                          Save Sync Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Account Settings</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Configure global application state, local cache and theme options</p>
                  </div>

                  <div className="glass-card p-6 rounded-2xl max-w-xl space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">Application Dark Mode</h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400">Optimize visual thresholds for late-night audits</p>
                      </div>
                      <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${theme === "dark" ? "bg-indigo-500" : "bg-slate-300"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${theme === "dark" ? "translate-x-6" : "translate-x-0"}`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </main>

          </div>

          {/* ADD / EDIT EXPENSE MODAL */}
          {isExpenseModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="w-full max-w-lg glass-card rounded-2xl overflow-hidden relative my-8">
                <div className="h-1.5 bg-indigo-500"></div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                      <i className="fa-solid fa-receipt text-indigo-500"></i> &nbsp;
                      {expenseForm.id ? "Edit Expense" : "Add Expense"}
                    </h3>
                    <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>

                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    {/* Title input */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Expense Title / Vendor (Required)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Starbucks Breakfast, AWS Hosting Bill"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Amount (Required)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min="0"
                          placeholder="0.00"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Currency</label>
                        <select
                          value={expenseForm.currency}
                          onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                          <option value="GBP">GBP (£) - British Pound</option>
                          <option value="JPY">JPY (¥) - Japanese Yen</option>
                          <option value="CAD">CAD ($) - Canadian Dollar</option>
                        </select>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Date (Required)</label>
                        <input
                          type="date"
                          required
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Time</label>
                        <input
                          type="time"
                          value={expenseForm.time}
                          onChange={(e) => setExpenseForm({ ...expenseForm, time: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Category & Payment Method */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Category (Required)</label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Food">Food</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Transport">Transport</option>
                          <option value="Bills">Bills</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Education">Education</option>
                          <option value="Fuel">Fuel</option>
                          <option value="Rent">Rent</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Investment">Investment</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Payment Channel</label>
                        <select
                          value={expenseForm.paymentMethod}
                          onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                          className="w-full px-3 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Wallet">Wallet</option>
                        </select>
                      </div>
                    </div>

                    {/* Status dropdown */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Status</label>
                      <select
                        value={expenseForm.status}
                        onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as any })}
                        className="w-full px-3 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      >
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    {/* Description Textarea */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Provide details about receipt, project cost centers, allocation audits..."
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                      />
                    </div>

                    {/* RECEIPT UPLOAD CONTAINER */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400">Receipt Upload</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500/50 transition-colors relative group bg-slate-100/10 dark:bg-slate-900/10">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setExpenseForm(prev => ({
                                ...prev,
                                receiptUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60",
                                receiptName: file.name
                              }));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <i className="fa-solid fa-cloud-arrow-up text-lg text-indigo-500 group-hover:scale-110 transition-transform"></i>
                          <p className="text-[10px] font-bold">Drag & Drop Receipt or <span className="text-indigo-500">Browse Files</span></p>
                          <p className="text-[9px] text-slate-600 dark:text-slate-400 dark:text-slate-400">PDF, JPEG, or PNG supported up to 5MB</p>
                        </div>
                      </div>
                      {expenseForm.receiptName && (
                        <div className="flex items-center justify-between p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] font-bold text-indigo-500">
                          <div className="flex items-center gap-1.5 truncate">
                            <i className="fa-solid fa-receipt"></i>
                            <span className="truncate">{expenseForm.receiptName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpenseForm(prev => ({ ...prev, receiptUrl: "", receiptName: "" }))}
                            className="text-red-500 hover:scale-110 transition-transform"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsExpenseModalOpen(false)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-600 text-gray-900 dark:text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all">
                        {expenseForm.id ? "Save Changes" : "Add Expense"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* VIEW DETAILS MODAL */}
          {isViewModalOpen && viewingExpense && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50">
                <div className="h-1.5 bg-indigo-500"></div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white"><i className="fa-solid fa-eye text-indigo-500"></i> &nbsp;Transaction Details</h3>
                    <button onClick={() => { setIsViewModalOpen(false); setViewingExpense(null); }} className="text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Header values */}
                    <div className="text-center py-4 bg-slate-100/30 dark:bg-slate-900/20 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 dark:text-slate-400 block mb-1">Transaction Value</span>
                      <h2 className="text-3xl font-black text-red-500">
                        -{viewingExpense.currency || "USD"} {viewingExpense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1 block">ID: {viewingExpense.id}</span>
                    </div>

                    {/* Metadata List */}
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Expense Title / Vendor:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-black">{viewingExpense.title || viewingExpense.description.split(" - ")[0]}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Category:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500">{viewingExpense.category}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Date:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{new Date(viewingExpense.date).toLocaleDateString("en-US", { dateStyle: "long" })}</span>
                      </div>
                      {viewingExpense.time && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                          <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Time:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">{viewingExpense.time}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Payment Channel:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold"><i className="fa-solid fa-wallet text-[9px] mr-1"></i> {viewingExpense.paymentMethod || "Cash"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${viewingExpense.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{viewingExpense.status}</span>
                      </div>
                      <div className="py-1.5">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold block mb-1">Notes:</span>
                        <p className="text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 leading-relaxed text-[11px]">
                          {viewingExpense.description || "No supplemental description uploaded."}
                        </p>
                      </div>
                      
                      {/* Receipt Preview if exists */}
                      <div className="py-2">
                        <span className="text-slate-600 dark:text-slate-400 dark:text-slate-400 font-bold block mb-1.5">Receipt Document:</span>
                        {viewingExpense.receiptUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 group">
                            <img referrerPolicy="no-referrer" src={viewingExpense.receiptUrl} alt="Receipt Preview" className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={viewingExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500 text-indigo-700 dark:text-white font-bold text-[10px] rounded-lg">Open Original</a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400">
                            <i className="fa-solid fa-receipt text-slate-400 dark:text-slate-500 text-sm mb-1 block"></i> No receipt attached for this transaction
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => { setIsViewModalOpen(false); setViewingExpense(null); }}
                      className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-sm glass-card rounded-2xl overflow-hidden relative border border-slate-200/50 dark:border-slate-800/50">
                <div className="h-1.5 bg-red-500"></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-lg shrink-0">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white">Delete Expense Record?</h3>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-400 mt-0.5">ID: {expenseToDeleteId}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-400 leading-relaxed">
                    Are you sure you want to delete this expense? This action is permanent and cannot be undone.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setIsDeleteConfirmOpen(false); setExpenseToDeleteId(null); }}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteExpenseConfirm}
                      className="flex-1 py-2.5 bg-red-100 dark:bg-red-500 hover:bg-red-200 dark:hover:bg-red-600 text-red-700 dark:text-white font-black text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all"
                    >
                      Confirm Purge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADD / EDIT INCOME MODAL */}
          {isIncomeModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden relative">
                <div className="h-1.5 bg-emerald-500"></div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                      <i className="fa-solid fa-wallet text-emerald-500"></i> &nbsp;
                      {incomeForm.id ? "Edit Income" : "Add Income"}
                    </h3>
                    <button onClick={() => setIsIncomeModalOpen(false)} className="text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>

                  <form onSubmit={handleAddIncome} className="space-y-4 font-sans">
                    {/* Income Source Category */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Income Source (Required)</label>
                      <select
                        value={incomeForm.category}
                        onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-bold"
                      >
                        <option value="Salary">Salary</option>
                        <option value="Business">Business</option>
                        <option value="Freelancing">Freelancing</option>
                        <option value="Investment">Investment</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Monthly Income Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Monthly Income ({getCurrencySymbol(incomeForm.currency || globalCurrency)}) (Required)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min="0"
                          placeholder="0.00"
                          value={incomeForm.amount}
                          onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Date (Required)</label>
                        <input
                          type="date"
                          required
                          value={incomeForm.date}
                          onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>
                    </div>

                    {/* Currency & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Currency</label>
                        <select
                          value={incomeForm.currency}
                          onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Status</label>
                        <select
                          value={incomeForm.status}
                          onChange={(e) => setIncomeForm({ ...incomeForm, status: e.target.value as any })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100"
                        >
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Notes / Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly salary payout, bonus, dividends, gift..."
                        value={incomeForm.description}
                        onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-500 dark:to-teal-600 text-gray-900 dark:text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all">
                      {incomeForm.id ? "Save Changes" : "Add Income"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SET BUDGET MODAL */}
          {isBudgetModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden relative">
                <div className="h-1.5 bg-amber-500"></div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white"><i className="fa-solid fa-sliders text-amber-500"></i> &nbsp;Configure Category Budget Limit</h3>
                    <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-900 dark:hover:text-slate-100 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                  </div>

                  <form onSubmit={handleSetBudget} className="space-y-4">
                    {budgetModalError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation text-base shrink-0"></i>
                        <span>{budgetModalError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 mb-1">Target Category</label>
                      <select
                        value={newBudget.category}
                        onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-bold"
                      >
                        <option value="Food & Dining">Food & Dining</option>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Transport">Transport</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Housing">Housing</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Bills & Utilities">Bills & Utilities</option>
                        <option value="Bills">Bills</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Savings">Savings</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Emergency Fund">Emergency Fund</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 mb-1">Budget Threshold Limit ({getCurrencySymbol(globalCurrency)})</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 500"
                        value={newBudget.limit}
                        onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </div>

                    {/* Live Total Budget Vs Given Income Calculation */}
                    {(() => {
                      const val = parseFloat(newBudget.limit) || 0;
                      const existingIndex = budgets.findIndex(b => b.category.toLowerCase() === newBudget.category.toLowerCase());
                      const oldVal = existingIndex >= 0 ? budgets[existingIndex].limit : 0;
                      const currentTotal = budgets.reduce((s, b) => s + b.limit, 0);
                      const prospectiveTotal = currentTotal - oldVal + val;
                      const isExceeded = totalIncome > 0 && prospectiveTotal > totalIncome;
                      return (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                            <span>Given Monthly Income:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-100">{getCurrencySymbol(globalCurrency)}{totalIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                            <span>Total Allocated Budget:</span>
                            <span className={`font-mono ${isExceeded ? "text-red-500 font-black" : "text-amber-500 font-black"}`}>{getCurrencySymbol(globalCurrency)}{prospectiveTotal.toLocaleString()}</span>
                          </div>
                          {isExceeded && (
                            <p className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 pt-1 leading-snug">
                              <i className="fa-solid fa-triangle-exclamation"></i> Total budget exceeds given income by {getCurrencySymbol(globalCurrency)}{(prospectiveTotal - totalIncome).toLocaleString()}! Please reduce this limit.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    <button type="submit" className="w-full py-3 bg-amber-100 dark:bg-amber-500 text-amber-700 dark:text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:bg-amber-600 transition-all cursor-pointer">
                      Save Budget Boundary
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* CREATE GOALS MODAL */}
          {isGoalModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden relative">
                <div className="h-1.5 bg-indigo-500"></div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-white"><i className="fa-solid fa-bullseye text-indigo-500"></i> &nbsp;Set Saving Target Goal</h3>
                    <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-900 dark:hover:text-slate-100 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                  </div>

                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Goal Label Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dream House, Tesla Model Y"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Target Amount ($)</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 5000"
                          value={newGoal.target}
                          onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Initial Savings ($)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1000"
                          value={newGoal.saved}
                          onChange={(e) => setNewGoal({ ...newGoal, saved: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1">Icon Representation</label>
                      <select
                        value={newGoal.icon}
                        onChange={(e) => setNewGoal({ ...newGoal, icon: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs"
                      >
                        <option value="fa-laptop">Laptop (Technology)</option>
                        <option value="fa-car">Car (Automobile)</option>
                        <option value="fa-house-chimney">House (Real Estate)</option>
                        <option value="fa-plane">Airplane (Travel)</option>
                        <option value="fa-piggy-bank">Piggy Bank (Savings)</option>
                        <option value="fa-shield-halved">Shield (Emergency Vault)</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full py-3 bg-indigo-100 dark:bg-indigo-500 text-indigo-700 dark:text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 transition-all">
                      Deploy Saving Target
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* FIRST INCOME & SMART BUDGET WIZARD MODAL */}
          {isAddFirstIncomeModalOpen && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl border border-slate-100 dark:border-slate-800 my-8">
                {/* Visual Accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600"></div>

                <div className="p-8 space-y-6">
                  {/* Title & Close */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-lg tracking-tight text-slate-950 dark:text-white">
                        <i className="fa-solid fa-wand-magic-sparkles text-purple-600 mr-2"></i>
                        Smart Onboarding Wizard
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Let's initialize your monthly budget plan and revenue streams</p>
                    </div>
                    <button
                      onClick={() => setIsAddFirstIncomeModalOpen(false)}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  {/* Wizard Step Indicator */}
                  <div className="flex items-center justify-center gap-2 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition-colors ${
                        firstIncomeStep === 1
                          ? "bg-purple-100 dark:bg-purple-600 text-purple-700 dark:text-white shadow-md shadow-purple-500/10"
                          : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                      }`}>
                        {firstIncomeStep > 1 ? <i className="fa-solid fa-check"></i> : "1"}
                      </div>
                      <span className={`text-xs font-bold ${firstIncomeStep === 1 ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400 dark:text-slate-400"}`}>
                        Income Details
                      </span>
                    </div>
                    <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition-colors ${
                        firstIncomeStep === 2
                          ? "bg-purple-100 dark:bg-purple-600 text-purple-700 dark:text-white shadow-md shadow-purple-500/10"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 dark:text-slate-400"
                      }`}>
                        2
                      </div>
                      <span className={`text-xs font-bold ${firstIncomeStep === 2 ? "text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400 dark:text-slate-400"}`}>
                        Budget Planner
                      </span>
                    </div>
                  </div>

                  {/* STEP 1: ADD FIRST INCOME */}
                  {firstIncomeStep === 1 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const amount = parseFloat(firstIncomeAmount);
                        if (isNaN(amount) || amount <= 0) {
                          alert("Please enter a valid monthly income greater than 0!");
                          return;
                        }
                        setFirstIncomeError(null);
                        setIsEditingBudget(false);
                        setFirstIncomeStep(2);
                      }}
                      className="space-y-5"
                    >
                      <div className="space-y-4">
                        {/* Monthly Income Amount */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">
                            Monthly Income Amount (Required)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 dark:text-slate-400 font-extrabold text-xs">
                              {getCurrencySymbol(firstIncomeCurrency)}
                            </span>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="1"
                              placeholder="e.g. 75000"
                              value={firstIncomeAmount}
                              onChange={(e) => setFirstIncomeAmount(e.target.value)}
                              className="w-full pl-10 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-purple-500 font-bold"
                            />
                          </div>
                        </div>

                        {/* Salary Date & Currency Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">
                              Salary / Deposit Date
                            </label>
                            <input
                              type="date"
                              required
                              value={firstIncomeDate}
                              onChange={(e) => setFirstIncomeDate(e.target.value)}
                              className="w-full px-4 py-3.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-purple-500 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 dark:text-slate-400 mb-1.5">
                              Default Currency
                            </label>
                            <select
                              value={firstIncomeCurrency}
                              onChange={(e) => setFirstIncomeCurrency(e.target.value as any)}
                              className="w-full px-3 py-3.5 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs transition-all focus:border-purple-500 text-slate-800 dark:text-slate-100 font-bold"
                            >
                              <option value="INR">INR (₹) - Indian Rupee</option>
                              <option value="USD">USD ($) - US Dollar</option>
                              <option value="EUR">EUR (€) - Euro</option>
                              <option value="GBP">GBP (£) - British Pound</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Continue Button */}
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-500 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-600 dark:hover:to-indigo-700 text-gray-900 dark:text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all uppercase tracking-wider active:scale-[0.99] cursor-pointer"
                      >
                        Generate Smart Budget &nbsp;<i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </form>
                  )}

                  {/* STEP 2: EDIT SMART BUDGET PLAN */}
                  {firstIncomeStep === 2 && (
                    <div className="space-y-6">
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl p-5 border border-purple-100/50 dark:border-purple-900/30">
                        <h4 className="text-xs font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <i className="fa-solid fa-wand-magic-sparkles text-purple-600 animate-pulse"></i>
                          Smart Budget Recommendation
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-purple-300/90 mt-2 leading-relaxed">
                          Based on your monthly income, <strong>Smart Expense Tracker Pro</strong> has prepared a recommended monthly budget. You can accept it or customize it.
                        </p>
                      </div>

                      {/* DIRECT ON-SCREEN WARNING BANNER IF EXCEEDED */}
                      {(() => {
                        const totalAllocated = (Object.values(firstBudgets) as number[]).reduce((sum, v) => sum + v, 0);
                        const incomeNum = parseFloat(firstIncomeAmount) || 0;
                        const isExceeded = incomeNum > 0 && totalAllocated > incomeNum;
                        if (!isExceeded && !firstIncomeError) return null;
                        return (
                          <div className="bg-red-500/10 border-2 border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex flex-col gap-1.5 shadow-sm text-xs font-bold animate-pulse">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-red-600 dark:text-red-300">
                              <i className="fa-solid fa-triangle-exclamation text-base"></i>
                              <span>Cannot Save Budget! Total Allocated Exceeds Monthly Income</span>
                            </div>
                            <p className="text-xs text-red-500/90 font-medium leading-relaxed">
                              {firstIncomeError || `Your total allocated budget (${getCurrencySymbol(firstIncomeCurrency)}${totalAllocated.toLocaleString()}) exceeds your given monthly income of ${getCurrencySymbol(firstIncomeCurrency)}${incomeNum.toLocaleString()} by ${getCurrencySymbol(firstIncomeCurrency)}${(totalAllocated - incomeNum).toLocaleString()}. Please adjust your category limits so total budget stays within your income.`}
                            </p>
                          </div>
                        );
                      })()}

                      {!isEditingBudget ? (
                        /* Read-only view with Accept & Customize options */
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                            {[
                              { label: "Savings (20%)", val: firstBudgets.savings, color: "bg-emerald-500" },
                              { label: "Food (15%)", val: firstBudgets.food, color: "bg-indigo-500" },
                              { label: "Transport (10%)", val: firstBudgets.transport, color: "bg-blue-500" },
                              { label: "Shopping (10%)", val: firstBudgets.shopping, color: "bg-pink-500" },
                              { label: "Bills & Utilities (20%)", val: firstBudgets.bills, color: "bg-amber-500" },
                              { label: "Entertainment (5%)", val: firstBudgets.entertainment, color: "bg-purple-500" },
                              { label: "Healthcare (5%)", val: firstBudgets.healthcare, color: "bg-red-500" },
                              { label: "Education (5%)", val: firstBudgets.education, color: "bg-teal-500" },
                              { label: "Emergency Fund (5%)", val: firstBudgets.emergency, color: "bg-orange-500" },
                              { label: "Others (5%)", val: firstBudgets.others, color: "bg-slate-500" }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                                  {item.label}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {getCurrencySymbol(firstIncomeCurrency)}{item.val.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                handleSaveFirstIncomeAndBudget(e as any);
                              }}
                              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-500 dark:to-teal-600 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-gray-900 dark:text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                            >
                              ✅ Accept Budget
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingBudget(true)}
                              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                              ✏ Edit Budget
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Editable Form */
                        <form onSubmit={handleSaveFirstIncomeAndBudget} className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-1">
                            {/* Savings */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Savings (20%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.savings}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, savings: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Food */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  Food (15%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.food}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, food: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Transport */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Transport (10%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.transport}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, transport: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Shopping */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                  Shopping (10%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.shopping}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, shopping: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Bills & Utilities */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  Bills & Utilities (20%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.bills}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, bills: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Entertainment */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  Entertainment (5%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.entertainment}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, entertainment: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Healthcare */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Healthcare (5%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.healthcare}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, healthcare: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Education */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                  Education (5%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.education}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, education: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Emergency Fund */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                  Emergency Fund (5%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.emergency}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, emergency: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>

                            {/* Others */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                  Others (5%)
                                </span>
                              </div>
                              <input
                                type="number"
                                required
                                min="0"
                                value={firstBudgets.others}
                                onChange={(e) => setFirstBudgets({ ...firstBudgets, others: Math.round(parseFloat(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-black text-slate-800 dark:text-slate-100"
                              />
                            </div>
                          </div>

                          {/* Summary back/save buttons */}
                          <div className="flex justify-between items-center text-xs font-bold px-1 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingBudget(false)}
                              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-black text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              <i className="fa-solid fa-arrow-left"></i> &nbsp;Back
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-500 dark:to-indigo-600 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-600 dark:hover:to-indigo-700 text-gray-900 dark:text-white rounded-xl transition-all shadow-md font-black cursor-pointer"
                            >
                              Confirm & Save Budget Plan &nbsp;<i className="fa-solid fa-check"></i>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
