import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }), session: null };
  }
  if (session.user.id !== process.env.ADMIN_USER_ID) {
    return { error: NextResponse.json({ error: "无管理员权限" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
