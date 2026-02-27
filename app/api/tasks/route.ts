import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===== KẾT NỐI SUPABASE ===== */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =====================================================
   GET – LẤY TOÀN BỘ DỮ LIỆU
===================================================== */
export async function GET() {
  try {
    const { data: linhVucLon, error: err1 } = await supabase
      .from("linh_vuc_lon")
      .select("*");

    const { data: linhVucCon, error: err2 } = await supabase
      .from("linh_vuc_con")
      .select("*");

    const { data: nhiemVu, error: err3 } = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("created_at", { ascending: false });

    if (err1 || err2 || err3) {
      console.error(err1 || err2 || err3);
      return NextResponse.json(
        { error: "Lỗi truy vấn dữ liệu" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        linhVucLon: linhVucLon || [],
        linhVucCon: linhVucCon || [],
        nhiemVu: nhiemVu || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST – THÊM NHIỆM VỤ
===================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { linhVucLonId, linhVucConId, nhiemVu } = body;

    if (
      !linhVucLonId ||
      !linhVucConId ||
      !nhiemVu?.ten?.trim()
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("nhiem_vu")
      .insert([
        {
          linh_vuc_lon_id: linhVucLonId,
          linh_vuc_con_id: linhVucConId,
          ten: nhiemVu.ten.trim(),
          giao: nhiemVu.giao || null,
          han: nhiemVu.han || null,
          can_bo: nhiemVu.canBo || "",
          san_pham: nhiemVu.sanPham || "",
          trang_thai: nhiemVu.trangThai || "chua_ht",
        },
      ]);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Không thể lưu nhiệm vụ" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}