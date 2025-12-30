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
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2 text-center">
            <Badge className="bg-white/70 text-foreground border-white/60">Masuk</Badge>
            <h1 className="font-display text-3xl">Masuk ke sesi quiz</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan kode sesi dari admin untuk mulai menjawab.
            </p>
          </div>

          <form action={joinByCode} className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="code"
              placeholder="Kode sesi (contoh: JMB42)"
              className="uppercase"
              autoComplete="off"
            />
            <Button type="submit" className="sm:w-36">
              Lanjut
            </Button>
          </form>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
