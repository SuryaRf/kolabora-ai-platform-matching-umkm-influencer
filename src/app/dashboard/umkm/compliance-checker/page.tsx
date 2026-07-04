"use client";

import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, FileText, Upload } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const checks = [
  { label: "Memenuhi pedoman brand", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
  { label: "Tidak mengandung konten sensitif", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
  { label: "Menyertakan call-to-action", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
  { label: "Durasi video sesuai ketentuan", status: "warn", icon: AlertTriangle, color: "text-amber-500" },
  { label: "Mencantumkan hashtag brand", status: "fail", icon: XCircle, color: "text-red-500" },
  { label: "Tidak ada klaim berlebihan", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
  { label: "Format brief sesuai template", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
  { label: "Menyertakan disclosure (#ad)", status: "pass", icon: CheckCircle, color: "text-emerald-500" },
];

export default function ComplianceChecker() {
  return (
    <FeaturePage
      title="Brief Compliance Checker"
      description="AI memeriksa kesesuaian brief dan konten promosi dengan pedoman kampanye serta identitas brand."
      icon={ShieldCheck}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Upload Brief</p>
              <p className="text-xs text-zinc-500">Upload file brief untuk diperiksa</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Klik atau drag file di sini</p>
            <p className="text-xs text-zinc-400 mt-1">Format: PDF, DOCX, TXT (max 10MB)</p>
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
            Periksa Compliance
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Hasil Pemeriksaan</p>
                <p className="text-xs text-zinc-500">Analisis compliance otomatis</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">6/8</p>
              <p className="text-xs text-zinc-500">Lolos</p>
            </div>
          </div>
          <div className="space-y-3">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-3">
                  <check.icon className={`w-4 h-4 ${check.color}`} />
                  <span className="text-sm">{check.label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  check.status === "pass" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                  check.status === "warn" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}>
                  {check.status === "pass" ? "Lolos" : check.status === "warn" ? "Peringatan" : "Gagal"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
