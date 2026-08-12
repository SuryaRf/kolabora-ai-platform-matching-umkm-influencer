import { Check, X, Store, Camera } from "lucide-react";
import Link from "next/link";

const umkmPlans = [
  {
    name: "Free",
    price: "Gratis",
    period: "",
    description: "Coba platform Kolabora",
    gradient: "from-amber-500 to-amber-600",
    features: [
      { text: "AI Smart Matching (3 rekomendasi)", included: true },
      { text: "Chat & Collaboration", included: true },
      { text: "Campaign Dashboard (1 campaign aktif)", included: true },
      { text: "Campaign Analytics dasar", included: true },
      { text: "AI Skill Assistant (3x generate/bulan)", included: true },
      { text: "Influencer Recommendation dasar", included: true },
      { text: "Review Campaign", included: true },
      { text: "Advanced Influencer Filter", included: false },
      { text: "Smart Calendar", included: false },
      { text: "Multi Campaign Management", included: false },
    ],
  },
  {
    name: "Campaign Pass",
    price: "Rp49.000",
    period: "/campaign",
    description: "Sekali bayar, campaign selesai",
    popular: true,
    gradient: "bg-kolabora",
    badge: "Terpopuler",
    features: [
      { text: "AI Smart Matching (20 rekomendasi)", included: true },
      { text: "Chat & Collaboration", included: true },
      { text: "Campaign Dashboard", included: true },
      { text: "Campaign Analytics", included: true },
      { text: "AI Skill Assistant (30 generate)", included: true },
      { text: "Advanced Influencer Filter", included: true },
      { text: "Smart Calendar", included: true },
      { text: "Influencer Recommendation", included: true },
      { text: "Review Campaign", included: true },
      { text: "Multi Campaign Management", included: false },
    ],
    footnote: "Campaign berlaku sampai selesai",
  },
  {
    name: "Business",
    price: "Rp99.000",
    period: "/bulan",
    description: "Untuk UMKM yang rutin promosi",
    gradient: "from-amber-600 to-orange-600",
    features: [
      { text: "Unlimited AI Smart Matching", included: true },
      { text: "Unlimited AI Skill Assistant", included: true },
      { text: "Advanced Influencer Filter", included: true },
      { text: "Multi Campaign Management", included: true },
      { text: "Advanced Campaign Analytics", included: true },
      { text: "Smart Calendar AI", included: true },
      { text: "Prioritas Customer Support", included: true },
      { text: "AI Profile Optimizer", included: false },
      { text: "Featured Creator Badge", included: false },
      { text: "Priority Matching", included: false },
    ],
  },
];

const influencerPlans = [
  {
    name: "Free",
    price: "Gratis",
    period: "",
    description: "Akses dasar platform",
    gradient: "from-rose-500 to-rose-600",
    features: [
      { text: "AI Smart Matching (3 rekomendasi/hari)", included: true },
      { text: "Portfolio Dashboard", included: true },
      { text: "Chat", included: true },
      { text: "Campaign Dashboard", included: true },
      { text: "UMKM Recommendation", included: true },
      { text: "AI Profile Optimizer", included: false },
      { text: "AI Rate Recommendation", included: false },
      { text: "AI Content Assistant", included: false },
      { text: "Campaign Analytics", included: false },
      { text: "Unlimited Apply Campaign", included: false },
    ],
  },
  {
    name: "Creator",
    price: "Rp39.000",
    period: "/bulan",
    description: "Buka fitur AI & prioritas",
    gradient: "bg-influencer",
    badge: "Terpopuler",
    features: [
      { text: "Unlimited AI Smart Matching", included: true },
      { text: "Portfolio & Performance Dashboard", included: true },
      { text: "AI Profile Optimizer", included: true },
      { text: "AI Rate Recommendation", included: true },
      { text: "AI Content Assistant", included: true },
      { text: "Campaign Analytics", included: true },
      { text: "Unlimited Apply Campaign", included: true },
      { text: "Priority Matching", included: false },
      { text: "Featured Creator Badge", included: false },
      { text: "AI Performance Insight", included: false },
    ],
  },
  {
    name: "Creator Pro",
    price: "Rp79.000",
    period: "/bulan",
    description: "Untuk kreator profesional",
    popular: true,
    gradient: "bg-influencer",
    badge: "Paling Lengkap",
    features: [
      { text: "Semua fitur Creator", included: true },
      { text: "Priority Matching", included: true },
      { text: "Featured Creator Badge", included: true },
      { text: "AI Performance Insight", included: true },
      { text: "Premium Portfolio & Media Kit", included: true },
      { text: "Priority Customer Support", included: true },
      { text: "Unlimited AI Smart Matching", included: true },
      { text: "AI Content Assistant", included: true },
      { text: "Campaign Analytics", included: true },
      { text: "Unlimited Apply Campaign", included: true },
    ],
  },
];

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  gradient: string;
  popular?: boolean;
  badge?: string;
  footnote?: string;
  features: { text: string; included: boolean }[];
}

function PricingCard({ plan, accent, index }: { plan: Plan; accent: "umkm" | "influencer"; index: number }) {
  const borderColor = accent === "umkm" ? "border-amber-500/50" : "border-rose-500/50";
  const shadowColor = accent === "umkm" ? "shadow-amber-500/10" : "shadow-rose-500/10";
  const hoverBorder = accent === "umkm" ? "hover:border-amber-500/50" : "hover:border-rose-500/50";
  const btnBg = accent === "umkm" ? "bg-amber-500 hover:bg-amber-600" : "bg-influencer hover:bg-influencer-dark";
  const btnShadow = accent === "umkm" ? "shadow-amber-500/25" : "shadow-rose-500/25";

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col ${
        plan.popular
          ? `border-kolabora shadow-xl ${shadowColor} scale-105`
          : `border-zinc-200 dark:border-zinc-700 ${hoverBorder}`
      }`}
    >
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-semibold ${
          accent === "umkm" ? "bg-amber-500" : "bg-influencer"
        }`}>
          {plan.badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
        <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{plan.price}</span>
          {plan.period && <span className="text-sm text-zinc-500">{plan.period}</span>}
        </div>
        {plan.footnote && (
          <p className="text-xs text-zinc-400 mt-1 italic">{plan.footnote}</p>
        )}
      </div>

      <Link
        href="/register"
        className={`block w-full text-center py-3 rounded-full text-sm font-semibold mb-6 transition-all ${
          plan.popular
            ? `text-white ${btnBg} shadow-lg ${btnShadow}`
            : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        }`}
      >
        {plan.price === "Gratis" ? "Mulai Gratis" : `Pilih ${plan.name}`}
      </Link>

      <ul className="space-y-3 flex-1">
        {(plan as typeof umkmPlans[0]).features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            {feature.included ? (
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
            )}
            <span className={feature.included ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-kolabora font-semibold text-sm mb-2">HARGA</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pilih Paket{" "}
            <span className="text-gradient">Terbaikmu</span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Dari gratis hingga profesional — pilih sesuai kebutuhanmu
          </p>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Store className="w-6 h-6 text-amber-500" />
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">Untuk UMKM</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {umkmPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} accent="umkm" index={index} />
            ))}
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Camera className="w-6 h-6 text-rose-500" />
            <h3 className="text-2xl font-bold text-influencer">Untuk Influencer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {influencerPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} accent="influencer" index={index} />
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl p-8 sm:p-12 border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-2xl font-bold text-center mb-10">
            Kenapa Model Ini <span className="text-gradient">Lebih Realistis?</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl p-6 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold text-amber-600 dark:text-amber-400">Dari Sisi UMKM</h4>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                Misalnya owner coffee shop. Dia hanya campaign bulan Januari. Berarti cukup bayar
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-2xl font-bold text-amber-600 text-center">Rp49.000</p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Selesai. Tidak perlu langganan. Kalau bulan depan tidak ada campaign, ya tidak bayar.
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-5 h-5 text-rose-500" />
                <h4 className="font-semibold text-rose-500">Dari Sisi Influencer</h4>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                Influencer akan berpikir: <span className="italic">&ldquo;Aku dapat job 3-4 juta sebulan.&rdquo;</span>
              </p>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-2xl font-bold text-influencer text-center">Rp39.000</p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sangat kecil dibanding penghasilan bulanan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
