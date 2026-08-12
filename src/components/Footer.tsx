import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Kolabora" width={40} height={40} className="w-10 h-10 brightness-200" />
              <span className="text-xl font-bold text-white">Kolabora</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-md">
              AI-Powered Multi-Sided Marketplace untuk menghubungkan UMKM dan
              Influencer melalui Smart Matching System. Mewujudkan kolaborasi
              digital yang lebih efektif, cepat, dan tepat sasaran.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:text-white transition-colors"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="text-sm hover:text-white transition-colors"
                >
                  Fitur
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-sm hover:text-white transition-colors"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Akun</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/login"
                  className="text-sm hover:text-white transition-colors"
                >
                  Masuk
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm hover:text-white transition-colors"
                >
                  Daftar
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Kolabora. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
