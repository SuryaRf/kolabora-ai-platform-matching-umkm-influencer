import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Batas tipe & ukuran selaras deploy/Caddyfile (request_body max_size 10MB),
// tapi divalidasi di aplikasi agar berlaku di semua lingkungan (dev/Vercel/nginx).
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "application/pdf",
]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Beri tahu penyebabnya, bukan "Upload failed" tanpa konteks: tanpa token
    // Blob, unggah memang tidak bisa jalan di lingkungan ini.
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Penyimpanan berkas belum diaktifkan (BLOB_READ_WRITE_TOKEN kosong). Pakai kolom tempel URL/tautan gambar sebagai gantinya.",
        },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Tipe berkas tidak diizinkan (png/jpeg/webp/gif/mp4/pdf)" },
        { status: 415 },
      );
    }

    if (file.size <= 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 8 MB" },
        { status: 413 },
      );
    }

    // Key dibuat server: jangan percaya nama berkas dari pengguna
    // (mencegah path traversal, CRLF injection, dan tabrakan key).
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).slice(0, 8).replace(/[^\w.]/g, "")
      : "";
    const key = `${session.user.id}/${crypto.randomUUID()}${ext}`;

    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          "Upload gagal — token Blob ditolak atau koneksi ke penyimpanan bermasalah. Coba tempel URL gambar saja.",
      },
      { status: 500 },
    );
  }
}
