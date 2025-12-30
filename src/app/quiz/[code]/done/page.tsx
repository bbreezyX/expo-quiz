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
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 space-y-4 text-center">
          <Badge className="bg-white/70 text-foreground border-white/60">Selesai</Badge>
          <h1 className="font-display text-3xl">Quiz sudah selesai</h1>
          <p className="text-sm text-muted-foreground">
            Terima kasih sudah ikut. Kamu bisa lihat leaderboard atau kembali ke home.
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
