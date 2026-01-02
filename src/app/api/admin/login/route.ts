import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();

    // Use a server-side environment variable (not prefixed with NEXT_PUBLIC_)
    const CORRECT_PASSCODE = process.env.ADMIN_PASSCODE || "Bigger890";

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

