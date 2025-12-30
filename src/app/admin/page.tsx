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
      setStatus(json?.error || "Gagal memuat daftar sesi.");
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
      setStatus(json?.error || "Gagal membuat sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server tidak valid.");
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
    setStatus("Memuat sesi...");
    setBusy(true);
    const res = await fetch(`/api/session/${inputCode}`);
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Sesi tidak ditemukan.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server tidak valid.");
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
      setStatus("Gagal memuat pertanyaan.");
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
      setStatus("Buat atau muat sesi terlebih dahulu.");
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
      setStatus("Opsi benar tidak valid.");
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
      setStatus(json?.error || "Gagal menambah pertanyaan.");
      setBusy(false);
      return;
    }
    if (!json?.question) {
      setStatus("Respons server tidak valid.");
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
      setStatus(json?.error || "Gagal mengakhiri sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      setStatus("Respons server tidak valid.");
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

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="text-center space-y-3">
          <Badge className="bg-white/70 text-foreground border-white/60">Admin</Badge>
          <h1 className="font-display text-4xl sm:text-5xl">Pusat Kontrol Expo Quiz</h1>
          <p className="text-muted-foreground">
            Buat sesi, bagikan kode, dan susun pertanyaan untuk peserta.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Sesi
                  </div>
                  <h2 className="font-display text-2xl">Buat atau muat sesi</h2>
                </div>
                <Badge className="bg-white/70 text-foreground border-white/60">
                  {code ? (endedAt ? "Selesai" : "Aktif") : "Belum ada"}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={createSession} disabled={busy}>
                  Buat Sesi
                </Button>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode sesi"
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={loadSession} disabled={busy}>
                    Muat
                  </Button>
                </div>
              </div>

              {code && (
                <div className="space-y-3 rounded-xl border border-white/60 bg-white/60 p-4 text-sm">
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
                      {endedAt ? "Sesi sudah selesai." : "Sesi sedang berjalan."}
                    </div>
                    {!endedAt && (
                      <Button size="sm" variant="outline" onClick={endSession} disabled={busy}>
                        Akhiri sesi
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {status && <div className="text-sm text-muted-foreground">{status}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Questions
                </div>
                <h2 className="font-display text-2xl">Tambah pertanyaan</h2>
              </div>
              {endedAt && (
                <div className="text-xs text-muted-foreground">
                  Sesi sudah selesai. Pertanyaan tidak bisa ditambah.
                </div>
              )}

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan di sini..."
                disabled={busy || !code || !!endedAt}
                className="min-h-[120px] w-full rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                    disabled={busy || !code || !!endedAt}
                  />
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Opsi benar
                  </label>
                  <select
                    value={String(correctIndex)}
                    onChange={(e) => setCorrectIndex(Number(e.target.value))}
                    disabled={busy || !code || !!endedAt}
                    className="h-10 w-full rounded-lg border border-white/60 bg-white/70 px-3 text-sm shadow-sm backdrop-blur-md outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {options.map((_, i) => (
                      <option key={i} value={i}>
                        Opsi {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Poin
                  </label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min={0}
                    disabled={busy || !code || !!endedAt}
                  />
                </div>
              </div>

              <Button onClick={addQuestion} disabled={busy || !code || !!endedAt}>
                Tambah Pertanyaan
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Riwayat Sesi
                </div>
                <h2 className="font-display text-2xl">Sesi terakhir</h2>
              </div>
              <Button variant="outline" onClick={loadSessions} disabled={busy}>
                Muat ulang
              </Button>
            </div>

            <div className="grid gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{s.title}</div>
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
                <div className="rounded-xl border border-dashed border-white/60 bg-white/50 p-6 text-sm text-muted-foreground">
                  Belum ada sesi tersimpan.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Bank Pertanyaan
                </div>
                <h2 className="font-display text-2xl">Daftar pertanyaan</h2>
              </div>
              <Badge className="bg-white/70 text-foreground border-white/60">
                {questions.length} item
              </Badge>
            </div>

            <div className="grid gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>Q{q.order_no}</div>
                    <div>{q.points} poin</div>
                  </div>
                  <div className="mt-2 text-lg font-semibold">{q.question}</div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={`${q.id}-${i}`}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          i === q.correct_index
                            ? "border-foreground/40 bg-white"
                            : "border-white/60 bg-white/60"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Opsi {i + 1}
                        </div>
                        <div className="font-medium">{opt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/60 bg-white/50 p-6 text-sm text-muted-foreground">
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
