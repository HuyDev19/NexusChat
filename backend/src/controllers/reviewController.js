import { Review } from "../models/Review.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Moderation Function
const moderateReviewWithAI = async (content) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert content moderator for a professional web application.
      Analyze the following user review. Your task is to approve or reject it based on these rules:
      - Reject if it contains profanity, hate speech, explicit content, or severe toxicity.
      - Reject if it contains spam, random gibberish (e.g., "asdasdasd"), or promotional links.
      - Approve if it is a normal, understandable review (even if it is a negative/1-star review about the app).
      - If it is in Vietnamese or English, evaluate accordingly.

      Review Content: "${content}"

      Output EXACTLY in this JSON format and nothing else:
      {
        "status": "approved" | "rejected",
        "confidence": 0-100,
        "reason": "If rejected, provide a very short reason here, else empty string."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Strip markdown formatting if the model wrapped the JSON in ```json ... ```
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error("AI Moderation Error:", error);
    
    // Fallback if AI fails (e.g., network error/invalid key): Use basic keyword filter
    const lowerContent = content.toLowerCase();
    const badWords = [
      // Quảng cáo, lừa đảo, spam
      "vay tiền", "tín chấp", "lãi suất", "khuyến mãi", "nạp thẻ", "chiết khấu", 
      "zalo", "đặt cược", "tài xỉu", "lô đề", "bóng đá", "kiếm tiền online", 
      "mua bán", "tuyển dụng", "telegram", "thu nhập", "cá độ", "đánh bài", 
      "tặng code", "sđt", "liên hệ", "cskh", "bán nick", "fb88", "w88",
      "vay tien", "tin chap", "lai suat", "khuyen mai", "nap the", "chiet khau",
      "dat cuoc", "tai xiu", "lo de", "bong da", "kiem tien", "tuyen dung",
      
      // Chửi tục, xúc phạm
      "đụ", "đĩ", "lồn", "cặc", "chó", "ngu", "đần", "cút", "rác", "địt", "hạch", 
      "lìn", "cac", "lon", "cc", "vl", "vãi", "chết mẹ", "đm", "đkm", "vcl", 
      "cứt", "phò", "đĩ điếm", "dmm", "đcm", "mẹ mày", "con đĩ", "súc vật", "óc chó"
    ];
    
    const isSpam = badWords.some(word => lowerContent.includes(word));
    
    if (isSpam) {
      return { status: "rejected", confidence: 100, reason: "Phát hiện từ khóa vi phạm (Fallback Filter)." };
    }
    return { status: "approved", confidence: 50, reason: "Bypass AI, dùng filter cơ bản." };
  }
};

export const submitReview = async (req, res) => {
  try {
    const { rating, content } = req.body;
    const userId = req.user._id; // Assuming protectRoute middleware sets req.user

    if (!rating || !content) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đánh giá và số sao." });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ success: false, message: "Đánh giá quá dài (tối đa 500 ký tự)." });
    }

    // Step 1: AI Moderation
    const moderationResult = await moderateReviewWithAI(content);
    
    if (moderationResult.status === "rejected") {
       return res.status(400).json({ 
         success: false, 
         message: "Nội dung của bạn vi phạm tiêu chuẩn cộng đồng và không thể đăng.", 
         reason: moderationResult.reason 
       });
    }

    // Step 2: Upsert (Create or Update existing review for this user)
    // We use findOneAndUpdate with upsert: true so a user can only have 1 active review
    const review = await Review.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        rating,
        content,
        status: moderationResult.status, // save as pending or approved
        aiConfidence: moderationResult.confidence,
        rejectionReason: ""
      },
      { new: true, upsert: true } // Create if not exists
    );

    res.status(200).json({ 
      success: true, 
      message: moderationResult.status === "pending" 
        ? "Đánh giá của bạn đã được ghi nhận và đang chờ Admin duyệt do AI Server quá tải." 
        : "Đánh giá của bạn đã được đăng thành công!", 
      review 
    });

  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
  }
};

export const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .populate("user", "displayName avatarUrl")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Error in getApprovedReviews:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
  }
};

export const getReviewStats = async (req, res) => {
  try {
    const approved = await Review.find({ status: "approved" })
      .populate("user", "displayName avatarUrl")
      .sort({ rating: -1, createdAt: -1 });

    if (!approved.length) {
      return res.status(200).json({
        success: true,
        averageRating: 0,
        totalReviews: 0,
        recentAvatars: [],
        topReviews: [],
      });
    }

    const total = approved.length;
    const sum = approved.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / total) * 10) / 10;

    // Top reviews with content (5-star first, then 4-star)
    const topReviews = approved
      .filter((r) => r.rating >= 4 && r.content && r.content.length > 10)
      .slice(0, 6)
      .map((r) => ({
        name: r.user?.displayName || "Người dùng",
        avatar: r.user?.avatarUrl || null,
        rating: r.rating,
        content: r.content,
      }));

    // Recent reviewer avatars (up to 4)
    const recentAvatars = approved
      .slice(0, 4)
      .map((r) => ({
        name: r.user?.displayName || "?",
        avatar: r.user?.avatarUrl || null,
      }));

    res.status(200).json({
      success: true,
      averageRating,
      totalReviews: total,
      recentAvatars,
      topReviews,
    });
  } catch (error) {
    console.error("Error in getReviewStats:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
  }
};
