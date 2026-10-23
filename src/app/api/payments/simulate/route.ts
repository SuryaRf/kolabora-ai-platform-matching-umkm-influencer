import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";

/**
 * Mock payment simulator.
 *
 * There is no real payment gateway wired up yet. This endpoint emulates the
 * latency and the two possible outcomes (success / declined) so the UI can
 * show its success and failure animations.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      amount?: number;
      mode?: "hold" | "release";
      forceFail?: boolean;
    };

    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Nominal tidak valid" }, {
        status: 400,
      });
    }

    // Emulate gateway processing latency.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const declined = body.forceFail === true || Math.random() < 0.08;

    if (declined) {
      return NextResponse.json(
        {
          success: false,
          code: "PAYMENT_DECLINED",
          message:
            "Transaksi ditolak oleh penyedia pembayaran. Silakan coba lagi.",
        },
        { status: 402 },
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: `KBR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
      amount,
      mode: body.mode ?? "hold",
      paidAt: new Date().toISOString(),
      message:
        body.mode === "release"
          ? "Dana escrow berhasil dicairkan."
          : "Pembayaran berhasil dan dana dikunci di escrow.",
    });
  } catch (error) {
    console.error("Payment simulation error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
