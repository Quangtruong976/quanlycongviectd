"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NhapTienDoPage() {
  const renderEditableRow = (key: string) => (
    <tr key={key}>
      <td className="border p-2 text-center"></td>

      <td
        contentEditable
        className="border p-2 min-w-[250px] text-left"
      ></td>

      <td contentEditable className="border p-2"></td>

      <td contentEditable className="border p-2"></td>

      <td contentEditable className="border p-2"></td>

      <td contentEditable className="border p-2 min-w-[150px]"></td>

      <td className="border p-2">
        <select className="w-full border rounded px-2 py-1">
          <option>Chưa hoàn thành</option>
          <option>Hoàn thành đúng hạn</option>
          <option>Hoàn thành quá hạn</option>
          <option>Hoàn thành vượt tiến độ</option>
        </select>
      </td>

      <td contentEditable className="border p-2 min-w-[140px]"></td>
      <td contentEditable className="border p-2 min-w-[140px]"></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
          <p className="text-sm md:text-base font-semibold text-blue-200">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">
            <Link href="/" className="flex items-center">
              <Home size={20} />
            </Link>

            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ công việc
            </Link>

            <Link href="/login" className="hover:underline">
              Đăng nhập
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <h2 className="font-semibold text-blue-700 text-lg mb-6">
            Nhập tiến độ công việc
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2 min-w-[250px] text-left">Văn bản / Công việc</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Thời hạn HT</th>
                  <th className="border p-2">Ngày HT</th>
                  <th className="border p-2 min-w-[150px]">Sản phẩm</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2 min-w-[140px]">Cán bộ tham mưu</th>
                  <th className="border p-2 min-w-[140px]">TT phụ trách</th>
                </tr>
              </thead>

              <tbody>

                {/* I */}
                <tr className="bg-gray-200 font-bold text-lg">
                  <td colSpan={9} className="border p-2">
                    I. Lĩnh vực Văn phòng – Tuyên giáo – Xây dựng Đoàn
                  </td>
                </tr>

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Văn phòng
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("vp" + i))}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Tuyên giáo
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("tg" + i))}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Xây dựng Đoàn
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("xd" + i))}

                {/* II */}
                <tr className="bg-gray-200 font-bold text-lg">
                  <td colSpan={9} className="border p-2">
                    II. Lĩnh vực Phong trào - Hội LHTN
                  </td>
                </tr>

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Phong trào
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("pt" + i))}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Hội LHTN Việt Nam tỉnh
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("hlhtn" + i))}

                {/* III */}
                <tr className="bg-gray-200 font-bold text-lg">
                  <td colSpan={9} className="border p-2">
                    III. Lĩnh vực Trường học - Hội Sinh viên
                  </td>
                </tr>

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Trường học
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("th" + i))}

                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={9} className="border p-2">
                    * Hội Sinh viên
                  </td>
                </tr>

                {[...Array(2)].map((_, i) => renderEditableRow("hsv" + i))}

              </tbody>
            </table>
          </div>

        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}