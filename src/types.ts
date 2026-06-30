export interface Expense {
  id: number;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface WalletConfig {
  initialBudget: number;
  maxSingleSpend: number;
  warningThreshold: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  isPending?: boolean;
  isError?: boolean;
  actionResult?: {
    action: "expense" | "income" | "unknown";
    amount: number;
    category: string;
    note: string;
  };
}

export type AuthMode = "login" | "register";
