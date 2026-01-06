"use client";

import { Section, SectionHeader } from "./Common";
import { motion, AnimatePresence } from "framer-motion";

export type Question = {
  id: string;
  order_no?: number;
  question: string;
  options: string[];
  correct_index: number;
  points: number;
};

type SessionQuestionListProps = {
  questions: Question[];
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.9,
    rotateX: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -20,
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0],
    },
  },
  hover: {
    y: -4,
    boxShadow: "0 20px 40px -12px rgba(100, 116, 139, 0.2)",
    borderColor: "#a5b4fc",
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

const iconPulse = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
      delay: 0.2,
    },
  },
};

const optionVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function SessionQuestionList({ questions }: SessionQuestionListProps) {
  return (
    <Section>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Pertanyaan Sesi Ini" subtitle={`${questions.length} soal aktif`} />
      </div>
      <motion.div
        layout
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 -mx-4 px-4 space-y-4 max-h-[600px] overflow-y-auto overflow-x-hidden p-4 custom-scrollbar"
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="popLayout">
          {questions.length === 0 ? (
            <motion.div
              key="empty"
              variants={emptyVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
            >
              <motion.div
                variants={iconPulse}
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 font-medium"
              >
                Belum ada pertanyaan
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm mt-1"
              >
                Tambah manual atau impor dari Bank Soal
              </motion.p>
            </motion.div>
          ) : (
            questions.map((q) => (
              <motion.div
                key={q.id}
                layoutId={`question-${q.id}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start justify-between mb-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm"
                    >
                      {q.order_no}
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                    >
                      {q.points} Poin
                    </motion.span>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-slate-900 leading-relaxed mb-4"
                >
                  {q.question}
                </motion.p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((o, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.15 },
                      }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors ${
                        i === q.correct_index
                          ? "bg-green-50 text-green-700 border border-green-200 font-medium shadow-sm"
                          : "bg-slate-50 text-slate-600 border border-transparent"
                      }`}
                    >
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                          i === q.correct_index
                            ? "border-green-200 bg-white text-green-700"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </motion.span>
                      <span className="truncate">{o}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}

