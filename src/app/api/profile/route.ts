import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        umkmProfile: true,
        influencerProfile: {
          include: { portfolio: { orderBy: { createdAt: "desc" } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, {
        status: 404,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().optional().nullable(),
  businessName: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  displayName: z.string().min(2).optional(),
  bio: z.string().optional().nullable(),
  followers: z.coerce.number().int().min(0).optional(),
  engagement: z.coerce.number().min(0).max(100).optional(),
  rateMin: z.coerce.number().int().min(0).optional().nullable(),
  rateMax: z.coerce.number().int().min(0).optional().nullable(),
  niches: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data profil tidak valid", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
    });

    if (session.user.role === "UMKM") {
      await prisma.uMKMProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          businessName: data.businessName ?? data.name ?? "Usaha Saya",
          category: data.category ?? "Umum",
          description: data.description ?? undefined,
          location: data.location ?? undefined,
          website: data.website ?? undefined,
          logoUrl: data.logoUrl ?? undefined,
        },
        update: {
          ...(data.businessName ? { businessName: data.businessName } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.website !== undefined ? { website: data.website } : {}),
          ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        },
      });
    } else {
      await prisma.influencerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          displayName: data.displayName ?? data.name ?? "Influencer",
          category: data.category ?? "Umum",
          bio: data.bio ?? undefined,
          location: data.location ?? undefined,
          followers: data.followers ?? 0,
          engagement: data.engagement ?? 0,
          rateMin: data.rateMin ?? undefined,
          rateMax: data.rateMax ?? undefined,
          niches: data.niches ?? [],
          platforms: data.platforms ?? [],
        },
        update: {
          ...(data.displayName ? { displayName: data.displayName } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.followers !== undefined
            ? { followers: data.followers }
            : {}),
          ...(data.engagement !== undefined
            ? { engagement: data.engagement }
            : {}),
          ...(data.rateMin !== undefined ? { rateMin: data.rateMin } : {}),
          ...(data.rateMax !== undefined ? { rateMax: data.rateMax } : {}),
          ...(data.niches ? { niches: data.niches } : {}),
          ...(data.platforms ? { platforms: data.platforms } : {}),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
