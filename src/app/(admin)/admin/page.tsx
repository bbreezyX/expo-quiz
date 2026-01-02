"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import QRCode from "react-qr-code";

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

// Reusable Components
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-500 text-xs sm:text-sm">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "ended" | "none" }) {
  const styles = {
    active: "bg-slate-900 text-white",
    ended: "bg-slate-200 text-slate-600",
    none: "bg-slate-100 text-slate-500",
  };
  const labels = {
    active: "Aktif",
    ended: "Selesai",
    none: "Belum ada",
  };
  return (
    <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function InfoBox({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="space-y-1 flex-1 min-w-0 mr-2">
        <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</div>
        <div className="font-mono text-xs sm:text-sm text-slate-900 break-all">{value}</div>
      </div>
      {onCopy && (
        <Button size="sm" variant="ghost" onClick={onCopy} className="shrink-0 h-8 sm:h-9 text-xs sm:text-sm font-medium">
          Salin
        </Button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [qrBusy, setQrBusy] = useState(false);
  const qrRef = useRef<HTMLDivElement | null>(null);

  const readJson = useCallback(async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, []);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/session/list");
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Daftar sesi belum bisa dimuat.");
      return;
    }
    setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
  }, [readJson]);

  // Set origin on mount (client-side only)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Auth check - check authentication status on mount
  useEffect(() => {
    const authenticated = localStorage.getItem("admin_authenticated");
    const authTime = localStorage.getItem("admin_auth_time");

    if (authenticated && authTime) {
      const timeDiff = Date.now() - parseInt(authTime);
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("admin_authenticated");
        localStorage.removeItem("admin_auth_time");
        router.push("/admin/login");
      }
    } else {
      router.push("/admin/login");
    }
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      const res = await fetch("/api/session/list");
      const json = await readJson(res);

      if (cancelled) return;

      if (!res.ok) {
        setStatus(json?.error || "Daftar sesi belum bisa dimuat.");
        return;
      }
      setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, readJson]);

  async function createSession() {
    setStatus(null);
    setBusy(true);
    toast.loading("Membuat sesi baru...", { id: "create-session" });

    const res = await fetch("/api/session/create", { method: "POST" });
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Gagal membuat sesi", {
        id: "create-session",
        description: json?.error || "Belum bisa bikin sesi.",
      });
      setStatus(json?.error || "Belum bisa bikin sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      toast.error("Error", {
        id: "create-session",
        description: "Respons server belum valid.",
      });
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setManualCode(json.session.code);
    await loadSessions();
    toast.success("Sesi berhasil dibuat!", {
      id: "create-session",
      description: `Kode sesi: ${json.session.code}`,
    });
    setBusy(false);
  }

  async function loadSession() {
    const inputCode = manualCode.trim().toUpperCase();
    if (!inputCode) return;
    setStatus("Lagi memuat sesi...");
    setBusy(true);
    toast.loading("Memuat sesi...", { id: "load-session" });

    const res = await fetch(`/api/session/${inputCode}`);
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Sesi tidak ditemukan", {
        id: "load-session",
        description: json?.error || "Sesi belum ketemu.",
      });
      setStatus(json?.error || "Sesi belum ketemu.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      toast.error("Error", {
        id: "load-session",
        description: "Respons server belum valid.",
      });
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setStatus(null);
    await loadSessions();
    toast.success("Sesi berhasil dimuat!", {
      id: "load-session",
      description: `Kode: ${json.session.code}`,
    });
    setBusy(false);
  }

  const loadQuestions = useCallback(async (sid: string) => {
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
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, order_no, question, options, correct_index, points")
        .eq("session_id", sessionId)
        .order("order_no", { ascending: true });

      if (cancelled) return;

      if (error) {
        setStatus("Pertanyaan belum bisa dimuat.");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuestions(((data as any) ?? []).map((q: any) => ({ ...q, options: q.options as string[] })));
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function addQuestion() {
    if (!code) {
      toast.error("Buat sesi dulu", {
        description: "Buat atau muat sesi dulu ya.",
      });
      setStatus("Buat atau muat sesi dulu ya.");
      return;
    }
    if (endedAt) {
      toast.warning("Sesi sudah selesai", {
        description: "Tidak bisa menambah pertanyaan.",
      });
      setStatus("Sesi sudah selesai.");
      return;
    }

    const trimmed = options.map((opt) => opt.trim());
    const filled = trimmed.filter(Boolean);
    const hasGap = trimmed.slice(0, filled.length).some((opt) => !opt);

    if (!questionText.trim()) {
      toast.error("Pertanyaan kosong", {
        description: "Pertanyaan wajib diisi.",
      });
      setStatus("Pertanyaan wajib diisi.");
      return;
    }
    if (filled.length < 2) {
      toast.error("Opsi kurang", {
        description: "Minimal 2 opsi jawaban.",
      });
      setStatus("Minimal 2 opsi jawaban.");
      return;
    }
    if (hasGap) {
      toast.error("Urutan opsi salah", {
        description: "Isi opsi dari atas ke bawah.",
      });
      setStatus("Isi opsi dari atas ke bawah.");
      return;
    }
    if (correctIndex < 0 || correctIndex >= filled.length) {
      toast.error("Jawaban benar belum dipilih", {
        description: "Opsi benar belum valid.",
      });
      setStatus("Opsi benar belum valid.");
      return;
    }

    setBusy(true);
    toast.loading("Menambahkan pertanyaan...", { id: "add-question" });

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
      toast.error("Gagal menambah pertanyaan", {
        id: "add-question",
        description: json?.error || "Belum bisa menambah pertanyaan.",
      });
      setStatus(json?.error || "Belum bisa menambah pertanyaan.");
      setBusy(false);
      return;
    }
    if (!json?.question) {
      toast.error("Error", {
        id: "add-question",
        description: "Respons server belum valid.",
      });
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }

    setQuestionText("");
    setOptions(emptyOptions);
    setCorrectIndex(0);
    setPoints(100);
    setStatus(null);
    if (sessionId) await loadQuestions(sessionId);
    toast.success("Pertanyaan berhasil ditambahkan!", {
      id: "add-question",
      description: `${filled.length} opsi jawaban`,
    });
    setBusy(false);
  }

  async function endSession() {
    if (!code) return;
    setStatus(null);
    setBusy(true);
    toast.loading("Mengakhiri sesi...", { id: "end-session" });

    const res = await fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Gagal mengakhiri sesi", {
        id: "end-session",
        description: json?.error || "Belum bisa mengakhiri sesi.",
      });
      setStatus(json?.error || "Belum bisa mengakhiri sesi.");
      setBusy(false);
      return;
    }
    if (!json?.session) {
      toast.error("Error", {
        id: "end-session",
        description: "Respons server belum valid.",
      });
      setStatus("Respons server belum valid.");
      setBusy(false);
      return;
    }
    setEndedAt(json.session.ended_at ?? null);
    setStatus(null);
    await loadSessions();
    toast.success("Sesi berhasil diakhiri!", {
      id: "end-session",
      description: "Peserta tidak bisa menjawab lagi",
    });
    setBusy(false);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  const joinUrl = code && origin ? `${origin}/join/${code}` : "";
  const screenUrl = code && origin ? `${origin}/screen/${code}` : "";

  function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast.success("Tersalin!", {
      description: "Text sudah disalin ke clipboard",
    });
  }

  const buildQrBlob = useCallback(async (size = 512) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) throw new Error("QR belum siap");

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas tidak tersedia"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Gagal membuat QR"));
            return;
          }
          resolve(blob);
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal memuat QR"));
      };
      img.src = url;
    });
  }, []);

  const shareQr = useCallback(async () => {
    if (!joinUrl || !code) return;
    setQrBusy(true);
    try {
      const blob = await buildQrBlob();
      const filename = `qr-${code}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `QR Sesi ${code}`,
          text: "Scan untuk ikut quiz",
        });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 250);
        toast.success("QR tersimpan", {
          description: "File QR disimpan ke perangkat.",
        });
      }
    } catch (error) {
      toast.error("Gagal membagikan QR", {
        description: error instanceof Error ? error.message : "Coba ulangi.",
      });
    } finally {
      setQrBusy(false);
    }
  }, [buildQrBlob, code, joinUrl]);

  const sessionStatus = code ? (endedAt ? "ended" : "active") : "none";

  function handleLogout() {
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("admin_auth_time");
    toast.success("Logout berhasil");
    router.push("/admin/login");
  }

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-lg text-slate-500">Memuat...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl space-y-10 sm:space-y-16">
        <header className="text-center space-y-4 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
              <Image
                src="/logo1.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title & Logout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight">
              Admin Dashboard
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-full sm:mt-2"
            >
              Logout
            </Button>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto px-4">
            Kelola sesi quiz dengan mudah
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* Divider vertikal di tengah */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2"></div>

          {/* Kolom Kiri: Sesi & Tambah Pertanyaan */}
          <div className="space-y-8 lg:pr-8">
            <Section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Sesi" subtitle="Buat sesi baru atau muat yang sudah ada" />
                <StatusBadge status={sessionStatus} />
              </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={createSession}
                disabled={busy}
                size="lg"
                className="rounded-full px-8 text-base font-semibold shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
              >
                Buat Sesi Baru
              </Button>
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Kode sesi"
                  className="rounded-full border-slate-200 h-11 text-base"
                />
                <Button
                  variant="outline"
                  onClick={loadSession}
                  disabled={busy}
                  size="lg"
                  className="rounded-full px-6 sm:px-8 font-semibold whitespace-nowrap"
                >
                  Muat
                </Button>
              </div>
            </div>

            {code && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                <InfoBox label="Kode Sesi" value={code} onCopy={() => copyText(code)} />
                <InfoBox label="Link Peserta" value={joinUrl} onCopy={() => copyText(joinUrl)} />
                <InfoBox label="Link Layar" value={screenUrl} onCopy={() => copyText(screenUrl)} />

                {joinUrl && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">
                      QR Peserta
                    </div>
                    <div ref={qrRef} className="mt-3 flex justify-center">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <QRCode value={joinUrl} size={180} bgColor="#FFFFFF" fgColor="#111111" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 text-center">
                      Scan untuk masuk ke sesi quiz
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={shareQr}
                        disabled={qrBusy}
                        className="rounded-full text-xs sm:text-sm"
                      >
                        {qrBusy ? "Menyiapkan..." : "Share QR"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs sm:text-sm text-slate-500">
                    {endedAt ? "Sesi sudah selesai" : "Sesi sedang berjalan"}
                  </p>
                  {!endedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={endSession}
                      disabled={busy}
                      className="rounded-full text-xs sm:text-sm h-8 sm:h-9 px-4 sm:px-5 font-medium"
                    >
                      Akhiri Sesi
                    </Button>
                  )}
                </div>
              </div>
            )}

            {status && (
              <div className="bg-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-600">
                {status}
              </div>
            )}
          </div>
            </Section>

            <Section>
              <div className="mb-6">
                <SectionHeader title="Tambah Pertanyaan" subtitle="Buat pertanyaan baru untuk sesi ini" />
              </div>

          {endedAt && (
            <div className="bg-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-600 mb-6">
              Sesi sudah selesai. Pertanyaan tidak bisa ditambah.
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                Pertanyaan
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan di sini..."
                disabled={busy || !code || !!endedAt}
                className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:text-base outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                Opsi Jawaban
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                    disabled={busy || !code || !!endedAt}
                    className="rounded-xl border-slate-200 h-11 text-sm sm:text-base"
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                  Jawaban Benar
                </label>
                <select
                  value={String(correctIndex)}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                  disabled={busy || !code || !!endedAt}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm sm:text-base outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                >
                  {options.map((_, i) => (
                    <option key={i} value={i}>
                      Opsi {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                  Poin
                </label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  min={0}
                  disabled={busy || !code || !!endedAt}
                  className="rounded-xl border-slate-200 h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            <Button
              onClick={addQuestion}
              disabled={busy || !code || !!endedAt}
              size="lg"
              className="w-full rounded-full text-base font-semibold shadow-sm hover:shadow-md transition-all"
            >
              Tambah Pertanyaan
            </Button>
              </div>
            </Section>
          </div>

          {/* Kolom Kanan: Riwayat Sesi & Bank Pertanyaan */}
          <div className="space-y-8 lg:pl-8">
            <Section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Riwayat Sesi" subtitle="Sesi yang pernah dibuat" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessions}
                  disabled={busy}
                  className="rounded-full h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 font-medium"
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-slate-100
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-slate-300
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-slate-400">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => {
                      setManualCode(s.code);
                      setCode(s.code);
                      setSessionId(s.id);
                      setEndedAt(s.ended_at ?? null);
                    }}
                  >
                    <div className="space-y-1.5">
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">{s.title}</div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-xs sm:text-sm">{s.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-medium ${
                        s.ended_at ? "text-slate-400" : "text-green-600"
                      }`}>
                        {s.ended_at ? "Selesai" : "Aktif"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualCode(s.code);
                          setCode(s.code);
                          setSessionId(s.id);
                          setEndedAt(s.ended_at ?? null);
                        }}
                        className="rounded-full h-7 sm:h-8 text-xs sm:text-sm font-medium"
                      >
                        Pilih
                      </Button>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-400">
                    Belum ada sesi tersimpan
                  </div>
                )}
              </div>
            </Section>

            <Section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Bank Pertanyaan" subtitle="Daftar pertanyaan yang sudah dibuat" />
                <div className="bg-slate-100 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-600">
                  {questions.length} pertanyaan
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-slate-100
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-slate-300
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-slate-400">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs sm:text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Q{q.order_no}</span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 bg-amber-50 px-3 py-1 rounded-full">{q.points} poin</span>
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-4 sm:mb-5 leading-relaxed">{q.question}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={`${q.id}-${i}`}
                          className={`rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm border transition-all ${
                            i === q.correct_index
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                              : "bg-slate-50 text-slate-700 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60 mb-1">
                            Opsi {i + 1}
                          </div>
                          <div className="font-medium text-xs sm:text-sm">{opt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-sm text-slate-400">
                    Belum ada pertanyaan. Tambahkan dari form di atas.
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}
