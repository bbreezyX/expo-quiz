import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const { code } = await req.json();
  const sessionCode = String(code || "").trim().toUpperCase();
  if (!sessionCode) return NextResponse.json({ error: "Kode sesi belum diisi" }, { status: 400 });

  const { data: session, error: sErr } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("code", sessionCode)
    .single();

  if (sErr || !session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  if (session.ended_at) return NextResponse.json({ session });

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", session.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ session: data });
}
