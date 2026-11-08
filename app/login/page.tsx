
"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Mail,
  LockKeyhole,
  LoaderCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMsg("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      // Xác thực tài khoản Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (authError || !authData.user) {
        console.error("LOGIN AUTH ERROR:", authError);
        setErrorMsg(
          authError?.message || "Không xác thực được tài khoản."
        );
        setLoading(false);
        return;
      }

      // Lấy hồ sơ phân quyền
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, role, linh_vuc_quan_ly, ho_ten")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error("LOGIN PROFILE ERROR:", profileError);
        await supabase.auth.signOut();
        setErrorMsg(
          "Đăng nhập thành công nhưng không lấy được hồ sơ phân quyền."
        );
        setLoading(false);
        return;
      }

      // Lưu thông tin phiên phía trình duyệt
      localStorage.setItem("role", profile.role || "");
      localStorage.setItem("email", normalizedEmail);
      localStorage.setItem("user_id", authData.user.id);
      localStorage.setItem("name", profile.ho_ten || "");
      localStorage.setItem(
        "linh_vuc_quan_ly",
        profile.linh_vuc_quan_ly || ""
      );

      // Điều hướng theo quyền
      if (profile.role === "admin") {
        router.replace("/admin");
      } else {
        switch (profile.linh_vuc_quan_ly) {
          case "pt_hoilhtn":
            router.replace("/user-phongtrao");
            break;

          case "vp_tg_xdd":
            router.replace("/user-vanphong");
            break;

          case "truonghoc_hsv":
            router.replace("/user-truonghoc");
            break;

          default:
            router.replace("/");
            break;
        }
      }

      router.refresh();
    } catch (error) {
      console.error("LOGIN SYSTEM ERROR:", error);
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi đăng nhập."
      );
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0D5032] via-[#167548] to-[#238B55] px-4 py-8">

      {/* HỌA TIẾT NỀN */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full border-[45px] border-white/[0.05]" />
        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full border-[55px] border-white/[0.05]" />
        <div className="absolute right-[15%] top-[10%] h-40 w-40 rounded-full bg-white/[0.04] blur-2xl" />
      </div>

      {/* KHỐI ĐĂNG NHẬP */}
      <div className="relative z-10 w-full max-w-[430px]">

        {/* NHẬN DIỆN HỆ THỐNG */}
        <div className="mb-7 text-center text-white">
          <img
            src="/logo-doan.png"
            alt="Logo Đoàn"
            className="mx-auto mb-4 h-20 w-20 object-contain drop-shadow-md"
          />

          <h1 className="text-xl font-extrabold leading-tight tracking-wide sm:text-xl">
            QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>

          <p className="mt-1 text-sm font-semibold tracking-[0.10em] text-emerald-100">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
        </div>

        {/* FORM ĐĂNG NHẬP */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">

          <div className="h-1.5 bg-gradient-to-r from-[#105C39] via-[#238B55] to-[#65B783]" />

          <div className="px-6 py-7 sm:px-9 sm:py-9">

            <div className="mb-7 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF4ED] text-[#167548]">
                <ShieldCheck size={26} strokeWidth={1.8} />
              </div>

              <h2 className="text-xl font-extrabold text-[#105C39]">
                Đăng nhập hệ thống
              </h2>

              <p className="mt-1.5 text-xs text-gray-500">
                Vui lòng đăng nhập bằng tài khoản được cấp
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFCFA] px-3 transition focus-within:border-[#238B55] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#238B55]/10">
                  <Mail
                    size={18}
                    className="shrink-0 text-[#167548]"
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    className="h-full w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* MẬT KHẨU */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Mật khẩu
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFCFA] px-3 transition focus-within:border-[#238B55] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#238B55]/10">
                  <LockKeyhole
                    size={18}
                    className="shrink-0 text-[#167548]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-full w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="shrink-0 text-gray-400 transition hover:text-[#167548]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* THÔNG BÁO LỖI */}
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm leading-5 text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* NÚT ĐĂNG NHẬP */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#167548] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#105C39] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    ĐĂNG NHẬP
                  </>
                )}
              </button>
              <div className="mt-5 text-center">
              <button
  type="button"
  onClick={() => router.push("/")}
  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 -mt-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
>
  <ArrowLeft size={17} />
  Quay lại trang chủ
</button>
</div>
            </form>
          </div>
        </div>

    

      </div>
    </main>
  );
}
