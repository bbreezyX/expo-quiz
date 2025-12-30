import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { participant_id, session_id, question_id, answer_index } = await req.json();

  const { data: q, error: qErr } = await supabase
    .from("questions")
    .select("correct_index, points, session_id")
    .eq("id", question_id)
    .single();

  if (qErr || !q) return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
  if (q.session_id !== session_id) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 400 });

  const { data: s, error: sErr } = await supabase
    .from("sessions")
    .select("ended_at")
    .eq("id", session_id)
    .single();

  if (sErr || !s) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  if (s.ended_at) return NextResponse.json({ error: "Sesi sudah selesai" }, { status: 400 });

  const is_correct = Number(answer_index) === Number(q.correct_index);
  const points_earned = is_correct ? Number(q.points ?? 100) : 0;

  const { data, error } = await supabase.from("answers").insert({
    session_id,
    participant_id,
    question_id,
    answer_index,
    is_correct,
    points_earned,
  }).select("*").single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Jawaban sudah terkirim." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ answer: data });
}
