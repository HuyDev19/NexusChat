import nodemailer from "nodemailer";

/**
 * Khởi tạo transporter kết nối trực tiếp đến SMTP Gmail
 * LƯU Ý QUAN TRỌNG:
 * Tuyệt đối KHÔNG sử dụng `pool: true` và KHÔNG lưu singleton transporter vĩnh viễn
 * vì máy chủ Gmail tự động ngắt (close/timeout) các socket idle sau 2-5 phút.
 * Việc tạo kết nối theo yêu cầu (on-demand connection) đảm bảo dù hệ thống chạy bao lâu,
 * mỗi lần gửi OTP đều khởi tạo kết nối tươi mới, không bao giờ bị dính ECONNRESET hay socket closed.
 */
const createTransporter = (port = 465) => {
  const user = process.env.EMAIL_USER?.trim();
  const rawPass = process.env.EMAIL_PASS?.trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";

  const isPlaceholder =
    !user ||
    !pass ||
    user.includes("your-email@gmail.com") ||
    pass.includes("your-app-password");

  if (isPlaceholder) {
    console.warn(
      "⚠️ Cảnh báo: EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình. Mã OTP sẽ được in trực tiếp ra console."
    );
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: port,
    secure: port === 465, // true cho port 465 (SSL direct), false cho port 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Tránh lỗi kiểm tra chứng chỉ SSL trên mạng WiFi trường học / cơ quan
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

export const sendOtpEmail = async (email, otp, type) => {
  // Luôn in mã OTP ra console Backend ngay lập tức để thuận tiện test
  console.log(`\n========================================`);
  console.log(`🔑 [MÃ OTP NEXUSCHAT]`);
  console.log(`📧 Email: ${email}`);
  console.log(`🏷️ Loại: ${type}`);
  console.log(`👉 MÃ OTP: [ ${otp} ]`);
  console.log(`========================================\n`);

  const user = process.env.EMAIL_USER?.trim();
  const isRegister = type === "register";
  const title = isRegister
    ? "Xác thực đăng ký tài khoản NexusChat"
    : "Yêu cầu đặt lại mật khẩu NexusChat";
  const actionText = isRegister
    ? "Cảm ơn bạn đã đăng ký NexusChat. Vui lòng sử dụng mã OTP bên dưới để hoàn tất xác thực tài khoản của bạn:"
    : "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản NexusChat. Mã OTP xác thực của bạn là:";

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="background: linear-gradient(to right, #a855f7, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0; font-weight: 800;">
          NexusChat
        </h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Xác thực tài khoản Gmail</p>
      </div>

      <div style="background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #475569; text-align: center;">
        <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">${title}</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">${actionText}</p>
        
        <div style="margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #c084fc; background: #334155; padding: 12px 24px; border-radius: 12px; display: inline-block; border: 2px stroke #a855f7;">
            ${otp}
          </span>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
          ⚠️ Mã OTP này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">© 2026 NexusChat. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"NexusChat" <${user}>`,
    to: email,
    subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
    html: htmlContent,
  };

  // Lần thử 1: Sử dụng cổng 465 (Direct SSL - tiêu chuẩn cao nhất cho Gmail)
  try {
    const transporter465 = createTransporter(465);
    if (!transporter465) {
      return { success: false, reason: "missing_config" };
    }

    await transporter465.sendMail(mailOptions);
    console.log(`✅ [Nodemailer] Đã gửi email OTP thành công tới ${email} (cổng 465 SSL)`);
    return { success: true };
  } catch (err465) {
    console.warn(`⚠️ [Nodemailer] Gửi qua cổng 465 không thành công: ${err465.message}. Đang thử cổng 587 (STARTTLS)...`);

    // Lần thử 2: Dự phòng sang cổng 587 (STARTTLS) nếu mạng hoặc tường lửa chặn cổng 465
    try {
      const transporter587 = createTransporter(587);
      if (!transporter587) {
        return { success: false, reason: "missing_config" };
      }

      await transporter587.sendMail(mailOptions);
      console.log(`✅ [Nodemailer] Đã gửi email OTP thành công tới ${email} (cổng 587 STARTTLS)`);
      return { success: true };
    } catch (err587) {
      console.error("❌ [Nodemailer] Không thể gửi email qua Gmail SMTP:", err587.message);
      console.log(`💡 Mẹo: Sử dụng mã OTP [${otp}] đã được in ở trên console để tiếp tục.`);
      return { success: false, error: err587.message };
    }
  }
};
