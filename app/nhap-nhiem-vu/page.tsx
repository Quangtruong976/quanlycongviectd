"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NhapNhiemVuPage() {
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

  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="content">
        <div className="box">
          <h2>Không có quyền truy cập</h2>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!form.ten_nhiem_vu) {
      alert("Nhập tên nhiệm vụ");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("nhiem_vu").insert([form]);

    setLoading(false);

    if (error) {
      alert("Lỗi khi lưu");
    } else {
      alert("Đã thêm nhiệm vụ");

      setForm({
        linh_vuc_lon: "",
        linh_vuc_con: "",
        ten_nhiem_vu: "",
        don_vi: "",
        thoi_gian: "",
        tien_do: "",
        ghi_chu: "",
      });
    }
  }

  return (
    <div className="content">
      <div className="box">
        <h2 className="title">NHẬP NHIỆM VỤ</h2>

        <table className="form-table">
          <tbody>
            <tr>
              <td>Lĩnh vực lớn</td>
              <td>
                <input
                  value={form.linh_vuc_lon}
                  onChange={(e) =>
                    setForm({ ...form, linh_vuc_lon: e.target.value })
                  }
                />
              </td>

              <td>Lĩnh vực con</td>
              <td>
                <input
                  value={form.linh_vuc_con}
                  onChange={(e) =>
                    setForm({ ...form, linh_vuc_con: e.target.value })
                  }
                />
              </td>
            </tr>

            <tr>
              <td>Tên nhiệm vụ</td>
              <td colSpan={3}>
                <input
                  value={form.ten_nhiem_vu}
                  onChange={(e) =>
                    setForm({ ...form, ten_nhiem_vu: e.target.value })
                  }
                />
              </td>
            </tr>

            <tr>
              <td>Đơn vị thực hiện</td>
              <td>
                <input
                  value={form.don_vi}
                  onChange={(e) =>
                    setForm({ ...form, don_vi: e.target.value })
                  }
                />
              </td>

              <td>Thời gian</td>
              <td>
                <input
                  value={form.thoi_gian}
                  onChange={(e) =>
                    setForm({ ...form, thoi_gian: e.target.value })
                  }
                />
              </td>
            </tr>

            <tr>
              <td>Tiến độ (%)</td>
              <td>
                <input
                  value={form.tien_do}
                  onChange={(e) =>
                    setForm({ ...form, tien_do: e.target.value })
                  }
                />
              </td>

              <td>Ghi chú</td>
              <td>
                <input
                  value={form.ghi_chu}
                  onChange={(e) =>
                    setForm({ ...form, ghi_chu: e.target.value })
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 20 }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "LƯU NHIỆM VỤ"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .content {
          padding: 20px;
        }

        .box {
          background: #fff;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .title {
          margin-bottom: 20px;
        }

        .form-table {
          width: 100%;
          border-collapse: collapse;
        }

        .form-table td {
          border: 1px solid #e5e5e5;
          padding: 10px;
        }

        .form-table input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .btn-primary {
          background: #1677ff;
          color: #fff;
          padding: 8px 18px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #0958d9;
        }
      `}</style>
    </div>
  );
}