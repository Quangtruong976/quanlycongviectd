"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type ThongKe = {
  can_bo: string;
  tong: number;
  vuot: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
  diem: number;
  xepLoai: string;
};

export default function ThongKePage() {
  const [thang, setThang] = useState("ALL");
  const [data, setData] = useState<ThongKe[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCanBo, setSelectedCanBo] = useState("");
  const [allCanBo, setAllCanBo] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [thang]);

  const loadData = async () => {
    setLoading(true);

    let query = supabase
      .from("nhiem_vu")
      .select("can_bo, ghi_chu, thang");

    if (thang !== "ALL") {
      query = query.eq("thang", Number(thang));
    }

    const { data: raw } = await query;
    if (!raw) {
      setData([]);
      setLoading(false);
      return;
    }

    const uniqueNames = Array.from(
      new Set(raw.map((r: any) => r.can_bo))
    ).sort();

    setAllCanBo(uniqueNames);

    const map: Record<string, ThongKe> = {};

    raw.forEach((item: any) => {
      if (!map[item.can_bo]) {
        map[item.can_bo] = {
          can_bo: item.can_bo,
          tong: 0,
          vuot: 0,
          dungHan: 0,
          quaHan: 0,
          chuaHT: 0,
          diem: 0,
          xepLoai: "",
        };
      }

      const cb = map[item.can_bo];
      cb.tong++;

      switch (item.ghi_chu) {
        case "vuot_tien_do":
          cb.vuot++;
          break;
        case "dung_han":
          cb.dungHan++;
          break;
        case "qua_han":
          cb.quaHan++;
          break;
        default:
          cb.chuaHT++;
      }
    });

    const result = Object.values(map).map((cb) => {
      const hoanThanh = cb.vuot + cb.dungHan + cb.quaHan;
      const diem =
        cb.tong > 0 ? Math.round((hoanThanh / cb.tong) * 100) : 0;

      let xepLoai = "";
      if (diem >= 90 && hoanThanh === cb.tong)
        xepLoai = "Hoàn thành xuất sắc";
      else if (diem >= 70)
        xepLoai = "Hoàn thành tốt";
      else if (diem >= 50)
        xepLoai = "Hoàn thành nhiệm vụ";
      else xepLoai = "Không hoàn thành";

      return { ...cb, diem, xepLoai };
    });

    result.sort((a, b) => b.diem - a.diem);
    setData(result);
    setLoading(false);
  };

  const filteredData = data.filter((cb) =>
    selectedCanBo ? cb.can_bo === selectedCanBo : true
  );

  const suggestedNames = allCanBo.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      {/* HEADER GIỐNG TRANG CHỦ */}
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
            <li><Link href="/">Trang chủ</Link></li>
            <li><Link href="/tien-do">Theo dõi tiến độ</Link></li>
            <li><Link href="/login">Đăng nhập</Link></li>
          </ul>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">

            {/* Lọc tháng */}
            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full md:w-48 shadow-sm"
            >
              <option value="ALL">Tất cả</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            {/* Lọc tên thông minh */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Tìm cán bộ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCanBo("");
                }}
                className="w-full border rounded-lg px-3 py-2 shadow-sm"
              />

              {search && !selectedCanBo && (
                <div className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {suggestedNames.map((name) => (
                    <div
                      key={name}
                      onClick={() => {
                        setSelectedCanBo(name);
                        setSearch(name);
                      }}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-100 text-blue-900 uppercase text-xs">
                    <th className="px-4 py-3 text-left">STT</th>
                    <th className="px-4 py-3 text-left">Cán bộ</th>
                    <th className="px-4 py-3">Tổng NV</th>
                    <th className="px-4 py-3">Vượt</th>
                    <th className="px-4 py-3">Đúng hạn</th>
                    <th className="px-4 py-3">Quá hạn</th>
                    <th className="px-4 py-3">Chưa HT</th>
                    <th className="px-4 py-3">Điểm</th>
                    <th className="px-4 py-3">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((cb, index) => (
                    <tr key={cb.can_bo} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{cb.can_bo}</td>
                      <td className="px-4 py-3 text-center">{cb.tong}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-semibold">{cb.vuot}</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold">{cb.dungHan}</td>
                      <td className="px-4 py-3 text-center text-orange-500 font-semibold">{cb.quaHan}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold">{cb.chuaHT}</td>
                      <td className="px-4 py-3 text-center font-bold">{cb.diem}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {cb.xepLoai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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