"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id?: string;
  ten: string;
  han: string;
  tien_do: string;
  phu_trach: string;
};

export default function AdminPage() {

  const router = useRouter();

  const [tasks,setTasks] = useState<Task[]>([]);
  const [adminName,setAdminName] = useState("");
  const [tab,setTab] = useState("tasks");

  const [stats,setStats] = useState({
    total:0,
    dungHan:0,
    quaHan:0,
    chua:0
  });

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
      .select("*");

    if(!error && data){
      setTasks(data as any);
      calcStats(data);
    }

  }

  function calcStats(list:any[]){

    let dung=0;
    let qua=0;
    let chua=0;

    list.forEach(t=>{

      if(t.ghi_chu==="dung_han") dung++;
      else if(t.ghi_chu==="qua_han") qua++;
      else chua++;

    });

    setStats({
      total:list.length,
      dungHan:dung,
      quaHan:qua,
      chua:chua
    });

  }

  function addRow(){

    setTasks([
      ...tasks,
      {
        ten:"",
        han:"",
        tien_do:"Chưa hoàn thành",
        phu_trach:""
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

      ten: t.ten,
      han_hoan_thanh: t.han,
      tien_do: t.tien_do,
      can_bo: t.phu_trach,
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

<button onClick={()=>setTab("tasks")}>
Nhập nhiệm vụ
</button>

<button onClick={()=>setTab("stats")}>
Báo cáo
</button>

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

{tab==="tasks" && (

<>

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

<table className="min-w-full border text-sm">

<thead>
<tr className="bg-blue-100 text-center font-semibold">
<th className="border p-2">STT</th>
<th className="border p-2">Công việc</th>
<th className="border p-2">Hạn</th>
<th className="border p-2">Tiến độ</th>
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
onBlur={(e)=>update(index,"ten",e.currentTarget.innerText)}>
{item.ten}
</td>

<td contentEditable className="border p-2 text-center"
onBlur={(e)=>update(index,"han",e.currentTarget.innerText)}>
{item.han}
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
onBlur={(e)=>update(index,"phu_trach",e.currentTarget.innerText)}>
{item.phu_trach}
</td>

</tr>
))}

</tbody>

</table>

<button
onClick={addRow}
className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
>
+ Thêm nhiệm vụ
</button>

</>

)}

{tab==="stats" && (

<div className="grid grid-cols-2 gap-4">

<div className="bg-blue-100 p-4 text-center">
<p>Tổng</p>
<p>{stats.total}</p>
</div>

<div className="bg-green-100 p-4 text-center">
<p>Đúng hạn</p>
<p>{stats.dungHan}</p>
</div>

<div className="bg-yellow-100 p-4 text-center">
<p>Quá hạn</p>
<p>{stats.quaHan}</p>
</div>

<div className="bg-red-100 p-4 text-center">
<p>Chưa HT</p>
<p>{stats.chua}</p>
</div>

</div>

)}

</div>

</main>

<footer className="bg-blue-900 text-white text-center py-3">
© 2026 Tỉnh đoàn Lâm Đồng
</footer>

</div>

);
}