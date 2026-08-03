import User from "../models/User.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const username = String(req.query.username || "").trim().toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "Thiếu username để tìm kiếm" });
    }

    const user = await User.findOne({
      username: { $regex: `^${escapeRegExp(username)}`, $options: "i" },
    }).select("_id username displayName avatarUrl bio phone");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi tìm user theo username", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
