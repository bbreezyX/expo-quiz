"use client";

import { Button } from "@/components/ui/button";
import { Question } from "./SessionQuestionList";
import { motion, AnimatePresence, Variants } from "framer-motion";

type ImportQuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bankQuestions: Question[];
  selectedBankIds: Set<string>;
  setSelectedBankIds: (ids: Set<string>) => void;
  onImport: () => void;
  busy: boolean;
};

// Animation variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] },
  },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 50,
    rotateX: 5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
};

const footerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const checkmarkVariants: Variants = {
  hidden: { scale: 0, rotate: -45, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    rotate: 45,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

export function ImportQuestionModal({
  isOpen,
  onClose,
  bankQuestions,
  selectedBankIds,
  setSelectedBankIds,
  onImport,
  busy,
}: ImportQuestionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ perspective: 1200 }}
        >
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl z-10 relative overflow-hidden"
          >
            <motion.div
              variants={headerVariants}
              initial="hidden"
              animate="visible"
              className="p-4 sm:p-6 border-b flex justify-between items-center"
            >
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-bold"
              >
                Pilih dari Bank Soal
              </motion.h3>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </motion.button>
            </motion.div>

            <motion.div
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bankQuestions.map((q) => {
                  const isSelected = selectedBankIds.has(q.id);
                  return (
                    <motion.div
                      layout
                      layoutId={`import-${q.id}`}
                      key={q.id}
                      variants={cardVariants}
                      onClick={() => {
                        const next = new Set(selectedBankIds);
                        if (isSelected) next.delete(q.id);
                        else next.add(q.id);
                        setSelectedBankIds(next);
                      }}
                      whileHover={{
                        scale: 1.03,
                        boxShadow: isSelected
                          ? "0 20px 40px -12px rgba(99, 102, 241, 0.3)"
                          : "0 15px 35px -12px rgba(100, 116, 139, 0.2)",
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      animate={{
                        borderColor: isSelected ? "#6366f1" : "#e2e8f0",
                        backgroundColor: isSelected ? "rgba(238, 242, 255, 0.5)" : "#ffffff",
                      }}
                      transition={{
                        layout: { type: "spring", stiffness: 400, damping: 30 },
                        borderColor: { duration: 0.2 },
                        backgroundColor: { duration: 0.2 },
                      }}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer group ${
                        isSelected ? "ring-1 ring-indigo-500 shadow-md" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1">
                          <motion.span
                            animate={{
                              backgroundColor: isSelected ? "#e0e7ff" : "#f1f5f9",
                              color: isSelected ? "#4338ca" : "#64748b",
                            }}
                            transition={{ duration: 0.2 }}
                            className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {q.points} Poin
                          </motion.span>
                        </div>
                        <motion.div
                          animate={{
                            backgroundColor: isSelected ? "#6366f1" : "#ffffff",
                            borderColor: isSelected ? "#6366f1" : "#cbd5e1",
                            scale: isSelected ? 1.1 : 1,
                          }}
                          whileHover={{ scale: isSelected ? 1.1 : 1.15 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.svg
                                variants={checkmarkVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                      <motion.p
                        animate={{ color: isSelected ? "#312e81" : "#1e293b" }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-semibold mb-3 line-clamp-2"
                      >
                        {q.question}
                      </motion.p>
                      <div className="space-y-1.5">
                        <motion.div
                          animate={{ color: isSelected ? "#4338ca" : "#64748b" }}
                          className="text-xs"
                        >
                          <span className="font-medium">Jawaban:</span> {q.options[q.correct_index]}
                        </motion.div>
                        <div className="text-[10px] text-slate-400">
                          +{q.options.length - 1} opsi lainnya
                        </div>
                      </div>

                      {/* Selection ring effect */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="absolute inset-0 rounded-2xl border-2 border-indigo-400 pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
              {bankQuestions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-slate-400"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </motion.div>
                  <p className="text-slate-500">Bank soal kosong. Isi dulu di tab Bank Soal.</p>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              variants={footerVariants}
              initial="hidden"
              animate="visible"
              className="p-4 sm:p-6 border-t bg-white rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left"
              >
                Terpilih:{" "}
                <motion.b
                  key={selectedBankIds.size}
                  initial={{ scale: 1.3, color: "#6366f1" }}
                  animate={{ scale: 1, color: "#0f172a" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {selectedBankIds.size}
                </motion.b>{" "}
                soal
              </motion.div>
              <div className="flex gap-3 w-full sm:w-auto">
                <motion.div variants={buttonVariants} className="flex-1 sm:flex-initial">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                    <Button variant="ghost" onClick={onClose} className="rounded-full w-full sm:w-auto">
                      Batal
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div variants={buttonVariants} className="flex-1 sm:flex-initial">
                  <motion.div
                    whileHover={{ scale: selectedBankIds.size > 0 && !busy ? 1.05 : 1 }}
                    whileTap={{ scale: selectedBankIds.size > 0 && !busy ? 0.95 : 1 }}
                    animate={busy ? { scale: [1, 1.02, 1] } : {}}
                    transition={busy ? { duration: 1, repeat: Infinity } : {}}
                    className="w-full"
                  >
                    <Button
                      onClick={onImport}
                      disabled={selectedBankIds.size === 0 || busy}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 w-full sm:w-auto"
                    >
                    <AnimatePresence mode="wait">
                      {busy ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex items-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Mengimpor...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          Impor ke Sesi
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

