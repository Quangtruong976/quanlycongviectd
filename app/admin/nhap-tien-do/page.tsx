
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Activity,
  Users,
  CheckCircle2,
  Clock3,
  Search,
  Save,
  RefreshCw,
  CalendarDays,
  UserRound,
  Filter,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Settings,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  ten: string;
  han_hoan_thanh: string | null;
  ngay_hoan_thanh: string | null;
  tien_do: string | null;
  can_bo_tham_muu: string | null;
  can_bo_phu_trach: string | null;
  can_bo: string | null;
  thang: number;
  nam: number;
  cap_nhat_tien_do_luc?: string | null;
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const inputClass =
  "h-[42px] w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const navigation = [
  {
    heading: "TỔNG QUAN",
    items: [
      { title: "Trung tâm quản trị", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    heading: "QUẢN LÝ NGHIỆP VỤ",
    items: [
      { title: "Quản lý nhiệm vụ", href: "/admin/nhiem-vu", icon: ClipboardList },
      { title: "Nhập tiến độ", href: "/admin/nhap-tien-do", icon: Activity },
    ],
  },
  {
    heading: "QUẢN TRỊ HỆ THỐNG",
    items: [
      { title: "Quản lý cán bộ, tài khoản", href: "/admin/users", icon: Users },
      { title: "Quản lý lĩnh vực", href: "/admin/danh-muc", icon: FolderTree },
      { title: "Cấu hình hệ thống", href: "/admin/cau-hinh", icon: Settings },
    ],
  },
];

function formatDate(value?: string | null) {
  if (!value) return "Chưa xác định";

  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTaskStatus(task: Task) {
  if (task.ngay_hoan_thanh) {
    if (
      task.han_hoan_thanh &&
      task.ngay_hoan_thanh > task.han_hoan_thanh
    ) {
      return "Hoàn thành quá hạn";
    }

    return "Hoàn thành đúng hạn";
  }

  if (task.han_hoan_thanh && task.han_hoan_thanh < getToday()) {
    return "Quá hạn chưa hoàn thành";
  }

  return "Chưa hoàn thành";
}

function getStatusStyle(status: string) {
  if (status === "Hoàn thành đúng hạn") return "bg-green-50 text-green-700";
  if (status === "Hoàn thành quá hạn") return "bg-orange-50 text-orange-700";
  if (status === "Quá hạn chưa hoàn thành") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function getStatusIcon(status: string) {
  if (status.startsWith("Hoàn thành")) {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  if (status === "Quá hạn chưa hoàn thành") {
    return <AlertCircle className="h-3.5 w-3.5" />;
  }

  return <Clock3 className="h-3.5 w-3.5" />;
}

export default function NhapTienDoPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [searchTask, setSearchTask] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Trạng thái hộp thoại cập nhật tiến độ riêng từng nhiệm vụ.
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalCompletionDate, setModalCompletionDate] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  const years = useMemo(
    () =>
      Array.from(
        { length: Math.max(6, currentYear - 2025 + 4) },
        (_, index) => 2025 + index
      ),
    []
  );

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") {
      router.replace("/login");
    }
  }, [router]);

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("nhiem_vu")
        .select(
          "id, ten, han_hoan_thanh, ngay_hoan_thanh, tien_do, can_bo_tham_muu, can_bo_phu_trach, can_bo, thang, nam, cap_nhat_tien_do_luc"
        )
        .eq("thang", month)
        .eq("nam", year)
        .order("han_hoan_thanh", { ascending: true });

      if (error) throw error;

      const loadedTasks = (data || []) as Task[];

      setTasks(loadedTasks);
      setOriginalTasks(loadedTasks.map((task) => ({ ...task })));
    } catch (error) {
      alert(
        "Không tải được danh sách nhiệm vụ: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  function updateCompletionDate(id: string, value: string) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, ngay_hoan_thanh: value || null }
          : task
      )
    );
  }

  // Mở hộp thoại và nạp ngày hoàn thành hiện tại của nhiệm vụ.
  function openProgressModal(task: Task) {
    setEditingTask(task);
    setModalCompletionDate(task.ngay_hoan_thanh || "");
  }

  function closeProgressModal() {
    if (modalSaving) return;

    setEditingTask(null);
    setModalCompletionDate("");
  }

  // Lưu riêng nhiệm vụ đang được chọn, không ảnh hưởng nhiệm vụ khác.
  async function saveSingleProgress() {
    if (!editingTask || modalSaving) return;

    const updatedTask: Task = {
      ...editingTask,
      ngay_hoan_thanh: modalCompletionDate || null,
    };

    const status = getTaskStatus(updatedTask);

    setModalSaving(true);

    try {
      const { error } = await supabase
        .from("nhiem_vu")
        .update({
          ngay_hoan_thanh: updatedTask.ngay_hoan_thanh,
          tien_do: status,
          cap_nhat_tien_do_luc: new Date().toISOString(),
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      // Cập nhật dữ liệu trên giao diện ngay sau khi lưu thành công.
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                ngay_hoan_thanh: updatedTask.ngay_hoan_thanh,
                tien_do: status,
                cap_nhat_tien_do_luc: new Date().toISOString(),
              }
            : task
        )
      );

      setOriginalTasks((previous) =>
        previous.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                ngay_hoan_thanh: updatedTask.ngay_hoan_thanh,
                tien_do: status,
              }
            : task
        )
      );

      setEditingTask(null);
      setModalCompletionDate("");

      alert("Đã cập nhật tiến độ nhiệm vụ thành công.");
    } catch (error) {
      alert(
        "Cập nhật tiến độ không thành công: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setModalSaving(false);
    }
  }

  async function saveProgress() {
    const changedTasks = tasks.filter((task) => {
      const original = originalTasks.find((item) => item.id === task.id);

      return (
        original &&
        (original.ngay_hoan_thanh || "") !==
          (task.ngay_hoan_thanh || "")
      );
    });

    if (changedTasks.length === 0) {
      alert("Không có nội dung tiến độ nào thay đổi.");
      return;
    }

    if (
      !confirm(
        `Xác nhận cập nhật ngày hoàn thành của ${changedTasks.length} nhiệm vụ?`
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      for (const task of changedTasks) {
        const status = getTaskStatus(task);

        const { error } = await supabase
          .from("nhiem_vu")
          .update({
            ngay_hoan_thanh: task.ngay_hoan_thanh || null,
            tien_do: status,
            cap_nhat_tien_do_luc: new Date().toISOString(),
          })
          .eq("id", task.id);

        if (error) throw error;
      }

      alert(`Đã cập nhật tiến độ ${changedTasks.length} nhiệm vụ.`);

      await loadTasks();
    } catch (error) {
      alert(
        "Cập nhật tiến độ không thành công: " +
          (error instanceof Error ? error.message : String(error))
      );

      await loadTasks();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Không thể đăng xuất: " + error.message);
      setLoggingOut(false);
      return;
    }

    ["role", "name", "email", "linh_vuc_quan_ly"].forEach((key) =>
      localStorage.removeItem(key)
    );

    router.replace("/login");
  }

  const staffList = useMemo(() => {
    const names = tasks
      .map((task) => (task.can_bo_tham_muu || task.can_bo || "").trim())
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, "vi")
    );
  }, [tasks]);

  const filteredStaffList = useMemo(() => {
    const keyword = searchStaff.trim().toLowerCase();

    if (!keyword) return staffList;

    return staffList.filter((name) =>
      name.toLowerCase().includes(keyword)
    );
  }, [staffList, searchStaff]);

  const filteredTasks = useMemo(() => {
    const taskKeyword = searchTask.trim().toLowerCase();
    const staffKeyword = searchStaff.trim().toLowerCase();

    return tasks.filter((task) => {
      const taskOK =
        !taskKeyword || task.ten.toLowerCase().includes(taskKeyword);

      const staffName = task.can_bo_tham_muu || task.can_bo || "";

      const staffOK =
        !staffKeyword || staffName.toLowerCase().includes(staffKeyword);

      const status = getTaskStatus(task);
      const statusOK =
        statusFilter === "ALL" || status === statusFilter;

      return taskOK && staffOK && statusOK;
    });
  }, [tasks, searchTask, searchStaff, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, searchTask, searchStaff, statusFilter, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTasks.length);
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  const total = tasks.length;

  const completed = tasks.filter((task) =>
    getTaskStatus(task).startsWith("Hoàn thành")
  ).length;

  const completedOnTime = tasks.filter(
    (task) => getTaskStatus(task) === "Hoàn thành đúng hạn"
  ).length;

  const completedLate = tasks.filter(
    (task) => getTaskStatus(task) === "Hoàn thành quá hạn"
  ).length;

  const incomplete = total - completed;

  const overdue = tasks.filter(
    (task) => getTaskStatus(task) === "Quá hạn chưa hoàn thành"
  ).length;

  const progressPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  function clearFilters() {
    setSearchTask("");
    setSearchStaff("");
    setStatusFilter("ALL");
  }

  const modalTaskForStatus = editingTask
    ? {
        ...editingTask,
        ngay_hoan_thanh: modalCompletionDate || null,
      }
    : null;

  const modalStatus = modalTaskForStatus
    ? getTaskStatus(modalTaskForStatus)
    : "";

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white">
        <div className="flex h-[74px] items-center gap-3 border-b border-slate-100 px-5">
          <img
            src="/logo-doan.png"
            alt="Logo Đoàn TNCS Hồ Chí Minh"
            className="h-11 w-11 shrink-0 object-contain"
          />

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
            aria-label="Đóng menu"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-2">
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

        <div className="shrink-0 border-t border-slate-100 p-4">
          <button
            onClick={logout}
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
              onClick={() => setMobileMenu(true)}
              aria-label="Mở menu"
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold text-slate-400">
                HỆ THỐNG QUẢN TRỊ
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                Nhập tiến độ nhiệm vụ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadTasks}
              disabled={loading}
              title="Tải lại dữ liệu"
              aria-label="Tải lại dữ liệu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              ADMINISTRATOR
            </span>
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
                Nhập tiến độ thực hiện nhiệm vụ
              </h1>
              <p className="text-xs text-slate-500">
                Cập nhật ngày hoàn thành thực tế của nhiệm vụ được giao
              </p>
            </div>

            <button
              onClick={saveProgress}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#167548] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu tiến độ"}
            </button>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Tổng nhiệm vụ trong kỳ
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-800">
                {total}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Đã hoàn thành
              </p>
              <p className="mt-1 text-3xl font-extrabold text-green-700">
                {completed}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Đúng hạn: {completedOnTime} · Quá hạn: {completedLate}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Chưa hoàn thành
              </p>
              <p className="mt-1 text-3xl font-extrabold text-orange-600">
                {incomplete}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Đã quá hạn
              </p>
              <p className="mt-1 text-3xl font-extrabold text-red-600">
                {overdue}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Tỷ lệ hoàn thành nhiệm vụ trong kỳ
              </span>
              <span className="font-extrabold text-emerald-700">
                {progressPercent}%
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-800">
                Bộ lọc và tìm kiếm
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="min-w-0">
                <label className={labelClass}>Năm</label>
                <select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className={inputClass}
                >
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className={labelClass}>Tháng</label>
                <select
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (item) => (
                      <option key={item} value={item}>
                        Tháng {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="min-w-0">
                <label className={labelClass}>Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                  <option value="Quá hạn chưa hoàn thành">
                    Quá hạn chưa hoàn thành
                  </option>
                  <option value="Hoàn thành đúng hạn">
                    Hoàn thành đúng hạn
                  </option>
                  <option value="Hoàn thành quá hạn">
                    Hoàn thành quá hạn
                  </option>
                </select>
              </div>

              <div className="min-w-0">
                <label className={labelClass}>Tìm theo tên nhiệm vụ</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTask}
                    onChange={(event) => setSearchTask(event.target.value)}
                    placeholder="Nhập tên nhiệm vụ..."
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className={labelClass}>Tìm theo cán bộ</label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    list="staff-suggestions"
                    value={searchStaff}
                    onChange={(event) => setSearchStaff(event.target.value)}
                    placeholder="Nhập hoặc chọn cán bộ..."
                    className={`${inputClass} pl-9`}
                  />

                  <datalist id="staff-suggestions">
                    {filteredStaffList.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Đang xem nhiệm vụ tháng {month}/{year}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearFilters}
                  className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Xóa bộ lọc
                </button>

                <button
                  onClick={loadTasks}
                  disabled={loading}
                  className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  Tải lại
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Danh sách nhiệm vụ
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tháng {month}/{year} · Hiển thị{" "}
                  {filteredTasks.length === 0 ? 0 : startIndex + 1}–{endIndex} /{" "}
                  {filteredTasks.length} nhiệm vụ
                </p>
              </div>

              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                {filteredTasks.length} nhiệm vụ phù hợp
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-700" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-16 text-center">
                <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-600">
                  Không có nhiệm vụ phù hợp
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Thử thay đổi tháng, năm hoặc nội dung tìm kiếm.
                </p>
              </div>
            ) : (
              <div>
                {paginatedTasks.map((task, index) => {
                  const status = getTaskStatus(task);
                  const staffName =
                    task.can_bo_tham_muu ||
                    task.can_bo ||
                    "Chưa phân công";

                  const original = originalTasks.find(
                    (item) => item.id === task.id
                  );

                  const changed =
                    (original?.ngay_hoan_thanh || "") !==
                    (task.ngay_hoan_thanh || "");

                  return (
                    <article
                      key={task.id}
                      className="border-b border-slate-100 bg-white p-3 transition-colors duration-150 last:border-b-0 hover:bg-slate-50 sm:p-4"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-extrabold text-emerald-800">
                          {startIndex + index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              Nhiệm vụ tháng {task.thang}/{task.nam}
                            </span>

                            {changed && (
                              <span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700">
                                Chưa lưu thay đổi
                              </span>
                            )}
                          </div>

                          <h4 className="mt-1 text-sm font-bold leading-relaxed text-slate-800">
                            {task.ten || "Nhiệm vụ chưa có tên"}
                          </h4>

                          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-start gap-2">
                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-400">
                                  Hạn hoàn thành
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                  {formatDate(task.han_hoan_thanh)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <div>
                                <p className="text-[10px] text-slate-400">
                                  Cán bộ tham mưu
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                  {staffName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <div>
                                <p className="text-[10px] text-slate-400">
                                  Ngày hoàn thành đã ghi nhận
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                  {formatDate(task.ngay_hoan_thanh)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                                status
                              )}`}
                            >
                              {getStatusIcon(status)}
                              {status}
                            </span>
                          </div>

                          <div className="mt-3 grid w-full max-w-[460px] grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="min-w-0">
                              <label
                                htmlFor={`completion-${task.id}`}
                                className={labelClass}
                              >
                                Ngày hoàn thành thực tế
                              </label>

                              <input
                                id={`completion-${task.id}`}
                                type="date"
                                value={task.ngay_hoan_thanh || ""}
                                onChange={(event) =>
                                  updateCompletionDate(
                                    task.id,
                                    event.target.value
                                  )
                                }
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className={labelClass}>
                                Trạng thái tự động
                              </label>

                              <div
                                className={`flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold ${getStatusStyle(
                                  status
                                )}`}
                              >
                                {getStatusIcon(status)}
                                <span>{status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openProgressModal(task)}
                              disabled={saving || modalSaving}
                              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#167548] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Cập nhật tiến độ
                            </button>

                            {changed && (
                              <span className="text-[10px] font-medium text-orange-600">
                                Có thay đổi chưa lưu bằng nút Lưu tiến độ
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-[10px] text-slate-400">
                            Có thể cập nhật riêng bằng hộp thoại hoặc nhập trực
                            tiếp rồi lưu hàng loạt. Chỉ nhập ngày khi nhiệm vụ
                            đã hoàn thành.
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-slate-500">
                  Hiển thị {filteredTasks.length === 0 ? 0 : startIndex + 1}–
                  {endIndex} / {filteredTasks.length} nhiệm vụ
                </p>

                <label className="text-xs font-medium text-slate-500">
                  Hiển thị
                </label>

                <select
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(Number(event.target.value))
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                >
                  {[10, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      {size} nhiệm vụ
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-8 rounded-lg px-2.5 text-xs font-bold transition ${
                      safeCurrentPage === page
                        ? "bg-emerald-700 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-200 px-1 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold tracking-wide">
              HỆ THỐNG QUẢN LÝ CÔNG VIỆC · TỈNH ĐOÀN LÂM ĐỒNG
            </span>
            <span>Khu vực quản trị nội bộ</span>
          </footer>
        </main>
      </div>

      {/* HỘP THOẠI CẬP NHẬT TIẾN ĐỘ */}
      {editingTask && modalTaskForStatus && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProgressModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-modal-title"
            className="my-auto w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Activity className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-emerald-700">
                    CẬP NHẬT TIẾN ĐỘ
                  </span>
                </div>

                <h2
                  id="progress-modal-title"
                  className="text-base font-extrabold text-slate-800"
                >
                  Cập nhật nhiệm vụ
                </h2>
              </div>

              <button
                type="button"
                onClick={closeProgressModal}
                disabled={modalSaving}
                aria-label="Đóng hộp thoại"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Nhiệm vụ đang được chọn
                </p>
                <p className="mt-1.5 text-sm font-bold leading-relaxed text-slate-800">
                  {editingTask.ten || "Nhiệm vụ chưa có tên"}
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] text-slate-500">
                      Cán bộ tham mưu
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {editingTask.can_bo_tham_muu ||
                        editingTask.can_bo ||
                        "Chưa phân công"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">
                      Hạn hoàn thành
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatDate(editingTask.han_hoan_thanh)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">Kỳ nhiệm vụ</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      Tháng {editingTask.thang}/{editingTask.nam}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500">
                      Ngày hoàn thành đã ghi nhận
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                      {formatDate(editingTask.ngay_hoan_thanh)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="modal-completion-date"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Ngày hoàn thành thực tế
                </label>

                <input
                  id="modal-completion-date"
                  type="date"
                  value={modalCompletionDate}
                  onChange={(event) =>
                    setModalCompletionDate(event.target.value)
                  }
                  disabled={modalSaving}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                  Chỉ chọn ngày khi nhiệm vụ đã hoàn thành. Để trống ngày nếu
                  nhiệm vụ chưa hoàn thành hoặc muốn xóa ngày hoàn thành đã ghi
                  nhận.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-slate-700">
                  Trạng thái sau khi cập nhật
                </p>

                <div
                  className={`flex min-h-11 items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold ${getStatusStyle(
                    modalStatus
                  )}`}
                >
                  {getStatusIcon(modalStatus)}
                  {modalStatus}
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Trạng thái được hệ thống tự xác định căn cứ ngày hoàn thành
                  thực tế và hạn hoàn thành.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeProgressModal}
                disabled={modalSaving}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={saveSingleProgress}
                disabled={modalSaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#167548] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {modalSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Lưu cập nhật
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
