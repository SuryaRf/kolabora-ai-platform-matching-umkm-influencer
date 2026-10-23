import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const campaignInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      image: true,
      umkmProfile: {
        select: {
          businessName: true,
          category: true,
          location: true,
          logoUrl: true,
        },
      },
    },
  },
  _count: { select: { applications: true } },
} as const;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "1";

    if (mine) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const campaigns = await prisma.campaign.findMany({
        where: { ownerId: session.user.id },
        include: campaignInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(campaigns);
    }

    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Get campaigns error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

const campaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  category: z.string().min(2),
  budgetMin: z.coerce.number().int().positive(),
  budgetMax: z.coerce.number().int().positive(),
  location: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "UMKM") {
      return NextResponse.json(
        { error: "Hanya UMKM yang bisa membuat campaign" },
        { status: 403 },
      );
    }

    const parsed = campaignSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data campaign tidak valid", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (data.budgetMax < data.budgetMin) {
      return NextResponse.json(
        { error: "Budget maksimum harus lebih besar dari minimum" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        ownerId: session.user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        location: data.location ?? undefined,
        requirements: data.requirements ?? undefined,
        deliverables: data.deliverables ?? undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
