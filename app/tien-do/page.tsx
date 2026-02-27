"use client";


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NhiemVu {
  id: string;
  ten: string;
  linh_vuc_lon: string;
  linh_vuc_con: string;
  ngay_giao: string;
  han_hoan_thanh: string;
  ngay_hoan_thanh: string | null;
  san_pham: string | null;
  tien_do: string;
  can_bo_tham_muu: string;
  can_bo_phu_trach: string;
}

export default function TienDoPage() {
  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("linh_vuc_lon")
      .order("linh_vuc_con");

    if (error) console.error(error);
    else setData(data || []);

    setLoading(false);
  }

  const grouped = data.reduce((acc: any, item) => {
    if (!acc[item.linh_vuc_lon]) acc[item.linh_vuc_lon] = {};
    if (!acc[item.linh_vuc_lon][item.linh_vuc_con])
      acc[item.linh_vuc_lon][item.linh_vuc_con] = [];
    acc[item.linh_vuc_lon][item.linh_vuc_con].push(item);
    return acc;
  }, {});

  let stt = 1;

  return (
    <div className="p-6">
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200 text-center font-semibold">
                <th className="border p-2">Stt</th>
                <th className="border p-2 min-w-[250px]">Văn bản / Công việc</th>
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
              {Object.entries(grouped).map(([lvLon, lvConObj]: any, index) => (
                <React.Fragment key={lvLon}>
                  
                  {/* LĨNH VỰC LỚN */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={9} className="border p-2 text-base">
                      {index + 1}. Lĩnh vực {lvLon}
                    </td>
                  </tr>

                  {Object.entries(lvConObj).map(([lvCon, tasks]: any) => (
                    <React.Fragment key={lvLon + lvCon}>
                      
                      {/* LĨNH VỰC CON */}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={9} className="border p-2">
                          * {lvCon}
                        </td>
                      </tr>

                      {/* NHIỆM VỤ */}
                      {tasks.map((nv: NhiemVu) => (
                        <tr key={nv.id} className="hover:bg-gray-50">
                          <td className="border p-2 text-center">{stt++}</td>
                          <td className="border p-2">{nv.ten}</td>
                          <td className="border p-2 text-center">{nv.ngay_giao}</td>
                          <td className="border p-2 text-center">{nv.han_hoan_thanh}</td>
                          <td className="border p-2 text-center">
                            {nv.ngay_hoan_thanh || ""}
                          </td>
                          <td className="border p-2">{nv.san_pham || ""}</td>
                          <td className="border p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-semibold
                              ${
                                nv.tien_do === "Hoàn thành vượt"
                                  ? "bg-pink-200 text-pink-700"
                                  : nv.tien_do === "Hoàn thành đúng hạn"
                                  ? "bg-green-200 text-green-700"
                                  : nv.tien_do === "Quá hạn"
                                  ? "bg-yellow-200 text-yellow-700"
                                  : "bg-red-200 text-red-700"
                              }`}
                            >
                              {nv.tien_do}
                            </span>
                          </td>
                          <td className="border p-2">{nv.can_bo_tham_muu}</td>
                          <td className="border p-2">{nv.can_bo_phu_trach}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}