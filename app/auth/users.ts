type User = {
  username: string;
  password: string;
  role: string;
};

const USERS: User[] = [
  {
    username: "admin",
    password: "123",
    role: "admin",
  },
  {
    username: "vanphong",
    password: "123",
    role: "van-phong-xd-tuyen-truyen",
  },
  {
    username: "phongtrao",
    password: "123",
    role: "phong-trao-hoi-lhtn",
  },
  {
    username: "truonghoc",
    password: "123",
    role: "truong-hoc-hoi-sv",
  },
];

/* =====================================================
   LOGIN
===================================================== */

export function login(username: string, password: string) {
  if (!username || !password) return null;

  const user = USERS.find(
    (u) =>
      u.username.trim() === username.trim() &&
      u.password === password
  );

  if (!user) return null;

  // Không trả password ra ngoài
  return {
    username: user.username,
    role: user.role,
  };
}

/* =====================================================
   KIỂM TRA ROLE
===================================================== */

export function isAdmin(role: string) {
  return role === "admin";
}