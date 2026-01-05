"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import NextImage from "next/image";
import QRCode from "react-qr-code";

type Question = {
  id: string;
  order_no?: number; // Optional in Bank
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
  const [activeTab, setActiveTab] = useState<"session" | "bank">("session");

  // Session State
  const [code, setCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [qrBusy, setQrBusy] = useState(false);
  const qrRef = useRef<HTMLDivElement | null>(null);

  // Question Form State (Used for both Session & Bank)
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(100);

  // Bank State
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const readJson = useCallback(async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, []);

  // --- Session Logic ---

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/session/list");
    const json = await readJson(res);
    if (!res.ok) {
      setStatus(json?.error || "Daftar sesi belum bisa dimuat.");
      return;
    }
    setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
  }, [readJson]);

  // Load sessions on mount
  useEffect(() => {
    setOrigin(window.location.origin);
    loadSessions();
    loadBankQuestions();
  }, [loadSessions]);

  async function createSession() {
    setStatus(null);
    setBusy(true);
    toast.loading("Membuat sesi baru...", { id: "create-session" });

    const res = await fetch("/api/session/create", { method: "POST" });
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Gagal membuat sesi", { id: "create-session", description: json?.error || "Error unknown" });
      setStatus(json?.error);
      setBusy(false);
      return;
    }
    
    if (json?.session) {
    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setManualCode(json.session.code);
    await loadSessions();
      toast.success("Sesi berhasil dibuat!", { id: "create-session", description: `Kode: ${json.session.code}` });
    }
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
    if (!res.ok || !json?.session) {
      toast.error("Sesi tidak ditemukan", { id: "load-session", description: json?.error });
      setStatus(json?.error || "Sesi tidak ditemukan");
      setBusy(false);
      return;
    }

    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    setStatus(null);
    await loadSessions();
    toast.success("Sesi berhasil dimuat!", { id: "load-session", description: `Kode: ${json.session.code}` });
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
    if (sessionId) loadQuestions(sessionId);
  }, [sessionId, loadQuestions]);

  async function addQuestionToSession() {
    if (!code) return toast.error("Buat sesi dulu");
    if (endedAt) return toast.warning("Sesi sudah selesai");
    
    const valid = validateQuestionForm();
    if (!valid) return;

    setBusy(true);
    toast.loading("Menambahkan pertanyaan...", { id: "add-question" });

    const res = await fetch("/api/question/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        question: questionText,
        options: valid.filled,
        correct_index: correctIndex,
        points,
      }),
    });
    
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Gagal menambah pertanyaan", { id: "add-question", description: json?.error });
      setBusy(false);
      return;
    }

    resetForm();
    if (sessionId) await loadQuestions(sessionId);
    toast.success("Pertanyaan berhasil ditambahkan!", { id: "add-question" });
    setBusy(false);
  }

  async function endSession() {
    if (!code) return;
    setBusy(true);
    toast.loading("Mengakhiri sesi...", { id: "end-session" });

    const res = await fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await readJson(res);
    
    if (res.ok && json?.session) {
      setEndedAt(json.session.ended_at ?? null);
      await loadSessions();
      toast.success("Sesi berhasil diakhiri!", { id: "end-session" });
    } else {
      toast.error("Gagal mengakhiri sesi", { id: "end-session" });
    }
      setBusy(false);
  }

  // --- Bank Logic ---

  async function loadBankQuestions() {
    const res = await fetch("/api/bank/list");
    const json = await readJson(res);
    if (res.ok) {
      setBankQuestions(json.questions || []);
    }
  }

  async function addQuestionToBank() {
    const valid = validateQuestionForm();
    if (!valid) return;

    setBusy(true);
    toast.loading("Menyimpan ke Bank Soal...", { id: "bank-create" });

    const res = await fetch("/api/bank/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: questionText,
        options: valid.filled,
        correct_index: correctIndex,
        points,
      }),
    });

    const json = await readJson(res);
    if (res.ok) {
      resetForm();
      await loadBankQuestions();
      toast.success("Tersimpan di Bank Soal", { id: "bank-create" });
    } else {
      toast.error("Gagal menyimpan", { id: "bank-create", description: json?.error });
    }
      setBusy(false);
  }

  async function deleteBankQuestion(id: string) {
    if(!confirm("Yakin hapus soal ini dari Bank?")) return;
    
    setBusy(true);
    const res = await fetch("/api/bank/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    
    if (res.ok) {
      await loadBankQuestions();
      toast.success("Soal dihapus dari Bank");
    } else {
      toast.error("Gagal menghapus soal");
    }
      setBusy(false);
  }

  async function importFromBank() {
    if (!code || selectedBankIds.size === 0) return;
    
    setBusy(true);
    toast.loading("Mengimpor soal...", { id: "import" });

    const res = await fetch("/api/question/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        bank_ids: Array.from(selectedBankIds),
      }),
    });

    const json = await readJson(res);
    if (res.ok) {
      if (sessionId) await loadQuestions(sessionId);
      setSelectedBankIds(new Set());
      setIsImportModalOpen(false);
      toast.success(`Berhasil impor ${json.count} soal!`, { id: "import" });
    } else {
      toast.error("Gagal impor soal", { id: "import", description: json?.error });
    }
    setBusy(false);
  }

  // --- Helpers ---

  function validateQuestionForm() {
    const trimmed = options.map((opt) => opt.trim());
    const filled = trimmed.filter(Boolean);
    const hasGap = trimmed.slice(0, filled.length).some((opt) => !opt);

    if (!questionText.trim()) {
      toast.error("Pertanyaan wajib diisi");
      return null;
    }
    if (filled.length < 2) {
      toast.error("Minimal 2 opsi jawaban");
      return null;
    }
    if (hasGap) {
      toast.error("Isi opsi dari atas ke bawah");
      return null;
    }
    if (correctIndex < 0 || correctIndex >= filled.length) {
      toast.error("Pilih jawaban benar");
      return null;
    }
    return { filled };
  }

  function resetForm() {
    setQuestionText("");
    setOptions(emptyOptions);
    setCorrectIndex(0);
    setPoints(100);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  const joinUrl = code && origin ? `${origin}/join/${code}` : "";
  const screenUrl = code && origin ? `${origin}/screen/${code}` : "";

  function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast.success("Tersalin!");
  }

  const buildQrBlob = useCallback(async (size = 512) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) throw new Error("QR belum siap");

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<Blob>((resolve, reject) => {
      const img = new window.Image();
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
        toast.success("QR tersimpan");
      }
    } catch {
      toast.error("Gagal membagikan QR");
    } finally {
      setQrBusy(false);
    }
  }, [buildQrBlob, code, joinUrl]);

  const sessionStatus = code ? (endedAt ? "ended" : "active") : "none";

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Logout berhasil");
      router.push("/admin/login");
    } catch {
      toast.error("Gagal logout");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <NextImage src="/logo1.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Selamat Datang</h1>
              <p className="text-sm text-slate-500">Kelola kuis dan bank soal</p>
          </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-slate-100 p-1 rounded-full flex gap-1">
                <button
                  onClick={() => setActiveTab("session")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "session" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Sesi Aktif
                </button>
                <button
                  onClick={() => setActiveTab("bank")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Bank Soal
                </button>
             </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
              Logout
            </Button>
          </div>
        </header>

        {activeTab === "session" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8 lg:pr-8">
               {/* Sesi Section */}
            <Section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Kontrol Sesi" subtitle="Kelola sesi quiz yang berjalan" />
                <StatusBadge status={sessionStatus} />
              </div>

          <div className="space-y-4">
                {!code ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-indigo-500"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Mulai Sesi Baru</h3>
                      <p className="text-sm text-slate-500 max-w-xs mb-6">
                        Buat sesi baru untuk memulai kuis. Kode sesi akan dibuat otomatis.
                      </p>
              <Button
                onClick={createSession}
                disabled={busy}
                size="lg"
                        className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-8 h-12 shadow-lg shadow-slate-200"
              >
                        Buat Sesi Sekarang
              </Button>
                    </div>

                    <div className="flex items-center gap-4 my-2">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Atau
                      </span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Masukkan Kode Sesi Lama"
                        className="rounded-xl h-12 border-slate-200 bg-white text-center font-mono uppercase tracking-widest text-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
                <Button
                  variant="outline"
                  onClick={loadSession}
                  disabled={busy}
                        className="rounded-xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-medium"
                >
                  Muat
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            Kode Sesi
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                              {code}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyText(code)}
                              className="h-10 w-10 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                </Button>
              </div>
            </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
                            onClick={() => copyText(joinUrl)}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                                Link Peserta
                              </span>
                              <span className="text-sm font-mono text-slate-600 truncate font-medium">
                                {joinUrl}
                              </span>
                    </div>
                            <div className="p-2 bg-white rounded-full text-slate-300 group-hover:text-indigo-500 shadow-sm transition-colors">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                      </div>
                    </div>
                          <div
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
                            onClick={() => copyText(screenUrl)}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                                Link Layar
                              </span>
                              <span className="text-sm font-mono text-slate-600 truncate font-medium">
                                {screenUrl}
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-full text-slate-300 group-hover:text-indigo-500 shadow-sm transition-colors">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      {joinUrl && !endedAt && (
                        <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                            <div ref={qrRef} className="bg-white p-1">
                              <QRCode value={joinUrl} size={140} />
                            </div>
                          </div>
                      <Button
                        variant="outline"
                            size="sm"
                        onClick={shareQr}
                        disabled={qrBusy}
                            className="h-9 px-4 text-xs font-medium rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download QR
                      </Button>
                  </div>
                )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <span
                          className={`relative flex h-3 w-3 ${
                            endedAt ? "" : "animate-pulse"
                          }`}
                        >
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              endedAt ? "hidden" : "bg-green-400"
                            }`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${
                              endedAt ? "bg-red-500" : "bg-green-500"
                            }`}
                          ></span>
                        </span>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {endedAt
                            ? `Berakhir: ${new Date(endedAt).toLocaleTimeString()}`
                            : "Live Session"}
                        </span>
                      </div>

                      <div className="flex gap-3 w-full sm:w-auto">
                        {!endedAt ? (
                    <Button
                            variant="destructive"
                      onClick={endSession}
                      disabled={busy}
                            className="flex-1 sm:flex-none rounded-full px-6 font-semibold shadow-lg shadow-red-100 hover:shadow-red-200 transition-all"
                    >
                      Akhiri Sesi
                    </Button>
                        ) : (
                          <span className="flex-1 sm:flex-none px-6 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-500 text-center">
                            Sesi Selesai
                          </span>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCode(null);
                            setSessionId(null);
                            setEndedAt(null);
                          }}
                          className="flex-1 sm:flex-none rounded-full px-6 font-medium border-slate-200 hover:bg-slate-50"
                        >
                          Tutup
                        </Button>
                </div>
              </div>
              </div>
            )}
          </div>
            </Section>

              {/* Tambah Pertanyaan Section */}
            <Section>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader title="Tambah Pertanyaan" subtitle="Ke Sesi Ini" />
                  {code && !endedAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportModalOpen(true)}
                      className="rounded-full text-xs font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1.5"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Ambil dari Bank Soal
                    </Button>
                  )}
              </div>

                {endedAt ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-400"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
            </div>
                    <p className="text-slate-900 font-medium">Sesi Selesai</p>
                    <p className="text-slate-500 text-xs mt-1">Tidak bisa menambah pertanyaan lagi.</p>
                  </div>
                ) : (
          <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Pertanyaan
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Tulis pertanyaan..."
                        disabled={busy || !code}
                        className="w-full rounded-2xl border-slate-200 bg-slate-50/50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none min-h-[100px]"
              />
            </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Opsi Jawaban
              </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, i) => (
                          <div key={i} className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-400 shadow-sm transition-colors">
                              {String.fromCharCode(65 + i)}
                            </div>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                              disabled={busy || !code}
                              className="pl-11 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                          </div>
                ))}
              </div>
            </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                          Kunci Jawaban
                </label>
                <select
                          value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                          disabled={busy || !code}
                          className="w-full h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                >
                  {options.map((_, i) => (
                    <option key={i} value={i}>
                              Jawaban: {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Poin
                </label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                          disabled={busy || !code}
                          className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-center font-mono font-medium"
                          placeholder="Poin"
                />
              </div>
            </div>

            <Button
                      onClick={addQuestionToSession}
                      disabled={busy || !code}
                      className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                      Tambah ke Sesi
            </Button>
              </div>
                )}
            </Section>
          </div>

            {/* Kanan: List Pertanyaan Sesi & Riwayat */}
          <div className="space-y-8 lg:pl-8">
            <Section>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Pertanyaan Sesi Ini" subtitle={`${questions.length} soal aktif`} />
              </div>
              <div className="mt-4 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-400"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada pertanyaan</p>
                    <p className="text-slate-400 text-sm mt-1">Tambah manual atau impor dari Bank Soal</p>
                  </div>
                ) : (
                  questions.map((q) => (
                    <div
                      key={q.id}
                      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm">
                            {q.order_no}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            {q.points} Poin
                          </span>
                        </div>
              </div>

                      <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-4">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((o, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors ${
                              i === q.correct_index
                                ? "bg-green-50 text-green-700 border border-green-200 font-medium shadow-sm"
                                : "bg-slate-50 text-slate-600 border border-transparent"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                i === q.correct_index
                                  ? "border-green-200 bg-white text-green-700"
                                  : "border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="truncate">{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>

            <Section>
              <SectionHeader title="Riwayat Sesi" subtitle="Klik untuk memuat" />
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm italic">
                    Belum ada riwayat sesi.
                  </div>
                ) : (
                  sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setManualCode(s.code);
                      setCode(s.code);
                      setSessionId(s.id);
                      setEndedAt(s.ended_at ?? null);
                    }}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        s.id === sessionId
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                          : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`font-bold text-sm mb-1 ${
                            s.id === sessionId ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {s.title || "Sesi Tanpa Judul"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                              s.id === sessionId
                                ? "bg-white/10 text-slate-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {s.code}
                          </span>
                          <span
                            className={`text-[10px] ${
                              s.id === sessionId ? "text-slate-400" : "text-slate-400"
                            }`}
                          >
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                      </div>
                    </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                            s.ended_at
                              ? s.id === sessionId
                                ? "bg-white/10 text-slate-300"
                                : "bg-slate-100 text-slate-500"
                              : s.id === sessionId
                              ? "bg-green-500 text-white"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                        {s.ended_at ? "Selesai" : "Aktif"}
                      </span>
                        {s.id !== sessionId && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-slate-300 group-hover:text-slate-500 transition-colors"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Section>
            </div>
          </div>
        ) : (
          /* TAB BANK SOAL */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Section className="sticky top-8">
              <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-indigo-600"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
              </div>
                    <h2 className="text-lg font-bold text-slate-900">Input Soal Baru</h2>
            </div>
                  <p className="text-sm text-slate-500">Isi detail pertanyaan di bawah ini</p>
                </div>

          <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Pertanyaan
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Contoh: Siapakah penemu bola lampu?"
                      disabled={busy}
                      className="w-full rounded-2xl border-slate-200 bg-slate-50/50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none min-h-[120px]"
              />
            </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Opsi Jawaban
              </label>
                    <div className="grid gap-2">
                {options.map((opt, i) => (
                        <div key={i} className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-400 shadow-sm group-focus-within:border-indigo-500 group-focus-within:text-indigo-600 transition-colors">
                            {String.fromCharCode(65 + i)}
                          </div>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                            disabled={busy}
                            className="pl-11 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          <div
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all cursor-pointer ${
                              i === correctIndex
                                ? "border-green-500 bg-green-500"
                                : "border-slate-300 hover:border-slate-400"
                            }`}
                            onClick={() => !busy && setCorrectIndex(i)}
                          >
                            {i === correctIndex && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-full h-full text-white p-0.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                ))}
                </div>
              </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                        Kunci Jawaban
                </label>
                <select
                        value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                        disabled={busy}
                        className="w-full h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  {options.map((_, i) => (
                    <option key={i} value={i}>
                            Opsi {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Poin
                </label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                        disabled={busy}
                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center font-mono font-medium"
                />
              </div>
            </div>

            <Button
                    onClick={addQuestionToBank}
                    disabled={busy}
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98]"
                  >
                    {busy ? "Menyimpan..." : "Simpan ke Bank Soal"}
            </Button>
              </div>
            </Section>
          </div>

             <div className="lg:col-span-2">
                <Section className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <SectionHeader title={`Bank Soal (${bankQuestions.length})`} subtitle="Gudang pertanyaan" />
                        <Button variant="outline" size="sm" onClick={loadBankQuestions} className="rounded-full text-xs">Refresh</Button>
              </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                      {bankQuestions.map((q) => (
                  <div
                    key={q.id}
                          className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
                        >
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-3">
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {q.points} Poin
                      </span>
                              <button
                                onClick={() => deleteBankQuestion(q.id)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Hapus Soal"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                    </div>
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4 line-clamp-3">
                              {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((o, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                            i === q.correct_index
                                      ? "bg-green-50 text-green-700 border border-green-100 font-medium"
                                      : "bg-slate-50 text-slate-500 border border-transparent"
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                      i === q.correct_index
                                        ? "border-green-200 bg-white text-green-700"
                                        : "border-slate-200 bg-white text-slate-400"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="truncate">{o}</span>
                        </div>
                      ))}
                  </div>
              </div>
                          <div className="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>ID: {q.id.slice(0, 8)}...</span>
                            <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                  </div>
                    {bankQuestions.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            Bank soal masih kosong.
              </div>
                    )}
            </Section>
          </div>
        </div>
                )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">Pilih dari Bank Soal</h3>
                    <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {bankQuestions.map(q => {
                            const isSelected = selectedBankIds.has(q.id);
                            return (
                                <div
                                    key={q.id}
                                    onClick={() => {
                                        const next = new Set(selectedBankIds);
                                        if (isSelected) next.delete(q.id);
                                        else next.add(q.id);
                                        setSelectedBankIds(next);
                                    }}
                                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                                        isSelected 
                                        ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-sm" 
                                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md"
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="flex-1">
                                           <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                              {q.points} Poin
                                           </span>
                          </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                                            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                    </div>
                                    <p className={`text-sm font-semibold mb-3 line-clamp-2 transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                      {q.question}
                                    </p>
                                    <div className="space-y-1.5">
                                      <div className="text-xs text-slate-500">
                                        <span className="font-medium text-slate-700">Jawaban:</span> {q.options[q.correct_index]}
                  </div>
                                      <div className="text-[10px] text-slate-400">
                                        +{q.options.length - 1} opsi lainnya
                                      </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     {bankQuestions.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            Bank soal kosong. Isi dulu di tab Bank Soal.
                  </div>
                )}
              </div>

                <div className="p-6 border-t bg-white rounded-b-3xl flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                        Terpilih: <b>{selectedBankIds.size}</b> soal
          </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} className="rounded-full">Batal</Button>
                        <Button onClick={importFromBank} disabled={selectedBankIds.size === 0 || busy} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            Impor ke Sesi
                        </Button>
        </div>
      </div>
          </div>
        </div>
      )}
    </main>
  );
}
