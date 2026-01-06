
import { NextRequest, NextResponse } from "next/server";
import {
  generateAdminToken,
  setAuthCookie,
  secureCompare,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  resetLoginRateLimit
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Check rate limit
    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan.Coba lagi dalam ${rateLimit.retryAfter} detik.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          }
        }
      );
    }

    const { passcode } = await req.json();

    // Passcode diambil HANYA dari environment variable.
    const CORRECT_PASSCODE = process.env.ADMIN_PASSCODE;

    if (!CORRECT_PASSCODE) {
      console.error("ADMIN_PASSCODE belum diset di environment variables!");
      return NextResponse.json(
        { error: "Konfigurasi server belum lengkap." },
        { status: 500 }
      );
    }

    // Use constant-time comparison to prevent timing attacks
    if (secureCompare(String(passcode || ""), CORRECT_PASSCODE)) {
      // Reset rate limit on successful login
      await resetLoginRateLimit(ip);

      // Generate JWT token
      const token = await generateAdminToken();

      // Set httpOnly cookie
      await setAuthCookie(token);

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
