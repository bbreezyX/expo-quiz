import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function joinByCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (!code) return;
  redirect(`/join/${code}`);
}

export default function JoinIndexPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Join Quiz
          </h1>
          <p className="text-lg text-slate-500">
            Masukkan kode sesi dari admin
          </p>
        </div>

        <form action={joinByCode} className="space-y-4">
          <Input
            name="code"
            placeholder="Masukkan kode"
            className="text-center text-lg h-14 rounded-full border-slate-200 bg-white"
            autoComplete="off"
          />
          <Button type="submit" size="lg" className="w-full rounded-full h-14">
            Lanjut
          </Button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          <div className="text-center py-6 px-4 rounded-2xl border border-slate-100 bg-white">
            <p className="text-sm text-slate-600">Siapkan kode</p>
          </div>
          <div className="text-center py-6 px-4 rounded-2xl border border-slate-100 bg-white">
            <p className="text-sm text-slate-600">Jawab cepat</p>
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
