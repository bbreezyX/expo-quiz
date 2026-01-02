import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

async function joinByCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (!code) return;
  redirect(`/join/${code}`);
}

export default function JoinIndexPage() {
  const tips = [
    {
      text: "Siapkan kode dari admin",
      tone: "bg-[#F6F8FF] text-[#2D3A6A] border border-[#D4DDF5]",
    },
    {
      text: "Jawab cepat, skor langsung",
      tone: "bg-[#E9F7F0] text-[#2D7A56] border border-[#CFEBDD]",
    },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg sticker border border-white/60 bg-white/90">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3 text-center">
            <Badge className="bg-[#F3F7FF] text-[#4451A3]">Masuk</Badge>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Masuk ke sesi quiz</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan kode sesi dari admin untuk mulai jawab pertanyaan.
            </p>
          </div>

          <form action={joinByCode} className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="code"
              placeholder="Kode sesi (contoh: JMB42)"
              className="uppercase bg-white"
              autoComplete="off"
            />
            <Button type="submit" className="sm:w-36">
              Lanjut
            </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            {tips.map((item) => (
              <div key={item.text} className={`rounded-2xl px-4 py-3 text-xs font-semibold ${item.tone}`}>
                {item.text}
              </div>
            ))}
          </div>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
