import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

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

    // Normalize ImgURL response to match client expectations
    if (data.code === 200) {
      return NextResponse.json({
        success: true,
        data: { url: data.data.url },
      });
    }

    return NextResponse.json({
      success: false,
      message: data.msg || "上传失败",
    });
  } catch (err) {
    console.error("[admin] Image upload failed:", err);
    return NextResponse.json({ success: false, message: "上传失败" }, { status: 500 });
  }
}
