/**
 * Auth.js v5 配置
 * 用户名 + 密码登录
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.passwordHash) {
          // 用户不存在 → 抛特定错误码（前端弹窗"该用户未注册"用）
          // 密码为 null（未来 OAuth 合并账号）时也按"未注册"语义处理更安全
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
