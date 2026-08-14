// 一次性脚本：创建投稿预览测试账号（美化验证用）
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pw = await hash("preview-pass-123", 10);
  const user = await prisma.user.upsert({
    where: { username: "submitpreview" },
    update: { passwordHash: pw, name: "投稿预览账号" },
    create: {
      username: "submitpreview",
      name: "投稿预览账号",
      passwordHash: pw,
      email: "submitpreview@example.com",
    },
  });
  console.log("OK", user.id, user.username);
}

main()
  .catch((e) => {
    console.error("FAIL", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
