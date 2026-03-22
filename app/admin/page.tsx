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
  san_pham?: string;
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

  function addRow(){
    setTasks([...tasks,{ten:""}]);
  }

  function update(index:number, field:keyof Task, value:string){
    const newData = [...tasks];
    newData[index][field] = value;

    // reset lĩnh vực con nếu đổi lĩnh vực lớn
    if(field==="linh_vuc_lon"){
      newData[index].linh_vuc_con = "";
    }

    setTasks(newData);
  }

  function tinhTienDo(task:Task){

    if(!task.ngay_giao || !task.ngay_hoan_thanh){
      return "Chưa hoàn thành";
    }

    const giao = new Date(task.ngay_giao);
    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh || "");

    if(ht <= han) return "Hoàn thành đúng hạn";
    return "Hoàn thành quá hạn";
  }

  async function saveAll(){

    const payload = tasks.map(t => {

      const tien_do = tinhTienDo(t);

      return {
        ...t,
        tien_do,
        can_bo: t.can_bo_phu_trach || "",
        thang: new Date().getMonth()+1,
        ghi_chu:
          tien_do==="Hoàn thành đúng hạn"
            ? "dung_han"
            : tien_do==="Hoàn thành quá hạn"
            ? "qua_han"
            : "chua_ht"
      };

    });

    await supabase.from("nhiem_vu").delete().neq("id","");
    await supabase.from("nhiem_vu").insert(payload);

    alert("Đã lưu dữ liệu");
    loadTasks();
  }

  return(

<div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

<header className="bg-blue-900 text-white text-center py-4">

<img src="/logo-doan.png" className="h-20 mx-auto mb-2"/>
<h1 className="text-xl font-bold">HỆ THỐNG QUẢN LÝ</h1>
<p className="text-blue-200">Xin chào, {adminName}</p>

</header>

<main className="flex-1 p-4">

<div className="bg-white rounded-xl p-4">

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-2 rounded mb-4">
Lưu dữ liệu
</button>

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
<select
value={t.linh_vuc_lon||""}
onChange={(e)=>update(i,"linh_vuc_lon",e.target.value)}
className="w-full"
>
<option value="">Chọn</option>
{Object.keys(LINH_VUC).map(lv=>(
<option key={lv}>{lv}</option>
))}
</select>
</td>

<td className="border p-2">
<select
value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}
className="w-full"
>
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

<td className="border p-2 text-center">
{tinhTienDo(t)}
</td>

<td className="border p-2">
<select
value={t.can_bo_tham_muu||""}
onChange={(e)=>update(i,"can_bo_tham_muu",e.target.value)}
className="w-full"
>
<option value="">Chọn</option>
{CAN_BO.map(cb=>(
<option key={cb}>{cb}</option>
))}
</select>
</td>

<td className="border p-2">
<select
value={t.can_bo_phu_trach||""}
onChange={(e)=>update(i,"can_bo_phu_trach",e.target.value)}
className="w-full"
>
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

</div>
);
}