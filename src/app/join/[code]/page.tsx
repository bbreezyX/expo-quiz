"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function JoinPage() {
  const params = useParams();
  const rawCode = params?.code;
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "").toUpperCase();
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function join() {
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/participant/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setErr(json.error || "Gagal masuk");
    }

    localStorage.setItem(`participant:${code}`, json.participant.id);
    localStorage.setItem(`sessionId:${code}`, json.session.id);
    router.push(`/quiz/${code}`);
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-6 py-12 flex items-center justify-center">
      <Card className="w-full max-w-lg sticker border border-white/60 bg-white/90">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <Badge className="bg-[#F3F7FF] text-[#4451A3]">Peserta</Badge>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Siap ikut quiz?</h1>
            <div className="text-sm text-muted-foreground">Sesi: {code}</div>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Nama singkat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white"
            />
            {err && (
              <div className="rounded-2xl bg-[#FFF4F4] px-4 py-2 text-sm text-slate-600">
                {err}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#CFEBDD] bg-[#E9F7F0] px-4 py-3 text-xs font-semibold text-[#2D7A56]">
              Dapatkan poin tertinggi
            </div>
            <div className="rounded-2xl border border-[#F7C9D1] bg-[#FFE9EC] px-4 py-3 text-xs font-semibold text-[#8B2C3B]">
              Jawab secepat mungkin
            </div>
          </div>

          <Button className="w-full" onClick={join} disabled={name.trim().length < 2 || loading}>
            {loading ? "Memproses..." : "Mulai"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
