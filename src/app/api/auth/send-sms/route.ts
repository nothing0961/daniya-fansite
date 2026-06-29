/**
 * 短信发送 API — POST /api/auth/send-sms
 * 接收手机号，发送 6 位验证码
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms, generateCode } from "@/lib/sms";
import { checkRateLimit, SMS_RATE_LIMITS } from "@/lib/rate-limit";

const PHONE_RE = /^1[3-9]\d{9}$/;
const CODE_EXPIRY = 5 * 60 * 1000; // 5 分钟

export async function POST(request: Request) {
  let phone: string | undefined;

  try {
    const body = await request.json();
    phone = body.phone?.toString().trim();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!phone || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "请输入有效的手机号" }, { status: 400 });
  }

  // IP 限流
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const ipLimit = checkRateLimit(`sms:ip:${ip}`, SMS_RATE_LIMITS.perIp);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });
  }

  // 手机号限流（1分钟）
  const phoneShort = checkRateLimit(`sms:phone:${phone}`, SMS_RATE_LIMITS.perPhoneShort);
  if (!phoneShort.allowed) {
    return NextResponse.json({ error: "验证码已发送，请 60 秒后再试" }, { status: 429 });
  }

  // 手机号限流（1小时）
  const phoneHour = checkRateLimit(`sms:phone:${phone}:hour`, SMS_RATE_LIMITS.perPhoneHour);
  if (!phoneHour.allowed) {
    return NextResponse.json({ error: "该号码请求过于频繁，请稍后再试" }, { status: 429 });
  }

  // 手机号限流（1天）
  const phoneDay = checkRateLimit(`sms:phone:${phone}:day`, SMS_RATE_LIMITS.perPhoneDay);
  if (!phoneDay.allowed) {
    return NextResponse.json({ error: "该号码今日请求次数已达上限" }, { status: 429 });
  }

  // 生成并存储验证码
  const code = generateCode();
  const expires = new Date(Date.now() + CODE_EXPIRY);

  // 清除该手机号的旧验证码
  await prisma.verificationToken.deleteMany({
    where: { identifier: phone },
  });

  // 存储新验证码
  await prisma.verificationToken.create({
    data: {
      identifier: phone,
      token: code,
      expires,
    },
  });

  // 发送短信
  try {
    await sendSms(phone, code);
  } catch {
    return NextResponse.json({ error: "短信发送失败，请稍后重试" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
