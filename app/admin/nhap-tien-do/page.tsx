"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Home } from "lucide-react";

export default function AdminPage() {

  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const [linhVucLon, setLinhVucLon] = useState("");
  const [linhVucCon, setLinhVucCon] = useState("");

  const [ten, setTen] = useState("");
  const [ngayGiao, setNgayGiao] = useState("");
  const [hanHT, setHanHT] = useState("");
  const [sanPham, setSanPham] = useState("");

  const [tienDo, setTienDo] = useState("Đang thực hiện");
  const [canBoTM, setCanBoTM] = useState("");
  const [canBoPT, setCanBoPT] = useState("");

  const thangHienTai = new Date().getMonth() + 1;
  const [thang, setThang] = useState(thangHienTai);

  const handleLogin = () => {
    if (user === "admin" && pass === "123456") {
      setLogged(true);
    } else {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  const saveTask = async () => {
    if (!ten || !linhVucLon) {
      alert("Nhập đầy đủ thông tin");
      return;
    }

    const { error } = await supabase.from("nhiem_vu").insert([
      {
        linh_vuc_lon: linhVucLon,
        linh_vuc_con: linhVucCon,
        ten: ten,
        ngay_giao: ngayGiao,
        han_hoan_thanh: hanHT,
        san_pham: sanPham,
        tien_do: tienDo,
        can_bo_tham_muu: canBoTM,
        can_bo_phu_trach: canBoPT,
        thang: thang
      }
    ]);

    if (error) {
      alert("Lưu thất bại");
    } else {
      alert("Đã lưu nhiệm vụ");

      setTen("");
      setNgayGiao("");
      setHanHT("");
      setSanPham("");
      setCanBoTM("");
    }
  };

  if (!logged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-700">
        <div className="bg-white p-8 rounded-xl shadow-xl w-80">

          <h2 className="text-xl font-bold mb-4 text-center">
            Đăng nhập Admin
          </h2>

          <input
            placeholder="Tài khoản"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="border w-full px-3 py-2 mb-3 rounded"
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="border w-full px-3 py-2 mb-4 rounded"
          />

          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Đăng nhập
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl font-bold">
            HỆ THỐNG QUẢN LÝ CÔNG VIỆC
          </h1>
          <p className="text-blue-200">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center gap-6 py-2">

            <Link href="/">
              <Home size={20} />
            </Link>

            <Link href="/tien-do">
              Tiến độ
            </Link>

            <Link href="/thong-ke">
              Thống kê
            </Link>

          </div>
        </nav>
      </header>

      <main className="flex justify-center p-6 flex-1">

        <div className="bg-white w-full max-w-3xl p-6 rounded-xl shadow-xl">

          <h2 className="text-lg font-semibold text-blue-700 mb-4">
            Nhập nhiệm vụ
          </h2>

          <div className="grid gap-3">

            <select
              value={linhVucLon}
              onChange={(e) => setLinhVucLon(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">Chọn lĩnh vực</option>
              <option>I. Văn phòng - Tuyên giáo - Xây dựng Đoàn</option>
              <option>II. Phong trào - Hội LHTN</option>
              <option>III. Trường học - Hội Sinh viên</option>
            </select>

            <input
              placeholder="Lĩnh vực con"
              value={linhVucCon}
              onChange={(e) => setLinhVucCon(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              placeholder="Tên nhiệm vụ"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              type="date"
              value={ngayGiao}
              onChange={(e) => setNgayGiao(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              type="date"
              value={hanHT}
              onChange={(e) => setHanHT(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              placeholder="Sản phẩm"
              value={sanPham}
              onChange={(e) => setSanPham(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              placeholder="Cán bộ tham mưu"
              value={canBoTM}
              onChange={(e) => setCanBoTM(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <input
              placeholder="Thường trực phụ trách"
              value={canBoPT}
              onChange={(e) => setCanBoPT(e.target.value)}
              className="border px-3 py-2 rounded"
            />

            <select
              value={tienDo}
              onChange={(e) => setTienDo(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option>Đang thực hiện</option>
              <option>Hoàn thành</option>
              <option>Quá hạn</option>
            </select>

            <select
              value={thang}
              onChange={(e) => setThang(Number(e.target.value))}
              className="border px-3 py-2 rounded"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <button
              onClick={saveTask}
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Lưu nhiệm vụ
            </button>

          </div>

        </div>

      </main>

      <footer className="bg-blue-900 text-white text-center py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>

    </div>
  );
}