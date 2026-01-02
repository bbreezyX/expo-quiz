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

  const highlights = [
    {
      text: "Leaderboard live di layar besar",
      tone: "bg-[#F6F8FF] text-[#2D3A6A] border border-[#D4DDF5]",
    },
    {
      text: "Input cepat dari HP peserta",
      tone: "bg-[#E9F7F0] text-[#2D7A56] border border-[#CFEBDD]",
    },
    {
      text: "Setup admin yang simpel",
      tone: "bg-[#FFF6DB] text-[#7A5A16] border border-[#F4E2B4]",
    },
    {
      text: "Cocok untuk demo cepat",
      tone: "bg-[#FFE9EC] text-[#8B2C3B] border border-[#F7C9D1]",
    },
  ];

  return (
    <main className="min-h-screen px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <Badge className="bg-[#F3F7FF] text-[#4451A3]">Quiz santai buat event kamu</Badge>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900">
                Expo Quiz
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Sesi quiz super seru untuk acara, kelas, dan booth pameran. Semua peserta main
                dari HP, hasilnya tampil live di layar besar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="px-8">
                <Link href="/admin">Mulai dari Admin</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="px-8">
                <Link href="/join">Ikut sebagai Peserta</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.text}
                  className={`rounded-2xl px-4 py-4 text-sm font-semibold shadow-[0_16px_30px_-22px_rgba(15,23,42,0.25)] ${item.tone}`}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <Card className="sticker border border-white/60 bg-white/90">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Masuk sesi
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Gabung pakai kode</h2>
                <p className="text-sm text-muted-foreground">
                  Scan QR atau ketik kode sesi dari admin. Gampang, ga ribet.
                </p>
              </div>

              <form action={joinByCode} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  name="code"
                  placeholder="Kode sesi (contoh: JMB42)"
                  className="uppercase bg-white"
                  autoComplete="off"
                />
                <Button type="submit" className="sm:w-40">
                  Masuk
                </Button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-[#F6F8FF] px-4 py-3 text-xs font-semibold text-slate-700">
                  Scan QR di layar admin
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#F6F8FF] px-4 py-3 text-xs font-semibold text-slate-700">
                  Main tanpa install aplikasi
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs text-muted-foreground">
                (c) 2025 - Quiz Pameran
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
