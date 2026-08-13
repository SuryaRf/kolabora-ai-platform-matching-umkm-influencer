"use client";

import { useCallback, useEffect, useState } from "react";

export type CollaborationRole = "umkm" | "influencer";

export interface StoredCollaboration {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  color: string;
  matchScore: number;
  budget: string;
  submittedAt: string;
  stageIndex: number;
  source: "seed" | "user";
}

const STORAGE_KEY = "kolabora:collaborations";

function keyFor(role: CollaborationRole) {
  return `${STORAGE_KEY}:${role}`;
}

function formatToday() {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const UMKM_SEED: StoredCollaboration[] = [
  {
    id: "seed-sarah",
    name: "Sarah Beauty",
    subtitle: "Kecantikan & Skincare • Jakarta",
    avatar: "SB",
    color: "bg-pink-500",
    matchScore: 96,
    budget: "Rp 5 Jt",
    submittedAt: "12 Agu 2026",
    stageIndex: 5,
    source: "seed",
  },
  {
    id: "seed-techreview",
    name: "TechReview ID",
    subtitle: "Teknologi & Gadget • Bandung",
    avatar: "TR",
    color: "bg-blue-500",
    matchScore: 92,
    budget: "Rp 7 Jt",
    submittedAt: "10 Agu 2026",
    stageIndex: 4,
    source: "seed",
  },
  {
    id: "seed-mombaby",
    name: "Mom & Baby",
    subtitle: "Parenting & Keluarga • Jakarta",
    avatar: "MB",
    color: "bg-purple-500",
    matchScore: 78,
    budget: "Rp 1,5 Jt",
    submittedAt: "9 Agu 2026",
    stageIndex: 1,
    source: "seed",
  },
  {
    id: "seed-fitness",
    name: "Fitness Journey",
    subtitle: "Olahraga & Kesehatan • Surabaya",
    avatar: "FJ",
    color: "bg-green-500",
    matchScore: 85,
    budget: "Rp 2,5 Jt",
    submittedAt: "8 Agu 2026",
    stageIndex: 2,
    source: "seed",
  },
  {
    id: "seed-traveler",
    name: "Traveler Indo",
    subtitle: "Travel & Lifestyle • Bali",
    avatar: "TI",
    color: "bg-sky-500",
    matchScore: 82,
    budget: "Rp 6 Jt",
    submittedAt: "5 Agu 2026",
    stageIndex: 3,
    source: "seed",
  },
  {
    id: "seed-kuliner",
    name: "Kuliner Jalanan",
    subtitle: "Kuliner & Food • Yogyakarta",
    avatar: "KJ",
    color: "bg-orange-500",
    matchScore: 89,
    budget: "Rp 3 Jt",
    submittedAt: "2 Agu 2026",
    stageIndex: 6,
    source: "seed",
  },
];

const INFLUENCER_SEED: StoredCollaboration[] = [
  {
    id: "seed-kopi",
    name: "Kopi Nusantara",
    subtitle: "Kuliner & Minuman • Yogyakarta",
    avatar: "KN",
    color: "bg-orange-500",
    matchScore: 96,
    budget: "Rp 3-5 Jt",
    submittedAt: "12 Agu 2026",
    stageIndex: 5,
    source: "seed",
  },
  {
    id: "seed-skincare",
    name: "Skincare Glowing",
    subtitle: "Kecantikan • Jakarta",
    avatar: "SG",
    color: "bg-pink-500",
    matchScore: 94,
    budget: "Rp 5-8 Jt",
    submittedAt: "10 Agu 2026",
    stageIndex: 4,
    source: "seed",
  },
  {
    id: "seed-momcare",
    name: "MomCare",
    subtitle: "Parenting & Keluarga • Jakarta",
    avatar: "MC",
    color: "bg-purple-500",
    matchScore: 79,
    budget: "Rp 1-3 Jt",
    submittedAt: "9 Agu 2026",
    stageIndex: 1,
    source: "seed",
  },
  {
    id: "seed-bali",
    name: "Bali Retreat",
    subtitle: "Travel & Hospitality • Bali",
    avatar: "BR",
    color: "bg-sky-500",
    matchScore: 84,
    budget: "Rp 4-8 Jt",
    submittedAt: "6 Agu 2026",
    stageIndex: 2,
    source: "seed",
  },
  {
    id: "seed-techgadget",
    name: "TechGadget ID",
    subtitle: "Teknologi • Bandung",
    avatar: "TG",
    color: "bg-blue-500",
    matchScore: 91,
    budget: "Rp 7-12 Jt",
    submittedAt: "8 Agu 2026",
    stageIndex: 3,
    source: "seed",
  },
  {
    id: "seed-sporty",
    name: "Sporty Apparel",
    subtitle: "Olahraga • Surabaya",
    avatar: "SA",
    color: "bg-green-500",
    matchScore: 87,
    budget: "Rp 2-5 Jt",
    submittedAt: "1 Agu 2026",
    stageIndex: 6,
    source: "seed",
  },
];

export function seedCollaborations(role: CollaborationRole): StoredCollaboration[] {
  return role === "umkm" ? [...UMKM_SEED] : [...INFLUENCER_SEED];
}

function loadCollaborations(role: CollaborationRole): StoredCollaboration[] {
  if (typeof window === "undefined") return seedCollaborations(role);
  try {
    const raw = window.localStorage.getItem(keyFor(role));
    if (raw) {
      const parsed = JSON.parse(raw) as StoredCollaboration[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // abaikan data rusak, fallback ke seed
  }
  return seedCollaborations(role);
}

function saveCollaborations(role: CollaborationRole, items: StoredCollaboration[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(role), JSON.stringify(items));
}

export function useCollaborations(role: CollaborationRole) {
  const [items, setItems] = useState<StoredCollaboration[]>(() =>
    seedCollaborations(role),
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => setItems(loadCollaborations(role)));
    return () => cancelAnimationFrame(raf);
  }, [role]);

  useEffect(() => {
    saveCollaborations(role, items);
  }, [role, items]);

  const addCollaboration = useCallback(
    (data: Omit<StoredCollaboration, "id" | "submittedAt" | "stageIndex" | "source">) => {
      const record: StoredCollaboration = {
        ...data,
        id: makeId(),
        submittedAt: formatToday(),
        stageIndex: 1,
        source: "user",
      };
      setItems((prev) => [record, ...prev]);
    },
    [],
  );

  const advanceStage = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && it.stageIndex < 6
          ? { ...it, stageIndex: it.stageIndex + 1 }
          : it,
      ),
    );
  }, []);

  const resetAll = useCallback(() => {
    setItems(seedCollaborations(role));
  }, [role]);

  return { items, addCollaboration, advanceStage, resetAll };
}
