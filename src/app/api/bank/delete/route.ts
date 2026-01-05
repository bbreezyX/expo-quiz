import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Payload = {
  id: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Payload;
  const id = String(body.id || "").trim();

  if (!id) return NextResponse.json({ error: "ID pertanyaan wajib diisi" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("question_bank")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
