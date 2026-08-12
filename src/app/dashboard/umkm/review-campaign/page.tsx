"use client";

import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, FileText, Eye, Download, MessageSquare, ThumbsUp, Sparkles, ArrowRight, XCircle, AlertTriangle } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const reviewItems = [
  {
    brand: "Kopi Nusantara",
    influencer: "Kuliner Jalanan",
    platform: "Instagram & TikTok",
    deadline: "2 hari lagi",
    status: "review",
    content: [
      { type: "caption", status: "approved", note: "Caption sesuai brief" },
      { type: "visual", status: "pending", note: "Menunggu revisi色调" },
      { type: "hashtag", status: "approved", note: "Semua hashtag tercantum" },
      { type: "disclosure", status: "pending", note: "Perlu tambahkan #ad" },
    ],
  },
  {
    brand: "Skincare Glowing",
    influencer: "Sarah Beauty",
    platform: "YouTube",
    deadline: "Besok",
    status: "pending",
    content: [
      { type: "video", status: "pending", note: "Video sedang di-render" },
      { type: "caption", status: "pending", note: "Menunggu upload" },
    ],
  },
  {
    brand: "Batik Nusantara",
    influencer: "Traveler Indo",
    platform: "TikTok",
    deadline: "Selesai",
    status: "completed",
    content: [
      { type: "video", status: "approved", note: "Konten sesuai ekspektasi" },
      { type: "caption", status: "approved", note: "Caption dan CTA sesuai" },
      { type: "hashtag", status: "approved", note: "Lengkap" },
    ],
  },
];

const statusConfig = {
  review: { icon: Clock, label: "Perlu Review", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200" },
  pending: { icon: AlertCircle, label: "Menunggu", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200" },
  completed: { icon: CheckCircle, label: "Selesai", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" },
};

export default function ReviewCampaign() {
  const [selected, setSelected] = useState(0);

  return (
    <FeaturePage
      title="Review Campaign"
      description="Tinjau hasil konten sebelum dipublikasikan dan konfirmasi penyelesaian campaign sebagai dasar pencairan dana melalui sistem escrow."
      icon={Eye}
      gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {reviewItems.map((item, idx) => {
            const cfg = statusConfig[item.status as keyof typeof statusConfig];
            const Icon = cfg.icon;
            return (
              <div
                key={idx}
                onClick={() => setSelected(idx)}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  selected === idx ? "border-purple-500 shadow-lg" : "border-zinc-200 dark:border-zinc-700 hover:border-purple-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{item.brand}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.influencer} • {item.platform}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                <div className="space-y-2">
                  {item.content.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        {c.status === "approved" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : c.status === "pending" ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs capitalize font-medium">{c.type}</span>
                      </div>
                      <span className={`text-xs ${c.status === "approved" ? "text-emerald-600" : c.status === "pending" ? "text-amber-600" : "text-red-600"}`}>
                        {c.note}
                      </span>
                    </div>
                  ))}
                </div>

                {item.status === "review" && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" /> Setujui & Konfirmasi
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Minta Revisi
                    </button>
                  </div>
                )}

                {item.status === "completed" && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Campaign selesai — dana akan dicairkan ke influencer</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Ringkasan Review</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, label: "Konten Disetujui", value: "4", color: "text-emerald-500" },
                { icon: Clock, label: "Menunggu Review", value: "3", color: "text-amber-500" },
                { icon: AlertTriangle, label: "Perlu Revisi", value: "2", color: "text-red-500" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs text-zinc-500">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-purple-200 dark:border-zinc-700 p-5">
            <h3 className="font-semibold text-sm mb-2">Sistem Escrow</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Dana campaign diamankan dalam sistem escrow dan akan dicairkan ke influencer setelah konten disetujui dan dikonfirmasi oleh kedua belah pihak.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Pembayaran aman & transparan
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
