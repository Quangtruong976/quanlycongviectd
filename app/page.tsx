"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

type TongQuan = {
  tong: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
};

export default function HomePage() {

  // 🔥 mặc định tháng hiện tại
  const thangHienTai = new Date().getMonth() + 1;

  const [thang, setThang] = useState<string>(String(thangHienTai));

  const [data, setData] = useState<TongQuan>({
    tong: 0,
    dungHan: 0,
    quaHan: 0,
    chuaHT: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  
    const channel = supabase
      .channel("nhiem_vu_home")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nhiem_vu",
        },
        () => {
          loadData(); // chỉ chạy khi có thay đổi thật
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [thang]);



  const loadData = async () => {

    setLoading(true);

    try {

      let query = supabase
        .from("nhiem_vu")
        .select("*");

      // 🔥 chỉ lọc khi KHÔNG phải ALL
      if (thang !== "ALL") {
        query = query.eq("thang", Number(thang));
      }

      const { data: raw, error } = await query;

      if (error) throw error;

      if (!raw || raw.length === 0) {
        setData({ tong: 0, dungHan: 0, quaHan: 0, chuaHT: 0 });
        setLoading(false);
        return;
      }

      let dungHan = 0;
      let quaHan = 0;
      let chuaHT = 0;
      
      raw.forEach((item) => {
      
        if (!item.ngay_hoan_thanh) {
          chuaHT++;
          return;
        }
      
        const ht = new Date(item.ngay_hoan_thanh);
        const han = new Date(item.han_hoan_thanh || "");
      
        if (isNaN(ht.getTime()) || isNaN(han.getTime())) {
          chuaHT++;
          return;
        }
      
        if (ht.getTime() <= han.getTime()) {
          dungHan++;
        } else {
          quaHan++;
        }
      
      

      });

      setData({
        tong: raw.length,
        dungHan,
        quaHan,
        chuaHT,
      });

    } catch (err) {

      console.error("Lỗi load dữ liệu:", err);

      setData({
        tong: 0,
        dungHan: 0,
        quaHan: 0,
        chuaHT: 0
      });
    }

    setLoading(false);
  };

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

          <div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">

          <Link href="/" className="text-white hover:text-yellow-300 cursor-pointer">
  <Home size={20}/>
</Link>
<Link href="/tien-do"
className="text-white hover:text-yellow-300 cursor-pointer">
Theo dõi tiến độ công việc
</Link>

<Link href="/thong-ke"
className="text-white hover:text-yellow-300 cursor-pointer">
Thống kê chi tiết công việc cá nhân
</Link>

<Link
  href="/login"
  className="text-white hover:text-yellow-300 cursor-pointer"
>
  Đăng nhập
</Link>

          </div>

        </nav>

      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">

        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4 md:p-6">

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

            <div className="text-center py-10">
              Đang tải dữ liệu...
            </div>

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