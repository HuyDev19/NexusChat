import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Nội dung góp ý không được để trống." });
    }

    const feedback = await Feedback.create({
      name: name?.trim() || "Ẩn danh",
      email: email?.trim() || "",
      message: message.trim(),
    });

    return res.status(201).json({ message: "Góp ý đã được ghi nhận. Cảm ơn bạn!", id: feedback._id });
  } catch (error) {
    console.error("[Feedback] submitFeedback error:", error);
    return res.status(500).json({ message: "Có lỗi xảy ra, vui lòng thử lại." });
  }
};
