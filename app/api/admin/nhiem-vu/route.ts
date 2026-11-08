
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const authClient = createClient(supabaseUrl, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type Profile = {
  id: string;
  role: string;
  ho_ten: string | null;
  nhom_quyen: string | null;
  linh_vuc_quan_ly: string | null;
  nguoi_quan_ly_id: string | null;
};

type TaskInput = {
  id?: string;
  ten?: string;
  linh_vuc_lon?: string;
  linh_vuc_con?: string;
  loai_nhiem_vu?: string;
  san_pham?: string;
  ngay_giao?: string | null;
  han_hoan_thanh?: string | null;
  ngay_hoan_thanh?: string | null;
  tien_do?: string;
  can_bo_tham_muu?: string;
  can_bo_phu_trach?: string;
  thang?: number;
  nam?: number;
  quy?: number;
  ngay_ghi_nhan?: string | null;
  ghi_chu?: string;
  ket_qua_thuc_hien?: string;
  cap_nhat_tien_do_luc?: string | null;
};

const FULL_EDIT_FIELDS = [
  "linh_vuc_lon",
  "linh_vuc_con",
  "ten",
  "loai_nhiem_vu",
  "san_pham",
  "ngay_giao",
  "han_hoan_thanh",
  "ngay_hoan_thanh",
  "tien_do",
  "can_bo_tham_muu",
  "can_bo_phu_trach",
  "thang",
  "nam",
  "quy",
  "ngay_ghi_nhan",
  "ghi_chu",
  "ket_qua_thuc_hien",
  "cap_nhat_tien_do_luc",
] as const;

const PROGRESS_FIELDS = [
  "tien_do",
  "ngay_hoan_thanh",
  "san_pham",
  "ket_qua_thuc_hien",
  "cap_nhat_tien_do_luc",
] as const;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getActor(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return {
      error: fail("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.", 401),
      profile: null,
    };
  }

  const { data: authData, error: authError } =
    await authClient.auth.getUser(token);

  if (authError || !authData.user) {
    return {
      error: fail("Phiên đăng nhập không hợp lệ.", 401),
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select(
      "id, role, ho_ten, nhom_quyen, linh_vuc_quan_ly, nguoi_quan_ly_id"
    )
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: fail("Không tìm thấy thông tin tài khoản.", 403),
      profile: null,
    };
  }

  return {
    error: null,
    profile: profile as Profile,
  };
}

function isAdmin(profile: Profile) {
  return profile.role === "admin";
}

function canCreate(profile: Profile) {
  return (
    isAdmin(profile) ||
    ["thuong_truc", "truong_ban", "pho_truong_ban"].includes(
      profile.nhom_quyen || ""
    )
  );
}

function isInManagedArea(profile: Profile, task: TaskInput) {
  return (
    !!profile.linh_vuc_quan_ly &&
    profile.linh_vuc_quan_ly === task.linh_vuc_lon
  );
}

async function validateAssignee(
  profile: Profile,
  task: TaskInput
): Promise<string | null> {
  if (isAdmin(profile) || profile.nhom_quyen === "thuong_truc") {
    return null;
  }

  if (!isInManagedArea(profile, task)) {
    return "Bạn không có quyền giao nhiệm vụ ngoài lĩnh vực phụ trách.";
  }

  const assigneeName = String(task.can_bo_tham_muu || "").trim();

  if (!assigneeName) {
    return null;
  }

  const { data: assignee, error } = await db
    .from("profiles")
    .select("id, ho_ten, nhom_quyen, linh_vuc_quan_ly")
    .ilike("ho_ten", assigneeName)
    .limit(2);

  if (error) {
    return "Không kiểm tra được thông tin cán bộ được giao.";
  }

  if (!assignee || assignee.length !== 1) {
    return "Cán bộ tham mưu chưa có tài khoản hoặc tên không duy nhất trong hệ thống.";
  }

  const target = assignee[0];

  if (target.linh_vuc_quan_ly !== profile.linh_vuc_quan_ly) {
    return "Cán bộ được giao không thuộc lĩnh vực phụ trách của bạn.";
  }

  if (profile.nhom_quyen === "truong_ban") {
    if (
      !["pho_truong_ban", "chuyen_vien"].includes(
        target.nhom_quyen || ""
      )
    ) {
      return "Trưởng ban chỉ được giao việc cho Phó Trưởng ban và chuyên viên thuộc lĩnh vực phụ trách.";
    }

    return null;
  }

  if (profile.nhom_quyen === "pho_truong_ban") {
    if (target.nhom_quyen !== "chuyen_vien") {
      return "Phó Trưởng ban chỉ được giao việc cho chuyên viên thuộc lĩnh vực phụ trách.";
    }

    return null;
  }

  return "Bạn không có quyền giao nhiệm vụ.";
}

function pickFields(
  input: Record<string, unknown>,
  fields: readonly string[]
) {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      result[field] = input[field];
    }
  }

  return result;
}

async function getTask(id: string) {
  const { data, error } = await db
    .from("nhiem_vu")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data;
}

function canManageExistingTask(
  profile: Profile,
  task: Record<string, unknown>
) {
  return (
    isAdmin(profile) ||
    task.created_by === profile.id
  );
}

/**
 * GET: Lấy danh sách nhiệm vụ.
 * Người dùng đã đăng nhập được xem danh sách tổng thể.
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await getActor(request);

  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = db
    .from("nhiem_vu")
    .select("*")
    .order("linh_vuc_con")
    .order("han_hoan_thanh");

  if (month) query = query.eq("thang", Number(month));
  if (year) query = query.eq("nam", Number(year));

  const { data, error } = await query;

  if (error) return fail(error.message, 500);

  return NextResponse.json({ data: data || [] });
}

/**
 * POST:
 * - action = save-bulk: lưu danh sách nhiệm vụ.
 * - action = create: tạo một nhiệm vụ.
 */
export async function POST(request: NextRequest) {
  const { profile, error: authError } = await getActor(request);

  if (authError || !profile) return authError;

  if (!canCreate(profile)) {
    return fail("Tài khoản của bạn không có quyền giao nhiệm vụ.", 403);
  }

  let body: {
    action?: string;
    tasks?: TaskInput[];
    task?: TaskInput;
  };

  try {
    body = await request.json();
  } catch {
    return fail("Dữ liệu gửi lên không hợp lệ.");
  }

  const action = body.action || "save-bulk";

  if (action === "create") {
    if (!body.task) return fail("Thiếu thông tin nhiệm vụ.");

    const task = body.task;

    if (!task.ten?.trim()) {
      return fail("Vui lòng nhập tên nhiệm vụ.");
    }

    const assignmentError = await validateAssignee(profile, task);

    if (assignmentError) return fail(assignmentError, 403);

    const values = pickFields(
      task as Record<string, unknown>,
      FULL_EDIT_FIELDS
    );

    const { data, error } = await db
      .from("nhiem_vu")
      .insert({
        ...values,
        created_by: profile.id,
      })
      .select("*")
      .single();

    if (error) return fail(error.message, 500);

    return NextResponse.json({ data });
  }

  if (action !== "save-bulk") {
    return fail("Thao tác không được hỗ trợ.");
  }

  if (!Array.isArray(body.tasks) || body.tasks.length === 0) {
    return fail("Không có nhiệm vụ để lưu.");
  }

  const saved: Record<string, unknown>[] = [];

  for (const task of body.tasks) {
    if (!task.ten?.trim()) continue;

    const values = pickFields(
      task as Record<string, unknown>,
      FULL_EDIT_FIELDS
    );

    if (task.id) {
      const existing = await getTask(task.id);

      if (!existing) {
        return fail(`Không tìm thấy nhiệm vụ ${task.id}.`, 404);
      }

      if (!canManageExistingTask(profile, existing)) {
        return fail(
          `Bạn không có quyền sửa nhiệm vụ: ${String(existing.ten || "")}.`,
          403
        );
      }

      const assignmentError = await validateAssignee(profile, {
        ...existing,
        ...task,
      });

      if (assignmentError) return fail(assignmentError, 403);

      const { data, error } = await db
        .from("nhiem_vu")
        .update(values)
        .eq("id", task.id)
        .select("*")
        .single();

      if (error) return fail(error.message, 500);

      saved.push(data);
    } else {
      const assignmentError = await validateAssignee(profile, task);

      if (assignmentError) return fail(assignmentError, 403);

      const { data, error } = await db
        .from("nhiem_vu")
        .insert({
          ...values,
          created_by: profile.id,
        })
        .select("*")
        .single();

      if (error) return fail(error.message, 500);

      saved.push(data);
    }
  }

  return NextResponse.json({
    message: `Đã lưu ${saved.length} nhiệm vụ.`,
    data: saved,
  });
}

/**
 * PATCH:
 * Cập nhật tiến độ, ngày hoàn thành, sản phẩm và kết quả.
 */
export async function PATCH(request: NextRequest) {
  const { profile, error: authError } = await getActor(request);

  if (authError || !profile) return authError;

  let body: {
    id?: string;
    values?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return fail("Dữ liệu gửi lên không hợp lệ.");
  }

  if (!body.id || !body.values) {
    return fail("Thiếu mã nhiệm vụ hoặc nội dung cập nhật.");
  }

  const existing = await getTask(body.id);

  if (!existing) return fail("Không tìm thấy nhiệm vụ.", 404);

  const isAssigned =
    String(existing.can_bo_tham_muu || "").trim().toLowerCase() ===
    String(profile.ho_ten || "").trim().toLowerCase();

  const isCreator = existing.created_by === profile.id;

  if (!isAdmin(profile) && !isAssigned && !isCreator) {
    return fail("Bạn không có quyền cập nhật nhiệm vụ này.", 403);
  }

  const values = pickFields(body.values, PROGRESS_FIELDS);

  if (Object.keys(values).length === 0) {
    return fail("Không có nội dung cập nhật hợp lệ.");
  }

  const { data, error } = await db
    .from("nhiem_vu")
    .update({
      ...values,
      cap_nhat_tien_do_luc:
        values.cap_nhat_tien_do_luc || new Date().toISOString(),
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return fail(error.message, 500);

  return NextResponse.json({ data });
}

/**
 * DELETE:
 * Admin hoặc người tạo nhiệm vụ được xóa.
 */
export async function DELETE(request: NextRequest) {
  const { profile, error: authError } = await getActor(request);

  if (authError || !profile) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return fail("Thiếu mã nhiệm vụ.");

  const existing = await getTask(id);

  if (!existing) return fail("Không tìm thấy nhiệm vụ.", 404);

  if (!canManageExistingTask(profile, existing)) {
    return fail("Bạn không có quyền xóa nhiệm vụ này.", 403);
  }

  const { error } = await db
    .from("nhiem_vu")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message, 500);

  return NextResponse.json({ message: "Đã xóa nhiệm vụ." });
}
