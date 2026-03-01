"use client";

import Link from "next/link";
import Image from "next/image";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col">

      {/* HEADER */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Image
            src="/logo-doan.png"
            alt="Logo"
            width={50}
            height={50}
          />
          <h1 className="font-bold text-blue-800">
            HỆ THỐNG QUẢN LÝ CÔNG VIỆC
          </h1>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex justify-center py-6">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-white text-center py-3 text-sm text-gray-600">
        © 2026 Tỉnh Đoàn
      </footer>
    </div>
  );
}