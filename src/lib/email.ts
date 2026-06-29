/**
 * SendCloud 邮件发送 — Auth.js Magic Link
 * SendCloud API v2: http://api.sendcloud.net/apiv2/mail/send
 */
interface VerificationRequestParams {
  identifier: string;
  url: string;
  expires: Date;
  provider: { from?: string };
  token: string;
  theme: unknown;
  request: Request;
}

export async function sendVerificationRequest(
  params: VerificationRequestParams
): Promise<void> {

    const { identifier: to, url, expires } = params;
    const apiUser = process.env.SENDCLOUD_API_USER;
    const apiKey = process.env.SENDCLOUD_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiUser || !apiKey || !from) {
      throw new Error("SendCloud 邮件配置缺失：SENDCLOUD_API_USER, SENDCLOUD_API_KEY, EMAIL_FROM");
    }

    const formData = new URLSearchParams({
      apiUser,
      apiKey,
      from,
      to,
      subject: "登录 达妮娅的瞌睡小屋",
      html: `<div style="max-width:480px;margin:0 auto;padding:32px;font-family:sans-serif;color:#c9d1d9;background:#0d1117;border-radius:8px">
  <h1 style="color:#e6edf3;font-size:20px;margin-bottom:16px">达妮娅的瞌睡小屋</h1>
  <p style="margin-bottom:24px;line-height:1.6">点击下方按钮登录你的账号：</p>
  <a href="${url}" style="display:inline-block;padding:12px 32px;background:#4a7cdf;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">登录</a>
  <p style="margin-top:24px;font-size:13px;color:#8b949e">此链接 ${expires.toLocaleString("zh-CN")} 前有效，过期后请重新申请。</p>
  <p style="font-size:13px;color:#8b949e">如果不是你申请的，请忽略此邮件。</p>
</div>`,
    });

    const response = await fetch("http://api.sendcloud.net/apiv2/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok || result.statusCode !== 200) {
      throw new Error(`SendCloud 发送失败: ${result.message || "未知错误"}`);
    }
  }
