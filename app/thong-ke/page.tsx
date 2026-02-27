"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
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

    const { data: raw, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      setLoading(false);
      return;
    }

    if (!raw) {
      setData([]);
      setLoading(false);
      return;
    }

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
        cb.tong > 0
          ? Math.round((hoanThanh / cb.tong) * 100)
          : 0;

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

  const exportExcel = () => {
    if (data.length === 0) return;

    const exportData = data.map((cb, index) => ({
      STT: index + 1,
      "Cán bộ": cb.can_bo,
      "Tổng nhiệm vụ": cb.tong,
      "Vượt tiến độ": cb.vuot,
      "Đúng hạn": cb.dungHan,
      "Quá hạn": cb.quaHan,
      "Chưa hoàn thành": cb.chuaHT,
      "Điểm (100)": cb.diem,
      "Xếp loại": cb.xepLoai,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThongKe");

    XLSX.writeFile(
      wb,
      `ThongKe_${thang === "ALL" ? "TatCa" : "Thang_" + thang}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      <header className="bg-blue-900 text-white text-center py-4">
        <h1 className="text-xl md:text-2xl font-bold">
          THỐNG KÊ CHI TIẾT CÁN BỘ
        </h1>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4 md:p-6 overflow-x-auto">

          <div className="flex flex-col md:flex-row md:justify-between gap-3 mb-6">

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

            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Xuất Excel
            </button>

          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <table className="min-w-full border text-sm">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-2 border">STT</th>
                  <th className="p-2 border text-left">Cán bộ</th>
                  <th className="p-2 border">Tổng NV</th>
                  <th className="p-2 border">Vượt</th>
                  <th className="p-2 border">Đúng hạn</th>
                  <th className="p-2 border">Quá hạn</th>
                  <th className="p-2 border">Chưa HT</th>
                  <th className="p-2 border">Điểm</th>
                  <th className="p-2 border">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {data.map((cb, index) => (
                  <tr key={cb.can_bo} className="text-center hover:bg-gray-100">
                    <td className="border p-2">{index + 1}</td>
                    <td className="border p-2 text-left font-medium">
                      {cb.can_bo}
                    </td>
                    <td className="border p-2">{cb.tong}</td>
                    <td className="border p-2 text-green-600 font-semibold">
                      {cb.vuot}
                    </td>
                    <td className="border p-2 text-blue-600 font-semibold">
                      {cb.dungHan}
                    </td>
                    <td className="border p-2 text-orange-500 font-semibold">
                      {cb.quaHan}
                    </td>
                    <td className="border p-2 text-red-600 font-semibold">
                      {cb.chuaHT}
                    </td>
                    <td className="border p-2 font-bold">{cb.diem}</td>
                    <td className="border p-2 font-semibold">{cb.xepLoai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
            >
              ← Quay lại Trang chủ
            </Link>
          </div>

        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}