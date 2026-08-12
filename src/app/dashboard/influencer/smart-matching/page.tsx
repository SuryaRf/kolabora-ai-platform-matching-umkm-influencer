"use client";

import { Zap, Store, Users, MapPin, Clock } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import OneByOneMatch, { type MatchItem } from "@/components/dashboard/OneByOneMatch";

const campaigns: MatchItem[] = [
  {
    name: "Kopi Nusantara",
    subtitle: "Kuliner & Minuman • Yogyakarta",
    avatar: "KN",
    color: "bg-orange-500",
    score: 96,
    reasons: [
      { label: "Kategori sesuai niche Anda", pct: 100 },
      { label: "Target audiens cocok", pct: 93 },
      { label: "Budget sesuai tarif", pct: 90 },
      { label: "Deadline masih longgar", pct: 85 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 3-5 Jt" },
      { icon: Users, label: "Target", value: "Gen Z" },
      { icon: MapPin, label: "Lokasi", value: "Yogyakarta" },
      { icon: Clock, label: "Deadline", value: "7 hari" },
    ],
  },
  {
    name: "Skincare Glowing",
    subtitle: "Kecantikan • Jakarta",
    avatar: "SG",
    color: "bg-pink-500",
    score: 94,
    reasons: [
      { label: "Kategori sesuai niche Anda", pct: 98 },
      { label: "Target audiens cocok", pct: 95 },
      { label: "Budget sesuai tarif", pct: 92 },
      { label: "Lokasi campaign sesuai", pct: 88 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 5-8 Jt" },
      { icon: Users, label: "Target", value: "Wanita 20-35" },
      { icon: MapPin, label: "Lokasi", value: "Jakarta" },
      { icon: Clock, label: "Deadline", value: "10 hari" },
    ],
  },
  {
    name: "TechGadget ID",
    subtitle: "Teknologi • Bandung",
    avatar: "TG",
    color: "bg-blue-500",
    score: 91,
    reasons: [
      { label: "Kategori sesuai niche Anda", pct: 100 },
      { label: "Target audiens cocok", pct: 94 },
      { label: "Budget sesuai tarif", pct: 91 },
      { label: "Kredibilitas brand tinggi", pct: 87 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 7-12 Jt" },
      { icon: Users, label: "Target", value: "Pria 18-35" },
      { icon: MapPin, label: "Lokasi", value: "Bandung" },
      { icon: Clock, label: "Deadline", value: "14 hari" },
    ],
  },
  {
    name: "Sporty Apparel",
    subtitle: "Olahraga • Surabaya",
    avatar: "SA",
    color: "bg-green-500",
    score: 87,
    reasons: [
      { label: "Kategori sesuai niche Anda", pct: 95 },
      { label: "Target audiens cocok", pct: 90 },
      { label: "Budget sesuai tarif", pct: 88 },
      { label: "Deadline cukup ketat", pct: 72 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 2-5 Jt" },
      { icon: Users, label: "Target", value: "Aktif & Fitness" },
      { icon: MapPin, label: "Lokasi", value: "Surabaya" },
      { icon: Clock, label: "Deadline", value: "5 hari" },
    ],
  },
  {
    name: "Bali Retreat",
    subtitle: "Travel & Hospitality • Bali",
    avatar: "BR",
    color: "bg-sky-500",
    score: 84,
    reasons: [
      { label: "Kategori sesuai niche Anda", pct: 90 },
      { label: "Target audiens cocok", pct: 88 },
      { label: "Budget sesuai tarif", pct: 86 },
      { label: "Lokasi campaign sesuai", pct: 82 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 4-8 Jt" },
      { icon: Users, label: "Target", value: "Wisatawan 25-45" },
      { icon: MapPin, label: "Lokasi", value: "Bali" },
      { icon: Clock, label: "Deadline", value: "21 hari" },
    ],
  },
  {
    name: "MomCare",
    subtitle: "Parenting & Keluarga • Jakarta",
    avatar: "MC",
    color: "bg-purple-500",
    score: 79,
    reasons: [
      { label: "Target audiens cocok", pct: 90 },
      { label: "Budget sesuai tarif", pct: 85 },
      { label: "Lokasi campaign sesuai", pct: 84 },
      { label: "Kategori kurang sesuai", pct: 62 },
    ],
    stats: [
      { icon: Store, label: "Budget", value: "Rp 1-3 Jt" },
      { icon: Users, label: "Target", value: "Ibu Muda" },
      { icon: MapPin, label: "Lokasi", value: "Jakarta" },
      { icon: Clock, label: "Deadline", value: "7 hari" },
    ],
  },
];

export default function InfluencerSmartMatching() {
  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Sistem pencocokan AI satu per satu. Temukan campaign yang paling sesuai dengan profil, niche, dan tarif Anda — lewati yang kurang cocok lalu lihat kandidat berikutnya."
      icon={Zap}
      gradient="bg-kolabora"
    >
      <OneByOneMatch
        items={campaigns}
        noun="campaign"
        ctaLabel="Ajukan Diri"
        ctaSuccess="Pengajuan berhasil dikirim ke brand. Pantau statusnya di menu Campaign."
      />
    </FeaturePage>
  );
}
