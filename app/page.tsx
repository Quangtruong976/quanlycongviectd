"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type NhiemVu = {
  id: number
  noi_dung: string | null
  can_bo_thuc_hien: string | null
  han_hoan_thanh: string | null
}

export default function Home() {
  const [data, setData] = useState<NhiemVu[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const { data, error } = await supabase
      .from("nhiem_vu")
      .select("*")
      .limit(10)

    if (error) {
      setError(error.message)
      setData([])
    } else {
      setData(data as NhiemVu[])
      setError(null)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1 style={{ marginBottom: "20px" }}>TRANG CHỦ</h1>

      {loading && <p>Đang tải dữ liệu...</p>}

      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Lỗi: {error}
        </p>
      )}

      {!loading && !error && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#1e293b", color: "white" }}>
              <th style={{ padding: "10px" }}>STT</th>
              <th style={{ padding: "10px" }}>Nội dung</th>
              <th style={{ padding: "10px" }}>Cán bộ</th>
              <th style={{ padding: "10px" }}>Hạn hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {index + 1}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {item.noi_dung}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {item.can_bo_thuc_hien}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                  {item.han_hoan_thanh}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}