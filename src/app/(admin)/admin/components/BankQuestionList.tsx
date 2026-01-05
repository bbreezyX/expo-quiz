"use client";

import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "./Common";
import { Question } from "./SessionQuestionList";

type BankQuestionListProps = {
  questions: Question[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export function BankQuestionList({ questions, onDelete, onRefresh }: BankQuestionListProps) {
  return (
    <Section className="h-full">
      <div className="flex justify-between items-center mb-6">
        <SectionHeader title={`Bank Soal (${questions.length})`} subtitle="Gudang pertanyaan" />
        <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-full text-xs">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
        {questions.map((q) => (
          <div
            key={q.id}
            className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
          >
            <div className="mb-4">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {q.points} Poin
                </span>
                <button
                  onClick={() => onDelete(q.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4 line-clamp-3">
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((o, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                      i === q.correct_index
                        ? "bg-green-50 text-green-700 border border-green-100 font-medium"
                        : "bg-slate-50 text-slate-500 border border-transparent"
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
            <div className="mt-2 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>ID: {q.id.slice(0, 8)}...</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      {questions.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          Bank soal masih kosong.
        </div>
      )}
    </Section>
  );
}

