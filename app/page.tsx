
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Home,
  ClipboardList,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  FileText,
  ChevronRight,
  Monitor,
  ShieldCheck,
  AlertTriangle,
  X,
  CalendarClock,
  UserRound,
  BellRing,
  Search,
} from "lucide-react";

type NhiemVu = {
  id: string;
  ten_nhiem_vu?: string | null;
  noi_dung?: string | null;
  can_bo_tham_muu?: string | null;
  can_bo_phu_trach?: string | null;
  ngay_giao?: string | null;
  han_hoan_thanh?: string | null;
  ngay_hoan_thanh?: string | null;
  thang?: number | null;
  nam?: number | null;
  quy?: number | null;
  loai_nhiem_vu?: string | null;
  tien_do?: string | null;
};

type AlertType =
  | "hoanThanhQuaHan"
  | "chuaHoanThanh"
  | "sapDenHan"
  | "daQuaHan";

const COLORS = {
  green: "#167548",
  dark: "#105C39",
  light: "#EAF4ED",
};

// Phân loại trạng thái nhiệm vụ
function trangThai(task: NhiemVu) {
  const status = (task.tien_do || "").toLowerCase().trim();

  if (status.includes("hoàn thành đúng hạn")) return "dungHan";
  if (status.includes("hoàn thành quá hạn")) return "quaHan";
  if (
    status.includes("chưa hoàn thành") ||
    status.includes("không hoàn thành")
  ) {
    return "chuaHT";
  }

  if (task.ngay_hoan_thanh) {
    if (
      task.han_hoan_thanh &&
      task.ngay_hoan_thanh.slice(0, 10) <=
        task.han_hoan_thanh.slice(0, 10)
    ) {
      return "dungHan";
    }

    return "quaHan";
  }

  return "chuaHT";
}

function tyLe(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function so(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

// Chuyển ngày thành đối tượng Date theo múi giờ địa phương
function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;

  const dateString = value.slice(0, 10);
  const parts = dateString.split("-");

  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

// Số ngày còn lại đến hạn
function soNgayConLai(value?: string | null): number | null {
  const deadline = parseDateOnly(value);
  if (!deadline) return null;

  const today = new Date();

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const deadlineUTC = Date.UTC(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );

  return Math.round((deadlineUTC - todayUTC) / 86400000);
}

function dinhDangNgay(value?: string | null) {
  const date = parseDateOnly(value);

  if (!date) return "Chưa cập nhật";

  return date.toLocaleDateString("vi-VN");
}

function tenNhiemVu(task: NhiemVu) {
  return task.ten_nhiem_vu || task.noi_dung || "Nhiệm vụ chưa có tên";
}

function tenCanBo(task: NhiemVu) {
  return (
    task.can_bo_phu_trach ||
    task.can_bo_tham_muu ||
    "Chưa cập nhật cán bộ phụ trách"
  );
}

// Kiểm tra nhiệm vụ có liên quan đến cán bộ được chọn hay không
function nhiemVuCuaCanBo(task: NhiemVu, canBo: string) {
  if (!canBo) return true;

  return (
    (task.can_bo_phu_trach || "").trim() === canBo ||
    (task.can_bo_tham_muu || "").trim() === canBo
  );
}

// Thẻ thống kê
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  onAlert,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  tone: "green" | "orange" | "red" | "gray";
  onAlert?: () => void;
}) {
  const styles = {
    green: {
      bg: "bg-[#EAF5ED]",
      icon: "bg-[#D7EBDD] text-[#167548]",
      number: "text-[#146B43]",
    },
    orange: {
      bg: "bg-[#FFF5E8]",
      icon: "bg-[#FCE9CC] text-[#B7791F]",
      number: "text-[#A76713]",
    },
    red: {
      bg: "bg-[#FFF0EF]",
      icon: "bg-[#FBDDD9] text-[#C2413A]",
      number: "text-[#B93832]",
    },
    gray: {
      bg: "bg-[#F1F4F2]",
      icon: "bg-[#E4EAE6] text-[#53665A]",
      number: "text-[#263B30]",
    },
  };

  const style = styles[tone];

  return (
    <div className={`${style.bg} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-gray-600 sm:text-sm">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${style.number}`}
        >
          {so(value)}
        </p>

        <div className="flex items-center gap-2">
          <span className="pb-1 text-[11px] text-gray-500">{sub}</span>

          {onAlert && (
            <button
              type="button"
              onClick={onAlert}
              title={`Xem danh sách ${label.toLowerCase()}`}
              aria-label={`Xem danh sách ${label.toLowerCase()}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition hover:bg-red-700 active:scale-95"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </div>
      </div>

      {onAlert && (
        <button
          type="button"
          onClick={onAlert}
          className="mt-2 text-[11px] font-semibold text-red-700 hover:text-red-900"
        >
          Xem danh sách cảnh báo →
        </button>
      )}
    </div>
  );
}

// Thẻ cảnh báo tiến độ
function WarningCard({
  title,
  description,
  count,
  icon: Icon,
  onClick,
  type,
}: {
  title: string;
  description: string;
  count: number;
  icon: React.ElementType;
  onClick: () => void;
  type: "orange" | "red";
}) {
  const style =
    type === "red"
      ? {
          bg: "border-red-200 bg-red-50",
          icon: "bg-red-100 text-red-700",
          number: "text-red-700",
          button: "bg-red-600 hover:bg-red-700",
        }
      : {
          bg: "border-amber-200 bg-amber-50",
          icon: "bg-amber-100 text-amber-700",
          number: "text-amber-700",
          button: "bg-amber-600 hover:bg-amber-700",
        };

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
          >
            <Icon size={20} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800">{title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <span className={`text-2xl font-bold ${style.number}`}>
          {so(count)}
        </span>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${style.button}`}
      >
        <AlertTriangle size={14} />
        Xem danh sách nhiệm vụ
      </button>
    </div>
  );
}

// Hộp danh sách cảnh báo
function AlertModal({
  type,
  tasks,
  allTasks,
  onClose,
}: {
  type: AlertType;
  tasks: NhiemVu[];
  allTasks: NhiemVu[];
  onClose: () => void;
}) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [taskKeyword, setTaskKeyword] = useState("");

  const config = {
    hoanThanhQuaHan: {
      title: "Danh sách nhiệm vụ hoàn thành quá hạn",
      description:
        "Các nhiệm vụ đã hoàn thành nhưng thời điểm hoàn thành trễ hơn thời hạn được giao.",
      color: "text-amber-700",
      bg: "bg-amber-50",
      icon: Clock3,
    },
    chuaHoanThanh: {
      title: "Danh sách nhiệm vụ chưa hoàn thành",
      description:
        "Các nhiệm vụ hiện chưa được ghi nhận hoàn thành trong hệ thống.",
      color: "text-red-700",
      bg: "bg-red-50",
      icon: AlertCircle,
    },
    sapDenHan: {
      title: "Cảnh báo nhiệm vụ sắp đến hạn",
      description:
        "Các nhiệm vụ chưa hoàn thành và còn tối đa 03 ngày là đến hạn.",
      color: "text-amber-700",
      bg: "bg-amber-50",
      icon: CalendarClock,
    },
    daQuaHan: {
      title: "Cảnh báo nhiệm vụ đã quá hạn",
      description:
        "Các nhiệm vụ chưa hoàn thành và đã quá thời hạn được giao.",
      color: "text-red-700",
      bg: "bg-red-50",
      icon: AlertTriangle,
    },
  };

  const item = config[type];
  const Icon = item.icon;

  // Danh sách cán bộ lấy từ cả hai trường cán bộ phụ trách và cán bộ tham mưu
  const employeeOptions = useMemo(() => {
    const names = new Set<string>();

    allTasks.forEach((task) => {
      const phuTrach = task.can_bo_phu_trach?.trim();
      const thamMuu = task.can_bo_tham_muu?.trim();

      if (phuTrach) names.add(phuTrach);
      if (thamMuu) names.add(thamMuu);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "vi"));
  }, [allTasks]);

  // Lọc danh sách cảnh báo theo cán bộ và tên nhiệm vụ
  const filteredAlertTasks = useMemo(() => {
    const keyword = taskKeyword.trim().toLocaleLowerCase("vi");

    return tasks.filter((task) => {
      if (
        selectedEmployee &&
        !nhiemVuCuaCanBo(task, selectedEmployee)
      ) {
        return false;
      }

      if (
        keyword &&
        !tenNhiemVu(task).toLocaleLowerCase("vi").includes(keyword)
      ) {
        return false;
      }

      return true;
    });
  }, [tasks, selectedEmployee, taskKeyword]);

  const sortedTasks = useMemo(() => {
    return [...filteredAlertTasks].sort((a, b) => {
      const dateA = a.han_hoan_thanh || "9999-12-31";
      const dateB = b.han_hoan_thanh || "9999-12-31";
      return dateA.localeCompare(dateB);
    });
  }, [filteredAlertTasks]);

  // Thống kê toàn bộ nhiệm vụ của cán bộ trong kỳ đang chọn
  const employeeStats = useMemo(() => {
    if (!selectedEmployee) return null;

    const employeeTasks = allTasks.filter((task) =>
      nhiemVuCuaCanBo(task, selectedEmployee)
    );

    const result = {
      tong: employeeTasks.length,
      dungHan: 0,
      quaHan: 0,
      chuaHT: 0,
    };

    employeeTasks.forEach((task) => {
      const status = trangThai(task);

      if (status === "dungHan") result.dungHan++;
      else if (status === "quaHan") result.quaHan++;
      else result.chuaHT++;
    });

    return result;
  }, [allTasks, selectedEmployee]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div
          className={`flex items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5 ${item.bg}`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ${item.color}`}
            >
              <Icon size={21} />
            </div>

            <div className="min-w-0">
              <h2
                id="alert-modal-title"
                className="text-sm font-bold text-gray-900 sm:text-base"
              >
                {item.title}
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-600">
                {item.description}
              </p>

              <p className={`mt-2 text-xs font-bold ${item.color}`}>
                {so(filteredAlertTasks.length)} / {so(tasks.length)} nhiệm vụ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {/* BỘ LỌC DANH SÁCH */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <Search size={16} className="text-[#167548]" />
              <p className="text-sm font-bold text-gray-800">
                Tìm kiếm nhiệm vụ và cán bộ
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="alert-task-search"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Tên nhiệm vụ
                </label>

                <div className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 focus-within:border-[#167548]">
                  <Search size={15} className="shrink-0 text-gray-400" />
                  <input
                    id="alert-task-search"
                    type="text"
                    value={taskKeyword}
                    onChange={(e) => setTaskKeyword(e.target.value)}
                    placeholder="Nhập tên nhiệm vụ cần tìm..."
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  {taskKeyword && (
                    <button
                      type="button"
                      onClick={() => setTaskKeyword("")}
                      title="Xóa nội dung tìm kiếm"
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="alert-employee-filter"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Cán bộ phụ trách / tham mưu
                </label>

                <select
                  id="alert-employee-filter"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#167548]"
                >
                  <option value="">Tất cả cán bộ</option>
                  {employeeOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(selectedEmployee || taskKeyword) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployee("");
                  setTaskKeyword("");
                }}
                className="mt-3 text-xs font-semibold text-[#167548] hover:text-[#105C39]"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* THỐNG KÊ RIÊNG CỦA CÁN BỘ ĐƯỢC CHỌN */}
          {selectedEmployee && employeeStats && (
            <div className="mb-4 rounded-xl border border-[#DCE9DF] bg-[#F5FAF6] p-3 sm:p-4">
              <div className="mb-3 flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E1F0E5] text-[#167548]">
                  <UserRound size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    Thống kê kết quả công việc của
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-gray-800">
                    {selectedEmployee}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Tổng số {so(employeeStats.tong)} nhiệm vụ trong kỳ đang chọn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-[11px] leading-4 text-gray-500">
                    Tổng nhiệm vụ
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-800">
                    {so(employeeStats.tong)}
                  </p>
                </div>

                <div className="rounded-lg border border-green-100 bg-white p-3">
                  <p className="text-[11px] leading-4 text-green-700">
                    Hoàn thành đúng hạn
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#167548]">
                    {so(employeeStats.dungHan)}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-100 bg-white p-3">
                  <p className="text-[11px] leading-4 text-amber-700">
                    Hoàn thành quá hạn
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-700">
                    {so(employeeStats.quaHan)}
                  </p>
                </div>

                <div className="rounded-lg border border-red-100 bg-white p-3">
                  <p className="text-[11px] leading-4 text-red-700">
                    Chưa hoàn thành
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-700">
                    {so(employeeStats.chuaHT)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DANH SÁCH NHIỆM VỤ */}
          {sortedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-[#167548]"
              />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                Không có nhiệm vụ phù hợp
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Vui lòng thay đổi hoặc xóa điều kiện tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task, index) => {
                const remaining = soNgayConLai(task.han_hoan_thanh);

                return (
                  <div
                    key={task.id}
                    className="rounded-xl border border-gray-200 bg-white p-3.5 transition hover:border-gray-300 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-5 text-gray-800">
                          {tenNhiemVu(task)}
                        </p>

                        <div className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                          <div className="flex items-start gap-2">
                            <UserRound
                              size={14}
                              className="mt-0.5 shrink-0 text-gray-400"
                            />
                            <span>
                              <span className="text-gray-400">
                                Cán bộ phụ trách:{" "}
                              </span>
                              <span className="font-medium text-gray-700">
                                {tenCanBo(task)}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={14}
                              className="shrink-0 text-gray-400"
                            />
                            <span>
                              <span className="text-gray-400">
                                Hạn hoàn thành:{" "}
                              </span>
                              <span className="font-semibold text-gray-700">
                                {dinhDangNgay(task.han_hoan_thanh)}
                              </span>
                            </span>
                          </div>
                        </div>

                        {task.tien_do && (
                          <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            <span className="font-semibold">Tiến độ: </span>
                            {task.tien_do}
                          </div>
                        )}

                        {type === "sapDenHan" && remaining !== null && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            {remaining === 0
                              ? "Đến hạn hoàn thành hôm nay"
                              : `Còn ${remaining} ngày đến hạn`}
                          </p>
                        )}

                        {type === "daQuaHan" && remaining !== null && (
                          <p className="mt-2 text-xs font-semibold text-red-700">
                            Đã quá hạn {Math.abs(remaining)} ngày
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">
            Hiển thị {so(sortedTasks.length)} / {so(tasks.length)} nhiệm vụ
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#167548] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#105C39]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  const [tasks, setTasks] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nam, setNam] = useState("2026");
  const [kieuLoc, setKieuLoc] = useState("nam");
  const [ky, setKy] = useState("1");
  const [lastUpdated, setLastUpdated] = useState("");
  const [alertType, setAlertType] = useState<AlertType | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("ngay_giao", { ascending: false });

    if (error) {
      setError("Không thể tải dữ liệu. Vui lòng thử cập nhật lại.");
      setTasks([]);
    } else {
      setTasks((data || []) as NhiemVu[]);
      setLastUpdated(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const years = useMemo(() => {
    const result = new Set<number>([2026, currentYear]);

    tasks.forEach((task) => {
      if (task.nam) result.add(Number(task.nam));
    });

    return [...result].sort((a, b) => b - a);
  }, [tasks, currentYear]);

  // Dữ liệu theo bộ lọc năm, quý, tháng
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (Number(task.nam) !== Number(nam)) return false;

      if (kieuLoc === "thang" && Number(task.thang) !== Number(ky)) {
        return false;
      }

      if (kieuLoc === "quy") {
        const q =
          Number(task.quy) ||
          (task.thang ? Math.ceil(Number(task.thang) / 3) : 0);

        if (q !== Number(ky)) return false;
      }

      return true;
    });
  }, [tasks, nam, kieuLoc, ky]);

  // Tổng quan kết quả
  const tongQuan = useMemo(() => {
    const result = {
      tong: filteredTasks.length,
      dungHan: 0,
      quaHan: 0,
      chuaHT: 0,
    };

    filteredTasks.forEach((task) => {
      const status = trangThai(task);

      if (status === "dungHan") result.dungHan++;
      else if (status === "quaHan") result.quaHan++;
      else result.chuaHT++;
    });

    return result;
  }, [filteredTasks]);

  // Cảnh báo nhiệm vụ sắp đến hạn trong 03 ngày
  const sapDenHanTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      if (trangThai(task) !== "chuaHT") return false;

      const remaining = soNgayConLai(task.han_hoan_thanh);

      return remaining !== null && remaining >= 0 && remaining <= 3;
    });
  }, [filteredTasks]);

  // Cảnh báo nhiệm vụ đã quá hạn nhưng chưa hoàn thành
  const daQuaHanTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      if (trangThai(task) !== "chuaHT") return false;

      const remaining = soNgayConLai(task.han_hoan_thanh);

      return remaining !== null && remaining < 0;
    });
  }, [filteredTasks]);

  // Danh sách theo từng loại cảnh báo
  const alertTasks = useMemo(() => {
    if (!alertType) return [];

    switch (alertType) {
      case "hoanThanhQuaHan":
        return filteredTasks.filter(
          (task) => trangThai(task) === "quaHan"
        );

      case "chuaHoanThanh":
        return filteredTasks.filter(
          (task) => trangThai(task) === "chuaHT"
        );

      case "sapDenHan":
        return sapDenHanTasks;

      case "daQuaHan":
        return daQuaHanTasks;

      default:
        return [];
    }
  }, [alertType, filteredTasks, sapDenHanTasks, daQuaHanTasks]);

  const daHoanThanh = tongQuan.dungHan + tongQuan.quaHan;
  const tiLeHoanThanh = tyLe(daHoanThanh, tongQuan.tong);

  const tenKy =
    kieuLoc === "nam"
      ? `Năm ${nam}`
      : kieuLoc === "quy"
        ? `Quý ${ky} năm ${nam}`
        : `Tháng ${ky} năm ${nam}`;

  return (
    <main className="min-h-screen bg-[#F5F8F5] text-gray-800">
      {/* THANH ĐIỀU HƯỚNG */}
      <header className="sticky top-0 z-30 border-b border-emerald-900 bg-emerald-800 text-white shadow-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-7">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-doan.png"
              alt="Logo Đoàn"
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            />

            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold text-white sm:text-base">
                TỈNH ĐOÀN LÂM ĐỒNG
              </div>

              <div className="text-xs text-emerald-100">
                Theo dõi tiến độ công việc
              </div>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/"
              title="Trang chủ"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white sm:px-3 sm:text-sm"
            >
              <Home size={17} strokeWidth={2} />
              <span className="hidden lg:inline">Trang chủ</span>
            </Link>

            <Link
              href="/tien-do"
              title="Tiến độ công việc"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white sm:px-3 sm:text-sm"
            >
              <ClipboardList size={17} strokeWidth={2} />
              <span className="hidden lg:inline">Tiến độ công việc</span>
            </Link>

            <Link
              href="/thong-ke"
              title="Thống kê và đánh giá"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white sm:px-3 sm:text-sm"
            >
              <ChartNoAxesCombined size={17} strokeWidth={2} />
              <span className="hidden lg:inline">
                Thống kê và đánh giá
              </span>
            </Link>

            <a
              href="https://hopkhonggiaytd.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="Phòng họp không giấy"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white sm:px-3 sm:text-sm"
            >
              <Monitor size={17} strokeWidth={2} />
              <span className="hidden lg:inline">
                Phòng họp không giấy
              </span>
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 sm:pt-7">
        {/* KHỐI GIỚI THIỆU */}
        <section className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#105C39] via-[#167548] to-[#238B55] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-28 right-44 h-64 w-64 rounded-full border-[25px] border-white/[0.05]" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-green-50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A9E6B8]" />
              THÔNG TIN CÔNG TÁC
            </div>

            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              Kết quả thực hiện nhiệm vụ
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-green-50/90 sm:text-[15px]">
              Theo dõi tiến độ, tổng hợp kết quả và đánh giá việc thực hiện
              nhiệm vụ của cán bộ, công chức cơ quan Tỉnh đoàn Lâm Đồng.
            </p>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs text-white">
              <CalendarDays size={15} />
              Dữ liệu {nam}
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs text-white">
              <ClipboardList size={15} />
              {so(tasks.length)} nhiệm vụ trong hệ thống
            </div>
          </div>
        </section>

        {/* BỘ LỌC */}
        <section className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-[#E5ECE6] bg-white px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-gray-800">
              Tổng quan kết quả
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              Dữ liệu theo {tenKy.toLowerCase()}
            </p>
          </div>

          <div
            className={`grid w-full gap-2 sm:ml-auto sm:w-auto ${
              kieuLoc === "nam"
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            <div className="flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
              <CalendarDays size={15} className="shrink-0 text-[#167548]" />

              <select
                value={nam}
                onChange={(e) => setNam(e.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={kieuLoc}
              onChange={(e) => {
                setKieuLoc(e.target.value);
                setKy("1");
              }}
              className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#167548]"
            >
              <option value="nam">Cả năm</option>
              <option value="quy">Theo quý</option>
              <option value="thang">Theo tháng</option>
            </select>

            {kieuLoc !== "nam" && (
              <select
                value={ky}
                onChange={(e) => setKy(e.target.value)}
                className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#167548]"
              >
                {kieuLoc === "quy"
                  ? [1, 2, 3, 4].map((q) => (
                      <option key={q} value={q}>
                        Quý {q}
                      </option>
                    ))
                  : Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
              </select>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg bg-[#167548] px-3 text-sm font-medium text-white transition hover:bg-[#105C39] disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Cập nhật
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CÁC CHỈ SỐ */}
        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">
              Các chỉ số chính
            </h2>

            <span className="text-xs text-gray-400">{tenKy}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Tổng nhiệm vụ"
              value={tongQuan.tong}
              sub="Nhiệm vụ"
              icon={ClipboardList}
              tone="gray"
            />

            <StatCard
              label="Hoàn thành đúng hạn"
              value={tongQuan.dungHan}
              sub="Nhiệm vụ"
              icon={CheckCircle2}
              tone="green"
            />

            <StatCard
              label="Hoàn thành quá hạn"
              value={tongQuan.quaHan}
              sub="Nhiệm vụ"
              icon={Clock3}
              tone="orange"
              onAlert={() => setAlertType("hoanThanhQuaHan")}
            />

            <StatCard
              label="Chưa hoàn thành"
              value={tongQuan.chuaHT}
              sub="Nhiệm vụ"
              icon={AlertCircle}
              tone="red"
              onAlert={() => setAlertType("chuaHoanThanh")}
            />
          </div>
        </section>

        {/* TIẾN ĐỘ TỔNG QUAN */}
        <section className="mb-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-2xl border border-[#E5ECE6] bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Tiến độ hoàn thành
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Tỷ lệ nhiệm vụ đã hoàn thành trong {tenKy.toLowerCase()}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF4ED] text-[#167548]">
                <TrendingUp size={19} />
              </div>
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-[#167548] sm:text-5xl">
                {tiLeHoanThanh}%
              </span>

              <span className="mb-1.5 text-xs text-gray-400">
                tỷ lệ hoàn thành
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EDF1ED]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#167548] to-[#43A66B] transition-all duration-500"
                style={{ width: `${tiLeHoanThanh}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F1F7F2] p-3">
                <p className="text-xs text-gray-500">Đã hoàn thành</p>

                <p className="mt-1 text-xl font-bold text-[#167548]">
                  {so(daHoanThanh)}
                </p>
              </div>

              <div className="rounded-xl bg-[#FFF2F0] p-3">
                <p className="text-xs text-gray-500">Chưa hoàn thành</p>

                <p className="mt-1 text-xl font-bold text-[#C2413A]">
                  {so(tongQuan.chuaHT)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5ECE6] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-gray-800">
              Cơ cấu kết quả
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Phân loại theo tình trạng thực hiện nhiệm vụ
            </p>

            <div className="mt-5 space-y-4">
              {[
                {
                  label: "Hoàn thành đúng hạn",
                  value: tongQuan.dungHan,
                  color: "bg-[#16834A]",
                  text: "text-[#167548]",
                },
                {
                  label: "Hoàn thành quá hạn",
                  value: tongQuan.quaHan,
                  color: "bg-[#E5A13A]",
                  text: "text-[#B7791F]",
                },
                {
                  label: "Chưa hoàn thành",
                  value: tongQuan.chuaHT,
                  color: "bg-[#D85B54]",
                  text: "text-[#C2413A]",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600">
                      {item.label}
                    </span>

                    <span className={`text-sm font-bold ${item.text}`}>
                      {so(item.value)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${
                          tongQuan.tong
                            ? (item.value / tongQuan.tong) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-400">
              Tổng số: {so(tongQuan.tong)} nhiệm vụ
            </div>
          </div>
        </section>

        {/* CẢNH BÁO TIẾN ĐỘ */}
        <section className="mb-5 rounded-2xl border border-[#E5ECE6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <BellRing size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Cảnh báo tiến độ nhiệm vụ
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Tự động rà soát thời hạn để kịp thời nhắc việc, hạn chế nhiệm
                vụ chậm tiến độ hoặc không hoàn thành.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <WarningCard
              title="Nhiệm vụ sắp đến hạn"
              description="Chưa hoàn thành và còn tối đa 03 ngày đến thời hạn được giao."
              count={sapDenHanTasks.length}
              icon={CalendarClock}
              type="orange"
              onClick={() => setAlertType("sapDenHan")}
            />

            <WarningCard
              title="Nhiệm vụ đã quá hạn"
              description="Đã hết thời hạn nhưng nhiệm vụ vẫn chưa được ghi nhận hoàn thành."
              count={daQuaHanTasks.length}
              icon={AlertTriangle}
              type="red"
              onClick={() => setAlertType("daQuaHan")}
            />
          </div>
        </section>

        {/* HỆ THỐNG VÀ TIỆN ÍCH */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-bold text-gray-800">
            Hệ thống và tiện ích
          </h2>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {/* THEO DÕI TIẾN ĐỘ */}
            <Link
              href="/tien-do"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E5ECE6] bg-white p-3 transition hover:border-[#A9CEB5] hover:shadow-sm sm:p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF4ED] text-[#167548]">
                <FileText size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-5 text-gray-800 group-hover:text-[#167548] sm:text-sm">
                  Theo dõi tiến độ công việc
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                  Tra cứu tình hình thực hiện nhiệm vụ
                </p>
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#167548]"
              />
            </Link>

            {/* THỐNG KÊ VÀ ĐÁNH GIÁ */}
            <Link
              href="/thong-ke"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E5ECE6] bg-white p-3 transition hover:border-[#A9CEB5] hover:shadow-sm sm:p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF4ED] text-[#167548]">
                <TrendingUp size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-5 text-gray-800 group-hover:text-[#167548] sm:text-sm">
                  Thống kê và đánh giá
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                  Xem số liệu và kết quả đánh giá
                </p>
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#167548]"
              />
            </Link>

            {/* PHÒNG HỌP KHÔNG GIẤY */}
            <a
              href="https://hopkhonggiaytd.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#DCE9F5] bg-white p-3 transition hover:border-[#8DB7DE] hover:shadow-sm sm:p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FC] text-[#2366A3]">
                <Monitor size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-5 text-gray-800 group-hover:text-[#2366A3] sm:text-sm">
                  Phòng họp không giấy
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                  Quản lý tài liệu và điều hành cuộc họp
                </p>
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#2366A3]"
              />
            </a>

            {/* TRUY CẬP QUẢN TRỊ HỆ THỐNG */}
            <Link
              href="/login"
              className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E5ECE6] bg-white p-3 transition hover:border-[#A9CEB5] hover:shadow-sm sm:p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF4ED] text-[#167548] transition group-hover:bg-[#167548] group-hover:text-white">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold leading-5 text-gray-800 group-hover:text-[#167548] sm:text-sm">
                  Truy cập quản trị hệ thống
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                  Dành cho cán bộ quản trị và người được phân quyền
                </p>
              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#167548]"
              />
            </Link>
          </div>
        </section>

        {/* CHÂN TRANG */}
        <footer className="border-t border-[#E1E9E2] pt-5 text-center">
          <p className="text-xs font-bold tracking-wider text-[#167548]">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Hệ thống theo dõi kết quả thực hiện nhiệm vụ
          </p>

          {lastUpdated && (
            <p className="mt-1.5 text-[11px] text-gray-400">
              Cập nhật dữ liệu gần nhất: {lastUpdated}
            </p>
          )}
        </footer>
      </div>

      {/* HỘP DANH SÁCH CẢNH BÁO */}
      {alertType && (
        <AlertModal
          type={alertType}
          tasks={alertTasks}
          allTasks={filteredTasks}
          onClose={() => setAlertType(null)}
        />
      )}

      {/* TRẠNG THÁI ĐANG TẢI */}
      {loading && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-600 shadow-lg">
          <RefreshCw size={14} className="animate-spin text-[#167548]" />
          Đang tải dữ liệu...
        </div>
      )}
    </main>
  );
}
