/**
 * 7月9日 P0 安全头修复 · TDD RED
 * 要求：
 *  1) 开发环境（NODE_ENV !== "production"）headers() 返回空数组 → 保证 next dev HMR 不被 CSP 拦
 *  2) 生产环境 headers() 返回 1 条全局规则 source="/:path*"，至少包含 5 条必备 key：
 *     - Strict-Transport-Security  (HSTS)
 *     - X-Frame-Options            (防点击劫持)
 *     - X-Content-Type-Options     (防 MIME 嗅探)
 *     - Referrer-Policy            (隐私/防盗链)
 *     - Content-Security-Policy    (防 XSS 核心)
 *     并且 CSP 的 connect-src / media-src 白名单里必须包含本项目真实在用的外联域，
 *     否则会出现"能编译但 ImgURL 上传失败/音乐播放器 blob 不能播"。
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";

/** 静态导入 next.config.mjs（ESM）。
 *  注意：headers() 是 async 函数，**每次执行时才读取 process.env.NODE_ENV**，
 *  所以同一个 cfg 对象，只要 beforeEach 改掉 NODE_ENV 再调用，返回值会按新环境变化，
 *  不需要重新 import。 */
import cfg from "../next.config.mjs";

describe("next.config.mjs · 生产安全响应头（P0 7月9日审计）", () => {
  let origEnv: string | undefined;
  beforeEach(() => {
    origEnv = process.env.NODE_ENV;
  });
  function setNodeEnv(next: string) {
    // vitest 下 process.env.NODE_ENV 是默认只读，必须用 defineProperty 才能修改，
    // 否则直接赋值表面无报错实际不生效 → 导致 isProd 永远 false。
    Object.defineProperty(process.env, "NODE_ENV", {
      value: next,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  afterEach(() => {
    if (origEnv === undefined) {
      Object.defineProperty(process.env, "NODE_ENV", {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      setNodeEnv(origEnv);
    }
  });

  it("[开发环境] headers() 必须返回空数组，不影响 next dev HMR 热更新", async () => {
    setNodeEnv("development");
    const result = typeof cfg.headers === "function" ? await cfg.headers() : undefined;
    expect(result).toEqual([]);
  });

  describe("[生产环境] 5 条必备安全头 + 白名单覆盖项目真实场景", () => {
    let prodHeaders: { key: string; value: string }[] = [];

    beforeEach(async () => {
      setNodeEnv("production");
      const rules = typeof cfg.headers === "function" ? await cfg.headers() : undefined;
      expect(Array.isArray(rules)).toBe(true);
      expect(rules!.length).toBeGreaterThanOrEqual(1);
      const globalRule = rules!.find((r: any) => r && r.source === "/:path*");
      if (!globalRule) throw new Error("生产环境 headers() 未找到 source='/:path*' 的全局规则");
      prodHeaders = globalRule.headers;
    });

    function getHeader(name: string): string | undefined {
      return prodHeaders.find((h) => h.key.toLowerCase() === name.toLowerCase())?.value;
    }

    it("存在 Strict-Transport-Security (HSTS)，max-age ≥ 1 年", () => {
      const v = getHeader("Strict-Transport-Security");
      expect(v).toBeDefined();
      const match = v!.match(/max-age=(\d+)/);
      expect(match).toBeTruthy();
      expect(Number(match![1])).toBeGreaterThanOrEqual(31536000); // 365*86400
      expect(v).toMatch(/includeSubDomains/i);
    });

    it("存在 X-Frame-Options: SAMEORIGIN（防 iframe 点击劫持）", () => {
      expect(getHeader("X-Frame-Options")?.toUpperCase()).toBe("SAMEORIGIN");
    });

    it("存在 X-Content-Type-Options: nosniff（防 MIME 嗅探）", () => {
      expect(getHeader("X-Content-Type-Options")?.toLowerCase()).toBe("nosniff");
    });

    it("存在 Referrer-Policy: strict-origin-when-cross-origin（隐私+防盗链平衡）", () => {
      expect(getHeader("Referrer-Policy")?.toLowerCase()).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    describe("Content-Security-Policy 白名单覆盖本项目真实外联", () => {
      let csp: string;
      beforeEach(() => {
        const v = getHeader("Content-Security-Policy");
        expect(v).toBeDefined();
        csp = v!;
      });

      it("default-src 默认只允许 self，收紧基线", () => {
        expect(csp).toMatch(/default-src[^;]*'self'/);
      });

      it("img-src 包含 data: / blob: / https: → 头像裁剪 blob、ImgURL CDN 都能用", () => {
        expect(csp).toMatch(/img-src[^;]*data:/);
        expect(csp).toMatch(/img-src[^;]*blob:/);
        expect(csp).toMatch(/img-src[^;]*https:/);
      });

      it("media-src 包含 blob: / https: → 音乐播放器 blob URL 播放（ogg 音频 + Popover 面板）", () => {
        expect(csp).toMatch(/media-src[^;]*blob:/);
        expect(csp).toMatch(/media-src[^;]*https:/);
      });

      it("connect-src 白名单包含 https://*.imgurl.org → 用户/管理员上传图片 ImgURL API 不被拦", () => {
        expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.imgurl\.org/);
      });

      it("style-src 允许 'unsafe-inline' → Tailwind v4 + shadcn 组件注入的 inline style 不被拦", () => {
        expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
      });

      it("font-src 包含 data: → Tailwind/lucide 图标字体 data URL 不被拦", () => {
        expect(csp).toMatch(/font-src[^;]*data:/);
      });
    });
  });
});
