import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-500 text-xs sm:text-sm">{subtitle}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: "active" | "ended" | "none" }) {
  const styles = {
    active: "bg-slate-900 text-white",
    ended: "bg-slate-200 text-slate-600",
    none: "bg-slate-100 text-slate-500",
  };
  const labels = {
    active: "Aktif",
    ended: "Selesai",
    none: "Belum ada",
  };
  return (
    <span className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function InfoBox({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="space-y-1 flex-1 min-w-0 mr-2">
        <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</div>
        <div className="font-mono text-xs sm:text-sm text-slate-900 break-all">{value}</div>
      </div>
      {onCopy && (
        <Button size="sm" variant="ghost" onClick={onCopy} className="shrink-0 h-8 sm:h-9 text-xs sm:text-sm font-medium">
          Salin
        </Button>
      )}
    </div>
  );
}

