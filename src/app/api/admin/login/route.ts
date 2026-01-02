import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();

    // Passcode diambil HANYA dari environment variable.
    // Tidak ada fallback password di dalam kode.
    const CORRECT_PASSCODE = process.env.ADMIN_PASSCODE;

    if (!CORRECT_PASSCODE) {
      console.error("ADMIN_PASSCODE belum diset di environment variables!");
      return NextResponse.json(
        { error: "Konfigurasi server belum lengkap." },
        { status: 500 }
      );
    }

    if (passcode === CORRECT_PASSCODE) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Passcode salah" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
