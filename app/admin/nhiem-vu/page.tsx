
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Activity,
  Users,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Download,
  Upload,
  Save,
  Pencil,
  X,
  RefreshCw,
  CalendarDays,
  UserRound,
  FileText,
  Filter,
  LogOut,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu,
  Settings,
  FolderTree,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

/* =========================
   KIỂU DỮ LIỆU
========================= */

type Task = {
  id?: string;
  linh_vuc_lon?: string;
  linh_vuc_con?: string;
  ten: string;
  san_pham?: string;
  ngay_giao?: string | null;
  han_hoan_thanh?: string | null;
  ngay_hoan_thanh?: string | null;
  tien_do?: string;
  can_bo_tham_muu?: string;
  can_bo_phu_trach?: string;
  can_bo?: string;
  thang?: number;
  nam?: number;
  quy?: number;
  loai_nhiem_vu?: string;
  ngay_ghi_nhan?: string | null;
  ghi_chu?: string;
};

type FieldItem = {
  id: string;
  ma: string;
  ten: string;
  danh_muc_cha_id: string | null;
  thu_tu: number;
  trang_thai: boolean;
};

type ProfileItem = {
  id: string;
  email?: string;
  ho_ten?: string;
  role?: string;
  nhom_quyen?: string;
  trang_thai?: string | boolean | null;
};

type FieldGroup = {
  id: string;
  ma: string;
  ten: string;
  children: FieldItem[];
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-slate-600";

/* =========================
   ĐIỀU HƯỚNG ADMIN
   Đồng bộ trang /admin
========================= */

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

/* =========================
   HÀM XỬ LÝ DỮ LIỆU
========================= */

function getQuarter(month: number) {
  return Math.ceil(month / 3);
}

function getStatus(task: Task) {
  if (task.ngay_hoan_thanh) {
    return task.han_hoan_thanh &&
      task.ngay_hoan_thanh > task.han_hoan_thanh
      ? "Hoàn thành quá hạn"
      : "Hoàn thành đúng hạn";
  }

  return task.tien_do || "Chưa hoàn thành";
}

function formatDate(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);

    if (!date) return null;

    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(
      date.d
    ).padStart(2, "0")}`;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split("/");

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  }

  return text;
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "Chưa xác định";

  const parts = value.split("-");

  return parts.length === 3
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : value;
}

function emptyTask(month: number, year: number): Task {
  const today = new Date().toISOString().slice(0, 10);

  return {
    ten: "",
    linh_vuc_lon: "",
    linh_vuc_con: "",
    loai_nhiem_vu: "phat_sinh",
    san_pham: "",
    ngay_giao: today,
    han_hoan_thanh: null,
    ngay_hoan_thanh: null,
    tien_do: "Chưa hoàn thành",
    can_bo_tham_muu: "",
    can_bo_phu_trach: "",
    thang: month,
    nam: year,
    quy: getQuarter(month),
    ngay_ghi_nhan: today,
    ghi_chu: "",
  };
}

function normalizeText(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("vi");
}

function normalizePersonName(
  value: unknown,
  people: ProfileItem[]
) {
  const name = String(value || "").trim();

  if (!name) return "";

  const matched = people.find(
    (person) =>
      normalizeText(person.ho_ten) === normalizeText(name)
  );

  return matched?.ho_ten || name;
}

function isActiveProfile(profile: ProfileItem) {
  return (
    profile.trang_thai !== false &&
    profile.trang_thai !== "tam_khoa" &&
    profile.trang_thai !== "ngung_hoat_dong"
  );
}

/* =========================
   GỌI API
========================= */

async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    throw new Error(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    );
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error ||
        result.message ||
        "Có lỗi khi xử lý dữ liệu."
    );
  }

  return result;
}

/* =========================
   TRANG QUẢN LÝ NHIỆM VỤ
========================= */

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [people, setPeople] = useState<ProfileItem[]>([]);

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(
    getQuarter(currentMonth)
  );

  const [areaFilter, setAreaFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(
    null
  );

  const [draftTask, setDraftTask] = useState<Task | null>(null);

  /* =========================
     DANH MỤC LĨNH VỰC ĐỘNG
  ========================= */

  const activeFields = useMemo(
    () => fields.filter((field) => field.trang_thai !== false),
    [fields]
  );

  const fieldGroups = useMemo<FieldGroup[]>(() => {
    const roots = activeFields
      .filter((field) => !field.danh_muc_cha_id)
      .sort((a, b) => a.thu_tu - b.thu_tu);

    return roots.map((root) => ({
      id: root.id,
      ma: root.ma,
      ten: root.ten,
      children: activeFields
        .filter(
          (field) => field.danh_muc_cha_id === root.id
        )
        .sort((a, b) => a.thu_tu - b.thu_tu),
    }));
  }, [activeFields]);

  const selectedGroupChildren = useMemo(() => {
    if (!draftTask?.linh_vuc_lon) return [];

    const group = fieldGroups.find(
      (item) => item.ten === draftTask.linh_vuc_lon
    );

    return group?.children || [];
  }, [fieldGroups, draftTask?.linh_vuc_lon]);

  const rootFieldNames = useMemo(
    () => fieldGroups.map((group) => group.ten),
    [fieldGroups]
  );

  /* =========================
     DANH SÁCH CÁN BỘ ĐỘNG
  ========================= */

  const activePeople = useMemo(() => {
    return people
      .filter(isActiveProfile)
      .filter((person) => person.ho_ten?.trim())
      .sort((a, b) =>
        String(a.ho_ten).localeCompare(
          String(b.ho_ten),
          "vi"
        )
      );
  }, [people]);
  const thuongTrucPeople = useMemo(() => {
    return activePeople.filter(
      (person) =>
        String(person.nhom_quyen || "").trim().toLowerCase() ===
        "thuong_truc"
    );
  }, [activePeople]);
  /* =========================
     ĐĂNG NHẬP VÀ TẢI DỮ LIỆU
  ========================= */

  useEffect(() => {
    if (localStorage.getItem("role") !== "admin") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    void loadTasks();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  useEffect(() => {
    void loadCatalog();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCatalog() {
    setLoadingCatalog(true);

    try {
      const result = await apiRequest("/api/admin/users", {
        method: "GET",
      });

      setFields(
        Array.isArray(result.fields)
          ? result.fields.map((field: FieldItem) => ({
              ...field,
              trang_thai: field.trang_thai !== false,
            }))
          : []
      );

      setPeople(
        Array.isArray(result.users) ? result.users : []
      );
    } catch (error) {
      console.error(error);

      alert(
        "Không tải được danh mục lĩnh vực và cán bộ: " +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadTasks() {
    setLoading(true);

    try {
      const result = await apiRequest(
        `/api/admin/nhiem-vu?month=${month}&year=${year}`,
        { method: "GET" }
      );

      setTasks((result.data || []) as Task[]);
    } catch (error) {
      alert(
        "Không tải được nhiệm vụ: " +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     THÊM, SỬA NHIỆM VỤ
  ========================= */

  function openAddModal() {
    setEditingIndex(null);
    setDraftTask(emptyTask(month, year));
    setShowModal(true);
  }

  function openEditModal(originalIndex: number) {
    const task = tasks[originalIndex];

    if (!task) return;

    setEditingIndex(originalIndex);
    setDraftTask({ ...task });
    setShowModal(true);
  }

  function updateDraft(
    field: keyof Task,
    value: string | number | null
  ) {
    setDraftTask((previous) => {
      if (!previous) return previous;

      const updated: Task = {
        ...previous,
        [field]: value,
      };

      if (field === "linh_vuc_lon") {
        updated.linh_vuc_con = "";
      }

      if (
        field === "ngay_hoan_thanh" ||
        field === "han_hoan_thanh"
      ) {
        updated.tien_do = getStatus(updated);
      }

      return updated;
    });
  }

  function saveModal() {
    if (!draftTask || !draftTask.ten.trim()) {
      alert("Vui lòng nhập tên nhiệm vụ.");
      return;
    }

    if (
      !draftTask.linh_vuc_lon ||
      !draftTask.linh_vuc_con
    ) {
      alert("Vui lòng chọn lĩnh vực lớn và lĩnh vực con.");
      return;
    }

    if (!draftTask.can_bo_tham_muu?.trim()) {
      alert("Vui lòng chọn cán bộ tham mưu.");
      return;
    }

    if (editingIndex !== null) {
      setTasks((previous) =>
        previous.map((task, index) =>
          index === editingIndex ? draftTask : task
        )
      );
    } else {
      setTasks((previous) => [...previous, draftTask]);
    }

    setShowModal(false);
    setDraftTask(null);
    setEditingIndex(null);
  }

  function removeDraft(originalIndex: number) {
    if (tasks[originalIndex]?.id) {
      alert("Không thể bỏ nhiệm vụ đã lưu tại thao tác này.");
      return;
    }

    if (!confirm("Bạn muốn bỏ nhiệm vụ mới này?")) return;

    setTasks((previous) =>
      previous.filter((_, index) => index !== originalIndex)
    );
  }

  /* =========================
     NHẬP EXCEL
  ========================= */

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, {
          type: "array",
        });

        const sheet =
          workbook.Sheets[workbook.SheetNames[0]];

        if (!sheet) {
          alert("Tệp Excel không có trang tính dữ liệu.");
          return;
        }

        const rows =
          XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet
          );

        const imported: Task[] = rows.map((row) => ({
          linh_vuc_lon: String(
            row["Lĩnh vực lớn"] || ""
          ).trim(),

          linh_vuc_con: String(
            row["Lĩnh vực con"] || ""
          ).trim(),

          ten: String(row["Công việc"] || "").trim(),

          san_pham: String(
            row["Sản phẩm"] || ""
          ).trim(),

          ngay_giao: formatDate(row["Ngày giao"]),

          han_hoan_thanh: formatDate(
            row["Hạn hoàn thành"]
          ),

          ngay_hoan_thanh: formatDate(
            row["Ngày hoàn thành"]
          ),

          can_bo_tham_muu: normalizePersonName(
            row["Cán bộ tham mưu"],
            activePeople
          ),

          can_bo_phu_trach: normalizePersonName(
            row["Cán bộ phụ trách"],
            activePeople
          ),

          thang: month,
          nam: year,
          quy: quarter,
          loai_nhiem_vu: "phat_sinh",
          ngay_ghi_nhan: new Date()
            .toISOString()
            .slice(0, 10),
          tien_do: "Chưa hoàn thành",
          ghi_chu: "",
        }));

        setTasks((previous) => [
          ...previous,
          ...imported,
        ]);

        setCurrentPage(1);

        alert(
          `Đã đọc ${imported.length} nhiệm vụ từ Excel. Kiểm tra dữ liệu rồi nhấn Lưu danh sách.`
        );
      } catch (error) {
        console.error(error);
        alert("Không đọc được tệp Excel.");
      }
    };

    reader.onerror = () => {
      alert("Không thể đọc tệp Excel.");
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  }

  /* =========================
     LƯU DANH SÁCH NHIỆM VỤ
  ========================= */

  async function saveAll() {
    const validTasks = tasks.filter((task) =>
      task.ten?.trim()
    );

    if (validTasks.length === 0) {
      alert("Chưa có nhiệm vụ để lưu.");
      return;
    }

    if (
      !confirm(
        `Xác nhận lưu ${validTasks.length} nhiệm vụ?`
      )
    ) {
      return;
    }

    setSaving(true);

    const payload = validTasks.map((task) => ({
      ...(task.id ? { id: task.id } : {}),

      linh_vuc_lon: task.linh_vuc_lon || "",
      linh_vuc_con: task.linh_vuc_con || "",

      ten: task.ten.trim(),

      san_pham: task.san_pham || "",

      ngay_giao: task.ngay_giao || null,
      han_hoan_thanh: task.han_hoan_thanh || null,
      ngay_hoan_thanh: task.ngay_hoan_thanh || null,

      tien_do: getStatus(task),

      can_bo_tham_muu: task.can_bo_tham_muu || "",
      can_bo_phu_trach: task.can_bo_phu_trach || "",

      thang: task.thang || month,
      nam: task.nam || year,
      quy: task.quy || quarter,

      loai_nhiem_vu:
        task.loai_nhiem_vu || "chua_phan_loai",

      ngay_ghi_nhan: task.ngay_ghi_nhan || null,
      ghi_chu: task.ghi_chu || "",
    }));

    try {
      const result = await apiRequest(
        "/api/admin/nhiem-vu",
        {
          method: "POST",
          body: JSON.stringify({
            action: "save-bulk",
            tasks: payload,
          }),
        }
      );

      alert(
        result.message ||
          `Đã lưu ${payload.length} nhiệm vụ.`
      );

      await loadTasks();
    } catch (error) {
      console.error(error);

      alert(
        "Lưu dữ liệu không thành công: " +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     ĐĂNG XUẤT
  ========================= */

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Không thể đăng xuất: " + error.message);
      setLoggingOut(false);
      return;
    }

    [
      "role",
      "name",
      "email",
      "linh_vuc_quan_ly",
    ].forEach((key) => localStorage.removeItem(key));

    router.replace("/login");
  }

  /* =========================
     LỌC VÀ PHÂN TRANG
  ========================= */

  const filteredTasks = useMemo(
    () =>
      tasks
        .map((task, originalIndex) => ({
          task,
          originalIndex,
        }))
        .filter(({ task }) => {
          const areaOK =
            areaFilter === "ALL" ||
            task.linh_vuc_lon === areaFilter;

          const typeOK =
            typeFilter === "ALL" ||
            task.loai_nhiem_vu === typeFilter;

          const keyword = search.trim().toLowerCase();

          const searchOK =
            !keyword ||
            [
              task.ten,
              task.linh_vuc_lon,
              task.linh_vuc_con,
              task.can_bo_tham_muu,
              task.can_bo_phu_trach,
              task.san_pham,
            ]
              .join(" ")
              .toLowerCase()
              .includes(keyword);

          return areaOK && typeOK && searchOK;
        }),
    [tasks, areaFilter, typeFilter, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    month,
    year,
    areaFilter,
    typeFilter,
    search,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / pageSize)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex = (safeCurrentPage - 1) * pageSize;

  const endIndex = Math.min(
    startIndex + pageSize,
    filteredTasks.length
  );

  const paginatedTasks = filteredTasks.slice(
    startIndex,
    endIndex
  );

  const total = tasks.length;

  const completed = tasks.filter((task) =>
    getStatus(task).startsWith("Hoàn thành")
  ).length;

  const incomplete = total - completed;

  const progressPercent =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  /* =========================
     XUẤT EXCEL
  ========================= */

  function exportExcel() {
    const data = filteredTasks.map(
      ({ task }, index) => ({
        STT: index + 1,
        "Lĩnh vực lớn": task.linh_vuc_lon || "",
        "Lĩnh vực con": task.linh_vuc_con || "",
        "Công việc": task.ten,
        "Sản phẩm": task.san_pham || "",
        "Ngày giao": task.ngay_giao || "",
        "Hạn hoàn thành": task.han_hoan_thanh || "",
        "Ngày hoàn thành": task.ngay_hoan_thanh || "",
        "Tiến độ": getStatus(task),
        "Cán bộ tham mưu":
          task.can_bo_tham_muu || "",
        "Cán bộ phụ trách":
          task.can_bo_phu_trach || "",
        "Loại nhiệm vụ":
          task.loai_nhiem_vu || "chua_phan_loai",
        Năm: task.nam || year,
        Quý: task.quy || "",
        Tháng: task.thang || "",
      })
    );

    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "Danh sách nhiệm vụ"
    );

    XLSX.writeFile(
      workbook,
      `Nhiem-vu-thang-${month}-${year}.xlsx`
    );
  }

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  /* =========================
     GIAO DIỆN
  ========================= */

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800">
      {mobileMenu && (
        <button
          aria-label="Đóng menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR - ĐỒNG BỘ TRANG ADMIN */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[74px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
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

            <p className="mt-3 text-sm font-bold">
              Trung tâm điều hành
            </p>

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

      {/* NỘI DUNG CHÍNH */}

      <div className="min-h-screen lg:pl-[260px]">
        {/* HEADER - ĐỒNG BỘ TRANG ADMIN */}

        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              aria-label="Mở menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold text-slate-400">
                HỆ THỐNG QUẢN TRỊ
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                Quản lý nhiệm vụ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              ADMINISTRATOR
            </span>

            <button
              onClick={loadTasks}
              disabled={loading}
              title="Làm mới dữ liệu"
              aria-label="Làm mới dữ liệu"
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
          {/* TIÊU ĐỀ TRANG VÀ CÁC NÚT CHỨC NĂNG */}

          <section className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <LayoutDashboard size={14} />
                <span>Quản trị</span>
                <ChevronRight size={13} />
                <span className="text-emerald-700">
                  Quản lý nhiệm vụ
                </span>
              </div>

              <h1 className="text-lg font-extrabold text-emerald-950">
                Quản lý nhiệm vụ
              </h1>

              <p className="text-xs text-slate-500">
                Thêm, cập nhật, phân công và theo dõi tiến độ thực hiện nhiệm vụ.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <Download className="h-4 w-4" />
                Xuất Excel
              </button>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50">
                <Upload className="h-4 w-4" />
                Nhập Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#167548] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Plus className="h-4 w-4" />
                Thêm nhiệm vụ
              </button>

              <button
                onClick={saveAll}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu danh sách"}
              </button>
            </div>
          </section>

          {/* THÔNG TIN DANH MỤC */}

          <section className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-600">
              {loadingCatalog ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Đang tải danh mục...
                </span>
              ) : (
                <>
                  Danh mục hiện có:{" "}
                  <strong className="text-emerald-700">
                    {fieldGroups.length} lĩnh vực lớn
                  </strong>
                  {" · "}
                  <strong className="text-emerald-700">
                    {activeFields.filter(
                      (field) => field.danh_muc_cha_id
                    ).length}{" "}
                    lĩnh vực con
                  </strong>
                  {" · "}
                  <strong className="text-emerald-700">
                    {activePeople.length} cán bộ
                  </strong>
                </>
              )}
            </div>

            <button
              onClick={loadCatalog}
              disabled={loadingCatalog}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loadingCatalog ? "animate-spin" : ""
                }`}
              />
              Tải danh mục mới
            </button>
          </section>

          {/* THỐNG KÊ */}

          <section className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-800">
                Tình hình nhiệm vụ
              </h2>
              <span className="text-[11px] text-slate-400">
                Số liệu theo tháng đang chọn
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Tổng nhiệm vụ tháng
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : total.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <ClipboardList size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Tổng số nhiệm vụ trong danh sách
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-blue-500" />
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Đã hoàn thành
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : completed.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <CheckCircle2 size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  {progressPercent}% tổng số nhiệm vụ
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-emerald-500" />
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Chưa hoàn thành
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : incomplete.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                    <Clock3 size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Nhiệm vụ chưa có kết quả hoàn thành
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-amber-500" />
              </div>
            </div>
          </section>

          {/* TIẾN ĐỘ */}

          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Tổng quan hoàn thành nhiệm vụ
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Tỷ lệ nhiệm vụ đã hoàn thành trên tổng dữ liệu hiện có
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Activity size={20} />
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-black tracking-tight text-[#145c3b]">
                  {loading ? "—" : `${progressPercent}%`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tỷ lệ hoàn thành
                </p>
              </div>

              <p className="text-right text-xs text-slate-500">
                <span className="font-bold text-emerald-700">
                  {completed}
                </span>{" "}
                hoàn thành / {total} nhiệm vụ
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Đã hoàn thành: {completed}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Chưa hoàn thành: {incomplete}
              </span>
            </div>
          </section>

          {/* BỘ LỌC */}

          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-800">
                Bộ lọc và tìm kiếm
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={labelClass}>Năm</label>
                <select
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                  className={inputClass}
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tháng</label>
                <select
                  value={month}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMonth(value);
                    setQuarter(getQuarter(value));
                  }}
                  className={inputClass}
                >
                  {Array.from(
                    { length: 12 },
                    (_, i) => i + 1
                  ).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Quý</label>
                <select
                  value={quarter}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setQuarter(value);
                    setMonth((value - 1) * 3 + 1);
                  }}
                  className={inputClass}
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      Quý {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Lĩnh vực</label>
                <select
                  value={areaFilter}
                  onChange={(e) =>
                    setAreaFilter(e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="ALL">Tất cả lĩnh vực</option>

                  {rootFieldNames.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Loại nhiệm vụ</label>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="ALL">Tất cả nhiệm vụ</option>
                  <option value="ke_hoach_quy">Kế hoạch quý</option>
                  <option value="phat_sinh">Nhiệm vụ phát sinh</option>
                  <option value="chua_phan_loai">Chưa phân loại</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tên nhiệm vụ, cán bộ, sản phẩm..."
                  className={`${inputClass} pl-9`}
                />
              </div>

              <button
                onClick={() => {
                  setAreaFilter("ALL");
                  setTypeFilter("ALL");
                  setSearch("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Xóa bộ lọc
              </button>

              <button
                onClick={loadTasks}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Tải lại
              </button>
            </div>
          </section>

          {/* DANH SÁCH NHIỆM VỤ */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Danh sách nhiệm vụ
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Tháng {month}/{year} · Hiển thị{" "}
                  {filteredTasks.length === 0
                    ? 0
                    : startIndex + 1}
                  –{endIndex} / {filteredTasks.length} nhiệm vụ
                  phù hợp
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Hiển thị
                </label>

                <select
                  value={pageSize}
                  onChange={(e) =>
                    setPageSize(Number(e.target.value))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                >
                  {[10, 20, 30, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} nhiệm vụ
                    </option>
                  ))}
                </select>

                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  Quý {quarter}
                </span>
              </div>
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
                  Thử thay đổi bộ lọc hoặc thêm nhiệm vụ mới.
                </p>
              </div>
            ) : (
              <>
                <div>
                  {paginatedTasks.map(
                    ({ task, originalIndex }, index) => {
                      const status = getStatus(task);

                      const isTaskCompleted =
                        status.startsWith("Hoàn thành");

                      const taskNumber =
                        startIndex + index + 1;

                      return (
                        <article
                          key={
                            task.id || `draft-${originalIndex}`
                          }
                          className="border-b border-slate-200 bg-white p-3 transition-colors duration-150 hover:bg-emerald-50 last:border-b-0 sm:p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-extrabold text-emerald-900">
                                {taskNumber}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                    {task.linh_vuc_con ||
                                      "Chưa phân lĩnh vực"}
                                  </span>

                                  <span className="text-[10px] text-slate-400">
                                    {task.loai_nhiem_vu ===
                                    "ke_hoach_quy"
                                      ? "Kế hoạch quý"
                                      : task.loai_nhiem_vu ===
                                          "phat_sinh"
                                        ? "Nhiệm vụ phát sinh"
                                        : "Chưa phân loại"}
                                  </span>
                                </div>

                                <h4 className="text-sm font-bold leading-relaxed text-slate-800">
                                  {task.ten ||
                                    "Nhiệm vụ chưa có tên"}
                                </h4>

                                <p className="mt-1 text-xs text-slate-500">
                                  {task.linh_vuc_lon || ""}
                                </p>

                                <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="flex items-start gap-2">
                                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                    <div>
                                      <p className="text-[10px] text-slate-400">
                                        Hạn hoàn thành
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700">
                                        {formatDisplayDate(
                                          task.han_hoan_thanh
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                    <div>
                                      <p className="text-[10px] text-slate-400">
                                        Cán bộ phụ trách
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700">
                                        {task.can_bo_phu_trach ||
                                          "Chưa phân công"}
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
                                        {task.can_bo_tham_muu ||
                                          "Chưa phân công"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                                    <div>
                                      <p className="text-[10px] text-slate-400">
                                        Sản phẩm
                                      </p>
                                      <p className="text-xs font-semibold text-slate-700">
                                        {task.san_pham ||
                                          "Chưa xác định"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                      isTaskCompleted
                                        ? status.includes("quá hạn")
                                          ? "bg-orange-50 text-orange-700"
                                          : "bg-green-50 text-green-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {isTaskCompleted ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Clock3 className="h-3 w-3" />
                                    )}
                                    {status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                onClick={() =>
                                  openEditModal(originalIndex)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                              </button>

                              {!task.id && (
                                <button
                                  onClick={() =>
                                    removeDraft(originalIndex)
                                  }
                                  title="Bỏ nhiệm vụ mới"
                                  className="rounded-lg border border-red-100 bg-white p-2 text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                {/* PHÂN TRANG */}

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Trang{" "}
                    <span className="font-bold text-emerald-700">
                      {safeCurrentPage}
                    </span>{" "}
                    / {totalPages} · Tổng{" "}
                    {filteredTasks.length} nhiệm vụ
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
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
                      disabled={
                        safeCurrentPage === totalPages
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {/* MODAL THÊM / SỬA NHIỆM VỤ */}

      {showModal && draftTask && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setDraftTask(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50 px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  {editingIndex === null
                    ? "Thêm nhiệm vụ mới"
                    : "Cập nhật nhiệm vụ"}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Nhập đầy đủ thông tin và kiểm tra trước khi lưu danh sách
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  setDraftTask(null);
                }}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    Tên nhiệm vụ *
                  </label>

                  <textarea
                    rows={3}
                    value={draftTask.ten}
                    onChange={(e) =>
                      updateDraft("ten", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Nhập nội dung nhiệm vụ..."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Lĩnh vực lớn *
                  </label>

                  <select
                    value={draftTask.linh_vuc_lon || ""}
                    onChange={(e) =>
                      updateDraft(
                        "linh_vuc_lon",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    disabled={loadingCatalog}
                  >
                    <option value="">
                      {loadingCatalog
                        ? "Đang tải lĩnh vực..."
                        : "Chọn lĩnh vực lớn"}
                    </option>

                    {fieldGroups.map((group) => (
                      <option
                        key={group.id}
                        value={group.ten}
                      >
                        {group.ten}
                      </option>
                    ))}

                    {draftTask.linh_vuc_lon &&
                      !fieldGroups.some(
                        (group) =>
                          group.ten === draftTask.linh_vuc_lon
                      ) && (
                        <option value={draftTask.linh_vuc_lon}>
                          {draftTask.linh_vuc_lon} (dữ liệu cũ)
                        </option>
                      )}
                  </select>

                  {fieldGroups.length === 0 &&
                    !loadingCatalog && (
                      <p className="mt-1 text-[10px] text-orange-700">
                        Chưa có lĩnh vực lớn. Vui lòng khai báo tại trang Quản lý lĩnh vực.
                      </p>
                    )}
                </div>

                <div>
                  <label className={labelClass}>
                    Lĩnh vực con *
                  </label>

                  <select
                    value={draftTask.linh_vuc_con || ""}
                    onChange={(e) =>
                      updateDraft(
                        "linh_vuc_con",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    disabled={!draftTask.linh_vuc_lon}
                  >
                    <option value="">Chọn lĩnh vực con</option>

                    {selectedGroupChildren.map((item) => (
                      <option
                        key={item.id}
                        value={item.ten}
                      >
                        {item.ten}
                      </option>
                    ))}

                    {draftTask.linh_vuc_con &&
                      !selectedGroupChildren.some(
                        (item) =>
                          item.ten === draftTask.linh_vuc_con
                      ) && (
                        <option value={draftTask.linh_vuc_con}>
                          {draftTask.linh_vuc_con} (dữ liệu cũ)
                        </option>
                      )}
                  </select>

                  {draftTask.linh_vuc_lon &&
                    selectedGroupChildren.length === 0 && (
                      <p className="mt-1 text-[10px] text-orange-700">
                        Lĩnh vực lớn này chưa có lĩnh vực con được khai báo.
                      </p>
                    )}
                </div>

                <div>
                  <label className={labelClass}>
                    Loại nhiệm vụ
                  </label>

                  <select
                    value={
                      draftTask.loai_nhiem_vu ||
                      "chua_phan_loai"
                    }
                    onChange={(e) =>
                      updateDraft(
                        "loai_nhiem_vu",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="ke_hoach_quy">
                      Kế hoạch quý
                    </option>
                    <option value="phat_sinh">
                      Nhiệm vụ phát sinh
                    </option>
                    <option value="chua_phan_loai">
                      Chưa phân loại
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Sản phẩm đầu ra
                  </label>

                  <input
                    value={draftTask.san_pham || ""}
                    onChange={(e) =>
                      updateDraft("san_pham", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Ví dụ: Kế hoạch, Báo cáo, Công văn..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Ngày giao</label>

                  <input
                    type="date"
                    value={draftTask.ngay_giao || ""}
                    onChange={(e) =>
                      updateDraft(
                        "ngay_giao",
                        e.target.value || null
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Hạn hoàn thành
                  </label>

                  <input
                    type="date"
                    value={draftTask.han_hoan_thanh || ""}
                    onChange={(e) =>
                      updateDraft(
                        "han_hoan_thanh",
                        e.target.value || null
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Ngày hoàn thành
                  </label>

                  <input
                    type="date"
                    value={draftTask.ngay_hoan_thanh || ""}
                    onChange={(e) =>
                      updateDraft(
                        "ngay_hoan_thanh",
                        e.target.value || null
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Cán bộ phụ trách
                  </label>

                  <select
                    value={draftTask.can_bo_phu_trach || ""}
                    onChange={(e) =>
                      updateDraft(
                        "can_bo_phu_trach",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    disabled={loadingCatalog}
                  >
                    <option value="">
                      Chọn cán bộ phụ trách
                    </option>

                    {thuongTrucPeople.map((person) => (
                      <option
                        key={person.id}
                        value={person.ho_ten}
                      >
                        {person.ho_ten}
                      </option>
                    ))}

                    {draftTask.can_bo_phu_trach &&
                      !thuongTrucPeople.some(
                        (person) =>
                          person.ho_ten ===
                          draftTask.can_bo_phu_trach
                      ) && (
                        <option value={draftTask.can_bo_phu_trach}>
                          {draftTask.can_bo_phu_trach} (dữ liệu cũ)
                        </option>
                      )}
                  </select>

                  <p className="mt-1 text-[10px] text-blue-700">
                    Chọn lãnh đạo hoặc cán bộ được giao phụ trách nhiệm vụ.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    Cán bộ tham mưu *
                  </label>

                  <select
                    value={draftTask.can_bo_tham_muu || ""}
                    onChange={(e) =>
                      updateDraft(
                        "can_bo_tham_muu",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    disabled={loadingCatalog}
                  >
                    <option value="">
                      Chọn cán bộ tham mưu
                    </option>

                    {activePeople.map((person) => (
                      <option
                        key={person.id}
                        value={person.ho_ten}
                      >
                        {person.ho_ten}
                      </option>
                    ))}

                    {draftTask.can_bo_tham_muu &&
                      !activePeople.some(
                        (person) =>
                          person.ho_ten ===
                          draftTask.can_bo_tham_muu
                      ) && (
                        <option value={draftTask.can_bo_tham_muu}>
                          {draftTask.can_bo_tham_muu} (dữ liệu cũ)
                        </option>
                      )}
                  </select>

                  <p className="mt-1 text-[10px] text-emerald-700">
                    Cán bộ trực tiếp tham mưu, xử lý công việc.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Tháng</label>

                  <select
                    value={draftTask.thang || month}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      setDraftTask((previous) =>
                        previous
                          ? {
                              ...previous,
                              thang: value,
                              quy: getQuarter(value),
                            }
                          : previous
                      );
                    }}
                    className={inputClass}
                  >
                    {Array.from(
                      { length: 12 },
                      (_, i) => i + 1
                    ).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Năm</label>

                  <select
                    value={draftTask.nam || year}
                    onChange={(e) =>
                      updateDraft(
                        "nam",
                        Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  >
                    {[
                      2025,
                      2026,
                      2027,
                      2028,
                      2029,
                      2030,
                    ].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Ghi chú</label>

                  <textarea
                    rows={2}
                    value={draftTask.ghi_chu || ""}
                    onChange={(e) =>
                      updateDraft("ghi_chu", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Thông tin bổ sung nếu có..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDraftTask(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Hủy
              </button>

              <button
                onClick={saveModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                <Save className="h-4 w-4" />
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
