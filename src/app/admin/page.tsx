"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Question = {
  id: string;
  order_no: number;
  question: string;
  options: string[];
  correct_index: number;
  points: number;
};

type SessionSummary = {
  id: string;
  code: string;
  title: string;
  created_at: string;
  ended_at: string | null;
};

const emptyOptions = ["", "", "", ""];

export default function AdminPage() {
  const [code, setCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [manualCode, setManualCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(100);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  async function readJson(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const res = await fetch("/api/session/list");
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Daftar sesi belum bisa dimuat.");
      return;
    }
    setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
  }

  async function createSession() {
    setStatus(null);
    setBusy(true);
    const res = await fetch("/api/session/create", { method: "POST" });
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Belum bisa bikin sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setManualCode(json.session.code);
    await loadSessions();
    setBusy(false);
  }

  async function loadSession() {
    const inputCode = manualCode.trim().toUpperCase();
    if (!inputCode) return;
    setStatus("Lagi memuat sesi...");
    setBusy(true);
    const res = await fetch(`/api/session/${inputCode}`);
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Sesi belum ketemu.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setStatus(null);
    await loadSessions();
    setBusy(false);
  }

  async function loadQuestions(sid: string) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, order_no, question, options, correct_index, points")
      .eq("session_id", sid)
      .order("order_no", { ascending: true });

    if (error) {
      setStatus("Pertanyaan belum bisa dimuat.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setQuestions(((data as any) ?? []).map((q: any) => ({ ...q, options: q.options as string[] })));
  }

  useEffect(() => {
    if (sessionId) loadQuestions(sessionId);
  }, [sessionId]);

  async function addQuestion() {
    if (!code) {
      setStatus("Buat atau muat sesi dulu ya.");
      return;
    }
    if (endedAt) {
      setStatus("Sesi sudah selesai.");
      return;
    }

    const trimmed = options.map((opt) => opt.trim());
    const filled = trimmed.filter(Boolean);
    const hasGap = trimmed.slice(0, filled.length).some((opt) => !opt);

    if (!questionText.trim()) {
      setStatus("Pertanyaan wajib diisi.");
      return;
    }
    if (filled.length < 2) {
      setStatus("Minimal 2 opsi jawaban.");
      return;
    }
    if (hasGap) {
      setStatus("Isi opsi dari atas ke bawah.");
      return;
    }
    if (correctIndex < 0 || correctIndex >= filled.length) {
      setStatus("Opsi benar belum valid.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/question/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        question: questionText,
        options: filled,
        correct_index: correctIndex,
        points,
      }),
    });
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Belum bisa menambah pertanyaan.");
      setBusy(false);
      return;
    }
    if (!json?.question) {
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }

    setQuestionText("");
    setOptions(emptyOptions);
    setCorrectIndex(0);
    setPoints(100);
    setStatus("Pertanyaan ditambahkan.");
    if (sessionId) await loadQuestions(sessionId);
    setBusy(false);
  }

  async function endSession() {
    if (!code) return;
    setStatus(null);
    setBusy(true);
    const res = await fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Belum bisa mengakhiri sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setEndedAt(json.session.ended_at ?? null);
    setStatus("Sesi diakhiri.");
    await loadSessions();
    setBusy(false);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setStatus("Tersalin ke clipboard.");
  }

  const joinUrl = code && origin ? `${origin}/join/${code}` : "";
  const screenUrl = code && origin ? `${origin}/screen/${code}` : "";

  const badgeTone = code
    ? endedAt
      ? "bg-[#FFF6DB] text-[#6C4B00]"
      : "bg-[#E9F7F0] text-[#2D7A56]"
    : "bg-[#F6F8FF] text-[#4451A3]";

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="text-center space-y-3">
          <Badge className="bg-[#F3F7FF] text-[#4451A3]">Admin</Badge>
          <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900">
            Dashboard Admin Expo Quiz
          </h1>
          <p className="text-muted-foreground">
            Bikin sesi, bagi kode, dan susun pertanyaan dengan rapi.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="sticker border border-white/60 bg-white/90">
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Sesi
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900">Buat atau muat sesi</h2>
                </div>
                <Badge className={badgeTone}>
                  {code ? (endedAt ? "Selesai" : "Aktif") : "Belum ada"}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={createSession} disabled={busy} size="lg">
                  Buat Sesi
                </Button>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode sesi"
                    className="uppercase bg-white"
                  />
                  <Button variant="outline" onClick={loadSession} disabled={busy} size="lg">
                    Muat
                  </Button>
                </div>
              </div>

              {code && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      Kode: <span className="font-mono font-semibold">{code}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyText(code)}>
                      Salin kode
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="break-all">Join: {joinUrl}</div>
                      <Button size="sm" variant="outline" onClick={() => copyText(joinUrl)}>
                        Salin link
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="break-all">Screen: {screenUrl}</div>
                      <Button size="sm" variant="outline" onClick={() => copyText(screenUrl)}>
                        Salin link
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {endedAt ? "Sesi sudah selesai." : "Sesi lagi berjalan."}
                    </div>
                    {!endedAt && (
                      <Button size="sm" variant="outline" onClick={endSession} disabled={busy}>
                        Akhiri sesi
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {status && (
                <div className="rounded-2xl bg-[#F6F8FF] px-4 py-3 text-sm text-slate-600">
                  {status}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="sticker border border-white/60 bg-white/90">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Pertanyaan
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Tambah pertanyaan</h2>
              </div>
              {endedAt && (
                <div className="rounded-2xl bg-[#FFF6DB] px-4 py-3 text-xs text-[#6C4B00]">
                  Sesi sudah selesai. Pertanyaan tidak bisa ditambah.
                </div>
              )}

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan di sini..."
                disabled={busy || !code || !!endedAt}
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                    disabled={busy || !code || !!endedAt}
                    className="bg-white border-slate-200"
                  />
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Opsi benar
                  </label>
                  <select
                    value={String(correctIndex)}
                    onChange={(e) => setCorrectIndex(Number(e.target.value))}
                    disabled={busy || !code || !!endedAt}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {options.map((_, i) => (
                      <option key={i} value={i}>
                        Opsi {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Poin
                  </label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min={0}
                    disabled={busy || !code || !!endedAt}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

              <Button onClick={addQuestion} disabled={busy || !code || !!endedAt} size="lg">
                Tambah Pertanyaan
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="sticker border border-white/60 bg-white/90">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Riwayat sesi
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Sesi terakhir</h2>
              </div>
              <Button variant="outline" onClick={loadSessions} disabled={busy}>
                Muat ulang
              </Button>
            </div>

            <div className="grid gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Kode: <span className="font-mono">{s.code}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {s.ended_at ? "Selesai" : "Aktif"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setManualCode(s.code);
                      setCode(s.code);
                      setSessionId(s.id);
                      setEndedAt(s.ended_at ?? null);
                    }}
                  >
                    Pilih
                  </Button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-muted-foreground">
                  Belum ada sesi tersimpan.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="sticker border border-white/60 bg-white/90">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Bank pertanyaan
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Daftar pertanyaan</h2>
              </div>
              <Badge className="bg-[#F6F8FF] text-[#4451A3] border border-[#D4DDF5]">
                {questions.length} item
              </Badge>
            </div>

            <div className="grid gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>Q{q.order_no}</div>
                    <div>{q.points} poin</div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{q.question}</div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, i) => {
                      const palette = [
                        "bg-[#FFE9EC] text-[#8B2C3B]",
                        "bg-[#EAF1FF] text-[#2D4C9B]",
                        "bg-[#FFF6DB] text-[#7A5A16]",
                        "bg-[#E9F7F0] text-[#2D7A56]",
                      ];
                      const paletteIndex = i % palette.length;
                      const tone = palette[paletteIndex];
                      return (
                        <div
                          key={`${q.id}-${i}`}
                          className={`rounded-2xl px-3 py-3 text-sm border border-white/70 ${tone} ${
                            i === q.correct_index ? "ring-2 ring-[#B6C8FF]" : ""
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                            Opsi {i + 1}
                          </div>
                          <div className="font-medium">{opt}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-muted-foreground">
                  Belum ada pertanyaan. Tambahkan dari form di atas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
