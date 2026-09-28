/**
 * Gửi email qua Brevo HTTP API (Không cần tên miền, dùng Gmail cá nhân)
 * Chạy mượt mà trên cả Localhost lẫn Deploy (Render/Railway...)
 */
const sendViaBrevoApi = async (email, otp, title, htmlContent) => {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!brevoApiKey) {
    return { success: false, reason: "missing_config", error: "Thiếu biến BREVO_API_KEY" };
  }

  // Lấy email đã xác minh trên Brevo từ biến môi trường (Ví dụ: Gmail cá nhân của bạn)
  const senderEmail = process.env.EMAIL_USER?.trim().replace(/^["']|["']$/g, "");

  if (!senderEmail || senderEmail.includes("your-email@gmail.com")) {
      console.warn("⚠️ [Brevo API] Cần cấu hình EMAIL_USER (email đã xác minh trên Brevo) để gửi mail.");
      return { success: false, reason: "missing_config", error: "Thiếu biến EMAIL_USER" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "NexusChat",
          email: senderEmail,
        },
        to: [
          {
            email: email,
          }
        ],
        subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
        htmlContent: htmlContent,
      }),
    });

    if (response.ok) {
      console.log(`✅ [Brevo API] Đã gửi email OTP thành công tới ${email} qua HTTPS API`);
      return { success: true };
    } else {
      const data = await response.json();
      console.error("❌ [Brevo API] Lỗi từ máy chủ Brevo:", data);
      return { success: false, error: data.message || "Lỗi Brevo API" };
    }
  } catch (err) {
    console.error("❌ [Brevo API] Lỗi kết nối Brevo:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Hàm gửi email OTP của NexusChat
 */
export const sendOtpEmail = async (email, otp, type) => {
  // Luôn in mã OTP ra console Backend ngay lập tức để thuận tiện test và backup
  console.log(`\n========================================`);
  console.log(`🔑 [MÃ OTP NEXUSCHAT]`);
  console.log(`📧 Email: ${email}`);
  console.log(`🏷️ Loại: ${type}`);
  console.log(`👉 MÃ OTP: [ ${otp} ]`);
  console.log(`========================================\n`);

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
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Xác thực tài khoản</p>
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

  // Duy nhất sử dụng Brevo API cho mọi môi trường (Local và Deploy)
  return await sendViaBrevoApi(email, otp, title, htmlContent);
};
