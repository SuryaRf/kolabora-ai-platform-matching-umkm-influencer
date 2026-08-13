"use client";

import { Zap, Users, Heart, MapPin, Star } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import OneByOneMatch, { type MatchItem } from "@/components/dashboard/OneByOneMatch";
import { useCollaborations } from "@/lib/collaborations";

const influencers: MatchItem[] = [
  {
    name: "Sarah Beauty",
    subtitle: "Kecantikan & Skincare • Jakarta",
    avatar: "SB",
    color: "bg-pink-500",
    score: 96,
    reasons: [
      { label: "Niche sesuai dengan produk", pct: 100 },
      { label: "Lokasi sesuai target pasar", pct: 95 },
      { label: "Engagement rate sehat", pct: 92 },
      { label: "Audiens dominan wanita 18-34", pct: 90 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "45.2K" },
      { icon: Heart, label: "Engagement", value: "6.8%" },
      { icon: MapPin, label: "Lokasi", value: "Jakarta" },
      { icon: Star, label: "Rating", value: "4.9" },
    ],
  },
  {
    name: "TechReview ID",
    subtitle: "Teknologi & Gadget • Bandung",
    avatar: "TR",
    color: "bg-blue-500",
    score: 92,
    reasons: [
      { label: "Konten sesuai dengan produk", pct: 98 },
      { label: "Audience usia produktif", pct: 93 },
      { label: "Cakupan regional Jawa Barat", pct: 90 },
      { label: "Rating kolaborasi tinggi", pct: 88 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "120.5K" },
      { icon: Heart, label: "Engagement", value: "4.2%" },
      { icon: MapPin, label: "Lokasi", value: "Bandung" },
      { icon: Star, label: "Rating", value: "4.8" },
    ],
  },
  {
    name: "Kuliner Jalanan",
    subtitle: "Kuliner & Food • Yogyakarta",
    avatar: "KJ",
    color: "bg-orange-500",
    score: 89,
    reasons: [
      { label: "Niche kuliner cocok", pct: 100 },
      { label: "Konten lokal yang kuat", pct: 94 },
      { label: "Engagement tinggi", pct: 91 },
      { label: "Pengalaman campaign F&B", pct: 86 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "78.1K" },
      { icon: Heart, label: "Engagement", value: "8.1%" },
      { icon: MapPin, label: "Lokasi", value: "Yogyakarta" },
      { icon: Star, label: "Rating", value: "4.7" },
    ],
  },
  {
    name: "Fitness Journey",
    subtitle: "Olahraga & Kesehatan • Surabaya",
    avatar: "FJ",
    color: "bg-green-500",
    score: 85,
    reasons: [
      { label: "Audience lifestyle aktif", pct: 90 },
      { label: "Konten edukatif & otentik", pct: 88 },
      { label: "Engagement community kuat", pct: 87 },
      { label: "Jangkauan area Jawa Timur", pct: 82 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "32.8K" },
      { icon: Heart, label: "Engagement", value: "7.3%" },
      { icon: MapPin, label: "Lokasi", value: "Surabaya" },
      { icon: Star, label: "Rating", value: "4.6" },
    ],
  },
  {
    name: "Traveler Indo",
    subtitle: "Travel & Lifestyle • Bali",
    avatar: "TI",
    color: "bg-sky-500",
    score: 82,
    reasons: [
      { label: "Konten visual menarik", pct: 89 },
      { label: "Audience wisatawan", pct: 85 },
      { label: "Cakupan nasional", pct: 83 },
      { label: "Fleksibilitas format konten", pct: 78 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "95.3K" },
      { icon: Heart, label: "Engagement", value: "5.5%" },
      { icon: MapPin, label: "Lokasi", value: "Bali" },
      { icon: Star, label: "Rating", value: "4.5" },
    ],
  },
  {
    name: "Mom & Baby",
    subtitle: "Parenting & Keluarga • Jakarta",
    avatar: "MB",
    color: "bg-purple-500",
    score: 78,
    reasons: [
      { label: "Audience ibu muda", pct: 92 },
      { label: "Engagement tinggi", pct: 90 },
      { label: "Lokasi sesuai", pct: 88 },
      { label: "Niche berbeda dari produk", pct: 64 },
    ],
    stats: [
      { icon: Users, label: "Followers", value: "28.6K" },
      { icon: Heart, label: "Engagement", value: "9.2%" },
      { icon: MapPin, label: "Lokasi", value: "Jakarta" },
      { icon: Star, label: "Rating", value: "4.4" },
    ],
  },
];

export default function UMKMSmartMatching() {
  const { addCollaboration } = useCollaborations("umkm");

  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Sistem pencocokan AI satu per satu. Evaluasi kecocokan tiap influencer berdasarkan profil, niche, lokasi, audiens, dan performa — lewati yang kurang cocok lalu cari kandidat berikutnya."
      icon={Zap}
      gradient="bg-kolabora"
    >
      <OneByOneMatch
        items={influencers}
        noun="influencer"
        ctaLabel="Ajukan Kolaborasi"
        ctaSuccess="Kolaborasi berhasil dikirim. Pantau progresnya di menu Riwayat Kolaborasi."
        historyHref="/dashboard/umkm/history"
        onMatch={(item) =>
          addCollaboration({
            name: item.name,
            subtitle: item.subtitle,
            avatar: item.avatar,
            color: item.color,
            matchScore: item.score,
            budget: "Menunggu kesepakatan",
          })
        }
      />
    </FeaturePage>
  );
}
