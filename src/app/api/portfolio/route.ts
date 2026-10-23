import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      include: { portfolio: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json(profile?.portfolio ?? []);
  } catch (error) {
    console.error("Get portfolio error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

async function ensureProfile(userId: string, name: string | null | undefined) {
  const existing = await prisma.influencerProfile.findUnique({
    where: { userId },
  });
  if (existing) return existing;
  return prisma.influencerProfile.create({
    data: {
      userId,
      displayName: name ?? "Influencer",
      category: "Umum",
      niches: [],
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INFLUENCER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await ensureProfile(session.user.id, session.user.name);
    const contentType = req.headers.get("content-type") ?? "";

    let title = "";
    let link: string | null = null;
    let imageUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      title = String(form.get("title") ?? "");
      link = (form.get("link") as string) || null;

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File wajib diunggah" }, {
          status: 400,
        });
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          { error: "BLOB_READ_WRITE_TOKEN belum dikonfigurasi" },
          { status: 500 },
        );
      }

      const blob = await put(`portfolio/${Date.now()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      imageUrl = blob.url;
    } else {
      const body = (await req.json()) as {
        title?: string;
        link?: string;
        imageUrl?: string;
      };
      title = body.title ?? "";
      link = body.link ?? null;
      imageUrl = body.imageUrl ?? "";
    }

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Judul dan gambar portfolio wajib diisi" },
        { status: 400 },
      );
    }

    const item = await prisma.portfolioItem.create({
      data: { profileId: profile.id, title, link, imageUrl },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create portfolio error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    }

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, {
        status: 404,
      });
    }

    await prisma.portfolioItem.deleteMany({
      where: { id, profileId: profile.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
