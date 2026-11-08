
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const userId = "df0048f4-1a96-4c8e-b702-718cf472b6e2";

const rl = readline.createInterface({ input: stdin, output: stdout });

try {
  const password = await rl.question("Nhập mật khẩu mới (ít nhất 8 ký tự): ");
  const confirm = await rl.question("Nhập lại mật khẩu mới: ");

  if (password.length < 8) {
    throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  }

  if (password !== confirm) {
    throw new Error("Hai mật khẩu không khớp.");
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password }
  );

  if (error) throw error;

  console.log("ĐÃ ĐẶT LẠI MẬT KHẨU THÀNH CÔNG.");
  console.log("Tài khoản:", data.user.email);
} catch (error) {
  console.error("KHÔNG THỂ ĐẶT LẠI MẬT KHẨU:", error.message);
} finally {
  rl.close();
}
