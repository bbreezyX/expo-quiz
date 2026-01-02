"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { useSession, useLeaderboard, type LeaderboardRow } from "@/lib/hooks";

type LeaderboardRowProps = {
  row: LeaderboardRow;
  index: number;
};

function LeaderboardRowComponent({ row, index }: LeaderboardRowProps) {
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
  
  // Use SWR hooks for caching
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(code);
  const { 
    rows, 
    isLoading: leaderboardLoading, 
    error: leaderboardError,
    refresh: refreshLeaderboard 
  } = useLeaderboard(session?.id || null);

  const loading = sessionLoading || leaderboardLoading;
  const error = sessionError || leaderboardError ? "Data belum bisa dimuat." : null;

  // Set up realtime subscription for live updates
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`answers-${session.id}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "answers", 
          filter: `session_id=eq.${session.id}` 
        },
        () => {
          // Debounce refresh to avoid spam
          setTimeout(() => refreshLeaderboard(), 250);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, refreshLeaderboard]);

  function handleRefresh() {
    toast.loading("Memuat leaderboard...", { id: "fetch-leaderboard" });
    refreshLeaderboard().then(() => {
      toast.success("Leaderboard dimuat!", {
        id: "fetch-leaderboard",
        description: `${rows.length} peserta`,
      });
    }).catch(() => {
      toast.error("Gagal memuat", {
        id: "fetch-leaderboard",
        description: "Coba lagi nanti",
      });
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <Image
              src="/logo1.png"
              alt="Expo Quiz Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                Leaderboard
              </h1>
              <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                session?.ended_at ? "bg-slate-200 text-slate-600" : "bg-slate-900 text-white"
              }`}>
                {session?.ended_at ? "Selesai" : "Live"}
              </span>
            </div>
            <p className="text-base sm:text-lg text-slate-500">
              Sesi: <span className="font-mono font-semibold text-slate-900">{code}</span>
            </p>
          </div>
          {session && (
            <Button
              variant="outline"
              onClick={handleRefresh}
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
                <LeaderboardRowComponent key={row.participant_id} row={row} index={index} />
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
