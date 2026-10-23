import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "UMKM" | "INFLUENCER" | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "UMKM" | "INFLUENCER" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "UMKM" | "INFLUENCER" | null;
  }
}
