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
      className={`group w-full text-left rounded-2xl border px-6 py-5 transition-all duration-200 ${
        picked
          ? "border-[#B6C8FF] bg-[#F4F7FF] shadow-[0_12px_30px_-20px_rgba(77,115,255,0.6)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            picked ? "bg-[#6B9EFF] text-white" : "bg-[#F1F4FF] text-[#4C5AA5]"
          }`}
        >
          {letter}
        </div>
        <span className={`flex-1 text-base sm:text-lg ${picked ? "text-slate-900" : "text-slate-700"}`}>
          {label}
        </span>
      </div>
    </button>
  );
}

type SidebarItemProps = {
  label: string;
  index: number;
  active: boolean;
  done: boolean;
};

function SidebarItem({ label, index, active, done }: SidebarItemProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 transition-colors ${
        active ? "border-[#B6C8FF] bg-[#F4F7FF]" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            done ? "bg-[#E6F6EE] text-[#2D7A56]" : active ? "bg-[#6B9EFF] text-white" : "bg-[#F2F4F8] text-slate-600"
          }`}
        >
          {index + 1}
        </div>
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pertanyaan {index + 1}
          </div>
          <div className="text-sm text-slate-700 leading-snug">{label}</div>
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
      setStatus(json.error || "Gagal, coba lagi ya.");
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
      <div className="min-h-screen px-6 py-16 flex justify-center items-center">
        <Card className="w-full max-w-lg sticker border border-white/60 bg-white/90">
          <CardContent className="p-10 text-center space-y-3">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Bentar ya</div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Quiz lagi disiapin</h1>
            <p className="text-base text-muted-foreground">
              Siapin jempol, tinggal sebentar lagi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-16 flex justify-center items-center">
        <Card className="w-full max-w-xl sticker border border-white/60 bg-white/90">
          <CardContent className="p-10 space-y-6 text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Oops</div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Sesi belum ketemu</h1>
            <p className="text-base text-muted-foreground leading-relaxed">{error}</p>
            <Button size="lg" onClick={() => router.push("/join")}>
              Balik ke Halaman Join
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen px-6 py-16 flex justify-center items-center">
        <Card className="w-full max-w-xl sticker border border-white/60 bg-white/90">
          <CardContent className="p-10 space-y-6 text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Santai dulu</div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Quiz belum dimulai</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Tunggu host-nya mulaiin. Kamu bisa liat leaderboard dulu.
            </p>
            <Button size="lg" variant="outline" onClick={() => router.push(`/screen/${code}`)}>
              Lihat Leaderboard Dulu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;
  const answerOptions = [...q.options, "Semua jawaban di atas benar"];

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="order-2 lg:order-1">
          <Card className="sticker border border-white/60 bg-white/90">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Badge className="bg-[#F1F4FF] text-[#4451A3]">Sesi santai</Badge>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">Quiz Materi Hari Ini</h2>
                  <p className="text-sm text-muted-foreground">
                    Kode sesi {code} - {total} pertanyaan.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((question, index) => (
                  <SidebarItem
                    key={question.id}
                    label={question.question}
                    index={index}
                    active={index === idx}
                    done={index < idx}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-600">
                <div className="font-semibold text-slate-800 mb-1">Tips santai</div>
                Baca pelan, pilih yang paling masuk akal. Gak perlu buru-buru.
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="order-1 lg:order-2">
          <Card className="sticker border border-white/60 bg-white/90">
            <CardContent className="p-6 sm:p-8 lg:p-12">
              <div className="mb-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#F3F7FF] text-[#4451A3]">Quiz santai</Badge>
                    <Badge variant="outline" className="border-[#D4DDF5] text-slate-600">
                      Sesi {code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="size-10 rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50">
                      <svg className="mx-auto size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button className="size-10 rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50">
                      <svg className="mx-auto size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900">
                    Sesi Quiz {code}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                    Santai aja. Pilih jawaban yang paling masuk akal, nanti lanjut ke soal berikutnya.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full bg-[#EEF1F8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6B9EFF] to-[#9FB6FF] transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 min-w-[3.5rem] text-right">
                    {idx + 1}/{total}
                  </span>
                </div>
              </div>

              <div className="mb-10 space-y-6">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Pertanyaan</div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-relaxed">
                    {q.question}
                  </h2>
                  <p className="text-sm text-muted-foreground">Pilih satu jawaban yang paling cocok.</p>
                </div>

                <div className="space-y-4">
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
                <div className="mb-6 text-center text-sm text-slate-600 bg-[#F6F8FF] rounded-2xl px-4 py-3">
                  {status}
                </div>
              )}

              {!participantId && (
                <div className="mb-6 text-center text-sm text-slate-600 bg-[#FFF4F4] rounded-2xl px-4 py-3">
                  Kamu belum terdaftar di sesi ini. Yuk, balik dan join ulang dulu.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 font-medium"
                  onClick={() => idx > 0 && setIdx(idx - 1)}
                  disabled={idx === 0 || submitting}
                >
                  Balik dulu
                </Button>
                <Button
                  size="lg"
                  className="bg-[#6B9EFF] hover:bg-[#5B8EEF] text-white px-8 py-6 rounded-xl font-semibold text-base shadow-sm"
                  onClick={submit}
                  disabled={picked === null || !participantId || submitting}
                >
                  {submitting ? "Mengirim..." : "Kirim Jawaban"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
