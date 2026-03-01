"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER LỚN GIỐNG CÁC TRANG KHÁC */}
      <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          HỆ THỐNG QUẢN LÝ CÔNG VIỆC TỈNH ĐOÀN
        </h1>

        <div className="space-x-4">
          <Link href="/" className="hover:underline">Trang chủ</Link>
          <Link href="/tiendo" className="hover:underline">Tiến độ</Link>
          <Link href="/thongke" className="hover:underline">Thống kê</Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="p-6">{children}</div>

    </div>
  );
}