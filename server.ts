import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for smart finance assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, expenses, currentBalance, initialBudget, totalSpent } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();

    // Prepare transaction context to feed into Gemini prompt
    const recentExpensesDesc = expenses && expenses.length > 0
      ? expenses.slice(-10).map((e: any) => `- Ngày ${e.date}: ${e.category} | ${e.note || "Giao dịch"} | -${Number(e.amount).toLocaleString("vi-VN")} đ`).join("\n")
      : "Không có giao dịch gần đây.";

    const systemInstruction = `Bạn là một trợ lý quản lý chi tiêu tài chính cá nhân thông minh, thân thiện và hài hước bằng tiếng Việt, được tích hợp trực tiếp vào ứng dụng "Personal Expense Tracker Pro".
Thông tin ví hiện tại của người dùng:
- Tổng ngân sách ban đầu: ${Number(initialBudget || 0).toLocaleString("vi-VN")} đ
- Tổng chi tiêu đã ghi nhận: ${Number(totalSpent || 0).toLocaleString("vi-VN")} đ
- Số dư hiện tại trong ví: ${Number(currentBalance || 0).toLocaleString("vi-VN")} đ
- Danh sách 10 giao dịch chi tiêu gần đây nhất:
${recentExpensesDesc}

Nhiệm vụ của bạn là đọc lời nhắn sau của người dùng: "${message}".

Hãy thực hiện phân tích và xử lý theo các trường hợp sau:
1. GHI NHẬN KHOẢN CHI TIÊU (Expense): Người dùng báo họ vừa tiêu tiền (ví dụ: "vừa đi ăn 45k", "mua đôi giày 500k", "vừa thanh toán hoá đơn nước 120k", "mới mất 100k mua sách").
   - Đặt "action" thành "expense".
   - Bóc tách số tiền "amount" (ví dụ: "45k" -> 45000, "1 củ" -> 1000000, "hai mươi ngàn" -> 20000).
   - Chọn một trong các "category" chính xác sau: "🍔 Ăn uống", "🚗 Di chuyển", "🛍️ Mua sắm", "⚡ Hóa đơn", "🎈 Giải trí", "🔮 Khác".
   - Tóm tắt "note" ngắn gọn (ví dụ: "Ăn sáng", "Mua giày", "Hóa đơn nước").
   - Phản hồi "reply" hóm hỉnh, khen ngợi hoặc khuyên nhủ hài hước dựa trên số dư hiện tại của họ.

2. GHI NHẬN KHOẢN THU NHẬP / NẠP THÊM TIỀN (Income): Người dùng báo họ vừa nhận được tiền hoặc nạp thêm tiền vào ví (ví dụ: "nhận lương 10 triệu rồi", "mẹ cho 200k", "mới bán đồ cũ được 150k", "nạp thêm 50k vào ví").
   - Đặt "action" thành "income".
   - Bóc tách số tiền "amount".
   - Chọn "category" là "💰 Thu nhập".
   - Tóm tắt "note" ngắn gọn (ví dụ: "Nhận lương", "Mẹ cho tiền", "Bán đồ cũ").
   - Phản hồi "reply" chúc mừng phấn khởi, khích lệ họ chi tiêu thông minh.

3. TRÒ CHUYỆN / TƯ VẤN TÀI CHÍNH (Unknown): Người dùng tâm sự, đặt câu hỏi về tài chính, cách tiết kiệm, hoặc chỉ chào hỏi bình thường (ví dụ: "làm sao để tiết kiệm tiền?", "cuối tháng tôi hết tiền rồi phải làm sao?", "chào bạn", "bạn là ai?").
   - Đặt "action" thành "unknown".
   - Đặt "amount" thành 0.
   - Đặt "category" thành "".
   - Đặt "note" thành "".
   - Phản hồi "reply" thật chi tiết, có chiều sâu, mang tính xây dựng cao và cực kỳ hữu ích về quản lý tài chính, tiết kiệm chi tiêu, dựa trên tình hình ví thực tế của họ (số dư hiện tại) nếu phù hợp.

Chú ý quan trọng: Luôn phản hồi bằng tiếng Việt tự nhiên, trẻ trung, dùng emoji phù hợp. Trả về định dạng JSON đúng cấu trúc yêu cầu.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "Hành động được nhận diện: 'expense', 'income', hoặc 'unknown'.",
            },
            amount: {
              type: Type.INTEGER,
              description: "Số tiền giao dịch bóc tách được (VND), mặc định là 0.",
            },
            category: {
              type: Type.STRING,
              description: "Danh mục giao dịch tương ứng.",
            },
            note: {
              type: Type.STRING,
              description: "Tóm tắt ngắn về giao dịch.",
            },
            reply: {
              type: Type.STRING,
              description: "Câu trả lời thân thiện, hóm hỉnh và mang tính tư vấn hữu ích nhất bằng tiếng Việt.",
            },
          },
          required: ["action", "amount", "category", "note", "reply"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ mô hình Gemini.");
    }

    const jsonResult = JSON.parse(text);
    res.json(jsonResult);
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý yêu cầu AI." });
  }
});

// Start express server with Vite middleware or static dist
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
