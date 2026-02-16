"use client";
import { supabase } from "@/lib/supabase";


import { useEffect, useState } from "react";
import Link from "next/link";

/* ===== MÀU XẾP LOẠI ===== */
const mauXepLoai = (x: string) => {
  if (x === "A") return "bg-green-600 text-white";
  if (x === "B") return "bg-yellow-400 text-black";
  if (x === "C") return "bg-orange-400 text-white";
  return "bg-red-600 text-white";
};

export default function HomePage() {
  const [thang, setThang] = useState<number>(new Date().getMonth() + 1);
  const [tuKhoa, setTuKhoa] = useState("");
  const [locXepLoai, setLocXepLoai] = useState("ALL");
  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  /* ===== LẤY USER ĐÃ ĐĂNG NHẬP ===== */
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);
/* ===== LẤY USER ĐÃ ĐĂNG NHẬP ===== */
  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase
        .from("nhiem_vu")
        .select("*");
  
   
    };
  
    testSupabase();
  }, []);
  

  /* ===== LOAD + THỐNG KÊ ===== */
  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((raw) => {
        const thongKe: any = {};
        const linhVucLon = raw.linhVucLon || [];

        linhVucLon.forEach((lvLon: any) => {
          (lvLon.linhVucCon || []).forEach((lv: any) => {
            (lv.nhiemVu || []).forEach((nv: any) => {
              if (!nv.canBo) return;

              const thangNV = nv.giao?.split("/")?.[1];
              if (String(thang).padStart(2, "0") !== thangNV) return;

              if (!thongKe[nv.canBo]) {
                thongKe[nv.canBo] = {
                  ten: nv.canBo,
                  tong: 0,
                  dungHan: 0,
                  quaHan: 0,
                  chuaHT: 0,
                };
              }

              thongKe[nv.canBo].tong++;
              if (nv.trangThai === "dung_han") thongKe[nv.canBo].dungHan++;
              else if (nv.trangThai === "qua_han") thongKe[nv.canBo].quaHan++;
              else thongKe[nv.canBo].chuaHT++;
            });
          });
        });

        const ketQua = Object.values(thongKe).map((cb: any) => {
          let xepLoai = "D";
          if (cb.chuaHT === 0 && cb.quaHan === 0) xepLoai = "A";
          else if (cb.quaHan <= 1) xepLoai = "B";
          else if (cb.quaHan <= 3) xepLoai = "C";
          return { ...cb, xepLoai };
        });

        setData(ketQua);
      });
  }, [thang]);

  /* ===== LỌC ===== */
  let danhSach = data.filter((cb) =>
    cb.ten.toLowerCase().includes(tuKhoa.toLowerCase())
  );
  if (locXepLoai !== "ALL") {
    danhSach = danhSach.filter((cb) => cb.xepLoai === locXepLoai);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            ỨNG DỤNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
        </div>

        <nav className="bg-blue-800">
          <ul className="flex justify-center gap-8 py-2 text-sm font-semibold">
            <li className="underline">Trang chủ</li>
            <li>
              <Link href="/tien-do" className="hover:underline">
                Theo dõi tiến độ
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:underline">
                Đăng nhập
              </Link>
            </li>
          </ul>
        </nav>

        {/* ===== THANH ĐĂNG NHẬP ===== */}
     
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="font-semibold text-blue-700">
              Thống kê kết quả thực hiện nhiệm vụ
            </h2>
            <select
              value={thang}
              onChange={(e) => setThang(Number(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              placeholder="Gõ họ tên để lọc"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-1/2"
            />
            <select
              value={locXepLoai}
              onChange={(e) => setLocXepLoai(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="ALL">Tất cả xếp loại</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-blue-50">
                <tr>
                  <th className="border px-2 py-2">STT</th>
                  <th className="border px-2 text-left">Cán bộ</th>
                  <th className="border px-2">Tổng</th>
                  <th className="border px-2">Đúng hạn</th>
                  <th className="border px-2">Quá hạn</th>
                  <th className="border px-2">Chưa HT</th>
                  <th className="border px-2">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {danhSach.map((cb, i) => (
                  <tr key={i}>
                    <td className="border px-2 text-center">{i + 1}</td>
                    <td className="border px-2">{cb.ten}</td>
                    <td className="border px-2 text-center">{cb.tong}</td>
                    <td className="border px-2 text-center">{cb.dungHan}</td>
                    <td className="border px-2 text-center">{cb.quaHan}</td>
                    <td className="border px-2 text-center">{cb.chuaHT}</td>
                    <td
                      className={`border px-2 text-center font-bold ${mauXepLoai(
                        cb.xepLoai
                      )}`}
                    >
                      {cb.xepLoai}
                    </td>
                  </tr>
                ))}
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
