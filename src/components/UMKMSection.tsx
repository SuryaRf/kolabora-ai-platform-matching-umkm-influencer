import {
  Bot,
  ShieldCheck,
  Calendar,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Skill Assistant",
    description:
      "Asisten AI untuk menyusun brief kerja sama, caption promosi, ide konten pemasaran, dan rekomendasi strategi digital marketing.",
    gradient: "bg-umkm",
  },
  {
    icon: ShieldCheck,
    title: "Brief Compliance Checker",
    description:
      "AI memeriksa apakah brief/konten promosi telah memenuhi ketentuan kampanye, kesesuaian brand, dan aturan yang ditetapkan.",
    gradient: "bg-emerald-500",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    description:
      "Atur jadwal kampanye, rekomendasi waktu terbaik publikasi, dan kelola timeline kerja sama secara efektif.",
    gradient: "bg-sky-500",
  },
  {
    icon: Star,
    title: "Influencer Highlights",
    description:
      "Daftar influencer dengan performa terbaik berdasarkan kategori untuk memudahkan menemukan kreator berkualitas tinggi.",
    gradient: "bg-amber-500",
  },
];

export default function UMKMSection() {
  return (
    <section className="py-20 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-umkm font-semibold text-sm mb-2">
              FITUR KHUSUS UMKM
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Diberdayakan untuk{" "}
              <span className="text-umkm">Kesuksesan UMKM</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Fitur eksklusif yang dirancang untuk membantu UMKM
              mengoptimalkan strategi pemasaran digital melalui kolaborasi
              dengan influencer.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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

          <div className="relative">
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-800 rounded-3xl p-8 border border-amber-100 dark:border-zinc-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-umkm flex items-center justify-center text-white text-lg font-bold">
                  U
                </div>
                <div>
                  <p className="text-sm font-semibold">Dashboard UMKM</p>
                  <p className="text-xs text-zinc-500">
                    Kelola campaign Anda
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-zinc-500">
                      Campaign Aktif
                    </span>
                    <span className="text-xs font-bold text-emerald-500">
                      3 Aktif
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-umkm rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80">
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    AI Skill Assistant
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Bot className="w-4 h-4 text-umkm" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Menulis caption promosi...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
