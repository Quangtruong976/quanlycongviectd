"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type Task = {
  id?: string;
  linh_vuc_lon?: string;
  linh_vuc_con?: string;
  ten: string;
  san_pham?: string;
  ngay_giao?: string;
  han_hoan_thanh?: string;
  ngay_hoan_thanh?: string;
  tien_do?: string;
  can_bo_tham_muu?: string;
  can_bo_phu_trach?: string;
  thang?: number;
  selected?: boolean;
  isEditing?: boolean;
  created_by_user?: boolean;
};

const LINH_VUC = {
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"]
};

const CAN_BO = [
  "Trương Minh Quang","Trần Diệp Mỹ Dung","H' Hồng","Đoàn Minh Tâm",
  "Trần Việt Anh","Nguyễn Hồ Xuân Quang","Nguyễn Trọng Tùng","Đào Hùng",
  "Châu Yến Phi","Nguyễn Đình Hưng Thịnh","Nguyễn Trọng Văn",
  "Nguyễn Lý Xuân Uyên","Nguyễn Nam Sơn","Nguyễn Linh Phương",
  "Phan Xuân Tấn","Hồ Như Toán","Võ Văn Đồng","Đỗ Ngọc Hà",
  "Nguyễn Thị Thanh Hòa","Bùi Thị Phượng","Trịnh Thị Vỹ Cầm"
];

export default function UserVanPhongPage(){
  const router = useRouter();

  const [tasks,setTasks] = useState<Task[]>([]);
  const [userName,setUserName] = useState("");
  const [thang,setThang] = useState(new Date().getMonth()+1);

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if(role!=="user"){
      router.replace("/login");
      return;
    }

    setUserName(name || "User");
    loadTasks();
  },[thang]);

  async function loadTasks(){
    // 🔹 Nhiệm vụ admin lĩnh vực Văn phòng
    const { data: adminTasks } = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("linh_vuc_lon", "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn")
      .eq("thang", thang);

    // 🔹 Nhiệm vụ user đã tạo
    const { data: userTasks } = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("created_by_user", true)
      .eq("thang", thang);

    const allTasks = [...(adminTasks||[]), ...(userTasks||[])].map(t=>({
      ...t,
      isEditing: false
    }));

    setTasks(allTasks);
  }

  function tinhTienDo(task:Task){
    if(!task.ngay_hoan_thanh) return "Chưa hoàn thành";
    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh || "");
    if(isNaN(ht.getTime()) || isNaN(han.getTime())) return "Chưa hoàn thành";
    return ht.getTime() - han.getTime() <= 0
      ? "Hoàn thành đúng hạn"
      : "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:any){
    const newData = [...tasks];
    (newData[index] as any)[field] = value;

    if(field==="linh_vuc_lon"){
      newData[index].linh_vuc_con = "";
    }

    if(field==="ngay_hoan_thanh" || field==="san_pham"){
      newData[index].tien_do = tinhTienDo(newData[index]);
    }

    setTasks(newData);
  }

  function toggleEdit(index:number){
    const newData = [...tasks];
    newData[index].isEditing = !newData[index].isEditing;
    setTasks(newData);
  }

  function addRow(){
    setTasks([...tasks,{
      id: undefined,
      ten: "",
      thang,
      isEditing: true,
      created_by_user: true
    }]);
  }

  function deleteRow(index:number){
    const task = tasks[index];
    if(task.created_by_user){
      supabase.from("nhiem_vu").delete().eq("id", task.id);
      const newTasks = tasks.filter((_,i)=>i!==index);
      setTasks(newTasks);
    }
  }

  async function saveAll(){
    for(const t of tasks){
      const payload = {
        ...t,
        tien_do: tinhTienDo(t)
      };

      if(t.id){
        await supabase.from("nhiem_vu").update(payload).eq("id", t.id);
      }else{
        await supabase.from("nhiem_vu").insert(payload);
      }
    }
    loadTasks();
    alert("Đã lưu thay đổi");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">
      <header className="bg-blue-900 text-white">
        <div className="flex flex-col items-center py-4">
          <img src="/logo-doan.png" className="h-20 mb-2"/>
          <h1 className="text-xl font-bold text-center">
            HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
          </h1>
          <p className="text-blue-200 font-semibold">
            TỈNH ĐOÀN LÂM ĐỒNG
          </p>
          <p className="text-yellow-300 text-sm mt-1">
            Chào mừng: {userName}
          </p>
        </div>

        <nav className="bg-blue-800">
          <div className="flex justify-center gap-6 py-2">
            <Link href="/"><Home size={20}/></Link>
            <Link href="/tien-do">Theo dõi tiến độ công việc</Link>
            <Link href="/thong-ke"> Thống kê chi tiết công việc cá nhân</Link>
            <button onClick={()=>{
              localStorage.clear();
              router.replace("/login");
            }}>Đăng xuất</button>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex justify-center p-4">
        <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4">
          <div className="flex justify-between mb-4">
            <select value={thang} onChange={e=>setThang(Number(e.target.value))} className="border px-3 py-1">
              {Array.from({length:12}).map((_,i)=>(
                <option key={i} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button onClick={addRow} className="bg-blue-600 text-white px-4 py-1">
                + Thêm nhiệm vụ
              </button>
              <button onClick={saveAll} className="bg-green-600 text-white px-4 py-1">
                Lưu
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1600px] border text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="border p-2">STT</th>
                  <th className="border p-2">Lĩnh vực lớn</th>
                  <th className="border p-2">Lĩnh vực con</th>
                  <th className="border p-2">Công việc</th>
                  <th className="border p-2">Sản phẩm</th>
                  <th className="border p-2">Ngày giao</th>
                  <th className="border p-2">Hạn</th>
                  <th className="border p-2">Ngày HT</th>
                  <th className="border p-2">Tiến độ</th>
                  <th className="border p-2">Tham mưu</th>
                  <th className="border p-2">Phụ trách</th>
                  <th className="border p-2">Sửa</th>
                  <th className="border p-2">Xóa</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((t,i)=>(
                  <tr key={i}>
                    <td className="border p-2">{i+1}</td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <select value={t.linh_vuc_lon} onChange={e=>update(i,"linh_vuc_lon",e.target.value)}>
                          <option value="">Chọn</option>
                          {Object.keys(LINH_VUC).map(lv=><option key={lv}>{lv}</option>)}
                        </select>
                      ) : (
                        <span className="text-gray-400">{t.linh_vuc_lon}</span>
                      )}
                    </td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <select value={t.linh_vuc_con} onChange={e=>update(i,"linh_vuc_con",e.target.value)}>
                          <option value="">Chọn</option>
                          {LINH_VUC[t.linh_vuc_lon as keyof typeof LINH_VUC]?.map(c=><option key={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className="text-gray-400">{t.linh_vuc_con}</span>
                      )}
                    </td>
                    <td className={`border p-1 ${t.created_by_user ? "text-green-600" : ""}`}>
                      {t.created_by_user ? t.ten : <span className="text-gray-400">{t.ten}</span>}
                      {t.created_by_user && "*"}
                    </td>
                    <td className={`border p-1`}>
                      <input 
                        value={t.san_pham||""} 
                        onChange={e=>update(i,"san_pham",e.target.value)}
                        placeholder={t.created_by_user ? "Nhập sản phẩm" : "Nhập sản phẩm"}
                        className={`w-full ${t.created_by_user ? "text-green-600" : "text-red-500 placeholder-red-500"}`}
                      />
                    </td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <input type="date" value={t.ngay_giao||""} onChange={e=>update(i,"ngay_giao",e.target.value)} className="w-full"/>
                      ) : <span className="text-gray-400">{t.ngay_giao||""}</span>}
                    </td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <input type="date" value={t.han_hoan_thanh||""} onChange={e=>update(i,"han_hoan_thanh",e.target.value)} className="w-full"/>
                      ) : <span className="text-gray-400">{t.han_hoan_thanh||""}</span>}
                    </td>
                    <td className="border p-1">
                      <input 
                        type="date" 
                        value={t.ngay_hoan_thanh||""} 
                        onChange={e=>update(i,"ngay_hoan_thanh",e.target.value)}
                        placeholder="Nhập ngày hoàn thành"
                        className={`w-full ${t.created_by_user ? "text-green-600" : "text-red-500 placeholder-red-500"}`}
                      />
                    </td>
                    <td className="border text-center">{t.tien_do||"Chưa hoàn thành"}</td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <select value={t.can_bo_tham_muu||""} onChange={e=>update(i,"can_bo_tham_muu",e.target.value)}>
                          <option value="">Chọn</option>
                          {CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
                        </select>
                      ) : <span className="text-gray-400">{t.can_bo_tham_muu}</span>}
                    </td>
                    <td className="border p-1">
                      {t.created_by_user ? (
                        <select value={t.can_bo_phu_trach||""} onChange={e=>update(i,"can_bo_phu_trach",e.target.value)}>
                          <option value="">Chọn</option>
                          {CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
                        </select>
                      ) : <span className="text-gray-400">{t.can_bo_phu_trach}</span>}
                    </td>
                    <td className="border text-center">
                      {t.created_by_user && <button onClick={()=>toggleEdit(i)} className="bg-yellow-500 text-white px-2 py-1 text-xs">{t.isEditing ? "Khóa" : "Sửa"}</button>}
                    </td>
                    <td className="border text-center">
                      {t.created_by_user && <button onClick={()=>deleteRow(i)} className="bg-red-500 text-white px-2 py-1 text-xs">Xóa</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}