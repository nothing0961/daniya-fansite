/**
 * AI 聊天入口验证 T-D（抽屉化改造后）
 *
 * 聊天功能已从独立 /chat 页面迁移为全局抽屉：
 *   桌面导航「飞讯」→ button（点击 openDrawer）
 *   移动端菜单「飞讯」→ 拦截跳转，点击 openDrawer
 *
 * 断言：
 *   1. 桌面 NavLinks「飞讯」是 button，点击调用 openDrawer
 *   2. 移动端 MobileNav「飞讯」点击拦截跳转并调用 openDrawer
 *   3. HeaderChatButton（登录拦截入口）渲染聊天入口按钮
 *
 * 风格：RTL
 */
/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { openDrawerMock } = vi.hoisted(() => ({ openDrawerMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "test-user-id",
        name: "测试用户",
        image: "/avatar-cropped.jpg",
      },
    },
    status: "authenticated" as const,
  }),
}));

vi.mock("../src/components/chat/chat-drawer-context", () => ({
  useChatDrawer: () => ({
    open: false,
    openDrawer: openDrawerMock,
    closeDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
  }),
}));

describe("AI 聊天 T-D：聊天入口验证（抽屉化）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("D-1. 桌面导航「飞讯」为 button，点击打开聊天抽屉", async () => {
    const user = userEvent.setup();
    const { NavLinks } = await import("../src/components/layout/nav-links");
    render(<NavLinks />);
    const btn = screen.getByRole("button", { name: "飞讯" });
    expect(btn.tagName).toBe("BUTTON");
    await user.click(btn);
    expect(openDrawerMock).toHaveBeenCalled();
  });

  it("D-2. 移动端菜单「飞讯」点击拦截跳转并打开抽屉", async () => {
    const user = userEvent.setup();
    const { MobileNav } = await import("../src/components/layout/mobile-nav");
    render(
      <MobileNav links={[{ href: "/chat", label: "飞讯" }]} user={{ id: "test-user-id" }} />,
    );
    await user.click(screen.getByRole("button", { name: "打开菜单" }));
    await user.click(screen.getByRole("link", { name: "飞讯" }));
    expect(openDrawerMock).toHaveBeenCalled();
  });

  it("D-3. HeaderChatButton 登录态渲染聊天入口按钮", async () => {
    const { HeaderChatButton } = await import("../src/components/shared/header-chat-button");
    render(<HeaderChatButton />);
    const btn = screen.getByTestId("header-chat-button");
    expect(btn).toBeInTheDocument();
  });
});
