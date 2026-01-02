"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Question = {
  id: string;
  order_no: number;
  question: string;
  options: string[];
  points: number;
};

type OptionCardProps = {
  label: string;
  index: number;
  picked: boolean;
  disabled: boolean;
  onPick: () => void;
};

function OptionCard({ label, index, picked, disabled, onPick }: OptionCardProps) {
  const letter = String.fromCharCode(65 + index);
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border px-6 py-5 transition-all ${
        picked
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            picked ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
          }`}
        >
          {letter}
        </div>
        <span className={`flex-1 text-base sm:text-lg font-medium`}>
          {label}
        </span>
      </div>
    </button>
  );
}

type ProgressItemProps = {
  index: number;
  active: boolean;
  done: boolean;
};

function ProgressItem({ index, active, done }: ProgressItemProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        active ? "border-slate-900 bg-slate-900" : done ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            active ? "bg-white text-slate-900" : done ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {index + 1}
        </div>
        <div className={`text-xs font-medium ${active ? "text-white" : done ? "text-slate-600" : "text-slate-400"}`}>
          Soal {index + 1}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) return;
    setParticipantId(localStorage.getItem(`participant:${code}`));
    setSessionId(localStorage.getItem(`sessionId:${code}`));
  }, [code, router]);

  useEffect(() => {
    async function load() {
      if (!code) return;
      setLoading(true);
      setError(null);
      const { data: s } = await supabase.from("sessions").select("*").eq("code", code).single();
      if (!s) {
        setError("Sesi tidak ketemu. Coba cek kodenya lagi ya.");
        setLoading(false);
        return;
      }
      if (s.ended_at) {
        setLoading(false);
        router.replace(`/quiz/${code}/done`);
        return;
      }

      const { data: qs } = await supabase
        .from("questions")
        .select("id, order_no, question, options, points")
        .eq("session_id", s.id)
        .order("order_no", { ascending: true });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuestions((qs ?? []).map((q: any) => ({ ...q, options: q.options as string[] })));
      setSessionId(s.id);
      setIdx(0);
      setPicked(null);
      setLoading(false);
    }
    load();
  }, [code, router]);

  const q = questions[idx];
  const total = questions.length;

  const canAnswer = useMemo(() => !!q && participantId && sessionId, [q, participantId, sessionId]);

  async function submit() {
    if (!canAnswer || picked === null) return;
    setSubmitting(true);
    setStatus("Lagi ngirim jawaban...");
    toast.loading("Mengirim jawaban...", { id: "submit-answer" });

    const res = await fetch("/api/answer/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_id: participantId,
        session_id: sessionId,
        question_id: q.id,
        answer_index: picked,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error("Gagal mengirim", {
        id: "submit-answer",
        description: json.error || "Gagal, coba lagi ya.",
      });
      setStatus(json.error || "Gagal, coba lagi ya.");
      setSubmitting(false);
      return;
    }

    setPicked(null);
    setStatus(null);
    setSubmitting(false);
    toast.success("Jawaban terkirim!", {
      id: "submit-answer",
      description: idx + 1 < total ? "Lanjut ke soal berikutnya" : "Semua soal sudah selesai!",
    });

    if (idx + 1 < total) setIdx(idx + 1);
    else router.push(`/quiz/${code}/done`);
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-20 flex justify-center items-center">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Loading...</h1>
            <p className="text-lg text-slate-500">
              Quiz sedang disiapkan
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-20 flex justify-center items-center">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Error</h1>
            <p className="text-lg text-slate-500">{error}</p>
          </div>
          <Button size="lg" onClick={() => router.push("/join")} className="rounded-full">
            Kembali ke Join
          </Button>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen px-6 py-20 flex justify-center items-center">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Tunggu Sebentar</h1>
            <p className="text-lg text-slate-500">
              Quiz belum dimulai. Cek leaderboard dulu
            </p>
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push(`/screen/${code}`)}
            className="rounded-full"
          >
            Lihat Leaderboard
          </Button>
        </div>
      </div>
    );
  }

  const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;
  const answerOptions = [...q.options, "Semua jawaban di atas benar"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Quiz</h1>
            <span className="font-mono text-lg text-slate-500">{code}</span>
          </div>
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 min-w-[3.5rem] text-right">
              {idx + 1}/{total}
            </span>
          </div>
        </div>

        {/* Progress Pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.slice(0, 10).map((_, index) => (
            <ProgressItem
              key={index}
              index={index}
              active={index === idx}
              done={index < idx}
            />
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 space-y-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                Pertanyaan {idx + 1}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-relaxed">
                {q.question}
              </h2>
            </div>

            <div className="space-y-3">
              {answerOptions.map((opt, i) => (
                <OptionCard
                  key={`${q.id}-${i}`}
                  label={opt}
                  index={i}
                  picked={picked === i}
                  disabled={submitting}
                  onPick={() => setPicked(i)}
                />
              ))}
            </div>
          </div>

          {status && (
            <div className="text-center text-sm text-slate-600 bg-slate-100 rounded-2xl px-6 py-4">
              {status}
            </div>
          )}

          {!participantId && (
            <div className="text-center text-sm text-slate-600 bg-slate-100 rounded-2xl px-6 py-4">
              Kamu belum terdaftar. Silakan join ulang.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              variant="ghost"
              onClick={() => idx > 0 && setIdx(idx - 1)}
              disabled={idx === 0 || submitting}
              className="rounded-full"
            >
              Kembali
            </Button>
            <Button
              size="lg"
              className="flex-1 rounded-full h-14 text-base"
              onClick={submit}
              disabled={picked === null || !participantId || submitting}
            >
              {submitting ? "Mengirim..." : "Kirim Jawaban"}
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 text-center text-sm text-slate-600">
          Pilih jawaban yang paling tepat
        </div>
      </div>
    </div>
  );
}
