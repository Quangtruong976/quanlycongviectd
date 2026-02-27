"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type TongQuan = {
  tong: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
};

export default function HomePage() {
  const [thang, setThang] = useState<string>("ALL");
  const [data, setData] = useState<TongQuan>({
    tong: 0,
    dungHan: 0,
    quaHan: 0,
    chuaHT: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      let query = supabase.from("nhiem_vu").select("ghi_chu");

      if (thang !== "ALL") {
        query = query.eq("thang", Number(thang));
      }

      const { data: raw, error } = await query;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const tong = raw?.length || 0;
      const dungHan =
        raw?.filter((r) => r.ghi_chu === "dung_han").length || 0;
      const quaHan =
        raw?.filter((r) => r.ghi_chu === "qua_han").length || 0;
      const chuaHT =
        raw?.filter((r) => !r.ghi_chu || r.ghi_chu === "").length || 0;

      setData({ tong, dungHan, quaHan, chuaHT });
      setLoading(false);
    };

    loadData();
  }, [thang]);

  const tiLe =
    data.tong > 0
      ? Math.round(((data.dungHan + data.quaHan) / data.tong) * 100)
      : 0;

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
          <ul className="flex justify-center gap-8 py-2 text-sm font-semibold">
            <li>
              <Link href="/thong-ke" className="hover:underline">
                Thống kê chi tiết
              </Link>
            </li>
            <li>
              <Link href="/tien-do" className="hover:underline">
                Theo dõi tiến độ công việc
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:underline">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-4 md:p-6">

          {/* Bộ lọc tháng */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
            <h2 className="font-semibold text-blue-700 text-lg">
              Tổng quan nhiệm vụ
            </h2>

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-48"
            >
              <option value="ALL">Tất cả</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <>
              {/* KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                <Card title="Tổng nhiệm vụ" value={data.tong} color="bg-blue-600" />
                <Card title="Đúng hạn" value={data.dungHan} color="bg-green-600" />
                <Card title="Quá hạn" value={data.quaHan} color="bg-orange-500" />
                <Card title="Chưa hoàn thành" value={data.chuaHT} color="bg-red-600" />

              </div>

              {/* Thanh tiến độ */}
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="mb-2 font-semibold text-gray-700">
                  Tỷ lệ hoàn thành: {tiLe}%
                </p>

                <div className="w-full bg-gray-300 h-4 rounded">
                  <div
                    className="bg-green-600 h-4 rounded transition-all duration-500"
                    style={{ width: `${tiLe}%` }}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}

function Card({ title, value, color }: any) {
  return (
    <div className={`${color} text-white rounded-xl p-6 text-center shadow-md`}>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}