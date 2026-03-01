"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Tạm thời hardcode admin
    if (username === "admin" && password === "123456") {
      localStorage.setItem("role", "admin");
      router.push("/admin/nhap-tiendo");
    } else {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Đăng nhập hệ thống
        </h2>

        <input
          type="text"
          placeholder="Tài khoản"
          className="w-full border p-2 mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full border p-2 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 font-semibold"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
}