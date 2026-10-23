import { prisma } from "@/lib/prisma";
import type { CollabDTO, CollabParticipant, Role } from "@/lib/collab";

const participantSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  umkmProfile: {
    select: { businessName: true, category: true, location: true },
  },
  influencerProfile: {
    select: { displayName: true, category: true, location: true },
  },
} as const;

type ParticipantRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  image: string | null;
  umkmProfile: {
    businessName: string;
    category: string;
    location: string | null;
  } | null;
  influencerProfile: {
    displayName: string;
    category: string;
    location: string | null;
  } | null;
};

export function serializeParticipant(p: ParticipantRow): CollabParticipant {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: (p.role as Role | null) ?? null,
    image: p.image,
    businessName: p.umkmProfile?.businessName ?? null,
    displayName: p.influencerProfile?.displayName ?? null,
    category: p.umkmProfile?.category ?? p.influencerProfile?.category ?? null,
    location: p.umkmProfile?.location ?? p.influencerProfile?.location ?? null,
  };
}

export async function getCollaborationsForUser(
  userId: string,
): Promise<CollabDTO[]> {
  const rows = await prisma.collaboration.findMany({
    where: { participants: { some: { id: userId } } },
    include: {
      participants: { select: participantSelect },
      campaign: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
      _count: {
        select: {
          messages: { where: { read: false, senderId: { not: userId } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((c) => {
    const last = c.messages[0] ?? null;
    return {
      id: c.id,
      title: c.title,
      brief: c.brief,
      budget: c.budget,
      status: c.status,
      escrowStatus: c.escrowStatus,
      escrowAmount: c.escrowAmount,
      campaign: c.campaign,
      participants: c.participants.map((p) =>
        serializeParticipant(p as unknown as ParticipantRow),
      ),
      unreadCount: c._count.messages,
      lastMessage: last
        ? {
            content: last.content,
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
          }
        : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      agreedAt: c.agreedAt?.toISOString() ?? null,
      startedAt: c.startedAt?.toISOString() ?? null,
      submittedAt: c.submittedAt?.toISOString() ?? null,
      approvedAt: c.approvedAt?.toISOString() ?? null,
      completedAt: c.completedAt?.toISOString() ?? null,
    };
  });
}

export async function getCollaborationForUser(id: string, userId: string) {
  const collab = await prisma.collaboration.findFirst({
    where: { id, participants: { some: { id: userId } } },
    include: {
      participants: { select: participantSelect },
      campaign: { select: { id: true, title: true } },
      reviews: { orderBy: { submittedAt: "desc" } },
    },
  });
  return collab;
}

export function otherParticipant<T extends { id: string }>(
  participants: T[],
  meId: string,
): T | undefined {
  return participants.find((p) => p.id !== meId);
}

export function initialsOf(name: string | null | undefined, fallback = "?") {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

export function colorForName(name: string | null | undefined) {
  const key = name ?? "";
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
