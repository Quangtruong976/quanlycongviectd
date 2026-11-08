
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Save,
  Building2,
  Bell,
  Eye,
  FileBarChart,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  FolderTree,
  Upload,
} from "lucide-react";

type Setting = {
  id: string;
  ma: string;
  ten: string;
  gia_tri: string;
  mo_ta: string | null;
  nhom: string;
  updated_at: string;
};

type AdminProfile = {
  ho_ten: string | null;
};

const navigation = [
  {
    heading: "TỔNG QUAN",
    items: [
      {
        title: "Trung tâm quản trị",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    heading: "QUẢN LÝ NGHIỆP VỤ",
    items: [
      {
        title: "Quản lý nhiệm vụ",
        href: "/admin/nhiem-vu",
        icon: ClipboardList,
      },
      {
        title: "Nhập tiến độ",
        href: "/admin/nhap-tien-do",
        icon: Upload,
      },
    ],
  },
  {
    heading: "QUẢN TRỊ HỆ THỐNG",
    items: [
      {
        title: "Quản lý cán bộ, tài khoản",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Quản lý lĩnh vực",
        href: "/admin/danh-muc",
        icon: FolderTree,
      },
      {
        title: "Cấu hình hệ thống",
        href: "/admin/cau-hinh",
        icon: Settings,
      },
    ],
  },
];

const defaultValues: Record<string, string> = {
  ten_phan_mem: "Hệ thống quản lý công việc Tỉnh đoàn Lâm Đồng",
  ten_co_quan: "Tỉnh đoàn Lâm Đồng",
  so_ngay_nhac_truoc_han: "2",
  canh_bao_qua_han: "true",
  so_nhiem_vu_moi_trang: "10",
  chu_ky_bao_cao: "thang",
};

const groups = [
  {
    id: "thong_tin",
    title: "Thông tin hệ thống",
    description: "Thông tin nhận diện và đơn vị sử dụng phần mềm.",
    icon: Building2,
  },
  {
    id: "nhiem_vu",
    title: "Cấu hình nhiệm vụ",
    description:
      "Thiết lập nhắc hạn và cảnh báo trong quá trình thực hiện nhiệm vụ.",
    icon: Bell,
  },
  {
    id: "hien_thi",
    title: "Cấu hình hiển thị",
    description: "Thiết lập số lượng nhiệm vụ hiển thị trên mỗi trang.",
    icon: Eye,
  },
  {
    id: "bao_cao",
    title: "Cấu hình báo cáo",
    description: "Thiết lập chu kỳ tổng hợp báo cáo mặc định.",
    icon: FileBarChart,
  },
];

export default function CauHinhPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error(result.error || "Không thể tải cấu hình.");
      }

      const rows: Setting[] = result.settings ?? [];
      const nextValues = { ...defaultValues };

      rows.forEach((item) => {
        nextValues[item.ma] = item.gia_tri;
      });

      setSettings(rows);
      setValues(nextValues);
      setAdmin(result.admin ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải cấu hình."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSuccess("");
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const updates = settings
        .filter((item) => values[item.ma] !== item.gia_tri)
        .map((item) => ({
          ma: item.ma,
          gia_tri: values[item.ma],
        }));

      if (updates.length === 0) {
        setSuccess("Các cấu hình hiện tại không có thay đổi.");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể lưu cấu hình.");
      }

      setSuccess(result.message || "Đã lưu cấu hình hệ thống.");
      await loadSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi lưu cấu hình."
      );
    } finally {
      setSaving(false);
    }
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
  
    setLoggingOut(true);
  
    const { error } = await supabase.auth.signOut();
  
    if (error) {
      alert(`Không thể đăng xuất: ${error.message}`);
      setLoggingOut(false);
      return;
    }
  
    router.replace("/login");
  };

  const getValue = (key: string) =>
    values[key] ?? defaultValues[key] ?? "";

  const renderField = (key: string) => {
    const item = settings.find((setting) => setting.ma === key);
    const description = item?.mo_ta ?? "";

    if (key === "canh_bao_qua_han") {
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Bật cảnh báo nhiệm vụ quá hạn
            </p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              updateValue(
                key,
                getValue(key) === "true" ? "false" : "true"
              )
            }
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              getValue(key) === "true"
                ? "bg-[#145c3b]"
                : "bg-slate-300"
            }`}
            aria-label="Bật hoặc tắt cảnh báo quá hạn"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                getValue(key) === "true" ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      );
    }

    if (key === "so_nhiem_vu_moi_trang") {
      return (
        <select
          value={getValue(key)}
          onChange={(event) => updateValue(key, event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#145c3b] focus:ring-2 focus:ring-green-100"
        >
          <option value="10">10 nhiệm vụ</option>
          <option value="20">20 nhiệm vụ</option>
          <option value="50">50 nhiệm vụ</option>
        </select>
      );
    }

    if (key === "chu_ky_bao_cao") {
      return (
        <select
          value={getValue(key)}
          onChange={(event) => updateValue(key, event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#145c3b] focus:ring-2 focus:ring-green-100"
        >
          <option value="tuan">Hàng tuần</option>
          <option value="thang">Hàng tháng</option>
          <option value="quy">Hàng quý</option>
        </select>
      );
    }

    if (key === "so_ngay_nhac_truoc_han") {
      return (
        <div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={30}
              value={getValue(key)}
              onChange={(event) => updateValue(key, event.target.value)}
              className="w-full max-w-[180px] rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#145c3b] focus:ring-2 focus:ring-green-100"
            />
            <span className="text-sm text-slate-600">ngày</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
      );
    }

    return (
      <div>
        <input
          type="text"
          value={getValue(key)}
          onChange={(event) => updateValue(key, event.target.value)}
          maxLength={200}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#145c3b] focus:ring-2 focus:ring-green-100"
        />
        <p className="mt-2 text-xs text-slate-500">{description}</p>
      </div>
    );
  };

  const fieldsByGroup: Record<string, string[]> = {
    thong_tin: ["ten_phan_mem", "ten_co_quan"],
    nhiem_vu: ["so_ngay_nhac_truoc_han", "canh_bao_qua_han"],
    hien_thi: ["so_nhiem_vu_moi_trang"],
    bao_cao: ["chu_ky_bao_cao"],
  };

  const settingLabels: Record<string, string> = {
    ten_phan_mem: "Tên phần mềm",
    ten_co_quan: "Tên cơ quan",
    so_ngay_nhac_truoc_han: "Nhắc trước thời hạn hoàn thành",
    canh_bao_qua_han: "Cảnh báo quá hạn",
    so_nhiem_vu_moi_trang: "Số nhiệm vụ trên mỗi trang",
    chu_ky_bao_cao: "Chu kỳ báo cáo mặc định",
  };

  const changedCount = settings.filter(
    (item) => values[item.ma] !== item.gia_tri
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      {mobileMenu && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

<aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[74px] items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
  <img
    src="/logo-doan.png"
    alt="Logo Đoàn TNCS Hồ Chí Minh"
    className="h-11 w-11 object-contain"
  />
</div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black tracking-wide text-[#145c3b]">
              TỈNH ĐOÀN LÂM ĐỒNG
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.15em] text-slate-400">
              ADMINISTRATION
            </p>
          </div>

          <button
            onClick={() => setMobileMenu(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-2">
          <div className="rounded-xl bg-gradient-to-br from-[#145c3b] to-[#20764d] p-4 text-white">
            <div className="flex items-center gap-2 text-emerald-100">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold tracking-widest">
                KHU VỰC QUẢN TRỊ
              </span>
            </div>
            <p className="mt-3 text-sm font-bold">Trung tâm điều hành</p>
            <p className="mt-1 text-[11px] leading-5 text-emerald-100/90">
              Quản lý nhiệm vụ, tiến độ, cán bộ và dữ liệu toàn hệ thống.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
         <div key={group.heading} className="mb-4">
             <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[0.13em] text-slate-400">
                {group.heading}
              </p>

              <div className="space-y-0">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenu(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                        active
                          ? "bg-emerald-50 text-[#145c3b]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#145c3b]"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex-1">{item.title}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </aside>


      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold text-slate-400">
                HỆ THỐNG QUẢN TRỊ
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                Cấu hình hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              ADMINISTRATOR
            </span>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading || saving}
              title="Làm mới dữ liệu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <Settings size={14} />
              <span>Quản trị</span>
              <ChevronRight size={13} />
              <span className="text-emerald-700">Cấu hình hệ thống</span>
            </div>

            <h1 className="text-lg font-extrabold text-emerald-950">
              Cấu hình hệ thống
            </h1>

            <p className="text-xs text-slate-500">
              Quản lý các thông số dùng chung, phục vụ hoạt động của ứng dụng.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-20 text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-[#145c3b]"
              />
              <p className="mt-4 text-sm text-slate-500">
                Đang tải cấu hình hệ thống...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">
                    Tổng số thông số
                  </p>
                  <p className="mt-3 text-[30px] font-black leading-none text-slate-900">
                    {settings.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">
                    Nhóm cấu hình
                  </p>
                  <p className="mt-3 text-[30px] font-black leading-none text-slate-900">
                    {groups.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">
                    Thông số chưa lưu
                  </p>
                  <p className="mt-3 text-[30px] font-black leading-none text-[#145c3b]">
                    {changedCount}
                  </p>
                </div>
              </div>

              {settings.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                  Chưa tìm thấy dữ liệu cấu hình. Vui lòng kiểm tra bảng
                  cau_hinh_he_thong trong Supabase.
                </div>
              ) : (
                <div className="space-y-5">
                  {groups.map((group) => {
                    const Icon = group.icon;
                    const keys = fieldsByGroup[group.id] ?? [];

                    return (
                      <section
                        key={group.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#145c3b]">
                            <Icon size={20} />
                          </div>

                          <div>
                            <h2 className="text-sm font-extrabold text-slate-800">
                              {group.title}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {group.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-5 px-5 py-5 sm:px-6">
                          {keys.map((key) => {
                            const exists = settings.some(
                              (item) => item.ma === key
                            );

                            if (!exists) return null;

                            return (
                              <div
                                key={key}
                                className="grid grid-cols-1 gap-3 md:grid-cols-[230px_1fr] md:gap-6"
                              >
                                <div>
                                  <label className="text-sm font-semibold text-slate-700">
                                    {settingLabels[key]}
                                  </label>
                                </div>

                                <div>{renderField(key)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
                <p className="text-xs text-slate-500">
                  Các thay đổi chỉ được áp dụng sau khi nhấn Lưu cấu hình.
                </p>
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving || loading || settings.length === 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#145c3b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#104a30] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs leading-5 text-blue-800">
                  <strong>Lưu ý:</strong> Trang này hiện quản lý thông số cấu
                  hình trong cơ sở dữ liệu. Những thiết lập như nhắc hạn, cảnh
                  báo và chu kỳ báo cáo cần được kết nối vào các chức năng
                  tương ứng để có hiệu lực trong toàn hệ thống.
                </p>
              </div>
            </>
          )}

          <footer className="mt-6 flex flex-col gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              HỆ THỐNG QUẢN LÝ CÔNG VIỆC · TỈNH ĐOÀN LÂM ĐỒNG
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} />
              Khu vực quản trị nội bộ
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
