"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home } from "lucide-react";
import * as XLSX from "xlsx";

type NhiemVu = {
  id: string;
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
  created_by_user?: boolean; // 🔥 thêm dòng này
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";

  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

export default function TienDoPage() {

  const thangHienTai = new Date().getMonth() + 1;

  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);

  const [linhVucLon, setLinhVucLon] = useState("");
  const [thang, setThang] = useState(String(thangHienTai));

  useEffect(() => {
    fetchData();
  }, [linhVucLon, thang]);

  async function fetchData() {

    setLoading(true);

    let query = supabase.from("nhiem_vu").select("*");

    if (linhVucLon !== "") {
      query = query.eq("linh_vuc_lon", linhVucLon);
    }

    query = query.eq("thang", Number(thang));

    const { data, error } = await query
      .order("linh_vuc_con")
      .order("han_hoan_thanh");

    if (!error) {
      setData((data as NhiemVu[]) || []);
    } else {
      setData([]);
    }

    setLoading(false);
  }

  const grouped = useMemo(() => {
    return data.reduce<Record<string, NhiemVu[]>>((acc, item) => {

      const lv = item.linh_vuc_con || "Khác";

      if (!acc[lv]) acc[lv] = [];

      acc[lv].push(item);

      return acc;

    }, {});
  }, [data]);

  const getTienDoColor = (tien_do: string | null) => {
    switch (tien_do) {

      case "Hoàn thành đúng hạn":
        return "bg-green-100 text-green-700";

      case "Hoàn thành quá hạn":
        return "bg-red-100 text-red-700";

      case "Chưa hoàn thành":
        return "bg-yellow-100 text-orange-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ================================
  // TẢI DANH SÁCH HIỆN ĐANG HIỂN THỊ
  // ================================
  function handleDownload() {

    const exportData: Record<string, string | number>[] = [];

    let sttExcel = 1;

    Object.entries(grouped).forEach(([lvCon, tasks]) => {

      // Dòng lĩnh vực con
      exportData.push({
        "STT": "",
        "Văn bản / Công việc": lvCon,
        "Ngày giao": "",
        "Hạn HT": "",
        "Ngày HT": "",
        "Sản phẩm": "",
        "Tiến độ": "",
        "Cán bộ tham mưu": "",
        "TT phụ trách": "",
      });

      tasks.forEach((task) => {

        exportData.push({
          "STT": sttExcel++,
          "Văn bản / Công việc": task.ten,
          "Ngày giao": formatDate(task.ngay_giao),
          "Hạn HT": formatDate(task.han_hoan_thanh),
          "Ngày HT": formatDate(task.ngay_hoan_thanh),
          "Sản phẩm": task.san_pham || "",
          "Tiến độ": task.tien_do || "Chưa cập nhật",
          "Cán bộ tham mưu": task.can_bo_tham_muu,
          "TT phụ trách": task.can_bo_phu_trach,
        });

      });

    });

    // Nếu không có dữ liệu
    if (exportData.length === 0) {
      alert("Không có dữ liệu để tải xuống.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Độ rộng các cột
    worksheet["!cols"] = [
      { wch: 7 },
      { wch: 45 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 35 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Tháng ${thang}`
    );

    const tenFile = linhVucLon
      ? `Theo-doi-tien-do-Thang-${thang}-Theo-linh-vuc.xlsx`
      : `Theo-doi-tien-do-Thang-${thang}.xlsx`;

    XLSX.writeFile(workbook, tenFile);
  }

  let stt = 1;

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

            <Link href="/" className="text-white hover:text-yellow-300 cursor-pointer">
              <Home size={20}/>
            </Link>

            <Link
              href="/tien-do"
              className="text-white hover:text-yellow-300 cursor-pointer"
            >
              Theo dõi tiến độ công việc
            </Link>

            <Link
              href="/thong-ke"
              className="text-white hover:text-yellow-300 cursor-pointer"
            >
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


      <main className="flex-1 flex justify-center p-6">

        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-xl p-6">

          {/* bộ lọc */}

          <div className="flex flex-wrap gap-4 mb-6">

            <select
              value={linhVucLon}
              onChange={(e) => setLinhVucLon(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-400"
            >

              <option value="">
                Chọn lĩnh vực
              </option>

              <option value="I. Văn phòng - Tuyên giáo - Xây dựng Đoàn">
                I. Văn phòng - Tuyên giáo - Xây dựng Đoàn
              </option>

              <option value="II. Phong trào - Hội LHTN">
                II. Phong trào - Hội LHTN
              </option>

              <option value="III. Trường học - Hội Sinh viên">
                III. Trường học - Hội Sinh viên
              </option>

            </select>


            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >

              {Array.from({ length: 12 }).map((_, i) => (

                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>

              ))}

            </select>

            {/* NÚT TẢI DANH SÁCH */}
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-green-700"
            >
              Tải danh sách
            </button>

          </div>


          {loading ? (

            <div className="text-center py-10">
              Đang tải dữ liệu...
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full border border-gray-300 text-sm">

                <thead>

                  <tr className="bg-blue-100 text-blue-900 text-center font-semibold">

                    <th className="border p-2">STT</th>

                    <th className="border p-2 text-left min-w-[250px]">
                      Văn bản / Công việc
                    </th>

                    <th className="border p-2">Ngày giao</th>

                    <th className="border p-2">Hạn HT</th>

                    <th className="border p-2">Ngày HT</th>

                    <th className="border p-2 min-w-[150px]">
                      Sản phẩm
                    </th>

                    <th className="border p-2">Tiến độ</th>

                    <th className="border p-2 min-w-[140px]">
                      Cán bộ tham mưu
                    </th>

                    <th className="border p-2 min-w-[140px]">
                      TT phụ trách
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {Object.entries(grouped).map(([lvCon, tasks]) => (

                    <>

                      <tr key={lvCon} className="bg-gray-100 font-semibold">

                        <td colSpan={9} className="border p-2">
                          {lvCon}
                        </td>

                      </tr>

                      {tasks.map((task) => (

                        <tr
                          key={task.id}
                          className={`hover:bg-blue-50 ${
                            task.created_by_user ? "text-blue-600 font-medium" : ""
                          }`}
                        >

                          <td className="border p-2 text-center">
                            {stt++}
                          </td>

                          <td className="border p-2">
                            {task.ten}
                          </td>

                          <td className="border p-2 text-center">
                            {formatDate(task.ngay_giao)}
                          </td>

                          <td className="border p-2 text-center">
                            {formatDate(task.han_hoan_thanh)}
                          </td>

                          <td className="border p-2 text-center">
                            {formatDate(task.ngay_hoan_thanh)}
                          </td>

                          <td className="border p-2">
                            {task.san_pham || ""}
                          </td>

                          <td className="border p-2 text-center">

                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getTienDoColor(task.tien_do)}`}
                            >

                              {task.tien_do || "Chưa cập nhật"}

                            </span>

                          </td>

                          <td className="border p-2 text-center">
                            {task.can_bo_tham_muu}
                          </td>

                          <td className="border p-2 text-center">
                            {task.can_bo_phu_trach}
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


      <footer className="bg-blue-900 text-white text-center py-3 text-sm">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>

    </div>

  );
}

