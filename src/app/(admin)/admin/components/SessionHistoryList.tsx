"use client";

import { Section, SectionHeader } from "./Common";

export type SessionSummary = {
  id: string;
  code: string;
  title: string;
  created_at: string;
  ended_at: string | null;
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
      <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            Belum ada riwayat sesi.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s)}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                s.id === currentSessionId
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                  : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
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
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

