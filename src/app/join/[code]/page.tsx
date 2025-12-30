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
      return setErr(json.error || "Failed");
    }

    localStorage.setItem(`participant:${code}`, json.participant.id);
    localStorage.setItem(`sessionId:${code}`, json.session.id);
    router.push(`/quiz/${code}`);
    setLoading(false);
  }

  return (
    <div className="min-h-screen p-6 flex justify-center items-center">
      <div className="w-full max-w-lg">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Badge className="bg-white/70 text-foreground border-white/60">Peserta</Badge>
              <h1 className="font-display text-3xl">Masuk Quiz</h1>
              <div className="text-sm text-muted-foreground">Sesi: {code}</div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Nama (singkat)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {err && <div className="text-sm text-red-600">{err}</div>}
            </div>

            <Button className="w-full" onClick={join} disabled={name.trim().length < 2 || loading}>
              {loading ? "Memproses..." : "Mulai"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
