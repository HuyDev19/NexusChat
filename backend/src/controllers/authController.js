// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../libs/nodemailer.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

// Kiểm tra Tên đăng nhập trùng lặp
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ available: false, message: "Tên đăng nhập phải có ít nhất 3 ký tự" });
    }

    const user = await User.findOne({ username: username.trim() });
    if (user) {
      return res.status(200).json({ available: false, message: "Tên đăng nhập này đã được sử dụng" });
    }

    return res.status(200).json({ available: true, message: "Tên đăng nhập hợp lệ" });
  } catch (error) {
    console.error("Lỗi khi check username:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Kiểm tra Email trùng lặp
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ available: false, message: "Email không hợp lệ" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user) {
      return res.status(200).json({ available: false, message: "Email này đã được sử dụng" });
    }

    return res.status(200).json({ available: true, message: "Email hợp lệ" });
  } catch (error) {
    console.error("Lỗi khi check email:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (
      !email ||
      !type ||
      !["register", "reset_password", "change_password", "delete_account"].includes(type)
    ) {
      return res.status(400).json({ message: "Email và loại OTP (type) không hợp lệ" });
    }

    const emailTrimmed = email.trim().toLowerCase();

    if (type === "register") {
      const existingUser = await User.findOne({ email: emailTrimmed });
      if (existingUser) {
        return res.status(409).json({ message: "Email này đã được sử dụng cho một tài khoản khác" });
      }
    } else if (["reset_password", "change_password", "delete_account"].includes(type)) {
      const existingUser = await User.findOne({ email: emailTrimmed });
      if (!existingUser) {
        return res.status(444).json({ message: "Email không tồn tại trong hệ thống" });
      }
    }

    // Tạo mã OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Xoá mã OTP cũ chưa sử dụng của email này
    await Otp.deleteMany({ email: emailTrimmed, type });

    // Lưu OTP mới vào DB
    await Otp.create({
      email: emailTrimmed,
      otp,
      type,
    });

    // Gửi OTP qua Gmail
    await sendOtpEmail(emailTrimmed, otp, type);

    return res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn!" });
  } catch (error) {
    console.error("Lỗi khi gửi OTP:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi gửi mã OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      return res.status(400).json({ message: "Thiếu email, otp hoặc type" });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({ email: emailTrimmed, otp, type });

    if (!otpRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
    }

    return res.status(200).json({ message: "Xác thực mã OTP thành công!" });
  } catch (error) {
    console.error("Lỗi khi xác thực OTP:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác thực OTP" });
  }
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, otp } = req.body;

    if (!username || !password || !email || !firstName || !lastName || !otp) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, email, firstName, lastName và mã OTP",
      });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Kiểm tra mã OTP
    const otpRecord = await Otp.findOne({ email: emailTrimmed, otp, type: "register" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
    }

    // Kiểm tra username tồn tại chưa
    const duplicateUsername = await User.findOne({ username });
    if (duplicateUsername) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    // Kiểm tra email tồn tại chưa
    const duplicateEmail = await User.findOne({ email: emailTrimmed });
    if (duplicateEmail) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    // Mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    await User.create({
      username,
      hashedPassword,
      email: emailTrimmed,
      displayName: `${lastName} ${firstName}`,
    });

    // Xoá OTP đã dùng
    await Otp.deleteMany({ email: emailTrimmed, type: "register" });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu email, otp hoặc mật khẩu mới" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Kiểm tra OTP
    const otpRecord = await Otp.findOne({ email: emailTrimmed, otp, type: "reset_password" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
    }

    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;
    await user.save();

    // Xoá OTP và đăng xuất tất cả phiên làm việc cũ
    await Otp.deleteMany({ email: emailTrimmed, type: "reset_password" });
    await Session.deleteMany({ userId: user._id });

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay." });
  } catch (error) {
    console.error("Lỗi khi resetPassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đặt lại mật khẩu" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    const clean = username.trim();
    const user = await User.findOne({
      $or: [
        { username: clean.toLowerCase() },
        { username: clean },
        { email: clean.toLowerCase() },
      ],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }

    // Tăng tokenVersion để vô hiệu hóa toàn bộ token cũ trên các thiết bị khác
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.lastActiveAt = new Date();
    await user.save();

    // Hủy tất cả session trước đó của người dùng
    await Session.deleteMany({ userId: user._id });

    // Phát sự kiện ngắt phiên đăng nhập trên thiết bị cũ qua socket
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${user._id}`).emit("auth:force_logout", {
        message: "Tài khoản của bạn đã được đăng nhập từ một thiết bị khác.",
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res
      .status(200)
      .json({ message: `User ${user.displayName} đã logged in!`, accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      const session = await Session.findOne({ refreshToken: token });
      if (session) {
        await User.findByIdAndUpdate(session.userId, { lastActiveAt: new Date() });
        await Session.deleteOne({ refreshToken: token });
      }
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ code: "SESSION_TERMINATED", message: "Token không tồn tại." });
    }

    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ code: "SESSION_TERMINATED", message: "Phiên làm việc đã bị đăng xuất do đăng nhập ở thiết bị khác." });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie("refreshToken");
      return res.status(401).json({ code: "SESSION_TERMINATED", message: "Phiên đăng nhập đã hết hạn." });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      res.clearCookie("refreshToken");
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        tokenVersion: user.tokenVersion,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
