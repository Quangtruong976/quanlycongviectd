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
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [adminName,setAdminName] = useState("");
  const [thang,setThang] = useState(new Date().getMonth()+1);
  const [filterCanBo, setFilterCanBo] = useState("");

  useEffect(()=>{
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if(role!=="user"){
      router.replace("/login");
      return;
    }

    setAdminName(name || "User");
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
      const mapped = (data as Task[]).map(t => ({
        ...t,
        isEditing:false
      }));
      setTasks(mapped);
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

  function update(index:number, field:keyof Task, value:any){

    const newData = [...tasks];
    const t = newData[index];
    if(!t.isEditing && field !== "selected") return;
    // 🔥 TASK ADMIN → chỉ sửa 2 cột
    if(!t.created_by_user){
      if(field !== "san_pham" && field !== "ngay_hoan_thanh" && field !== "selected") return;
    }

    // 🔥 TASK USER → phải bật edit mới sửa
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

  async function updateTaskToDB(task: Task) {
    if (!task.id) return;
  
    const tien_do = tinhTienDo(task);
  
    const { error } = await supabase
      .from("nhiem_vu")
      .update({
        san_pham: task.san_pham || "",
        ngay_hoan_thanh: task.ngay_hoan_thanh || null,
        tien_do: tien_do
      })
      .eq("id", task.id);
  
    if (error) {
      console.error("Lỗi update:", error);
      return;
    }
  
    // 🔥 BẮT BUỘC THÊM DÒNG NÀY
    window.dispatchEvent(new Event("nhiem_vu_updated"));
  }










  function addRow(){
    setTasks([...tasks,{
      id: undefined,
      ten:"",
      linh_vuc_lon:"I. Văn phòng - Tuyên giáo - Xây dựng Đoàn",
      linh_vuc_con:"",
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

  async function saveAll(){

    const validTasks = tasks.filter(t => t.ten && t.ten.trim() !== "");
  
    const { data: existing, error: err1 } = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang", thang)
      .eq("linh_vuc_lon","I. Văn phòng - Tuyên giáo - Xây dựng Đoàn");
  
    if(err1){
      console.error("Lỗi load DB:", err1);
      alert("Không đọc được dữ liệu");
      return;
    }
  
    // DELETE
    const toDelete = existing?.filter(e =>
      e.created_by_user &&
      !validTasks.some(t => t.id === e.id)
    );
  
    if(toDelete){
      for(const d of toDelete){
        const { error } = await supabase
          .from("nhiem_vu")
          .delete()
          .eq("id", d.id);
  
        if(error){
          console.error("Lỗi delete:", error);
        }
      }
    }
  
    // SAVE
    for(const t of validTasks){
  
      // 🔒 TASK ADMIN
      if(!t.created_by_user){
  
        const { error } = await supabase
          .from("nhiem_vu")
          .update({
            san_pham: t.san_pham || "",
            ngay_hoan_thanh: t.ngay_hoan_thanh || null,
            tien_do: tinhTienDo(t)
          })
          .eq("id", t.id);
  
        if(error){
          console.error("Lỗi update admin:", error);
          alert(error.message);
          return;
        }
  
        continue;
      }
  
      // 🔥 TASK USER
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
  
      // UPDATE
      if(t.id){
        const { error } = await supabase
          .from("nhiem_vu")
          .update(payload)
          .eq("id", t.id);
  
        if(error){
          console.error("Lỗi update user:", error);
          alert(error.message);
          return;
        }
      }
  
      // INSERT
      else{
        const { data, error } = await supabase
          .from("nhiem_vu")
          .insert(payload)
          .select()
          .single();
  
        if(error){
          console.error("Lỗi insert:", error);
          alert(error.message);
          return;
        }
  
        t.id = data.id;
      }
    }
  
    alert("Đã lưu");

// khóa tất cả về trạng thái không chỉnh sửa
setTasks(prev =>
  prev.map(t => ({
    ...t,
    isEditing: false
  }))
);

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
Chào mừng: Lĩnh vực Văn phòng - Tuyên giáo - Xây dựng Đoàn
</p>
</div>

<nav className="bg-blue-800">
<div className="flex justify-center items-center gap-6 py-2 text-sm font-semibold">
<Link href="/" className="text-white hover:text-yellow-300 cursor-pointer">
  <Home size={20}/>
</Link>
<Link href="/tien-do"
className="text-white hover:text-yellow-300 cursor-pointer">
Theo dõi tiến độ công việc
</Link>

<Link href="/thong-ke"
className="text-white hover:text-yellow-300 cursor-pointer">
Thống kê chi tiết công việc cá nhân
</Link>

<button
onClick={()=>{
  localStorage.clear();
  router.replace("/login");
}}
className="cursor-pointer hover:text-yellow-300 cursor-pointer"
>
Đăng xuất
</button>
</div>
</nav>
</header>

<main className="flex-1 flex justify-center p-4">

<div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl p-4">

<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

<div className="flex flex-wrap gap-2">

  <select
    value={thang}
    onChange={(e)=>setThang(Number(e.target.value))}
    className="border px-3 py-1 w-full md:w-auto"
  >
    {Array.from({length:12}).map((_,i)=>(
      <option key={i} value={i+1}>Tháng {i+1}</option>
    ))}
  </select>

  <select
    value={filterCanBo}
    onChange={(e)=>setFilterCanBo(e.target.value)}
    className="border px-3 py-1 w-full md:w-auto"
  >
    <option value="">-- Tất cả cán bộ --</option>
    {CAN_BO.map(cb => (
      <option key={cb}>{cb}</option>
    ))}
  </select>

</div>

<div className="flex flex-wrap gap-2 md:justify-end">

<button onClick={addRow} className="bg-blue-600 text-white px-4 py-1 cursor-pointer">
+ Thêm nhiệm vụ
</button>

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-1 cursor-pointer">
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

{tasks
  .filter(t => {
    if (!filterCanBo) return true;
    return t.can_bo_tham_muu === filterCanBo;
  })
  .map((t,i)=>(

<tr
  key={i}
  onClick={() => setSelectedRow(i)}
  className={`
    cursor-pointer
    ${t.created_by_user ? "text-blue-600" : ""}
    ${selectedRow === i ? "bg-blue-200" : ""}
  `}
>
  

<td className="border text-center">
<input type="checkbox"
checked={t.selected || false}
onChange={(e)=>update(i,"selected",e.target.checked)}/>
</td>

<td className="border p-2 cursor-pointer"  onClick={() => setSelectedRow(i)}>{i+1}</td>

<td className="border p-1">{t.linh_vuc_lon}</td>

<td className="border p-1">
<select
disabled={!t.created_by_user && !t.isEditing}
value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}
>
<option value="">Chọn</option>
{LINH_VUC[t.linh_vuc_lon as keyof typeof LINH_VUC]?.map(c=><option key={c}>{c}</option>)}
</select>
</td>

<td className="border p-1">
<input className="w-full"
disabled={!t.created_by_user || !t.isEditing}
value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}
/>
</td>

<td className="border p-1">
<input
className={`w-full ${!t.san_pham ? "text-red-400" : "text-black"} ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
placeholder="Nhập tên sản phẩm"
disabled={!t.isEditing}
value={t.san_pham || ""}
onChange={async (e)=>{
  const value = e.target.value;

  update(i,"san_pham",value);

  await updateTaskToDB({
    ...tasks[i],
    san_pham: value
  });
}}
/>
</td>

<td className="border p-1 relative">
  {!t.ngay_giao ? (
    <input
      type="text"
      value=""
      placeholder="Nhập ngày giao việc"
      disabled={!t.isEditing}
      readOnly
      className={`w-full text-red-400 ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={(e) => {
        const input = e.currentTarget.parentElement?.querySelector("input[type='date']");
        (input as HTMLInputElement)?.showPicker?.();
        (input as HTMLInputElement)?.focus();
      }}
    />
  ) : (
    <input
      type="date"
      disabled={!t.isEditing}
      className={`w-full text-black ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
      value={t.ngay_giao}
      onChange={(e)=>update(i,"ngay_giao",e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          update(i, "ngay_giao", "");
        }
      }}
    />
  )}

  {!t.ngay_giao && (
    <input
      type="date"
      className="absolute opacity-0 pointer-events-none"
      onChange={(e)=>update(i,"ngay_giao",e.target.value)}
    />
  )}
</td>




<td className="border p-1 relative">
  {!t.han_hoan_thanh ? (
    <input
      type="text"
      value=""
      placeholder="Nhập hạn hoàn thành"
      disabled={!t.isEditing}
      readOnly
      className={`w-full text-red-400 ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={(e) => {
        const input = e.currentTarget.parentElement?.querySelector("input[type='date']");
        (input as HTMLInputElement)?.showPicker?.();
        (input as HTMLInputElement)?.focus();
      }}
    />
  ) : (
    <input
      type="date"
      disabled={!t.isEditing}
      className={`w-full text-black ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
      value={t.han_hoan_thanh}
      onChange={(e)=>update(i,"han_hoan_thanh",e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          update(i, "han_hoan_thanh", "");
        }
      }}
    />
  )}

{!t.han_hoan_thanh && (
    <input
      type="date"
      className="absolute opacity-0 pointer-events-none"
      onChange={(e)=>update(i,"han_hoan_thanh",e.target.value)}
    />
  )}
</td>




<td className="border p-1">
  {!t.ngay_hoan_thanh ? (
    // Ô hiển thị ban đầu
    <input
      type="text"
      value=""
      placeholder="Nhập ngày hoàn thành"
      disabled={!t.isEditing}
      readOnly
      className={`w-full text-red-400 ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={(e) => {
        const input = e.currentTarget.parentElement?.querySelector("input[type='date']");
        (input as HTMLInputElement)?.showPicker?.();
        (input as HTMLInputElement)?.focus();
      }}
    />
  ) : (
    // Ô ngày thật
    <input
      type="date"
      disabled={!t.isEditing}
      className={`w-full text-black ${!t.isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
      value={t.ngay_hoan_thanh}
      onChange={async (e)=>{
        const value = e.target.value;
      
        update(i,"ngay_hoan_thanh",value);
      
        await updateTaskToDB({
          ...tasks[i],
          ngay_hoan_thanh: value
        });
      }}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          update(i, "ngay_hoan_thanh", "");
        }
      }}
    />
  )}

  {/* input ẩn để gọi lịch */}
  {!t.ngay_hoan_thanh && (
    <input
      type="date"
      className="absolute opacity-0 pointer-events-none"
      onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}
    />
  )}
</td>

<td className="border text-center">{t.tien_do || "Chưa hoàn thành"}</td>

<td className="border p-1">
<select
disabled={!t.created_by_user || !t.isEditing}
value={t.can_bo_tham_muu||""}
onChange={(e)=>update(i,"can_bo_tham_muu",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border p-1">
<select
disabled={!t.created_by_user || !t.isEditing}
value={t.can_bo_phu_trach||""}
onChange={(e)=>update(i,"can_bo_phu_trach",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border text-center">
<button onClick={()=>toggleEdit(i)}
className="bg-yellow-500 text-white px-2 py-1 text-xs cursor-pointer">
{t.isEditing ? "Khóa" : "Sửa"}
</button>
</td>

<td className="border text-center">
<button onClick={()=>deleteRow(i)}
className="bg-red-500 text-white px-2 py-1 text-xs cursor-pointer">
Xóa
</button>
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