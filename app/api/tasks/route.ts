import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  console.log("BODY NHẬN ĐƯỢC:", body);

  const now = new Date();

  const { data, error } = await supabase
    .from("nhiem_vu")
    .insert([
      {
        ten: body.ten,
        noi_dung: body.noi_dung,
        can_bo_thuc_hien: body.can_bo_thuc_hien,
        ngay_giao: body.ngay_giao,
        han_hoan_thanh: body.han_hoan_thanh,
        linh_vuc_con_id: body.linhVucConId,
        thang: now.getMonth() + 1,
        nam: now.getFullYear(),
      },
    ])
    .select();

  console.log("INSERT DATA:", data);
  console.log("INSERT ERROR:", error);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
