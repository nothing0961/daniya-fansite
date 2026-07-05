import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { image, name } = body;

    // ---- 字段级校验 ----
    if (image !== undefined && typeof image !== "string") {
      return NextResponse.json({ error: "image 必须是字符串" }, { status: 400 });
    }

    if (name !== undefined) {
      if (typeof name !== "string") {
        return NextResponse.json({ error: "昵称必须是字符串" }, { status: 400 });
      }
      const trimmedName = name.trim();
      // 昵称长度 2-20 字符（太短无法识别，太长占界面）
      if (trimmedName.length < 2) {
        return NextResponse.json({ error: "昵称至少 2 个字符" }, { status: 400 });
      }
      if (trimmedName.length > 20) {
        return NextResponse.json({ error: "昵称不能超过 20 个字符" }, { status: 400 });
      }
    }

    // ---- 构造需要更新的字段（只更新传入的）----
    const data: { image?: string | null; name?: string } = {};
    if (image !== undefined) {
      data.image = image ?? null;
    }
    if (name !== undefined) {
      data.name = name.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { image: true, name: true },
    });

    return NextResponse.json({ image: updated.image, name: updated.name });
  } catch (err) {
    console.error("[user] Profile update failed:", err);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
