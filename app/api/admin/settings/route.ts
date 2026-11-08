
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const allowedSettings: Record<string, (value: string) => boolean> = {
  ten_phan_mem: (value) => value.trim().length > 0 && value.length <= 200,
  ten_co_quan: (value) => value.trim().length > 0 && value.length <= 200,
  so_ngay_nhac_truoc_han: (value) =>
    /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 30,
  canh_bao_qua_han: (value) => ["true", "false"].includes(value),
  so_nhiem_vu_moi_trang: (value) => ["10", "20", "50"].includes(value),
  chu_ky_bao_cao: (value) => ["tuan", "thang", "quy"].includes(value),
};

async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Không có thông tin xác thực." },
        { status: 401 }
      ),
    };
  }

  const token = authorization.slice(7);

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, ho_ten, role, trang_thai")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.trang_thai === "tam_khoa"
  ) {
    return {
      error: NextResponse.json(
        { error: "Bạn không có quyền quản trị hệ thống." },
        { status: 403 }
      ),
    };
  }

  return { user, profile };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if ("error" in auth) return auth.error;

    const { data, error } = await adminClient
      .from("cau_hinh_he_thong")
      .select("*")
      .order("nhom", { ascending: true })
      .order("ma", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: data ?? [],
      admin: auth.profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể tải cấu hình hệ thống.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);

    if ("error" in auth) return auth.error;

    const body = await request.json();
    const updates = body?.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Không có nội dung cấu hình cần lưu." },
        { status: 400 }
      );
    }

    for (const item of updates) {
      if (
        !item ||
        typeof item.ma !== "string" ||
        typeof item.gia_tri !== "string" ||
        !allowedSettings[item.ma] ||
        !allowedSettings[item.ma](item.gia_tri)
      ) {
        return NextResponse.json(
          { error: `Giá trị cấu hình không hợp lệ: ${item?.ma ?? "không xác định"}.` },
          { status: 400 }
        );
      }
    }

    for (const item of updates) {
      const { error } = await adminClient
        .from("cau_hinh_he_thong")
        .update({
          gia_tri: item.gia_tri,
          updated_at: new Date().toISOString(),
          updated_by: auth.user.id,
        })
        .eq("ma", item.ma);

      if (error) {
        return NextResponse.json(
          { error: `Không thể lưu ${item.ma}: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu cấu hình hệ thống.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể lưu cấu hình hệ thống.",
      },
      { status: 500 }
    );
  }
}
