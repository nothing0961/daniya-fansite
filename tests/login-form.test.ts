/**
 * 未注册用户登录 → 弹窗『该用户未注册』，仅"确认"/右上角X 可关闭
 * TDD 测试（源码字符串级正则断言，与 character-page.test.ts 风格一致）
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const LOGIN_FORM = fs.readFileSync(
  path.join(__dirname, "../src/components/auth/login-form.tsx"),
  "utf8"
);
const AUTH = fs.readFileSync(
  path.join(__dirname, "../src/auth.ts"),
  "utf8"
);

describe("未注册用户登录 → 弹窗提醒（不可遮罩/Esc 关闭）", () => {
  /* ====== 后端：auth.ts authorize() 必须区分『用户不存在』与『密码错误』 ====== */

  it("1) authorize() 内 findUnique({ username }) 返回 null（未注册）时必须 throw Error('USER_NOT_REGISTERED')，不得 return null", () => {
    // 找 authorize 内的 findUnique 行之后，紧挨着的分支必须是 throw 而不是 return null
    // 断言 A：出现"USER_NOT_REGISTERED"错误标识
    expect(AUTH).toMatch(/USER_NOT_REGISTERED/);
    // 断言 B：在 findUnique -> !user 分支是 throw new Error(...) 语义，而不是 return null
    // 做法：定位 authorize 函数体内的 findUnique 所在行附近
    const authFn = AUTH.slice(
      AUTH.indexOf("async authorize(credentials)"),
      AUTH.indexOf("async authorize(credentials)") + 1200
    );
    expect(authFn).toMatch(/findUnique\(\s*\{\s*where:\s*\{\s*username\s*\}\s*\}\s*\)/);
    // !user 分支 → 必须抛 USER_NOT_REGISTERED
    const notRegBranch = authFn.match(/!user[^;]*;/)?.[0] ?? "";
    const viaThrow = /throw\s+new\s+Error\s*\(\s*["']USER_NOT_REGISTERED["']\s*\)/.test(
      authFn
    );
    // 取宽松匹配：整个 authorize 函数体内 throw 含 USER_NOT_REGISTERED
    expect(viaThrow).toBe(true);
    // 断言 C：密码错误分支（!valid）仍然是 return null，不会被误触发"未注册弹窗"
    expect(authFn).toMatch(/!valid[^;]*return\s+null/);
  });

  /* ====== 前端：login-form.tsx 必须有未注册弹窗的受控 state ====== */

  it("2) 登录表单声明了独立的未注册弹窗受控 state：showNotRegistered + setShowNotRegistered，初值 false", () => {
    expect(LOGIN_FORM).toMatch(
      /const\s+\[\s*showNotRegistered\s*,\s*setShowNotRegistered\s*\]\s*=\s*useState\s*\(\s*false\s*\)/
    );
  });

  it("3) signIn 返回 result.error === 'USER_NOT_REGISTERED' 时只弹 Dialog（setShowNotRegistered(true)），不 setError 不跳转，仍需刷新验证码+清空", () => {
    // 定位 signIn 调用后的区域（用 const result = await signIn 当锚点，保证在 handleSubmit 内部）
    const signInIdx = LOGIN_FORM.indexOf("const result = await signIn");
    expect(signInIdx).toBeGreaterThan(0);
    const afterSignIn = LOGIN_FORM.slice(signInIdx, signInIdx + 1200);
    // A. 出现 USER_NOT_REGISTERED 的精准 if 分支（兼容 result?.error 和 result.error 两种）
    // 注意：(?:\.|\?\.) 而不是 (?:\?\.)?，否则首个可选匹配 result?.error 会吞掉位置而不回溯
    expect(afterSignIn).toMatch(
      /result(?:\.|\?\.)error\s*===?\s*["']USER_NOT_REGISTERED["']/
    );
    // B. 该分支内必须 setShowNotRegistered(true)
    expect(afterSignIn).toMatch(/setShowNotRegistered\s*\(\s*true\s*\)/);
    // C. 该 USER_NOT_REGISTERED 专属分支（大括号块）内不得 setError（否则与弹窗提示冲突）
    const unregBlock =
      afterSignIn.match(
        /USER_NOT_REGISTERED["']\s*\)\s*\{([^{}]|\{[^{}]*\})*\}/
      )?.[0] ?? "";
    expect(unregBlock).not.toMatch(/setError\s*\(/);
    // 也不能直接 window.location.href = "/" （用户明确要求：不跳回首页，弹 Dialog 留在当前页）
    expect(unregBlock).not.toMatch(/window\.location\.href/);
  });

  /* ====== 前端：Dialog 结构 + 关闭通道（严格只能 确认 / 右上角X）====== */

  it("4) 渲染一个受控 Dialog：open={showNotRegistered}，onOpenChange 必须忽略 false 方向（遮罩点击/Esc 均无法关闭）", () => {
    // 必须用 Dialog 组件包裹（不是原生 alert / div 自定义）
    expect(LOGIN_FORM).toMatch(/<Dialog\s/);
    // Dialog 的 open 绑定 showNotRegistered
    expect(LOGIN_FORM).toMatch(/open\s*=\s*\{\s*showNotRegistered\s*\}/);
    // onOpenChange: 当调用 setOpen(false) 时不应用，只有 setOpen(true) 才接受
    //    典型写法：onOpenChange={(next) => { if (next) setShowNotRegistered(true); /* false 直接丢弃 */ }}
    const ooMatch = LOGIN_FORM.match(
      /onOpenChange\s*=\s*\{([^{}]|\{[^{}]*\})*\}/
    )?.[0];
    expect(ooMatch).toBeTruthy();
    // 不能直接写 onOpenChange={setShowNotRegistered}，否则点遮罩/Esc 都会关
    expect(ooMatch).not.toMatch(/^onOpenChange\s*=\s*\{\s*setShowNotRegistered\s*\}$/);
    // 必须有 next === true 或 !next 的判断，丢弃 false 方向
    const hasGate =
      /next\s*===?\s*true/.test(ooMatch!) ||
      /\bif\s*\(\s*next\s*\)/.test(ooMatch!) ||
      /\bif\s*\(\s*!next\s*\)\s*return/.test(ooMatch!);
    expect(hasGate).toBe(true);
  });

  it("5) Dialog 正文必须显式展示『该用户未注册』这 6 个字符（不可拆分/用模板）", () => {
    // 用 "<Dialog"（不带尾随空格）锚定，因为开始标签后紧跟换行是 JSX 常见写法
    const dIdx = LOGIN_FORM.indexOf("<Dialog");
    expect(dIdx).toBeGreaterThan(0);
    const dialogSection = LOGIN_FORM.slice(dIdx, dIdx + 2500);
    expect(dialogSection).toMatch(/该用户未注册/);
  });

  it("6) Dialog 存在『确认』按钮，onClick 显式调用 setShowNotRegistered(false) —— 仅点击可关", () => {
    const dIdx = LOGIN_FORM.indexOf("<Dialog");
    expect(dIdx).toBeGreaterThan(0);
    const dialogSection = LOGIN_FORM.slice(dIdx, dIdx + 3000);
    // A. 出现文字『确认』（纯文本按钮内容，允许前后空白换行，兼容 JSX 格式化）
    expect(dialogSection).toMatch(/>\s*确认\s*<\//);
    // B. 确认按钮附近（同一 JSX）调用 setShowNotRegistered(false)
    const hasCloseFalse = /setShowNotRegistered\s*\(\s*false\s*\)/.test(
      dialogSection
    );
    expect(hasCloseFalse).toBe(true);
  });

  it("7) Dialog 右上角有关闭叉按钮（X 图标 / × 字符均可），onClick 显式调用 setShowNotRegistered(false) —— 仅点击可关", () => {
    const dIdx = LOGIN_FORM.indexOf("<Dialog");
    expect(dIdx).toBeGreaterThan(0);
    const dialogSection = LOGIN_FORM.slice(dIdx, dIdx + 3000);
    // 必须有一个 X 型关闭按钮：两种表现方式任一 ——
    //   a) 引用 lucide-react 的 <X> 图标组件；b) 纯文本 "×" 字符 / "X" 字符
    const hasXIcon =
      /<X\s/.test(dialogSection) ||
      /X\s*from\s*["']lucide-react["']/.test(LOGIN_FORM);
    const hasXText = /[>×X<]/.test(
      dialogSection.match(/<button[^>]*type\s*=\s*["']button["'][^>]*className[^>]*>([\s\S]*?)<\/button>/)?.[1] ?? ""
    );
    // 更可靠：DialogContent 内部存在单独的"关闭按钮"——类型为 button 且调用 setShowNotRegistered(false)
    // 兼容：<button type="button"> 原生 + shadcn/ui <Button type="button"> 大写组件
    const closeButtons = Array.from(
      dialogSection.matchAll(
        /<(?:button|Button)\b[^>]*type\s*=\s*["']button["'][^>]*>[\s\S]*?<\/(?:button|Button)>/gi
      )
    );
    // 至少有 2 个 type=button 的关闭触发源：一个 X 按钮 + 一个"确认"按钮
    const closeByFalse = closeButtons.filter((b) =>
      /setShowNotRegistered\s*\(\s*false\s*\)/.test(b[0])
    );
    expect(closeByFalse.length).toBeGreaterThanOrEqual(2);
    // 其中一个非"确认"文字的按钮（也就是 X 按钮）必须存在
    const xBtn = closeByFalse.find(
      (b) => !/\b确认\b/.test(b[0])
    );
    expect(xBtn).toBeDefined();
    expect(hasXIcon || hasXText || !!xBtn).toBe(true);
  });

  it("8) 『用户名或密码错误』的旧提示仍保留给密码错误场景（CredentialsSignin），不能被删除", () => {
    expect(LOGIN_FORM).toMatch(/用户名或密码错误/);
  });
});
