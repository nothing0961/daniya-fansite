/**
 * QQ OAuth 2.0 Provider — Auth.js v5 自定义 Provider
 *
 * QQ OAuth 与标准 OAuth 有两个关键差异：
 * 1. token 端点返回 URL-encoded 字符串（非 JSON），需 conform 转换
 * 2. 获取用户信息需两步：先拿 openid（/oauth2.0/me），再拿用户资料（/user/get_user_info）
 *
 * 注册地址: https://connect.qq.com/
 * 回调 URL:  https://你的域名/api/auth/callback/qq
 */
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import type { TokenSet } from "@auth/core/types";

export interface QQProfile {
  ret: number;
  msg: string;
  nickname: string;
  figureurl: string;
  figureurl_1: string;
  figureurl_2: string;
  figureurl_qq_1: string;
  figureurl_qq_2: string;
  gender: string;
  /** 自定义：由 userinfo.request 注入 */
  openid?: string;
}

export default function QQ<P extends QQProfile>(
  config: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "qq",
    name: "QQ",
    type: "oauth",

    authorization: {
      url: "https://graph.qq.com/oauth2.0/authorize",
      params: { scope: "get_user_info" },
    },

    /**
     * Token 端点 — QQ 返回 URL-encoded 而非 JSON
     * 使用 conform 将 QQ 的 query-string 响应转换为 JSON
     */
    token: {
      url: "https://graph.qq.com/oauth2.0/token",
      async conform(response: Response) {
        const text = await response.text();

        // QQ 错误响应也是 URL-encoded: callback({"error":...})
        if (text.startsWith("callback(")) {
          const errorJson = JSON.parse(
            text.replace(/^callback\(\s*/, "").replace(/\s*\);?\s*$/, "")
          );
          throw new Error(
            `QQ Token 错误: ${errorJson.error} — ${errorJson.error_description || ""}`
          );
        }

        // 正常响应: access_token=xxx&expires_in=7776000&refresh_token=xxx
        const params = new URLSearchParams(text);
        if (params.get("error") || params.get("code") === "-1") {
          throw new Error(
            `QQ Token 错误: ${params.get("description") || "未知"}`
          );
        }

        return new Response(
          JSON.stringify({
            access_token: params.get("access_token"),
            expires_in: Number(params.get("expires_in")) || undefined,
            refresh_token: params.get("refresh_token"),
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },

    /**
     * Userinfo — QQ 需两步获取
     * Step 1: 拿 openid（/oauth2.0/me 返回 JSONP）
     * Step 2: 拿用户资料（/user/get_user_info 返回 JSON）
     */
    userinfo: {
      url: "https://graph.qq.com/user/get_user_info",
      async request({ tokens, provider }: { tokens: TokenSet; provider: OAuthConfig<P> }) {
        // Step 1: 获取 openid
        const meRes = await fetch(
          `https://graph.qq.com/oauth2.0/me?access_token=${tokens.access_token}`
        );
        const meText = await meRes.text();
        const meJson = JSON.parse(
          meText.replace(/^callback\(\s*/, "").replace(/\s*\);?\s*$/, "")
        );

        if (meJson.error) {
          throw new Error(
            `QQ OpenID 错误: ${meJson.error} — ${meJson.error_description || ""}`
          );
        }

        const openid = meJson.openid;
        const clientId = provider.clientId;

        // Step 2: 获取用户资料
        const userRes = await fetch(
          `https://graph.qq.com/user/get_user_info?access_token=${tokens.access_token}&oauth_consumer_key=${clientId}&openid=${openid}`
        );
        const profile: QQProfile = await userRes.json();

        if (profile.ret !== 0) {
          throw new Error(`QQ 获取用户信息失败: ${profile.msg}`);
        }

        profile.openid = openid;
        return profile;
      },
    },

    /** 映射 QQ 字段 → Auth.js 标准字段 */
    profile(profile) {
      return {
        id: (profile as QQProfile).openid!,
        name: profile.nickname,
        email: null, // QQ 不返回邮箱
        image: profile.figureurl_qq_2 || profile.figureurl_2,
      };
    },

    style: {
      logo: "",
      bg: "#12B7F5",
      text: "#fff",
    },
  };
}
