import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiChat, aiInfo, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_BRIEF } from "@/lib/prompts";
import { aiErrorResponse, requireSession, readString, isResponse } from "@/lib/ai-route";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODES: Record<string, string> = {
  strategi: "susun strategi pemasaran singkat yang bisa langsung dijalankan",
  brief: "susun brief kampanye yang rapi siap salin ke form Kolabora",
  caption: "buat caption promosi produk",
  ide: "beri ide konten dan angle yang belum coba dipakai",
  analisis: "analisis posisi brand dan pesaing di kategori yang sama",
  chat: "jawab pertanyaan pengguna",
};

/**
 * POST /api/ai/brief
 * Asisten AI untuk UMKM (juga bisa dipakai influencer) berbasis profil di database.
 * Body: { prompt, mode?, includeCampaigns? }
 */
export async function POST(req: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.res;

  const quota = guardAiQuota(guard.userId);
  if (quota) return quota;

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = readString(body.prompt, "Permintaan", 8, 3000);
    if (isResponse(prompt)) return prompt;

    const modeKey = clampText(body.mode, 20).toLowerCase();
    const mode = MODES[modeKey] ? modeKey : "chat";
    const wantCampaigns = body.includeCampaigns !== false;

    const umkm =
      guard.role === "UMKM"
        ? await prisma.uMKMProfile.findUnique({
            where: { userId: guard.userId },
            include: { user: { select: { name: true } } },
          })
        : null;

    const influencer =
      guard.role === "INFLUENCER"
        ? await prisma.influencerProfile.findUnique({ where: { userId: guard.userId } })
        : null;

    const campaigns =
      wantCampaigns && umkm
        ? await prisma.campaign.findMany({
            where: { ownerId: guard.userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { title: true, category: true, status: true, budgetMin: true, budgetMax: true, location: true, deliverables: true },
          })
        : [];

    const contextBlock = umkm
      ? `KONTEKS USAHA (dari profil Kolabora)
- Nama usaha: ${umkm.businessName}
- Pemilik: ${umkm.user.name ?? "-"}
- Kategori: ${umkm.category}
- Lokasi: ${umkm.location ?? "belum diisi"}
- Website: ${umkm.website ?? "-"}
- Deskripsi usaha: ${clampText(umkm.description ?? "", 900) || "belum diisi"}`
      : influencer
        ? `KONTEKS KREATOR (dari profil Kolabora)
- Nama tampil: ${influencer.displayName}
- Kategori: ${influencer.category}
- Niche: ${influencer.niches.join(", ") || influencer.category}
- Follower: ${influencer.followers.toLocaleString("id-ID")}
- Engagement rate: ${influencer.engagement}%
- Lokasi: ${influencer.location ?? "belum diisi"}
- Tarif: ${influencer.rateMin?.toLocaleString("id-ID") ?? "-"} - ${influencer.rateMax?.toLocaleString("id-ID") ?? "-"}
- Bio: ${clampText(influencer.bio ?? "", 300) || "-"}`
        : "KONTEKS PENGGUNA\nProfil belum dilengkapi. Ajukan pertanyaan bila informasi kunci hilang.";

    const campaignBlock = campaigns.length
      ? `\n\nCAMPAIGN MILIK USAHA INI\n${campaigns
          .map(
            (c) =>
              `- ${c.title} [${c.status}] kategori ${c.category}, budget Rp ${c.budgetMin.toLocaleString("id-ID")}-${c.budgetMax.toLocaleString(
                "id-ID",
              )}, lokasi ${c.location ?? "-"}`,
          )
          .join("\n")}`
      : "";

    const content = await aiChat({
      messages: [
        { role: "system", content: SYSTEM_BRIEF },
        {
          role: "user",
          content: `${contextBlock}${campaignBlock}\n\nTUJUAN: ${MODES[mode]}\n\nPERMINTAAN PENGGUNA: ${prompt}`,
        },
      ],
      temperature: mode === "analisis" ? 0.5 : 0.75,
      maxTokens: mode === "brief" ? 1600 : 1100,
    });

    return NextResponse.json({ content: content.trim(), mode, model: aiInfo().model });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
