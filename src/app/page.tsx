import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  async function joinByCode(formData: FormData) {
    "use server";
    const code = String(formData.get("code") || "").trim().toUpperCase();
    if (!code) return;
    redirect(`/join/${code}`);
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Badge className="bg-white/70 text-foreground border-white/60">
            Pengalaman quiz live
          </Badge>
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-glow">
              Expo Quiz
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Buat sesi quiz interaktif untuk event, kelas, atau pameran.
              Peserta cukup scan QR dan jawab dari HP.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/admin">Masuk Admin</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/join">Masuk Peserta</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Realtime leaderboard untuk layar besar",
              "Jawaban langsung direkap otomatis",
              "Bisa dipakai dari HP peserta",
              "Siap untuk event singkat atau demo",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-md"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Masuk Sesi
              </div>
              <h2 className="font-display text-2xl">Masuk dengan kode</h2>
              <p className="text-sm text-muted-foreground">
                Scan QR atau ketik kode sesi dari admin.
              </p>
            </div>

            <form action={joinByCode} className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="code"
                placeholder="Kode sesi (contoh: JMB42)"
                className="uppercase"
                autoComplete="off"
              />
              <Button type="submit" className="sm:w-40">
                Masuk
              </Button>
            </form>

            <div className="pt-4 border-t border-white/60 text-xs text-muted-foreground">
              (c) 2025 - Quiz Pameran
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
