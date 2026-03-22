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
  tien_do: string;
  can_bo_tham_muu?: string;
  can_bo_phu_trach?: string;
};

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

    const {data,error} = await supabase
      .from("nhiem_vu")
      .select("*")
      .order("created_at",{ascending:true});

    if(!error && data){
      setTasks(data as Task[]);
    }

  }

  function addRow(){

    setTasks([
      ...tasks,
      {
        ten:"",
        tien_do:"Chưa hoàn thành"
      }
    ]);

  }

  function update(index:number, field:keyof Task, value:string){

    const newData = [...tasks];
    newData[index][field] = value;
    setTasks(newData);

  }

  async function saveAll(){

    const payload = tasks.map(t => ({

      linh_vuc_lon: t.linh_vuc_lon || "",
      linh_vuc_con: t.linh_vuc_con || "",
      ten: t.ten,
      ngay_giao: t.ngay_giao || "",
      han_hoan_thanh: t.han_hoan_thanh || "",
      ngay_hoan_thanh: t.ngay_hoan_thanh || "",
      san_pham: t.san_pham || "",
      tien_do: t.tien_do,
      can_bo_tham_muu: t.can_bo_tham_muu || "",
      can_bo_phu_trach: t.can_bo_phu_trach || "",
      can_bo: t.can_bo_phu_trach || "",
      thang: new Date().getMonth() + 1,

      ghi_chu:
        t.tien_do === "Hoàn thành đúng hạn"
          ? "dung_han"
          : t.tien_do === "Hoàn thành quá hạn"
          ? "qua_han"
          : "chua_ht"

    }));

    await supabase.from("nhiem_vu").delete().neq("id","");

    const {error}=await supabase
      .from("nhiem_vu")
      .insert(payload);

    if(error){
      alert("Lưu thất bại");
    }else{
      alert("Đã lưu dữ liệu");
      loadTasks();
    }

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

</div>

<nav className="bg-blue-800">

<div className="flex justify-center items-center gap-6 py-2 font-semibold">

<Link href="/">
<Home size={20}/>
</Link>

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

<main className="flex-1 flex justify-center p-4">

<div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-6">

<div className="flex justify-between mb-6">

<h2 className="font-semibold text-blue-700 text-lg">
Quản lý nhiệm vụ
</h2>

<button
onClick={saveAll}
className="bg-green-600 text-white px-4 py-2 rounded"
>
Lưu dữ liệu
</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full border text-sm">

<thead>
<tr className="bg-blue-100 text-center font-semibold">

<th className="border p-2">STT</th>
<th className="border p-2">Lĩnh vực lớn</th>
<th className="border p-2">Lĩnh vực con</th>
<th className="border p-2">Công việc</th>
<th className="border p-2">Ngày giao</th>
<th className="border p-2">Hạn</th>
<th className="border p-2">Ngày HT</th>
<th className="border p-2">Sản phẩm</th>
<th className="border p-2">Tiến độ</th>
<th className="border p-2">Tham mưu</th>
<th className="border p-2">Phụ trách</th>

</tr>
</thead>

<tbody>

{tasks.map((item,index)=>(
<tr key={index}>

<td className="border p-2 text-center">
{index+1}
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"linh_vuc_lon",e.currentTarget.innerText)}>
{item.linh_vuc_lon || ""}
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"linh_vuc_con",e.currentTarget.innerText)}>
{item.linh_vuc_con || ""}
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"ten",e.currentTarget.innerText)}>
{item.ten}
</td>

<td contentEditable className="border p-2 text-center"
onBlur={(e)=>update(index,"ngay_giao",e.currentTarget.innerText)}>
{item.ngay_giao || ""}
</td>

<td contentEditable className="border p-2 text-center"
onBlur={(e)=>update(index,"han_hoan_thanh",e.currentTarget.innerText)}>
{item.han_hoan_thanh || ""}
</td>

<td contentEditable className="border p-2 text-center"
onBlur={(e)=>update(index,"ngay_hoan_thanh",e.currentTarget.innerText)}>
{item.ngay_hoan_thanh || ""}
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"san_pham",e.currentTarget.innerText)}>
{item.san_pham || ""}
</td>

<td className="border p-2">
<select
value={item.tien_do}
onChange={(e)=>update(index,"tien_do",e.target.value)}
className="w-full border"
>
<option>Chưa hoàn thành</option>
<option>Hoàn thành đúng hạn</option>
<option>Hoàn thành quá hạn</option>
</select>
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"can_bo_tham_muu",e.currentTarget.innerText)}>
{item.can_bo_tham_muu || ""}
</td>

<td contentEditable className="border p-2"
onBlur={(e)=>update(index,"can_bo_phu_trach",e.currentTarget.innerText)}>
{item.can_bo_phu_trach || ""}
</td>

</tr>
))}

</tbody>

</table>

</div>

<button
onClick={addRow}
className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
>
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