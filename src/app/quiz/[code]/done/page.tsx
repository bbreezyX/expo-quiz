"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function QuizDonePage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const leaderboardHref = code ? `/screen/${code}` : "/";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Selesai!
          </h1>
          <p className="text-lg text-slate-500 max-w-sm mx-auto">
            Terima kasih sudah ikut quiz
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="rounded-full h-14 text-base">
            <Link href={leaderboardHref}>Lihat Leaderboard</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </div>

        <div className="bg-slate-50 rounded-2xl px-6 py-8 border border-slate-100">
          <p className="text-sm text-slate-600">
            Cek hasil kamu di leaderboard untuk melihat peringkat final
          </p>
        </div>
      </div>
    </main>
  );
}
