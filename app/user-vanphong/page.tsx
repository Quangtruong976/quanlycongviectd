"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
};

const LINH_VUC_CON = ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"];

const CAN_BO = [
  "Trương Minh Quang","Trần Diệp Mỹ Dung","H' Hồng","Đoàn Minh Tâm",
  "Trần Việt Anh","Nguyễn Hồ Xuân Quang","Nguyễn Trọng Tùng","Đào Hùng",
  "Châu Yến Phi","Nguyễn Đình Hưng Thịnh","Nguyễn Trọng Văn",
  "Nguyễn Lý Xuân Uyên","Nguyễn Nam Sơn","Nguyễn Linh Phương",
  "Phan Xuân Tấn","Hồ Như Toán","Võ Văn Đồng","Đỗ Ngọc Hà",
  "Nguyễn Thị Thanh Hòa","Bùi Thị Phượng","Trịnh Thị Vỹ Cầm"
];

export default function Page(){

  const router = useRouter();

  const [tasks,setTasks] = useState<Task[]>([]);
  const [name,setName] = useState("");
  const [thang,setThang] = useState(new Date().getMonth()+1);

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");

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
      .in("linh_vuc_con", LINH_VUC_CON)
      .order("han_hoan_thanh");

    setTasks(data || []);
  }

  function tinhTienDo(t:Task){
    if(!t.ngay_hoan_thanh) return "Chưa hoàn thành";

    const ht = new Date(t.ngay_hoan_thanh);
    const han = new Date(t.han_hoan_thanh || "");

    return ht <= han ? "Đúng hạn" : "Quá hạn";
  }

  function update(i:number, field:keyof Task, value:any){
    const newData = [...tasks];
    (newData[i] as any)[field] = value;
    setTasks(newData);
  }

  function addTask(){
    setTasks([
      ...tasks,
      {
        ten:"",
        linh_vuc_lon:"I. Văn phòng - Tuyên giáo - Xây dựng Đoàn",
        linh_vuc_con:"",
        thang
      }
    ]);
  }

  function deleteRow(i:number){
    if(tasks[i].id) return;
    setTasks(tasks.filter((_,idx)=>idx!==i));
  }

  async function saveAll(){

    for(const t of tasks){

      if(!t.ten) continue;

      if(t.id){
        await supabase.from("nhiem_vu")
        .update({
          san_pham:t.san_pham,
          ngay_hoan_thanh:t.ngay_hoan_thanh,
          tien_do:tinhTienDo(t)
        })
        .eq("id",t.id);

      } else {

        await supabase.from("nhiem_vu").insert({
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
<h1 className="text-xl font-bold">HỆ THỐNG QUẢN LÝ</h1>
<p className="text-yellow-300">User: {name}</p>
</div>

<nav className="bg-blue-800 flex justify-center gap-6 py-2">
<Link href="/"><Home size={20}/></Link>
<button onClick={()=>{localStorage.clear();router.replace("/login")}}>
Đăng xuất
</button>
</nav>
</header>

<main className="flex-1 p-4">

<div className="bg-white rounded-2xl p-4">

<div className="flex justify-between mb-4">
<select value={thang} onChange={(e)=>setThang(Number(e.target.value))}>
{Array.from({length:12}).map((_,i)=>(
<option key={i} value={i+1}>Tháng {i+1}</option>
))}
</select>

<button onClick={saveAll} className="bg-green-600 text-white px-3 py-1">
Lưu
</button>
</div>

<table className="w-full border text-sm">
<thead className="bg-blue-100">
<tr>
<th>STT</th>
<th>Lĩnh vực</th>
<th>Công việc</th>
<th>Sản phẩm</th>
<th>Ngày giao</th>
<th>Hạn</th>
<th>Ngày HT</th>
<th>Tiến độ</th>
<th>Sửa</th>
<th>Xóa</th>
</tr>
</thead>

<tbody>

{tasks.map((t,i)=>{

const isUser = !t.id;

return(
<tr key={i} className={isUser ? "text-blue-600 font-semibold" : "text-gray-400"}>

<td>{i+1}</td>

<td>
{isUser ? (
<select value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}>
<option value="">Chọn</option>
{LINH_VUC_CON.map(lv=><option key={lv}>{lv}</option>)}
</select>
) : t.linh_vuc_con}
</td>

<td>
{isUser ? (
<input placeholder="Nhập công việc..." value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}/>
) : t.ten}
</td>

<td>
<input
placeholder="Nhập sản phẩm..."
className="placeholder-red-400"
value={t.san_pham||""}
onChange={(e)=>update(i,"san_pham",e.target.value)}
/>
</td>

<td className={!t.ngay_giao ? "text-gray-300" : ""}>
{t.ngay_giao || "Chưa nhập"}
</td>

<td className={!t.han_hoan_thanh ? "text-gray-300" : ""}>
{t.han_hoan_thanh || "Chưa nhập"}
</td>

<td>
{t.ngay_hoan_thanh ? (
<input type="date"
value={t.ngay_hoan_thanh}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}/>
) : (
<input
type="text"
placeholder="Nhập ngày hoàn thành"
className="placeholder-red-400"
onFocus={(e)=>e.target.type="date"}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}
/>
)}
</td>

<td>{t.tien_do || tinhTienDo(t)}</td>

<td>
{isUser && (
<button className="bg-yellow-500 text-white px-2 py-1 text-xs">
Sửa
</button>
)}
</td>

<td>
{isUser && (
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

<button onClick={addTask} className="mt-4 bg-blue-600 text-white px-4 py-2">
+ Thêm nhiệm vụ
</button>

</div>
</main>
</div>
);
}