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
  ngay_hoan_thanh: string;
  san_pham: string;
  tien_do: string;
  can_bo_tham_muu: string;
  can_bo_phu_trach: string;
};

export default function AdminNhapTienDoPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [data, setData] = useState<NhiemVu[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (role !== "admin") {
      router.replace("/login");
    } else {
      setAdminName(name || "Admin");
    }
  }, [router]);

  const update = (id: number, field: string, value: string) => {
    setData(data.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      {/* HEADER giữ nguyên */}
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

            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ
            </Link>

            <span className="text-yellow-300 font-bold">
              Xin chào, {adminName}
            </span>

            <button
              onClick={() => {
                localStorage.clear();
                router.replace("/login");
              }}
              className="hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <h2 className="font-semibold text-blue-700 text-lg mb-6">
            Quản lý & cập nhật tiến độ nhiệm vụ
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2 text-left">Văn bản / Công việc</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Hạn HT</th>
                  <th className="border p-2">Ngày HT</th>
                  <th className="border p-2">Sản phẩm</th>
                  <th className="border p-2">Tiến độ (%)</th>
                  <th className="border p-2">Cán bộ tham mưu</th>
                  <th className="border p-2">TT phụ trách</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.ten}
                        onChange={(e) =>
                          update(item.id, "ten", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border w-full px-2 py-1 rounded"
                        value={item.ngay_giao}
                        onChange={(e) =>
                          update(item.id, "ngay_giao", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border w-full px-2 py-1 rounded"
                        value={item.han_hoan_thanh}
                        onChange={(e) =>
                          update(item.id, "han_hoan_thanh", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border w-full px-2 py-1 rounded"
                        value={item.ngay_hoan_thanh}
                        onChange={(e) =>
                          update(item.id, "ngay_hoan_thanh", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.san_pham}
                        onChange={(e) =>
                          update(item.id, "san_pham", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="number"
                        className="border w-full px-2 py-1 rounded"
                        value={item.tien_do}
                        onChange={(e) =>
                          update(item.id, "tien_do", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.can_bo_tham_muu}
                        onChange={(e) =>
                          update(item.id, "can_bo_tham_muu", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.can_bo_phu_trach}
                        onChange={(e) =>
                          update(item.id, "can_bo_phu_trach", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-6 text-gray-500">
                      Chưa có nhiệm vụ
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