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
      setTasks(data.map(t => ({
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

  function update(index:number, field:keyof Task, value:any){

    const newData = [...tasks];
    const t = newData[index];

    // 🔥 ADMIN → chỉ sửa 2 cột
    if(!t.created_by_user){
      if(field !== "san_pham" && field !== "ngay_hoan_thanh" && field !== "selected") return;
    }

    // 🔥 USER → phải bật edit
    if(t.created_by_user && !t.isEditing && field !== "selected") return;

    (t as any)[field] = value;

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

  // =========================
  // 🔥 SAVE CHUẨN HÓA
  // =========================
  async function saveAll(){

    const validTasks = tasks.filter(t => t.ten && t.ten.trim() !== "");

    const { data: existing } = await supabase
      .from("nhiem_vu")
      .select("*")
      .eq("thang", thang)
      .eq("linh_vuc_lon","I. Văn phòng - Tuyên giáo - Xây dựng Đoàn");

    // ======================
    // 🔥 DELETE (chỉ xóa task user)
    // ======================
    const toDelete = existing?.filter(e =>
      e.created_by_user &&
      !validTasks.some(t => t.id === e.id)
    );

    if(toDelete){
      for(const d of toDelete){
        await supabase.from("nhiem_vu").delete().eq("id", d.id);
      }
    }

    // ======================
    // 🔥 UPDATE + INSERT
    // ======================
    for(const t of validTasks){

      // 🔥 ADMIN
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
        const { data, error } = await supabase
          .from("nhiem_vu")
          .insert(payload)
          .select()
          .single();

        if(error){
          console.error(error);
          alert("Lỗi lưu!");
          return;
        }

        t.id = data.id;
      }
    }

    alert("Đã lưu");
    loadTasks();
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col">

      <header className="bg-blue-900 text-white text-center py-4">
        <h1 className="font-bold">QUẢN LÝ CÔNG VIỆC</h1>
        <p>Chào mừng: {name}</p>
      </header>

      <main className="flex-1 p-4">

        <div className="bg-white p-4 rounded">

          <div className="flex justify-between mb-4">
            <button onClick={addRow} className="bg-blue-600 text-white px-4 py-1">+ Thêm</button>
            <button onClick={saveAll} className="bg-green-600 text-white px-4 py-1">Lưu</button>
          </div>

          <table className="w-full border">
            <tbody>
              {tasks.map((t,i)=>(
                <tr key={i} className={t.created_by_user ? "text-blue-600" : ""}>
                  <td>{i+1}</td>
                  <td>
                    <input
                      value={t.ten}
                      disabled={!t.created_by_user || !t.isEditing}
                      onChange={(e)=>update(i,"ten",e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={t.san_pham||""}
                      onChange={(e)=>update(i,"san_pham",e.target.value)}
                    />
                  </td>
                  <td>
                    <button onClick={()=>toggleEdit(i)}>Sửa</button>
                  </td>
                  <td>
                    {t.created_by_user && (
                      <button onClick={()=>deleteRow(i)}>Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </main>
    </div>
  );
}