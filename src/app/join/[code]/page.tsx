"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
    toast.loading("Bergabung ke sesi...", { id: "join-session" });

    const res = await fetch("/api/participant/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error("Gagal bergabung", {
        id: "join-session",
        description: json.error || "Gagal masuk",
      });
      setErr(json.error || "Gagal masuk");
      setLoading(false);
      return;
    }

    localStorage.setItem(`participant:${code}`, json.participant.id);
    localStorage.setItem(`sessionId:${code}`, json.session.id);
    toast.success("Berhasil bergabung!", {
      id: "join-session",
      description: `Selamat datang, ${name}!`,
    });
    router.push(`/quiz/${code}`);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Siap Quiz?
          </h1>
          <p className="text-lg text-slate-500">
            Sesi: <span className="font-mono font-semibold text-slate-900">{code}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Input
              placeholder="Masukkan nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center text-lg h-14 rounded-full border-slate-200"
            />
            {err && (
              <div className="bg-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-600 text-center">
                {err}
              </div>
            )}
          </div>

          <Button
            className="w-full rounded-full h-14 text-base"
            onClick={join}
            disabled={name.trim().length < 2 || loading}
            size="lg"
          >
            {loading ? "Memproses..." : "Mulai Quiz"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          <div className="text-center py-6 px-4 rounded-2xl border border-slate-100 bg-white">
            <p className="text-sm text-slate-600">Raih poin tertinggi</p>
          </div>
          <div className="text-center py-6 px-4 rounded-2xl border border-slate-100 bg-white">
            <p className="text-sm text-slate-600">Jawab secepat mungkin</p>
          </div>
        </div>
      </div>
    </main>
  );
}
