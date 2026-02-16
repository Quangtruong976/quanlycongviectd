import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


/* ===== GET ===== */
export async function GET() {
  const { data: linhVucLon, error: err1 } = await supabase
    .from("linh_vuc_lon")
    .select("*");

  const { data: linhVucCon, error: err2 } = await supabase
    .from("linh_vuc_con")
    .select("*");

  if (err1 || err2) {
    return NextResponse.json({ error: err1 || err2 }, { status: 500 });
  }

  return NextResponse.json({
    linhVucLon,
    linhVucCon,
  });
}


/* ===== POST ===== */
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.linhVucConId || !body.nhiemVu) {
    return NextResponse.json(
      { error: "Thiếu dữ liệu bắt buộc" },
      { status: 400 }
    );
  }

  const now = new Date();

  const { error } = await supabase
    .from("nhiem_vu")
    .insert([
      {
        ...body.nhiemVu,
        linh_vuc_con_id: body.linhVucConId,
        thang: now.getMonth() + 1,
        nam: now.getFullYear(),
      },
    ]);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
