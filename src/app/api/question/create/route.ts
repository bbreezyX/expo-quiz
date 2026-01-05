import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Payload = {
  code?: string;
  question?: string;
  options?: string[];
  correct_index?: number;
  points?: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Payload;
  const code = String(body.code || "").trim().toUpperCase();
  const question = String(body.question || "").trim();
  const rawOptions = Array.isArray(body.options) ? body.options : [];
  const options = rawOptions.map((opt) => String(opt || "").trim()).filter(Boolean);
  const correctIndex = Number(body.correct_index ?? 0);
  const rawPoints = Number.isFinite(Number(body.points)) ? Number(body.points) : 100;
  const points = Math.max(0, rawPoints);

  if (!code) return NextResponse.json({ error: "Kode sesi belum diisi" }, { status: 400 });
  if (!question) return NextResponse.json({ error: "Pertanyaan wajib diisi" }, { status: 400 });
  if (options.length < 2) {
    return NextResponse.json({ error: "Minimal 2 opsi jawaban" }, { status: 400 });
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "Opsi benar tidak valid" }, { status: 400 });
  }

  const { data: session, error: sErr } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("code", code)
    .single();

  if (sErr || !session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });

  const { data: last } = await supabaseAdmin
    .from("questions")
    .select("order_no")
    .eq("session_id", session.id)
    .order("order_no", { ascending: false })
    .limit(1);

  const order_no = (last?.[0]?.order_no ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      session_id: session.id,
      order_no,
      question,
      options,
      correct_index: correctIndex,
      points,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ question: data });
}
