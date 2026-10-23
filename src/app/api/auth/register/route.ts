import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["UMKM", "INFLUENCER"]),
  businessName: z.string().optional(),
  displayName: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { name, email, password, role, businessName, displayName, category } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        ...(role === "UMKM" && businessName
          ? {
              umkmProfile: {
                create: {
                  businessName,
                  category: category || "Umum",
                },
              },
            }
          : {}),
        ...(role === "INFLUENCER" && displayName
          ? {
              influencerProfile: {
                create: {
                  displayName,
                  category: category || "Umum",
                  followers: 0,
                  engagement: 0,
                  niches: [],
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
