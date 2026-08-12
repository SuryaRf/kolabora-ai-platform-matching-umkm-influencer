import {
  Zap,
  Users,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Smart Matching",
    description:
      "Algoritma cerdas yang otomatis merekomendasikan UMKM dengan kreator yang paling relevan berdasarkan niche dan target pasar.",
    gradient: "bg-kolabora",
  },
  {
    icon: MessageSquare,
    title: "Chat & Collaboration",
    description:
      "Ruang komunikasi langsung dengan fitur one-click template brief di dalam obrolan.",
    gradient: "bg-kolabora-dark",
  },
  {
    icon: LayoutDashboard,
    title: "Campaign Dashboard",
    description:
      "Dasbor bersama untuk memantau status proyek, linimasa, dan draf konten secara kolaboratif.",
    gradient: "bg-kolabora",
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description:
      "Laporan performa pasca-kampanye via API yang dilengkapi sistem pembayaran aman (escrow).",
    gradient: "bg-kolabora-dark",
  },
];

export default function SharedFeatures() {
  return (
    <section id="features" className="py-20 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-kolabora font-semibold text-sm mb-2">
            FITUR BERSAMA
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Fitur Inti{" "}
            <span className="text-gradient">Kolabora</span>
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Fitur-fitur yang dapat digunakan oleh UMKM maupun Influencer untuk
            menjalin kolaborasi yang efektif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
