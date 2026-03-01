"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NhapTienDo() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.push("/login");
    }
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold p-4">
        Trang nhập tiến độ (Admin)
      </h1>
    </div>
  );
}