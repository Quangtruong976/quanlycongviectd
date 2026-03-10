"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id?: number;
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

  const [newUser,setNewUser] = useState({
    name:"",
    username:"",
    password:""
  });

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
      .select("*")
      .order("id",{ascending:true});

    if(!error && data){
      setTasks(data);
      calcStats(data);
    }

  }

  function calcStats(list:any[]){

    let dung=0;
    let qua=0;
    let chua=0;

    list.forEach(t=>{

      if(t.tien_do==="Hoàn thành đúng hạn") dung++;
      else if(t.tien_do==="Hoàn thành quá hạn") qua++;
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

  function update(index:number,field:string,value:string){

    const newData=[...tasks];
    newData[index][field as keyof Task]=value;
    setTasks(newData);

  }

  async function saveAll(){

    const {error}=await supabase
      .from("nhiem_vu")
      .insert(tasks);

    if(error){

      alert("Lưu thất bại");

    }else{

      alert("Đã lưu dữ liệu");
      loadTasks();

    }

  }

  async function deleteTask(id:number){

    await supabase
      .from("nhiem_vu")
      .delete()
      .eq("id",id);

    loadTasks();

  }

  async function createUser(){

    if(!newUser.username || !newUser.password){

      alert("Nhập đủ thông tin");
      return;

    }

    const {error}=await supabase
      .from("users")
      .insert([newUser]);

    if(error){

      alert("Tạo user thất bại");

    }else{

      alert("Đã tạo user");
      setNewUser({
        name:"",
        username:"",
        password:""
      });

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

<button onClick={()=>setTab("users")}>
Quản lý user
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


{/* TAB NHẬP NHIỆM VỤ */}

{tab==="tasks" && (

<>

<div className="flex justify-between mb-6">

<h2 className="font-semibold text-blue-700 text-lg">
Quản lý nhiệm vụ
</h2>

<button
onClick={saveAll}
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
>
Lưu dữ liệu
</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full border border-gray-300 text-sm">

<thead>

<tr className="bg-blue-100 text-center font-semibold">

<th className="border p-2">STT</th>
<th className="border p-2">Công việc</th>
<th className="border p-2">Hạn</th>
<th className="border p-2">Tiến độ</th>
<th className="border p-2">Phụ trách</th>
<th className="border p-2">Xóa</th>

</tr>

</thead>

<tbody>

{tasks.map((item,index)=>(
<tr key={index}>

<td className="border p-2 text-center">
{index+1}
</td>

<td
contentEditable
className="border p-2"
onBlur={(e)=>update(index,"ten",e.currentTarget.innerText)}
>
{item.ten}
</td>

<td
contentEditable
className="border p-2 text-center"
onBlur={(e)=>update(index,"han",e.currentTarget.innerText)}
>
{item.han}
</td>

<td className="border p-2">

<select
value={item.tien_do}
onChange={(e)=>update(index,"tien_do",e.target.value)}
className="w-full border rounded px-2 py-1"
>

<option>Chưa hoàn thành</option>
<option>Hoàn thành đúng hạn</option>
<option>Hoàn thành quá hạn</option>
<option>Hoàn thành vượt tiến độ</option>

</select>

</td>

<td
contentEditable
className="border p-2"
onBlur={(e)=>update(index,"phu_trach",e.currentTarget.innerText)}
>
{item.phu_trach}
</td>

<td className="border p-2 text-center">

<button
onClick={()=>item.id && deleteTask(item.id)}
className="text-red-600 font-bold"
>
X
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

<div className="mt-6">

<button
onClick={addRow}
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
>
+ Thêm nhiệm vụ
</button>

</div>

</>

)}


{/* TAB USER */}

{tab==="users" && (

<div className="max-w-xl">

<h2 className="font-semibold text-blue-700 mb-4">
Tạo tài khoản
</h2>

<input
placeholder="Tên"
value={newUser.name}
onChange={(e)=>setNewUser({...newUser,name:e.target.value})}
className="border w-full p-2 mb-3 rounded"
/>

<input
placeholder="Username"
value={newUser.username}
onChange={(e)=>setNewUser({...newUser,username:e.target.value})}
className="border w-full p-2 mb-3 rounded"
/>

<input
placeholder="Password"
value={newUser.password}
onChange={(e)=>setNewUser({...newUser,password:e.target.value})}
className="border w-full p-2 mb-3 rounded"
/>

<button
onClick={createUser}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Tạo user
</button>

</div>

)}


{/* TAB THỐNG KÊ */}

{tab==="stats" && (

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

<div className="bg-blue-100 p-4 rounded text-center">
<p className="text-sm">Tổng nhiệm vụ</p>
<p className="text-2xl font-bold">{stats.total}</p>
</div>

<div className="bg-green-100 p-4 rounded text-center">
<p className="text-sm">Đúng hạn</p>
<p className="text-2xl font-bold">{stats.dungHan}</p>
</div>

<div className="bg-yellow-100 p-4 rounded text-center">
<p className="text-sm">Quá hạn</p>
<p className="text-2xl font-bold">{stats.quaHan}</p>
</div>

<div className="bg-red-100 p-4 rounded text-center">
<p className="text-sm">Chưa hoàn thành</p>
<p className="text-2xl font-bold">{stats.chua}</p>
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