"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TienDoPage() {
  const [linhVucLon, setLinhVucLon] = useState<any[]>([]);
  const [linhVucCon, setLinhVucCon] = useState<any[]>([]);
  const [nhiemVu, setNhiemVu] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: lon } = await supabase.from("linh_vuc_lon").select("*").order("id");
    const { data: con } = await supabase.from("linh_vuc_con").select("*").order("id");
    const { data: nv } = await supabase.from("nhiem_vu").select("*").order("id");

    setLinhVucLon(lon || []);
    setLinhVucCon(con || []);
    setNhiemVu(nv || []);
  }

  async function updateField(id: number, field: string, value: any) {
    await supabase.from("nhiem_vu").update({ [field]: value }).eq("id", id);
  }

  async function addRow(linh_vuc_con_id: number, linh_vuc_lon_id: number) {
    await supabase.from("nhiem_vu").insert({
      linh_vuc_con_id,
      linh_vuc_lon_id,
      ten_nhiem_vu: "",
      trang_thai: "Chưa thực hiện",
    });
    fetchData();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>THEO DÕI TIẾN ĐỘ CÔNG VIỆC</h2>

      <table
        border={1}
        cellPadding={5}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th rowSpan={2}>Stt</th>
            <th rowSpan={2}>Văn bản / Công việc</th>
            <th rowSpan={2}>Ngày giao</th>
            <th rowSpan={2}>Thời hạn HT</th>
            <th colSpan={3}>Kết quả</th>
            <th rowSpan={2}>Cán bộ tham mưu</th>
            <th rowSpan={2}>TT phụ trách</th>
          </tr>
          <tr>
            <th>Ngày HT</th>
            <th>Sản phẩm</th>
            <th>Tiến độ</th>
          </tr>
        </thead>

        {linhVucLon.map((lon) => (
          <tbody key={lon.id}>
            {/* LĨNH VỰC LỚN */}
            <tr style={{ fontWeight: "bold", background: "#eee" }}>
              <td colSpan={9}>{lon.ten}</td>
            </tr>

            {linhVucCon
              .filter((con) => con.linh_vuc_lon_id === lon.id)
              .map((con) => (
                <>
                  {/* LĨNH VỰC CON */}
                  <tr
                    key={con.id}
                    style={{ fontStyle: "italic", background: "#f9f9f9" }}
                  >
                    <td colSpan={8}>* {con.ten}</td>
                    <td>
                      <button
                        onClick={() => addRow(con.id, lon.id)}
                      >
                        + Thêm
                      </button>
                    </td>
                  </tr>

                  {/* NHIỆM VỤ */}
                  {nhiemVu
                    .filter((nv) => nv.linh_vuc_con_id === con.id)
                    .map((nv, index) => (
                      <tr key={nv.id}>
                        <td>{index + 1}</td>

                        <td>
                          <input
                            defaultValue={nv.ten_nhiem_vu}
                            onBlur={(e) =>
                              updateField(nv.id, "ten_nhiem_vu", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="date"
                            defaultValue={nv.ngay_giao || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "ngay_giao", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="date"
                            defaultValue={nv.thoi_han || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "thoi_han", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="date"
                            defaultValue={nv.ngay_hoan_thanh || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "ngay_hoan_thanh", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            defaultValue={nv.san_pham || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "san_pham", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            defaultValue={nv.tien_do || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "tien_do", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            defaultValue={nv.can_bo || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "can_bo", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            defaultValue={nv.phu_trach || ""}
                            onBlur={(e) =>
                              updateField(nv.id, "phu_trach", e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                </>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}