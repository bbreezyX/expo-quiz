import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { 
  checkRateLimit, 
  generateParticipantToken, 
  setParticipantCookie 
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || req.headers.get("x-real-ip") 
    || "unknown";
  
  const rateLimit = checkRateLimit("join", ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rateLimit.retryAfter} detik.` },
      { 
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) }
      }
    );
  }

  const { code, name } = await req.json();
  const displayName = String(name || "").trim();
  
  if (displayName.length < 2) {
    return NextResponse.json({ error: "Nama terlalu pendek" }, { status: 400 });
  }
  
  if (displayName.length > 30) {
    return NextResponse.json({ error: "Nama terlalu panjang (max 30 karakter)" }, { status: 400 });
  }

  const sessionCode = String(code || "").trim().toUpperCase();
  
  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .select("id, code, ended_at")
    .eq("code", sessionCode)
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }
  
  if (session.ended_at) {
    return NextResponse.json({ error: "Sesi sudah selesai" }, { status: 400 });
  }

  const { data: participant, error: pErr } = await supabase
    .from("participants")
    .insert({ session_id: session.id, display_name: displayName })
    .select("id, display_name")
    .single();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  // Generate participant session token
  const token = await generateParticipantToken(
    participant.id,
    session.code,
    session.id
  );
  
  // Set httpOnly cookie
  await setParticipantCookie(token);

  return NextResponse.json({ 
    session: { id: session.id, code: session.code }, 
    participant: { id: participant.id, display_name: participant.display_name }
  });
}
