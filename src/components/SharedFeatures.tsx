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
      "Sistem AI merekomendasikan partner berdasarkan kecocokan profil, niche, audiens, lokasi, dan performa akun untuk hasil kolaborasi yang optimal.",
    gradient: "bg-kolabora",
  },
  {
    icon: Users,
    title: "Influencer Directory",
    description:
      "Direktori influencer dengan filter kategori konten, jumlah pengikut, lokasi, dan tarif untuk menemukan kreator yang sesuai dengan kebutuhan kampanye.",
    gradient: "bg-kolabora-dark",
  },
  {
    icon: MessageSquare,
    title: "Chat & Messaging",
    description:
      "Komunikasi langsung antara UMKM dan influencer untuk diskusi, negosiasi, dan penyepakatan kerja sama tanpa berpindah platform.",
    gradient: "bg-kolabora",
  },
  {
    icon: LayoutDashboard,
    title: "Campaign Dashboard",
    description:
      "Kelola seluruh kampanye mulai dari penerimaan proyek, pemantauan progres, status campaign, hingga pengingat deadline.",
    gradient: "bg-kolabora-dark",
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description:
      "Laporan performa kampanye dengan metrik reach, impresi, engagement, dan efektivitas untuk evaluasi hasil promosi.",
    gradient: "bg-kolabora",
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
