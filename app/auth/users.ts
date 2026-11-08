
import { supabase } from "@/lib/supabase";

/* =====================================================
   KIỂU DỮ LIỆU NGƯỜI DÙNG
===================================================== */

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  linh_vuc_quan_ly: string;
};

/* =====================================================
   LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
===================================================== */

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, linh_vuc_quan_ly, ho_ten")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: authUser.id,
    email: profile.email || authUser.email || "",
    name: profile.ho_ten || "",
    role: profile.role || "user",
    linh_vuc_quan_ly: profile.linh_vuc_quan_ly || "",
  };
}

/* =====================================================
   KIỂM TRA QUYỀN ADMIN
===================================================== */

export function isAdmin(role: string | null | undefined) {
  return role === "admin";
}

/* =====================================================
   ĐĂNG XUẤT
===================================================== */

export async function logout() {
  await supabase.auth.signOut();

  if (typeof window !== "undefined") {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    localStorage.removeItem("linh_vuc_quan_ly");
  }
}
