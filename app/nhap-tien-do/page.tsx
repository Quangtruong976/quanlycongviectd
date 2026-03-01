"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

type NhiemVu = {
  id: number;
  ten: string;
  ngay_giao: string;
  han_hoan_thanh: string;
  ngay_hoan_thanh: string;
  san_pham: string;
  tien_do: string;
  can_bo_tham_muu: string;
  can_bo_phu_trach: string;
};

export default function NhapTienDoPage() {
  const [rows, setRows] = useState<NhiemVu[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const addRow = () => {
    const newRow: NhiemVu = {
      id: Date.now(),
      ten: "",
      ngay_giao: "",
      han_hoan_thanh: "",
      ngay_hoan_thanh: "",
      san_pham: "",
      tien_do: "",
      can_bo_tham_muu: "",
      can_bo_phu_trach: "",
    };

    setRows([...rows, newRow]);
  };

  const updateRow = (id: number, field: keyof NhiemVu, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      {/* HEADER */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            NHẬP TIẾN ĐỘ NHIỆM VỤ
          </h1>
          <p className="text-sm md:text-base font-semibold text-blue-200">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center gap-6 py-2 text-sm font-semibold">
            <Link href="/" className="flex items-center">
              <Home size={20} />
            </Link>
            <Link href="/tien-do">Trang tiến độ</Link>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-blue-700 text-lg">
              Nhập nhiệm vụ theo bảng
            </h2>

            <button
              onClick={addRow}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              + Thêm nhiệm vụ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2 min-w-[200px]">Văn bản / Công việc</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Hạn HT</th>
                  <th className="border p-2">Ngày HT</th>
                  <th className="border p-2">Sản phẩm</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2">Cán bộ tham mưu</th>
                  <th className="border p-2">TT phụ trách</th>
                  <th className="border p-2">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td className="border p-2">
                      <input
                        value={row.ten}
                        onChange={(e) =>
                          updateRow(row.id, "ten", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        value={row.ngay_giao}
                        onChange={(e) =>
                          updateRow(row.id, "ngay_giao", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        value={row.han_hoan_thanh}
                        onChange={(e) =>
                          updateRow(row.id, "han_hoan_thanh", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        value={row.ngay_hoan_thanh}
                        onChange={(e) =>
                          updateRow(row.id, "ngay_hoan_thanh", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        value={row.san_pham}
                        onChange={(e) =>
                          updateRow(row.id, "san_pham", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        value={row.tien_do}
                        onChange={(e) =>
                          updateRow(row.id, "tien_do", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        value={row.can_bo_tham_muu}
                        onChange={(e) =>
                          updateRow(row.id, "can_bo_tham_muu", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        value={row.can_bo_phu_trach}
                        onChange={(e) =>
                          updateRow(row.id, "can_bo_phu_trach", e.target.value)
                        }
                        className="w-full border px-2 py-1"
                      />
                    </td>

                    <td className="border p-2 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
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