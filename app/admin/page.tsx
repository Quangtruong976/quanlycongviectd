
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
  Activity,
  Upload,
  CircleHelp,
  ArrowLeft,
  FolderTree,
} from "lucide-react";

type Task = {
  id: string;
  ten: string;
  linh_vuc_lon: string | null;
  linh_vuc_con: string | null;
  tien_do: string | null;
  ngay_giao: string | null;
  han_hoan_thanh: string | null;
  ngay_hoan_thanh: string | null;
  can_bo_tham_muu: string | null;
  can_bo_phu_trach: string | null;
  created_at: string | null;
};

type ModuleItem = {
  title: string;
  description: string;
  href: string | null;
  icon: LucideIcon;
  color: string;
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
        icon: Activity,
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

const taskModules: ModuleItem[] = [
  {
    title: "Quản lý nhiệm vụ",
    description:
      "Thêm, sửa, phân công, theo dõi thời hạn và quản lý dữ liệu nhiệm vụ.",
    href: "/admin/nhiem-vu",
    icon: ClipboardList,
    color: "emerald",
  },
  {
    title: "Nhập tiến độ nhiệm vụ",
    description:
      "Cập nhật tình hình, kết quả và sản phẩm thực hiện nhiệm vụ.",
    href: "/admin/nhap-tien-do",
    icon: Upload,
    color: "blue",
  },
];

const systemModules: ModuleItem[] = [
  {
    title: "Quản lý cán bộ, tài khoản",
    description:
      "Quản lý danh sách cán bộ, tạo tài khoản, cập nhật thông tin và phân quyền.",
    href: "/admin/users",
    icon: Users,
    color: "violet",
  },
  {
    title: "Quản lý lĩnh vực",
    description:
      "Thêm, sửa, sắp xếp và quản lý lĩnh vực lớn, lĩnh vực con dùng chung toàn hệ thống.",
    href: "/admin/danh-muc",
    icon: FolderTree,
    color: "blue",
  },
  {
    title: "Cấu hình hệ thống",
    description:
      "Thiết lập thông tin hệ thống, quy tắc nhiệm vụ, hiển thị và báo cáo.",
    href: "/admin/cau-hinh",
    icon: Settings,
    color: "slate",
  },
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isCompleted(task: Task) {
  if (task.ngay_hoan_thanh) return true;

  const status = (task.tien_do || "").trim().toLowerCase();

  return (
    status === "hoàn thành" ||
    status === "đã hoàn thành" ||
    status.includes("hoàn thành đúng hạn") ||
    status.includes("hoàn thành quá hạn")
  );
}

function isOverdue(task: Task) {
  if (isCompleted(task) || !task.han_hoan_thanh) return false;
  return task.han_hoan_thanh.slice(0, 10) < getToday();
}

function getStatus(task: Task) {
  if (isCompleted(task)) {
    return {
      label: "Đã hoàn thành",
      className: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (isOverdue(task)) {
    return {
      label: "Quá hạn",
      className: "bg-red-50 text-red-700",
      dot: "bg-red-500",
    };
  }

  return {
    label: task.tien_do || "Chưa hoàn thành",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Chưa xác định";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
  color,
}: ModuleItem) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    blue: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
    violet: "bg-violet-50 text-violet-700 group-hover:bg-violet-100",
    slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
  };

  const content = (
    <div
      className={`group flex h-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition ${
        href
          ? "hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          : "opacity-75"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          colorClasses[color] || colorClasses.slate
        }`}
      >
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">{title}</p>

          {href ? (
            <ArrowUpRight
              size={17}
              className="shrink-0 text-slate-300 group-hover:text-emerald-700"
            />
          ) : (
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
              CHƯA TRIỂN KHAI
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setErrorMessage("");

    const [taskResult, userResult] = await Promise.all([
      supabase
        .from("nhiem_vu")
        .select(
          "id,ten,linh_vuc_lon,linh_vuc_con,tien_do,ngay_giao,han_hoan_thanh,ngay_hoan_thanh,can_bo_tham_muu,can_bo_phu_trach,created_at"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
    ]);

    if (taskResult.error) {
      setTasks([]);
      setErrorMessage(
        `Không tải được dữ liệu nhiệm vụ: ${taskResult.error.message}`
      );
    } else {
      setTasks((taskResult.data || []) as Task[]);
    }

    if (userResult.error) {
      setUserCount(0);
      setErrorMessage((previous) =>
        previous
          ? `${previous} | Không tải được số lượng tài khoản.`
          : `Không tải được số lượng tài khoản: ${userResult.error.message}`
      );
    } else {
      setUserCount(userResult.count || 0);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const completed = tasks.filter(isCompleted).length;
    const overdue = tasks.filter(isOverdue).length;

    return {
      total: tasks.length,
      completed,
      overdue,
      pending: tasks.length - completed,
      completionRate: tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0,
    };
  }, [tasks]);

  const statCards = [
    {
      label: "Tổng nhiệm vụ",
      value: stats.total,
      description: "Tổng số nhiệm vụ trong hệ thống",
      icon: ClipboardList,
      color: "text-blue-700",
      background: "bg-blue-50",
      accent: "bg-blue-500",
    },
    {
      label: "Đã hoàn thành",
      value: stats.completed,
      description: `${stats.completionRate}% tổng số nhiệm vụ`,
      icon: CheckCircle2,
      color: "text-emerald-700",
      background: "bg-emerald-50",
      accent: "bg-emerald-500",
    },
    {
      label: "Chưa hoàn thành",
      value: stats.pending,
      description: "Nhiệm vụ chưa có kết quả hoàn thành",
      icon: Clock3,
      color: "text-amber-700",
      background: "bg-amber-50",
      accent: "bg-amber-500",
    },
    {
      label: "Nhiệm vụ quá hạn",
      value: stats.overdue,
      description: "Chưa hoàn thành và đã quá hạn",
      icon: AlertCircle,
      color: "text-red-700",
      background: "bg-red-50",
      accent: "bg-red-500",
    },
  ];

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Không thể đăng xuất: ${error.message}`);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      {mobileMenu && (
        <button
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
                  const active = item.href === "/admin";

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
  <div className="flex flex-col items-start gap-0">
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="inline-flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <LogOut size={17} />
      {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>

    <button
      type="button"
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
    >
      <ArrowLeft size={17} />
      Quay lại trang chủ
    </button>
  </div>
</div>

      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
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
                Tổng quan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              ADMINISTRATOR
            </span>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Làm mới dữ liệu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
          <section className="mb-4 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <LayoutDashboard size={14} />
                <span>Quản trị</span>
                <ChevronRight size={13} />
                <span className="text-emerald-700">Tổng quan</span>
              </div>

             
              <h1 className="text-lg font-extrabold text-emerald-950">
                Trung tâm quản trị
              </h1>
              <p className="text-xs text-slate-500">
                Điều hành nhiệm vụ, tiến độ, cán bộ và dữ liệu toàn hệ thống.
              </p>
            </div>
          </section>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-800">
                Tình hình dữ liệu
              </h2>
              <span className="text-[11px] text-slate-400">
                Số liệu từ cơ sở dữ liệu
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                          {loading ? "—" : card.value.toLocaleString("vi-VN")}
                        </p>
                      </div>

                      <div
                        className={`rounded-xl p-3 ${card.background} ${card.color}`}
                      >
                        <Icon size={21} />
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-400">
                      {card.description}
                    </p>

                    <div
                      className={`absolute bottom-0 left-0 h-[3px] w-full ${card.accent}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-7 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    Tổng quan hoàn thành nhiệm vụ
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Tỷ lệ nhiệm vụ đã hoàn thành trên tổng dữ liệu hiện có
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Activity size={20} />
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black tracking-tight text-[#145c3b]">
                    {loading ? "—" : `${stats.completionRate}%`}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tỷ lệ hoàn thành
                  </p>
                </div>

                <p className="text-right text-xs text-slate-500">
                  <span className="font-bold text-emerald-700">
                    {stats.completed}
                  </span>{" "}
                  hoàn thành / {stats.total} nhiệm vụ
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Đã hoàn thành: {stats.completed}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Chưa hoàn thành: {stats.pending}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Quá hạn: {stats.overdue}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800">
                    Người dùng hệ thống
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Tài khoản trong danh sách quản lý
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Users size={20} />
                </div>
              </div>

              <p className="mt-5 text-4xl font-black tracking-tight text-slate-900">
                {loading ? "—" : userCount.toLocaleString("vi-VN")}
              </p>

              <Link
                href="/admin/users"
                className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                Quản lý cán bộ, tài khoản
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>

          <section className="mb-7">
            <div className="mb-3">
              <h2 className="text-sm font-extrabold text-slate-800">
                Các phân hệ quản trị
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Truy cập các chức năng điều hành và quản lý toàn hệ thống.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {taskModules.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}

              {systemModules.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}
            </div>
          </section>

          <footer className="mt-6 flex flex-col gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              HỆ THỐNG QUẢN LÝ CÔNG VIỆC · TỈNH ĐOÀN LÂM ĐỒNG
            </span>

            <span className="flex items-center gap-1">
              <CircleHelp size={12} />
              Khu vực quản trị nội bộ
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
