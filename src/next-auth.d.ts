import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    phone?: string | null;
    phoneVerified?: Date | null;
  }
  interface Session {
    user: {
      id: string;
      phone?: string | null;
      phoneVerified?: Date | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    image?: string | null;
    phone?: string | null;
    phoneVerified?: Date | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    image?: string | null;
  }
}
