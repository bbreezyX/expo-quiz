import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function makeCode(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST() {
  for (let i = 0; i < 5; i += 1) {
    const code = makeCode(5);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ code, title: "Expo Quiz" })
      .select("*")
      .single();

    if (!error) return NextResponse.json({ session: data });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Gagal membuat kode unik." }, { status: 400 });
}
