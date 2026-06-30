import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  Coins,
  TrendingDown,
  TrendingUp,
  LogOut,
  Sun,
  Moon,
  PlusCircle,
  Calendar,
  PieChart as PieIcon,
  Settings,
  AlertTriangle,
  CheckCircle,
  Trash2,
  User,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Expense, WalletConfig, AuthMode } from "./types";
import AIChatBot from "./components/AIChatBot";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CATEGORIES = [
  "🍔 Ăn uống",
  "🚗 Di chuyển",
  "🛍️ Mua sắm",
  "⚡ Hóa đơn",
  "🎈 Giải trí",
  "🔮 Khác",
];

const COLORS = [
  "#f43f5e", // rose-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#eab308", // yellow-500
  "#06b6d4", // cyan-500
  "#64748b", // slate-500
];

export default function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // --- APP STATE ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [config, setConfig] = useState<WalletConfig>({
    initialBudget: 0,
    maxSingleSpend: 5000000,
    warningThreshold: 500000,
  });
  const [activeTab, setActiveTab] = useState<"add" | "stats" | "config">("add");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // --- FORM STATE ---
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("🍔 Ăn uống");
  const [formDate, setFormDate] = useState("");
  const [formNote, setFormNote] = useState("");

  // --- QUICK DEPOSIT STATE ---
  const [depositAmount, setDepositAmount] = useState("");

  // --- USER ACCOUNT MANAGEMENT STATE ---
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUpdateUsernameModal, setShowUpdateUsernameModal] = useState(false);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernameModalError, setUsernameModalError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordModalError, setPasswordModalError] = useState("");

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteModalError, setDeleteModalError] = useState("");

  // --- NOTIFICATION STATE ---
  const [successBanner, setSuccessBanner] = useState("");
  const [warningBanner, setWarningBanner] = useState("");

  // Check login and theme on mount
  useEffect(() => {
    const active = localStorage.getItem("pro_active_user") || "";
    setCurrentUser(active);

    const savedTheme = (localStorage.getItem("pro_theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      const storedExpenses = localStorage.getItem(`pro_exp_${currentUser}`);
      if (storedExpenses) {
        try {
          setExpenses(JSON.parse(storedExpenses));
        } catch (e) {
          setExpenses([]);
        }
      } else {
        setExpenses([]);
      }

      const storedConfig = localStorage.getItem(`pro_cfg_${currentUser}`);
      if (storedConfig) {
        try {
          setConfig(JSON.parse(storedConfig));
        } catch (e) {
          setConfig({ initialBudget: 0, maxSingleSpend: 5000000, warningThreshold: 500000 });
        }
      } else {
        setConfig({ initialBudget: 0, maxSingleSpend: 5000000, warningThreshold: 500000 });
      }

      // If it's a completely new registration, redirect to config tab
      const isNew = localStorage.getItem(`pro_is_new_${currentUser}`);
      if (isNew === "true") {
        localStorage.removeItem(`pro_is_new_${currentUser}`);
        setActiveTab("config");
        triggerSuccessBanner("Chào mừng bạn! Hãy thiết lập số tiền ngân sách ban đầu của bạn để bắt đầu nhé.");
      } else {
        setActiveTab("add");
      }
    }
  }, [currentUser]);

  // Sync state back to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pro_exp_${currentUser}`, JSON.stringify(expenses));
    }
  }, [expenses, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pro_cfg_${currentUser}`, JSON.stringify(config));
    }
  }, [config, currentUser]);

  // Auto-set current date on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormDate(today);
  }, []);

  // Toggle theme helper
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("pro_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Banner helpers
  const triggerSuccessBanner = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(""), 5000);
  };

  // Auth operations
  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const username = usernameInput.trim();
    const password = passwordInput.trim();

    if (!username || !password) {
      setAuthError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    let users = [];
    const storedUsers = localStorage.getItem("pro_users_db");
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch (err) {
        users = [];
      }
    }

    if (authMode === "register") {
      const exists = users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        setAuthError("Tên tài khoản này đã tồn tại.");
        return;
      }
      users.push({ username, password });
      localStorage.setItem("pro_users_db", JSON.stringify(users));
      localStorage.setItem(`pro_is_new_${username}`, "true");
      setAuthSuccess("Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.");
      setAuthMode("login");
      setPasswordInput("");
    } else {
      const match = users.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      if (match) {
        localStorage.setItem("pro_active_user", match.username);
        setCurrentUser(match.username);
        setUsernameInput("");
        setPasswordInput("");
      } else {
        setAuthError("Sai tên đăng nhập hoặc mật khẩu.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pro_active_user");
    setCurrentUser("");
  };

  // Helper for Initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // User management handlers
  const handleUpdateUsername = (e: FormEvent) => {
    e.preventDefault();
    setUsernameModalError("");
    const updatedUsername = newUsername.trim();
    if (!updatedUsername) {
      setUsernameModalError("Tên tài khoản không được để trống.");
      return;
    }
    if (updatedUsername.toLowerCase() === currentUser.toLowerCase()) {
      setUsernameModalError("Tên tài khoản mới trùng với tên hiện tại.");
      return;
    }

    let users = [];
    const storedUsers = localStorage.getItem("pro_users_db");
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch (err) {
        users = [];
      }
    }

    const exists = users.some((u: any) => u.username.toLowerCase() === updatedUsername.toLowerCase());
    if (exists) {
      setUsernameModalError("Tên tài khoản này đã tồn tại.");
      return;
    }

    // Update username in database
    users = users.map((u: any) => {
      if (u.username.toLowerCase() === currentUser.toLowerCase()) {
        return { ...u, username: updatedUsername };
      }
      return u;
    });
    localStorage.setItem("pro_users_db", JSON.stringify(users));

    // Migrate user keys in localStorage
    const oldKeys = {
      expenses: `pro_exp_${currentUser}`,
      config: `pro_cfg_${currentUser}`,
      chatHistory: `pro_chat_history_${currentUser}`,
      isNew: `pro_is_new_${currentUser}`,
    };

    const newKeys = {
      expenses: `pro_exp_${updatedUsername}`,
      config: `pro_cfg_${updatedUsername}`,
      chatHistory: `pro_chat_history_${updatedUsername}`,
      isNew: `pro_is_new_${updatedUsername}`,
    };

    Object.keys(oldKeys).forEach((key) => {
      const val = localStorage.getItem((oldKeys as any)[key]);
      if (val !== null) {
        localStorage.setItem((newKeys as any)[key], val);
        localStorage.removeItem((oldKeys as any)[key]);
      }
    });

    localStorage.setItem("pro_active_user", updatedUsername);
    setCurrentUser(updatedUsername);
    setNewUsername("");
    setShowUpdateUsernameModal(false);
    triggerSuccessBanner(`Đã đổi tên đăng nhập thành công thành "${updatedUsername}"`);
  };

  const handleUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    setPasswordModalError("");
    const pass = newPassword.trim();
    const conf = confirmNewPassword.trim();

    if (!pass) {
      setPasswordModalError("Mật khẩu không được để trống.");
      return;
    }
    if (pass !== conf) {
      setPasswordModalError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    let users = [];
    const storedUsers = localStorage.getItem("pro_users_db");
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch (err) {
        users = [];
      }
    }

    users = users.map((u: any) => {
      if (u.username.toLowerCase() === currentUser.toLowerCase()) {
        return { ...u, password: pass };
      }
      return u;
    });
    localStorage.setItem("pro_users_db", JSON.stringify(users));

    setNewPassword("");
    setConfirmNewPassword("");
    setShowUpdatePasswordModal(false);
    triggerSuccessBanner("Đã cập nhật mật khẩu mới thành công!");
  };

  const handleDeleteAccount = (e: FormEvent) => {
    e.preventDefault();
    setDeleteModalError("");

    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteModalError('Vui lòng nhập đúng chữ "DELETE" để xác nhận xóa.');
      return;
    }

    let users = [];
    const storedUsers = localStorage.getItem("pro_users_db");
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch (err) {
        users = [];
      }
    }

    users = users.filter((u: any) => u.username.toLowerCase() !== currentUser.toLowerCase());
    localStorage.setItem("pro_users_db", JSON.stringify(users));

    localStorage.removeItem(`pro_exp_${currentUser}`);
    localStorage.removeItem(`pro_cfg_${currentUser}`);
    localStorage.removeItem(`pro_chat_history_${currentUser}`);
    localStorage.removeItem(`pro_is_new_${currentUser}`);
    localStorage.removeItem("pro_active_user");

    setCurrentUser("");
    setDeleteConfirmText("");
    setShowDeleteAccountModal(false);
    triggerSuccessBanner("Tài khoản của bạn đã được xóa vĩnh viễn.");
  };

  // Expense operations
  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(formAmount);
    if (!amount || amount <= 0) return;

    if (amount > config.maxSingleSpend) {
      alert(`🚨 CẢNH BÁO: Khoản chi tiêu này vượt quá hạn mức chi một lần (${config.maxSingleSpend.toLocaleString("vi-VN")} đ)!`);
    }

    const newExpense: Expense = {
      id: Date.now(),
      amount,
      category: formCategory,
      date: formDate,
      note: formNote.trim(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    triggerSuccessBanner(`Đã ghi nhận chi tiêu: -${amount.toLocaleString("vi-VN")} đ`);
    
    // Reset Form
    setFormAmount("");
    setFormNote("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setActiveTab("stats");
  };

  // Helper callbacks triggered by AI Chat assistant
  const handleAddExpenseFromAI = (amount: number, category: string, note: string) => {
    const newExpense: Expense = {
      id: Date.now(),
      amount,
      category,
      date: new Date().toISOString().split("T")[0],
      note,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleAddIncomeFromAI = (amount: number, note: string) => {
    setConfig((prev) => ({
      ...prev,
      initialBudget: prev.initialBudget + amount,
    }));
  };

  const handleDeleteExpense = (id: number, amount: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    triggerSuccessBanner(`Đã xóa khoản chi tiêu: +${amount.toLocaleString("vi-VN")} đ`);
  };

  // Config operations
  const handleAddDeposit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;

    setConfig((prev) => ({
      ...prev,
      initialBudget: prev.initialBudget + amt,
    }));
    setDepositAmount("");
    triggerSuccessBanner(`Đã cộng nạp tiền: +${amt.toLocaleString("vi-VN")} đ`);
  };

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    triggerSuccessBanner("Đã cập nhật cấu hình ví thành công!");
  };

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = config.initialBudget - totalSpent;
  const isDangerZone = currentBalance <= config.warningThreshold && config.initialBudget > 0;

  // Chart & Summary computations
  const categorySummary = CATEGORIES.reduce((acc: { [key: string]: number }, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  expenses.forEach((e) => {
    if (categorySummary[e.category] !== undefined) {
      categorySummary[e.category] += e.amount;
    } else {
      categorySummary["🔮 Khác"] = (categorySummary["🔮 Khác"] || 0) + e.amount;
    }
  });

  const chartData = Object.entries(categorySummary)
    .filter(([_, value]) => value > 0)
    .map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors duration-300">
      {/* AUTH SCREEN */}
      {!currentUser ? (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
                <Wallet className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold font-display text-slate-850 dark:text-white">
                Personal Expense Tracker Pro
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Quản lý chi tiêu cá nhân thông minh kết hợp trợ lý ảo AI
              </p>
            </div>

            {/* Auth Mode Selection */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`flex-1 pb-3 text-center font-semibold text-sm transition-colors cursor-pointer ${
                  authMode === "login"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`flex-1 pb-3 text-center font-semibold text-sm transition-colors cursor-pointer ${
                  authMode === "register"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                Đăng Ký
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Tên tài khoản..."
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg text-white cursor-pointer transition-all ${
                  authMode === "login"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                }`}
              >
                {authMode === "login" ? "Đăng Nhập Ngay" : "Đăng Ký Tài Khoản"}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        /* MAIN APPLICATION SCREEN */
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-6 mb-8 gap-4">
            <div className="flex items-center gap-3">
              {/* INTERACTIVE USER AVATAR WITH DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer relative group border border-indigo-200 dark:border-indigo-900"
                  title="Tài khoản & Thiết lập"
                >
                  {getInitials(currentUser)}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                </button>

                {/* Dropdown overlay */}
                <AnimatePresence>
                  {showUserDropdown && (
                    <>
                      {/* Invisible backdrop to dismiss click */}
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setShowUserDropdown(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">TÀI KHOẢN ĐANG ĐĂNG NHẬP</p>
                          <p className="text-base font-bold text-slate-850 dark:text-white truncate mt-0.5">{currentUser}</p>
                        </div>
                        <div className="p-1.5 flex flex-col">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              setNewUsername(currentUser);
                              setUsernameModalError("");
                              setShowUpdateUsernameModal(true);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <User className="w-4 h-4 text-indigo-500" />
                            <span>Đổi tên đăng nhập</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              setNewPassword("");
                              setConfirmNewPassword("");
                              setPasswordModalError("");
                              setShowUpdatePasswordModal(true);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-indigo-500" />
                            <span>Đổi mật khẩu</span>
                          </button>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800/60" />
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              setDeleteConfirmText("");
                              setDeleteModalError("");
                              setShowDeleteAccountModal(true);
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                            <span>Xóa tài khoản</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white leading-tight">
                  Quản lý Chi tiêu Cá nhân
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>Chào mừng trở lại,</span>
                  <button 
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {currentUser}
                  </button>
                </p>
              </div>
            </div>

            <div className="flex items-center self-end sm:self-auto gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Đổi giao diện Sáng/Tối"
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </header>

          {/* Success Banner */}
          <AnimatePresence>
            {successBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-350 rounded-r-2xl text-sm font-medium flex items-center gap-3 shadow-sm"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{successBanner}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning Threshold Banner */}
          <AnimatePresence>
            {isDangerZone && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-350 rounded-r-2xl text-sm font-medium flex items-center gap-3 shadow-sm"
              >
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <span className="font-bold">CẢNH BÁO SỐ DƯ: </span>
                  Số dư ví hiện tại là <b>{currentBalance.toLocaleString("vi-VN")} đ</b>, đã chạm ngưỡng cảnh báo tối thiểu! Vui lòng nạp thêm ngân sách hoặc tiết chế chi tiêu.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DASHBOARD CARD GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Tổng ngân sách
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-baseline gap-1">
                {config.initialBudget.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-normal text-slate-500">đ</span>
              </h3>
              <div className="absolute right-4 bottom-4 p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-600 dark:text-sky-400">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Tổng tiền đã chi
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-500 flex items-baseline gap-1">
                {totalSpent.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-normal text-rose-400">đ</span>
              </h3>
              <div className="absolute right-4 bottom-4 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div
              className={`border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors ${
                isDangerZone
                  ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/10"
                  : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-white"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDangerZone ? "text-rose-100" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                Số dư khả dụng
              </p>
              <h3
                className={`text-xl sm:text-2xl font-bold flex items-baseline gap-1 ${
                  isDangerZone ? "text-white" : "text-emerald-500"
                }`}
              >
                {currentBalance.toLocaleString("vi-VN")}{" "}
                <span className={`text-xs font-normal ${isDangerZone ? "text-rose-200" : "text-emerald-400"}`}>
                  đ
                </span>
              </h3>
              <div
                className={`absolute right-4 bottom-4 p-3 rounded-xl ${
                  isDangerZone ? "bg-white/20 text-white" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TAB BAR NAVIGATION */}
          <nav className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl gap-2 mb-8">
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                activeTab === "add"
                  ? "bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ghi chi tiêu</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                activeTab === "stats"
                  ? "bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>Báo cáo & Thống kê</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                activeTab === "config"
                  ? "bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ví & Cấu hình</span>
            </button>
          </nav>

          {/* VIEW SECTIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* TAB 1: ADD EXPENSE */}
            {activeTab === "add" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                    Nhập Khoản Chi Tiêu Mới
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Vui lòng điền chi tiết số tiền và danh mục bạn đã tiêu dùng.
                  </p>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Số tiền chi tiêu (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        required
                        min="100"
                        placeholder="Ví dụ: 50000"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white font-semibold"
                      />
                      {(() => {
                        const amt = parseInt(formAmount, 10);
                        if (!isNaN(amt) && amt > 0 && amt < 100000000) {
                          const suggestions = [
                            amt * 1000,
                            amt * 10000,
                            amt * 100000,
                            amt * 1000000,
                          ];
                          return (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {suggestions.map((val, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormAmount(val.toString())}
                                  className="text-[11px] px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer font-mono font-medium"
                                >
                                  {val.toLocaleString("vi-VN")}đ
                                </button>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Danh mục chi tiêu
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Ngày chi tiêu
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Ghi chú chi tiết
                      </label>
                      <input
                        type="text"
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        placeholder="Ví dụ: Ăn bún chả cùng bạn bè..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/10 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Lưu Giao Dịch Chi Tiêu</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB 2: STATISTICS & REPORT */}
            {activeTab === "stats" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                    Báo Cáo & Biểu Đồ Thống Kê
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Phân tích tỷ lệ phân bổ ngân sách đã chi tiêu theo từng danh mục cụ thể.
                  </p>
                </div>

                {/* Chart and breakdown container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-100 dark:border-slate-800 pb-8">
                  {/* Recharts Pie component */}
                  <div className="h-[240px] flex items-center justify-center">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`${value.toLocaleString("vi-VN")} đ`, "Tổng chi"]}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-400 text-xs italic space-y-2">
                        <p>Chưa có dữ liệu giao dịch.</p>
                        <p className="text-[10px]">Hãy thêm giao dịch ở tab "Ghi chi tiêu" hoặc chat với Gemini!</p>
                      </div>
                    )}
                  </div>

                  {/* Summary grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Phân bổ theo hạng mục
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CATEGORIES.map((cat, idx) => {
                        const amt = categorySummary[cat] || 0;
                        const percentage = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : "0";
                        return (
                          <div
                            key={cat}
                            className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-850 rounded-xl flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-350">{cat}</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-sm font-bold text-slate-800 dark:text-white">
                                {amt.toLocaleString("vi-VN")} đ
                              </span>
                              {amt > 0 && (
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: COLORS[idx % COLORS.length] + "15",
                                    color: COLORS[idx % COLORS.length],
                                  }}
                                >
                                  {percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* TRANSACTION HISTORY TABLE */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                      Lịch sử giao dịch gần đây
                    </h3>
                    <span className="text-xs font-medium text-slate-400">
                      Tổng số: {expenses.length} giao dịch
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-b border-slate-150 dark:border-slate-800">
                          <th className="p-4 font-semibold">Ngày thực hiện</th>
                          <th className="p-4 font-semibold">Danh mục</th>
                          <th className="p-4 font-semibold">Số tiền chi</th>
                          <th className="p-4 font-semibold">Ghi chú</th>
                          <th className="p-4 font-semibold text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {expenses.length > 0 ? (
                          expenses.map((exp) => (
                            <tr
                              key={exp.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <td className="p-4 font-medium whitespace-nowrap">{exp.date}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-rose-500 whitespace-nowrap">
                                -{exp.amount.toLocaleString("vi-VN")} đ
                              </td>
                              <td className="p-4 truncate max-w-[180px]">{exp.note || "-"}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(exp.id, exp.amount)}
                                  className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                                  title="Xoá giao dịch"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                              Chưa có lịch sử giao dịch. Hãy thực hiện ghi chép chi tiêu để quản lý ví.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: CONFIGURATION */}
            {activeTab === "config" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                    Quản Lý Ví & Cấu Hình Hạn Mức
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Nạp thêm tiền vào ví hoặc điều chỉnh hạn mức chi tối đa cho một giao dịch.
                  </p>
                </div>

                {/* DEPOSIT SECTION */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-500" />
                    <span>Nạp Thêm Tiền Vào Ví</span>
                  </h3>
                  <form onSubmit={handleAddDeposit} className="flex flex-col sm:flex-row gap-3 items-start">
                    <div className="flex-1 w-full">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        required
                        min="1000"
                        placeholder="Số tiền VNĐ muốn nạp thêm..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white font-semibold"
                      />
                      {(() => {
                        const amt = parseInt(depositAmount, 10);
                        if (!isNaN(amt) && amt > 0 && amt < 100000000) {
                          const suggestions = [
                            amt * 1000,
                            amt * 10000,
                            amt * 100000,
                            amt * 1000000,
                          ];
                          return (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {suggestions.map((val, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setDepositAmount(val.toString())}
                                  className="text-[11px] px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer font-mono font-medium"
                                >
                                  {val.toLocaleString("vi-VN")}đ
                                </button>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition cursor-pointer h-[46px] flex items-center justify-center whitespace-nowrap"
                    >
                      Xác Nhận Nạp Tiền
                    </button>
                  </form>
                </div>

                {/* LIMITS CONFIG */}
                <form onSubmit={handleSaveConfig} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Ngân sách tổng (đ)
                      </label>
                      <input
                        type="number"
                        value={config.initialBudget}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, initialBudget: Number(e.target.value) }))
                        }
                        required
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Hạn mức chi tối đa / 1 lần (đ)
                      </label>
                      <input
                        type="number"
                        value={config.maxSingleSpend}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, maxSingleSpend: Number(e.target.value) }))
                        }
                        required
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                        Ngưỡng báo động cạn ví (đ)
                      </label>
                      <input
                        type="number"
                        value={config.warningThreshold}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, warningThreshold: Number(e.target.value) }))
                        }
                        required
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition cursor-pointer"
                  >
                    Lưu Toàn Bộ Cấu Hình Ví
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* CHATBOT INTEGRATION */}
          <AIChatBot
            expenses={expenses}
            currentBalance={currentBalance}
            initialBudget={config.initialBudget}
            totalSpent={totalSpent}
            onAddExpense={handleAddExpenseFromAI}
            onAddIncome={handleAddIncomeFromAI}
            showSuccessBanner={triggerSuccessBanner}
            currentUser={currentUser}
          />

          {/* UPDATE USERNAME MODAL */}
          <AnimatePresence>
            {showUpdateUsernameModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowUpdateUsernameModal(false)}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md z-50"
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Đổi tên đăng nhập</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Tên tài khoản mới sẽ thay thế tên đăng nhập cũ và toàn bộ dữ liệu chi tiêu của bạn sẽ được giữ nguyên.</p>
                  
                  <form onSubmit={handleUpdateUsername} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-sans">Tên tài khoản mới</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Nhập tên đăng nhập mới..."
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    {usernameModalError && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-450">{usernameModalError}</p>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUpdateUsernameModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/10 transition cursor-pointer"
                      >
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* UPDATE PASSWORD MODAL */}
          <AnimatePresence>
            {showUpdatePasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowUpdatePasswordModal(false)}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md z-50"
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Đổi mật khẩu</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.</p>
                  
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-sans">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider font-sans">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Xác nhận mật khẩu mới..."
                        required
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    {passwordModalError && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-450">{passwordModalError}</p>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUpdatePasswordModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/10 transition cursor-pointer"
                      >
                        Lưu mật khẩu
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* DELETE ACCOUNT MODAL */}
          <AnimatePresence>
            {showDeleteAccountModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md z-50"
                >
                  <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 font-display">Xóa tài khoản</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Hành động này là vĩnh viễn và không thể đảo ngược. Toàn bộ thông tin tài khoản và dữ liệu chi tiêu sẽ bị xóa.</p>
                  
                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-rose-600 dark:text-rose-450 mb-1.5 uppercase tracking-wider font-sans">
                        Nhập "DELETE" để xác nhận xóa
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Nhập chữ DELETE viết hoa..."
                        required
                        className="w-full px-4 py-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-850 dark:text-white"
                      />
                    </div>

                    {deleteModalError && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-450">{deleteModalError}</p>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteAccountModal(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/10 transition cursor-pointer"
                      >
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
