import { createClient } from "@supabase/supabase-js";

/* =====================================================
   KIỂM TRA ENV
===================================================== */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Thiếu biến môi trường Supabase");
}

/* =====================================================
   CLIENT DÙNG CHUNG
===================================================== */

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "x-application-name": "quan-ly-nhiem-vu",
      },
    },
  }
);