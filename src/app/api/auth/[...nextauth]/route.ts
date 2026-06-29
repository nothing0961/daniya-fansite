/**
 * Auth.js API 路由处理器
 * 处理所有 /api/auth/* 请求（登录、回调、登出等）
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
