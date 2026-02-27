"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role === "admin") {
      setIsAdmin(true);
    }

    setLoading(false);
  }

  if (loading) return <div>Đang kiểm tra quyền...</div>;

  if (!isAdmin) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div>
      <h1>Trang quản trị</h1>
    </div>
  );
}