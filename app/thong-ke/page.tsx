"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

type RawItem = {
  can_bo_tham_muu: string | null;
  ghi_chu: string | null;
  thang: number | null;
};

type ThongKe = {
  can_bo_tham_muu: string;
  tong: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
  diem: number;
  xepLoai: string;
};

export default function ThongKePage() {

  const thangHienTai = new Date().getMonth() + 1;

  const [thang, setThang] = useState(String(thangHienTai));
  const [data, setData] = useState<ThongKe[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCanBo, setSelectedCanBo] = useState("");

  useEffect(() => {
    loadData();
  }, [thang]);

  const loadData = async () => {

    setLoading(true);

    const { data: raw } = await supabase
      .from("nhiem_vu")
      .select("can_bo_tham_muu, ghi_chu, thang")
      .eq("thang", Number(thang));

    if (!raw) {
      setData([]);
      setLoading(false);
      return;
    }

    const map: Record<string, ThongKe> = {};

    (raw as RawItem[]).forEach((item) => {

      if (!item.can_bo_tham_muu) return;

      const ten = item.can_bo_tham_muu.trim();

      if (!map[ten]) {
        map[ten] = {
          can_bo_tham_muu: ten,
          tong: 0,
          dungHan: 0,
          quaHan: 0,
          chuaHT: 0,
          diem: 0,
          xepLoai: "",
        };
      }

      const cb = map[ten];

      cb.tong++;

      switch (item.ghi_chu) {

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

    const result: ThongKe[] = Object.values(map).map((cb) => {

      const hoanThanh = cb.dungHan + cb.quaHan;

      const diem =
        cb.tong > 0 ? Math.round((hoanThanh / cb.tong) * 100) : 0;

      let xepLoai = "";

      if (diem >= 90 && cb.chuaHT === 0) {
        xepLoai = "HTSXNV";
      } else if (diem >= 75) {
        xepLoai = "HTTNV";
      } else if (diem >= 50) {
        xepLoai = "HTNV";
      } else {
        xepLoai = "Không HTNV";
      }

      return {
        ...cb,
        diem,
        xepLoai,
      };

    });

    result.sort((a, b) => b.diem - a.diem);

    setData(result);
    setLoading(false);

  };

  const allCanBo = useMemo(() => {
    const unique = new Set(data.map((d) => d.can_bo_tham_muu));
    return Array.from(unique).sort();
  }, [data]);

  const suggestedNames = useMemo(() => {

    if (!search) return [];

    return allCanBo.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );

  }, [search, allCanBo]);

  const filteredData = useMemo(() => {

    if (!selectedCanBo) return data;

    return data.filter((cb) => cb.can_bo_tham_muu === selectedCanBo);

  }, [selectedCanBo, data]);

  const getColor = (xepLoai: string) => {

    const value = xepLoai?.trim().toUpperCase();
  
    const colorMap: Record<string, string> = {
      HTSXNV: "bg-green-100 text-green-700",
      HTTNV: "bg-yellow-100 text-orange-700",
      HTNV: "bg-red-100 text-red-800",
    };
  
    return colorMap[value] || "bg-gray-100 text-gray-700";
  
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      <header className="bg-blue-900 text-white">

        <div className="flex flex-col items-center py-4">

          <img src="/logo-doan.png" className="h-20 mb-2" />

          <h1 className="text-xl md:text-2xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>

          <p className="text-blue-200 font-semibold">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>

        </div>

        <nav className="bg-blue-800">

          <div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">

            <Link href="/" className="text-white hover:text-yellow-300 flex items-center">
              <Home size={20} />
            </Link>

            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ công việc
            </Link>

            <Link href="/thong-ke" className="hover:underline">
              Thống kê chi tiết công việc cá nhân
            </Link>

            <Link href="/login" className="hover:underline">
              Đăng nhập
            </Link>

          </div>

        </nav>

      </header>


      <main className="flex-1 flex justify-center p-4">

        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex flex-col md:flex-row gap-4 mb-6">

            <div className="relative w-full md:w-72">

              <input
                type="text"
                placeholder="Tìm theo tên cán bộ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCanBo("");
                }}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {search && !selectedCanBo && (

                <div className="absolute bg-white border w-full mt-1 rounded shadow max-h-60 overflow-y-auto z-10">

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

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full md:w-48 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >

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

            <div className="overflow-x-auto">

              <table className="min-w-full border border-gray-300 text-sm">

                <thead>

                  <tr className="bg-blue-100 text-blue-900">

                    <th className="border px-3 py-2">STT</th>
                    <th className="border px-3 py-2 text-left">Cán bộ</th>
                    <th className="border px-3 py-2">Tổng nhiệm vụ</th>
                    <th className="border px-3 py-2">NV hoàn thành đúng hạn</th>
                    <th className="border px-3 py-2">NV hoàn thành quá hạn</th>
                    <th className="border px-3 py-2">NV chưa hoàn thành</th>
                    <th className="border px-3 py-2">Điểm</th>
                    <th className="border px-3 py-2">Xếp loại</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredData.map((cb, index) => (

                    <tr key={cb.can_bo_tham_muu} className="hover:bg-gray-50">

                      <td className="border px-3 py-2 text-center">
                        {index + 1}
                      </td>

                      <td className="border px-3 py-2">
                        {cb.can_bo_tham_muu}
                      </td>

                      <td className="border px-3 py-2 text-center">
                        {cb.tong}
                      </td>

                      <td className="border px-3 py-2 text-center text-green-600 font-semibold">
                        {cb.dungHan}
                      </td>

                      <td className="border px-3 py-2 text-center text-yellow-600 font-semibold">
                        {cb.quaHan}
                      </td>

                      <td className="border px-3 py-2 text-center text-red-600 font-semibold">
                        {cb.chuaHT}
                      </td>

                      <td className="border px-3 py-2 text-center font-bold">
                        {cb.diem}
                      </td>

                      <td className="border px-3 py-2 text-center">

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColor(cb.xepLoai)}`}>

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

      <footer className="bg-blue-900 text-white text-center py-3 text-sm">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>

    </div>

  );

}