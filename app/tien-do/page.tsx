"use client";

import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";

type NhiemVu = {
  id: number;
  linh_vuc_lon: string;
  linh_vuc_con: string;
  ten_nhiem_vu: string;
  han_hoan_thanh: string;
  trang_thai: string;
};

export default function TienDoPage() {
  const [data, setData] = useState<NhiemVu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("nhiem_vu")
        .select("*")
        .order("linh_vuc_lon", { ascending: true });

      if (!error && data) {
        setData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // GROUP 3 TẦNG
  const grouped = data.reduce((acc: any, item) => {
    if (!acc[item.linh_vuc_lon]) {
      acc[item.linh_vuc_lon] = {};
    }

    if (!acc[item.linh_vuc_lon][item.linh_vuc_con]) {
      acc[item.linh_vuc_lon][item.linh_vuc_con] = [];
    }

    acc[item.linh_vuc_lon][item.linh_vuc_con].push(item);

    return acc;
  }, {});

  return (
    <Layout>
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
          THEO DÕI TIẾN ĐỘ CÔNG VIỆC
        </h2>

        {loading && <p>Đang tải dữ liệu...</p>}

        {!loading &&
          Object.keys(grouped).map((lvLon) => (
            <div key={lvLon} className="mb-6 border rounded-xl p-4 bg-blue-50">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                {lvLon}
              </h3>

              {Object.keys(grouped[lvLon]).map((lvCon) => (
                <div
                  key={lvCon}
                  className="mb-4 bg-white rounded-lg shadow p-4"
                >
                  <h4 className="font-semibold text-blue-700 mb-3">
                    {lvCon}
                  </h4>

                  <table className="w-full text-sm border">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="border p-2 text-left">
                          Nhiệm vụ
                        </th>
                        <th className="border p-2">
                          Hạn hoàn thành
                        </th>
                        <th className="border p-2">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[lvLon][lvCon].map((nv: NhiemVu) => (
                        <tr key={nv.id} className="hover:bg-gray-50">
                          <td className="border p-2">
                            {nv.ten_nhiem_vu}
                          </td>
                          <td className="border p-2 text-center">
                            {nv.han_hoan_thanh}
                          </td>
                          <td className="border p-2 text-center">
                            {nv.trang_thai}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
      </div>
    </Layout>
  );
}