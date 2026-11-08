
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Activity,
  Plus,
  Search,
  FolderTree,
  Folder,
  Pencil,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  CircleHelp,
} from "lucide-react";

type FieldItem = {
  id: string;
  ma: string;
  ten: string;
  danh_muc_cha_id: string | null;
  thu_tu: number;
  trang_thai: boolean;
  created_at?: string;
};

type FieldForm = {
  id: string;
  ma: string;
  ten: string;
  danh_muc_cha_id: string;
  thu_tu: string;
};

const emptyForm: FieldForm = {
  id: "",
  ma: "",
  ten: "",
  danh_muc_cha_id: "",
  thu_tu: "0",
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

function getErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return fallback;
}

export default function DanhMucPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const getHeaders = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const loadFields = useCallback(async () => {
    setErrorMessage("");

    try {
      const headers = await getHeaders();

      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Không thể tải lĩnh vực.")
        );
      }

      const rows = Array.isArray(result.fields) ? result.fields : [];

      const normalized: FieldItem[] = rows.map(
        (item: Record<string, unknown>) => ({
          id: String(item.id || ""),
          ma: String(item.ma || ""),
          ten: String(item.ten || ""),
          danh_muc_cha_id: item.danh_muc_cha_id
            ? String(item.danh_muc_cha_id)
            : null,
          thu_tu: Number(item.thu_tu || 0),
          trang_thai: item.trang_thai === true,
          created_at: item.created_at
            ? String(item.created_at)
            : undefined,
        })
      );

      setFields(normalized);

      setExpanded((previous) => {
        if (previous.length > 0) return previous;

        return normalized
          .filter((item) => !item.danh_muc_cha_id)
          .map((item) => item.id);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi tải lĩnh vực."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  const sortedFields = useMemo(() => {
    return [...fields].sort(
      (a, b) => a.thu_tu - b.thu_tu || a.ten.localeCompare(b.ten, "vi")
    );
  }, [fields]);

  const rootFields = useMemo(
    () => sortedFields.filter((item) => !item.danh_muc_cha_id),
    [sortedFields]
  );

  const childrenOf = useCallback(
    (parentId: string) =>
      sortedFields.filter((item) => item.danh_muc_cha_id === parentId),
    [sortedFields]
  );

  const activeCount = fields.filter((item) => item.trang_thai).length;
  const inactiveCount = fields.length - activeCount;
  const rootCount = rootFields.length;
  const childCount = fields.filter((item) => item.danh_muc_cha_id).length;

  const filteredRootFields = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return rootFields
      .map((parent) => {
        const children = childrenOf(parent.id);

        const visibleChildren = children.filter(
          (child) => showInactive || child.trang_thai
        );

        if (
          !showInactive &&
          !parent.trang_thai &&
          visibleChildren.length === 0
        ) {
          return null;
        }

        if (!keyword) {
          return {
            ...parent,
            visibleChildren,
          };
        }

        const parentMatches = [
          parent.ten,
          parent.ma,
          ...children.map((child) => child.ten),
          ...children.map((child) => child.ma),
        ]
          .join(" ")
          .toLocaleLowerCase("vi")
          .includes(keyword);

        if (!parentMatches) return null;

        const matchedChildren = visibleChildren.filter((child) =>
          `${child.ten} ${child.ma}`
            .toLocaleLowerCase("vi")
            .includes(keyword)
        );

        return {
          ...parent,
          visibleChildren:
            matchedChildren.length > 0
              ? matchedChildren
              : visibleChildren,
        };
      })
      .filter(
        (
          item
        ): item is FieldItem & { visibleChildren: FieldItem[] } =>
          item !== null
      );
  }, [rootFields, childrenOf, search, showInactive]);

  function toggleExpanded(id: string) {
    setExpanded((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function openCreate(parentId = "") {
    setForm({
      ...emptyForm,
      danh_muc_cha_id: parentId,
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(field: FieldItem) {
    setForm({
      id: field.id,
      ma: field.ma,
      ten: field.ten,
      danh_muc_cha_id: field.danh_muc_cha_id || "",
      thu_tu: String(field.thu_tu),
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const ma = form.ma.trim().toLowerCase();
    const ten = form.ten.trim();

    if (!ma || !ten) {
      setFormError("Vui lòng nhập đầy đủ mã và tên lĩnh vực.");
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(ma)) {
      setFormError(
        "Mã lĩnh vực chỉ được chứa chữ thường không dấu, số, dấu gạch ngang và gạch dưới."
      );
      return;
    }

    if (
      form.danh_muc_cha_id &&
      form.danh_muc_cha_id === form.id
    ) {
      setFormError("Lĩnh vực không thể trực thuộc chính nó.");
      return;
    }

    setSaving(true);
    setFormError("");
    setNotice("");

    try {
      const headers = await getHeaders();

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: form.id ? "field-update" : "field-create",
          id: form.id || undefined,
          ma,
          ten,
          danh_muc_cha_id: form.danh_muc_cha_id || null,
          thu_tu: Number(form.thu_tu || 0),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Không thể lưu lĩnh vực.")
        );
      }

      setModalOpen(false);
      setForm(emptyForm);
      setNotice(
        form.id
          ? "Đã cập nhật lĩnh vực."
          : "Đã thêm lĩnh vực mới."
      );

      await loadFields();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu lĩnh vực."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(field: FieldItem) {
    if (!field.trang_thai) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn ngừng sử dụng lĩnh vực "${field.ten}"?\n\nDữ liệu nhiệm vụ cũ vẫn được giữ nguyên.`
    );

    if (!confirmed) return;

    setNotice("");
    setErrorMessage("");

    try {
      const headers = await getHeaders();

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "field-disable",
          id: field.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Không thể ngừng sử dụng lĩnh vực.")
        );
      }

      setNotice(result.message || "Đã ngừng sử dụng lĩnh vực.");
      await loadFields();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể ngừng sử dụng lĩnh vực."
      );
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadFields();
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

  const isEditing = Boolean(form.id);
  const isEditingRoot = isEditing && !form.danh_muc_cha_id;

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
                Quản lý lĩnh vực
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
                <LayoutDashboard size={14} />
                <span>Quản trị</span>
                <ChevronRight size={13} />
                <span className="text-emerald-700">Quản lý lĩnh vực</span>
              </div>

              <h1 className="text-lg font-extrabold text-emerald-950">
                Quản lý lĩnh vực
              </h1>

              <p className="text-xs text-slate-500">
                Quản lý lĩnh vực lớn và lĩnh vực con dùng chung trong toàn hệ thống.
              </p>
            </div>

            <button
              onClick={() => openCreate()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#145c3b] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4b30]"
            >
              <Plus size={16} />
              Thêm lĩnh vực lớn
            </button>
          </section>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {notice && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>{notice}</p>
              <button
                onClick={() => setNotice("")}
                className="ml-auto text-emerald-700 hover:text-emerald-900"
                aria-label="Đóng thông báo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              {
                label: "Tổng lĩnh vực lớn",
                value: rootCount,
                icon: FolderTree,
                color: "text-blue-700",
                background: "bg-blue-50",
              },
              {
                label: "Tổng lĩnh vực con",
                value: childCount,
                icon: Layers,
                color: "text-violet-700",
                background: "bg-violet-50",
              },
              {
                label: "Đang sử dụng",
                value: activeCount,
                icon: CheckCircle2,
                color: "text-emerald-700",
                background: "bg-emerald-50",
              },
              {
                label: "Ngừng sử dụng",
                value: inactiveCount,
                icon: EyeOff,
                color: "text-slate-600",
                background: "bg-slate-100",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <div
                      className={`rounded-lg p-2 ${item.background} ${item.color}`}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {loading ? "—" : item.value.toLocaleString("vi-VN")}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Danh sách lĩnh vực
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Lĩnh vực được tải trực tiếp từ cơ sở dữ liệu.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm tên hoặc mã lĩnh vực..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-400 focus:bg-white sm:w-64"
                  />
                </div>

                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(event) => setShowInactive(event.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-700"
                  />
                  Hiện cả lĩnh vực đã ngừng
                </label>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-400">
                <RefreshCw
                  size={20}
                  className="mx-auto mb-3 animate-spin text-emerald-700"
                />
                Đang tải lĩnh vực từ cơ sở dữ liệu...
              </div>
            ) : filteredRootFields.length === 0 ? (
              <div className="p-12 text-center">
                <FolderTree
                  size={32}
                  className="mx-auto mb-3 text-slate-300"
                />
                <p className="text-sm font-semibold text-slate-600">
                  {fields.length === 0
                    ? "Chưa có dữ liệu lĩnh vực trong cơ sở dữ liệu."
                    : "Không tìm thấy lĩnh vực phù hợp."}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {fields.length === 0
                    ? "Lĩnh vực sẽ hiển thị tại đây sau khi có dữ liệu."
                    : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."}
                </p>
              </div>
            ) : (
              <div>
                {filteredRootFields.map((parent) => {
                  const children = parent.visibleChildren;
                  const isExpanded =
                    expanded.includes(parent.id) || Boolean(search.trim());

                  return (
                    <div
                      key={parent.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex flex-col gap-3 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <button
                            onClick={() => toggleExpanded(parent.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-emerald-700"
                            aria-label={
                              isExpanded
                                ? "Thu gọn lĩnh vực"
                                : "Mở rộng lĩnh vực"
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown size={17} />
                            ) : (
                              <ChevronRight size={17} />
                            )}
                          </button>

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                            <FolderTree size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-extrabold text-slate-800">
                                {parent.ten}
                              </p>
                              <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {parent.ma}
                              </span>
                              {parent.trang_thai ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                  ĐANG SỬ DỤNG
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                  ĐÃ NGỪNG
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Lĩnh vực lớn · {childrenOf(parent.id).length} lĩnh vực con
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pl-9 sm:pl-0">
                          <button
                            onClick={() => openCreate(parent.id)}
                            disabled={!parent.trang_thai}
                            title={
                              parent.trang_thai
                                ? "Thêm lĩnh vực con"
                                : "Không thể thêm lĩnh vực con vào lĩnh vực lớn đã ngừng sử dụng"
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={14} />
                            Thêm lĩnh vực con
                          </button>

                          <button
                            onClick={() => openEdit(parent)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={13} />
                            Sửa
                          </button>

                          {parent.trang_thai && (
                            <button
                              onClick={() => handleDisable(parent)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <EyeOff size={13} />
                              Ngừng sử dụng
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-white">
                          {children.length === 0 ? (
                            <div className="py-4 pl-16 pr-5 text-xs text-slate-400">
                              Chưa có lĩnh vực con.
                            </div>
                          ) : (
                            children.map((child) => (
                              <div
                                key={child.id}
                                className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 pl-12 sm:flex-row sm:items-center sm:justify-between sm:pl-[76px] sm:pr-5"
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                    <Folder size={14} />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs font-semibold text-slate-700">
                                        {child.ten}
                                      </p>
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                        {child.ma}
                                      </span>
                                      {child.trang_thai ? (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                          ĐANG SỬ DỤNG
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                          ĐÃ NGỪNG
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                      Lĩnh vực con · Thứ tự: {child.thu_tu}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pl-9 sm:pl-0">
                                  <button
                                    onClick={() => openEdit(child)}
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <Pencil size={12} />
                                    Sửa
                                  </button>

                                  {child.trang_thai && (
                                    <button
                                      onClick={() => handleDisable(child)}
                                      className="inline-flex h-7 items-center gap-1 rounded-md border border-red-100 px-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                      <EyeOff size={12} />
                                      Ngừng sử dụng
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-[10px] text-slate-400">
                Tổng cộng {fields.length} lĩnh vực · {rootCount} lĩnh vực lớn ·{" "}
                {childCount} lĩnh vực con
              </p>
              <p className="text-[10px] text-slate-400">
                Dữ liệu được lưu trực tiếp trong hệ thống
              </p>
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {isEditing ? "Cập nhật lĩnh vực" : "Thêm lĩnh vực mới"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Nhập thông tin lĩnh vực.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Loại lĩnh vực
                </label>

                <select
                  value={form.danh_muc_cha_id}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      danh_muc_cha_id: event.target.value,
                    }))
                  }
                  disabled={isEditingRoot}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">Lĩnh vực lớn</option>
                  {rootFields
                    .filter(
                      (item) => item.trang_thai && item.id !== form.id
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        Lĩnh vực con thuộc: {item.ten}
                      </option>
                    ))}
                </select>

                {isEditingRoot && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Lĩnh vực lớn được giữ ở cấp gốc.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Mã lĩnh vực <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ma}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      ma: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: van-phong"
                  maxLength={100}
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none transition focus:border-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Dùng chữ thường không dấu, số, dấu gạch ngang hoặc gạch dưới.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tên lĩnh vực <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ten}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      ten: event.target.value,
                    }))
                  }
                  placeholder="Nhập tên lĩnh vực"
                  maxLength={255}
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={form.thu_tu}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      thu_tu: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none transition focus:border-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Số nhỏ hơn được hiển thị trước.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#145c3b] px-5 text-xs font-bold text-white transition hover:bg-[#0f4b30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={15} />
                  {saving
                    ? "Đang lưu..."
                    : isEditing
                      ? "Lưu thay đổi"
                      : "Thêm lĩnh vực"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
