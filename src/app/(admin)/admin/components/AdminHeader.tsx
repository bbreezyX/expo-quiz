"use client";

import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type AdminHeaderProps = {
  activeTab: "session" | "bank";
  setActiveTab: (tab: "session" | "bank") => void;
  onLogout: () => void;
};

export function AdminHeader({ activeTab, setActiveTab, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="relative w-12 h-12"
        >
          <NextImage src="/logo1.png" alt="Logo" fill className="object-contain" priority />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="text-sm text-slate-500">Kelola kuis dan bank soal</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-slate-100 p-1 rounded-full flex gap-1 relative isolate">
          {(["session", "bank"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
              {tab === "session" ? "Sesi Aktif" : "Bank Soal"}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-full">
          Logout
        </Button>
      </div>
    </header>
  );
}

