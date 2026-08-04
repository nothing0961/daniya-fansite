/**
 * Auth.js v5 配置
 * 用户名 + 密码登录
 *
 * 注意：Credentials provider 的 authorize 函数使用 getPrisma() 懒加载
 * 避免在 session 端点（无需数据库）上触发 Prisma 初始化
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Netlify/Severless 平台必需：信任 AUTH_URL 环境变量指定的域名
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toString().trim();
        const password = credentials?.password?.toString();

        if (!username || !password) return null;

        try {
          const prisma = await getPrisma();
          const user = await prisma.user.findUnique({ where: { username } });
          if (!user || !user.passwordHash) {
            throw new Error("USER_NOT_REGISTERED");
          }

          const valid = await verifyPassword(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (err) {
          const error = err as Error;
          if (error.message === "USER_NOT_REGISTERED") {
            throw error;
          }
          console.error("[Auth] Login error:", error.message);
          // 数据库连接失败时返回 null（返回错误会导致 500）
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.image = user.image;
      }
      // 支持客户端 update() 刷新头像
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? token.sub ?? "";
        session.user.image = token.image ?? null;
      }
      return session;
    },
  },
});
