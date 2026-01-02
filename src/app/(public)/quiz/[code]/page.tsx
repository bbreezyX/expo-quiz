"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

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
      <div className="flex items-center gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            picked ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
          }`}
        >
          {letter}
        </div>
        <span className={`flex-1 text-base sm:text-lg font-medium leading-relaxed`}>
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
  const [hideBar, setHideBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

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
      const storedParticipantId = localStorage.getItem(`participant:${code}`);
      if (storedParticipantId) {
        setParticipantId(storedParticipantId);
      }
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
      const normalizedQuestions = (qs ?? []).map((q: any) => ({ ...q, options: q.options as string[] }));
      setQuestions(normalizedQuestions);
      setSessionId(s.id);
      let nextIndex = 0;
      if (storedParticipantId && normalizedQuestions.length > 0) {
        const { data: answers, error: answersErr } = await supabase
          .from("answers")
          .select("question_id")
          .eq("session_id", s.id)
          .eq("participant_id", storedParticipantId);

        if (!answersErr && answers?.length) {
          const answered = new Set((answers as Array<{ question_id: string }>).map((a) => a.question_id));
          const firstUnanswered = normalizedQuestions.findIndex((q) => !answered.has(q.id));
          if (firstUnanswered === -1) {
            setLoading(false);
            router.replace(`/quiz/${code}/done`);
            return;
          }
          nextIndex = firstUnanswered;
        }
      }
      setIdx(nextIndex);
      setPicked(null);
      setLoading(false);
    }
    load();
  }, [code, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isMobile || picked !== null) {
      setHideBar(false);
      return;
    }
    lastScrollY.current = window.scrollY;

    function onScroll() {
      if (scrollTicking.current) return;
      scrollTicking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (Math.abs(delta) > 8) {
          const shouldHide = currentY > lastScrollY.current && currentY > 96;
          setHideBar((prev) => (prev === shouldHide ? prev : shouldHide));
          lastScrollY.current = currentY;
        }

        scrollTicking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile, picked]);

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

    toast.success("Jawaban terkirim!", { id: "submit-answer" });
    setPicked(null);
    setStatus(null);
    setSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 pt-8 pb-28 sm:px-6 sm:pt-12 sm:pb-12">
      <div className="mx-auto max-w-3xl space-y-8 sm:space-y-12">
        {/* Logo - Small */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            <Image
              src="/logo1.png"
              alt="Expo Quiz Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Quiz</h1>
            <span className="font-mono text-base sm:text-lg text-slate-500">{code}</span>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 space-y-10"
          >
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
                <span className="inline-flex items-center justify-center gap-2">
                  {submitting && (
                    <span className="size-4 animate-spin rounded-full border-2 border-slate-400/40 border-t-slate-500" />
                  )}
                  {status}
                </span>
              </div>
            )}

            {!participantId && (
              <div className="text-center text-sm text-slate-600 bg-slate-100 rounded-2xl px-6 py-4">
                Kamu belum terdaftar. Silakan join ulang.
              </div>
            )}

            <motion.div
              aria-hidden={isMobile && hideBar}
              animate={{ y: isMobile && hideBar ? 96 : 0, opacity: isMobile && hideBar ? 0 : 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ pointerEvents: isMobile && hideBar ? "none" : "auto" }}
              className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:pt-6">
                <Button
                  variant="outline"
                  onClick={() => idx > 0 && setIdx(idx - 1)}
                  disabled={idx === 0 || submitting}
                  className="order-2 sm:order-1 w-full sm:w-auto rounded-full h-12 text-slate-600"
                >
                  Kembali
                </Button>
                <Button
                  size="lg"
                  className="order-1 sm:order-2 w-full sm:flex-1 rounded-full h-14 text-base shadow-lg shadow-slate-900/10"
                  onClick={submit}
                  disabled={picked === null || !participantId || submitting}
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                      Mengirim...
                    </span>
                  ) : (
                    "Kirim Jawaban"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Tips */}
        <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 text-center text-sm text-slate-600">
          Pilih jawaban yang paling tepat
        </div>
      </div>
    </div>
  );
}
