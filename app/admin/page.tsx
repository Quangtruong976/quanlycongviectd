"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [linhVucLonId, setLinhVucLonId] = useState("");
  const [linhVucConId, setLinhVucConId] = useState("");

  const [ten, setTen] = useState("");
  const [giao, setGiao] = useState("");
  const [han, setHan] = useState("");
  const [sanPham, setSanPham] = useState("");
  const [canBo, setCanBo] = useState("");

  /* ===== KIỂM TRA ADMIN ===== */
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(u);
    if (parsed.role !== "admin") {
      router.replace("/");
      return;
    }

    fetch("/api/tasks", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        return res.json();
      })
      .then((res) => setData(res))
      .catch(() => alert("Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [router]);

  /* ===== LỌC LĨNH VỰC CON ===== */
  const dsLinhVucCon =
    data?.linhVucCon?.filter(
      (lv: any) => lv.linh_vuc_lon_id === linhVucLonId
    ) || [];

  async function handleSubmit() {
    if (!linhVucLonId || !linhVucConId || !ten.trim()) {
      alert("Nhập chưa đủ thông tin");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          linhVucLonId,
          linhVucConId,
          nhiemVu: {
            ten: ten.trim(),
            giao,
            han,
            sanPham,
            canBo,
            trangThai: "chua_ht",
          },
        }),
      });

      if (!res.ok) throw new Error();

      alert("Đã lưu nhiệm vụ");

      setTen("");
      setGiao("");
      setHan("");
      setSanPham("");
      setCanBo("");
      setLinhVucConId("");
    } catch {
      alert("Lưu thất bại");
    }
  }

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4">
          Nhập công việc hàng tháng / đột xuất
        </h1>

        <div className="space-y-3">
          {/* LĨNH VỰC LỚN */}
          <select
            className="border p-2 w-full"
            value={linhVucLonId}
            onChange={(e) => {
              setLinhVucLonId(e.target.value);
              setLinhVucConId("");
            }}
          >
            <option value="">-- Chọn lĩnh vực lớn --</option>
            {data.linhVucLon.map((lv: any) => (
              <option key={lv.id} value={lv.id}>
                {lv.ten}
              </option>
            ))}
          </select>

          {/* LĨNH VỰC CON */}
          {linhVucLonId && (
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
          )}

          <input
            className="border p-2 w-full"
            placeholder="Nội dung nhiệm vụ"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 w-full"
            value={giao}
            onChange={(e) => setGiao(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 w-full"
            value={han}
            onChange={(e) => setHan(e.target.value)}
          />

          <input
            className="border p-2 w-full"
            placeholder="Sản phẩm"
            value={sanPham}
            onChange={(e) => setSanPham(e.target.value)}
          />

          <input
            className="border p-2 w-full"
            placeholder="Cán bộ phụ trách"
            value={canBo}
            onChange={(e) => setCanBo(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-700 text-white px-4 py-2 rounded"
          >
            Lưu nhiệm vụ
          </button>
        </div>
      </div>
    </div>
  );
}