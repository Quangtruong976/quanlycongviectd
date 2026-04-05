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
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"],
  "II. Phong trào - Hội LHTN": ["Phong trào","Hội LHTN"],
  "III. Trường học - Hội Sinh viên": ["Trường học","Hội Sinh viên"]
};

const CAN_BO = [
  "Trương Minh Quang","Trần Diệp Mỹ Dung","H' Hồng","Đoàn Minh Tâm",
  "Trần Việt Anh","Nguyễn Hồ Xuân Quang","Nguyễn Trọng Tùng","Đào Hùng",
  "Châu Yến Phi","Nguyễn Đình Hưng Thịnh","Nguyễn Trọng Văn",
  "Nguyễn Lý Xuân Uyên","Nguyễn Nam Sơn","Nguyễn Linh Phương",
  "Phan Xuân Tấn","Hồ Như Toán","Võ Văn Đồng","Đỗ Ngọc Hà",
  "Nguyễn Thị Thanh Hòa","Bùi Thị Phượng","Trịnh Thị Vỹ Cầm"
];

// 🔴 Chuyển đổi định dạng ngày
function formatDateToDisplay(dateStr?: string) {
  if(!dateStr) return "";
  const [d,m,y] = dateStr.split("/");
  return `${y}-${m}-${d}`;
}

function formatDateToSave(dateStr?: string) {
  if(!dateStr) return "";
  const [y,m,d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function UserVanPhong(){

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
    const {data} = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang",thang)
      .or(`linh_vuc_lon.eq.I. Văn phòng - Tuyên giáo - Xây dựng Đoàn,created_by_user.eq.true`)
      .order("linh_vuc_con")
      .order("han_hoan_thanh");

    if(data){
      const mapped = (data as Task[]).map(t => ({
        ...t,
        isEditing: t.created_by_user ? true : false,
        created_by_user: t.created_by_user || false
      }));
      setTasks(mapped);
    }
  }

  function tinhTienDo(task:Task){
    if(!task.ngay_hoan_thanh) return "Chưa hoàn thành";
    const ht = new Date(formatDateToDisplay(task.ngay_hoan_thanh));
    const han = new Date(formatDateToDisplay(task.han_hoan_thanh || ""));
    if(isNaN(ht.getTime()) || isNaN(han.getTime())) return "Chưa hoàn thành";
    return ht.getTime() - han.getTime() <= 0 ? "Hoàn thành đúng hạn" : "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:any){
    const newData = [...tasks];
    if(!newData[index].isEditing && field !== "san_pham" && field !== "ngay_hoan_thanh") return;
    (newData[index] as any)[field] = value;
    newData[index].tien_do = tinhTienDo(newData[index]);
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
      linh_vuc_lon: "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn",
      linh_vuc_con: "",
      ten: "",
      san_pham: "",
      ngay_giao: "",
      han_hoan_thanh: "",
      ngay_hoan_thanh: "",
      can_bo_phu_trach: "",
      can_bo_tham_muu: "",
      thang,
      created_by_user: true,
      isEditing:true
    }]);
  }

  function deleteRow(index:number){
    if(!tasks[index].created_by_user) return;
    setTasks(tasks.filter((_,i)=>i!==index));
  }

  async function saveAll(){
    for(const t of tasks){
      const payload: any = {
        ...t,
        ngay_hoan_thanh: formatDateToSave(t.ngay_hoan_thanh),
        ngay_giao: formatDateToSave(t.ngay_giao),
        han_hoan_thanh: formatDateToSave(t.han_hoan_thanh),
        tien_do: tinhTienDo(t),
      };
      delete payload.isEditing;

      if(t.id){
        await supabase.from("nhiem_vu").update(payload).eq("id", t.id);
      } else {
        await supabase.from("nhiem_vu").insert(payload);
      }
    }
    await loadTasks();
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
}}>
Đăng xuất
</button>
</div>
</nav>
</header>

<main className="flex-1 flex justify-center p-4">
<div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4">

<div className="flex justify-between mb-4">
<select value={thang} onChange={(e)=>setThang(Number(e.target.value))}
className="border px-3 py-1">
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
<th className="border p-2"></th>
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
<td className="border text-center">
<input type="checkbox" checked={t.selected || false} onChange={e=>update(i,"selected",e.target.checked)}/>
</td>

<td className="border p-2">{i+1}</td>

<td className="border p-1">{t.linh_vuc_lon}</td>

<td className="border p-1">{t.linh_vuc_con}</td>

<td className="border p-1">
<input className={`w-full ${t.created_by_user ? "text-green-700" : ""}`} 
value={t.ten} disabled={!t.created_by_user && !t.isEditing} 
onChange={e=>update(i,"ten",e.target.value)}
placeholder={t.created_by_user ? "" : "(Nhiệm vụ admin)"}/>
</td>

<td className="border p-1">
<input className={`w-full ${!t.created_by_user ? "text-red-500 italic" : "text-green-700"}`} 
value={t.san_pham} 
onChange={e=>update(i,"san_pham",e.target.value)}
placeholder={!t.created_by_user ? "Nhập tên sản phẩm" : ""} 
disabled={!t.isEditing && !t.created_by_user ? false : false}/>
</td>

<td className="border p-1">
<input type="date" className={`w-full ${!t.created_by_user ? "text-red-500" : "text-green-700"}`} 
value={formatDateToDisplay(t.ngay_giao)} 
onChange={e=>update(i,"ngay_giao",e.target.value)} 
disabled={!t.isEditing && !t.created_by_user}/>
</td>

<td className="border p-1">
<input type="date" className={`w-full ${!t.created_by_user ? "text-gray-400" : "text-green-700"}`} 
value={formatDateToDisplay(t.han_hoan_thanh)} 
onChange={e=>update(i,"han_hoan_thanh",e.target.value)} 
disabled={!t.isEditing && !t.created_by_user}/>
</td>

<td className="border p-1">
<input type="date" className={`w-full ${!t.created_by_user ? "text-red-500 italic" : "text-green-700"}`} 
value={formatDateToDisplay(t.ngay_hoan_thanh)} 
onChange={e=>update(i,"ngay_hoan_thanh",e.target.value)} 
placeholder={!t.created_by_user ? "Nhập ngày hoàn thành" : ""} 
disabled={!t.isEditing && !t.created_by_user}/>
</td>

<td className="border text-center">{t.tien_do || "Chưa hoàn thành"}</td>

<td className="border p-1">
<select className={`w-full ${!t.created_by_user ? "text-gray-400" : "text-green-700"}`} 
value={t.can_bo_tham_muu} onChange={e=>update(i,"can_bo_tham_muu",e.target.value)} 
disabled={!t.isEditing && !t.created_by_user}>
<option value="">Chọn</option>{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border p-1">
<select className={`w-full ${!t.created_by_user ? "text-gray-400" : "text-green-700"}`} 
value={t.can_bo_phu_trach} onChange={e=>update(i,"can_bo_phu_trach",e.target.value)} 
disabled={!t.isEditing && !t.created_by_user}>
<option value="">Chọn</option>{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border text-center">
<button onClick={()=>toggleEdit(i)} 
className="bg-yellow-500 text-white px-2 py-1 text-xs">Sửa</button>
</td>

<td className="border text-center">
<button onClick={()=>deleteRow(i)} 
className="bg-red-500 text-white px-2 py-1 text-xs">Xóa</button>
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