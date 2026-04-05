"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
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
  
    // ✅ login như cũ
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      setErrorMsg("Email hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }
  
    // ✅ lấy role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();
  
    if (profileError || !profile) {
      setErrorMsg("Không lấy được thông tin user.");
      setLoading(false);
      return;
    }
  
    // lưu role
    localStorage.setItem("role", profile.role);
    localStorage.setItem("email", email);
  
    // 🔥 phân quyền
    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      // user → phân theo lĩnh vực (email)
      if (email === "linhvucphongtrao@tinhdoan.vn") {
        router.push("/user-phongtrao");
      } 
      else if (email === "linhvucvanphong@tinhdoan.vn") {
        router.push("/user-vanphong");
      } 
      else if (email === "linhvuctruonghoc@tinhdoan.vn") {
        router.push("/user-truonghoc");
      } 
      else {
        router.push("/");
      }
    }
  
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
          <Link href="/" className="text-white hover:text-yellow-300 cursor-pointer">
  <Home size={20}/>
</Link>
<Link href="/tien-do"
className="text-white hover:text-yellow-300 cursor-pointer">
Theo dõi tiến độ công việc
</Link>

<Link href="/thong-ke"
className="text-white hover:text-yellow-300 cursor-pointer">
Thống kê chi tiết công việc cá nhân
</Link>

<Link
  href="/login"
  className="text-white hover:text-yellow-300 cursor-pointer"
>
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

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />

            {errorMsg && (
              <div className="text-red-600 text-sm text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-2 rounded"
            >
              Đăng nhập
            </button>

          </form>
        </div>
      </main>

      <footer className="bg-blue-900 text-white text-center py-3 text-sm">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}