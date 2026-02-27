"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type NhiemVu = {
  id: number;
  linh_vuc_lon: string;
  linh_vuc_con: string;
  ten_nhiem_vu: string;
  don_vi: string;
  thoi_gian: string;
  tien_do: string;
  ghi_chu: string;
};

export default function TienDoPage() {
  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    linh_vuc_lon: "",
    linh_vuc_con: "",
    ten_nhiem_vu: "",
    don_vi: "",
    thoi_gian: "",
    tien_do: "",
    ghi_chu: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setData(data);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.ten_nhiem_vu) return alert("Nhập tên nhiệm vụ");

    if (editingId) {
      await supabase
        .from("nhiem_vu")
        .update(form)
        .eq("id", editingId);
    } else {
      await supabase.from("nhiem_vu").insert([form]);
    }

    setForm({
      linh_vuc_lon: "",
      linh_vuc_con: "",
      ten_nhiem_vu: "",
      don_vi: "",
      thoi_gian: "",
      tien_do: "",
      ghi_chu: "",
    });

    setEditingId(null);
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa nhiệm vụ này?")) return;
    await supabase.from("nhiem_vu").delete().eq("id", id);
    fetchData();
  }

  function handleEdit(item: NhiemVu) {
    setEditingId(item.id);
    setForm(item);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>THEO DÕI TIẾN ĐỘ CÔNG VIỆC</h2>

      {/* ===== BẢNG TIẾN ĐỘ ===== */}
      <div style={{ overflowX: "auto", marginTop: 20 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 1200,
          }}
        >
          <thead>
            <tr>
              <th style={th}>Lĩnh vực lớn</th>
              <th style={th}>Lĩnh vực con</th>
              <th style={th}>Tên nhiệm vụ</th>
              <th style={th}>Đơn vị</th>
              <th style={th}>Thời gian</th>
              <th style={th}>Tiến độ</th>
              <th style={th}>Ghi chú</th>
              {isAdmin && <th style={th}>Thao tác</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={td}>
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} style={td}>
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{item.linh_vuc_lon}</td>
                  <td style={td}>{item.linh_vuc_con}</td>
                  <td style={td}>{item.ten_nhiem_vu}</td>
                  <td style={td}>{item.don_vi}</td>
                  <td style={td}>{item.thoi_gian}</td>
                  <td style={td}>{item.tien_do}</td>
                  <td style={td}>{item.ghi_chu}</td>

                  {isAdmin && (
                    <td style={td}>
                      <button onClick={() => handleEdit(item)}>Sửa</button>{" "}
                      <button onClick={() => handleDelete(item.id)}>
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== FORM NHẬP (CHỈ ADMIN THẤY) ===== */}
      {isAdmin && (
        <div style={{ marginTop: 30 }}>
          <h3>{editingId ? "CẬP NHẬT NHIỆM VỤ" : "THÊM NHIỆM VỤ"}</h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1200,
            }}
          >
            <tbody>
              <tr>
                <td style={tdInput}>
                  <input
                    placeholder="Lĩnh vực lớn"
                    value={form.linh_vuc_lon}
                    onChange={(e) =>
                      setForm({ ...form, linh_vuc_lon: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Lĩnh vực con"
                    value={form.linh_vuc_con}
                    onChange={(e) =>
                      setForm({ ...form, linh_vuc_con: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Tên nhiệm vụ"
                    value={form.ten_nhiem_vu}
                    onChange={(e) =>
                      setForm({ ...form, ten_nhiem_vu: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Đơn vị"
                    value={form.don_vi}
                    onChange={(e) =>
                      setForm({ ...form, don_vi: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Thời gian"
                    value={form.thoi_gian}
                    onChange={(e) =>
                      setForm({ ...form, thoi_gian: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Tiến độ"
                    value={form.tien_do}
                    onChange={(e) =>
                      setForm({ ...form, tien_do: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <input
                    placeholder="Ghi chú"
                    value={form.ghi_chu}
                    onChange={(e) =>
                      setForm({ ...form, ghi_chu: e.target.value })
                    }
                  />
                </td>

                <td style={tdInput}>
                  <button onClick={handleSubmit}>
                    {editingId ? "Cập nhật" : "Thêm"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  border: "1px solid #ccc",
  padding: 8,
  background: "#f3f3f3",
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #ccc",
  padding: 8,
  textAlign: "center" as const,
};

const tdInput = {
  border: "1px solid #ccc",
  padding: 4,
};