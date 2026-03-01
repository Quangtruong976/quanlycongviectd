"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Email hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }

    // Đăng nhập thành công → chuyển trang
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      
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
            <Link
              href="/"
              className="text-white hover:text-yellow-300 transition flex items-center"
              title="Trang chủ"
            >
              <Home size={20} />
            </Link>

            <Link href="/tien-do" className="hover:underline">
              Theo dõi tiến độ công việc
            </Link>

            <Link href="/thong-ke" className="hover:underline">
              Thống kê chi tiết công việc cá nhân
            </Link>
            
            <Link href="/login" className="hover:underline">
              Đăng nhập
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
          
          <h2 className="text-xl font-bold text-blue-700 text-center mb-6">
            Đăng nhập hệ thống
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Nhập email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
            </div>

            {errorMsg && (
              <div className="text-red-600 text-sm font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded transition"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center text-sm py-3">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}