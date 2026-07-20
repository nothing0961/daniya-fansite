import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

async function tryWakeUpDatabase(): Promise<boolean> {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return false;

  const wakeClient = new PrismaClient({
    datasources: {
      db: { url: directUrl }
    }
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await wakeClient.$connect();
      await wakeClient.$queryRaw`SELECT 1`;
      await wakeClient.$disconnect();
      console.log(`[Prisma] DB woken up via Direct URL (attempt ${attempt})`);
      return true;
    } catch {
      await wakeClient.$disconnect().catch(() => {});
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  await wakeClient.$disconnect().catch(() => {});
  return false;
}

async function executeWithWakeUp<T>(fn: () => Promise<T>): Promise<T> {
  for (let retry = 0; retry <= 1; retry++) {
    try {
      return await fn();
    } catch (e) {
      const error = e as { code?: string; message?: string };
      if (retry === 0 && (error.code === "P1001" || (error.message && error.message.includes("Can't reach database server")))) {
        console.log("[Prisma] Connection failed, trying to wake up DB...");
        if (await tryWakeUpDatabase()) {
          console.log("[Prisma] DB woken up, retrying query...");
          continue;
        }
      }
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient();
  const clientAsAny = client as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;

  const modelNames = ['user', 'account', 'bookmark', 'postLike', 'comment', 'pendingPost', 'verificationToken'] as const;

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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}