import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Sparkles, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { ChatMessage, Expense } from "../types";

interface AIChatBotProps {
  expenses: Expense[];
  currentBalance: number;
  initialBudget: number;
  totalSpent: number;
  onAddExpense: (amount: number, category: string, note: string) => void;
  onAddIncome: (amount: number, note: string) => void;
  showSuccessBanner: (msg: string) => void;
  currentUser: string;
}

export default function AIChatBot({
  expenses,
  currentBalance,
  initialBudget,
  totalSpent,
  onAddExpense,
  onAddIncome,
  showSuccessBanner,
  currentUser,
}: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage for current user
  useEffect(() => {
    const key = `pro_chat_history_${currentUser}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        setMessages([]);
      }
    } else {
      // Default welcome message
      const welcomeMsg: ChatMessage = {
        id: "welcome",
        text: `Chào bạn! Tôi là Trợ lý Tài chính Gemini. 🌟\n\nHãy thử chat với tôi như:\n✍️ *"Tôi vừa uống cà phê hết 45k"*\n💰 *"Nhận tiền lương 5 triệu"* \n\nTài khoản của bạn sẽ tự động được cập nhật giao dịch ngay lập tức!`,
        sender: "ai",
      };
      setMessages([welcomeMsg]);
    }
  }, [currentUser]);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`pro_chat_history_${currentUser}`, JSON.stringify(messages));
    }
  }, [messages, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isPending]);

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isPending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          expenses,
          currentBalance,
          initialBudget,
          totalSpent,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối máy chủ AI");
      }

      const result = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: result.reply,
        sender: "ai",
        actionResult: {
          action: result.action,
          amount: result.amount,
          category: result.category,
          note: result.note,
        },
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Apply parsed action automatically!
      if (result.action === "expense" && result.amount > 0) {
        onAddExpense(result.amount, result.category || "🔮 Khác", result.note || "Chi tiêu qua AI");
        showSuccessBanner(`AI tự động trừ: -${result.amount.toLocaleString("vi-VN")} đ (${result.note})`);
      } else if (result.action === "income" && result.amount > 0) {
        onAddIncome(result.amount, result.note || "Thu nhập qua AI");
        showSuccessBanner(`AI tự động cộng: +${result.amount.toLocaleString("vi-VN")} đ (${result.note})`);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "⚠️ Lỗi: Không thể kết nối với trí tuệ nhân tạo Gemini. Vui lòng kiểm tra lại cấu hình khoá API Key trong AI Studio.",
        sender: "ai",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsPending(false);
    }
  };

  const handleClearHistory = () => {
    const welcomeMsg: ChatMessage = {
      id: "welcome",
      text: `Chào bạn! Tôi là Trợ lý Tài chính Gemini. 🌟\n\nHãy thử chat với tôi như:\n✍️ *"Tôi vừa uống cà phê hết 45k"*\n💰 *"Nhận tiền lương 5 triệu"*\n\nTài khoản của bạn sẽ tự động được cập nhật giao dịch ngay lập tức!`,
      sender: "ai",
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem(`pro_chat_history_${currentUser}`);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        id="ai-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-[#4285f4] to-[#9b72cb] hover:opacity-95 text-white rounded-full px-6 py-4 shadow-xl font-semibold cursor-pointer border-none outline-none transition-transform active:scale-95"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span>Chat với Gemini AI</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chat-window"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[550px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4285f4] to-[#9b72cb] text-white p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base leading-tight">Gemini AI Assistant</h3>
                  <p className="text-[10px] text-indigo-100 font-medium">Trợ lý quản lý ví của bạn</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  title="Xóa lịch sử"
                  className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-1 rounded text-xs transition"
                >
                  Xoá lịch sử
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 p-1 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0f172a]/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : msg.isError
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 rounded-bl-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none"
                    }`}
                  >
                    {msg.text}

                    {/* Show transaction receipt badges */}
                    {msg.actionResult && msg.actionResult.amount > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {msg.actionResult.action === "expense" ? (
                          <>
                            <ArrowDownCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Đã ghi nợ: <b className="text-rose-500">-{msg.actionResult.amount.toLocaleString("vi-VN")} đ</b> vào <b className="text-slate-700 dark:text-slate-200">{msg.actionResult.category}</b></span>
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Đã cộng ví: <b className="text-emerald-500">+{msg.actionResult.amount.toLocaleString("vi-VN")} đ</b> ({msg.actionResult.note})</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Gemini đang phân tích câu nói...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ví dụ: 'Tôi vừa ăn phở bò 45k'..."
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
