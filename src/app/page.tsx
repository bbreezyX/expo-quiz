import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function HomePage() {
  async function joinByCode(formData: FormData) {
    "use server";
    const code = String(formData.get("code") || "").trim().toUpperCase();
    if (!code) return;
    redirect(`/join/${code}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="mx-auto w-full max-w-4xl space-y-24">
        {/* Hero Section */}
        <div className="text-center space-y-10">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
                <Image
                  src="/logo1.png"
                  alt="Expo Quiz Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-slate-900">
              Festival Quiz
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-500 max-w-2xl mx-auto font-light">
              Dinas Energi dan Sumber Daya Mineral Provinsi Jambi
            </p>
          </div>
        </div>

        {/* Join Form */}
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Gabung Sesi</h2>
          </div>

          <form action={joinByCode} className="space-y-4">
            <Input
              name="code"
              placeholder="Masukkan kode sesi"
              className="text-center text-lg h-14 rounded-full border-slate-200 bg-white"
              autoComplete="off"
            />
            <Button type="submit" size="lg" className="w-full rounded-full h-14 text-base">
              Masuk
            </Button>
          </form>
        </div>

      </div>
    </main>
  );
}

function FeatureCard({ text }: { text: string }) {
  return (
    <div className="text-center py-8 px-6 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-colors">
      <p className="text-slate-600 font-medium">{text}</p>
    </div>
  );
}
