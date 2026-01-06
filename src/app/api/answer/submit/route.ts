
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyParticipantRequest } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const rateLimit = await checkRateLimit("answer", ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak request.Coba lagi dalam ${rateLimit.retryAfter} detik.` },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) }
      }
    );
  }

  // Verify participant session from cookie
  const participantSession = await verifyParticipantRequest(req);

  const body = await req.json();
  const { question_id, answer_index } = body;

  // Get participant info from session cookie or fallback to body (for backward compatibility)
  const participant_id = participantSession?.participantId || body.participant_id;
  const session_id = participantSession?.sessionId || body.session_id;

  if (!participant_id || !session_id) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Silakan join ulang." },
      { status: 401 }
    );
  }

  // Validate required fields
  if (!question_id) {
    return NextResponse.json({ error: "Question ID diperlukan" }, { status: 400 });
  }

  if (answer_index === undefined || answer_index === null) {
    return NextResponse.json({ error: "Jawaban diperlukan" }, { status: 400 });
  }

  // Use stored procedure for optimized submission (single DB call)
  const { data, error } = await supabase.rpc("submit_answer", {
    p_participant_id: participant_id,
    p_session_id: session_id,
    p_question_id: question_id,
    p_answer_index: Number(answer_index),
  });

  // Handle RPC errors
  if (error) {
    // Fallback to direct queries if stored procedure doesn't exist
    if (error.message.includes("function") && error.message.includes("does not exist")) {
      return handleFallbackSubmission(participant_id, session_id, question_id, answer_index);
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Handle business logic errors from stored procedure
  if (!data?.success) {
    const statusCode = data?.code === "DUPLICATE" ? 409 : 400;
    return NextResponse.json({ error: data?.error || "Gagal mengirim jawaban" }, { status: statusCode });
  }

  return NextResponse.json({ answer: data.answer });
}

// Fallback function if stored procedure is not available
async function handleFallbackSubmission(
  participant_id: string,
  session_id: string,
  question_id: string,
  answer_index: number
) {
  const { data: q, error: qErr } = await supabase
    .from("questions")
    .select("correct_index, points, session_id")
    .eq("id", question_id)
    .single();

  if (qErr || !q) {
    return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
  }

  if (q.session_id !== session_id) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 400 });
  }

  const { data: s, error: sErr } = await supabase
    .from("sessions")
    .select("ended_at")
    .eq("id", session_id)
    .single();

  if (sErr || !s) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  if (s.ended_at) {
    return NextResponse.json({ error: "Sesi sudah selesai" }, { status: 400 });
  }

  const is_correct = Number(answer_index) === Number(q.correct_index);
  const points_earned = is_correct ? Number(q.points ?? 100) : 0;

  const { data, error } = await supabase.from("answers").insert({
    session_id,
    participant_id,
    question_id,
    answer_index,
    is_correct,
    points_earned,
  }).select("id, is_correct, points_earned").single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Jawaban sudah terkirim." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ answer: data });
}
