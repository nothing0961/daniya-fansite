/**
 * 腾讯云短信服务 — TC3-HMAC-SHA256 签名
 * 使用 Node.js 内置 crypto，零额外依赖
 *
 * API 文档: https://cloud.tencent.com/document/api/382/55981
 * 密钥管理: https://console.cloud.tencent.com/cam/capi
 */
import { createHash, createHmac, randomInt } from "crypto";

const SERVICE = "sms";
const HOST = "sms.tencentcloudapi.com";
const REGION = "ap-guangzhou";
const VERSION = "2021-01-11";
const ACTION = "SendSms";

function sha256Hex(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/** 构造腾讯云 TC3-HMAC-SHA256 签名 */
function sign(
  secretId: string,
  secretKey: string,
  payload: string,
  timestamp: number
): { authorization: string } {
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  // Step 1: Canonical Request
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\n`;
  const signedHeaders = "content-type;host";
  const hashedPayload = sha256Hex(payload);

  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  // Step 2: String to Sign
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const hashedCanonicalRequest = sha256Hex(canonicalRequest);

  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(timestamp),
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // Step 3: Signature
  const kDate = hmacSha256(`TC3${secretKey}`, date);
  const kService = hmacSha256(kDate, SERVICE);
  const kSigning = hmacSha256(kService, "tc3_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  // Step 4: Authorization Header
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorization };
}

/** 生成 6 位随机验证码 */
export function generateCode(): string {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

/** 发送短信验证码 */
export async function sendSms(phone: string, code: string): Promise<void> {
  const secretId = process.env.TENCENT_SMS_SECRET_ID;
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY;
  const sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID;
  const signName = process.env.TENCENT_SMS_SIGN_NAME;
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID;

  if (!secretId || !secretKey || !sdkAppId || !signName || !templateId) {
    throw new Error("腾讯云短信配置缺失");
  }

  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: sdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code],
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const { authorization } = sign(secretId, secretKey, payload, timestamp);

  const response = await fetch(`https://${HOST}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Host": HOST,
      "X-TC-Action": ACTION,
      "X-TC-Version": VERSION,
      "X-TC-Region": REGION,
      "X-TC-Timestamp": String(timestamp),
      "Authorization": authorization,
    },
    body: payload,
  });

  const result = await response.json();

  if (result.Response?.Error) {
    throw new Error(
      `短信发送失败: ${result.Response.Error.Code} — ${result.Response.Error.Message}`
    );
  }

  // 检查发送结果
  const sendStatus = result.Response?.SendStatusSet?.[0];
  if (sendStatus?.Code !== "Ok") {
    throw new Error(`短信发送失败: ${sendStatus?.Code} — ${sendStatus?.Message}`);
  }
}
