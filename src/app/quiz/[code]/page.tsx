"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Question = {
  id: string;
  order_no: number;
  question: string;
  options: string[];
  points: number;
};

const optionStyles = [
  "bg-[var(--brand-red)] text-white",
  "bg-[var(--brand-blue)] text-white",
  "bg-[var(--brand-yellow)] text-[#1f2937]",
  "bg-[var(--brand-green)] text-white",
];

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
        setError("Sesi tidak ditemukan.");
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
    setStatus("Mengirim...");

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
      setStatus(json.error || "Gagal");
      setSubmitting(false);
      return;
    }

    setPicked(null);
    setStatus(null);
    setSubmitting(false);

    if (idx + 1 < total) setIdx(idx + 1);
    else router.push(`/quiz/${code}/done`);
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <div className="text-sm text-muted-foreground">Memuat pertanyaan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <Card className="w-full max-w-lg sticker">
          <CardContent className="p-6 space-y-4 text-center">
            <h1 className="font-display text-3xl">Maaf</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/join")}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <Card className="w-full max-w-lg sticker">
          <CardContent className="p-6 space-y-4 text-center">
            <h1 className="font-display text-3xl">Belum ada pertanyaan</h1>
            <p className="text-sm text-muted-foreground">
              Admin belum menambahkan pertanyaan untuk sesi ini.
            </p>
            <Button variant="outline" onClick={() => router.push(`/screen/${code}`)}>
              Lihat leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Badge className="bg-white text-foreground border-white sticker">Sesi {code}</Badge>
          <div>
            {idx + 1} / {total}
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-white/70 border-2 border-white">
          <div
            className="h-full rounded-full bg-[linear-gradient(135deg,var(--brand-blue),var(--brand-green))]"
            style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }}
          />
        </div>

        <Card className="sticker">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Pertanyaan {idx + 1}
                </div>
                <div className="text-2xl sm:text-3xl font-semibold">{q.question}</div>
              </div>
              <div className="text-sm text-muted-foreground">Poin {q.points}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const tone = optionStyles[i % optionStyles.length];
                const isPicked = picked === i;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className={`w-full justify-start whitespace-normal h-auto px-5 py-5 text-left text-base sm:text-lg ${tone} ${isPicked ? "ring-4 ring-white/80 scale-[1.01]" : ""}`}
                    onClick={() => setPicked(i)}
                    disabled={submitting}
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>

            {status && <div className="text-sm text-muted-foreground">{status}</div>}

            {!participantId && (
              <div className="text-xs text-muted-foreground">
                Kamu belum terdaftar di sesi ini. Kembali dan join ulang.
              </div>
            )}

            <Button
              className="w-full"
              onClick={submit}
              disabled={picked === null || !participantId || submitting}
            >
              Kirim Jawaban
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
