
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const authClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type NhomQuyen =
  | "thuong_truc"
  | "truong_ban"
  | "pho_truong_ban"
  | "chuyen_vien";

const allowedGroups: NhomQuyen[] = [
  "thuong_truc",
  "truong_ban",
  "pho_truong_ban",
  "chuyen_vien",
];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return {
      error: "Không tìm thấy phiên đăng nhập.",
      status: 401 as const,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return {
      error: "Phiên đăng nhập không hợp lệ.",
      status: 401 as const,
    };
  }

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, role, trang_thai")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "admin") {
    return {
      error: "Bạn không có quyền quản trị hệ thống.",
      status: 403 as const,
    };
  }

  if (profile.trang_thai === "tam_khoa") {
    return {
      error: "Tài khoản quản trị đã bị khóa.",
      status: 403 as const,
    };
  }

  return { user, profile };
}

/**
 * Quy tắc phân công:
 * - Thường trực: nhiều lĩnh vực lớn; có thể không chọn người quản lý.
 * - Trưởng ban: đúng 01 lĩnh vực lớn; nhiều Thường trực quản lý.
 * - Phó Trưởng ban: đúng 01 lĩnh vực lớn; tối đa 01 Trưởng ban và nhiều Thường trực quản lý.
 * - Chuyên viên: đúng 01 lĩnh vực lớn; nhiều Thường trực/Trưởng ban/Phó Trưởng ban quản lý.
 * - Tất cả quan hệ quản lý đều không bắt buộc.
 */
async function getProfileRootCodes(profileId: string): Promise<string[]> {
  const { data: assignments, error } = await adminClient
    .from("profile_fields")
    .select("field_id")
    .eq("profile_id", profileId);
  if (error) throw new Error("Không thể tải lĩnh vực của cán bộ: " + error.message);

  const ids = (assignments || []).map((row: { field_id: string }) => row.field_id);
  if (!ids.length) return [];

  const { data: assignedFields, error: fieldsError } = await adminClient
    .from("danh_muc_linh_vuc")
    .select("id, ma, danh_muc_cha_id")
    .in("id", ids);
  if (fieldsError) throw new Error("Không thể xác định lĩnh vực lớn: " + fieldsError.message);

  const parentIds = Array.from(new Set(
    (assignedFields || [])
      .map((field: any) => field.danh_muc_cha_id)
      .filter((id: string | null): id is string => Boolean(id))
  ));
  const { data: parents, error: parentsError } = parentIds.length
    ? await adminClient.from("danh_muc_linh_vuc").select("id, ma").in("id", parentIds)
    : { data: [], error: null };
  if (parentsError) throw new Error("Không thể tải lĩnh vực cha: " + parentsError.message);

  const rootCodes = new Set<string>();
  for (const field of assignedFields || []) {
    if (field.danh_muc_cha_id) {
      const parent = (parents || []).find((item: any) => item.id === field.danh_muc_cha_id);
      if (parent?.ma) rootCodes.add(parent.ma);
    } else if (field.ma) {
      rootCodes.add(field.ma);
    }
  }
  return Array.from(rootCodes);
}

async function validateAssignment(data: {
  nhom_quyen: string;
  chuc_danh: string | null;
  linh_vuc_lon_mas: string[];
  nguoi_quan_ly_ids: string[];
}) {
  const group = data.nhom_quyen as NhomQuyen;
  const rootCodes = Array.from(new Set(data.linh_vuc_lon_mas));
  const managerIds = Array.from(new Set(data.nguoi_quan_ly_ids));

  if (!allowedGroups.includes(group)) return "Nhóm quyền không hợp lệ.";
  if (group === "thuong_truc" && rootCodes.length < 1) {
    return "Vui lòng chọn ít nhất 01 lĩnh vực lớn cho Thường trực.";
  }
  if (group === "thuong_truc" && !["bi_thu", "pho_bi_thu"].includes(data.chuc_danh || "")) {
    return "Vui lòng xác định chức danh Bí thư hoặc Phó Bí thư.";
  }
  if (group !== "thuong_truc" && data.chuc_danh) {
    return "Chức danh Bí thư/Phó Bí thư chỉ áp dụng cho nhóm Thường trực.";
  }
  if (group !== "thuong_truc" && rootCodes.length !== 1) {
    return "Trưởng ban, Phó Trưởng ban và Chuyên viên chỉ được chọn đúng 01 lĩnh vực lớn.";
  }

  const { data: roots, error: rootsError } = await adminClient
    .from("danh_muc_linh_vuc")
    .select("id, ma, danh_muc_cha_id, trang_thai")
    .in("ma", rootCodes)
    .eq("trang_thai", true);
  if (rootsError || !roots || roots.length !== rootCodes.length || roots.some((item) => item.danh_muc_cha_id !== null)) {
    return "Có lĩnh vực lớn không tồn tại, đã ngừng sử dụng hoặc không hợp lệ.";
  }

  if (group === "thuong_truc") {
    if (data.chuc_danh === "bi_thu" && managerIds.length) {
      return "Bí thư không cần chọn người quản lý trực tiếp.";
    }
    if (data.chuc_danh === "pho_bi_thu" && managerIds.length !== 1) {
      return "Phó Bí thư phải chọn đúng 01 Bí thư quản lý trực tiếp.";
    }
  }
  if (!managerIds.length) return null;
  if (managerIds.length !== data.nguoi_quan_ly_ids.length) {
    return "Danh sách người quản lý trực tiếp không hợp lệ.";
  }

  const { data: managers, error: managersError } = await adminClient
    .from("profiles")
    .select("id, role, nhom_quyen, chuc_danh, trang_thai")
    .in("id", managerIds);
  if (managersError || !managers || managers.length !== managerIds.length) {
    return "Có tài khoản người quản lý trực tiếp không tồn tại.";
  }
  if (managers.some((item) => item.role === "admin" || item.trang_thai !== "hoat_dong")) {
    return "Người quản lý trực tiếp phải là cán bộ đang hoạt động.";
  }

  const managerGroups = managers.map((item) => item.nhom_quyen || "");
  if (group === "thuong_truc") {
    if (data.chuc_danh === "pho_bi_thu" && (managers[0]?.nhom_quyen !== "thuong_truc" || managers[0]?.chuc_danh !== "bi_thu")) {
      return "Phó Bí thư phải chọn đúng 01 tài khoản Bí thư làm người quản lý trực tiếp.";
    }
    return null;
  }
  if (group === "truong_ban") {
    if (managerGroups.some((item) => item !== "thuong_truc")) {
      return "Trưởng ban chỉ được chọn Thường trực làm người quản lý trực tiếp.";
    }
    return null;
  }
  if (group === "pho_truong_ban") {
    if (managerGroups.filter((item) => item === "truong_ban").length > 1) {
      return "Phó Trưởng ban chỉ được chọn tối đa 01 Trưởng ban quản lý trực tiếp.";
    }
    if (managerGroups.some((item) => !["thuong_truc", "truong_ban"].includes(item))) {
      return "Phó Trưởng ban chỉ được chọn Trưởng ban và/hoặc Thường trực quản lý trực tiếp.";
    }
  } else if (group === "chuyen_vien") {
    if (managerGroups.some((item) => !["thuong_truc", "truong_ban", "pho_truong_ban"].includes(item))) {
      return "Chuyên viên chỉ được chọn Thường trực, Trưởng ban hoặc Phó Trưởng ban quản lý trực tiếp.";
    }
  }

  // Với Phó Trưởng ban và Chuyên viên, Trưởng ban/Phó Trưởng ban được chọn
  // phải cùng lĩnh vực lớn. Thường trực có thể phụ trách nhiều lĩnh vực.
  const scopedManagers = managers.filter((item) =>
    ["truong_ban", "pho_truong_ban"].includes(item.nhom_quyen || "")
  );
  for (const manager of scopedManagers) {
    const managerRoots = await getProfileRootCodes(manager.id);
    if (!managerRoots.includes(rootCodes[0])) {
      return group === "pho_truong_ban"
        ? "Trưởng ban được chọn phải thuộc cùng lĩnh vực lớn với Phó Trưởng ban."
        : "Trưởng ban/Phó Trưởng ban được chọn phải thuộc cùng lĩnh vực lớn với Chuyên viên.";
    }
  }

  return null;
}

/** Đồng bộ nhiều Thường trực phụ trách trực tiếp một Trưởng ban/Phó Trưởng ban. */
async function syncProfileManagers(profileId: string, managerIds: string[]) {
  const { data: current, error: readError } = await adminClient
    .from("profile_managers")
    .select("manager_id")
    .eq("profile_id", profileId);
  if (readError) return "Không thể đọc danh sách người phụ trách: " + readError.message;

  const currentIds = (current || []).map((item) => item.manager_id);
  const addIds = managerIds.filter((id) => !currentIds.includes(id));
  const removeIds = currentIds.filter((id) => !managerIds.includes(id));

  if (addIds.length) {
    const { error } = await adminClient.from("profile_managers").insert(
      addIds.map((managerId) => ({ profile_id: profileId, manager_id: managerId }))
    );
    if (error) return "Không thể lưu danh sách người phụ trách: " + error.message;
  }

  if (removeIds.length) {
    const { error } = await adminClient
      .from("profile_managers")
      .delete()
      .eq("profile_id", profileId)
      .in("manager_id", removeIds);
    if (error) return "Không thể xóa người phụ trách cũ: " + error.message;
  }
  return null;
}

/** Đồng bộ các lĩnh vực con được giao cho tài khoản. */
async function syncProfileFields(profileId: string, fieldIds: string[]) {
  const { data: current, error: readError } = await adminClient
    .from("profile_fields")
    .select("field_id")
    .eq("profile_id", profileId);
  if (readError) return "Không thể đọc lĩnh vực đã phân công: " + readError.message;

  const currentIds = (current || []).map((item) => item.field_id);
  const addIds = fieldIds.filter((id) => !currentIds.includes(id));
  const removeIds = currentIds.filter((id) => !fieldIds.includes(id));

  if (addIds.length) {
    const { error } = await adminClient.from("profile_fields").insert(
      addIds.map((fieldId) => ({ profile_id: profileId, field_id: fieldId }))
    );
    if (error) return "Không thể lưu lĩnh vực được phân công: " + error.message;
  }

  if (removeIds.length) {
    const { error } = await adminClient
      .from("profile_fields")
      .delete()
      .eq("profile_id", profileId)
      .in("field_id", removeIds);
    if (error) return "Không thể xóa lĩnh vực phân công cũ: " + error.message;
  }
  return null;
}

async function handleGet(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if ("error" in auth) return jsonError(auth.error || "Không có quyền truy cập.", auth.status || 403);

  const [usersResult, fieldsResult, managersResult, profileFieldsResult] = await Promise.all([
    adminClient.from("profiles").select("id, email, ho_ten, role, linh_vuc_quan_ly, nhom_quyen, chuc_danh, ban_phu_trach, nguoi_quan_ly_id, trang_thai").order("ho_ten", { ascending: true }),
    adminClient.from("danh_muc_linh_vuc").select("id, ma, ten, danh_muc_cha_id, thu_tu, trang_thai, created_at").order("thu_tu", { ascending: true }).order("ten", { ascending: true }),
    adminClient.from("profile_managers").select("profile_id, manager_id"),
    adminClient.from("profile_fields").select("profile_id, field_id"),
  ]);

  if (usersResult.error) return jsonError("Không thể tải danh sách tài khoản: " + usersResult.error.message, 500);
  if (fieldsResult.error) return jsonError("Không thể tải danh mục lĩnh vực: " + fieldsResult.error.message, 500);
  if (managersResult.error) return jsonError("Không thể tải danh sách người phụ trách: " + managersResult.error.message, 500);
  if (profileFieldsResult.error) return jsonError("Không thể tải lĩnh vực đã phân công: " + profileFieldsResult.error.message, 500);

  const managerMap = new Map<string, string[]>();
  for (const item of managersResult.data || []) {
    const list = managerMap.get(item.profile_id) || [];
    list.push(item.manager_id);
    managerMap.set(item.profile_id, list);
  }

  const fieldById = new Map<string, any>(
    (fieldsResult.data || []).map((field: any) => [field.id, field])
  );
  const fieldMap = new Map<string, string[]>();
  for (const item of profileFieldsResult.data || []) {
    const field = fieldById.get(item.field_id);
    if (!field) continue;
    const root = field.danh_muc_cha_id
      ? fieldById.get(field.danh_muc_cha_id)
      : field;
    if (!root) continue;
    const list = fieldMap.get(item.profile_id) || [];
    if (!list.includes(root.ma)) list.push(root.ma);
    fieldMap.set(item.profile_id, list);
  }

  const users = (usersResult.data || []).map((user) => {
    let fieldCodes = fieldMap.get(user.id) || [];
    // Tương thích hồ sơ cũ lưu mã lĩnh vực con trong ban_phu_trach.
    if (!fieldCodes.length && user.ban_phu_trach) {
      const legacy = (fieldsResult.data || []).find((field) => field.ma === user.ban_phu_trach);
      if (legacy) {
        const root = legacy.danh_muc_cha_id
          ? fieldById.get(legacy.danh_muc_cha_id)
          : legacy;
        if (root) fieldCodes = [root.ma];
      }
    }
    let managerIds = managerMap.get(user.id) || [];
    if (!managerIds.length && user.nguoi_quan_ly_id) {
      managerIds = [user.nguoi_quan_ly_id];
    }
    return { ...user, field_codes: fieldCodes, manager_ids: managerIds };
  });

  return NextResponse.json({ users, fields: fieldsResult.data || [] });
}

async function createUser(body: Record<string, unknown>) {
  const hoTen = cleanString(body.ho_ten);
  const email = cleanString(body.email).toLowerCase();
  const password = cleanString(body.password);
  const group = cleanString(body.nhom_quyen);
  const chucDanh = cleanString(body.chuc_danh) || null;
  const rootCodes = cleanIdArray(body.linh_vuc_lon_mas);
  const managerIds = cleanIdArray(body.nguoi_quan_ly_ids);

  if (!hoTen || !email || !password) return jsonError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
  if (password.length < 8) return jsonError("Mật khẩu phải có ít nhất 8 ký tự.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Email đăng nhập không hợp lệ.");

  const { data: assignedFields, error: fieldError } = await adminClient
    .from("danh_muc_linh_vuc")
    .select("id, ma, danh_muc_cha_id")
    .in("ma", rootCodes)
    .eq("trang_thai", true);
  if (fieldError || !assignedFields || assignedFields.length !== rootCodes.length ||
      assignedFields.some((field) => field.danh_muc_cha_id !== null)) {
    return jsonError("Có lĩnh vực lớn không tồn tại hoặc đã ngừng sử dụng.");
  }

  const validationError = await validateAssignment({
    nhom_quyen: group,
    chuc_danh: chucDanh,
    linh_vuc_lon_mas: rootCodes,
    nguoi_quan_ly_ids: managerIds,
  });
  if (validationError) return jsonError(validationError);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { ho_ten: hoTen },
  });
  if (createError || !created.user) return jsonError(createError?.message || "Không thể tạo tài khoản đăng nhập.", 400);

  const userId = created.user.id;
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId,
    email,
    ho_ten: hoTen,
    role: "user",
    linh_vuc_quan_ly: null,
    nhom_quyen: group,
    chuc_danh: group === "thuong_truc" ? chucDanh : null,
    ban_phu_trach: null,
    nguoi_quan_ly_id: null,
    trang_thai: "hoat_dong",
  }, { onConflict: "id" });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return jsonError("Không thể đồng bộ hồ sơ cán bộ: " + profileError.message, 500);
  }

  const { data: childFields, error: childFieldsError } = await adminClient
    .from("danh_muc_linh_vuc")
    .select("id")
    .in("danh_muc_cha_id", assignedFields.map((field) => field.id))
    .eq("trang_thai", true);
  if (childFieldsError) {
    await adminClient.auth.admin.deleteUser(userId);
    return jsonError("Không thể tải lĩnh vực con: " + childFieldsError.message, 500);
  }
  const allAssignedFieldIds = [
    ...assignedFields.map((field) => field.id),
    ...(childFields || []).map((field) => field.id),
  ];
  const fieldSyncError = await syncProfileFields(userId, allAssignedFieldIds);
  if (fieldSyncError) {
    await adminClient.auth.admin.deleteUser(userId);
    return jsonError(fieldSyncError, 500);
  }

  const managerSyncError = await syncProfileManagers(userId, managerIds);
  if (managerSyncError) {
    await adminClient.auth.admin.deleteUser(userId);
    return jsonError(managerSyncError, 500);
  }

  return NextResponse.json({ success: true, message: "Đã tạo tài khoản cán bộ.", id: userId });
}

async function updateUser(body: Record<string, unknown>, currentAdminId: string) {
  const id = cleanString(body.id);
  const hoTen = cleanString(body.ho_ten);
  const email = cleanString(body.email).toLowerCase();
  if (!id || !hoTen || !email) return jsonError("Thiếu thông tin tài khoản cần cập nhật.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Email đăng nhập không hợp lệ.");

  const { data: existing, error: findError } = await adminClient.from("profiles")
    .select("id, role, nhom_quyen, nguoi_quan_ly_id")
    .eq("id", id).maybeSingle();
  if (findError || !existing) return jsonError("Không tìm thấy hồ sơ cán bộ.", 404);

  const isAdmin = existing.role === "admin";
  if (id === currentAdminId && !isAdmin) return jsonError("Không thể thay đổi quyền của chính tài khoản quản trị.");

  const group = cleanString(body.nhom_quyen);
  const chucDanh = cleanString(body.chuc_danh) || null;
  const rootCodes = cleanIdArray(body.linh_vuc_lon_mas);
  const managerIds = cleanIdArray(body.nguoi_quan_ly_ids);
  let fieldIds: string[] = [];

  if (!isAdmin) {
    const { data: assignedFields, error: fieldError } = await adminClient.from("danh_muc_linh_vuc")
      .select("id, ma, danh_muc_cha_id").in("ma", rootCodes).eq("trang_thai", true);
    if (fieldError || !assignedFields || assignedFields.length !== rootCodes.length ||
        assignedFields.some((field) => field.danh_muc_cha_id !== null)) {
      return jsonError("Có lĩnh vực lớn không tồn tại hoặc đã ngừng sử dụng.");
    }
    const { data: childFields, error: childFieldsError } = await adminClient
      .from("danh_muc_linh_vuc")
      .select("id")
      .in("danh_muc_cha_id", assignedFields.map((field) => field.id))
      .eq("trang_thai", true);
    if (childFieldsError) return jsonError("Không thể tải lĩnh vực con: " + childFieldsError.message, 500);
    fieldIds = [
      ...assignedFields.map((field) => field.id),
      ...(childFields || []).map((field) => field.id),
    ];

    const validationError = await validateAssignment({
      nhom_quyen: group,
      chuc_danh: chucDanh,
      linh_vuc_lon_mas: rootCodes,
      nguoi_quan_ly_ids: managerIds,
    });
    if (validationError) return jsonError(validationError);
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
    email,
    user_metadata: { ho_ten: hoTen },
  });
  if (authError) return jsonError("Không thể cập nhật tài khoản đăng nhập: " + authError.message);

  const profileUpdate: Record<string, unknown> = { email, ho_ten: hoTen };
  if (!isAdmin) {
    profileUpdate.linh_vuc_quan_ly = null;
    profileUpdate.nhom_quyen = group;
    profileUpdate.chuc_danh = group === "thuong_truc" ? chucDanh : null;
    profileUpdate.ban_phu_trach = null;
    profileUpdate.nguoi_quan_ly_id = null;
  }

  const { error: profileError } = await adminClient.from("profiles").update(profileUpdate).eq("id", id);
  if (profileError) return jsonError("Tài khoản đăng nhập đã cập nhật nhưng hồ sơ chưa cập nhật được: " + profileError.message, 500);

  if (!isAdmin) {
    const fieldSyncError = await syncProfileFields(id, fieldIds);
    if (fieldSyncError) return jsonError("Hồ sơ đã cập nhật nhưng " + fieldSyncError, 500);
    const managerSyncError = await syncProfileManagers(id, managerIds);
    if (managerSyncError) return jsonError("Hồ sơ đã cập nhật nhưng " + managerSyncError, 500);
  }

  return NextResponse.json({ success: true, message: "Đã cập nhật thông tin tài khoản." });
}

async function resetPassword(body: Record<string, unknown>) {
  const id = cleanString(body.id);
  const password = cleanString(body.password);

  if (!id || password.length < 8) {
    return jsonError("Mật khẩu mới phải có ít nhất 8 ký tự.");
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return jsonError("Không tìm thấy tài khoản.", 404);
  }

  const { error } = await adminClient.auth.admin.updateUserById(id, {
    password,
  });

  if (error) {
    return jsonError(
      "Không thể đặt lại mật khẩu: " + error.message
    );
  }

  return NextResponse.json({
    success: true,
    message: "Đã đặt lại mật khẩu.",
  });
}

async function changeStatus(
  body: Record<string, unknown>,
  currentAdminId: string
) {
  const id = cleanString(body.id);
  const status = cleanString(body.trang_thai);

  if (!id || !["hoat_dong", "tam_khoa"].includes(status)) {
    return jsonError("Thông tin trạng thái tài khoản không hợp lệ.");
  }

  if (id === currentAdminId) {
    return jsonError(
      "Không thể khóa chính tài khoản quản trị đang đăng nhập."
    );
  }

  const { data: profile, error: findError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (findError || !profile) {
    return jsonError("Không tìm thấy tài khoản.", 404);
  }

  if (profile.role === "admin") {
    return jsonError(
      "Không thể khóa tài khoản quản trị viên tại chức năng này."
    );
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ trang_thai: status })
    .eq("id", id);

  if (error) {
    return jsonError(
      "Không thể cập nhật trạng thái: " + error.message
    );
  }

  return NextResponse.json({
    success: true,
    message:
      status === "tam_khoa"
        ? "Đã khóa tài khoản."
        : "Đã mở khóa tài khoản.",
  });
}

async function createField(body: Record<string, unknown>) {
  const ma = cleanString(body.ma).toLowerCase();
  const ten = cleanString(body.ten);
  const parentId =
    cleanString(body.danh_muc_cha_id) || null;
  const thuTu = Number(body.thu_tu || 0);

  if (!ma || !ten) {
    return jsonError("Vui lòng nhập mã và tên lĩnh vực.");
  }

  if (!/^[a-z0-9_-]+$/.test(ma)) {
    return jsonError(
      "Mã lĩnh vực chỉ được chứa chữ thường không dấu, số, dấu gạch ngang và gạch dưới."
    );
  }

  if (parentId) {
    const { data: parent } = await adminClient
      .from("danh_muc_linh_vuc")
      .select("id, danh_muc_cha_id, trang_thai")
      .eq("id", parentId)
      .maybeSingle();

    if (
      !parent ||
      parent.danh_muc_cha_id ||
      !parent.trang_thai
    ) {
      return jsonError("Lĩnh vực cha không hợp lệ.");
    }
  }

  const { data: createdField, error } = await adminClient
    .from("danh_muc_linh_vuc")
    .insert({
      ma,
      ten,
      danh_muc_cha_id: parentId,
      thu_tu: Number.isFinite(thuTu) ? thuTu : 0,
      trang_thai: true,
    })
    .select("id")
    .single();

  if (error || !createdField) {
    return jsonError(
      error?.code === "23505"
        ? "Mã lĩnh vực đã tồn tại."
        : "Không thể thêm lĩnh vực: " + (error?.message || "Không nhận được dữ liệu lĩnh vực mới.")
    );
  }

  // Nếu tài khoản đã được phân công lĩnh vực lớn này, tự động bổ sung lĩnh vực con mới.
  if (parentId) {
    const { data: assignedProfiles, error: assignedProfilesError } = await adminClient
      .from("profile_fields")
      .select("profile_id")
      .eq("field_id", parentId);
    if (assignedProfilesError) {
      return jsonError("Đã tạo lĩnh vực nhưng không thể đồng bộ phân công tài khoản: " + assignedProfilesError.message, 500);
    }
    const profileIds = Array.from(new Set((assignedProfiles || []).map((row) => row.profile_id)));
    if (profileIds.length) {
      const { error: syncError } = await adminClient.from("profile_fields").insert(
        profileIds.map((profileId) => ({ profile_id: profileId, field_id: createdField.id }))
      );
      if (syncError) {
        return jsonError("Đã tạo lĩnh vực nhưng không thể tự động phân công lĩnh vực con mới: " + syncError.message, 500);
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: "Đã thêm lĩnh vực.",
  });
}

async function updateField(body: Record<string, unknown>) {
  const id = cleanString(body.id);
  const ma = cleanString(body.ma).toLowerCase();
  const ten = cleanString(body.ten);
  const parentId =
    cleanString(body.danh_muc_cha_id) || null;
  const thuTu = Number(body.thu_tu || 0);

  if (!id || !ma || !ten) {
    return jsonError("Thiếu thông tin lĩnh vực cần cập nhật.");
  }

  if (!/^[a-z0-9_-]+$/.test(ma)) {
    return jsonError(
      "Mã lĩnh vực chỉ được chứa chữ thường không dấu, số, dấu gạch ngang và gạch dưới."
    );
  }

  if (parentId === id) {
    return jsonError(
      "Không thể chọn chính lĩnh vực này làm lĩnh vực cha."
    );
  }

  if (parentId) {
    const { data: parent } = await adminClient
      .from("danh_muc_linh_vuc")
      .select("id, danh_muc_cha_id, trang_thai")
      .eq("id", parentId)
      .maybeSingle();

    if (
      !parent ||
      parent.danh_muc_cha_id ||
      !parent.trang_thai
    ) {
      return jsonError("Lĩnh vực cha không hợp lệ.");
    }
  }

  const { error } = await adminClient
    .from("danh_muc_linh_vuc")
    .update({
      ma,
      ten,
      danh_muc_cha_id: parentId,
      thu_tu: Number.isFinite(thuTu) ? thuTu : 0,
    })
    .eq("id", id);

  if (error) {
    return jsonError(
      error.code === "23505"
        ? "Mã lĩnh vực đã được sử dụng."
        : "Không thể cập nhật lĩnh vực: " + error.message
    );
  }

  return NextResponse.json({
    success: true,
    message: "Đã cập nhật lĩnh vực.",
  });
}

async function disableField(body: Record<string, unknown>) {
  const id = cleanString(body.id);

  if (!id) {
    return jsonError("Thiếu mã lĩnh vực.");
  }

  const { data: field, error: findError } = await adminClient
    .from("danh_muc_linh_vuc")
    .select("id, ma, danh_muc_cha_id")
    .eq("id", id)
    .maybeSingle();

  if (findError || !field) {
    return jsonError("Không tìm thấy lĩnh vực.", 404);
  }

  if (!field.danh_muc_cha_id) {
    const { data: children } = await adminClient
      .from("danh_muc_linh_vuc")
      .select("id")
      .eq("danh_muc_cha_id", id)
      .eq("trang_thai", true);

    if (children && children.length > 0) {
      return jsonError(
        "Lĩnh vực này còn lĩnh vực con đang hoạt động. Hãy ngừng sử dụng các lĩnh vực con trước."
      );
    }
  }

  const { error } = await adminClient
    .from("danh_muc_linh_vuc")
    .update({ trang_thai: false })
    .eq("id", id);

  if (error) {
    return jsonError(
      "Không thể ngừng sử dụng lĩnh vực: " + error.message
    );
  }

  return NextResponse.json({
    success: true,
    message:
      "Đã ngừng sử dụng lĩnh vực. Dữ liệu nhiệm vụ cũ được giữ nguyên.",
  });
}

export async function GET(request: NextRequest) {
  try {
    return await handleGet(request);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Lỗi máy chủ.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if ("error" in auth) {
      return jsonError(
        auth.error || "Không có quyền truy cập.",
        auth.status || 403
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const action = cleanString(body.action);

    switch (action) {
      case "create":
        return await createUser(body);

      case "update":
        return await updateUser(body, auth.user.id);

      case "reset-password":
        return await resetPassword(body);

      case "change-status":
        return await changeStatus(body, auth.user.id);

      case "field-create":
        return await createField(body);

      case "field-update":
        return await updateField(body);

      case "field-disable":
        return await disableField(body);

      default:
        return jsonError("Thao tác không được hỗ trợ.");
    }
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Lỗi máy chủ.",
      500
    );
  }
}
