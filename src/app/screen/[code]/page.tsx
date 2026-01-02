"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = {
  participant_id: string;
  display_name: string;
  total_points: number;
  correct_count: number;
  last_answer_at: string;
};

type LeaderboardRowProps = {
  row: Row;
  index: number;
};

function LeaderboardRow({ row, index }: LeaderboardRowProps) {
  const isTop3 = index < 3;

  return (
    <div
      className={`grid grid-cols-12 gap-4 rounded-2xl px-6 py-5 transition-colors ${
        isTop3
          ? "bg-slate-900 text-white border border-slate-900"
          : "bg-white text-slate-700 border border-slate-100 hover:border-slate-200"
      }`}
    >
      <div className={`col-span-1 font-semibold ${isTop3 ? "text-white" : "text-slate-900"}`}>
        {index + 1}
      </div>
      <div className={`col-span-7 ${isTop3 ? "font-semibold" : "font-medium"}`}>
        {row.display_name}
      </div>
      <div className="col-span-2 text-right font-semibold">{row.total_points}</div>
      <div className={`col-span-2 text-right ${isTop3 ? "text-white/80" : "text-slate-500"}`}>
        {row.correct_count}
      </div>
    </div>
  );
}

export default function ScreenPage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchBoard(sid: string, showToast = false) {
    if (showToast) {
      toast.loading("Memuat leaderboard...", { id: "fetch-leaderboard" });
    }

    const { data, error: boardErr } = await supabase
      .from("v_leaderboard")
      .select("*")
      .eq("session_id", sid)
      .order("total_points", { ascending: false })
      .limit(20);

    if (boardErr) {
      setError("Leaderboard belum bisa dimuat.");
      if (showToast) {
        toast.error("Gagal memuat", {
          id: "fetch-leaderboard",
          description: "Leaderboard belum bisa dimuat.",
        });
      }
      return;
    }

    setError(null);
    setRows((data as any) ?? []);
    if (showToast) {
      toast.success("Leaderboard dimuat!", {
        id: "fetch-leaderboard",
        description: `${(data ?? []).length} peserta`,
      });
    }
  }

  useEffect(() => {
    async function init() {
      if (!code) return;
      setLoading(true);
      setError(null);
      const { data: s } = await supabase.from("sessions").select("*").eq("code", code).single();
      if (!s) {
        setError("Sesi belum ketemu.");
        setLoading(false);
        return;
      }
      setSessionId(s.id);
      setEndedAt(s.ended_at ?? null);
      await fetchBoard(s.id);
      setLoading(false);

      // Realtime: kalau ada jawaban masuk, refetch leaderboard
      const ch = supabase
        .channel(`answers-${s.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "answers", filter: `session_id=eq.${s.id}` },
          async () => {
            // debounce kecil biar ga spam
            setTimeout(() => fetchBoard(s.id), 250);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ch);
      };
    }

    const cleanupPromise = init();
    return () => {
      // best effort
      cleanupPromise.then((cleanup: any) => cleanup && cleanup());
    };
  }, [code]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">
                Leaderboard
              </h1>
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium ${
                endedAt ? "bg-slate-200 text-slate-600" : "bg-slate-900 text-white"
              }`}>
                {endedAt ? "Selesai" : "Live"}
              </span>
            </div>
            <p className="text-lg text-slate-500">
              Sesi: <span className="font-mono font-semibold text-slate-900">{code}</span>
            </p>
          </div>
          {sessionId && (
            <Button
              variant="outline"
              onClick={() => fetchBoard(sessionId, true)}
              className="rounded-full"
            >
              Refresh
            </Button>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-10">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-4 mb-6">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Nama</div>
            <div className="col-span-2 text-right">Poin</div>
            <div className="col-span-2 text-right">Benar</div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-slate-50 rounded-2xl px-6 py-8 text-center text-sm text-slate-600">
                Memuat leaderboard...
              </div>
            )}
            {error && !loading && (
              <div className="bg-slate-100 rounded-2xl px-6 py-8 text-center text-sm text-slate-600">
                {error}
              </div>
            )}
            {!loading && !error &&
              rows.map((row, index) => (
                <LeaderboardRow key={row.participant_id} row={row} index={index} />
              ))}
            {!loading && !error && rows.length === 0 && (
              <div className="bg-slate-50 rounded-2xl px-6 py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200">
                Belum ada jawaban masuk
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 text-center text-sm text-slate-600">
          Tampilkan halaman ini di layar besar untuk update real-time
        </div>
      </div>
    </main>
  );
}
