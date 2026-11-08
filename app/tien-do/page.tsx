"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Download,
  RefreshCw,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Filter,
  ChevronDown,
  ChartNoAxesCombined,
  Monitor,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type NhiemVu = {
  id: string;
  nam: number | null;
  quy: number | null;
  thang: number | null;
  loai_nhiem_vu: string | null;
  linh_vuc_lon: string | null;
  linh_vuc_con: string | null;
  ten: string | null;
  ngay_giao: string | null;
  han_hoan_thanh: string | null;
  ngay_hoan_thanh: string | null;
  tien_do: string | null;
  can_bo_tham_muu: string | null;
  can_bo_phu_trach: string | null;
  can_bo: string | null;
  ghi_chu: string | null;
  san_pham: string | null;
};

type CheDo = "thang" | "quy";

const THANGS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUYS = [1, 2, 3, 4];

const formatDate = (date: string | null) => {
  if (!date) return "—";

  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("vi-VN");
};

const getStatusColor = (status: string | null) => {
  if (status === "Hoàn thành đúng hạn")
    return "bg-emerald-100 text-emerald-800";

  if (status === "Hoàn thành quá hạn")
    return "bg-amber-100 text-amber-800";

  if (status === "Chưa hoàn thành")
    return "bg-rose-100 text-rose-800";

  if (status === "Đang thực hiện")
    return "bg-sky-100 text-sky-800";

  return "bg-slate-100 text-slate-700";
};

const getQuarter = (month: number | null) => {
  if (!month || month < 1 || month > 12) return null;

  return Math.ceil(month / 3);
};

export default function TienDoPage() {
  const [tasks, setTasks] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [year, setYear] = useState("2026");

  // Ban đầu chưa chọn tháng hoặc quý
  const [mode, setMode] = useState<CheDo | null>(null);

  const [month, setMonth] = useState(11);
  const [quarter, setQuarter] = useState(4);

  const [field, setField] = useState("all");
  const [keyword, setKeyword] = useState("");

  // Phân trang danh sách nhiệm vụ
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // TẢI DỮ LIỆU
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("nhiem_vu")
        .select("*")
        .eq("nam", Number(year))
        .order("linh_vuc_lon", { ascending: true })
        .order("linh_vuc_con", { ascending: true })
        .order("ngay_giao", { ascending: true })
        .limit(5000);

      if (queryError) {
        setError(
          "Không tải được dữ liệu công việc: " + queryError.message
        );
        setTasks([]);
      } else {
        setTasks((data || []) as NhiemVu[]);
      }
    } catch (err) {
      setError(
        "Có lỗi khi tải dữ liệu: " +
          (err instanceof Error ? err.message : "Vui lòng thử lại.")
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const reload = () => loadTasks();

    window.addEventListener("nhiem_vu_updated", reload);

    return () => {
      window.removeEventListener("nhiem_vu_updated", reload);
    };
  }, [loadTasks]);

  // DANH SÁCH LĨNH VỰC
  const fields = useMemo(() => {
    return Array.from(
      new Set(
        tasks
          .map((task) => task.linh_vuc_lon?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }, [tasks]);

  // LỌC THEO THỜI GIAN
  const periodTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Chưa chọn tháng hoặc quý: hiển thị toàn bộ nhiệm vụ trong năm
      if (mode === null) return true;

      if (mode === "thang") {
        return Number(task.thang) === month;
      }

      const taskQuarter = task.quy || getQuarter(task.thang);

      return Number(taskQuarter) === quarter;
    });
  }, [tasks, mode, month, quarter]);

  // LỌC THEO LĨNH VỰC VÀ TỪ KHÓA
  const filteredTasks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");

    return periodTasks.filter((task) => {
      const matchField =
        field === "all" || task.linh_vuc_lon?.trim() === field;

      const searchContent = [
        task.ten,
        task.linh_vuc_lon,
        task.linh_vuc_con,
        task.can_bo,
        task.can_bo_tham_muu,
        task.can_bo_phu_trach,
        task.san_pham,
        task.ghi_chu,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");

      const matchKeyword =
        !normalizedKeyword ||
        searchContent.includes(normalizedKeyword);

      return matchField && matchKeyword;
    });
  }, [periodTasks, field, keyword]);

  // THỐNG KÊ
  const stats = useMemo(() => {
    const total = filteredTasks.length;

    const onTime = filteredTasks.filter(
      (task) => task.tien_do === "Hoàn thành đúng hạn"
    ).length;

    const late = filteredTasks.filter(
      (task) => task.tien_do === "Hoàn thành quá hạn"
    ).length;

    const incomplete = filteredTasks.filter(
      (task) => task.tien_do === "Chưa hoàn thành"
    ).length;

    const other = total - onTime - late - incomplete;
    const completed = onTime + late;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      onTime,
      late,
      incomplete,
      other,
      completed,
      rate,
    };
  }, [filteredTasks]);

  // PHÂN TRANG
  useEffect(() => {
    setCurrentPage(1);
  }, [year, mode, month, quarter, field, keyword, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  // DỮ LIỆU CỦA TRANG HIỆN TẠI
  const pageTasks = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return filteredTasks.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [filteredTasks, safeCurrentPage, pageSize]);

  // NHÓM NHIỆM VỤ THEO LĨNH VỰC
  const groupedTasks = useMemo(() => {
    const groups: Record<string, NhiemVu[]> = {};

    pageTasks.forEach((task) => {
      const groupName =
        task.linh_vuc_con?.trim() ||
        task.linh_vuc_lon?.trim() ||
        "Chưa phân loại";

      if (!groups[groupName]) groups[groupName] = [];

      groups[groupName].push(task);
    });

    return Object.entries(groups).sort((a, b) =>
      a[0].localeCompare(b[0], "vi")
    );
  }, [pageTasks]);

  // CÁC SỐ TRANG HIỂN THỊ
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;

    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    start = Math.max(1, end - maxVisible + 1);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [safeCurrentPage, totalPages]);

  // XUẤT EXCEL
  const exportExcel = () => {
    if (filteredTasks.length === 0) {
      alert("Không có dữ liệu để xuất Excel.");
      return;
    }

    const exportData = filteredTasks.map((task, index) => ({
      STT: index + 1,
      "Lĩnh vực lớn": task.linh_vuc_lon || "",
      "Lĩnh vực cụ thể": task.linh_vuc_con || "",
      "Tên nhiệm vụ": task.ten || "",
      "Ngày giao": formatDate(task.ngay_giao),
      "Hạn hoàn thành": formatDate(task.han_hoan_thanh),
      "Ngày hoàn thành": formatDate(task.ngay_hoan_thanh),
      "Cán bộ tham mưu": task.can_bo_tham_muu || "",
      "Thường trực phụ trách": task.can_bo_phu_trach || "",
      "Cán bộ thực hiện": task.can_bo || "",
      "Tiến độ": task.tien_do || "",
      "Sản phẩm": task.san_pham || "",
      "Ghi chú": task.ghi_chu || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 25 },
      { wch: 55 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 22 },
      { wch: 24 },
      { wch: 35 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tien do");

    const periodName =
      mode === "thang"
        ? `Thang_${month}`
        : mode === "quy"
          ? `Quy_${quarter}`
          : "Ca_nam";

    XLSX.writeFile(
      workbook,
      `Tien_do_cong_viec_${year}_${periodName}.xlsx`
    );
  };

  // XÓA BỘ LỌC
  const resetFilters = () => {
    setField("all");
    setKeyword("");
  };

  // TÊN KỲ THEO DÕI
  const tenKy =
    mode === "thang"
      ? `Tháng ${month}/${year}`
      : mode === "quy"
        ? `Quý ${quarter}/${year}`
        : `Năm ${year}`;

  // NÚT CHỌN THÁNG/QUÝ
  const periodButtonClass = (active: boolean) =>
    `flex h-10 items-center justify-center rounded-lg border px-3 text-xs font-bold transition sm:text-sm ${
      active
        ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
    }`;

  const statCardClass =
    "min-w-0 rounded-xl border p-2.5 shadow-sm sm:p-3";

  return (
    <main className="min-h-screen bg-[#f4f8f5] text-slate-700">
      {/* HEADER */}
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
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-2 text-xs font-semibold text-white transition sm:px-3 sm:text-sm"
            >
              <ClipboardList size={17} strokeWidth={2} />
              <span className="hidden lg:inline">
                Tiến độ công việc
              </span>
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

      <div className="mx-auto max-w-[1500px] space-y-4 px-3 py-4 sm:px-5 sm:py-5 lg:px-7">
        {/* TIÊU ĐỀ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-emerald-900 xs:text-sm">
              Tổng hợp tình hình thực hiện nhiệm vụ theo tháng và quý
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadTasks}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50 sm:text-sm"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Làm mới
            </button>

            <button
              onClick={exportExcel}
              disabled={loading || filteredTasks.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <Download size={14} />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* THỜI GIAN */}
        <section className="-mt-3 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CalendarDays size={17} className="text-emerald-700" />
              Thời gian theo dõi
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Năm
              </span>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-500"
              >
                {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CHỌN CHẾ ĐỘ THEO THÁNG / QUÝ */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:max-w-[360px]">
            <button
              onClick={() => setMode("thang")}
              className={periodButtonClass(mode === "thang")}
            >
              <CalendarDays size={14} className="mr-1.5" />
              Theo tháng
            </button>

            <button
              onClick={() => setMode("quy")}
              className={periodButtonClass(mode === "quy")}
            >
              <CalendarDays size={14} className="mr-1.5" />
              Theo quý
            </button>
          </div>

          {/* CHỈ HIỆN CÁC Ô THÁNG/QUÝ KHI NGƯỜI DÙNG CHỌN */}
          {mode !== null && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              {mode === "thang" ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                  {THANGS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonth(m)}
                      className={`flex h-10 flex-col items-center justify-center rounded-lg border transition ${
                        month === m
                          ? "border-emerald-500 !bg-emerald-500 !text-white shadow-sm"
                          : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      <span className="text-[10px] font-medium leading-3 opacity-75">
                        THÁNG
                      </span>

                      <span className="text-sm font-extrabold leading-4">
                        {m}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {QUYS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuarter(q)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-lg border transition ${
                        quarter === q
                          ? "border-emerald-500 !bg-emerald-500 !text-white shadow-sm"
                          : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      <span className="text-xs font-medium">QUÝ</span>

                      <span className="text-base font-extrabold">
                        {q}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* BỘ LỌC */}
        <section className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} className="text-emerald-700" />
              Bộ lọc công việc
            </div>

            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Xóa bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative min-w-0">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm kiếm tên công việc, cán bộ..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="relative min-w-0">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">Tất cả lĩnh vực</option>

                {fields.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-xs font-semibold text-slate-500">
              Chọn nhanh lĩnh vực
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setField("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  field === "all"
                    ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                    : "border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                Tất cả lĩnh vực
              </button>

              {fields.map((item) => (
                <button
                  key={item}
                  onClick={() => setField(item)}
                  title={item}
                  className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    field === item
                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {item}
                </button>
              ))}

              {fields.length === 0 && (
                <span className="text-xs text-slate-400">
                  Chưa có lĩnh vực trong dữ liệu năm này.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 5 Ô THỐNG KÊ - CÙNG MỘT HÀNG */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <div className={`${statCardClass} border-slate-200 bg-white`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
                Tổng nhiệm vụ
              </span>

              <ClipboardList
                size={16}
                className="shrink-0 text-slate-400"
              />
            </div>

            <div className="mt-1 text-xl font-extrabold tabular-nums text-slate-800 sm:text-2xl">
              {stats.total}
            </div>

            <div className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              Nhiệm vụ trong kỳ
            </div>
          </div>

          <div className={`${statCardClass} border-emerald-100 bg-emerald-50/70`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold leading-4 text-emerald-700 sm:text-xs">
                Hoàn thành đúng hạn
              </span>

              <CheckCircle2
                size={16}
                className="shrink-0 text-emerald-600"
              />
            </div>

            <div className="mt-1 text-xl font-extrabold tabular-nums text-emerald-700 sm:text-2xl">
              {stats.onTime}
            </div>

            <div className="mt-0.5 text-[10px] text-emerald-700/70 sm:text-xs">
              Đúng thời hạn
            </div>
          </div>

          <div className={`${statCardClass} border-amber-100 bg-amber-50/70`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold leading-4 text-amber-700 sm:text-xs">
                Hoàn thành quá hạn
              </span>

              <Clock3
                size={16}
                className="shrink-0 text-amber-600"
              />
            </div>

            <div className="mt-1 text-xl font-extrabold tabular-nums text-amber-700 sm:text-2xl">
              {stats.late}
            </div>

            <div className="mt-0.5 text-[10px] text-amber-700/70 sm:text-xs">
              Đã hoàn thành trễ hạn
            </div>
          </div>

          <div className={`${statCardClass} border-rose-100 bg-rose-50/70`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold leading-4 text-rose-700 sm:text-xs">
                Chưa hoàn thành
              </span>

              <AlertCircle
                size={16}
                className="shrink-0 text-rose-600"
              />
            </div>

            <div className="mt-1 text-xl font-extrabold tabular-nums text-rose-700 sm:text-2xl">
              {stats.incomplete}
            </div>

            <div className="mt-0.5 text-[10px] text-rose-700/70 sm:text-xs">
              Theo trạng thái hiện tại
            </div>
          </div>

          <div
            className={`${statCardClass} col-span-2 border-teal-100 bg-teal-50/70 sm:col-span-1`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold leading-4 text-teal-700 sm:text-xs">
                Tỷ lệ hoàn thành
              </span>

              <CheckCircle2
                size={16}
                className="shrink-0 text-teal-600"
              />
            </div>

            <div className="mt-1 text-xl font-extrabold tabular-nums text-teal-700 sm:text-2xl">
              {stats.rate}%
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
          </div>
        </section>

        {/* DANH SÁCH CÔNG VIỆC */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:px-4">
            <div>
              <h2 className="font-bold text-slate-800">
                Danh sách nhiệm vụ
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {tenKy}
                {field !== "all" ? ` · ${field}` : ""}
              </p>
            </div>

            {/* CHỌN SỐ NHIỆM VỤ MỖI TRANG */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Hiển thị

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 font-semibold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>

                nhiệm vụ/trang
              </label>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                {filteredTasks.length} nhiệm vụ
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-slate-500">
              <RefreshCw size={17} className="animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="px-4 py-10 text-center text-sm text-rose-600">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <ClipboardList
                size={34}
                className="mx-auto mb-2 text-slate-300"
              />

              <p className="font-semibold text-slate-600">
                Không có nhiệm vụ phù hợp
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Hãy thay đổi thời gian hoặc bộ lọc để xem dữ liệu.
              </p>
            </div>
          ) : (
            <>
              {/* BẢNG MÁY TÍNH */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
                  <thead className="bg-emerald-50 text-xs font-bold text-emerald-900">
                    <tr>
                      <th className="w-12 px-3 py-3 text-center">
                        STT
                      </th>

                      <th className="min-w-[230px] px-3 py-3">
                        Nhiệm vụ
                      </th>

                    
                      <th className="min-w-[135px] px-3 py-3">
                        Cán bộ thực hiện
                      </th>

                      <th className="min-w-[150px] px-3 py-3">
                        Thường trực phụ trách
                      </th>

                      <th className="px-3 py-3">
                        Ngày giao
                      </th>

                      <th className="px-3 py-3">
                        Hạn hoàn thành
                      </th>

                      <th className="px-3 py-3">
                        Ngày hoàn thành
                      </th>

                      <th className="min-w-[150px] px-3 py-3">
                        Tiến độ
                      </th>
                    </tr>
                  </thead>

                  {groupedTasks.map(([groupName, groupTasks]) => (
                    <tbody key={groupName}>
                      <tr className="border-y border-emerald-100 bg-emerald-50/60">
                        <td
                          colSpan={8}
                          className="px-3 py-2 font-bold text-emerald-800"
                        >
                          {groupName}

                          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            {groupTasks.length}
                          </span>
                        </td>
                      </tr>

                      {groupTasks.map((task, index) => (
                        <tr
                          key={task.id}
                          className="border-b border-slate-100 transition hover:bg-emerald-50/40"
                        >
                          <td className="px-3 py-3 text-center text-slate-400">
                            {(safeCurrentPage - 1) * pageSize + index + 1}
                          </td>

                          <td className="px-3 py-3">
                          

                          <div className="w-full whitespace-normal break-words text-justify text-xs font-semibold leading-5 text-slate-700">
  {task.ten || "—"}
</div>



                            {task.san_pham && (
                              <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                                Sản phẩm: {task.san_pham}
                              </div>
                            )}
                          </td>

                    
                          {/* CÁN BỘ THỰC HIỆN */}
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {task.can_bo || task.can_bo_tham_muu || "—"}
                          </td>

                          {/* THƯỜNG TRỰC PHỤ TRÁCH */}
                          <td className="px-3 py-3 text-xs font-semibold text-emerald-800">
                            {task.can_bo_phu_trach || "—"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">
                            {formatDate(task.ngay_giao)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">
                            {formatDate(task.han_hoan_thanh)}
                          </td>

                          <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">
                            {formatDate(task.ngay_hoan_thanh)}
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                                task.tien_do
                              )}`}
                            >
                              {task.tien_do || "Chưa cập nhật"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>

              {/* THẺ ĐIỆN THOẠI VÀ TABLET */}
              <div className="space-y-3 p-3 lg:hidden">
                {groupedTasks.map(([groupName, groupTasks]) => (
                  <div key={groupName}>
                    <div className="mb-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                      <span className="text-sm font-bold text-emerald-800">
                        {groupName}
                      </span>

                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {groupTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {groupTasks.map((task, index) => (
                        <article
                          key={task.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                              {(safeCurrentPage - 1) * pageSize + index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold leading-5 text-slate-800">
                                {task.ten || "Chưa có tên nhiệm vụ"}
                              </h3>

                              <div className="mt-2">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                                    task.tien_do
                                  )}`}
                                >
                                  {task.tien_do || "Chưa cập nhật"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-3 text-xs">
                            {/* CÁN BỘ THỰC HIỆN */}
                            <div>
                              <div className="text-slate-400">
                                Cán bộ thực hiện
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {task.can_bo ||
                                  task.can_bo_tham_muu ||
                                  "—"}
                              </div>
                            </div>

                            {/* THƯỜNG TRỰC PHỤ TRÁCH */}
                            <div>
                              <div className="text-slate-400">
                                Thường trực phụ trách
                              </div>

                              <div className="mt-0.5 font-semibold text-emerald-800">
                                {task.can_bo_phu_trach || "—"}
                              </div>
                            </div>

                            <div>
                              <div className="text-slate-400">
                                Ngày giao
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {formatDate(task.ngay_giao)}
                              </div>
                            </div>

                            <div>
                              <div className="text-slate-400">
                                Hạn hoàn thành
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {formatDate(task.han_hoan_thanh)}
                              </div>
                            </div>

                            <div>
                              <div className="text-slate-400">
                                Ngày hoàn thành
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {formatDate(task.ngay_hoan_thanh)}
                              </div>
                            </div>
                          </div>

                          {task.san_pham && (
                            <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
                              <span className="text-slate-400">
                                Sản phẩm:{" "}
                              </span>

                              <span className="text-slate-700">
                                {task.san_pham}
                              </span>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* PHÂN TRANG */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3 sm:px-4">
                <div className="text-xs text-slate-500">
                  Hiển thị{" "}
                  <span className="font-bold text-slate-700">
                    {(safeCurrentPage - 1) * pageSize + 1}
                  </span>

                  {" – "}

                  <span className="font-bold text-slate-700">
                    {Math.min(
                      safeCurrentPage * pageSize,
                      filteredTasks.length
                    )}
                  </span>

                  {" / "}

                  <span className="font-bold text-slate-700">
                    {filteredTasks.length}
                  </span>

                  {" nhiệm vụ"}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Đầu
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={safeCurrentPage === 1}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition ${
                        safeCurrentPage === page
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(totalPages, p + 1)
                      )
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cuối
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <div className="pb-4 text-center text-xs text-slate-400">
          Tỉnh đoàn Lâm Đồng · Theo dõi tiến độ thực hiện nhiệm vụ
        </div>
      </div>
    </main>
  );
}