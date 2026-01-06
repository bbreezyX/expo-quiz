"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinForm() {
    const router = useRouter();
    const [code, setCode] = useState("");

    function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) return;
        router.push(`/join/${trimmedCode}`);
    }

    return (
        <div className="max-w-md mx-auto space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">Gabung Sesi</h2>
            </div>

            <form onSubmit={handleJoin} className="flex flex-col items-center space-y-6">
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Masukkan kode sesi"
                    className="text-center text-lg h-14 rounded-full border-slate-200 bg-white shadow-sm"
                    autoComplete="off"
                />
                <Button
                    type="submit"
                    size="lg"
                    className="px-10 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    Masuk
                </Button>
            </form>
        </div>
    );
}
