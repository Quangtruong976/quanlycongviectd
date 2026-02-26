"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    const { data, error } = await supabase
      .from("nhiem_vu")   // test bảng nhiệm vụ trước
      .select("*")
      .limit(10)

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      setData(data)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>TRANG CHỦ</h1>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: "red" }}>Lỗi: {error}</p>}

      {!loading && !error && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 20
          }}
        >
          <thead>
            <tr style={{ background: "#1e293b", color: "white" }}>
              <th style={{ padding: 10 }}>STT</th>
              <th style={{ padding: 10 }}>Nội dung</th>
              <th style={{ padding: 10 }}>Cán bộ</th>
              <th style={{ padding: 10 }}>Hạn</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {index + 1}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {item.noi_dung}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
                  {item.can_bo_thuc_hien}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #ddd" }}>
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