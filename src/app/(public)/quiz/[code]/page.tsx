/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { 
  useParticipantSession, 
  useSession, 
  useQuestions, 
  useAnsweredQuestions,
  type Question 
} from "@/lib/hooks";

type OptionCardProps = {
  label: string;
  index: number;
  picked: boolean;
  disabled: boolean;
  onPick: () => void;
};

// Animation variants for option cards
const optionCardVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      delay: i * 0.08,
    },
  }),
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

function OptionCard({ label, index, picked, disabled, onPick }: OptionCardProps) {
  const letter = String.fromCharCode(65 + index);
  return (
    <motion.button
      custom={index}
      variants={optionCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onPick}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              scale: 1.02,
              boxShadow: picked
                ? "0 20px 40px -12px rgba(15, 23, 42, 0.35)"
                : "0 10px 30px -12px rgba(100, 116, 139, 0.15)",
              transition: { duration: 0.2 },
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={{
        backgroundColor: picked ? "#0f172a" : "#ffffff",
        borderColor: picked ? "#0f172a" : "#e2e8f0",
        color: picked ? "#ffffff" : "#0f172a",
      }}
      transition={{
        backgroundColor: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        borderColor: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`w-full text-left rounded-2xl border px-6 py-5 ${
        picked ? "shadow-lg" : ""
      } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{
            backgroundColor: picked ? "#ffffff" : "#f1f5f9",
            color: picked ? "#0f172a" : "#334155",
            scale: picked ? 1.1 : 1,
          }}
          transition={{ duration: 0.25, type: "spring", stiffness: 400 }}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {letter}
        </motion.div>
        <span className="flex-1 text-base sm:text-lg font-medium leading-relaxed">
          {label}
        </span>
        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

type ProgressItemProps = {
  index: number;
  active: boolean;
  done: boolean;
};

function ProgressItem({ index, active, done }: ProgressItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        backgroundColor: active ? "#0f172a" : done ? "#f1f5f9" : "#ffffff",
        borderColor: active ? "#0f172a" : "#e2e8f0",
      }}
      transition={{
        delay: index * 0.03,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
      className="rounded-xl border px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{
            color: active ? "#ffffff" : done ? "#475569" : "#94a3b8",
          }}
          className="text-xs font-medium"
        >
          Soal {index + 1}
        </motion.div>
        {done && !active && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function QuizPage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const router = useRouter();

  // Use SWR hooks for data fetching with caching
  const { 
    session: participantSession, 
    participantId, 
    sessionId: authSessionId,
    sessionCode: authSessionCode,
    isLoading: authLoading 
  } = useParticipantSession();

  const { session, isLoading: sessionLoading } = useSession(code);
  const sessionId = authSessionId || session?.id || null;
  
  const { questions, isLoading: questionsLoading } = useQuestions(sessionId);
  const { answeredQuestions, refresh: refreshAnswers } = useAnsweredQuestions(
    sessionId, 
    participantId || null
  );

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hideBar, setHideBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  // Check if participant session matches current quiz code
  const isValidSession = useMemo(() => {
    if (!participantSession?.authenticated) return false;
    return authSessionCode === code;
  }, [participantSession, authSessionCode, code]);

  // Loading state
  const isLoading = authLoading || sessionLoading || questionsLoading;

  // Initialize question index based on answered questions
  useEffect(() => {
    if (initialized || questionsLoading || !questions.length) return;
    
    const firstUnanswered = questions.findIndex((q) => !answeredQuestions.has(q.id));
    
    if (firstUnanswered === -1 && answeredQuestions.size > 0) {
      // All questions answered
      router.replace(`/quiz/${code}/done`);
      return;
    }
    
    setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
    setInitialized(true);
  }, [questions, answeredQuestions, questionsLoading, initialized, code, router]);

  // Check if session has ended
  useEffect(() => {
    if (session?.ended_at) {
      router.replace(`/quiz/${code}/done`);
    }
  }, [session, code, router]);

  // Mobile detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Scroll hide bar effect
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

  const q = questions[idx] as Question | undefined;
  const total = questions.length;

  const canAnswer = useMemo(() => !!q && (isValidSession || participantId), [q, isValidSession, participantId]);

  async function submit() {
    if (!canAnswer || picked === null || !q) return;
    setSubmitting(true);
    setStatus("Lagi ngirim jawaban...");
    toast.loading("Mengirim jawaban...", { id: "submit-answer" });

    const res = await fetch("/api/answer/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: q.id,
        answer_index: picked,
        // Fallback for backward compatibility (will be ignored if cookie exists)
        participant_id: participantId,
        session_id: sessionId,
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
    
    // Refresh answered questions cache
    await refreshAnswers();
    
    setPicked(null);
    setStatus(null);
    setSubmitting(false);
    
    if (idx + 1 < total) {
      setIdx(idx + 1);
    } else {
      router.push(`/quiz/${code}/done`);
    }
  }

  if (isLoading) {
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

  if (!session) {
    return (
      <div className="min-h-screen px-6 py-20 flex justify-center items-center">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Error</h1>
            <p className="text-lg text-slate-500">Sesi tidak ketemu. Coba cek kodenya lagi ya.</p>
          </div>
          <Button size="lg" onClick={() => router.push("/join")} className="rounded-full">
            Kembali ke Join
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSession && !participantId) {
    return (
      <div className="min-h-screen px-6 py-20 flex justify-center items-center">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Belum Terdaftar</h1>
            <p className="text-lg text-slate-500">
              Kamu belum join sesi ini. Silakan join dulu ya.
            </p>
          </div>
          <Button size="lg" onClick={() => router.push(`/join/${code}`)} className="rounded-full">
            Join Sesi
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
              done={index < idx || answeredQuestions.has(questions[index]?.id)}
            />
          ))}
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 30, scale: 0.97, rotateX: 5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.97, rotateX: -5 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.8,
            }}
            style={{ perspective: 1200 }}
            className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 space-y-10 shadow-sm"
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

            <motion.div
              aria-hidden={isMobile && hideBar}
              initial={{ y: 50, opacity: 0 }}
              animate={{
                y: isMobile && hideBar ? 96 : 0,
                opacity: isMobile && hideBar ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              style={{ pointerEvents: isMobile && hideBar ? "none" : "auto" }}
              className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:pt-6">
                <motion.div
                  whileHover={{ scale: idx > 0 && !submitting ? 1.02 : 1 }}
                  whileTap={{ scale: idx > 0 && !submitting ? 0.98 : 1 }}
                  className="order-2 sm:order-1 w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    onClick={() => idx > 0 && setIdx(idx - 1)}
                    disabled={idx === 0 || submitting}
                    className="w-full rounded-full h-12 text-slate-600"
                  >
                    Kembali
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{
                    scale: picked !== null && canAnswer && !submitting ? 1.02 : 1,
                    boxShadow:
                      picked !== null && canAnswer && !submitting
                        ? "0 20px 40px -12px rgba(15, 23, 42, 0.25)"
                        : "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
                  }}
                  whileTap={{ scale: picked !== null && canAnswer && !submitting ? 0.98 : 1 }}
                  animate={
                    submitting
                      ? { scale: [1, 1.02, 1] }
                      : {}
                  }
                  transition={
                    submitting
                      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      : { type: "spring", stiffness: 400, damping: 25 }
                  }
                  className="order-1 sm:order-2 w-full sm:flex-1"
                >
                  <Button
                    size="lg"
                    className="w-full rounded-full h-14 text-base shadow-lg shadow-slate-900/10"
                    onClick={submit}
                    disabled={picked === null || !canAnswer || submitting}
                  >
                    <AnimatePresence mode="wait">
                      {submitting ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="size-4 rounded-full border-2 border-white/50 border-t-white"
                          />
                          Mengirim...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Kirim Jawaban
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
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
