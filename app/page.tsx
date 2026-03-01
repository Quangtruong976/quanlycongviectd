"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

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
    loadData();
  }, [thang]);

  const loadData = async () => {
    setLoading(true);

    let query = supabase
      .from("nhiem_vu")
      .select("ghi_chu, thang");

    if (thang !== "ALL") {
      query = query.eq("thang", Number(thang));
    }

    const { data: raw } = await query;

    if (!raw) {
      setData({ tong: 0, dungHan: 0, quaHan: 0, chuaHT: 0 });
      setLoading(false);
      return;
    }

    let dungHan = 0;
    let quaHan = 0;
    let chuaHT = 0;

    raw.forEach((item: any) => {
      if (item.ghi_chu === "dung_han") dungHan++;
      else if (item.ghi_chu === "qua_han") quaHan++;
      else chuaHT++;
    });

    setData({
      tong: raw.length,
      dungHan,
      quaHan,
      chuaHT,
    });

    setLoading(false);
  };

  const tiLe =
    data.tong > 0
      ? Math.round(((data.dungHan + data.quaHan) / data.tong) * 100)
      : 0;

  return (
    <Layout>
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card title="Tổng nhiệm vụ" value={data.tong} color="bg-blue-600" />
              <Card title="Đúng hạn" value={data.dungHan} color="bg-green-600" />
              <Card title="Quá hạn" value={data.quaHan} color="bg-orange-500" />
              <Card title="Chưa hoàn thành" value={data.chuaHT} color="bg-red-600" />
            </div>

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
    </Layout>
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