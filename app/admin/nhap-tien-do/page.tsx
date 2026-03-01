"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // chỉnh đúng path của bạn

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
};

export default function AdminNhapTienDoPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (role !== "admin") {
      router.replace("/login");
    } else {
      setAdminName(name || "Admin");
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("linh_vuc_lon")
      .order("linh_vuc_con")
      .order("id");

    if (!error && data) setData(data);
  };

  const update = (index: number, field: keyof NhiemVu, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const addRow = () => {
    setData([
      ...data,
      {
        linh_vuc_lon: "",
        linh_vuc_con: "",
        ten: "",
        ngay_giao: "",
        han_hoan_thanh: "",
        ngay_hoan_thanh: "",
        san_pham: "",
        tien_do: "CHUA_HT",
        can_bo_tham_muu: "",
        can_bo_phu_trach: "",
      },
    ]);
  };

  const saveAll = async () => {
    setLoading(true);

    for (const item of data) {
      if (!item.ten || !item.linh_vuc_lon) continue;

      if (item.id) {
        await supabase.from("nhiem_vu").update(item).eq("id", item.id);
      } else {
        await supabase.from("nhiem_vu").insert(item);
      }
    }

    setLoading(false);
    alert("Đã lưu dữ liệu");
    fetchData();
  };

  const deleteRow = async (id?: number, index?: number) => {
    if (id) {
      await supabase.from("nhiem_vu").delete().eq("id", id);
      fetchData();
    } else if (index !== undefined) {
      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
          <p className="text-blue-200">TỈNH ĐOÀN LÂM ĐỒNG</p>
        </div>

        <nav className="bg-blue-800 flex justify-center items-center gap-6 py-2 text-sm font-semibold">
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
          >
            Đăng xuất
          </button>
        </nav>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-blue-700 text-lg">
              Nhập & quản lý nhiệm vụ
            </h2>

            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                + Thêm nhiệm vụ
              </button>

              <button
                onClick={saveAll}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {loading ? "Đang lưu..." : "Lưu vào hệ thống"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-blue-100 text-center font-semibold">
                  <th className="border p-2">STT</th>
                  <th className="border p-2">Lĩnh vực lớn</th>
                  <th className="border p-2">Lĩnh vực con</th>
                  <th className="border p-2">Công việc</th>
                  <th className="border p-2">Hạn HT</th>
                  <th className="border p-2">Trạng thái</th>
                  <th className="border p-2">Phụ trách</th>
                  <th className="border p-2">Xóa</th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2 text-center">{index + 1}</td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.linh_vuc_lon}
                        onChange={(e) =>
                          update(index, "linh_vuc_lon", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.linh_vuc_con}
                        onChange={(e) =>
                          update(index, "linh_vuc_con", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.ten}
                        onChange={(e) =>
                          update(index, "ten", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <input
                        type="date"
                        className="border w-full px-2 py-1 rounded"
                        value={item.han_hoan_thanh}
                        onChange={(e) =>
                          update(index, "han_hoan_thanh", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2">
                      <select
                        className="border w-full px-2 py-1 rounded"
                        value={item.tien_do}
                        onChange={(e) =>
                          update(index, "tien_do", e.target.value)
                        }
                      >
                        <option value="CHUA_HT">Chưa hoàn thành</option>
                        <option value="DUNG_HAN">Đúng hạn</option>
                        <option value="QUA_HAN">Quá hạn</option>
                        <option value="VUOT">Vượt tiến độ</option>
                      </select>
                    </td>

                    <td className="border p-2">
                      <input
                        className="border w-full px-2 py-1 rounded"
                        value={item.can_bo_phu_trach}
                        onChange={(e) =>
                          update(index, "can_bo_phu_trach", e.target.value)
                        }
                      />
                    </td>

                    <td className="border p-2 text-center">
                      <button
                        onClick={() => deleteRow(item.id, index)}
                        className="text-red-600 font-bold"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-6 text-gray-500">
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