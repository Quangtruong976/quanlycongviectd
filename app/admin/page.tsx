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
  ngay_giao?: string;
  han_hoan_thanh?: string;
  ngay_hoan_thanh?: string;
  tien_do?: string;
  can_bo_tham_muu?: string;
  can_bo_phu_trach?: string;
};

const LINH_VUC = {
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": [
    "Văn phòng",
    "Tuyên giáo",
    "Xây dựng Đoàn"
  ],
  "II. Phong trào - Hội LHTN": [
    "Phong trào",
    "Hội LHTN"
  ],
  "III. Trường học - Hội Sinh viên": [
    "Trường học",
    "Hội Sinh viên"
  ]
};

const CAN_BO = [
  "Nguyễn Văn A",
  "Trần Văn B",
  "Lê Thị C"
];

export default function AdminPage() {

  const router = useRouter();
  const [tasks,setTasks] = useState<Task[]>([]);
  const [adminName,setAdminName] = useState("");

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if(role!=="admin"){
      router.replace("/login");
      return;
    }

    setAdminName(name || "Admin");
    loadTasks();
  },[]);

  async function loadTasks(){
    const {data} = await supabase.from("nhiem_vu").select("*");
    if(data) setTasks(data as Task[]);
  }

  function tinhTienDo(task:Task){

    if(!task.ngay_hoan_thanh){
      return "Chưa hoàn thành";
    }

    if(!task.han_hoan_thanh){
      return "Chưa hoàn thành";
    }

    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh);

    if(ht <= han) return "Hoàn thành đúng hạn";
    return "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:string){

    const newData = [...tasks];
    newData[index][field] = value;

    // reset lĩnh vực con
    if(field==="linh_vuc_lon"){
      newData[index].linh_vuc_con = "";
    }

    // 👉 cập nhật tiến độ ngay khi nhập ngày hoàn thành / hạn
    newData[index].tien_do = tinhTienDo(newData[index]);

    setTasks(newData);
  }

  function addRow(){
    setTasks([...tasks,{ten:""}]);
  }

  async function saveAll(){

    const payload = tasks.map(t => ({

      ...t,
      can_bo: t.can_bo_phu_trach || "",
      thang: new Date().getMonth()+1,

      ghi_chu:
        t.tien_do==="Hoàn thành đúng hạn"
          ? "dung_han"
          : t.tien_do==="Hoàn thành quá hạn"
          ? "qua_han"
          : "chua_ht"

    }));

    await supabase.from("nhiem_vu").delete().neq("id","");
    await supabase.from("nhiem_vu").insert(payload);

    alert("Đã lưu dữ liệu");
    loadTasks();
  }

  return(

<div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

{/* HEADER GIỐNG TRANG KHÁC */}
<header className="bg-blue-900 text-white">

<div className="flex flex-col items-center py-4">

<img src="/logo-doan.png" className="h-20 mb-2"/>

<h1 className="text-xl md:text-2xl font-bold text-center">
HỆ THỐNG QUẢN LÝ THEO DÕI CÔNG VIỆC
</h1>

<p className="text-blue-200 font-semibold">
TỈNH ĐOÀN LÂM ĐỒNG
</p>

</div>

<nav className="bg-blue-800">

<div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">

<Link href="/" className="flex items-center">
<Home size={20}/>
</Link>

<Link href="/tien-do">Theo dõi tiến độ</Link>
<Link href="/thong-ke">Thống kê</Link>

<span className="text-yellow-300">
Xin chào, {adminName}
</span>

<button
onClick={()=>{
localStorage.clear();
router.replace("/login");
}}
>
Đăng xuất
</button>

</div>

</nav>

</header>

<main className="flex-1 p-4">

<div className="bg-white rounded-xl p-4">

<div className="flex justify-between mb-4">

<h2 className="font-semibold text-blue-700">
Quản lý nhiệm vụ
</h2>

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-2 rounded">
Lưu dữ liệu
</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full border text-sm">

<thead className="bg-blue-100 text-center">
<tr>

<th className="border p-2">STT</th>
<th className="border p-2">Lĩnh vực lớn</th>
<th className="border p-2">Lĩnh vực con</th>
<th className="border p-2">Công việc</th>
<th className="border p-2">Ngày giao</th>
<th className="border p-2">Hạn</th>
<th className="border p-2">Ngày HT</th>
<th className="border p-2">Tiến độ</th>
<th className="border p-2">Tham mưu</th>
<th className="border p-2">Phụ trách</th>

</tr>
</thead>

<tbody>

{tasks.map((t,i)=>(

<tr key={i}>

<td className="border p-2 text-center">{i+1}</td>

<td className="border p-2">
<select value={t.linh_vuc_lon||""}
onChange={(e)=>update(i,"linh_vuc_lon",e.target.value)}
className="w-full">
<option value="">Chọn</option>
{Object.keys(LINH_VUC).map(lv=>(
<option key={lv}>{lv}</option>
))}
</select>
</td>

<td className="border p-2">
<select value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}
className="w-full">
<option value="">Chọn</option>
{LINH_VUC[t.linh_vuc_lon as keyof typeof LINH_VUC]?.map(c=>(
<option key={c}>{c}</option>
))}
</select>
</td>

<td className="border p-2">
<input value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}
className="w-full border px-1"/>
</td>

<td className="border p-2">
<input type="date"
value={t.ngay_giao||""}
onChange={(e)=>update(i,"ngay_giao",e.target.value)}
className="w-full"/>
</td>

<td className="border p-2">
<input type="date"
value={t.han_hoan_thanh||""}
onChange={(e)=>update(i,"han_hoan_thanh",e.target.value)}
className="w-full"/>
</td>

<td className="border p-2">
<input type="date"
value={t.ngay_hoan_thanh||""}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}
className="w-full"/>
</td>

<td className="border p-2 text-center font-semibold">
{t.tien_do || "Chưa hoàn thành"}
</td>

<td className="border p-2">
<select value={t.can_bo_tham_muu||""}
onChange={(e)=>update(i,"can_bo_tham_muu",e.target.value)}
className="w-full">
<option value="">Chọn</option>
{CAN_BO.map(cb=>(
<option key={cb}>{cb}</option>
))}
</select>
</td>

<td className="border p-2">
<select value={t.can_bo_phu_trach||""}
onChange={(e)=>update(i,"can_bo_phu_trach",e.target.value)}
className="w-full">
<option value="">Chọn</option>
{CAN_BO.map(cb=>(
<option key={cb}>{cb}</option>
))}
</select>
</td>

</tr>

))}

</tbody>

</table>

</div>

<button onClick={addRow} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
+ Thêm nhiệm vụ
</button>

</div>

</main>

<footer className="bg-blue-900 text-white text-center py-3">
© 2026 Tỉnh đoàn Lâm Đồng
</footer>

</div>
);
}