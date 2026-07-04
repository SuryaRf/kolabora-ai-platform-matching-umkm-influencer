import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-kolabora/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-influencer/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-kolabora/5 to-influencer/5 rounded-full blur-3xl animate-gradient" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kolabora/10 text-kolabora text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Multi-Sided Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Hubungkan UMKM &{" "}
              <span className="text-gradient">Influencer</span> dengan{" "}
              <span className="text-gradient">AI Matching</span>
            </h1>

            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
              Platform berbasis AI yang mempertemukan UMKM dengan influencer
              secara tepat, cepat, dan efektif melalui teknologi Smart Matching
              System.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg shadow-kolabora/25"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                Lihat Fitur
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-kolabora flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  500+
                </span>{" "}
                UMKM & Influencer telah bergabung
              </p>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-kolabora/20 to-influencer/20 rounded-3xl animate-pulse-glow" />

              <div className="absolute -top-3 -right-3 z-10 bg-white dark:bg-zinc-800 rounded-xl shadow-lg px-3 py-2 animate-float-delayed">
                <p className="text-xs text-zinc-500">AI Match Accuracy</p>
                <p className="text-lg font-bold text-emerald-500">96%</p>
              </div>
              <div className="absolute -bottom-2 -left-4 z-10 bg-white dark:bg-zinc-800 rounded-xl shadow-lg px-3 py-2 animate-float" style={{ animationDelay: "1.5s" }}>
                <p className="text-xs text-zinc-500">Influencer Tersedia</p>
                <p className="text-lg font-bold text-kolabora">2.500+</p>
              </div>

              <div className="absolute inset-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 animate-float">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-kolabora flex items-center justify-center text-white text-sm font-bold">
                    K
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Smart Match</p>
                    <p className="text-xs text-zinc-500">
                      Rekomendasi berbasis AI
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: Users,
                      label: "UMKM Kuliner",
                      match: "95%",
                      color: "text-umkm",
                    },
                    {
                      icon: TrendingUp,
                      label: "Food Blogger",
                      match: "92%",
                      color: "text-influencer",
                    },
                    {
                      icon: Sparkles,
                      label: "Kampanye Promosi",
                      match: "88%",
                      color: "text-kolabora",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-5 h-5 ${item.color}`}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-500">
                        {item.match}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
