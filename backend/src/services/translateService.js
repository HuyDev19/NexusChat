import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Strategy 1: Google Translate GTX Endpoint (Public, no API key required, highly reliable)
 */
async function translateWithGoogleGtx(text, targetLang = "vi") {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
    targetLang
  )}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Google GTX HTTP ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const translatedText = data[0]
      .map((item) => (item && item[0] ? item[0] : ""))
      .filter(Boolean)
      .join("");
    if (translatedText.trim()) {
      return translatedText;
    }
  }

  throw new Error("Định dạng dữ liệu Google GTX không hợp lệ");
}

/**
 * Strategy 2: Google Chrome Extension Translation Endpoint
 */
async function translateWithGoogleDict(text, targetLang = "vi") {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(
    targetLang
  )}&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Google Clients5 HTTP ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    const textRes = Array.isArray(data[0]) ? data[0][0] : data[0];
    if (typeof textRes === "string" && textRes.trim()) {
      return textRes;
    }
  }

  throw new Error("Định dạng dữ liệu Google Clients5 không hợp lệ");
}

/**
 * Strategy 3: MyMemory Translation API (Free open translation fallback)
 */
async function translateWithMyMemory(text, targetLang = "vi") {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=auto|${encodeURIComponent(targetLang)}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`MyMemory HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data?.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error("Không nhận được kết quả từ MyMemory");
}

/**
 * Strategy 4: Google Gemini AI (if GEMINI_API_KEY is available in .env)
 */
async function translateWithGemini(text, targetLang = "vi") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Không có GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const targetLangName = targetLang === "vi" ? "tiếng Việt" : targetLang;
  const prompt = `Bạn là một dịch giả chuyên nghiệp. Hãy dịch câu sau sang ${targetLangName}. 
Yêu cầu quan trọng: CHỈ TRẢ VỀ DUY NHẤT BẢN DỊCH, không thêm bất kỳ lời giải thích, mở đầu, ngoặc kép hay định dạng markdown nào.
Nội dung cần dịch:
"""
${text}
"""`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const translation = response.text()?.trim();

  if (!translation) {
    throw new Error("Gemini không trả về kết quả dịch");
  }

  return translation;
}

/**
 * Multi-tier Translation Service
 * Tự động thử lần lượt các tầng dịch thuật để đảm bảo 100% không bị đứt đoạn
 */
export async function translateText(text, targetLang = "vi") {
  if (!text || !text.trim()) {
    return text;
  }

  // Tầng 1: Google GTX (Nhanh nhất, thông dụng nhất)
  try {
    const result = await translateWithGoogleGtx(text, targetLang);
    return result;
  } catch (err1) {
    console.warn("⚠️ [Translate] Google GTX lỗi:", err1.message, "-> Chuyển sang Google Dict...");
  }

  // Tầng 2: Google Dict Extension
  try {
    const result = await translateWithGoogleDict(text, targetLang);
    return result;
  } catch (err2) {
    console.warn("⚠️ [Translate] Google Dict lỗi:", err2.message, "-> Chuyển sang MyMemory...");
  }

  // Tầng 3: MyMemory
  try {
    const result = await translateWithMyMemory(text, targetLang);
    return result;
  } catch (err3) {
    console.warn("⚠️ [Translate] MyMemory lỗi:", err3.message, "-> Chuyển sang Gemini AI...");
  }

  // Tầng 4: Gemini AI
  try {
    const result = await translateWithGemini(text, targetLang);
    return result;
  } catch (err4) {
    console.error("❌ [Translate] Tất cả các phương thức dịch đều thất bại:", err4.message);
    throw new Error("Không thể dịch tin nhắn vào lúc này. Vui lòng thử lại sau.");
  }
}
