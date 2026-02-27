"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

type RawItem = {
  can_bo: string;
  ghi_chu: string | null;
  thang: number;
};

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

    if (error || !raw) {
      setData([]);
      setLoading(false);
      return;
    }

    const map: Record<string, ThongKe> = {};

    (raw as RawItem[]).forEach((item) => {
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

    const result: ThongKe[] = Object.values(map).map((cb) => {
      const hoanThanh = cb.vuot + cb.dungHan + cb.quaHan;
      const diem =
        cb.tong > 0 ? Math.round((hoanThanh / cb.tong) * 100) : 0;

      let xepLoai = "";
      if (diem >= 90 && cb.chuaHT === 0)
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

  const allCanBo = useMemo(
    () => data.map((d) => d.can_bo).sort(),
    [data]
  );

  const suggestedNames = useMemo(
    () =>
      allCanBo.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, allCanBo]
  );

  const filteredData = useMemo(
    () =>
      selectedCanBo
        ? data.filter((cb) => cb.can_bo === selectedCanBo)
        : data,
    [selectedCanBo, data]
  );

  const getColor = (xepLoai: string) => {
    switch (xepLoai) {
      case "Hoàn thành xuất sắc":
        return "bg-pink-100 text-pink-700";
      case "Hoàn thành tốt":
        return "bg-green-100 text-green-700";
      case "Hoàn thành nhiệm vụ":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-700";
    }
  };

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

    <Link
      href="/"
      className="text-white hover:text-yellow-300 transition flex items-center"
      title="Trang chủ"
    >
      <Home size={20} />
    </Link>

    <Link href="/thong-ke" className="hover:underline">
      Thống kê chi tiết
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

          <div className="flex flex-col md:flex-row gap-4 mb-6">

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border px-3 py-2 rounded w-full md:w-48"
            >
              <option value="ALL">Tất cả</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Tìm cán bộ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCanBo("");
                }}
                className="w-full border px-3 py-2 rounded"
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
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-100 text-blue-900">
                    <th className="border px-3 py-2">STT</th>
                    <th className="border px-3 py-2 text-left">Cán bộ</th>
                    <th className="border px-3 py-2">Tổng</th>
                    <th className="border px-3 py-2">Vượt</th>
                    <th className="border px-3 py-2">Đúng hạn</th>
                    <th className="border px-3 py-2">Quá hạn</th>
                    <th className="border px-3 py-2">Chưa HT</th>
                    <th className="border px-3 py-2">Điểm</th>
                    <th className="border px-3 py-2">Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((cb, index) => (
                    <tr key={cb.can_bo} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-center">{index + 1}</td>
                      <td className="border px-3 py-2">{cb.can_bo}</td>
                      <td className="border px-3 py-2 text-center">{cb.tong}</td>
                      <td className="border px-3 py-2 text-center text-pink-600 font-semibold">{cb.vuot}</td>
                      <td className="border px-3 py-2 text-center text-green-600 font-semibold">{cb.dungHan}</td>
                      <td className="border px-3 py-2 text-center text-yellow-600 font-semibold">{cb.quaHan}</td>
                      <td className="border px-3 py-2 text-center text-red-600 font-semibold">{cb.chuaHT}</td>
                      <td className="border px-3 py-2 text-center font-bold">{cb.diem}</td>
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

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}