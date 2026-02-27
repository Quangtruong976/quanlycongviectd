"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NhapNhiemVuPage() {
  const [linhVucLon, setLinhVucLon] = useState<any[]>([]);
  const [linhVucCon, setLinhVucCon] = useState<any[]>([]);

  const [linhVucLonId, setLinhVucLonId] = useState("");
  const [linhVucConId, setLinhVucConId] = useState("");

  const [tenNhiemVu, setTenNhiemVu] = useState("");
  const [moTa, setMoTa] = useState("");
  const [loading, setLoading] = useState(false);

  // Load lĩnh vực lớn
  useEffect(() => {
    const fetchLinhVucLon = async () => {
      const { data } = await supabase.from("linh_vuc_lon").select("*").order("id");
      setLinhVucLon(data || []);
    };
    fetchLinhVucLon();
  }, []);

  // Khi chọn lĩnh vực lớn → load lĩnh vực con tương ứng
  useEffect(() => {
    if (!linhVucLonId) {
      setLinhVucCon([]);
      return;
    }

    const fetchLinhVucCon = async () => {
      const { data } = await supabase
        .from("linh_vuc_con")
        .select("*")
        .eq("linh_vuc_lon_id", linhVucLonId)
        .order("id");

      setLinhVucCon(data || []);
    };

    fetchLinhVucCon();
  }, [linhVucLonId]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!tenNhiemVu || !linhVucLonId || !linhVucConId) {
      alert("Phải chọn đầy đủ lĩnh vực và nhập tên nhiệm vụ.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("nhiem_vu").insert({
      ten_nhiem_vu: tenNhiemVu,
      mo_ta: moTa,
      linh_vuc_lon_id: parseInt(linhVucLonId),
      linh_vuc_con_id: parseInt(linhVucConId),
      trang_thai: "Chưa thực hiện",
    });

    setLoading(false);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      alert("Thêm nhiệm vụ thành công!");
      setTenNhiemVu("");
      setMoTa("");
      setLinhVucLonId("");
      setLinhVucConId("");
      setLinhVucCon([]);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 700 }}>
      <h2>NHẬP NHIỆM VỤ MỚI</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>

        <div>
          <label>Lĩnh vực lớn</label>
          <select
            value={linhVucLonId}
            onChange={(e) => setLinhVucLonId(e.target.value)}
          >
            <option value="">-- Chọn lĩnh vực lớn --</option>
            {linhVucLon.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Lĩnh vực con</label>
          <select
            value={linhVucConId}
            onChange={(e) => setLinhVucConId(e.target.value)}
            disabled={!linhVucLonId}
          >
            <option value="">-- Chọn lĩnh vực con --</option>
            {linhVucCon.map((item) => (
              <option key={item.id} value={item.id}>
                {item.ten}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Tên nhiệm vụ</label>
          <input
            type="text"
            value={tenNhiemVu}
            onChange={(e) => setTenNhiemVu(e.target.value)}
          />
        </div>

        <div>
          <label>Mô tả</label>
          <textarea
            value={moTa}
            onChange={(e) => setMoTa(e.target.value)}
            rows={4}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu nhiệm vụ"}
        </button>

      </form>
    </div>
  );
}