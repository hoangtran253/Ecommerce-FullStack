import nodemailer from "nodemailer";

const APP_NAME = process.env.APP_NAME || "OREBI";

export const isEmailConfigured = () =>
  Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

let transporter = null;

const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

const baseHtml = (title, body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="color:#111827;margin:0 0 16px">${APP_NAME}</h2>
    <h3 style="color:#374151;margin:0 0 12px">${title}</h3>
    ${body}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Email tự động — vui lòng không trả lời.</p>
  </div>
</body>
</html>`;

export const sendMail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email mock] To: ${to} | ${subject}\n${text || html}`);
    return { ok: true, mocked: true };
  }

  await transport.sendMail({
    from: `"${APP_NAME}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || undefined,
  });
  return { ok: true, mocked: false };
};

export const sendLoginNotification = async (user) => {
  const when = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  await sendMail({
    to: user.email,
    subject: `[${APP_NAME}] Đăng nhập thành công`,
    text: `Xin chào ${user.name},\n\nTài khoản của bạn vừa đăng nhập lúc ${when}.\nNếu không phải bạn, hãy đổi mật khẩu ngay.`,
    html: baseHtml(
      "Đăng nhập thành công",
      `<p>Xin chào <strong>${user.name}</strong>,</p>
       <p>Tài khoản <strong>${user.email}</strong> vừa đăng nhập lúc <strong>${when}</strong> (giờ Việt Nam).</p>
       <p>Nếu không phải bạn, vui lòng đổi mật khẩu hoặc liên hệ hỗ trợ.</p>`
    ),
  });
};

export const sendWelcomeEmail = async (user) => {
  const shopUrl = process.env.CLIENT_URL || "http://localhost:5173";
  await sendMail({
    to: user.email,
    subject: `[${APP_NAME}] Chào mừng bạn đến với ${APP_NAME}!`,
    html: baseHtml(
      "Chào mừng!",
      `<p>Xin chào <strong>${user.name}</strong>,</p>
       <p>Cảm ơn bạn đã đăng ký tài khoản tại ${APP_NAME}.</p>
       <p><a href="${shopUrl}/shop" style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Mua sắm ngay</a></p>`
    ),
  });
};
