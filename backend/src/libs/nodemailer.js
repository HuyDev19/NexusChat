import nodemailer from "nodemailer";

let transporterInstance = null;

const getTransporter = () => {
  if (transporterInstance) return transporterInstance;

  const user = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS;
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

  transporterInstance = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return transporterInstance;
};

export const sendOtpEmail = async (email, otp, type) => {
  // Luôn in mã OTP ra console Backend ngay lập tức để thuận tiện test
  console.log(`\n========================================`);
  console.log(`🔑 [MÃ OTP NEXUSCHAT]`);
  console.log(`📧 Email: ${email}`);
  console.log(`🏷️ Loại: ${type}`);
  console.log(`👉 MÃ OTP: [ ${otp} ]`);
  console.log(`========================================\n`);

  const transporter = getTransporter();

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

  if (!transporter) {
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"NexusChat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
      html: htmlContent,
    });
    console.log(`✅ [Nodemailer] Đã gửi email OTP thành công tới ${email}`);
    return true;
  } catch (error) {
    console.warn("⚠️ [Nodemailer] Không thể gửi email qua Gmail SMTP:", error.message);
    console.log(`💡 Mẹo: Sử dụng mã OTP [${otp}] đã được in ở trên để tiếp tục.`);
    return true;
  }
};
