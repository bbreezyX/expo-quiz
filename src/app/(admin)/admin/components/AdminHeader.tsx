"use client";

import NextImage from "next/image";
import { Button } from "@/components/ui/button";

type AdminHeaderProps = {
  activeTab: "session" | "bank";
  setActiveTab: (tab: "session" | "bank") => void;
  onLogout: () => void;
};

export function AdminHeader({ activeTab, setActiveTab, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12">
          <NextImage src="/logo1.png" alt="Logo" fill className="object-contain" priority />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="text-sm text-slate-500">Kelola kuis dan bank soal</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-slate-100 p-1 rounded-full flex gap-1">
          <button
            onClick={() => setActiveTab("session")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "session" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sesi Aktif
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Bank Soal
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full">
          Logout
        </Button>
      </div>
    </header>
  );
}

