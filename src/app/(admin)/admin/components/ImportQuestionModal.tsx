"use client";

import { Button } from "@/components/ui/button";
import { Question } from "./SessionQuestionList";

type ImportQuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  bankQuestions: Question[];
  selectedBankIds: Set<string>;
  setSelectedBankIds: (ids: Set<string>) => void;
  onImport: () => void;
  busy: boolean;
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Pilih dari Bank Soal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bankQuestions.map((q) => {
              const isSelected = selectedBankIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    const next = new Set(selectedBankIds);
                    if (isSelected) next.delete(q.id);
                    else next.add(q.id);
                    setSelectedBankIds(next);
                  }}
                  className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {q.points} Poin
                      </span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500 scale-110"
                          : "border-slate-300 bg-white group-hover:border-indigo-400"
                      }`}
                    >
                      {isSelected && (
                        <svg
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
                        </svg>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold mb-3 line-clamp-2 transition-colors ${
                      isSelected ? "text-indigo-900" : "text-slate-800"
                    }`}
                  >
                    {q.question}
                  </p>
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Jawaban:</span>{" "}
                      {q.options[q.correct_index]}
                    </div>
                    <div className="text-[10px] text-slate-400">+{q.options.length - 1} opsi lainnya</div>
                  </div>
                </div>
              );
            })}
          </div>
          {bankQuestions.length === 0 && (
            <div className="text-center py-10 text-slate-500">Bank soal kosong. Isi dulu di tab Bank Soal.</div>
          )}
        </div>

        <div className="p-6 border-t bg-white rounded-b-3xl flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Terpilih: <b>{selectedBankIds.size}</b> soal
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-full">
              Batal
            </Button>
            <Button
              onClick={onImport}
              disabled={selectedBankIds.size === 0 || busy}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Impor ke Sesi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

