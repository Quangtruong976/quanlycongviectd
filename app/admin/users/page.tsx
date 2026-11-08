
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Activity,
  LogOut,
  Search,
  Menu,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserRound,
  Pencil,
  LockKeyhole,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  Lock,
  Unlock,
  FolderCog,
  FolderTree,
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type NhomQuyen =
  | "thuong_truc"
  | "truong_ban"
  | "pho_truong_ban"
  | "chuyen_vien";

type UserProfile = {
  id: string;
  email: string | null;
  ho_ten: string | null;
  role: string | null;
  linh_vuc_quan_ly: string | null;
  nhom_quyen: NhomQuyen | null;
  chuc_danh: "bi_thu" | "pho_bi_thu" | null;
  ban_phu_trach: string | null;
  nguoi_quan_ly_id: string | null;
  manager_ids?: string[];
  field_codes?: string[];
  trang_thai: "hoat_dong" | "tam_khoa";
};

type FieldItem = {
  id: string;
  ma: string;
  ten: string;
  danh_muc_cha_id: string | null;
  thu_tu: number;
  trang_thai: boolean;
};

type FormData = {
  ho_ten: string;
  email: string;
  password: string;
  linh_vuc_lon_mas: string[];
  nhom_quyen: NhomQuyen | "";
  chuc_danh: "bi_thu" | "pho_bi_thu" | "";
  nguoi_quan_ly_id: string;
  nguoi_quan_ly_ids: string[];
};

const emptyForm: FormData = {
  ho_ten: "",
  email: "",
  password: "",
  linh_vuc_lon_mas: [],
  nhom_quyen: "",
  chuc_danh: "",
  nguoi_quan_ly_id: "",
  nguoi_quan_ly_ids: [],
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

const groups: { value: NhomQuyen; label: string }[] = [
  { value: "thuong_truc", label: "Thường trực Tỉnh đoàn" },
  { value: "truong_ban", label: "Trưởng ban" },
  { value: "pho_truong_ban", label: "Phó Trưởng ban" },
  { value: "chuyen_vien", label: "Chuyên viên" },
];

function getGroupLabel(group: NhomQuyen | null | "") {
  return (
    groups.find((item) => item.value === group)?.label ||
    "Chưa phân nhóm quyền"
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }, []);

  const apiRequest = useCallback(
    async (
      method: "GET" | "POST" | "DELETE",
      body?: Record<string, unknown>
    ) => {
      const token = await getToken();

      if (!token) {
        router.replace("/login");
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể thực hiện thao tác.");
      }

      return result;
    },
    [getToken, router]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await apiRequest("GET");
      setUsers(result.users || []);
      setFields(result.fields || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được danh sách."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/login");
      return;
    }

    void loadUsers();
  }, [loadUsers, router]);

  // Phân công theo lĩnh vực lớn; toàn bộ lĩnh vực con trực thuộc được tự động bao gồm.
  const activeRootFields = useMemo(
    () =>
      fields
        .filter((field) => !field.danh_muc_cha_id && field.trang_thai)
        .sort((a, b) => a.thu_tu - b.thu_tu),
    [fields]
  );



  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        (user.ho_ten || "").toLocaleLowerCase("vi").includes(keyword) ||
        (user.email || "").toLowerCase().includes(keyword) ||
        (user.ban_phu_trach || "").toLocaleLowerCase("vi").includes(keyword) ||
        (user.field_codes || []).some((code) => getFieldLabel(code).toLocaleLowerCase("vi").includes(keyword));

      const assignedCodes = user.field_codes || [];
      const matchesField =
        filterField === "all" ||
        (filterField === "" && assignedCodes.length === 0) ||
        assignedCodes.includes(filterField);

      return matchesSearch && matchesField;
    });
  }, [users, fields, search, filterField]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const staffCount = users.filter((user) => user.role !== "admin").length;
  const lockedCount = users.filter(
    (user) => user.trang_thai === "tam_khoa"
  ).length;

  const isEditingAdmin =
    modalMode === "edit" && editingUser?.role === "admin";

  const selectedRootCode = form.linh_vuc_lon_mas[0] || "";

  const managerOptions = useMemo(() => {
    const group = form.nhom_quyen;
    const currentId = editingUser?.id;

    const activeUsers = users.filter(
      (user) =>
        user.id !== currentId &&
        user.role !== "admin" &&
        user.trang_thai !== "tam_khoa"
    );

    if (group === "thuong_truc") {
      // Chỉ Phó Bí thư được chọn Bí thư làm người quản lý trực tiếp.
      return form.chuc_danh === "pho_bi_thu"
        ? activeUsers.filter((user) => user.nhom_quyen === "thuong_truc" && user.chuc_danh === "bi_thu")
        : [];
    }

    if (group === "truong_ban") {
      return activeUsers.filter((user) => user.nhom_quyen === "thuong_truc");
    }

    if (group === "pho_truong_ban") {
      return activeUsers.filter((user) => {
        if (user.nhom_quyen === "thuong_truc") return true;
        return user.nhom_quyen === "truong_ban" &&
          (user.field_codes || []).includes(selectedRootCode);
      });
    }

    if (group === "chuyen_vien") {
      return activeUsers.filter((user) =>
        ["thuong_truc", "truong_ban", "pho_truong_ban"].includes(user.nhom_quyen || "") &&
        (user.nhom_quyen === "thuong_truc" ||
          (user.field_codes || []).includes(selectedRootCode))
      );
    }

    return [];
  }, [users, form.nhom_quyen, form.chuc_danh, selectedRootCode, editingUser?.id]);

  function openCreate() {
    setModalMode("create");
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setErrorMessage("");
    setShowModal(true);
  }

  function openEdit(user: UserProfile) {
    setModalMode("edit");
    setEditingUser(user);

    setForm({
      ho_ten: user.ho_ten || "",
      email: user.email || "",
      password: "",
      linh_vuc_lon_mas: user.field_codes?.length
        ? [...user.field_codes]
        : [],
      nhom_quyen: user.nhom_quyen || "",
      chuc_danh: user.chuc_danh || "",
      nguoi_quan_ly_id: "",
      nguoi_quan_ly_ids: user.manager_ids?.length
        ? [...user.manager_ids]
        : user.nguoi_quan_ly_id
          ? [user.nguoi_quan_ly_id]
          : [],
    });

    setErrorMessage("");
    setShowModal(true);
  }

  function handleGroupChange(value: NhomQuyen | "") {
    setForm((current) => ({
      ...current,
      nhom_quyen: value,
      chuc_danh: "",
      linh_vuc_lon_mas: [],
      nguoi_quan_ly_id: "",
      nguoi_quan_ly_ids: [],
    }));
  }

  function toggleRootCode(code: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      linh_vuc_lon_mas:
        current.nhom_quyen === "thuong_truc"
          ? checked
            ? Array.from(new Set([...current.linh_vuc_lon_mas, code]))
            : current.linh_vuc_lon_mas.filter((item) => item !== code)
          : checked
            ? [code]
            : [],
      nguoi_quan_ly_id: "",
      nguoi_quan_ly_ids: [],
    }));
  }

  function toggleManager(id: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      nguoi_quan_ly_ids: checked
        ? Array.from(new Set([...current.nguoi_quan_ly_ids, id]))
        : current.nguoi_quan_ly_ids.filter((item) => item !== id),
    }));
  }

  async function handleSave() {
    if (!form.ho_ten.trim() || !form.email.trim()) {
      setErrorMessage("Vui lòng nhập họ tên và email đăng nhập.");
      return;
    }

    if (modalMode === "create" && form.password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (!isEditingAdmin) {
      if (!form.nhom_quyen) {
        setErrorMessage("Vui lòng chọn nhóm quyền cho cán bộ.");
        return;
      }

      if (form.nhom_quyen === "thuong_truc" && form.linh_vuc_lon_mas.length === 0) {
        setErrorMessage("Vui lòng chọn ít nhất 01 lĩnh vực lớn cho Thường trực.");
        return;
      }

      if (form.nhom_quyen !== "thuong_truc" && form.linh_vuc_lon_mas.length !== 1) {
        setErrorMessage("Trưởng ban, Phó Trưởng ban và Chuyên viên chỉ được chọn 01 lĩnh vực lớn.");
        return;
      }

      if (form.nhom_quyen === "thuong_truc" && !form.chuc_danh) {
        setErrorMessage("Vui lòng xác định chức danh Bí thư hoặc Phó Bí thư.");
        return;
      }
      if (form.nhom_quyen === "thuong_truc" && form.chuc_danh === "bi_thu" && form.nguoi_quan_ly_ids.length > 0) {
        setErrorMessage("Bí thư không cần chọn người quản lý trực tiếp.");
        return;
      }
      if (form.nhom_quyen === "thuong_truc" && form.chuc_danh === "pho_bi_thu" && form.nguoi_quan_ly_ids.length !== 1) {
        setErrorMessage("Phó Bí thư phải chọn đúng 01 Bí thư quản lý trực tiếp.");
        return;
      }
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const managerIds = form.nguoi_quan_ly_ids;

      if (modalMode === "create") {
        await apiRequest("POST", {
          action: "create",
          ho_ten: form.ho_ten.trim(),
          email: form.email.trim(),
          password: form.password,
          linh_vuc_lon_mas: form.linh_vuc_lon_mas,
          nhom_quyen: form.nhom_quyen,
          chuc_danh: form.nhom_quyen === "thuong_truc" ? form.chuc_danh : null,
          nguoi_quan_ly_id: null,
          nguoi_quan_ly_ids: managerIds,
        });

        setMessage("Đã tạo tài khoản cán bộ thành công.");
      } else {
        await apiRequest("POST", {
          action: "update",
          id: editingUser?.id,
          ho_ten: form.ho_ten.trim(),
          email: form.email.trim(),
          linh_vuc_lon_mas: form.linh_vuc_lon_mas,
          ...(isEditingAdmin
            ? {}
            : {
                nhom_quyen: form.nhom_quyen,
                chuc_danh: form.nhom_quyen === "thuong_truc" ? form.chuc_danh : null,
                nguoi_quan_ly_id: null,
                nguoi_quan_ly_ids: managerIds,
              }),
        });

        setMessage("Đã cập nhật thông tin tài khoản.");
      }

      setShowModal(false);
      setForm(emptyForm);
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể lưu tài khoản."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetUser) return;

    if (newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      await apiRequest("POST", {
        action: "reset-password",
        id: resetUser.id,
        password: newPassword,
      });

      setMessage(
        `Đã đặt lại mật khẩu cho ${resetUser.ho_ten || resetUser.email}.`
      );

      setResetUser(null);
      setNewPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể đặt lại mật khẩu."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeStatus(user: UserProfile) {
    const isLocked = user.trang_thai === "tam_khoa";
    const nextStatus = isLocked ? "hoat_dong" : "tam_khoa";

    const confirmed = window.confirm(
      isLocked
        ? `Mở khóa tài khoản "${user.ho_ten || user.email}"?`
        : `Tạm khóa tài khoản "${user.ho_ten || user.email}"?\n\nTài khoản sẽ không được phép tiếp tục sử dụng hệ thống khi trạng thái khóa được áp dụng. Lịch sử nhiệm vụ vẫn được giữ nguyên.`
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      await apiRequest("POST", {
        action: "change-status",
        id: user.id,
        trang_thai: nextStatus,
      });

      setMessage(
        isLocked
          ? "Đã mở khóa tài khoản."
          : "Đã tạm khóa tài khoản. Dữ liệu và lịch sử nhiệm vụ vẫn được giữ nguyên."
      );

      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể thay đổi trạng thái."
      );
    } finally {
      setSaving(false);
    }
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

  async function handleRefresh() {
    setRefreshing(true);
    await loadUsers();
  }

  function getFieldLabel(value: string | null) {
    if (!value) return "Chưa phân lĩnh vực";

    return (
      fields.find((field) => field.ma === value)?.ten ||
      value ||
      "Chưa phân lĩnh vực"
    );
  }

  function getAssignedFieldLabels(user: UserProfile) {
    const rootCodes = user.field_codes || [];
    if (!rootCodes.length) return "Chưa phân lĩnh vực";

    const childNames = rootCodes.flatMap((code) => {
      const root = fields.find((field) => field.ma === code && !field.danh_muc_cha_id);
      if (!root) return [];
      const children = fields
        .filter((field) => field.danh_muc_cha_id === root.id && field.trang_thai)
        .sort((a, b) => a.thu_tu - b.thu_tu)
        .map((field) => field.ten);
      return children.length ? children : [root.ten];
    });

    return childNames.length ? childNames.join(", ") : "Chưa phân lĩnh vực";
  }

  function getParentFieldLabels(user: UserProfile) {
    const rootCodes = user.field_codes || [];
    if (!rootCodes.length) return "Chưa phân lĩnh vực";
    return rootCodes
      .map((code) => fields.find((field) => field.ma === code && !field.danh_muc_cha_id)?.ten || code)
      .join(", ");
  }

  function getManagerLabel(user: UserProfile) {
    const managerIds = user.manager_ids?.length
      ? user.manager_ids
      : user.nguoi_quan_ly_id
        ? [user.nguoi_quan_ly_id]
        : [];

    if (!managerIds.length) return "Chưa phân công";

    return managerIds
      .map((id) => {
        const manager = users.find((item) => item.id === id);
        return manager?.ho_ten || manager?.email || "Không tìm thấy tài khoản";
      })
      .join(", ");
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
                Quản lý tài khoản
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
          <section className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <Users size={14} />
                <span>Quản trị</span>
                <ChevronRight size={13} />
                <span className="text-emerald-700">Quản lý tài khoản</span>
              </div>

              <h1 className="text-lg font-extrabold text-emerald-950">
                Quản lý tài khoản
              </h1>

              <p className="text-xs text-slate-500">
                Quản lý tài khoản đăng nhập và thông tin cán bộ trong hệ thống.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={openCreate}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#145c3b] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4b30]"
              >
                <Plus size={16} />
                Thêm tài khoản
              </button>
            </div>
          </section>

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} />
              {message}
              <button onClick={() => setMessage("")} className="ml-auto">
                <X size={17} />
              </button>
            </div>
          )}

          {errorMessage && !showModal && !resetUser && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} />
              {errorMessage}
              <button
                onClick={() => setErrorMessage("")}
                className="ml-auto"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="mb-7">
            <div className="mb-3">
              <h2 className="text-sm font-extrabold text-slate-800">
                Tình hình tài khoản
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Số liệu tài khoản hiện có trong hệ thống.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Tổng tài khoản
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : users.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <Users size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Tổng số tài khoản đã đăng ký
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-blue-500" />
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Cán bộ
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : staffCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <UserRound size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Tài khoản người dùng thông thường
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-emerald-500" />
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Đang bị khóa
                    </p>
                    <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-slate-900">
                      {loading ? "—" : lockedCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                    <Lock size={21} />
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Tài khoản tạm khóa
                </p>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-amber-500" />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Danh sách tài khoản
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Tìm kiếm, chỉnh sửa và quản lý tài khoản cán bộ.
                </p>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Làm mới danh sách
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo họ tên, email hoặc ban phụ trách..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <select
                value={filterField}
                onChange={(event) => setFilterField(event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 sm:w-[260px]"
              >
                <option value="all">Tất cả lĩnh vực lớn</option>
                {activeRootFields.map((field) => (
                  <option key={field.id} value={field.ma}>
                    {field.ten}
                  </option>
                ))}
                <option value="">Chưa phân lĩnh vực</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-500">
                    <th className="w-16 px-5 py-4 text-center">STT</th>
                    <th className="px-4 py-4">CÁN BỘ</th>
                    <th className="px-4 py-4">EMAIL ĐĂNG NHẬP</th>
                    <th className="px-4 py-4">LĨNH VỰC CON ĐƯỢC BAO PHỦ</th>
                    <th className="px-4 py-4">LĨNH VỰC LỚN</th>
                    <th className="px-4 py-4">NHÓM QUYỀN</th>
                    <th className="px-4 py-4">NGƯỜI QUẢN LÝ TRỰC TIẾP</th>
                    <th className="px-4 py-4 text-center">TRẠNG THÁI</th>
                    <th className="px-5 py-4 text-center">THAO TÁC</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-14 text-center text-slate-500"
                      >
                        <RefreshCw
                          size={22}
                          className="mx-auto mb-2 animate-spin text-emerald-600"
                        />
                        Đang tải danh sách tài khoản...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-14 text-center text-slate-500"
                      >
                        Không tìm thấy tài khoản phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b border-slate-200 transition last:border-0 hover:bg-emerald-50 ${
                          user.trang_thai === "tam_khoa" ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-emerald-100 px-2 text-[11px] font-bold text-emerald-800">
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-xs font-bold text-slate-800">
                            {user.ho_ten || "Chưa cập nhật họ tên"}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {user.email || "Chưa có email"}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {user.role === "admin" ? "—" : getAssignedFieldLabels(user)}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                            {user.role === "admin" ? "—" : getParentFieldLabels(user)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold text-violet-700">
                              <ShieldCheck size={13} />
                              Quản trị viên
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
                              {getGroupLabel(user.nhom_quyen)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          {user.role === "admin"
                            ? "—"
                            : getManagerLabel(user)}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {user.trang_thai === "tam_khoa" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-700">
                              <Lock size={12} />
                              Đã khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 size={12} />
                              Hoạt động
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEdit(user)}
                              title="Chỉnh sửa thông tin"
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => {
                                setResetUser(user);
                                setNewPassword("");
                                setErrorMessage("");
                              }}
                              title="Đặt lại mật khẩu"
                              className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                            >
                              <LockKeyhole size={16} />
                            </button>

                            <button
                              onClick={() => handleChangeStatus(user)}
                              disabled={saving}
                              title={
                                user.trang_thai === "tam_khoa"
                                  ? "Mở khóa tài khoản"
                                  : "Tạm khóa tài khoản"
                              }
                              className={`rounded-lg p-2 transition disabled:opacity-40 ${
                                user.trang_thai === "tam_khoa"
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {user.trang_thai === "tam_khoa" ? (
                                <Unlock size={16} />
                              ) : (
                                <Lock size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
              <p className="text-[10px] text-slate-400">
                Hiển thị {filteredUsers.length} / {users.length} tài khoản
              </p>
              <span className="text-[10px] font-semibold text-slate-500">
                Hệ thống quản lý cán bộ
              </span>
            </div>
          </section>

          <footer className="mt-6 flex flex-col gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              HỆ THỐNG QUẢN LÝ CÔNG VIỆC · TỈNH ĐOÀN LÂM ĐỒNG
            </span>
            <span>Khu vực quản trị nội bộ</span>
          </footer>
        </main>
      </div>

      {/* MODAL THÊM / SỬA TÀI KHOẢN */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {modalMode === "create"
                    ? "Thêm tài khoản cán bộ"
                    : "Chỉnh sửa tài khoản"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Nhập thông tin tài khoản đăng nhập hệ thống.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
              {errorMessage && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Họ và tên cán bộ <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ho_ten}
                  onChange={(event) =>
                    setForm({ ...form, ho_ten: event.target.value })
                  }
                  placeholder="Nhập họ và tên cán bộ"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Nhập email đăng nhập"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {modalMode === "create" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Tối thiểu 8 ký tự"
                      className="h-11 w-full rounded-lg border border-slate-200 px-3.5 pr-11 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {!isEditingAdmin && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Nhóm quyền <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.nhom_quyen}
                      onChange={(event) =>
                        handleGroupChange(event.target.value as NhomQuyen | "")
                      }
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">-- Chọn nhóm quyền --</option>
                      {groups.map((group) => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Nhóm quyền quyết định phạm vi được giao việc và cập nhật nhiệm vụ.
                    </p>
                  </div>

                  {form.nhom_quyen === "thuong_truc" && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Chức danh <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.chuc_danh}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          chuc_danh: event.target.value as "bi_thu" | "pho_bi_thu" | "",
                          nguoi_quan_ly_ids: [],
                        }))}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">-- Chọn chức danh --</option>
                        <option value="bi_thu">Bí thư</option>
                        <option value="pho_bi_thu">Phó Bí thư</option>
                      </select>
                    </div>
                  )}

                  {form.nhom_quyen && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Lĩnh vực lớn phụ trách <span className="text-red-500">*</span>
                      </label>

                      {form.nhom_quyen === "thuong_truc" ? (
                        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                          {activeRootFields.map((root) => (
                            <label key={root.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={form.linh_vuc_lon_mas.includes(root.ma)}
                                onChange={(event) => toggleRootCode(root.ma, event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                              />
                              <span>{root.ten}</span>
                            </label>
                          ))}
                          {activeRootFields.length === 0 && (
                            <p className="text-xs text-amber-600">Chưa có lĩnh vực lớn đang hoạt động.</p>
                          )}
                        </div>
                      ) : (
                        <select
                          value={form.linh_vuc_lon_mas[0] || ""}
                          onChange={(event) => toggleRootCode(event.target.value, Boolean(event.target.value))}
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">-- Chọn 01 lĩnh vực lớn --</option>
                          {activeRootFields.map((root) => (
                            <option key={root.id} value={root.ma}>{root.ten}</option>
                          ))}
                        </select>
                      )}

                      <p className="mt-1.5 text-xs text-slate-400">
                        Chọn lĩnh vực lớn sẽ tự động bao gồm toàn bộ lĩnh vực con trực thuộc. Thường trực được chọn nhiều lĩnh vực lớn; các nhóm còn lại chọn 01 lĩnh vực lớn.
                      </p>
                    </div>
                  )}

                  {form.nhom_quyen && (form.nhom_quyen !== "thuong_truc" || form.chuc_danh === "pho_bi_thu") && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Người quản lý trực tiếp
                        <span className="ml-1 text-xs font-normal text-slate-400">(không bắt buộc)</span>
                      </label>

                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                        {managerOptions.length > 0 ? (
                          managerOptions.map((manager) => (
                            <label
                              key={manager.id}
                              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={form.nguoi_quan_ly_ids.includes(manager.id)}
                                onChange={(event) => toggleManager(manager.id, event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                              />
                              <span>{manager.ho_ten || manager.email}</span>
                              <span className="ml-auto text-xs text-slate-400">{getGroupLabel(manager.nhom_quyen)}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-amber-600">
                            Chưa có tài khoản phù hợp trong nhóm quản lý.
                          </p>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs text-slate-400">
                        {form.nhom_quyen === "thuong_truc"
                          ? "Phó Bí thư phải chọn Bí thư làm người quản lý trực tiếp."
                          : form.nhom_quyen === "truong_ban"
                            ? "Chọn một hoặc nhiều đồng chí Thường trực phụ trách trực tiếp."
                            : form.nhom_quyen === "pho_truong_ban"
                              ? "Có thể chọn Trưởng ban cùng lĩnh vực và nhiều đồng chí Thường trực phụ trách trực tiếp."
                              : "Có thể chọn nhiều đồng chí Thường trực, Trưởng ban và Phó Trưởng ban thuộc lĩnh vực được phân công."}
                      </p>
                    </div>
                  )}
                </>
              )}

              {isEditingAdmin && (
                <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                  Đây là tài khoản quản trị viên. Nhóm quyền nghiệp vụ và người quản lý trực tiếp không áp dụng cho tài khoản này.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#145c3b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f4b30] disabled:opacity-60"
              >
                {saving && <RefreshCw size={16} className="animate-spin" />}
                {saving
                  ? "Đang lưu..."
                  : modalMode === "create"
                    ? "Tạo tài khoản"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT LẠI MẬT KHẨU */}
      {resetUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-800">
                  Đặt lại mật khẩu
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {resetUser.ho_ten || resetUser.email}
                </p>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {errorMessage && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới, tối thiểu 8 ký tự"
                className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                onClick={() => setResetUser(null)}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#145c3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f4b30] disabled:opacity-60"
              >
                {saving && <RefreshCw size={15} className="animate-spin" />}
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
