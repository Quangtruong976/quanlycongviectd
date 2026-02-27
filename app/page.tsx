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
  const [thang, setThang] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [data, setData] = useState<TongQuan>({
    tong: 0,
    dungHan: 0,
    quaHan: 0,
    chuaHT: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTongQuan = async () => {
      setLoading(true);

      let query = supabase.from("nhiem_vu").select("ghi_chu");

      // Nếu không phải "ALL" thì mới lọc tháng
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

    loadTongQuan();
  }, [thang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      {/* HEADER */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ CÔNG VIỆC TỈNH ĐOÀN
          </h1>
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
                Theo dõi tiến độ
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
      <main className="flex-1 flex justify-center p-6">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6">

          {/* Bộ lọc tháng */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-700">
              Tổng quan nhiệm vụ
            </h2>

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border rounded px-3 py-2"
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
            <p>Đang tải dữ liệu...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              <div className="bg-blue-600 text-white p-6 rounded-xl text-center">
                <p className="text-sm">Tổng nhiệm vụ</p>
                <p className="text-3xl font-bold">{data.tong}</p>
              </div>

              <div className="bg-green-600 text-white p-6 rounded-xl text-center">
                <p className="text-sm">Đúng hạn</p>
                <p className="text-3xl font-bold">{data.dungHan}</p>
              </div>

              <div className="bg-orange-500 text-white p-6 rounded-xl text-center">
                <p className="text-sm">Quá hạn</p>
                <p className="text-3xl font-bold">{data.quaHan}</p>
              </div>

              <div className="bg-red-600 text-white p-6 rounded-xl text-center">
                <p className="text-sm">Chưa hoàn thành</p>
                <p className="text-3xl font-bold">{data.chuaHT}</p>
              </div>

            </div>
          )}

        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}