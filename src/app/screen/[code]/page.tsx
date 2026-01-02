"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const rankTones = [
    "bg-[#FFF6DB] text-[#6C4B00] border-[#F4E2B4]",
    "bg-[#EAF1FF] text-[#2D4C9B] border-[#D4DDF5]",
    "bg-[#FFE9EC] text-[#8B2C3B] border-[#F7C9D1]",
  ];
  const tone = index < 3 ? rankTones[index] : "bg-white text-slate-700 border-slate-200";

  return (
    <div
      className={`grid grid-cols-12 gap-2 rounded-2xl border px-3 py-3 ${tone} ${index < 3 ? "font-semibold" : ""}`}
    >
      <div className="col-span-1">{index + 1}</div>
      <div className="col-span-7">{row.display_name}</div>
      <div className="col-span-2 text-right">{row.total_points}</div>
      <div className="col-span-2 text-right">{row.correct_count}</div>
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

  async function fetchBoard(sid: string) {
    const { data, error: boardErr } = await supabase
      .from("v_leaderboard")
      .select("*")
      .eq("session_id", sid)
      .order("total_points", { ascending: false })
      .limit(20);

    if (boardErr) {
      setError("Leaderboard belum bisa dimuat.");
      return;
    }

    setError(null);
    setRows((data as any) ?? []);
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

  const badgeTone = endedAt
    ? "bg-[#FFF6DB] text-[#6C4B00]"
    : "bg-[#E9F7F0] text-[#2D7A56]";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className={badgeTone}>{endedAt ? "Selesai" : "Live"}</Badge>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
              Leaderboard {code}
            </h1>
            <p className="text-sm text-muted-foreground">Update live dari jawaban peserta.</p>
          </div>
          {sessionId && (
            <Button variant="outline" onClick={() => fetchBoard(sessionId)}>
              Muat ulang
            </Button>
          )}
        </div>

        <Card className="sticker border border-white/60 bg-white/90">
          <CardContent className="p-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground border-b border-slate-200 pb-3">
              <div className="col-span-1">#</div>
              <div className="col-span-7">Nama</div>
              <div className="col-span-2 text-right">Poin</div>
              <div className="col-span-2 text-right">Benar</div>
            </div>

            <div className="space-y-3 pt-4">
              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-[#F6F8FF] px-4 py-4 text-sm text-slate-600">
                  Memuat leaderboard...
                </div>
              )}
              {error && !loading && (
                <div className="rounded-2xl border border-slate-200 bg-[#FFF4F4] px-4 py-4 text-sm text-slate-600">
                  {error}
                </div>
              )}
              {!loading && !error &&
                rows.map((row, index) => (
                  <LeaderboardRow key={row.participant_id} row={row} index={index} />
                ))}
              {!loading && !error && rows.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-[#F6F8FF] px-4 py-4 text-sm text-slate-600">
                  Belum ada jawaban masuk.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-muted-foreground">
          Tips: buka halaman ini di TV atau monitor untuk update live.
        </div>
      </div>
    </main>
  );
}
