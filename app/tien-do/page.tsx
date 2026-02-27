"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export default function TienDoPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [thang, setThang] = useState("ALL");
  const [canBo, setCanBo] = useState("ALL");
  const [linhVuc, setLinhVuc] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data } = await supabase.from("nhiem_vu").select("*");
    setData(data || []);
    setLoading(false);
  }

  const today = new Date();

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (thang !== "ALL" && item.thang !== Number(thang)) return false;
      if (canBo !== "ALL" && item.can_bo_tham_muu !== canBo) return false;
      if (linhVuc !== "ALL" && item.linh_vuc_lon !== linhVuc) return false;

      if (
        search &&
        !item.ten.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [data, thang, canBo, linhVuc, search]);

  const uniqueCanBo = [...new Set(data.map((d) => d.can_bo_tham_muu))];
  const uniqueLinhVuc = [...new Set(data.map((d) => d.linh_vuc_lon))];

  const getTienDo = (nv: any) => {
    if (!nv.ngay_hoan_thanh) {
      if (new Date(nv.han_hoan_thanh) < today) {
        return { text: "Quá hạn", color: "bg-yellow-200 text-yellow-800" };
      }
      return { text: "Chưa hoàn thành", color: "bg-red-200 text-red-700" };
    }

    if (new Date(nv.ngay_hoan_thanh) < new Date(nv.han_hoan_thanh)) {
      return { text: "Hoàn thành vượt", color: "bg-pink-200 text-pink-700" };
    }

    return { text: "Hoàn thành đúng hạn", color: "bg-green-200 text-green-700" };
  };

  let stt = 1;

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow p-4">

        {/* BỘ LỌC */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <select
            value={thang}
            onChange={(e) => setThang(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">Tất cả tháng</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>

          <select
            value={canBo}
            onChange={(e) => setCanBo(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">Tất cả cán bộ</option>
            {uniqueCanBo.map((cb: any) => (
              <option key={cb}>{cb}</option>
            ))}
          </select>

          <select
            value={linhVuc}
            onChange={(e) => setLinhVuc(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">Tất cả lĩnh vực</option>
            {uniqueLinhVuc.map((lv: any) => (
              <option key={lv}>{lv}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tìm công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        {/* BẢNG */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr className="text-center font-semibold">
                <th className="border p-2">Stt</th>
                <th className="border p-2 min-w-[250px]">Công việc</th>
                <th className="border p-2">Ngày giao</th>
                <th className="border p-2">Hạn HT</th>
                <th className="border p-2">Ngày HT</th>
                <th className="border p-2">Tiến độ</th>
                <th className="border p-2">Cán bộ</th>
                <th className="border p-2">Lĩnh vực</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((nv) => {
                const td = getTienDo(nv);
                return (
                  <tr key={nv.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{stt++}</td>
                    <td className="border p-2">{nv.ten}</td>
                    <td className="border p-2 text-center">{nv.ngay_giao}</td>
                    <td className="border p-2 text-center">{nv.han_hoan_thanh}</td>
                    <td className="border p-2 text-center">
                      {nv.ngay_hoan_thanh || ""}
                    </td>
                    <td className="border p-2 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${td.color}`}>
                        {td.text}
                      </span>
                    </td>
                    <td className="border p-2">{nv.can_bo_tham_muu}</td>
                    <td className="border p-2">{nv.linh_vuc_lon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}