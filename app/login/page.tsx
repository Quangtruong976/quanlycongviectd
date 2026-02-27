"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "../auth/users";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* ===== NẾU ĐÃ ĐĂNG NHẬP THÌ CHUYỂN HƯỚNG ===== */
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      router.replace("/nhap-nhiem-vu");
    }
  }, [router]);

  /* ===== LOGIN ===== */
  function handleLogin() {
    if (!username.trim() || !password.trim()) {
      alert("Nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const user = login(username.trim(), password);

      if (!user) {
        alert("Sai tài khoản hoặc mật khẩu");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      router.replace("/nhap-nhiem-vu");
    } catch (error) {
      alert("Có lỗi xảy ra");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-700">
      <div className="bg-white p-6 rounded-xl w-[320px]">
        <h2 className="text-xl font-bold mb-4 text-center">
          Đăng nhập hệ thống
        </h2>

        <input
          placeholder="Tên đăng nhập"
          className="border w-full mb-3 p-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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