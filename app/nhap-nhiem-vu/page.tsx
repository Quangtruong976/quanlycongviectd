"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NhapNhiemVuPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [linhVucLon, setLinhVucLon] = useState<any[]>([]);
  const [linhVucLonId, setLinhVucLonId] = useState("");

  const [linhVucCon, setLinhVucCon] = useState<any[]>([]);
  const [linhVucConId, setLinhVucConId] = useState("");

  const [form, setForm] = useState({
    ten: "",
    giao: "",
    han: "",
    sanPham: "",
    canBo: "",
    trangThai: "chua_ht",
  });

  /* ===== KIỂM TRA ĐĂNG NHẬP ===== */
  useEffect(() => {
    const u = localStorage.getItem("user");

    if (!u) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(u);
      setUser(parsed);

      fetch("/api/tasks", { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) throw new Error("Lỗi tải dữ liệu");
          return res.json();
        })
        .then((data) => {
          setLinhVucLon(data.linhVucLon || []);
          setLinhVucCon(data.linhVucCon || []);

          if (parsed.role !== "admin") {
            setLinhVucLonId(parsed.role);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Không thể tải dữ liệu lĩnh vực");
        })
        .finally(() => setLoading(false));
    } catch (error) {
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  /* ===== LỌC LĨNH VỰC CON ===== */
  const dsLinhVucCon = linhVucCon.filter(
    (lv) => lv.linh_vuc_lon_id === linhVucLonId
  );

  /* ===== RESET LĨNH VỰC CON KHI ĐỔI LỚN ===== */
  useEffect(() => {
    setLinhVucConId("");
  }, [linhVucLonId]);

  /* ===== SUBMIT ===== */
  async function handleSubmit() {
    if (!linhVucLonId || !linhVucConId || !form.ten.trim()) {
      alert("Nhập đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          linhVucLonId,
          linhVucConId,
          nhiemVu: form,
        }),
      });

      if (!res.ok) {
        throw new Error("Lưu thất bại");
      }

      alert("Đã lưu nhiệm vụ");

      setForm({
        ten: "",
        giao: "",
        han: "",
        sanPham: "",
        canBo: "",
        trangThai: "chua_ht",
      });

      setLinhVucConId("");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu nhiệm vụ");
    }
  }

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-blue-700 flex justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-blue-700">
          Xin chào {user.username}
        </h2>

        {/* ADMIN CHỌN LĨNH VỰC */}
        {user.role === "admin" && (
          <select
            className="border p-2 w-full"
            value={linhVucLonId}
            onChange={(e) => setLinhVucLonId(e.target.value)}
          >
            <option value="">-- Chọn lĩnh vực lớn --</option>
            {linhVucLon.map((lv) => (
              <option key={lv.id} value={lv.id}>
                {lv.ten}
              </option>
            ))}
          </select>
        )}

        {/* LĨNH VỰC CON */}
        <select
          className="border p-2 w-full"
          value={linhVucConId}
          onChange={(e) => setLinhVucConId(e.target.value)}
        >
          <option value="">-- Chọn lĩnh vực con --</option>
          {dsLinhVucCon.map((lv: any) => (
            <option key={lv.id} value={lv.id}>
              {lv.ten}
            </option>
          ))}
        </select>

        {/* FORM */}
        <div className="space-y-1">
          <label className="font-semibold text-sm">
            Nội dung nhiệm vụ
          </label>
          <input
            className="border p-2 w-full"
            value={form.ten}
            onChange={(e) =>
              setForm({ ...form, ten: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-sm">
            Ngày giao
          </label>
          <input
            type="date"
            className="border p-2 w-full"
            value={form.giao}
            onChange={(e) =>
              setForm({ ...form, giao: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-sm">
            Thời hạn
          </label>
          <input
            type="date"
            className="border p-2 w-full"
            value={form.han}
            onChange={(e) =>
              setForm({ ...form, han: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-sm">
            Sản phẩm
          </label>
          <input
            className="border p-2 w-full"
            value={form.sanPham}
            onChange={(e) =>
              setForm({ ...form, sanPham: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-sm">
            Cán bộ thực hiện
          </label>
          <input
            className="border p-2 w-full"
            value={form.canBo}
            onChange={(e) =>
              setForm({ ...form, canBo: e.target.value })
            }
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Lưu nhiệm vụ
        </button>

        <Link
          href="/"
          className="block text-center text-blue-700 underline"
        >
          ← Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}