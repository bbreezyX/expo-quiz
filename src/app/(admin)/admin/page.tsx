"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { AdminHeader } from "./components/AdminHeader";
import { SessionControl } from "./components/SessionControl";
import { QuestionForm } from "./components/QuestionForm";
import { SessionQuestionList, type Question } from "./components/SessionQuestionList";
import { BankQuestionList } from "./components/BankQuestionList";
import { SessionHistoryList, type SessionSummary } from "./components/SessionHistoryList";
import { ImportQuestionModal } from "./components/ImportQuestionModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";

const emptyOptions = ["", "", "", ""];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"session" | "bank">("session");

  // Session State
  const [code, setCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  // Question Form State
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(100);

  // Bank State
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const readJson = useCallback(async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, []);

  // --- Bank Logic (Moved up for useEffect dependency) ---

  const loadBankQuestions = useCallback(async () => {
    const res = await fetch("/api/bank/list");
    const json = await readJson(res);
    if (res.ok) {
      setBankQuestions(json.questions || []);
    }
  }, [readJson]);

  // --- Session Logic ---

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/session/list");
    const json = await readJson(res);
    if (!res.ok) return;
    setSessions(Array.isArray(json?.sessions) ? json.sessions : []);
  }, [readJson]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    loadBankQuestions();
  }, [loadSessions, loadBankQuestions]);

  async function createSession() {
    setBusy(true);
    toast.loading("Membuat sesi baru...", { id: "create-session" });

    const res = await fetch("/api/session/create", { method: "POST" });
    const json = await readJson(res);
    if (!res.ok) {
      toast.error("Gagal membuat sesi", { id: "create-session", description: json?.error || "Error unknown" });
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
    setBusy(true);
    toast.loading("Memuat sesi...", { id: "load-session" });

    const res = await fetch(`/api/session/${inputCode}`);
    const json = await readJson(res);
    if (!res.ok || !json?.session) {
      toast.error("Sesi tidak ditemukan", { id: "load-session", description: json?.error });
      setBusy(false);
      return;
    }

    setCode(json.session.code);
    setSessionId(json.session.id);
    setEndedAt(json.session.ended_at ?? null);
    await loadSessions();
    toast.success("Sesi berhasil dimuat!", { id: "load-session", description: `Kode: ${json.session.code}` });
    setBusy(false);
  }

  const loadQuestions = useCallback(async (sid: string) => {
    const res = await fetch(`/api/question/list?session_id=${sid}`);
    const json = await readJson(res);

    if (!res.ok) return;
    
    setQuestions(json.questions || []);
  }, [readJson]);

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

  function handleDeleteBankQuestion(id: string) {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  }

  async function confirmDeleteBankQuestion() {
    if (!itemToDelete) return;
    
    setBusy(true);
    const res = await fetch("/api/bank/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemToDelete }),
    });
    
    if (res.ok) {
      await loadBankQuestions();
      toast.success("Soal dihapus dari Bank");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
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
        <AdminHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
        />

        <AnimatePresence mode="wait">
          {activeTab === "session" ? (
            <motion.div
              key="session"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-8 lg:pr-8">
                <SessionControl
                  code={code}
                  endedAt={endedAt}
                  busy={busy}
                  manualCode={manualCode}
                  setManualCode={setManualCode}
                  onCreateSession={createSession}
                  onLoadSession={loadSession}
                  onEndSession={endSession}
                  onCloseSession={() => {
                    setCode(null);
                    setSessionId(null);
                    setEndedAt(null);
                    setQuestions([]);
                  }}
                />

                <QuestionForm
                  title="Tambah Pertanyaan"
                  subtitle="Ke Sesi Ini"
                  questionText={questionText}
                  setQuestionText={setQuestionText}
                  options={options}
                  setOptions={setOptions}
                  correctIndex={correctIndex}
                  setCorrectIndex={setCorrectIndex}
                  points={points}
                  setPoints={setPoints}
                  onSubmit={addQuestionToSession}
                  busy={busy}
                  disabled={!code || !!endedAt}
                  submitLabel="Tambah ke Sesi"
                  headerAction={
                    code && !endedAt && (
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
                    )
                  }
                  disabledContent={
                    endedAt ? (
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
                    ) : null
                  }
                />
              </div>

              <div className="space-y-8 lg:pl-8">
                <SessionQuestionList questions={questions} />
                
                <SessionHistoryList 
                  sessions={sessions} 
                  currentSessionId={sessionId} 
                  onSelectSession={(s) => {
                    setManualCode(s.code);
                    setCode(s.code);
                    setSessionId(s.id);
                    setEndedAt(s.ended_at ?? null);
                  }} 
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-1 space-y-6">
                <div className="sticky top-8">
                  <QuestionForm
                    title="Input Soal Baru"
                    subtitle="Isi detail pertanyaan"
                    questionText={questionText}
                    setQuestionText={setQuestionText}
                    options={options}
                    setOptions={setOptions}
                    correctIndex={correctIndex}
                    setCorrectIndex={setCorrectIndex}
                    points={points}
                    setPoints={setPoints}
                    onSubmit={addQuestionToBank}
                    busy={busy}
                    submitLabel={busy ? "Menyimpan..." : "Simpan ke Bank Soal"}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <BankQuestionList 
                  questions={bankQuestions} 
                  onDelete={handleDeleteBankQuestion} 
                  onRefresh={loadBankQuestions} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ImportQuestionModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        bankQuestions={bankQuestions}
        selectedBankIds={selectedBankIds}
        setSelectedBankIds={setSelectedBankIds}
        onImport={importFromBank}
        busy={busy}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteBankQuestion}
        title="Hapus Soal?"
        description="Soal ini akan dihapus permanen dari Bank Soal dan tidak bisa dikembalikan."
        busy={busy}
      />
    </main>
  );
}
