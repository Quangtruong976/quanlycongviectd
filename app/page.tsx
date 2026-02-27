"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function HomePage() {
  const [thang, setThang] = useState("ALL");
  const [data, setData] = useState({
    tong: 0,
    dungHan: 0,
    quaHan: 0,
    chuaHT: 0,
  });

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("nhiem_vu").select("ghi_chu");

      if (thang !== "ALL") {
        query = query.eq("thang", Number(thang));
      }

      const { data: raw } = await query;

      const tong = raw?.length || 0;
      const dungHan =
        raw?.filter((r) => r.ghi_chu === "dung_han").length || 0;
      const quaHan =
        raw?.filter((r) => r.ghi_chu === "qua_han").length || 0;
      const chuaHT =
        raw?.filter((r) => !r.ghi_chu || r.ghi_chu === "").length || 0;

      setData({ tong, dungHan, quaHan, chuaHT });
    };

    load();
  }, [thang]);

  const tiLeHoanThanh =
    data.tong > 0
      ? Math.round(((data.dungHan + data.quaHan) / data.tong) * 100)
      : 0;

  const chartData = [
    { name: "Đúng hạn", value: data.dungHan },
    { name: "Quá hạn", value: data.quaHan },
    { name: "Chưa HT", value: data.chuaHT },
  ];

  const COLORS = ["#16a34a", "#f97316", "#dc2626"];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-blue-900 text-white p-4 text-center">
        <h1 className="text-lg md:text-2xl font-bold">
          QUẢN LÝ CÔNG VIỆC TỈNH ĐOÀN
        </h1>
      </header>

      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

        {/* Bộ lọc */}
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-blue-700">
            Tổng quan
          </h2>

          <select
            value={thang}
            onChange={(e) => setThang(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="ALL">Tất cả</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Tổng nhiệm vụ" value={data.tong} color="bg-blue-600" />
          <KPI title="Đúng hạn" value={data.dungHan} color="bg-green-600" />
          <KPI title="Quá hạn" value={data.quaHan} color="bg-orange-500" />
          <KPI title="Chưa hoàn thành" value={data.chuaHT} color="bg-red-600" />
        </div>

        {/* Thanh tiến độ */}
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="mb-2 font-semibold">
            Tỷ lệ hoàn thành: {tiLeHoanThanh}%
          </p>
          <div className="w-full bg-gray-200 h-4 rounded">
            <div
              className="bg-green-600 h-4 rounded"
              style={{ width: `${tiLeHoanThanh}%` }}
            />
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="bg-white rounded-xl p-4 shadow h-80">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Điều hướng nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/thong-ke"
            className="bg-blue-600 text-white p-4 rounded-xl text-center"
          >
            Thống kê chi tiết
          </Link>
          <Link
            href="/tien-do"
            className="bg-green-600 text-white p-4 rounded-xl text-center"
          >
            Theo dõi tiến độ
          </Link>
        </div>

      </main>
    </div>
  );
}

function KPI({ title, value, color }: any) {
  return (
    <div className={`${color} text-white rounded-xl p-6 shadow text-center`}>
      <p className="text-sm">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}