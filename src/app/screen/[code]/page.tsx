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
      setError("Leaderboard tidak bisa dimuat.");
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
        setError("Sesi tidak ditemukan.");
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
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge className="bg-white text-foreground border-white sticker">
              {endedAt ? "Selesai" : "Live"}
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl">Leaderboard - {code}</h1>
          </div>
          {sessionId && (
            <Button variant="outline" onClick={() => fetchBoard(sessionId)}>
              Muat Ulang
            </Button>
          )}
        </div>

        <Card className="sticker">
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-2 text-sm font-semibold border-b-2 border-white pb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-7">Nama</div>
              <div className="col-span-2 text-right">Poin</div>
              <div className="col-span-2 text-right">Benar</div>
            </div>

            <div className="space-y-2">
              {loading && (
                <div className="py-6 text-sm text-muted-foreground">Memuat leaderboard...</div>
              )}
              {error && !loading && (
                <div className="py-6 text-sm text-muted-foreground">{error}</div>
              )}
              {!loading && !error && rows.map((r, i) => {
                const isTop = i < 3;
                const highlight =
                  i === 0
                    ? "bg-[var(--brand-yellow)] text-[#1f2937]"
                    : i === 1
                    ? "bg-[var(--brand-blue)] text-white"
                    : i === 2
                    ? "bg-[var(--brand-red)] text-white"
                    : "bg-white/60";
                return (
                  <div
                    key={r.participant_id}
                    className={`grid grid-cols-12 gap-2 py-3 rounded-2xl px-3 my-2 ${highlight} ${isTop ? "font-semibold" : ""}`}
                  >
                    <div className="col-span-1">{i + 1}</div>
                    <div className="col-span-7">{r.display_name}</div>
                    <div className="col-span-2 text-right">{r.total_points}</div>
                    <div className="col-span-2 text-right">{r.correct_count}</div>
                  </div>
                );
              })}
              {!loading && !error && rows.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground">
                  Belum ada jawaban masuk...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          Tips: buka halaman ini di TV atau monitor untuk update live.
        </div>
      </div>
    </div>
  );
}
