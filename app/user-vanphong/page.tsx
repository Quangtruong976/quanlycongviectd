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

export default function UserVanPhong(){

  const router = useRouter();

  const [tasks,setTasks] = useState<Task[]>([]);
  const [name,setName] = useState("");
  const [thang,setThang] = useState(new Date().getMonth()+1);

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("name");

    if(role !== "user"){
      router.replace("/login");
      return;
    }

    setName(email || "User");
    loadTasks();
  },[thang]);

  async function loadTasks(){
    const {data} = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang",thang)
      .in("linh_vuc_con", ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"])
      .order("han_hoan_thanh");

    setTasks((data as Task[]) || []);
  }

  function tinhTienDo(task:Task){
    if(!task.ngay_hoan_thanh) return "Chưa hoàn thành";

    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh || "");

    if(isNaN(ht.getTime()) || isNaN(han.getTime())) return "Chưa hoàn thành";

    return ht <= han ? "Hoàn thành đúng hạn" : "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:any){

    const isNew = !tasks[index].id;

    // ❌ task admin → chỉ sửa 2 ô
    if(!isNew && field !== "san_pham" && field !== "ngay_hoan_thanh"){
      return;
    }

    const newData = [...tasks];
    (newData[index] as any)[field] = value;
    newData[index].tien_do = tinhTienDo(newData[index]);

    setTasks(newData);
  }

  function addRow(){
    setTasks([...tasks,{
      id: undefined,
      ten:"",
      thang,
      isEditing:true
    }]);
  }

  function deleteRow(index:number){
    if(tasks[index].id) return; // ❌ không xóa admin
    setTasks(tasks.filter((_,i)=>i!==index));
  }

  async function saveAll(){

    for(const t of tasks){

      if(!t.ten) continue;

      if(t.id){
        // chỉ update 2 ô
        await supabase
          .from("nhiem_vu")
          .update({
            san_pham: t.san_pham,
            ngay_hoan_thanh: t.ngay_hoan_thanh,
            tien_do: tinhTienDo(t)
          })
          .eq("id", t.id);
      } else {
        // thêm mới → có (*)
        await supabase
          .from("nhiem_vu")
          .insert({
            ...t,
            ten: t.ten + " (*)"
          });
      }
    }

    alert("Đã lưu");
    loadTasks();
  }

  return(

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
User: {name}
</p>
</div>

<nav className="bg-blue-800">
<div className="flex justify-center gap-6 py-2">
<Link href="/"><Home size={20}/></Link>
<Link href="/tien-do">Theo dõi tiến độ công việc</Link>

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

<select value={thang}
onChange={(e)=>setThang(Number(e.target.value))}
className="border px-3 py-1">
{Array.from({length:12}).map((_,i)=>(
<option key={i} value={i+1}>Tháng {i+1}</option>
))}
</select>

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-1">
Lưu
</button>

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
<th className="border p-2">Xóa</th>
</tr>
</thead>

<tbody>

{tasks.map((t,i)=>{

const isNew = !t.id;

return(

<tr key={i}
className={!isNew ? "text-gray-400" : "text-blue-600 font-semibold"}>

<td className="border p-2">{i+1}</td>

<td className="border p-1">{t.linh_vuc_lon}</td>

<td className="border p-1">
{isNew ? (
<select value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}>
<option value="">Chọn</option>
{LINH_VUC["I. Văn phòng - Tuyên giáo - Xây dựng Đoàn"].map(c=>
<option key={c}>{c}</option>
)}
</select>
) : t.linh_vuc_con}
</td>

<td className="border p-1">
{isNew ? (
<input className="w-full"
value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}/>
) : t.ten}
</td>

<td className="border p-1">
<input
className="w-full placeholder-red-400"
placeholder="Nhập sản phẩm..."
value={t.san_pham||""}
onChange={(e)=>update(i,"san_pham",e.target.value)}
/>
</td>

<td className={`border p-1 ${!t.ngay_giao ? "text-gray-300" : ""}`}>
{t.ngay_giao || "Chưa nhập"}
</td>

<td className={`border p-1 ${!t.han_hoan_thanh ? "text-gray-300" : ""}`}>
{t.han_hoan_thanh || "Chưa nhập"}
</td>

<td className="border p-1">
<input
type={t.ngay_hoan_thanh ? "date" : "text"}
placeholder="Nhập ngày hoàn thành"
className={`w-full placeholder-red-400 ${
t.ngay_hoan_thanh ? "text-black" : "text-red-400"
}`}
value={t.ngay_hoan_thanh||""}
onFocus={(e)=>{
if(!t.ngay_hoan_thanh){
e.target.type="date";
}
}}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}
/>
</td>

<td className="border text-center">
{t.tien_do || tinhTienDo(t)}
</td>

<td className="border p-1">{t.can_bo_tham_muu}</td>
<td className="border p-1">{t.can_bo_phu_trach}</td>

<td className="border text-center">
{isNew && (
<button onClick={()=>deleteRow(i)}
className="bg-red-500 text-white px-2 py-1 text-xs">
Xóa
</button>
)}
</td>

</tr>

);
})}

</tbody>
</table>

</div>

<button onClick={addRow} className="mt-4 bg-blue-600 text-white px-4 py-2">
+ Thêm nhiệm vụ
</button>

</div>

</main>
</div>
);
}