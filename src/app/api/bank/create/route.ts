import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Payload = {
  question?: string;
  options?: string[];
  correct_index?: number;
  points?: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Payload;
  const question = String(body.question || "").trim();
  const rawOptions = Array.isArray(body.options) ? body.options : [];
  const options = rawOptions.map((opt) => String(opt || "").trim()).filter(Boolean);
  const correctIndex = Number(body.correct_index ?? 0);
  const rawPoints = Number.isFinite(Number(body.points)) ? Number(body.points) : 100;
  const points = Math.max(0, rawPoints);

  if (!question) return NextResponse.json({ error: "Pertanyaan wajib diisi" }, { status: 400 });
  if (options.length < 2) {
    return NextResponse.json({ error: "Minimal 2 opsi jawaban" }, { status: 400 });
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "Opsi benar tidak valid" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("question_bank")
    .insert({
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
