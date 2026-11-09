
"use client";

import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Download,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Award,
  X,
  CalendarDays,
  ChartNoAxesCombined,
  Monitor,
} from "lucide-react";
import * as XLSX from "xlsx";

type RawItem = {
  id: string;
  nam: number | null;
  quy: number | null;
  thang: number | null;
  loai_nhiem_vu: string | null;
  can_bo: string | null;
  can_bo_tham_muu: string | null;
  can_bo_phu_trach: string | null;
  tien_do: string | null;
  ngay_giao: string | null;
  han_hoan_thanh: string | null;
  ngay_hoan_thanh: string | null;
};

type ThongKe = {
  can_bo_tham_muu: string;
  tong: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
  diem: number;
  xepLoai: string;
};

type CheDo = "quy" | "thang";
type NhomDanhGia = "thuc_hien" | "phu_trach";

const namThongKe = 2026;

const getQuarter = (month: number | null) => {
  if (!month || month < 1 || month > 12) return null;
  return Math.ceil(month / 3);
};

const getColor = (xepLoai: string) => {
  const value = xepLoai.trim().toUpperCase();

  if (value === "HTSXNV") return "bg-emerald-100 text-emerald-800";
  if (value === "HTTNV") return "bg-lime-100 text-lime-800";
  if (value === "HTNV") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
};

const tinhXepLoai = (
  tong: number,
  dungHan: number,
  quaHan: number,
  chuaHT: number
) => {
  const diem =
    tong > 0
      ? Math.round(((dungHan + quaHan * 0.5) / tong) * 100)
      : 0;

  let xepLoai = "Không HTNV";

  if (chuaHT === 0 && tong > 0) {
    if (diem >= 90) xepLoai = "HTSXNV";
    else if (diem >= 75) xepLoai = "HTTNV";
    else if (diem >= 50) xepLoai = "HTNV";
  }

  return { diem, xepLoai };
};

export default function ThongKePage() {
  const [mode, setMode] = useState<CheDo>("quy");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const [thang, setThang] = useState("11");
  const [quy, setQuy] = useState("4");

  const [nhomDanhGia, setNhomDanhGia] =
    useState<NhomDanhGia>("thuc_hien");

  const [rawData, setRawData] = useState<RawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCanBo, setSelectedCanBo] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("nhiem_vu")
      .select(
        "id, nam, quy, thang, loai_nhiem_vu, can_bo, can_bo_tham_muu, can_bo_phu_trach, tien_do, ngay_giao, han_hoan_thanh, ngay_hoan_thanh"
      )
      .eq("nam", namThongKe)
      .limit(5000);

    if (queryError) {
      setError("Không tải được dữ liệu: " + queryError.message);
      setRawData([]);
    } else {
      setRawData((data || []) as RawItem[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const reload = () => loadData();

    window.addEventListener("nhiem_vu_updated", reload);

    return () => {
      window.removeEventListener("nhiem_vu_updated", reload);
    };
  }, [loadData]);

  // Lọc nhiệm vụ theo kỳ thống kê.
  const periodData = useMemo(() => {
    return rawData.filter((item) => {
      if (mode === "thang") {
        return Number(item.thang) === Number(thang);
      }

      const taskQuarter = item.quy || getQuarter(item.thang);
      return Number(taskQuarter) === Number(quy);
    });
  }, [rawData, mode, thang, quy]);

  // Tổng hợp riêng theo từng nhóm đánh giá.
  const data = useMemo(() => {
    const map: Record<
      string,
      {
        can_bo_tham_muu: string;
        tong: number;
        dungHan: number;
        quaHan: number;
        chuaHT: number;
      }
    > = {};

    periodData.forEach((item) => {
      const ten =
        nhomDanhGia === "thuc_hien"
          ? item.can_bo?.trim() || item.can_bo_tham_muu?.trim()
          : item.can_bo_phu_trach?.trim();

      if (!ten) return;

      if (!map[ten]) {
        map[ten] = {
          can_bo_tham_muu: ten,
          tong: 0,
          dungHan: 0,
          quaHan: 0,
          chuaHT: 0,
        };
      }

      const cb = map[ten];
      cb.tong++;

      switch (item.tien_do) {
        case "Hoàn thành đúng hạn":
          cb.dungHan++;
          break;

        case "Hoàn thành quá hạn":
          cb.quaHan++;
          break;

        default:
          cb.chuaHT++;
          break;
      }
    });

    const result: ThongKe[] = Object.values(map).map((cb) => {
      const { diem, xepLoai } = tinhXepLoai(
        cb.tong,
        cb.dungHan,
        cb.quaHan,
        cb.chuaHT
      );

      return {
        ...cb,
        diem,
        xepLoai,
      };
    });

    result.sort(
      (a, b) =>
        b.diem - a.diem ||
        a.can_bo_tham_muu.localeCompare(
          b.can_bo_tham_muu,
          "vi"
        )
    );

    return result;
  }, [periodData, nhomDanhGia]);

  const allCanBo = useMemo(
    () => data.map((item) => item.can_bo_tham_muu),
    [data]
  );

  const suggestedNames = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    if (!keyword || selectedCanBo) return [];

    return allCanBo.filter((name) =>
      name.toLocaleLowerCase("vi").includes(keyword)
    );
  }, [search, allCanBo, selectedCanBo]);

  const filteredData = useMemo(() => {
    if (!selectedCanBo) return data;

    return data.filter(
      (item) => item.can_bo_tham_muu === selectedCanBo
    );
  }, [data, selectedCanBo]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        tong: acc.tong + item.tong,
        dungHan: acc.dungHan + item.dungHan,
        quaHan: acc.quaHan + item.quaHan,
        chuaHT: acc.chuaHT + item.chuaHT,
      }),
      {
        tong: 0,
        dungHan: 0,
        quaHan: 0,
        chuaHT: 0,
      }
    );
  }, [filteredData]);

  const handleDownload = () => {
    if (filteredData.length === 0) {
      alert("Không có dữ liệu để tải xuống.");
      return;
    }

    const tenNhom =
      nhomDanhGia === "thuc_hien"
        ? "Can-bo-thuc-hien"
        : "Thuong-truc-phu-trach";

    const exportData = filteredData.map((item, index) => ({
      STT: index + 1,
      [nhomDanhGia === "thuc_hien"
        ? "Cán bộ thực hiện"
        : "Thường trực phụ trách"]: item.can_bo_tham_muu,
      "Tổng nhiệm vụ": item.tong,
      "Hoàn thành đúng hạn": item.dungHan,
      "Hoàn thành quá hạn": item.quaHan,
      "Chưa hoàn thành": item.chuaHT,
      "Điểm": item.diem,
      "Xếp loại": item.xepLoai,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 7 },
      { wch: 30 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 10 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();

    const tenKy =
      mode === "quy" ? `Quy ${quy}` : `Thang ${thang}`;

    XLSX.utils.book_append_sheet(workbook, worksheet, tenKy);

    const tenFile = selectedCanBo
      ? `Thong-ke-${tenNhom}-${selectedCanBo}-${tenKy}-2026.xlsx`
      : `Thong-ke-${tenNhom}-${tenKy}-2026.xlsx`;

    XLSX.writeFile(workbook, tenFile);
  };

  const resetFilter = () => {
    setSearch("");
    setSelectedCanBo("");
  };

  const changeMode = (value: CheDo) => {
    setMode(value);
    setShowPeriodPicker(true);
    resetFilter();
  };

  const tenKy =
    mode === "quy"
      ? `Quý ${quy}`
      : `Tháng ${thang}`;

  const tenNhom =
    nhomDanhGia === "thuc_hien"
      ? "Cán bộ thực hiện"
      : "Thường trực phụ trách";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-700">
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

      {/* MAIN */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 md:p-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
          {/* TITLE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-emerald-900">
                Thống kê, đánh giá kết quả thực hiện nhiệm vụ cá nhân
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Kết quả quý là căn cứ đánh giá chính thức; kết quả tháng dùng để theo dõi, tham khảo.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="h-10 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Làm mới
              </button>

              <button
                onClick={handleDownload}
                disabled={loading || filteredData.length === 0}
                className="h-10 px-3 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} />
                Xuất Excel
              </button>
            </div>
          </div>

          {/* CHỌN NHÓM ĐÁNH GIÁ */}
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 md:p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} className="text-emerald-700" />
              <h3 className="font-bold text-emerald-900">
                Chọn nhóm đánh giá
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setNhomDanhGia("thuc_hien");
                  resetFilter();
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  nhomDanhGia === "thuc_hien"
                    ? "border-emerald-700 !bg-emerald-700 !text-white shadow-sm"
                    : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <ClipboardList size={17} />
                  Cán bộ thực hiện
                </span>
                <span
                  className={`block mt-1 text-xs font-normal ${
                    nhomDanhGia === "thuc_hien"
                      ? "text-emerald-100"
                      : "text-slate-400"
                  }`}
                >
                  Đánh giá kết quả tham mưu, triển khai
                </span>
              </button>

              <button
                onClick={() => {
                  setNhomDanhGia("phu_trach");
                  resetFilter();
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  nhomDanhGia === "phu_trach"
                    ? "border-emerald-700 !bg-emerald-700 !text-white shadow-sm"
                    : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Award size={17} />
                  Thường trực phụ trách
                </span>
                <span
                  className={`block mt-1 text-xs font-normal ${
                    nhomDanhGia === "phu_trach"
                      ? "text-emerald-100"
                      : "text-slate-400"
                  }`}
                >
                  Đánh giá trách nhiệm theo dõi, chỉ đạo
                </span>
              </button>
            </div>
          </div>

          {/* CHỌN KỲ */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 md:p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={18} className="text-emerald-700" />
              <h3 className="font-bold text-emerald-900">
                Chọn kỳ thống kê
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => changeMode("quy")}
                className={`px-5 py-2 rounded-lg border text-sm font-semibold transition ${
                  mode === "quy"
                    ? "border-emerald-700 !bg-emerald-700 !text-white shadow-sm"
                    : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                Thống kê theo quý
              </button>

              <button
                onClick={() => changeMode("thang")}
                className={`px-5 py-2 rounded-lg border text-sm font-semibold transition ${
                  mode === "thang"
                    ? "border-emerald-700 !bg-emerald-700 !text-white shadow-sm"
                    : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                Thống kê theo tháng
              </button>
            </div>

            {showPeriodPicker && mode === "quy" && (
              <div className="mt-4 border-t border-emerald-100 pt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Chọn quý đánh giá
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setQuy(String(value));
                        resetFilter();
                      }}
                      className={`h-10 rounded-lg border text-sm font-semibold transition ${
                        quy === String(value)
                          ? "border-emerald-700 !bg-emerald-700 !text-white shadow-sm"
                          : "border-slate-200 !bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      Quý {value}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-emerald-800 mt-2">
                  Kết quả được tổng hợp trên toàn bộ nhiệm vụ thuộc Quý {quy}, không lấy riêng tháng cuối quý.
                </p>
              </div>
            )}

            {showPeriodPicker && mode === "thang" && (
              <div className="mt-4 border-t border-emerald-100 pt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Chọn tháng tham khảo
                </label>

                <select
                  value={thang}
                  onChange={(e) => {
                    setThang(e.target.value);
                    resetFilter();
                  }}
                  className="w-full md:w-64 h-10 border border-slate-300 rounded-lg px-3 text-sm bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-slate-500 mt-2">
                  Số liệu tháng chỉ phục vụ theo dõi tiến độ, không thay thế kết quả đánh giá quý.
                </p>
              </div>
            )}
          </div>

          {/* FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tìm {nhomDanhGia === "thuc_hien" ? "cán bộ thực hiện" : "Thường trực phụ trách"}
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Nhập tên cá nhân..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedCanBo("");
                  }}
                  className="w-full h-11 border border-slate-300 rounded-lg pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {search && !selectedCanBo && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                    {suggestedNames.length > 0 ? (
                      suggestedNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedCanBo(name);
                            setSearch(name);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-50"
                        >
                          {name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-slate-500">
                        Không tìm thấy cá nhân phù hợp.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Kỳ đang thống kê
              </label>
              <div className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-emerald-800">
                {tenKy}/2026
              </div>
            </div>
          </div>

          {selectedCanBo && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-500">Đang lọc:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold">
                {selectedCanBo}
              </span>
              <button
                onClick={resetFilter}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1"
              >
                <X size={15} />
                Bỏ lọc
              </button>
            </div>
          )}

          {/* SUMMARY */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <ClipboardList size={16} />
                Tổng nhiệm vụ
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-2">
                {totals.tong}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                <CheckCircle2 size={16} />
                Hoàn thành đúng hạn
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-2">
                {totals.dungHan}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                <Clock3 size={16} />
                Hoàn thành quá hạn
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-2">
                {totals.quaHan}
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle size={16} />
                Chưa hoàn thành
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-2">
                {totals.chuaHT}
              </div>
            </div>
          </div>

          {/* TABLE TITLE */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-800">
                {nhomDanhGia === "thuc_hien"
                  ? "Kết quả đánh giá cán bộ thực hiện"
                  : "Kết quả đánh giá Thường trực phụ trách"}
                {" "}— {mode === "quy" ? "theo quý" : "theo tháng"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {tenKy}/2026 · {filteredData.length} cá nhân
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Điểm tối đa: 100
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <ClipboardList
                className="mx-auto text-slate-300 mb-2"
                size={32}
              />
              <p className="font-medium text-slate-600">
                Chưa có dữ liệu đánh giá
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {tenKy}/2026 chưa có nhiệm vụ được phân công cho nhóm {tenNhom.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE: KHÔNG CÓ KHUNG BAO TỪNG CÁN BỘ */}
              <div className="block md:hidden">
                {filteredData.map((cb, index) => (
                  <div
                    key={cb.can_bo_tham_muu}
                    className="py-3 border-b border-slate-200 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-400 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="font-bold text-sm text-slate-800 break-words">
                        {cb.can_bo_tham_muu}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Tổng nhiệm vụ
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-800">
                          {cb.tong}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Hoàn thành đúng hạn
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-800">
                          {cb.dungHan}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Hoàn thành quá hạn
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-800">
                          {cb.quaHan}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2">
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Điểm
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-800">
                          {cb.diem}/100
                        </div>
                      </div>

                      <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2 col-span-2">
                        <div className="text-[11px] text-slate-500 leading-tight">
                          Đánh giá
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-800">
                          {cb.xepLoai}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* TỔNG CỘNG TRÊN ĐIỆN THOẠI */}
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="font-bold text-sm text-slate-800 mb-2">
                    TỔNG CỘNG
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                      <div className="text-[11px] text-slate-500">
                        Tổng nhiệm vụ
                      </div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {totals.tong}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                      <div className="text-[11px] text-slate-500">
                        Hoàn thành đúng hạn
                      </div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {totals.dungHan}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                      <div className="text-[11px] text-slate-500">
                        Hoàn thành quá hạn
                      </div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {totals.quaHan}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                      <div className="text-[11px] text-slate-500">
                        Chưa hoàn thành
                      </div>
                      <div className="text-base font-bold text-slate-800 mt-1">
                        {totals.chuaHT}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESKTOP: GIỮ NGUYÊN BẢNG 8 CỘT */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[850px] w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-900">
                      <th className="border-b border-slate-200 px-3 py-3 text-center w-12">
                        STT
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-left">
                        {nhomDanhGia === "thuc_hien"
                          ? "Cán bộ thực hiện"
                          : "Thường trực phụ trách"}
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Tổng NV
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Đúng hạn
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Quá hạn
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Chưa HT
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Điểm
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3 text-center">
                        Đánh giá
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.map((cb, index) => (
                      <tr
                        key={cb.can_bo_tham_muu}
                        className="hover:bg-emerald-50/50"
                      >
                        <td className="border-b border-slate-100 px-3 py-3 text-center text-slate-500">
                          {index + 1}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-800">
                          {cb.can_bo_tham_muu}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center font-semibold">
                          {cb.tong}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center font-semibold text-emerald-700">
                          {cb.dungHan}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center font-semibold text-amber-700">
                          {cb.quaHan}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center font-semibold text-rose-700">
                          {cb.chuaHT}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center font-bold text-emerald-800">
                          {cb.diem}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getColor(
                              cb.xepLoai
                            )}`}
                          >
                            {cb.xepLoai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td
                        colSpan={2}
                        className="border-t border-slate-200 px-3 py-3 text-right"
                      >
                        Tổng cộng
                      </td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center">
                        {totals.tong}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-emerald-700">
                        {totals.dungHan}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-amber-700">
                        {totals.quaHan}
                      </td>
                      <td className="border-t border-slate-200 px-3 py-3 text-center text-rose-700">
                        {totals.chuaHT}
                      </td>
                      <td
                        colSpan={2}
                        className="border-t border-slate-200 px-3 py-3 text-center"
                      >
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-2 text-xs text-slate-500">
            <Award size={15} className="text-emerald-600 shrink-0" />
            <span>
              Cách tính điểm hiện tại: hoàn thành đúng hạn = 1 điểm;
              hoàn thành quá hạn = 0,5 điểm; nhiệm vụ chưa hoàn thành = 0 điểm.
              Nếu còn nhiệm vụ chưa hoàn thành thì xếp loại Không HTNV.
              Đây là kết quả tổng hợp tiến độ nhiệm vụ, chưa thay thế việc
              đánh giá toàn diện theo tiêu chí riêng của từng nhóm.
            </span>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-emerald-100 text-center py-3 text-xs text-slate-500">
        © 2026 Tỉnh đoàn Lâm Đồng
      </footer>
    </div>
  );
}
