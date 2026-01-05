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
            <div className="flex flex-col gap-3">
                    {!code ? (
                         <>
                            <Button onClick={createSession} disabled={busy} size="lg" className="w-full rounded-full">
                Buat Sesi Baru
              </Button>
              <div className="flex gap-2">
                                <Input value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Kode sesi" className="rounded-full" />
                                <Button variant="outline" onClick={loadSession} disabled={busy} className="rounded-full">Muat</Button>
              </div>
                        </>
                    ) : (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                <InfoBox label="Kode Sesi" value={code} onCopy={() => copyText(code)} />
                <InfoBox label="Link Peserta" value={joinUrl} onCopy={() => copyText(joinUrl)} />
                <InfoBox label="Link Layar" value={screenUrl} onCopy={() => copyText(screenUrl)} />

                             <div className="pt-4 flex justify-between items-center">
                                 {!endedAt ? (
                                     <Button variant="destructive" size="sm" onClick={endSession} disabled={busy} className="rounded-full h-8 text-xs">Akhiri Sesi</Button>
                                 ) : (
                                     <span className="text-sm text-slate-500">Sesi telah berakhir</span>
                                 )}
                                 <Button variant="outline" size="sm" onClick={() => {setCode(null); setSessionId(null); setEndedAt(null);}} className="rounded-full h-8 text-xs">Tutup</Button>
                             </div>
                             
                             {/* QR Code Toggle / Display logic simplified for brevity - kept core features */}
                             {joinUrl && !endedAt && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                   <div className="text-center mb-2 text-xs text-slate-500">QR CODE PESERTA</div>
                                   <div ref={qrRef} className="flex justify-center bg-white p-2 rounded-xl w-fit mx-auto border">
                                      <QRCode value={joinUrl} size={120} />
                    </div>
                                   <div className="text-center mt-2">
                                      <Button variant="ghost" size="sm" onClick={shareQr} disabled={qrBusy} className="text-xs h-7">Simpan QR</Button>
                      </div>
                    </div>
                             )}
                         </div>
                    )}
                    </div>
                  </div>
              </Section>

              {/* Tambah Pertanyaan Section */}
              <Section>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader title="Tambah Pertanyaan" subtitle="Ke Sesi Ini" />
                  {code && !endedAt && (
                      <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)} className="rounded-full text-xs">
                          Ambil dari Bank Soal
                    </Button>
                  )}
                </div>

                {endedAt ? (
                  <div className="text-sm text-slate-500 bg-slate-100 p-4 rounded-xl">Sesi sudah selesai.</div>
                ) : (
                   <div className="space-y-4">
                     <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Tulis pertanyaan..."
                        disabled={busy || !code}
                        className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        rows={3}
                     />
                     <div className="grid grid-cols-2 gap-2">
                        {options.map((opt, i) => (
                           <Input key={i} value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opsi ${i+1}`} disabled={busy || !code} className="text-sm rounded-xl" />
                        ))}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <select
                            value={correctIndex}
                            onChange={(e) => setCorrectIndex(Number(e.target.value))}
                            disabled={busy || !code}
                            className="w-full rounded-xl border border-slate-200 p-2 text-sm bg-white"
                        >
                            {options.map((_, i) => <option key={i} value={i}>Jawaban: Opsi {i+1}</option>)}
                        </select>
                        <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} disabled={busy || !code} className="text-sm rounded-xl" placeholder="Poin" />
                     </div>
                     <Button onClick={addQuestionToSession} disabled={busy || !code} className="w-full rounded-full">Tambah ke Sesi</Button>
              </div>
            )}
              </Section>
            </div>

            {/* Kanan: List Pertanyaan Sesi & Riwayat */}
            <div className="space-y-8 lg:pl-8">
               <Section>
                  <SectionHeader title={`Pertanyaan Sesi (${questions.length})`} subtitle="Daftar soal aktif" />
                  <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                     {questions.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-8">Belum ada pertanyaan</p>
                     ) : (
                        questions.map((q) => (
                           <div key={q.id} className="p-4 border rounded-2xl bg-slate-50">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="font-bold text-sm bg-white px-2 py-1 rounded border">Q{q.order_no}</span>
                                 <span className="text-xs font-semibold text-slate-500">{q.points} pts</span>
                              </div>
                              <p className="font-medium text-slate-800 text-sm mb-2">{q.question}</p>
                              <div className="grid grid-cols-2 gap-2">
                                 {q.options.map((o, i) => (
                                    <div key={i} className={`text-xs p-2 rounded border ${i === q.correct_index ? 'bg-green-100 border-green-200 text-green-800' : 'bg-white border-slate-100'}`}>
                                       {o}
                                    </div>
                                 ))}
                              </div>
              </div>
                        ))
            )}
          </div>
            </Section>

            <Section>
                   <SectionHeader title="Riwayat Sesi" />
                   <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                       {sessions.map(s => (
                           <div key={s.id} onClick={() => { setManualCode(s.code); setCode(s.code); setSessionId(s.id); setEndedAt(s.ended_at ?? null); }} className="p-3 border rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between items-center">
                               <div>
                                   <div className="font-bold text-sm">{s.title || "Sesi Tanpa Judul"}</div>
                                   <div className="text-xs text-slate-500">{s.code}</div>
                               </div>
                               <span className={`text-[10px] px-2 py-1 rounded-full ${s.ended_at ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                   {s.ended_at ? 'Selesai' : 'Aktif'}
                               </span>
                           </div>
                       ))}
              </div>
               </Section>
            </div>
          </div>
        ) : (
          /* TAB BANK SOAL */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 space-y-6">
                <Section>
                    <SectionHeader title="Buat Master Soal" subtitle="Simpan ke Bank Soal" />
                    <div className="mt-6 space-y-4">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Tulis pertanyaan master..."
                            disabled={busy}
                            className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            rows={4}
                         />
                         <div className="space-y-2">
                {options.map((opt, i) => (
                               <Input key={i} value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opsi ${i+1}`} disabled={busy} className="text-sm rounded-xl" />
                ))}
              </div>
                         <div className="grid grid-cols-2 gap-4">
                <select
                                value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                                disabled={busy}
                                className="w-full rounded-xl border border-slate-200 p-2 text-sm bg-white"
                            >
                                {options.map((_, i) => <option key={i} value={i}>Jawaban: Opsi {i+1}</option>)}
                </select>
                            <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} disabled={busy} className="text-sm rounded-xl" placeholder="Poin" />
              </div>
                         <Button onClick={addQuestionToBank} disabled={busy} className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700">Simpan ke Bank</Button>
              </div>
            </Section>
          </div>

             <div className="lg:col-span-2">
                <Section className="h-full">
                    <div className="flex justify-between items-center mb-6">
                        <SectionHeader title={`Bank Soal (${bankQuestions.length})`} subtitle="Gudang pertanyaan" />
                        <Button variant="outline" size="sm" onClick={loadBankQuestions} className="rounded-full text-xs">Refresh</Button>
              </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto">
                        {bankQuestions.map((q) => (
                           <div key={q.id} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all relative group">
                              <button 
                                onClick={() => deleteBankQuestion(q.id)}
                                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                              
                              <div className="pr-6">
                                  <p className="font-medium text-slate-800 text-sm mb-3 line-clamp-3">{q.question}</p>
                              </div>
                              <div className="space-y-1.5 mb-3">
                                 {q.options.map((o, i) => (
                                    <div key={i} className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${i === q.correct_index ? 'bg-green-50 text-green-700 font-medium' : 'bg-slate-50 text-slate-500'}`}>
                                       <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0">
                                            {String.fromCharCode(65 + i)}
                                       </span>
                                       <span className="truncate">{o}</span>
                                    </div>
                                 ))}
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                 <span className="text-xs text-slate-400 font-medium">{q.points} Poin</span>
                                 <span className="text-[10px] text-slate-300">ID: {q.id.slice(0,6)}</span>
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

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        isSelected 
                                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" 
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <div className="flex justify-between gap-2 mb-2">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                                            {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">{q.points} pts</span>
                                    </div>
                                    <p className="text-sm text-slate-800 line-clamp-2 mb-2">{q.question}</p>
                                    <div className="text-xs text-slate-500 line-clamp-1">
                                        {q.options.join(", ")}
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
