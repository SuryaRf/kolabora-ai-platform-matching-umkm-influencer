import { Check, X } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "Rp 0",
    period: "selamanya",
    description: "Coba fitur dasar Kolabora",
    gradient: "from-zinc-500 to-zinc-600",
    features: [
      { text: "5 rekomendasi AI per bulan", included: true },
      { text: "Pencarian influencer dasar", included: true },
      { text: "Chat & Messaging", included: true },
      { text: "Dashboard dasar", included: true },
      { text: "Analitik dasar", included: true },
      { text: "AI Skill Assistant (3x/bulan)", included: true },
      { text: "AI Profile Optimizer", included: false },
      { text: "Auto-Script Generator", included: false },
      { text: "Featured Creator", included: false },
      { text: "Campaign tanpa batas", included: false },
    ],
  },
  {
    name: "Premium",
    price: "Rp 149.000",
    period: "/bulan",
    description: "Akses penuh semua fitur AI",
    popular: true,
    gradient: "bg-kolabora",
    features: [
      { text: "Rekomendasi AI tanpa batas", included: true },
      { text: "Pencarian influencer lanjutan", included: true },
      { text: "Chat & Messaging prioritas", included: true },
      { text: "Dashboard analitik lengkap", included: true },
      { text: "Analitik lanjutan", included: true },
      { text: "AI Skill Assistant tanpa batas", included: true },
      { text: "AI Profile Optimizer", included: true },
      { text: "Auto-Script Generator", included: true },
      { text: "Featured Creator", included: true },
      { text: "Campaign tanpa batas", included: true },
    ],
  },
];

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
            Mulai dengan paket Free atau pilih Premium untuk akses penuh
            fitur AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                plan.popular
                  ? "border-kolabora shadow-xl shadow-kolabora/10 scale-105"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-kolabora/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-kolabora text-white text-xs font-semibold">
                  Paling Populer
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-zinc-500">{plan.period}</span>
                </div>
              </div>

              <Link
                href="/register"
                className={`block w-full text-center py-3 rounded-full text-sm font-semibold mb-6 transition-all ${
                  plan.popular
                    ? "text-white bg-kolabora hover:bg-kolabora-dark shadow-lg shadow-kolabora/25"
                    : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                }`}
              >
                {plan.popular ? "Mulai Premium" : "Mulai Gratis"}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-zinc-700 dark:text-zinc-300"
                          : "text-zinc-400 dark:text-zinc-600"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
