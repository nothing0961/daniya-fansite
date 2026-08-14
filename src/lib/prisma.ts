import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitError?: Error;
};

let prismaPromise: Promise<PrismaClient> | null = null;

/**
 * 检查 Prisma 客户端是否已初始化
 */
export function isPrismaAvailable(): boolean {
  return !!globalForPrisma.prisma && !globalForPrisma.prismaInitError;
}

async function tryWakeUpDatabase(): Promise<boolean> {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return false;

  const wakeClient = new PrismaClient({
    datasources: {
      db: { url: directUrl }
    }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await wakeClient.$connect();
      await wakeClient.$queryRaw`SELECT 1`;
      await wakeClient.$disconnect();
      console.log(`[Prisma] DB woken up via Direct URL (attempt ${attempt})`);
      return true;
    } catch {
      await wakeClient.$disconnect().catch(() => {});
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 300;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  await wakeClient.$disconnect().catch(() => {});
  return false;
}

async function executeWithWakeUp<T>(fn: () => Promise<T>): Promise<T> {
  for (let retry = 0; retry <= 2; retry++) {
    try {
      return await fn();
    } catch (e) {
      const error = e as { code?: string; message?: string };
      const isConnError =
        error.code === "P1001" ||
        (error.message && error.message.includes("Can't reach database server"));

      if (retry === 0 && isConnError) {
        console.log("[Prisma] Connection failed, trying to wake up DB...");
        if (await tryWakeUpDatabase()) {
          // Neon 唤醒的是直连端点；PgBouncer（pooler）还需几秒才接受新连接，
          // 立即重试会拿到和刚才一样的连接错误，先等 pooler 就绪
          console.log("[Prisma] DB woken up, waiting for pooler to accept connections...");
          await new Promise((resolve) => setTimeout(resolve, 2500));
          continue;
        }
      }

      if (retry > 0 && retry < 2 && isConnError) {
        // 唤醒后 pooler 仍未就绪：退避后再次尝试，冷启动偶尔需要更久
        console.log("[Prisma] Pooler still unreachable, backing off and retrying...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient();
  const clientAsAny = client as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;

  const modelNames = ['user', 'account', 'bookmark', 'postLike', 'comment', 'pendingPost', 'verificationToken', 'chatQuota'] as const;

  for (const model of modelNames) {
    const modelClient = clientAsAny[model];
    if (!modelClient) continue;

    const methods = ['findUnique', 'findMany', 'findFirst', 'create', 'update', 'delete', 'count', 'aggregate', 'groupBy', 'upsert'] as const;
    
    for (const method of methods) {
      if (typeof modelClient[method] === 'function') {
        const original = modelClient[method];
        modelClient[method] = (...args: unknown[]) => executeWithWakeUp(() => original(...args));
      }
    }
  }

  const clientMethods = ['$queryRaw', '$executeRaw', '$queryRawUnsafe', '$executeRawUnsafe'] as const;
  const clientMethodsObj = client as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  for (const method of clientMethods) {
    const original = clientMethodsObj[method];
    if (typeof original === 'function') {
      clientMethodsObj[method] = (...args: unknown[]) => executeWithWakeUp(() => original(...args));
    }
  }

  return client;
}

/**
 * 懒加载 Prisma 客户端 — 仅在首次调用时初始化
 * 
 * ⚠️ Netlify Serverless 注意：
 * - Prisma Client 创建是轻量的（不触发网络连接）
 * - 真正的数据库连接在首次查询时建立
 * - executeWithWakeUp() 会在查询失败时自动唤醒 Neon 并重试
 * 
 * 两种使用方式：
 * 1. `import { prisma }` — 同步导入，适合 Next.js Server Component / API Route
 *    （Prisma Client 在模块加载时创建，不触发网络）
 * 2. `import { getPrisma }` — 异步获取，需要时可做健康检查
 *    （适合需要预先验证连接的场景）
 */
export async function getPrisma(): Promise<PrismaClient> {
  // 已初始化成功（包括通过 export const prisma 同步创建的实例）
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // 之前初始化失败，重试
  if (globalForPrisma.prismaInitError) {
    console.log("[Prisma] Retrying initialization after previous failure...");
    globalForPrisma.prismaInitError = undefined;
  }

  // 正在初始化中，复用同一个 Promise
  if (prismaPromise) {
    return prismaPromise;
  }

  prismaPromise = (async () => {
    try {
      const client = createPrismaClient();
      // 验证连接是否可用（超时 3s）
      // 注意：这不是必须的，因为 executeWithWakeUp 会在查询时处理连接
      // 但对于需要预先确认连接的场景（如健康检查）很有用
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Prisma initialization timeout (3s)")), 3000)
      );
      await Promise.race([
        client.$queryRaw`SELECT 1`,
        timeoutPromise
      ]);
      globalForPrisma.prisma = client;
      console.log("[Prisma] Client initialized successfully (verified)");
      return client;
    } catch (err) {
      const error = err as Error;
      console.error("[Prisma] Initialization verification failed:", error.message);
      // 即使验证失败，仍然返回客户端
      // 因为 executeWithWakeUp 会在实际查询时处理连接失败
      const client = createPrismaClient();
      globalForPrisma.prisma = client;
      globalForPrisma.prismaInitError = undefined; // 清除错误，后续可重试
      console.warn("[Prisma] Client created but verification failed, will retry on first query");
      return client;
    }
  })();

  return prismaPromise;
}

/**
 * 同步获取 Prisma 客户端（仅当已初始化时可用）
 * 用于不需要 async 的场景，但如果未初始化会抛错
 */
export function getPrismaSync(): PrismaClient {
  if (!globalForPrisma.prisma) {
    throw new Error("Prisma client not initialized yet. Call getPrisma() first.");
  }
  return globalForPrisma.prisma;
}

/**
 * 默认导出 — PrismaClient 实例
 * 
 * ⚠️ Netlify Serverless 环境下：
 * - 此实例在模块加载时创建（轻量，不触发网络连接）
 * - 首次实际查询时才会建立数据库连接
 * - executeWithWakeUp() 会自动处理连接失败和 Neon 数据库唤醒
 * - 如果查询失败，会指数退避重试
 * 
 * 这是项目主要的 Prisma 使用方式，已被 16+ 文件引用
 * 如需预先验证连接，请使用 getPrisma()
 */
export const prisma: PrismaClient = (() => {
  try {
    const client = createPrismaClient();
    globalForPrisma.prisma = client;
    console.log("[Prisma] Client instance created (no network connection yet)");
    return client;
  } catch (err) {
    const error = err as Error;
    console.error("[Prisma] Client creation failed:", error.message);
    // 失败时仍然创建实例，让 executeWithWakeUp 在查询时重试
    return createPrismaClient();
  }
})();
