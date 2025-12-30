import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { code, name } = await req.json();
  const displayName = String(name || "").trim();
  if (displayName.length < 2) {
    return NextResponse.json({ error: "Nama terlalu pendek" }, { status: 400 });
  }

  const { data: session, error: sErr } = await supabase
    .from("sessions").select("*").eq("code", String(code).toUpperCase()).single();

  if (sErr || !session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  if (session.ended_at) {
    return NextResponse.json({ error: "Sesi sudah selesai" }, { status: 400 });
  }

  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .insert({ session_id: session.id, display_name: displayName.slice(0, 30) })
    .select("*")
    .single();

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

  return NextResponse.json({ session, participant });
}
