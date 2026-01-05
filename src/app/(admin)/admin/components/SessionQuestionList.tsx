"use client";

import { Section, SectionHeader } from "./Common";

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

export function SessionQuestionList({ questions }: SessionQuestionListProps) {
  return (
    <Section>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Pertanyaan Sesi Ini" subtitle={`${questions.length} soal aktif`} />
      </div>
      <div className="mt-4 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
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
            </div>
            <p className="text-slate-500 font-medium">Belum ada pertanyaan</p>
            <p className="text-slate-400 text-sm mt-1">Tambah manual atau impor dari Bank Soal</p>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm">
                    {q.order_no}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    {q.points} Poin
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-4">
                {q.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((o, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors ${
                      i === q.correct_index
                        ? "bg-green-50 text-green-700 border border-green-200 font-medium shadow-sm"
                        : "bg-slate-50 text-slate-600 border border-transparent"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        i === q.correct_index
                          ? "border-green-200 bg-white text-green-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="truncate">{o}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

