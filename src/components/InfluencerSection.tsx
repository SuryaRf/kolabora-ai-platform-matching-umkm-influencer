import {
  Wand2,
  DollarSign,
  PieChart,
  Medal,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Profile Optimizer",
    description:
      "Analisis profil media sosial dan rekomendasi optimasi bio, deskripsi, personal branding agar lebih menarik bagi klien.",
    gradient: "bg-influencer",
  },
  {
    icon: DollarSign,
    title: "AI Rate Recommendation",
    description:
      "Estimasi tarif kerja sama berdasarkan engagement rate, followers, niche, kualitas konten, dan tren pasar.",
    gradient: "bg-emerald-500",
  },
  {
    icon: PieChart,
    title: "Portfolio & Performance",
    description:
      "Dashboard riwayat kolaborasi, statistik performa akun, engagement, dan portofolio kampanye profesional.",
    gradient: "bg-purple-500",
  },
  {
    icon: Medal,
    title: "Featured Creator",
    description:
      "Prioritas bagi influencer premium untuk muncul di urutan teratas hasil pencarian dan rekomendasi AI.",
    gradient: "bg-amber-500",
  },
  {
    icon: FileText,
    title: "Auto-Script Generator",
    description:
      "Hasilkan draft naskah video, caption, storytelling, dan konsep konten secara otomatis sesuai brief UMKM.",
    gradient: "bg-sky-500",
  },
];

export default function InfluencerSection() {
  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative bg-gradient-to-br from-pink-50 to-rose-50 dark:from-zinc-800 dark:to-zinc-800 rounded-3xl p-8 border border-pink-100 dark:border-zinc-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-influencer flex items-center justify-center text-white text-lg font-bold">
                  I
                </div>
                <div>
                  <p className="text-sm font-semibold">Dashboard Influencer</p>
                  <p className="text-xs text-zinc-500">
                    Kelola portofolio Anda
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-zinc-500">
                      Skor Kecocokan
                    </span>
                    <span className="text-xs font-bold text-kolabora">
                      94%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Medal className="w-4 h-4 text-influencer" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Featured Creator
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80">
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Tarif Rekomendasi AI
                  </p>
                  <p className="text-lg font-bold text-influencer">
                    Rp 2,5 - 5 Juta
                    <span className="text-xs font-normal text-zinc-500 ml-1">
                      / campaign
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-influencer font-semibold text-sm mb-2">
              FITUR KHUSUS INFLUENCER
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Optimal untuk{" "}
              <span className="text-influencer">Kreator Konten</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Fitur eksklusif yang membantu influencer mengoptimalkan profil,
              menentukan tarif, dan mendapatkan lebih banyak proyek kolaborasi.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow`}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
