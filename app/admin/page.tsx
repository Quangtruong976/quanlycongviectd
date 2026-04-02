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
  selected?: boolean;
  isEditing?: boolean; // 🔥 khóa/mở sửa
};

const LINH_VUC = {
  "I. Văn phòng - Tuyên giáo - Xây dựng Đoàn": ["Văn phòng","Tuyên giáo","Xây dựng Đoàn"],
  "II. Phong trào - Hội LHTN": ["Phong trào","Hội LHTN"],
  "III. Trường học - Hội Sinh viên": ["Trường học","Hội Sinh viên"]
};

const CAN_BO = [
  "Trương Minh Quang","Trần Diệp Mỹ Dung","H' Hồng","Đoàn Minh Tâm",
  "Trần Việt Anh","Nguyễn Hồ Xuân Quang","Nguyễn Trọng Tùng","Đào Hùng",
  "Châu Yến Phi","Nguyễn Đình Hưng Thịnh","Nguyễn Trọng Văn",
  "Nguyễn Lý Xuân Uyên","Nguyễn Nam Sơn","Nguyễn Linh Phương",
  "Phan Xuân Tấn","Hồ Như Toán","Võ Văn Đồng","Đỗ Ngọc Hà",
  "Nguyễn Thị Thanh Hòa","Bùi Thị Phượng","Trịnh Thị Vỹ Cầm"
];

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

  async function loadTasks(){
    const {data} = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang",thang)
      .order("linh_vuc_con")
      .order("han_hoan_thanh");

    if(data){
      const mapped = (data as Task[]).map(t => ({
        ...t,
        isEditing:false // 🔥 khóa sau khi load
      }));
      setTasks(mapped);
    }
  }

  function tinhTienDo(task:Task){
    if(!task.ngay_hoan_thanh) return "Chưa hoàn thành";

    const ht = new Date(task.ngay_hoan_thanh);
    const han = new Date(task.han_hoan_thanh || "");

    return ht.getTime() - han.getTime() <= 0
      ? "Hoàn thành đúng hạn"
      : "Hoàn thành quá hạn";
  }

  function update(index:number, field:keyof Task, value:any){

    if(!tasks[index].isEditing) return; // 🔥 khóa sửa

    const newData = [...tasks];
    (newData[index] as any)[field] = value;

    if(field==="linh_vuc_lon"){
      newData[index].linh_vuc_con = "";
    }

    newData[index].tien_do = tinhTienDo(newData[index]);

    setTasks(newData);
  }

  function toggleEdit(index:number){
    const newData = [...tasks];
    newData[index].isEditing = !newData[index].isEditing;
    setTasks(newData);
  }

  function addRow(){
    setTasks([...tasks,{
      ten:"",
      thang,
      isEditing:true
    }]);
  }

  function deleteRow(index:number){
    setTasks(tasks.filter((_,i)=>i!==index));
  }

  function deleteSelected(){
    setTasks(tasks.filter(t => !t.selected));
  }

  // 🔥 IMPORT CSV CHUẨN
  function handleImport(e:any){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = (event:any)=>{
      const text = event.target.result;

      const rows = text.split("\n").slice(1);

      const newTasks:Task[] = rows.map((row:string)=>{
        const cols = row.split(",");

        return {
          linh_vuc_lon: cols[0]?.trim(),
          linh_vuc_con: cols[1]?.trim(),
          ten: cols[2]?.trim(),
          san_pham: cols[3]?.trim(),
          ngay_giao: cols[4]?.trim(),
          han_hoan_thanh: cols[5]?.trim(),
          ngay_hoan_thanh: cols[6]?.trim(),
          can_bo_tham_muu: cols[7]?.trim(),
          can_bo_phu_trach: cols[8]?.trim(),
          thang,
          isEditing:true
        };
      });

      setTasks(newTasks);
    };

    reader.readAsText(file);
  }

  async function saveAll(){

    const validTasks = tasks.filter(t => t.ten && t.ten.trim() !== "");

    const payload = validTasks.map(t => {

      const tien_do = tinhTienDo(t);

      return {
        linh_vuc_lon: t.linh_vuc_lon || "",
        linh_vuc_con: t.linh_vuc_con || "",
        ten: t.ten || "",
        san_pham: t.san_pham || "",

        ngay_giao: t.ngay_giao || null,
        han_hoan_thanh: t.han_hoan_thanh || null,
        ngay_hoan_thanh: t.ngay_hoan_thanh || null,

        tien_do,

        can_bo_tham_muu: t.can_bo_tham_muu || "",
        can_bo_phu_trach: t.can_bo_phu_trach || "",
        can_bo: t.can_bo_phu_trach || "",

        thang,

        ghi_chu:
          tien_do === "Hoàn thành đúng hạn"
            ? "dung_han"
            : tien_do === "Hoàn thành quá hạn"
            ? "qua_han"
            : "chua_ht"
      };
    });

    await supabase.from("nhiem_vu").delete().eq("thang", thang);
    await supabase.from("nhiem_vu").insert(payload);

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
<p className="text-yellow-300 text-sm mt-1">
Chào mừng: {adminName}
</p>
</div>

<nav className="bg-blue-800">
<div className="flex justify-center gap-6 py-2">
<Link href="/"><Home size={20}/></Link>
<Link href="/tien-do">Theo dõi tiến độ công việc</Link>
<Link href="/thong-ke">Thống kê</Link>

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

<div className="flex gap-2">

<label className="bg-blue-600 text-white px-4 py-1 cursor-pointer rounded">
  Import CSV
  <input type="file" accept=".csv" onChange={handleImport} className="hidden"/>
</label>

<button onClick={deleteSelected} className="bg-red-600 text-white px-3 py-1">
  Xóa chọn
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

{tasks.map((t,i)=>(

<tr key={i}>

<td className="border text-center">
<input type="checkbox"
checked={t.selected || false}
onChange={(e)=>update(i,"selected",e.target.checked)}
/>
</td>

<td className="border p-2">{i+1}</td>

<td className="border p-1">
<select disabled={!t.isEditing} value={t.linh_vuc_lon||""}
onChange={(e)=>update(i,"linh_vuc_lon",e.target.value)}>
<option value="">Chọn</option>
{Object.keys(LINH_VUC).map(lv=><option key={lv}>{lv}</option>)}
</select>
</td>

<td className="border p-1">
<select disabled={!t.isEditing} value={t.linh_vuc_con||""}
onChange={(e)=>update(i,"linh_vuc_con",e.target.value)}>
<option value="">Chọn</option>
{LINH_VUC[t.linh_vuc_lon as keyof typeof LINH_VUC]?.map(c=><option key={c}>{c}</option>)}
</select>
</td>

<td className="border p-1">
<input className="w-full" disabled={!t.isEditing}
value={t.ten||""}
onChange={(e)=>update(i,"ten",e.target.value)}/>
</td>

<td className="border p-1">
<input className="w-full" disabled={!t.isEditing}
value={t.san_pham||""}
onChange={(e)=>update(i,"san_pham",e.target.value)}/>
</td>

<td className="border p-1">
<input type="date" disabled={!t.isEditing}
className={`w-full ${t.ngay_giao ? "text-black" : "text-gray-300"}`}
value={t.ngay_giao||""}
onChange={(e)=>update(i,"ngay_giao",e.target.value)}/>
</td>

<td className="border p-1">
<input type="date" disabled={!t.isEditing}
className={`w-full ${t.han_hoan_thanh ? "text-black" : "text-gray-300"}`}
value={t.han_hoan_thanh||""}
onChange={(e)=>update(i,"han_hoan_thanh",e.target.value)}/>
</td>

<td className="border p-1">
<input type="date" disabled={!t.isEditing}
className={`w-full ${t.ngay_hoan_thanh ? "text-black" : "text-gray-300"}`}
value={t.ngay_hoan_thanh||""}
onChange={(e)=>update(i,"ngay_hoan_thanh",e.target.value)}/>
</td>

<td className="border text-center">{t.tien_do || "Chưa hoàn thành"}</td>

<td className="border p-1">
<select disabled={!t.isEditing}
value={t.can_bo_tham_muu||""}
onChange={(e)=>update(i,"can_bo_tham_muu",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border p-1">
<select disabled={!t.isEditing}
value={t.can_bo_phu_trach||""}
onChange={(e)=>update(i,"can_bo_phu_trach",e.target.value)}>
<option value="">Chọn</option>
{CAN_BO.map(cb=><option key={cb}>{cb}</option>)}
</select>
</td>

<td className="border text-center">
<button onClick={()=>toggleEdit(i)}
className="bg-yellow-500 text-white px-2 py-1 text-xs">
{t.isEditing ? "Khóa" : "Sửa"}
</button>
</td>

<td className="border text-center">
<button onClick={()=>deleteRow(i)}
className="bg-red-500 text-white px-2 py-1 text-xs">
Xóa
</button>
</td>

</tr>

))}

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