"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

type NhiemVu = {
  id: number;
  ten: string;
  ngay_giao: string;
  han_hoan_thanh: string;
  tien_do: string;
};

export default function NhapTienDoPage() {
  const router = useRouter();
  const [data, setData] = useState<NhiemVu[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") router.push("/login");
  }, []);

  const addRow = () => {
    setData([
      ...data,
      {
        id: Date.now(),
        ten: "",
        ngay_giao: "",
        han_hoan_thanh: "",
        tien_do: "",
      },
    ]);
  };

  const update = (id: number, field: string, value: string) => {
    setData(data.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const remove = (id: number) => {
    setData(data.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      {/* HEADER giống hệt */}
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
            <Link href="/" className="text-white hover:text-yellow-300">
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

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-blue-700 text-lg">
              Nhập và quản lý nhiệm vụ
            </h2>

            <button
              onClick={addRow}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              + Thêm nhiệm vụ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2 text-left">Tên nhiệm vụ</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Hạn hoàn thành</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td className="border p-2">
                      <input
                        className="border rounded w-full px-2 py-1"
                        value={item.ten}
                        onChange={(e) =>
                          update(item.id, "ten", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border rounded w-full px-2 py-1"
                        value={item.ngay_giao}
                        onChange={(e) =>
                          update(item.id, "ngay_giao", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border rounded w-full px-2 py-1"
                        value={item.han_hoan_thanh}
                        onChange={(e) =>
                          update(item.id, "han_hoan_thanh", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border rounded w-full px-2 py-1"
                        value={item.tien_do}
                        onChange={(e) =>
                          update(item.id, "tien_do", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2 text-center">
                      <button
                        onClick={() => remove(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-500">
                      Chưa có nhiệm vụ nào
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