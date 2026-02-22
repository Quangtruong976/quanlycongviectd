import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


/* ===== GET ===== */
/* ===== GET ===== */
export async function GET() {
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
    return NextResponse.json(
      { error: err1 || err2 || err3 },
      { status: 500 }
    );
  }

  return NextResponse.json({
    linhVucLon,
    linhVucCon,
    nhiemVu,
  });
}



/* ===== POST ===== */
export async function POST(req: Request) {
  const body = await req.json();

  const { linhVucLonId, linhVucConId, nhiemVu } = body;

  const { error } = await supabase
    .from("nhiem_vu")
    .insert([
      {
        linh_vuc_lon_id: linhVucLonId,
        linh_vuc_con_id: linhVucConId,
        ten: nhiemVu.ten,
        giao: nhiemVu.giao,
        han: nhiemVu.han,
        san_pham: nhiemVu.sanPham,
        can_bo: nhiemVu.canBo,
        trang_thai: nhiemVu.trangThai,
      },
    ]);

  if (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
