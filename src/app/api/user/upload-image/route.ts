import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { canUploadToday, recordUpload, USER_DAILY_LIMIT, SITE_DAILY_LIMIT, getUserTodayUploadCount, getSiteTodayUploadCount } from "@/lib/upload-rate-limit";

/**
 * 普通用户上传图片
 *  - 需要登录（401 拦截）
 *  - 限流：单用户 3 张/天 + 全站 8 张/天（429 拦截）
 *  - 用站长账号的 IMGURL_UID + IMGURL_TOKEN 转发到 ImgURL SaaS
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 限流检查（在解析 body 之前，避免白占带宽）
  if (!canUploadToday(userId)) {
    const userCount = getUserTodayUploadCount(userId);
    const siteCount = getSiteTodayUploadCount();
    const hitUser = userCount >= USER_DAILY_LIMIT;
    const hitSite = siteCount >= SITE_DAILY_LIMIT;
    const message = hitUser
      ? `您今日已上传 ${userCount} 张，达到单用户限额 ${USER_DAILY_LIMIT} 张/天，明日再来～`
      : hitSite
        ? `今日全站用户已上传 ${siteCount} 张，达到公共限额 ${SITE_DAILY_LIMIT} 张/天，请站长升级 ImgURL VIP 或明日再试`
        : "今日上传额度不足";
    return NextResponse.json(
      { error: message, meta: { userCount, siteCount, USER_DAILY_LIMIT, SITE_DAILY_LIMIT } },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: "未选择文件" }, { status: 400 });
    }

    const imgFormData = new FormData();
    imgFormData.append("file", file);
    imgFormData.append("uid", process.env.IMGURL_UID || "");
    imgFormData.append("token", process.env.IMGURL_TOKEN || "");

    const res = await fetch("https://www.imgurl.org/api/v2/upload", {
      method: "POST",
      body: imgFormData,
    });

    const data = await res.json();

    if (data.code === 200) {
      recordUpload(userId);
      return NextResponse.json({
        success: true,
        data: { url: data.data.url },
      });
    }

    // ImgURL 自己报错（额度耗尽、违规图等）—— 透传消息
    console.warn("[user] ImgURL 上传拒绝:", data);
    return NextResponse.json(
      { success: false, message: data.msg || "上传失败（图床返回错误）" },
      { status: 422 },
    );
  } catch (err) {
    console.error("[user] Image upload failed:", err);
    return NextResponse.json({ success: false, message: "上传失败" }, { status: 500 });
  }
}
