"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ===== USER / PHÂN QUYỀN ===== */
const user =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "null")
    : null;

const isAdmin = user?.role === "admin";

/* ===== HÀM MÀU KẾT QUẢ ===== */
const mauKetQua = (kq: string) => {
  if (kq === "Hoàn thành đúng hạn") return "bg-green-200 text-green-800";
  if (kq === "Hoàn thành quá hạn") return "bg-yellow-200 text-yellow-800";
  if (kq === "Chưa hoàn thành") return "bg-red-200 text-red-800";
  return "";
};

export default function TienDoPage() {
  const [keyword, setKeyword] = useState("");
  const [thang, setThang] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===== LOAD DATA ===== */
  const loadData = () => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((raw) => {
        const { linhVucLon = [], linhVucCon = [], nhiemVu = [] } = raw;
  
        const grouped = linhVucLon.map((lvLon: any, index: number) => {
          const conTheoLon = linhVucCon.filter(
            (lv: any) => lv.linh_vuc_lon_id === lvLon.id
          );
  
          return {
            stt: index + 1,
            tenLinhVucLon: lvLon.ten,
            linhVucCon: conTheoLon.map((lv: any) => {
              const tasks = nhiemVu
                .filter((nv: any) => nv.linh_vuc_con_id === lv.id)
                .filter((nv: any) =>
                  thang ? String(nv.thang) === thang : true
                )
                .map((nv: any, i: number) => ({
                  id: nv.id,
                  stt: i + 1,
                  noiDung: nv.ten || "",
                  loai: "Công việc",
                  giao: nv.giao || "",
                  han: nv.han || "",
                  hoanThanh: nv.hoan_thanh || "",
                  sanpham: nv.san_pham || "",
                  canBo: nv.can_bo || "",
                  ketQua:
                    nv.trang_thai === "dung_han"
                      ? "Hoàn thành đúng hạn"
                      : nv.trang_thai === "qua_han"
                      ? "Hoàn thành quá hạn"
                      : "Chưa hoàn thành",
                }));
  
              return {
                ten: lv.ten,
                tasks,
              };
            }),
          };
        });
  
        setData(grouped);
        setLoading(false);
      });
  };
  

  /* ===== XOÁ NHIỆM VỤ (ADMIN) ===== */
  function xoaNhiemVu(id: string) {
    if (!confirm("Xóa nhiệm vụ này?")) return;

    fetch(`/api/tasks?id=${id}`, {
      method: "DELETE",
    }).then(() => loadData());
  }

  /* ===== SỬA NHIỆM VỤ (ADMIN) ===== */
  function suaNhiemVu(task: any) {
    const noiDungMoi = prompt("Sửa nội dung nhiệm vụ:", task.noiDung);
    if (!noiDungMoi) return;

    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        ten: noiDungMoi,
      }),
    }).then(() => loadData());
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      {/* ===== HEADER ===== */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            ỨNG DỤNG THEO DÕI CÔNG VIỆC
          </h1>
        </div>
        <nav className="bg-blue-800">
          <ul className="flex justify-center gap-8 py-2 text-sm font-semibold">
            <li>
              <Link href="/" className="hover:underline">
                Trang chủ
              </Link>
            </li>
            <li className="underline">Theo dõi tiến độ công việc</li>
            <li>
              <Link href="/login" className="hover:underline">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 p-4 flex justify-center">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-xl p-6 space-y-4">
          {/* FILTER */}
          <div className="flex flex-wrap gap-4 items-center">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="🔍 Tìm kiếm nội dung công việc / lĩnh vực"
              className="border border-gray-300 rounded-lg px-4 py-2 w-[360px]"
            />

            <select
              value={thang}
              onChange={(e) => setThang(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">📅 Tất cả các tháng</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={String(i + 1)}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            data.map((nhom, idx) => (
              <div key={idx}>
                <h2 className="text-lg font-bold mb-3">
                  {nhom.tenLinhVucLon}
                </h2>

                {nhom.linhVucCon.map((lv: any, i: number) => {
                  const filteredTasks = lv.tasks.filter((t: any) => {
                    const matchKeyword =
                      t.noiDung
                        .toLowerCase()
                        .includes(keyword.toLowerCase()) ||
                      lv.ten
                        .toLowerCase()
                        .includes(keyword.toLowerCase());

                    return matchKeyword;
                  });

                  return (
                    <div
                      key={i}
                      className="border border-blue-200 overflow-hidden"
                    >
                      <div className="bg-blue-100 px-3 py-2 font-bold text-blue-900">
                        * {lv.ten}
                      </div>

                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border p-2 w-[40px]">STT</th>
                            <th className="border p-2">Nội dung</th>
                            <th className="border p-2 w-[80px]">Loại</th>
                            <th className="border p-2 w-[90px]">Ngày giao</th>
                            <th className="border p-2 w-[90px]">Thời hạn</th>
                            <th className="border p-2 w-[120px]">
                              Hoàn thành
                            </th>
                            <th className="border p-2 w-[160px]">
                              Sản phẩm
                            </th>
                            <th className="border p-2 w-[150px]">Cán bộ</th>
                            <th className="border p-2 w-[140px]">Kết quả</th>
                            {isAdmin && (
                              <th className="border p-2 w-[120px]">
                                Thao tác
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.length === 0 ? (
                            <tr>
                              <td
                                colSpan={isAdmin ? 10 : 9}
                                className="border p-3 text-center italic text-gray-500"
                              >
                                Chưa có nhiệm vụ
                              </td>
                            </tr>
                          ) : (
                            filteredTasks.map((t: any, j: number) => (
                              <tr key={j} className="hover:bg-gray-50">
                                <td className="border p-2 text-center">
                                  {t.stt}
                                </td>
                                <td className="border p-2">{t.noiDung}</td>
                                <td className="border p-2 text-center">
                                  {t.loai}
                                </td>
                                <td className="border p-2 text-center">
                                  {t.giao || "—"}
                                </td>
                                <td className="border p-2 text-center">
                                  {t.han}
                                </td>
                                <td className="border p-2 text-center">
                                  {t.hoanThanh || "—"}
                                </td>
                                <td className="border p-2 text-center">
                                  {t.sanpham}
                                </td>
                                <td className="border p-2">{t.canBo}</td>
                                <td
                                  className={`border p-2 text-center font-semibold ${mauKetQua(
                                    t.ketQua
                                  )}`}
                                >
                                  {t.ketQua}
                                </td>

                                {isAdmin && (
                                  <td className="border p-2 text-center space-x-2">
                                    <button
                                      className="text-blue-600 underline"
                                      onClick={() => suaNhiemVu(t)}
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      className="text-red-600 underline"
                                      onClick={() => xoaNhiemVu(t.id)}
                                    >
                                      Xóa
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}
