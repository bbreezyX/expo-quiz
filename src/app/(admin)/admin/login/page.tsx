"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

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
        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("admin_auth_time", Date.now().toString());
        toast.success("Login berhasil!");
        router.push("/admin");
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
