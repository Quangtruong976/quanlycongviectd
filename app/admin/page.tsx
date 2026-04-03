"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx"; // 🔥 thêm

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
        isEditing:false
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

    if(!tasks[index].isEditing) return;

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

  // 🔥 chuẩn hóa ngày từ Excel
  function formatDate(value: any) {
    if (!value) return "";

    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2,"0")}-${String(date.d).padStart(2,"0")}`;
    }

    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }

    return "";
  }

  // 🔥 IMPORT EXCEL CHUẨN
  function handleImport(e:any){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = (evt:any)=>{
      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json:any[] = XLSX.utils.sheet_to_json(sheet,{ defval:"" });

      const newTasks:Task[] = json.map((row:any)=>({

        linh_vuc_lon: row["Lĩnh vực lớn"]?.toString().trim(),
        linh_vuc_con: row["Lĩnh vực con"]?.toString().trim(),
        ten: row["Công việc"]?.toString().trim(),
        san_pham: row["Sản phẩm"]?.toString().trim(),

        ngay_giao: formatDate(row["Ngày giao"]),
        han_hoan_thanh: formatDate(row["Hạn hoàn thành"]),
        ngay_hoan_thanh: formatDate(row["Ngày hoàn thành"]),

        can_bo_tham_muu: row["Cán bộ tham mưu"]?.toString().trim(),
        can_bo_phu_trach: row["Cán bộ phụ trách"]?.toString().trim(),

        thang,
        isEditing:true
      }));

      setTasks(newTasks);
    };

    reader.readAsArrayBuffer(file);
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
<Link href="/thong-ke"> Thống kê chi tiết công việc cá nhân</Link>

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
  Import Excel
  <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden"/>
</label>

<button onClick={deleteSelected} className="bg-red-600 text-white px-3 py-1">
  Xóa chọn
</button>

<button onClick={saveAll} className="bg-green-600 text-white px-4 py-1">
  Lưu
</button>

</div>
</div>