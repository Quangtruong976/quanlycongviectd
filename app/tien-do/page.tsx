"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home } from "lucide-react";

type NhiemVu = {
  id: number;
  linh_vuc_lon: string;
  linh_vuc_con: string;
  ten: string;
  ngay_giao: string;
  han_hoan_thanh: string;
  ngay_hoan_thanh: string | null;
  san_pham: string | null;
  tien_do: string | null;
  can_bo_tham_muu: string;
  can_bo_phu_trach: string;
  thang: number;
};

export default function TienDoPage() {
  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [thang, setThang] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [thang, search]);

  async function fetchData() {
    setLoading(true);

    try {
      let query = supabase.from("nhiem_vu").select("*");

      if (thang !== "ALL") {
        query = query.eq("thang", Number(thang));
      }

      if (search.trim() !== "") {
        query = query.ilike("ten", `%${search}%`);
      }

      const { data, error } = await query
        .order("linh_vuc_lon")
        .order("linh_vuc_con")
        .order("han_hoan_thanh");

      if (error) {
        console.error("Supabase error:", error.message);
        setData([]);
      } else {
        setData((data as NhiemVu[]) || []);
      }
    } catch (err) {
      console.error("System error:", err);
      setData([]);
    }

    setLoading(false);
  }

  const grouped = useMemo(() => {
    return data.reduce<Record<string, Record<string, NhiemVu[]>>>(
      (acc, item) => {
        const lvLon = item.linh_vuc_lon || "Khác";
        const lvCon = item.linh_vuc_con || "Khác";

        if (!acc[lvLon]) acc[lvLon] = {};
        if (!acc[lvLon][lvCon]) acc[lvLon][lvCon] = [];

        acc[lvLon][lvCon].push(item);
        return acc;
      },
      {}
    );
  }, [data]);

  const getTienDoColor = (tien_do: string | null) => {
    switch (tien_do) {
      case "Hoàn thành":
        return "bg-green-100 text-green-700";
      case "Đang thực hiện":
        return "bg-yellow-100 text-yellow-800";
      case "Quá hạn":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  let stt = 1;

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
            <Link href="/" className="text-white hover:text-yellow-300 transition flex items-center">
              <Home size={20} />
            </Link>
            
            
            <Link href="/tien-do" className="hover:underline">Theo dõi tiến độ công việc</Link>
            <Link href="/thong-ke" className="hover:underline">Thống kê chi tiết công việc cá nhân</Link>
            <Link href="/login" className="hover:underline">Đăng nhập</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
            <h2 className="font-semibold text-blue-700 text-lg">
              Theo dõi tiến độ công việc
            </h2>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Tìm văn bản / công việc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded w-full md:w-64"
              />

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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-100 text-blue-900 text-center font-semibold">
                    <th className="border p-2">STT</th>
                    <th className="border p-2 min-w-[250px] text-left">Văn bản / Công việc</th>
                    <th className="border p-2">Ngày giao</th>
                    <th className="border p-2">Thời hạn HT</th>
                    <th className="border p-2">Ngày HT</th>
                    <th className="border p-2 min-w-[150px]">Sản phẩm</th>
                    <th className="border p-2">Tiến độ</th>
                    <th className="border p-2 min-w-[140px]">Cán bộ tham mưu</th>
                    <th className="border p-2 min-w-[140px]">TT phụ trách</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(grouped).map(([lvLon, sub]) => (
                    <>
                      <tr key={lvLon} className="bg-gray-200 font-bold text-lg">
                        <td colSpan={9} className="border p-2">
                          {lvLon}
                        </td>
                      </tr>

                      {Object.entries(sub).map(([lvCon, tasks]) => (
                        <>
                          <tr key={lvCon} className="bg-gray-100 font-semibold">
                            <td colSpan={9} className="border p-2">
                              * {lvCon}
                            </td>
                          </tr>

                          {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-blue-50">
                              <td className="border p-2 text-center">{stt++}</td>
                              <td className="border p-2">{task.ten}</td>
                              <td className="border p-2 text-center">{task.ngay_giao}</td>
                              <td className="border p-2 text-center">{task.han_hoan_thanh}</td>
                              <td className="border p-2 text-center">{task.ngay_hoan_thanh || ""}</td>
                              <td className="border p-2">{task.san_pham || ""}</td>
                              <td className="border p-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getTienDoColor(task.tien_do)}`}>
                                  {task.tien_do || "Chưa cập nhật"}
                                </span>
                              </td>
                              <td className="border p-2 text-center">{task.can_bo_tham_muu}</td>
                              <td className="border p-2 text-center">{task.can_bo_phu_trach}</td>
                            </tr>
                          ))}
                        </>
                      ))}
                    </>
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