"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/verify");
        if (res.ok) {
          const redirect = searchParams.get("redirect") || "/admin";
          router.replace(redirect);
        }
      } catch {
        // Not authenticated, stay on login page
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router, searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Login berhasil!");
        const redirect = searchParams.get("redirect") || "/admin";
        router.push(redirect);
      } else {
        toast.error("Gagal login", {
          description: data.error || "Passcode salah",
        });
        setPasscode("");
      }
    } catch {
      toast.error("Error", {
        description: "Gagal menghubungi server",
      });
    } finally {
      setLoading(false);
    }
  }

  // Show loading while checking auth
  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="text-lg text-slate-500">Memuat...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Admin Login
          </h1>
          <p className="text-lg text-slate-500">
            Masukkan passcode untuk akses dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Passcode
            </label>
            <Input
              type="password"
              placeholder="Masukkan passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="text-center text-lg h-14 rounded-full border-slate-200"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full h-14 text-base"
            disabled={!passcode.trim() || loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </div>
    </main>
  );
}
