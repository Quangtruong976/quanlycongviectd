"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

type NhiemVu = {
  id?: number;
  linh_vuc_lon: string;
  linh_vuc_con: string;
  ten: string;
  ngay_giao: string;
  han_hoan_thanh: string;
  ngay_hoan_thanh: string;
  san_pham: string;
  tien_do: string;
  can_bo_tham_muu: string;
  can_bo_phu_trach: string;
  thang: number;
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

  const addRow = (linh_vuc_lon: string, linh_vuc_con: string) => {
    setData([
      ...data,
      {
        linh_vuc_lon,
        linh_vuc_con,
        ten: "",
        ngay_giao: "",
        han_hoan_thanh: "",
        ngay_hoan_thanh: "",
        san_pham: "",
        tien_do: "Chưa hoàn thành",
        can_bo_tham_muu: "",
        can_bo_phu_trach: "",
        thang: new Date().getMonth() + 1,
      },
    ]);
  };

  const update = (index: number, field: keyof NhiemVu, value: any) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  const saveAll = async () => {
    const { error } = await supabase.from("nhiem_vu").insert(data);
    if (!error) alert("Đã lưu dữ liệu");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      {/* HEADER */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl font-bold">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
          <p className="text-blue-200 font-semibold">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center items-center gap-6 py-2 font-semibold">
            <Link href="/" className="hover:text-yellow-300">
              <Home size={20} />
            </Link>

            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ
            </Link>

            <span className="text-yellow-300">
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

          <div className="flex justify-between mb-6">
            <h2 className="font-semibold text-blue-700 text-lg">
              Nhập & Cập nhật nhiệm vụ
            </h2>

            <button
              onClick={saveAll}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Lưu vào hệ thống
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2">Văn bản / Công việc</th>
                  <th className="border p-2">Hạn HT</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2">Phụ trách</th>
                  <th className="border p-2">Xóa</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="align-top">
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td
                      contentEditable
                      suppressContentEditableWarning
                      className="border p-2 whitespace-pre-wrap break-words"
                      onBlur={(e) =>
                        update(index, "ten", e.currentTarget.innerText)
                      }
                    >
                      {item.ten}
                    </td>

                    <td
                      contentEditable
                      suppressContentEditableWarning
                      className="border p-2 text-center"
                      onBlur={(e) =>
                        update(index, "han_hoan_thanh", e.currentTarget.innerText)
                      }
                    >
                      {item.han_hoan_thanh}
                    </td>

                    <td className="border p-2">
                      <select
                        value={item.tien_do}
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

                    <td
                      contentEditable
                      suppressContentEditableWarning
                      className="border p-2"
                      onBlur={(e) =>
                        update(index, "can_bo_phu_trach", e.currentTarget.innerText)
                      }
                    >
                      {item.can_bo_phu_trach}
                    </td>

                    <td className="border p-2 text-center">
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-600 font-bold"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-500">
                      Chưa có nhiệm vụ — Nhấn thêm để tạo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <button
              onClick={() =>
                addRow(
                  "I. Văn phòng – Tuyên giáo – Xây dựng Đoàn",
                  "Văn phòng"
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              + Thêm nhiệm vụ
            </button>
          </div>

        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}