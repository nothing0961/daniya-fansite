/**
 * Auth.js v5 配置（核心文件）
 * 支持：GitHub OAuth / QQ OAuth / 邮箱 Magic Link / 手机验证码
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import QQ from "@/lib/auth/qq-provider";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Prisma 适配器 — 将用户数据持久化到 PostgreSQL
  adapter: PrismaAdapter(prisma),

  // 登录提供商配置
  providers: [
    Nodemailer({
      server: {},
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
    Credentials({
      id: "phone",
      name: "手机验证码",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone?.toString().trim();
        const code = credentials?.code?.toString().trim();

        if (!phone || !code) return null;

        // 校验验证码
        const record = await prisma.verificationToken.findUnique({
          where: {
            identifier_token: { identifier: phone, token: code },
          },
        });

        if (!record || record.expires < new Date()) return null;

        // 验证通过，删除已用的验证码
        await prisma.verificationToken.delete({
          where: {
            identifier_token: { identifier: phone, token: code },
          },
        });

        // 查找或创建用户
        const existing = await prisma.user.findUnique({
          where: { phone },
        });

        if (existing) {
          // 更新手机验证状态
          if (!existing.phoneVerified) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { phoneVerified: new Date() },
            });
          }
          return {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            image: existing.image,
            phone: existing.phone,
            phoneVerified: existing.phoneVerified || new Date(),
          };
        }

        // 新用户注册
        const user = await prisma.user.create({
          data: {
            phone,
            phoneVerified: new Date(),
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
        };
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    QQ({
      clientId: process.env.AUTH_QQ_ID!,
      clientSecret: process.env.AUTH_QQ_SECRET!,
    }),
  ],

  // 自定义页面路径
  pages: {
    signIn: "/login",
    // error: "/login",
  },

  // JWT 策略 — 无需数据库 Session 表
  session: {
    strategy: "jwt",
  },

  // 回调 — 扩展 token/session 字段
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).phone = user.phone;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.phone = (token as Record<string, unknown>).phone as string | null | undefined;
      }
      return session;
    },
  },
});
