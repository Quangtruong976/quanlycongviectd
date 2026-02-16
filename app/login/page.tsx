"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../auth/users";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleLogin() {
    const user = login(username, password);
    if (!user) {
      alert("Sai tài khoản hoặc mật khẩu");
      return;
    }
    localStorage.setItem("user", JSON.stringify(user));
    router.push("/nhap-nhiem-vu");
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
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
}
