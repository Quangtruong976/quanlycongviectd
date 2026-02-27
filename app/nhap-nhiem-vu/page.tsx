"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home } from "lucide-react";

const LINH_VUC = {
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": [
    "1. Văn phòng",
    "2. Tuyên giáo",
    "3. Xây dựng Đoàn",
  ],
  "II. Phong trào - Hội LHTN": [
    "1. Phong trào",
    "2. Hội LHTN",
  ],
  "III. Trường học - Hội Sinh viên": [
    "1. Trường học",
    "2. Hội Sinh viên",
  ],
};

export default function NhapNhiemVuPage() {
  const [form, setForm] = useState({
    linh_vuc_lon: "",
    linh_vuc_con: "",
    ten: "",
    ngay_giao: "",
    han_hoan_thanh: "",
    ngay_hoan_thanh: "",
    san_pham: "",
    tien_do: "",
    can_bo_tham_muu: "",
    can_bo_phu_trach: "",
    thang: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLinhVucLon = (e: any) => {
    setForm({
      ...form,
      linh_vuc_lon: e.target.value,
      linh_vuc_con: "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.from("nhiem_vu").insert([form]);

    if (error) {
      alert("Lỗi khi lưu dữ liệu");
    } else {
      alert("Đã thêm nhiệm vụ thành công");
      setForm({
        linh_vuc_lon: "",
        linh_vuc_con: "",
        ten: "",
        ngay_giao: "",
        han_hoan_thanh: "",
        ngay_hoan_thanh: "",
        san_pham: "",
        tien_do: "",
        can_bo_tham_muu: "",
        can_bo_phu_trach: "",
        thang: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      
      {/* HEADER */}
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
            <Link href="/" className="hover:text-yellow-300 flex items-center">
              <Home size={20} />
            </Link>
            <Link href="/thong-ke" className="hover:underline">
              Thống kê chi tiết
            </Link>
            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ
            </Link>
            <Link href="/login" className="hover:underline">
              Đăng nhập
            </Link>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-6">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-8">

          <h2 className="text-xl font-bold text-blue-700 mb-6 text-center">
            NHẬP NHIỆM VỤ MỚI
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <tbody>

                  <tr>
                    <td className="border p-3 font-semibold w-48">Lĩnh vực lớn</td>
                    <td className="border p-3">
                      <select
                        name="linh_vuc_lon"
                        value={form.linh_vuc_lon}
                        onChange={handleLinhVucLon}
                        required
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">-- Chọn --</option>
                        {Object.keys(LINH_VUC).map((lv) => (
                          <option key={lv} value={lv}>{lv}</option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Lĩnh vực con</td>
                    <td className="border p-3">
                      <select
                        name="linh_vuc_con"
                        value={form.linh_vuc_con}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">-- Chọn --</option>
                        {form.linh_vuc_lon &&
                          LINH_VUC[form.linh_vuc_lon as keyof typeof LINH_VUC]
                            .map((lv) => (
                              <option key={lv} value={lv}>{lv}</option>
                            ))}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Văn bản / Công việc</td>
                    <td className="border p-3">
                      <input
                        type="text"
                        name="ten"
                        value={form.ten}
                        onChange={handleChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Ngày giao</td>
                    <td className="border p-3">
                      <input type="date" name="ngay_giao" value={form.ngay_giao} onChange={handleChange} required className="border rounded px-3 py-2" />
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Thời hạn hoàn thành</td>
                    <td className="border p-3">
                      <input type="date" name="han_hoan_thanh" value={form.han_hoan_thanh} onChange={handleChange} required className="border rounded px-3 py-2" />
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Tháng</td>
                    <td className="border p-3">
                      <select name="thang" value={form.thang} onChange={handleChange} required className="border rounded px-3 py-2">
                        <option value="">-- Chọn tháng --</option>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={i + 1}>Tháng {i + 1}</option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">Cán bộ tham mưu</td>
                    <td className="border p-3">
                      <input type="text" name="can_bo_tham_muu" value={form.can_bo_tham_muu} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-3 font-semibold">TT phụ trách</td>
                    <td className="border p-3">
                      <input type="text" name="can_bo_phu_trach" value={form.can_bo_phu_trach} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg shadow"
              >
                LƯU NHIỆM VỤ
              </button>
            </div>

          </form>
        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}