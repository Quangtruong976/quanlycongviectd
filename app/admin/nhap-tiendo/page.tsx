"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  vanban: string;
  ngaygiao: string;
  thoihan: string;
  sanpham: string;
}

export default function NhapTienDo() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.push("/login");
    }
  }, []);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        vanban: "",
        ngaygiao: "",
        thoihan: "",
        sanpham: "",
      },
    ]);
  };

  const updateTask = (id: number, field: string, value: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, [field]: value } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div>

      <h2 className="text-2xl font-bold mb-4">
        NHẬP TIẾN ĐỘ CÔNG VIỆC
      </h2>

      <button
        onClick={addTask}
        className="mb-4 bg-green-600 text-white px-4 py-2"
      >
        + Thêm nhiệm vụ
      </button>

      <div className="overflow-auto">
        <table className="w-full border border-collapse bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">STT</th>
              <th className="border p-2">Văn bản / Công việc</th>
              <th className="border p-2">Ngày giao</th>
              <th className="border p-2">Thời hạn</th>
              <th className="border p-2">Sản phẩm</th>
              <th className="border p-2">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task, index) => (
              <tr key={task.id}>
                <td className="border p-2 text-center">
                  {index + 1}
                </td>

                <td className="border p-2">
                  <input
                    className="w-full border p-1"
                    value={task.vanban}
                    onChange={(e) =>
                      updateTask(task.id, "vanban", e.target.value)
                    }
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="date"
                    className="w-full border p-1"
                    value={task.ngaygiao}
                    onChange={(e) =>
                      updateTask(task.id, "ngaygiao", e.target.value)
                    }
                  />
                </td>

                <td className="border p-2">
                  <input
                    type="date"
                    className="w-full border p-1"
                    value={task.thoihan}
                    onChange={(e) =>
                      updateTask(task.id, "thoihan", e.target.value)
                    }
                  />
                </td>

                <td className="border p-2">
                  <input
                    className="w-full border p-1"
                    value={task.sanpham}
                    onChange={(e) =>
                      updateTask(task.id, "sanpham", e.target.value)
                    }
                  />
                </td>

                <td className="border p-2 text-center space-x-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1"
                    onClick={() => deleteTask(task.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  Chưa có nhiệm vụ nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}