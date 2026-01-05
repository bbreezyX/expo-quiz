import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Payload = {
  code: string;
  bank_ids: string[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Payload;
  const code = String(body.code || "").trim().toUpperCase();
  const bankIds = Array.isArray(body.bank_ids) ? body.bank_ids : [];

  if (!code) return NextResponse.json({ error: "Kode sesi belum diisi" }, { status: 400 });
  if (bankIds.length === 0) return NextResponse.json({ error: "Pilih minimal 1 pertanyaan" }, { status: 400 });

  // 1. Get Session ID
  const { data: session, error: sErr } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("code", code)
    .single();

  if (sErr || !session) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });

  // 2. Get Bank Questions
  const { data: bankQuestions, error: bErr } = await supabaseAdmin
    .from("question_bank")
    .select("*")
    .in("id", bankIds);

  if (bErr || !bankQuestions || bankQuestions.length === 0) {
    return NextResponse.json({ error: "Pertanyaan tidak ditemukan di bank" }, { status: 404 });
  }

  // 3. Get Current Last Order No
  const { data: last } = await supabaseAdmin
    .from("questions")
    .select("order_no")
    .eq("session_id", session.id)
    .order("order_no", { ascending: false })
    .limit(1);

  let nextOrderNo = (last?.[0]?.order_no ?? 0) + 1;

  // 4. Prepare Insert Data
  const questionsToInsert = bankQuestions.map((q, idx) => ({
    session_id: session.id,
    order_no: nextOrderNo + idx,
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    points: q.points,
  }));

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert(questionsToInsert)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ count: data?.length || 0 });
}
