"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-6">
      {/* Header giống các trang khác */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Trang quản trị hệ thống
        </h1>

        <Link
          href="/"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Trang chủ
        </Link>
      </div>

      {/* Nội dung dạng card giống trang khác */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white shadow rounded p-5 hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-gray-500">
            Thêm, sửa, phân quyền tài khoản.
          </p>
        </Link>

        <Link
          href="/admin/nhiem-vu"
          className="bg-white shadow rounded p-5 hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">
            Quản lý nhiệm vụ
          </h2>
          <p className="text-sm text-gray-500">
            Xem và điều chỉnh toàn bộ nhiệm vụ.
          </p>
        </Link>

        <Link
          href="/admin/thong-ke"
          className="bg-white shadow rounded p-5 hover:shadow-lg transition"
        >
          <h2 className="font-semibold text-lg mb-2">
            Thống kê hệ thống
          </h2>
          <p className="text-sm text-gray-500">
            Tổng hợp số liệu báo cáo.
          </p>
        </Link>
      </div>
    </div>
  );
}