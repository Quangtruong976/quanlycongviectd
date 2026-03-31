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
  thang?: number;
};

const LINH_VUC = {
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"],
  "II. Phong trào - Hội LHTN": ["Phong trào","Hội LHTN"],
  "III. Trường học - Hội Sinh viên": ["Trường học","Hội Sinh viên"]
};

const CAN_BO = ["Nguyễn Văn A","Trần Văn B","Lê Thị C"];

export default function AdminPage(){

  const router = useRouter();

  const [tasks,setTasks] = useState<Task[]>([]);
  const [adminName,setAdminName] = useState("");
  const [thang,setThang] = useState(new Date().getMonth()+1);

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if(role!=="admin"){
      router.replace("/login");
      return;
    }

    setAdminName(name || "Admin");
    loadTasks();
  },[thang]);

  // 🔥 load dữ liệu + sort
  async function loadTasks(){

    const {data,error} = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang",thang)
      .order("linh_vuc_con")
      .order("han_hoan_thanh");

    if(error){
      console.error(error);
      return;
    }

    if(data) setTasks(data as Task[]);
  }

  // 🔥 tính tiến độ chuẩn
  function tinhTienDo(task:Task){

    if(!task.ngay_hoan_thanh) return "Chưa hoàn thành";

    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh || "");

    if(ht <= han) return "Hoàn thành đúng hạn";
    return "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:string){

    const newData = [...tasks];
    (newData[index] as any)[field] = value;

    if(field==="linh_vuc_lon"){
      newData[index].linh_vuc_con = "";
    }

    newData[index].tien_do = tinhTienDo(newData[index]);

    setTasks(newData);
  }

  function addRow(){
    setTasks([...tasks,{ten:"",thang}]);
  }

  // 🔥 SAVE CHUẨN - KHÔNG TRÙNG - KHÔNG LỖI
  async function saveAll(){

    // lọc dòng rỗng
    const validTasks = tasks.filter(t => t.ten && t.ten.trim() !== "");

    if(validTasks.length === 0){
      alert("Chưa có nhiệm vụ để lưu");
      return;
    }

    const payload = validTasks.map(t => {

      const tien_do = tinhTienDo(t);

      return {
        linh_vuc_lon: t.linh_vuc_lon || "",
        linh_vuc_con: t.linh_vuc_con || "",
        ten: t.ten || "",

        ngay_giao: t.ngay_giao || null,
        han_hoan_thanh: t.han_hoan_thanh || null,
        ngay_hoan_thanh: t.ngay_hoan_thanh || null,

        tien_do,

        can_bo_tham_muu: t.can_bo_tham_muu || "",
        can_bo_phu_trach: t.can_bo_phu_trach || "",
        can_bo: t.can_bo_phu_trach || "",

        thang: thang,

        ghi_chu:
          tien_do === "Hoàn thành đúng hạn"
            ? "dung_han"
            : tien_do === "Hoàn thành quá hạn"
            ? "qua_han"
            : "chua_ht",

        san_pham: ""
      };
    });

    // 🔥 xóa dữ liệu tháng cũ
    const { error: deleteError } = await supabase
      .from("nhiem_vu")
      .delete()
      .eq("thang", thang);

    if(deleteError){
      console.error(deleteError);
      alert("Lỗi xóa dữ liệu!");
      return;
    }

    // 🔥 insert lại
    const { error: insertError } = await supabase
      .from("nhiem_vu")
      .insert(payload);

    if(insertError){
      console.error(insertError);
      alert("Lỗi lưu dữ liệu!");
      return;
    }

    alert("Đã lưu dữ liệu tháng " + thang);
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
</div>

<nav className="bg-blue-800">
<div className="flex justify-center gap-6 py-2">

<Link href="/"><Home size={20}/></Link>
<Link href="/tien-do">Theo dõi tiến độ công việc</Link>
<Link href="/thong-ke">Thống kê chi tiết công việc cá nhân</Link>

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

  <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4 md:p-6">

<div className="flex justify-between mb-4">

<select
value={thang}
onChange={(e)=>setThang(Number(e.target.value))}
className="border px-3 py-1"
>
{Array.from({length:12}).map((_,i)=>(
<option key={i} value={i+1}>Tháng {i+1}</option>
))}
</select>

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-1">
Lưu dữ liệu
</button>

</div>

<table className="w-full min-w-[1200px] table-fixed border border-gray-300 text-sm">

<thead className="bg-blue-100">

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

<td className="border p-2">{i+1}</td>

<td className="border p-1">
<select value={t.linh_vuc_lon||""}
onChange={(e)=>update(i,"linh_vuc_lon",e.target.value)}>
<option value="">Chọn</option>
{Object.keys(LINH_VUC).map(lv=><option key={lv}>{lv}</option>)}
</select>
</td>

<td className="border p-1">
<select value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}>
<option value="">Chọn</option>
{LINH_VUC[t.linh_vuc_lon as keyof typeof LINH_VUC]?.map(c=><option key={c}>{c}</option>)}
</select>
</td>

<td className="border p-1 max-w-[250px]">
  <input
    className="w-full break-words"
    value={t.ten||""}
    onChange={(e)=>update(i,"ten",e.target.value)}
  />
</td>

<td className="border p-1">
<input type="date"
value={t.ngay_giao||""}
onChange={(e)=>update(i,"ngay_giao",e.target.value)}/>
</td>

<td className="border p-1">
<input type="date"
value={t.han_hoan_thanh||""}
onChange={(e)=>update(i,"han_hoan_thanh",e.target.value)}/>
</td>

<td className="border p-1">
<input type="date"
value={t.ngay_hoan_thanh||""}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}/>
</td>

<td className="border p-1">{t.tien_do||"Chưa hoàn thành"}</td>

<td className="border p-1">
<select value={t.can_bo_tham_muu||""}
onChange={(e)=>update(i,"can_bo_tham_muu",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border p-1">
<select value={t.can_bo_phu_trach||""}
onChange={(e)=>update(i,"can_bo_phu_trach",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

</tr>

))}

</tbody>

</table>

<button onClick={addRow} className="mt-4 bg-blue-600 text-white px-4 py-2">
+ Thêm nhiệm vụ
</button>

</div>

</main>

</div>
);
}