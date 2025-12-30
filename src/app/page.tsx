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
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 space-y-7 lg:order-1">
          <Badge className="bg-white text-foreground border-white sticker">
            Gaya Kahoot buat event kamu
          </Badge>
          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-glow">
              Expo Quiz
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Sesi quiz super seru untuk acara, kelas, dan booth pameran.
              Semua peserta main dari HP, hasilnya muncul live di layar besar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/admin">Mulai dari Admin</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/join">Ikut sebagai Peserta</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { text: "Leaderboard live di layar besar", tone: "bg-[var(--brand-blue)] text-white" },
              { text: "Input cepat dari HP peserta", tone: "bg-[var(--brand-green)] text-white" },
              { text: "Setup admin yang simpel", tone: "bg-[var(--brand-yellow)] text-[#1f2937]" },
              { text: "Cocok untuk demo cepat", tone: "bg-[var(--brand-red)] text-white" },
            ].map((item) => (
              <div
                key={item.text}
                className={`rounded-2xl px-4 py-4 text-sm font-semibold shadow-[0_16px_30px_-22px_rgba(15,23,42,0.5)] ${item.tone}`}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <Card className="order-1 w-full sticker lg:order-2">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Masuk Sesi
              </div>
              <h2 className="font-display text-2xl">Gabung dengan kode</h2>
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

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-white bg-white px-4 py-3 text-xs font-semibold">
                Scan QR di layar admin
              </div>
              <div className="rounded-2xl border-2 border-white bg-white px-4 py-3 text-xs font-semibold">
                Main tanpa install aplikasi
              </div>
            </div>

            <div className="pt-4 border-t border-white text-xs text-muted-foreground">
              (c) 2025 - Quiz Pameran
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
