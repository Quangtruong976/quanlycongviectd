"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";

type RawItem = {
  can_bo: string;
  ghi_chu: string | null;
  thang: number;
};

type ThongKe = {
  can_bo: string;
  tong: number;
  vuot: number;
  dungHan: number;
  quaHan: number;
  chuaHT: number;
  diem: number;
  xepLoai: string;
};

export default function ThongKePage() {
  const [thang, setThang] = useState("ALL");
  const [data, setData] = useState<ThongKe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [thang]);

  const loadData = async () => {
    setLoading(true);

    let query = supabase
      .from("nhiem_vu")
      .select("can_bo, ghi_chu, thang");

    if (thang !== "ALL") {
      query = query.eq("thang", Number(thang));
    }

    const { data: raw } = await query;
    if (!raw) {
      setData([]);
      setLoading(false);
      return;
    }

    const map: Record<string, ThongKe> = {};

    (raw as RawItem[]).forEach((item) => {
      if (!map[item.can_bo]) {
        map[item.can_bo] = {
          can_bo: item.can_bo,
          tong: 0,
          vuot: 0,
          dungHan: 0,
          quaHan: 0,
          chuaHT: 0,
          diem: 0,
          xepLoai: "",
        };
      }

      const cb = map[item.can_bo];
      cb.tong++;

      switch (item.ghi_chu) {
        case "vuot_tien_do":
          cb.vuot++;
          break;
        case "dung_han":
          cb.dungHan++;
          break;
        case "qua_han":
          cb.quaHan++;
          break;
        default:
          cb.chuaHT++;
      }
    });

    const result = Object.values(map).map((cb) => {
      const hoanThanh = cb.vuot + cb.dungHan + cb.quaHan;
      const diem =
        cb.tong > 0 ? Math.round((hoanThanh / cb.tong) * 100) : 0;

      let xepLoai = "";
      if (diem >= 90 && cb.chuaHT === 0)
        xepLoai = "Hoàn thành xuất sắc";
      else if (diem >= 70)
        xepLoai = "Hoàn thành tốt";
      else if (diem >= 50)
        xepLoai = "Hoàn thành nhiệm vụ";
      else xepLoai = "Không hoàn thành";

      return { ...cb, diem, xepLoai };
    });

    setData(result.sort((a, b) => b.diem - a.diem));
    setLoading(false);
  };

  return (
    <Layout>
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6">

        {/* Nội dung bảng giữ nguyên như bạn đang dùng */}

      </div>
    </Layout>
  );
}