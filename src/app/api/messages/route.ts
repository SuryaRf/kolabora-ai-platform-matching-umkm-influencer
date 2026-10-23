import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { z } from "zod";

async function assertMember(collaborationId: string, userId: string) {
  const collab = await prisma.collaboration.findFirst({
    where: {
      id: collaborationId,
      participants: { some: { id: userId } },
    },
    include: {
      participants: { select: { id: true } },
    },
  });
  return collab;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collaborationId = searchParams.get("collaborationId");
    const since = searchParams.get("since");

    if (!collaborationId) {
      return NextResponse.json(
        { error: "collaborationId wajib diisi" },
        { status: 400 },
      );
    }

    const collab = await assertMember(collaborationId, session.user.id);
    if (!collab) {
      return NextResponse.json(
        { error: "Kolaborasi tidak ditemukan" },
        { status: 404 },
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        collaborationId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      ...(since ? {} : { take: 200 }),
    });

    await prisma.message.updateMany({
      where: {
        collaborationId,
        senderId: { not: session.user.id },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

const sendSchema = z.object({
  collaborationId: z.string().min(1),
  content: z.string().min(1).max(5000),
  type: z.enum(["TEXT", "FILE", "BRIEF", "SYSTEM"]).optional(),
  fileUrl: z.string().url().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = sendSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const { collaborationId, content, type, fileUrl } = parsed.data;

    const collab = await assertMember(collaborationId, session.user.id);
    if (!collab) {
      return NextResponse.json(
        { error: "Kolaborasi tidak ditemukan" },
        { status: 404 },
      );
    }

    const message = await prisma.message.create({
      data: {
        collaborationId,
        senderId: session.user.id,
        content,
        type: type ?? "TEXT",
        fileUrl: fileUrl ?? undefined,
      },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    await prisma.collaboration.update({
      where: { id: collaborationId },
      data: { updatedAt: new Date() },
    });

    const other = collab.participants.find((p) => p.id !== session.user.id);
    if (other) {
      await notify(
        other.id,
        "MESSAGE",
        "Pesan baru",
        `${session.user.name ?? "Seseorang"}: ${content.slice(0, 80)}`,
        session.user.role === "UMKM"
          ? "/dashboard/influencer/chat"
          : "/dashboard/umkm/chat",
      );
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
