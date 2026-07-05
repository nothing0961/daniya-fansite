import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "../src/lib/admin";
import { auth } from "@/auth";

// mock @/auth（真实实现会去读数据库，测试里必须 mock）
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

const ADMIN_ID = "admin-user-001";
const NORMAL_USER_ID = "user-normal-001";

describe("requireAdmin 管理员守卫", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 每次测试把环境变量设成固定 ADMIN_ID
    process.env.ADMIN_USER_ID = ADMIN_ID;
  });

  it("未登录（session 为 null）应返回 401", async () => {
    (auth as any).mockResolvedValueOnce(null);
    const res = await requireAdmin();
    expect(res.error).not.toBeNull();
    // NextResponse.json() 的 status 要读 .status 属性
    expect((res.error as any).status).toBe(401);
    expect(res.session).toBeNull();
  });

  it("登录了但没有 user.id（异常 session）应返回 401", async () => {
    (auth as any).mockResolvedValueOnce({ user: { email: "a@b.com" } }); // 缺 id
    const res = await requireAdmin();
    expect((res.error as any).status).toBe(401);
  });

  it("登录了但 ID 不等于 ADMIN_USER_ID，应返回 403", async () => {
    (auth as any).mockResolvedValueOnce({ user: { id: NORMAL_USER_ID, email: "u@b.com" } });
    const res = await requireAdmin();
    expect((res.error as any).status).toBe(403);
    expect(await (res.error as any).json()).toMatchObject({ error: "无管理员权限" });
    expect(res.session).toBeNull();
  });

  it("ID 等于 ADMIN_USER_ID，应返回 error=null 且带回 session", async () => {
    const session = { user: { id: ADMIN_ID, email: "admin@x.com", name: "站长" } };
    (auth as any).mockResolvedValueOnce(session);
    const res = await requireAdmin();
    expect(res.error).toBeNull();
    expect(res.session).toEqual(session);
  });
});

describe("requireAdmin 对空/缺失 ADMIN_USER_ID 的防御", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ADMIN_USER_ID 未配置时，任何用户（包括原本是站长的）都应被 403 拦住", async () => {
    delete process.env.ADMIN_USER_ID;
    (auth as any).mockResolvedValueOnce({ user: { id: ADMIN_ID, email: "admin@x.com" } });
    const res = await requireAdmin();
    // session.user.id !== undefined (process.env 删了就是 undefined)  → 403
    expect((res.error as any).status).toBe(403);
  });
});
