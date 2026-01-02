"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function QuizDonePage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const leaderboardHref = code ? `/screen/${code}` : "/";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg sticker border border-white/60 bg-white/90">
        <CardContent className="p-6 sm:p-8 space-y-5 text-center">
          <Badge className="bg-[#F3F7FF] text-[#4451A3]">Selesai</Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Quiz sudah selesai</h1>
          <p className="text-sm text-muted-foreground">
            Terima kasih sudah ikut. Kamu bisa cek leaderboard atau balik ke home.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={leaderboardHref}>Lihat Leaderboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Kembali ke Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
