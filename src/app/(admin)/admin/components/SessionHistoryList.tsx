"use client";

import { Section, SectionHeader } from "./Common";
import { motion, AnimatePresence, Variants } from "framer-motion";

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

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] },
  },
};

const emptyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export function SessionHistoryList({ sessions, currentSessionId, onSelectSession }: SessionHistoryListProps) {
  return (
    <Section>
      <SectionHeader title="Riwayat Sesi" subtitle="Klik untuk memuat" />
      <motion.div
        className="mt-4 -mx-4 px-4 space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <AnimatePresence mode="popLayout">
          {sessions.length === 0 ? (
            <motion.div
              key="empty"
              variants={emptyVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl"
            >
              Belum ada riwayat sesi.
            </motion.div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <motion.div
                  layout
                  layoutId={`session-${s.id}`}
                  key={s.id}
                  variants={itemVariants}
                  onClick={() => onSelectSession(s)}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: isActive
                      ? "0 20px 40px -12px rgba(15, 23, 42, 0.25)"
                      : "0 10px 30px -12px rgba(100, 116, 139, 0.2)",
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                  animate={{
                    backgroundColor: isActive ? "#0f172a" : "#ffffff",
                    borderColor: isActive ? "#0f172a" : "#f1f5f9",
                  }}
                  transition={{
                    layout: { type: "spring", stiffness: 400, damping: 30 },
                    backgroundColor: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
                    borderColor: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
                  }}
                  className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${
                    isActive ? "shadow-lg shadow-slate-300" : "hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col">
                    <motion.span
                      animate={{ color: isActive ? "#ffffff" : "#0f172a" }}
                      transition={{ duration: 0.3 }}
                      className="font-bold text-sm mb-1"
                    >
                      {s.title || "Sesi Tanpa Judul"}
                    </motion.span>
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{
                          backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "#f1f5f9",
                          color: isActive ? "#e2e8f0" : "#64748b",
                        }}
                        transition={{ duration: 0.3 }}
                        className="font-mono text-xs px-1.5 py-0.5 rounded"
                      >
                        {s.code}
                      </motion.span>
                      <motion.span
                        animate={{ color: isActive ? "#94a3b8" : "#94a3b8" }}
                        className="text-[10px]"
                      >
                        {new Date(s.created_at).toLocaleDateString()}
                      </motion.span>
                      <motion.div
                        animate={{ color: isActive ? "#cbd5e1" : "#94a3b8" }}
                        className="flex items-center gap-1 ml-1"
                      >
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
                        <span className="text-[10px]">{s.participants?.[0]?.count ?? 0}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.span
                      animate={{
                        backgroundColor: s.ended_at
                          ? isActive
                            ? "rgba(255,255,255,0.1)"
                            : "#f1f5f9"
                          : isActive
                          ? "#22c55e"
                          : "#dcfce7",
                        color: s.ended_at
                          ? isActive
                            ? "#cbd5e1"
                            : "#64748b"
                          : isActive
                          ? "#ffffff"
                          : "#15803d",
                      }}
                      transition={{ duration: 0.3 }}
                      className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                    >
                      {s.ended_at ? "Selesai" : "Aktif"}
                    </motion.span>
                    {!isActive && (
                      <motion.svg
                        initial={{ x: -5, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        whileHover={{ x: 3, transition: { duration: 0.15 } }}
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
                      </motion.svg>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}

