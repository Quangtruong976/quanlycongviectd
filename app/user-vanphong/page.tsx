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
    const n = localStorage.getItem("name");

    if(role!=="user"){
      router.replace("/login");
      return;
    }

    setName(n || "User");
    loadTasks();
  },[thang]);

  async function loadTasks(){
    const {data} = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang",thang)
      .eq("linh_vuc_lon","I. Văn phòng - Tuyên giáo - Xây dựng Đoàn")
      .order("linh_vuc_con")
      .order("han_hoan_thanh");

    if(data){
      setTasks((data as Task[]).map(t => ({
        ...t,
        isEditing:false
      })));
    }
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

  // 🔥 PHÂN QUYỀN
  function update(index:number, field:keyof Task, value:any){

    const newData = [...tasks];
    const t = newData[index];

    // ADMIN TASK → chỉ sửa 2 field
    if(!t.created_by_user){
      if(field !== "san_pham" && field !== "ngay_hoan_thanh" && field !== "selected") return;
    }

    // USER TASK → phải bật edit
    if(t.created_by_user && !t.isEditing && field !== "selected") return;

    (t as any)[field] = value;

    if(field==="linh_vuc_lon"){
      t.linh_vuc_con = "";
    }

    t.tien_do = tinhTienDo(t);

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
      ten:"",
      linh_vuc_lon:"I. Văn phòng - Tuyên giáo - Xây dựng Đoàn",
      linh_vuc_con:"",
      san_pham:"",
      ngay_giao:"",
      han_hoan_thanh:"",
      ngay_hoan_thanh:"",
      can_bo_tham_muu:"",
      can_bo_phu_trach:"",
      thang,
      isEditing:true,
      created_by_user:true
    }]);
  }

  function deleteRow(index:number){
    const t = tasks[index];
    if(!t.created_by_user) return;
    setTasks(tasks.filter((_,i)=>i!==index));
  }

  // 🔥 SAVE CHUẨN (GIỐNG ADMIN)
  async function saveAll(){

    const validTasks = tasks.filter(t => t.ten && t.ten.trim() !== "");

    const { data: existing } = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang", thang)
      .eq("linh_vuc_lon","I. Văn phòng - Tuyên giáo - Xây dựng Đoàn");

    // DELETE
    const toDelete = existing?.filter(e =>
      e.created_by_user &&
      !validTasks.some(t => t.id === e.id)
    );

    if(toDelete){
      for(const d of toDelete){
        await supabase.from("nhiem_vu").delete().eq("id", d.id);
      }
    }

    // UPDATE + INSERT
    for(const t of validTasks){

      if(!t.created_by_user){
        await supabase
          .from("nhiem_vu")
          .update({
            san_pham: t.san_pham || "",
            ngay_hoan_thanh: t.ngay_hoan_thanh || null,
            tien_do: tinhTienDo(t)
          })
          .eq("id", t.id);
        continue;
      }

      const payload = {
        linh_vuc_lon: t.linh_vuc_lon || "",
        linh_vuc_con: t.linh_vuc_con || "",
        ten: t.ten,
        san_pham: t.san_pham || "",
        ngay_giao: t.ngay_giao || null,
        han_hoan_thanh: t.han_hoan_thanh || null,
        ngay_hoan_thanh: t.ngay_hoan_thanh || null,
        tien_do: tinhTienDo(t),
        can_bo_tham_muu: t.can_bo_tham_muu || "",
        can_bo_phu_trach: t.can_bo_phu_trach || "",
        thang,
        created_by_user: true
      };

      if(t.id){
        await supabase.from("nhiem_vu").update(payload).eq("id", t.id);
      }else{
        const { data } = await supabase
          .from("nhiem_vu")
          .insert(payload)
          .select()
          .single();

        t.id = data.id;
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
<p className="text-yellow-300 text-sm mt-1">
Chào mừng: {name}
</p>
</div>

<nav className="bg-blue-800">
<div className="flex justify-center gap-6 py-2">
<Link href="/"><Home size={20}/></Link>
<button onClick={()=>{localStorage.clear();router.replace("/login");}}>
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
<th className="border p-2">Lĩnh vực con</th>
<th className="border p-2">Công việc</th>
<th className="border p-2">Sản phẩm</th>
<th className="border p-2">Ngày HT</th>
<th className="border p-2">Tiến độ</th>
<th className="border p-2">Sửa</th>
<th className="border p-2">Xóa</th>
</tr>
</thead>

<tbody>
{tasks.map((t,i)=>(
<tr key={i} className={t.created_by_user ? "text-blue-600" : ""}>
<td className="border p-2">{i+1}</td>

<td className="border p-1">{t.linh_vuc_con}</td>

<td className="border p-1">
<input className="w-full"
disabled={!t.created_by_user || !t.isEditing}
value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}
/>
</td>

<td className="border p-1">
<input className="w-full"
value={t.san_pham||""}
onChange={(e)=>update(i,"san_pham",e.target.value)}
/>
</td>

<td className="border p-1">
<input type="date"
className="w-full"
value={t.ngay_hoan_thanh||""}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}
/>
</td>

<td className="border text-center">{t.tien_do || "Chưa hoàn thành"}</td>

<td className="border text-center">
<button onClick={()=>toggleEdit(i)}
className="bg-yellow-500 text-white px-2 py-1 text-xs">
{t.isEditing ? "Khóa" : "Sửa"}
</button>
</td>

<td className="border text-center">
{t.created_by_user && (
<button onClick={()=>deleteRow(i)}
className="bg-red-500 text-white px-2 py-1 text-xs">
Xóa
</button>
)}
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