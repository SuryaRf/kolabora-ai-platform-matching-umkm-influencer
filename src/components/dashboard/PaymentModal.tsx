"use client";

import { useState } from "react";
import { Lock, CheckCircle2, XCircle, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

export type PaymentMode = "hold" | "release";

interface PaymentModalProps {
  open: boolean;
  mode: PaymentMode;
  amount: number;
  title: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

type Phase = "review" | "processing" | "success" | "error";

export default function PaymentModal({
  open,
  mode,
  amount,
  title,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [phase, setPhase] = useState<Phase>("review");
  const [message, setMessage] = useState("");
  const [txn, setTxn] = useState("");

  const reset = () => {
    setPhase("review");
    setMessage("");
    setTxn("");
  };

  const close = () => {
    if (phase === "processing") return;
    reset();
    onClose();
  };

  const pay = async () => {
    setPhase("processing");
    setMessage("");
    try {
      const res = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, mode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.message ?? "Pembayaran gagal.");
        setPhase("error");
        return;
      }
      setTxn(data.transactionId ?? "");
      setMessage(
        data.message ??
          (mode === "release"
            ? "Dana escrow berhasil dicairkan."
            : "Pembayaran berhasil dan dana dikunci di escrow."),
      );
      setPhase("success");
    } catch {
      setMessage("Tidak dapat menghubungi penyedia pembayaran.");
      setPhase("error");
    }
  };

  const finish = async () => {
    await onSuccess();
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={phase !== "processing"}
      title={mode === "hold" ? "Pembayaran Escrow" : "Pencairan Dana"}
      description={title}
      maxWidth="max-w-md"
    >
      <div className="min-h-[300px] flex flex-col">
        {phase === "review" && (
          <>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                <Lock className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold">
                  Kolabora Secure Escrow
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {mode === "hold" ? "Dana yang dikunci" : "Dana dicairkan"}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Metode</span>
                  <span className="font-medium">Simulasi Transfer Bank</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Biaya layanan</span>
                  <span className="font-medium text-emerald-600">Gratis</span>
                </div>
                <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-kolabora">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p>
                {mode === "hold"
                  ? "Dana ditahan aman dan hanya diteruskan ke influencer setelah konten disetujui."
                  : "Dana akan langsung diteruskan ke influencer setelah transaksi berhasil."}
              </p>
            </div>

            <button
              onClick={pay}
              className="mt-auto mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all"
            >
              {mode === "hold" ? (
                <>
                  <Lock className="w-4 h-4" /> Bayar &amp; Kunci Escrow
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Cairkan Dana Sekarang
                </>
              )}
            </button>
          </>
        )}

        {phase === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-100 dark:border-zinc-800" />
              <Loader2 className="w-20 h-20 animate-spin text-purple-500 absolute inset-0" />
            </div>
            <p className="mt-6 font-semibold">Memproses pembayaran...</p>
            <p className="text-xs text-zinc-500 mt-1">
              Jangan tutup halaman ini. Transaksi sedang diverifikasi.
            </p>
          </div>
        )}

        {phase === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
              <span className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center animate-[pop_0.4s_cubic-bezier(0.22,1.4,0.36,1)]">
                <CheckCircle2 className="w-10 h-10 text-white animate-[check_0.4s_ease-out_0.15s_both]" />
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {mode === "hold" ? "Pembayaran Berhasil" : "Dana Berhasil Dicairkan"}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">{message}</p>
            <div className="mt-4 w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">ID Transaksi</span>
                <span className="font-mono font-semibold">{txn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Nominal</span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
            </div>
            <button
              onClick={finish}
              className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center animate-[shake_0.4s_ease-in-out]">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-red-600 dark:text-red-400">
              Pembayaran Gagal
            </h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-xs">{message}</p>
            <div className="mt-5 flex gap-2 w-full">
              <button
                onClick={close}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Tutup
              </button>
              <button
                onClick={pay}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
