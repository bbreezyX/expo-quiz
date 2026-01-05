"use client";

import { Section, SectionHeader } from "./Common";
import { motion, AnimatePresence } from "framer-motion";

export type SessionSummary = {
  id: string;
  code: string;
  title: string;
  created_at: string;
  ended_at: string | null;
  participants?: { count: number }[];
};

type SessionHistoryListProps = {
  sessions: SessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (session: SessionSummary) => void;
};

export function SessionHistoryList({ sessions, currentSessionId, onSelectSession }: SessionHistoryListProps) {
  return (
    <Section>
      <SectionHeader title="Riwayat Sesi" subtitle="Klik untuk memuat" />
      <div className="mt-4 -mx-4 px-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="popLayout">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl"
            >
              Belum ada riwayat sesi.
            </motion.div>
          ) : (
            sessions.map((s, index) => (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  backgroundColor: s.id === currentSessionId ? "#0f172a" : "#ffffff",
                  borderColor: s.id === currentSessionId ? "#0f172a" : "#f1f5f9",
                  color: s.id === currentSessionId ? "#ffffff" : "#0f172a",
                }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                onClick={() => onSelectSession(s)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${
                  s.id === currentSessionId
                    ? "shadow-lg shadow-slate-200"
                    : "hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className={`font-bold text-sm mb-1 ${
                      s.id === currentSessionId ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {s.title || "Sesi Tanpa Judul"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                        s.id === currentSessionId
                          ? "bg-white/10 text-slate-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.code}
                    </span>
                    <span
                      className={`text-[10px] ${
                        s.id === currentSessionId ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <div className={`flex items-center gap-1 ml-1 ${
                        s.id === currentSessionId ? "text-slate-300" : "text-slate-400"
                      }`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span className="text-[10px]">
                        {s.participants?.[0]?.count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                      s.ended_at
                        ? s.id === currentSessionId
                          ? "bg-white/10 text-slate-300"
                          : "bg-slate-100 text-slate-500"
                        : s.id === currentSessionId
                        ? "bg-green-500 text-white"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {s.ended_at ? "Selesai" : "Aktif"}
                  </span>
                  {s.id !== currentSessionId && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-300 group-hover:text-slate-500 transition-colors"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}

