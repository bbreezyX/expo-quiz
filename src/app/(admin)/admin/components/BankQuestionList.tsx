"use client";

import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "./Common";
import { Question } from "./SessionQuestionList";
import { motion, AnimatePresence } from "framer-motion";

type BankQuestionListProps = {
  questions: Question[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 30,
    rotateY: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 22,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    rotateY: 5,
    transition: {
      duration: 0.3,
      ease: [0.32, 0, 0.67, 0],
    },
  },
  hover: {
    y: -6,
    scale: 1.02,
    boxShadow: "0 25px 50px -12px rgba(100, 116, 139, 0.25)",
    borderColor: "#a5b4fc",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

const deleteButtonVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
  hover: {
    scale: 1.15,
    rotate: 5,
    backgroundColor: "#fef2f2",
    transition: { duration: 0.15 },
  },
  tap: { scale: 0.9 },
};

const optionVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.04,
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  }),
};

const emptyVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: 0.2,
    },
  },
};

export function BankQuestionList({ questions, onDelete, onRefresh }: BankQuestionListProps) {
  return (
    <Section className="h-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center mb-6"
      >
        <SectionHeader title={`Bank Soal (${questions.length})`} subtitle="Gudang pertanyaan" />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-full text-xs">
            <motion.span
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="inline-block mr-1"
            >
              ↻
            </motion.span>
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        layout
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden -mx-4 px-4 p-4 custom-scrollbar"
        style={{ perspective: 1200 }}
      >
        <AnimatePresence mode="popLayout">
          {questions.map((q) => (
            <motion.div
              key={q.id}
              layoutId={`bank-${q.id}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover="hover"
              className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                    className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {q.points} Poin
                  </motion.span>
                  <motion.button
                    variants={deleteButtonVariants}
                    initial="hidden"
                    whileHover="hover"
                    whileTap="tap"
                    animate={undefined}
                    onClick={() => onDelete(q.id)}
                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus Soal"
                  >
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
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </motion.button>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-semibold text-slate-800 leading-relaxed mb-4 line-clamp-3"
                >
                  {q.question}
                </motion.p>
                <div className="space-y-2">
                  {q.options.map((o, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                        i === q.correct_index
                          ? "bg-green-50 text-green-700 border border-green-100 font-medium"
                          : "bg-slate-50 text-slate-500 border border-transparent"
                      }`}
                    >
                      <motion.span
                        whileHover={{ scale: 1.15 }}
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
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-mono"
              >
                <span>ID: {q.id.slice(0, 8)}...</span>
                <span>{new Date().toLocaleDateString()}</span>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {questions.length === 0 && (
          <motion.div
            variants={emptyVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-center py-20 text-slate-400"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </motion.div>
            Bank soal masih kosong.
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

