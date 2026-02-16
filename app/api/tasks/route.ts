import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "tasks.json");

/* ===== GET ===== */
export async function GET() {
  const fileData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileData);

  return NextResponse.json({
    linhVucLon: data.linhVucLon || []
  });
}

/* ===== POST ===== */
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.linhVucLonId || !body.linhVucConId || !body.nhiemVu) {
    return NextResponse.json(
      { error: "Thiếu dữ liệu bắt buộc" },
      { status: 400 }
    );
  }

  const fileData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileData);

  const linhVucLon = data.linhVucLon.find(
    (lv: any) => lv.id === body.linhVucLonId
  );
  if (!linhVucLon)
    return NextResponse.json({ error: "Không tìm thấy lĩnh vực lớn" }, { status: 400 });

  const linhVucCon = linhVucLon.linhVucCon.find(
    (lv: any) => lv.id === body.linhVucConId
  );
  if (!linhVucCon)
    return NextResponse.json({ error: "Không tìm thấy lĩnh vực con" }, { status: 400 });

  const now = new Date();

  linhVucCon.nhiemVu.push({
    id: crypto.randomUUID(),
    ...body.nhiemVu,
    thang: now.getMonth() + 1,
    nam: now.getFullYear(),
    createdAt: now.toISOString()
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  return NextResponse.json({ success: true });
}
