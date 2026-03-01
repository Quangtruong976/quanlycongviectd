"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

export default function NhapTienDoPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      {
        ten: "",
        ngay_giao: "",
        han: "",
        ngay_ht: "",
        san_pham: "",
        tien_do: "Chưa hoàn thành",
        tham_muu: "",
        phu_trach: "",
      },
    ]);
    setEditingIndex(rows.length);
  };

  const update = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
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
            <Link href="/" className="flex items-center">
              <Home size={20} />
            </Link>
            <Link href="/tien-do">Theo dõi tiến độ</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex justify-between mb-6">
            <h2 className="font-semibold text-blue-700 text-lg">
              Nhập tiến độ công việc
            </h2>

            <button
              onClick={addRow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              + Thêm nhiệm vụ
            </button>
          </div>

          <div className="overflow-auto max-h-[600px] border">
            <table className="min-w-[1200px] w-full border border-gray-300 text-sm">
              <thead className="sticky top-0 bg-blue-100 z-10">
                <tr className="text-center font-semibold text-blue-900">
                  <th className="border p-2">STT</th>
                  <th className="border p-2 min-w-[250px] text-left">Văn bản / Công việc</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Thời hạn HT</th>
                  <th className="border p-2">Ngày HT</th>
                  <th className="border p-2 min-w-[150px]">Sản phẩm</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2 min-w-[140px]">Cán bộ tham mưu</th>
                  <th className="border p-2 min-w-[140px]">TT phụ trách</th>
                  <th className="border p-2">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="border p-2 text-center">{index + 1}</td>

                    {[
                      "ten",
                      "ngay_giao",
                      "han",
                      "ngay_ht",
                      "san_pham",
                      "tham_muu",
                      "phu_trach",
                    ].map((field) => (
                      <td
                        key={field}
                        contentEditable={editingIndex === index}
                        suppressContentEditableWarning
                        className="border p-2"
                        onBlur={(e) =>
                          update(index, field, e.currentTarget.innerText)
                        }
                      >
                        {row[field]}
                      </td>
                    ))}

                    <td className="border p-2">
                      <select
                        disabled={editingIndex !== index}
                        value={row.tien_do}
                        onChange={(e) =>
                          update(index, "tien_do", e.target.value)
                        }
                        className="w-full border rounded px-2 py-1"
                      >
                        <option>Chưa hoàn thành</option>
                        <option>Hoàn thành đúng hạn</option>
                        <option>Hoàn thành quá hạn</option>
                        <option>Hoàn thành vượt tiến độ</option>
                      </select>
                    </td>

                    <td className="border p-2 text-center space-x-2">
                      {editingIndex === index ? (
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-green-600 font-semibold"
                        >
                          Lưu
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="text-blue-600 font-semibold"
                        >
                          Sửa
                        </button>
                      )}

                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-600 font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center p-6 text-gray-500">
                      Chưa có nhiệm vụ. Nhấn "Thêm nhiệm vụ".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}