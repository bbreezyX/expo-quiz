import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function QuizDonePage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const leaderboardHref = `/screen/${code}`;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20">
      <div className="w-full max-w-md text-center space-y-12">
        <div className="space-y-6">
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
            Selesai!
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-sm mx-auto">
            Terima kasih sudah ikut quiz
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="rounded-full h-14 text-base shadow-lg shadow-slate-900/10 font-semibold">
            <Link href={leaderboardHref}>Lihat Leaderboard</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full h-12 text-base border-slate-200 hover:bg-slate-50">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </div>

        <div className="bg-slate-50 rounded-2xl px-6 py-8 border border-slate-100">
          <p className="text-sm text-slate-600">
            Cek hasil kamu di leaderboard untuk melihat peringkat final
          </p>
        </div>
      </div>
    </main>
  );
}
