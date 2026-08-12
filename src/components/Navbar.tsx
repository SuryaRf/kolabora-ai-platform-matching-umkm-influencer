"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Kolabora" width={40} height={40} className="w-10 h-10" />
            <span className="text-xl font-bold text-gradient">Kolabora</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/#features"
              className="text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
            >
              Harga
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all"
            >
              Daftar
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <X className="w-5 h-5 text-zinc-600" />
            ) : (
              <Menu className="w-5 h-5 text-zinc-600" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-zinc-200/50">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
              onClick={() => setOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/#features"
              className="block text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
              onClick={() => setOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="/#pricing"
              className="block text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
              onClick={() => setOpen(false)}
            >
              Harga
            </Link>
            <Link
              href="/dashboard"
              className="block text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="block text-sm font-medium text-zinc-600 hover:text-kolabora transition-colors"
              onClick={() => setOpen(false)}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark"
              onClick={() => setOpen(false)}
            >
              Daftar
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
