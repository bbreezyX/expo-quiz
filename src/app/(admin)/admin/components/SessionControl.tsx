"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, SectionHeader, StatusBadge } from "./Common";

type SessionControlProps = {
  code: string | null;
  endedAt: string | null;
  busy: boolean;
  manualCode: string;
  setManualCode: (code: string) => void;
  onCreateSession: () => void;
  onLoadSession: () => void;
  onEndSession: () => void;
  onCloseSession: () => void;
};

export function SessionControl({
  code,
  endedAt,
  busy,
  manualCode,
  setManualCode,
  onCreateSession,
  onLoadSession,
  onEndSession,
  onCloseSession,
}: SessionControlProps) {
  const [origin, setOrigin] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const qrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = code && origin ? `${origin}/join/${code}` : "";
  const screenUrl = code && origin ? `${origin}/screen/${code}` : "";
  const sessionStatus = code ? (endedAt ? "ended" : "active") : "none";

  function copyText(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    toast.success("Tersalin!");
  }

  const buildQrBlob = useCallback(async (size = 512) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) throw new Error("QR belum siap");

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<Blob>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas tidak tersedia"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Gagal membuat QR"));
            return;
          }
          resolve(blob);
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal memuat QR"));
      };
      img.src = url;
    });
  }, []);

  const shareQr = useCallback(async () => {
    if (!joinUrl || !code) return;
    setQrBusy(true);
    try {
      const blob = await buildQrBlob();
      const filename = `qr-${code}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `QR Sesi ${code}`,
          text: "Scan untuk ikut quiz",
        });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("QR tersimpan");
      }
    } catch {
      toast.error("Gagal membagikan QR");
    } finally {
      setQrBusy(false);
    }
  }, [buildQrBlob, code, joinUrl]);

  return (
    <Section>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Kontrol Sesi" subtitle="Kelola sesi quiz yang berjalan" />
        <StatusBadge status={sessionStatus} />
      </div>

      <div className="space-y-4">
        {!code ? (
          <div className="flex flex-col gap-4">
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
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
                  className="text-indigo-500"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Mulai Sesi Baru</h3>
              <p className="text-sm text-slate-500 max-w-xs mb-6">
                Buat sesi baru untuk memulai kuis. Kode sesi akan dibuat otomatis.
              </p>
              <Button
                onClick={onCreateSession}
                disabled={busy}
                size="lg"
                className="rounded-full bg-slate-900 text-white hover:bg-slate-800 px-8 h-12 shadow-lg shadow-slate-200"
              >
                Buat Sesi Sekarang
              </Button>
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Atau
              </span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Masukkan Kode Sesi Lama"
                className="rounded-xl h-12 border-slate-200 bg-white text-center font-mono uppercase tracking-widest text-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
              <Button
                variant="outline"
                onClick={onLoadSession}
                disabled={busy}
                className="rounded-xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-medium"
              >
                Muat
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Kode Sesi
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {code}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyText(code)}
                      className="h-10 w-10 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
                    onClick={() => copyText(joinUrl)}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        Link Peserta
                      </span>
                      <span className="text-sm font-mono text-slate-600 truncate font-medium">
                        {joinUrl}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-full text-slate-300 group-hover:text-indigo-500 shadow-sm transition-colors">
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
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                  </div>
                  <div
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
                    onClick={() => copyText(screenUrl)}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        Link Layar
                      </span>
                      <span className="text-sm font-mono text-slate-600 truncate font-medium">
                        {screenUrl}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-full text-slate-300 group-hover:text-indigo-500 shadow-sm transition-colors">
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
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {joinUrl && !endedAt && (
                <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                    <div ref={qrRef} className="bg-white p-1">
                      <QRCode value={joinUrl} size={140} />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareQr}
                    disabled={qrBusy}
                    className="h-9 px-4 text-xs font-medium rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download QR
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <span
                  className={`relative flex h-3 w-3 ${
                    endedAt ? "" : "animate-pulse"
                  }`}
                >
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      endedAt ? "hidden" : "bg-green-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      endedAt ? "bg-red-500" : "bg-green-500"
                    }`}
                  ></span>
                </span>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {endedAt
                    ? `Berakhir: ${new Date(endedAt).toLocaleTimeString()}`
                    : "Live Session"}
                </span>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {!endedAt ? (
                  <Button
                    variant="destructive"
                    onClick={onEndSession}
                    disabled={busy}
                    className="flex-1 sm:flex-none rounded-full px-6 font-semibold shadow-lg shadow-red-100 hover:shadow-red-200 transition-all"
                  >
                    Akhiri Sesi
                  </Button>
                ) : (
                  <span className="flex-1 sm:flex-none px-6 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-500 text-center">
                    Sesi Selesai
                  </span>
                )}
                <Button
                  variant="outline"
                  onClick={onCloseSession}
                  className="flex-1 sm:flex-none rounded-full px-6 font-medium border-slate-200 hover:bg-slate-50"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

