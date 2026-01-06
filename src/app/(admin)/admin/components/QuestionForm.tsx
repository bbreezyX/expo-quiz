"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, SectionHeader } from "./Common";
import { motion, AnimatePresence, Variants } from "framer-motion";

type QuestionFormProps = {
  title: string;
  subtitle?: string;
  questionText: string;
  setQuestionText: (text: string) => void;
  options: string[];
  setOptions: (options: string[]) => void;
  correctIndex: number;
  setCorrectIndex: (index: number) => void;
  points: number;
  setPoints: (points: number) => void;
  onSubmit: () => void;
  busy: boolean;
  disabled?: boolean;
  submitLabel: string;
  headerAction?: ReactNode;
  disabledContent?: ReactNode;
  className?: string;
};

// Animation variants
const formVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const optionVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      delay: i * 0.05,
    },
  }),
};

const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.35)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
  loading: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const disabledContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
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
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export function QuestionForm({
  title,
  subtitle,
  questionText,
  setQuestionText,
  options,
  setOptions,
  correctIndex,
  setCorrectIndex,
  points,
  setPoints,
  onSubmit,
  busy,
  disabled = false,
  submitLabel,
  headerAction,
  disabledContent,
  className = "",
}: QuestionFormProps) {
  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  return (
    <Section className={className}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between mb-6"
      >
        <SectionHeader title={title} subtitle={subtitle} />
        {headerAction && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {headerAction}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {disabled && disabledContent ? (
          <motion.div
            key="disabled"
            variants={disabledContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {disabledContent}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            <motion.div variants={fieldVariants} className="space-y-2">
              <motion.label
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
              >
                Pertanyaan
              </motion.label>
              <motion.textarea
                whileFocus={{
                  boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.1)",
                  borderColor: "#0f172a",
                }}
                transition={{ duration: 0.2 }}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan..."
                disabled={busy || disabled}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none min-h-[100px]"
              />
            </motion.div>

            <motion.div variants={fieldVariants} className="space-y-3">
              <motion.label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Opsi Jawaban
              </motion.label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                    className="relative group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, backgroundColor: "#f8fafc" }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-400 shadow-sm transition-colors z-10"
                    >
                      {String.fromCharCode(65 + i)}
                    </motion.div>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Opsi ${i + 1}`}
                      disabled={busy || disabled}
                      className="pl-11 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fieldVariants} className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Kunci Jawaban
                </label>
                <motion.select
                  whileFocus={{ boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.1)" }}
                  value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                  disabled={busy || disabled}
                  className="w-full h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none"
                >
                  {options.map((_, i) => (
                    <option key={i} value={i}>
                      Jawaban: {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </motion.select>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Poin
                </label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  disabled={busy || disabled}
                  className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-center font-mono font-medium"
                  placeholder="Poin"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover={!busy && !disabled ? "hover" : undefined}
                whileTap={!busy && !disabled ? "tap" : undefined}
                animate={busy ? "loading" : "idle"}
              >
                <Button
                  onClick={onSubmit}
                  disabled={busy || disabled}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-200 transition-all relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {busy ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Menyimpan...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {submitLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

