"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";

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
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              <Image
                src="/logo1.png"
                alt="Expo Quiz Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900">
            Siap Quiz?
          </h1>
          <p className="text-base sm:text-lg text-slate-500">
            Sesi: <span className="font-mono font-semibold text-slate-900">{code}</span>
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="w-full space-y-3">
            <Input
              placeholder="Masukkan nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-center text-lg h-14 rounded-full border-slate-200 shadow-sm"
              disabled={loading}
            />
            {err && (
              <div className="bg-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-600 text-center">
                {err}
              </div>
            )}
          </div>

          <Button
            className="px-10 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={join}
            disabled={name.trim().length < 2 || loading}
            size="lg"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                Memproses...
              </span>
            ) : (
              "Mulai Quiz"
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <div
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default animate-[fadeInUp_0.5s_ease-out_0.3s_both]"
          >
            <span className="text-lg group-hover:animate-bounce">🏆</span>
            <span className="text-sm font-medium text-amber-700">Raih poin tertinggi</span>
          </div>
          <div
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/60 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default animate-[fadeInUp_0.5s_ease-out_0.5s_both]"
          >
            <span className="text-lg group-hover:animate-pulse">⚡</span>
            <span className="text-sm font-medium text-sky-700">Jawab secepat mungkin</span>
          </div>
        </div>
      </div>
    </main>
  );
}
