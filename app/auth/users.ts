export const USERS = [
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

export function login(username: string, password: string) {
  return USERS.find(
    (u) => u.username === username && u.password === password
  );
}
