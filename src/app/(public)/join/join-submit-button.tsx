"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export default function JoinSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full rounded-full h-14"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          Memproses...
        </span>
      ) : (
        "Lanjut"
      )}
    </Button>
  );
}
