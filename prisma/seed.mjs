// Demo seed for Kolabora.
// Run with: npm run db:seed   (loads .env via --env-file)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "password123";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

async function upsertUser({ email, name, role }) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  console.log("Seeding Kolabora demo data...");

  const ayu = await upsertUser({
    email: "umkm@kolabora.id",
    name: "Ayu Prameswari",
    role: "UMKM",
  });
  const batik = await upsertUser({
    email: "brand@kolabora.id",
    name: "Dewi Anggraini",
    role: "UMKM",
  });
  const sarah = await upsertUser({
    email: "influencer@kolabora.id",
    name: "Sarah Beauty",
    role: "INFLUENCER",
  });
  const rizky = await upsertUser({
    email: "foodie@kolabora.id",
    name: "Rizky Foodie",
    role: "INFLUENCER",
  });

  await prisma.uMKMProfile.upsert({
    where: { userId: ayu.id },
    update: {},
    create: {
      userId: ayu.id,
      businessName: "Kopi Senja",
      category: "Kuliner",
      description:
        "Kedai kopi lokal di Yogyakarta dengan biji kopi single origin dari petani Sleman. Menyediakan kopi susu gula aren, manual brew, dan pastry rumahan.",
      location: "Yogyakarta",
      website: "https://kopisenja.example.com",
    },
  });

  await prisma.uMKMProfile.upsert({
    where: { userId: batik.id },
    update: {},
    create: {
      userId: batik.id,
      businessName: "Batik Ayu",
      category: "Fashion",
      description:
        "Batik tulis handmade dengan motif kontemporer. Diproduksi oleh pengrajin lokal di Solo dengan pewarna alami.",
      location: "Solo",
      website: "https://batikayu.example.com",
    },
  });

  const sarahProfile = await prisma.influencerProfile.upsert({
    where: { userId: sarah.id },
    update: {},
    create: {
      userId: sarah.id,
      displayName: "Sarah Beauty",
      category: "Kecantikan",
      bio: "Beauty creator yang fokus pada review skincare lokal dan makeup sehari-hari. Audiens perempuan 18-34 tahun di Jabodetabek.",
      location: "Jakarta",
      followers: 48500,
      engagement: 4.8,
      platforms: ["Instagram", "TikTok"],
      niches: ["Skincare", "Makeup", "Beauty Review"],
      rateMin: 750000,
      rateMax: 2500000,
    },
  });

  await prisma.influencerProfile.upsert({
    where: { userId: rizky.id },
    update: {},
    create: {
      userId: rizky.id,
      displayName: "Rizky Foodie",
      category: "Kuliner",
      bio: "Food vlogger Yogyakarta. Konten review kuliner dengan gaya storytelling dan rekomendasi tempat makan hits.",
      location: "Yogyakarta",
      followers: 128000,
      engagement: 6.2,
      platforms: ["TikTok", "Instagram", "YouTube"],
      niches: ["Kuliner", "Food Review", "Travel"],
      rateMin: 1000000,
      rateMax: 4000000,
    },
  });

  async function upsertCampaign(ownerId, data) {
    const existing = await prisma.campaign.findFirst({
      where: { ownerId, title: data.title },
    });
    if (existing) return existing;
    return prisma.campaign.create({ data: { ...data, ownerId } });
  }

  const campaignKopi = await upsertCampaign(ayu.id, {
    title: "Review Menu Kopi Senja",
    description:
      "Kami mencari food creator untuk mereview 3 menu signature Kopi Senja: Kopi Susu Gula Aren, Es Kopi Senja, dan Croissant Butter. Konten berupa 1 video TikTok (minimal 45 detik) + 1 feed Instagram.",
    category: "Kuliner",
    budgetMin: 500000,
    budgetMax: 1500000,
    location: "Yogyakarta",
    requirements:
      "Domisili Yogyakarta atau sekitarnya, followers minimal 10K, gaya konten natural dan storytelling.",
    deliverables: "1 video TikTok + 1 feed Instagram + 3 stories",
  });

  const campaignTikTok = await upsertCampaign(ayu.id, {
    title: "Konten TikTok Racikan Signature",
    description:
      "Buat konten TikTok kreatif yang menampilkan proses pembuatan racikan signature barista kami. Fokus pada visual, ASMR, dan cerita di balik setiap cangkir.",
    category: "Kuliner",
    budgetMin: 750000,
    budgetMax: 2000000,
    location: "Yogyakarta",
    requirements: "Menguasai editing video, followers minimal 20K.",
    deliverables: "2 video TikTok + hak pakai konten untuk ads 30 hari",
  });

  const campaignBatik = await upsertCampaign(batik.id, {
    title: "Batik Ayu Lebaran Collection",
    description:
      "Kampanye peluncuran koleksi Lebaran 2026. Kami mencari fashion creator untuk menampilkan 3 look batik kontemporer dalam konten reels dan carousel.",
    category: "Fashion",
    budgetMin: 1000000,
    budgetMax: 3500000,
    location: "Jakarta",
    requirements: "Niche fashion/lifestyle, followers minimal 30K.",
    deliverables: "1 reels + 1 carousel + 2 stories",
  });

  async function upsertApplication(campaignId, applicantId, data) {
    const existing = await prisma.application.findUnique({
      where: { campaignId_applicantId: { campaignId, applicantId } },
    });
    if (existing) return existing;
    return prisma.application.create({
      data: { campaignId, applicantId, ...data },
    });
  }

  await upsertApplication(campaignKopi.id, sarah.id, {
    proposal:
      "Halo Kopi Senja! Saya Sarah, beauty & lifestyle creator dengan audiens perempuan 18-34 tahun. Saya tertarik membuat konten review menu signature dengan pendekatan estetik dan storytelling. Saya akan menonjolkan suasana kedai dan detail rasa kopi.",
    proposedRate: 1200000,
    status: "PENDING",
  });

  await upsertApplication(campaignTikTok.id, rizky.id, {
    proposal:
      "Hai Kopi Senja! Saya Rizky, food vlogger Jogja dengan 128K followers. Saya bisa bikin konten proses racikan signature dengan gaya ASMR yang engaging, plus rekomendasi menu.",
    proposedRate: 1500000,
    status: "PENDING",
  });

  // Active collaboration: Rizky x Kopi Senja (production stage, escrow held)
  const collabActive = await prisma.collaboration.findFirst({
    where: {
      campaignId: campaignTikTok.id,
      participants: { some: { id: rizky.id } },
    },
  });

  const active =
    collabActive ??
    (await prisma.collaboration.create({
      data: {
        campaignId: campaignTikTok.id,
        title: campaignTikTok.title,
        brief:
          "Buat 2 video TikTok yang menampilkan proses racikan signature barista. Durasi 45-60 detik, vertikal, dengan voice-over storytelling. Kirim draft untuk review sebelum publikasi.",
        budget: 1500000,
        status: "IN_PRODUCTION",
        escrowAmount: 1500000,
        escrowStatus: "HELD",
        escrowHeldAt: daysAgo(3),
        agreedAt: daysAgo(4),
        startedAt: daysAgo(2),
        participants: { connect: [{ id: ayu.id }, { id: rizky.id }] },
      },
    }));

  const existingMessages = await prisma.message.count({
    where: { collaborationId: active.id },
  });
  if (existingMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          collaborationId: active.id,
          senderId: ayu.id,
          content:
            "Halo Rizky! Selamat, lamaranmu kami terima. Dana sudah kami kunci di escrow. Silakan mulai produksi kontennya ya.",
          type: "BRIEF",
          read: true,
          createdAt: daysAgo(4),
        },
        {
          collaborationId: active.id,
          senderId: rizky.id,
          content:
            "Siap Kak Ayu! Saya mulai syuting minggu ini. Apakah ada referensi visual atau menu yang wajib ditonjolkan?",
          type: "TEXT",
          read: true,
          createdAt: daysAgo(3),
        },
        {
          collaborationId: active.id,
          senderId: ayu.id,
          content:
            "Fokus ke Es Kopi Senja dan Croissant Butter ya. Nuansa kedai sore hari, hangat, banyak kayu. Nanti kirim draft dulu sebelum upload.",
          type: "TEXT",
          read: true,
          createdAt: daysAgo(2),
        },
      ],
    });
  }

  // Proposed collaboration: Batik Ayu x Sarah (waiting for influencer)
  const collabProposed = await prisma.collaboration.findFirst({
    where: {
      campaignId: campaignBatik.id,
      participants: { some: { id: sarah.id } },
    },
  });

  if (!collabProposed) {
    const proposed = await prisma.collaboration.create({
      data: {
        campaignId: campaignBatik.id,
        title: campaignBatik.title,
        brief:
          "Tampilkan 3 look koleksi Lebaran dalam 1 reels dan 1 carousel. Tone warna earthy, natural light, lokasi café atau rumah dengan dekorasi minimalis.",
        budget: 2500000,
        status: "PROPOSED",
        participants: { connect: [{ id: batik.id }, { id: sarah.id }] },
      },
    });

    await prisma.message.create({
      data: {
        collaborationId: proposed.id,
        senderId: batik.id,
        content:
          "Halo Sarah! Kami ingin mengajak kamu berkolaborasi untuk koleksi Lebaran Batik Ayu. Brief lengkap ada di halaman kolaborasi. Kami tunggu responsnya ya!",
        type: "BRIEF",
      },
    });

    await prisma.notification.create({
      data: {
        userId: sarah.id,
        type: "COLLABORATION",
        title: "Tawaran kolaborasi baru",
        message: `Batik Ayu mengajak Anda berkolaborasi pada campaign "${campaignBatik.title}".`,
        link: "/dashboard/influencer/history",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: rizky.id,
        type: "MESSAGE",
        title: "Pesan baru dari Kopi Senja",
        message: "Kopi Senja mengirim detail brief untuk konten TikTok.",
        link: "/dashboard/influencer/chat",
      },
      {
        userId: ayu.id,
        type: "APPLICATION",
        title: "Pelamar baru",
        message: `Sarah Beauty melamar campaign "${campaignKopi.title}".`,
        link: `/dashboard/umkm/campaigns/${campaignKopi.id}`,
      },
    ],
  });

  const portfolioCount = await prisma.portfolioItem.count({
    where: { profileId: sarahProfile.id },
  });
  if (portfolioCount === 0) {
    await prisma.portfolioItem.createMany({
      data: [
        {
          profileId: sarahProfile.id,
          title: "Review Skincare Lokal — 120K views",
          imageUrl:
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200",
          link: "https://instagram.com/p/example-skincare",
        },
        {
          profileId: sarahProfile.id,
          title: "Get Ready With Me — Soft Glam",
          imageUrl:
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200",
          link: "https://tiktok.com/@example/video/1",
        },
      ],
    });
  }

  console.log("Seed selesai.");
  console.log("Akun demo (password sama untuk semua: password123):");
  console.log("- umkm@kolabora.id       (UMKM · Kopi Senja)");
  console.log("- brand@kolabora.id      (UMKM · Batik Ayu)");
  console.log("- influencer@kolabora.id (Influencer · Sarah Beauty)");
  console.log("- foodie@kolabora.id     (Influencer · Rizky Foodie)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
