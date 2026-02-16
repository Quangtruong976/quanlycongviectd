"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);

  const [linhVucLonId, setLinhVucLonId] = useState("");
  const [linhVucConId, setLinhVucConId] = useState("");

  const [ten, setTen] = useState("");
  const [giao, setGiao] = useState("");
  const [han, setHan] = useState("");
  const [sanPham, setSanPham] = useState("");
  const [canBo, setCanBo] = useState("");

  /* ===== LOAD DANH MỤC LĨNH VỰC ===== */
  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((res) => setData(res));
  }, []);

  async function handleSubmit() {
    if (!linhVucLonId || !linhVucConId || !ten) {
      alert("Nhập chưa đủ thông tin");
      return;
    }

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linhVucLonId,
        linhVucConId,
        nhiemVu: {
          ten,
          giao,
          han,
          sanPham,
          canBo,
          trangThai: "chua_hoan_thanh",
        },
      }),
    });

    alert("Đã lưu nhiệm vụ");
    setTen("");
    setSanPham("");
    setCanBo("");
  }

  if (!data) return <div className="p-6">Đang tải...</div>;

  const linhVucLon = data.linhVucLon.find(
    (lv: any) => lv.id === linhVucLonId
  );

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
          {linhVucLon && (
            <select
              className="border p-2 w-full"
              value={linhVucConId}
              onChange={(e) => setLinhVucConId(e.target.value)}
            >
              <option value="">-- Chọn lĩnh vực con --</option>
              {linhVucLon.linhVucCon.map((lv: any) => (
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
