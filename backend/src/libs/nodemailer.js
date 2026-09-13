import nodemailer from "nodemailer";

/**
 * 1. Gửi email qua Mailtrap HTTP REST API (Cổng 443 HTTPS - Hoạt động trên Render 100%, không lo bị chặn cổng)
 * Hoạt động khi có MAILTRAP_TOKEN (từ mục Email Sending)
 */
const sendViaMailtrapApi = async (email, otp, title, htmlContent) => {
  const mailtrapToken = process.env.MAILTRAP_TOKEN?.trim().replace(/^["']|["']$/g, "");
  if (!mailtrapToken) return null;

  const senderEmail =
    process.env.MAILTRAP_SENDER_EMAIL?.trim().replace(/^["']|["']$/g, "") || "hello@demomailtrap.co";

  try {
    const response = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailtrapToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: senderEmail,
          name: "NexusChat",
        },
        to: [
          {
            email: email,
          },
        ],
        subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
        html: htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success !== false) {
      console.log(`✅ [Mailtrap API] Đã gửi email OTP thành công tới ${email} qua HTTPS API`);
      return { success: true };
    } else {
      console.error("❌ [Mailtrap API] Lỗi từ máy chủ Mailtrap:", data);
      return { success: false, error: data.errors?.join(", ") || data.message || "Lỗi Mailtrap API" };
    }
  } catch (err) {
    console.error("❌ [Mailtrap API] Lỗi kết nối Mailtrap:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 2. Gửi email qua Mailtrap Sandbox SMTP (Email Testing / Hộp thư ảo)
 * Hoạt động khi có MAILTRAP_USER và MAILTRAP_PASS (từ mục Email Testing -> Inboxes)
 */
const sendViaMailtrapSmtp = async (email, otp, title, htmlContent) => {
  const user = process.env.MAILTRAP_USER?.trim().replace(/^["']|["']$/g, "");
  const pass = process.env.MAILTRAP_PASS?.trim().replace(/^["']|["']$/g, "");
  if (!user || !pass) return null;

  try {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"NexusChat" <no-reply@nexuschat.com>`,
      to: email,
      subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
      html: htmlContent,
    });

    console.log(`✅ [Mailtrap Sandbox] Đã gửi OTP tới hộp thư thử nghiệm Mailtrap cho ${email}`);
    return { success: true };
  } catch (err) {
    console.error("❌ [Mailtrap Sandbox] Lỗi gửi mail:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 3. Transporter kết nối SMTP Gmail dự phòng (Dùng khi chạy Localhost)
 */
const createGmailTransporter = (port = 465) => {
  const user = process.env.EMAIL_USER?.trim().replace(/^["']|["']$/g, "");
  const rawPass = process.env.EMAIL_PASS?.trim().replace(/^["']|["']$/g, "");
  const pass = rawPass ? rawPass.replace(/[\s"']/g, "") : "";

  const isPlaceholder =
    !user ||
    !pass ||
    user.includes("your-email@gmail.com") ||
    pass.includes("your-app-password");

  if (isPlaceholder) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
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

  const user = process.env.EMAIL_USER?.trim().replace(/^["']|["']$/g, "") || "no-reply@nexuschat.com";
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

  // Ưu tiên 1: Gửi qua Mailtrap HTTP API (Cổng 443 HTTPS - Hoạt động trên Render 100%)
  if (process.env.MAILTRAP_TOKEN) {
    const mailtrapResult = await sendViaMailtrapApi(email, otp, title, htmlContent);
    if (mailtrapResult && mailtrapResult.success) {
      return mailtrapResult;
    }
    console.warn("⚠️ [Mailtrap API] Gửi thất bại, đang thử phương thức dự phòng...");
  }

  // Ưu tiên 2: Gửi qua Mailtrap Sandbox SMTP (Email Testing)
  if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
    const mailtrapSmtpResult = await sendViaMailtrapSmtp(email, otp, title, htmlContent);
    if (mailtrapSmtpResult && mailtrapSmtpResult.success) {
      return mailtrapSmtpResult;
    }
    console.warn("⚠️ [Mailtrap SMTP] Gửi thất bại, đang thử phương thức dự phòng...");
  }

  // Ưu tiên 3: Gửi qua Gmail SMTP (cổng 465 / 587 - Thích hợp khi chạy Localhost)
  const mailOptions = {
    from: `"NexusChat" <${user}>`,
    to: email,
    subject: `[NexusChat] ${title} - Mã OTP: ${otp}`,
    html: htmlContent,
  };

  try {
    const transporter465 = createGmailTransporter(465);
    if (!transporter465) {
      return { success: false, reason: "missing_config" };
    }

    await transporter465.sendMail(mailOptions);
    console.log(`✅ [Gmail SMTP] Đã gửi email OTP thành công tới ${email} (cổng 465 SSL)`);
    return { success: true };
  } catch (err465) {
    console.warn(`⚠️ [Gmail SMTP] Cổng 465 thất bại: ${err465.message}. Đang thử cổng 587...`);
    try {
      const transporter587 = createGmailTransporter(587);
      if (!transporter587) {
        return { success: false, reason: "missing_config" };
      }

      await transporter587.sendMail(mailOptions);
      console.log(`✅ [Gmail SMTP] Đã gửi email OTP thành công tới ${email} (cổng 587 STARTTLS)`);
      return { success: true };
    } catch (err587) {
      console.error("❌ [Gmail SMTP] Không thể gửi email qua Gmail SMTP:", err587.message);
      return { success: false, error: err587.message };
    }
  }
};
