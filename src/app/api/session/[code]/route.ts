import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", params.code.toUpperCase())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ session: data });
}
