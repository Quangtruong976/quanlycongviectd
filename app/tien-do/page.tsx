"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TienDoPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [thang, setThang] = useState("ALL");
  const [lvConFilter, setLvConFilter] = useState("ALL");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ================= FETCH DATABASE ================= */

  useEffect(() => {
    fetchData();
  }, [thang, lvConFilter]);

  async function fetchData() {
    setLoading(true);

    let query = supabase.from("nhiem_vu").select("*");

    if (thang !== "ALL") {
      query = query.eq("thang", Number(thang));
    }

    if (lvConFilter !== "ALL") {
      query = query.eq("linh_vuc_con", lvConFilter);
    }

    const { data } = await query
      .order("linh_vuc_lon")
      .order("linh_vuc_con");

    setData(data || []);
    setLoading(false);
  }

  /* ================= DEBOUNCE ================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= FILTER CLIENT ================= */

  const filteredData = data.filter((item) =>
    (item.noi_dung || item.ten || "")
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );

  /* ================= GROUP ================= */

  const grouped = filteredData.reduce((acc: any, item) => {
    if (!acc[item.linh_vuc_lon]) acc[item.linh_vuc_lon] = {};
    if (!acc[item.linh_vuc_lon][item.linh_vuc_con])
      acc[item.linh_vuc_lon][item.linh_vuc_con] = [];
    acc[item.linh_vuc_lon][item.linh_vuc_con].push(item);
    return acc;
  }, {});

  /* ================= HIGHLIGHT ================= */

  function highlight(text: string) {
    if (!debouncedSearch) return text;

    const regex = new RegExp(`(${debouncedSearch})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === debouncedSearch.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  let stt = 1;

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
            <li><Link href="/">Trang chủ</Link></li>
            <li><Link href="/thong-ke">Thống kê</Link></li>
            <li><Link href="/login">Đăng nhập</Link></li>
          </ul>
        </nav>
      </header>

      {/* CONTENT */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          {/* Bộ lọc */}
          <div className="grid md:grid-cols-3 gap-3 mb-6">

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="ALL">Tất cả tháng</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Tìm nội dung văn bản / công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              type="text"
              placeholder="Lọc lĩnh vực con..."
              value={lvConFilter === "ALL" ? "" : lvConFilter}
              onChange={(e) =>
                setLvConFilter(e.target.value || "ALL")
              }
              className="border px-3 py-2 rounded"
            />
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-200 text-center font-semibold">
                    <th className="border p-2">Stt</th>
                    <th className="border p-2 min-w-[300px]">
                      Nội dung văn bản / Công việc
                    </th>
                    <th className="border p-2">Ngày giao</th>
                    <th className="border p-2">Hạn hoàn thành</th>
                    <th className="border p-2">Ngày hoàn thành</th>
                    <th className="border p-2">Tiến độ</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(grouped).map(([lvLon, lvConObj]: any, index) => (
                    <>

                      <tr key={lvLon} className="bg-gray-100 font-bold">
                        <td colSpan={6} className="border p-2 text-base">
                          {index + 1}. {lvLon}
                        </td>
                      </tr>

                      {Object.entries(lvConObj).map(([lvCon, tasks]: any) => (
                        <>
                          <tr key={lvLon + lvCon} className="bg-gray-50 font-semibold">
                            <td colSpan={6} className="border p-2">
                              * {lvCon}
                            </td>
                          </tr>

                          {tasks.map((nv: any) => (
                            <tr key={nv.id} className="hover:bg-gray-50">
                              <td className="border p-2 text-center">{stt++}</td>
                              <td className="border p-2">
                                {highlight(nv.noi_dung || nv.ten || "")}
                              </td>
                              <td className="border p-2 text-center">
                                {nv.ngay_giao}
                              </td>
                              <td className="border p-2 text-center">
                                {nv.han_hoan_thanh}
                              </td>
                              <td className="border p-2 text-center">
                                {nv.ngay_hoan_thanh || ""}
                              </td>
                              <td className="border p-2 text-center">
                                {nv.tien_do}
                              </td>
                            </tr>
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