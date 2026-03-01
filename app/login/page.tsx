"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      localStorage.setItem("role", "admin");
      router.push("/admin/nhap-tien-do");
    } else {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
          <p className="text-sm md:text-base font-semibold text-blue-200">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">
            <Link href="/" className="text-white hover:text-yellow-300">
              <Home size={20} />
            </Link>
            <Link href="/thong-ke" className="hover:underline">
              Thống kê chi tiết
            </Link>
            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ công việc
            </Link>
            <Link href="/login" className="hover:underline text-yellow-300">
              Đăng nhập
            </Link>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center items-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
          <h2 className="text-blue-700 font-semibold text-lg mb-6 text-center">
            ĐĂNG NHẬP QUẢN TRỊ
          </h2>

          <input
            type="text"
            placeholder="Tên đăng nhập"
            className="border px-3 py-2 rounded w-full mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            className="border px-3 py-2 rounded w-full mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded font-semibold"
          >
            Đăng nhập
          </button>
        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}