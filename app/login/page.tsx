"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      alert("Nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Sai tài khoản hoặc mật khẩu");
      setLoading(false);
      return;
    }

    router.replace("/nhap-nhiem-vu");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-700">
      <div className="bg-white p-6 rounded-xl w-[320px]">
        <h2 className="text-xl font-bold mb-4 text-center">
          Đăng nhập hệ thống
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="border w-full mb-3 p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="border w-full mb-4 p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}