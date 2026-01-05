"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, SectionHeader } from "./Common";

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
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title={title} subtitle={subtitle} />
        {headerAction}
      </div>

      {disabled && disabledContent ? (
        disabledContent
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
              Pertanyaan
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tulis pertanyaan..."
              disabled={busy || disabled}
              className="w-full rounded-2xl border-slate-200 bg-slate-50/50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all outline-none resize-none min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
              Opsi Jawaban
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, i) => (
                <div key={i} className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-400 shadow-sm transition-colors">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opsi ${i + 1}`}
                    disabled={busy || disabled}
                    className="pl-11 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                Kunci Jawaban
              </label>
              <select
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
              </select>
            </div>
            <div className="space-y-2">
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
            </div>
          </div>

          <Button
            onClick={onSubmit}
            disabled={busy || disabled}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </Section>
  );
}

