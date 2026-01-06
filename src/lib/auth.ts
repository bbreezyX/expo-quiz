import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


// Constants
const AUTH_COOKIE_NAME = "admin_token";
const PARTICIPANT_COOKIE_NAME = "participant_session";
const TOKEN_EXPIRY = "24h";
const PARTICIPANT_TOKEN_EXPIRY = "7d";

// Get secret key - will throw if not set
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diset di environment variables!");
  }
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload extends JWTPayload {
  role: "admin";
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for admin
 */
export async function generateAdminToken(): Promise<string> {
  const secret = getSecretKey();

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Set auth cookie with httpOnly flag
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Remove auth cookie
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Get token from cookie
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Check if current request is authenticated as admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;

  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

/**
 * Get token from request (for middleware)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Verify request is from admin (for middleware)
 */
export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const token = getTokenFromRequest(request);
  if (!token) return false;

  const payload = await verifyToken(token);
  return payload?.role === "admin";
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

// ============================================
// PARTICIPANT SESSION MANAGEMENT
// ============================================

export interface ParticipantTokenPayload extends JWTPayload {
  participantId: string;
  sessionCode: string;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for participant
 */
export async function generateParticipantToken(
  participantId: string,
  sessionCode: string,
  sessionId: string
): Promise<string> {
  const secret = getSecretKey();

  const token = await new SignJWT({
    participantId,
    sessionCode,
    sessionId
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PARTICIPANT_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify participant token
 */
export async function verifyParticipantToken(token: string): Promise<ParticipantTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    if (!payload.participantId || !payload.sessionCode || !payload.sessionId) {
      return null;
    }

    return payload as ParticipantTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Set participant cookie
 */
export async function setParticipantCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(PARTICIPANT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Get participant token from cookie
 */
export async function getParticipantToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PARTICIPANT_COOKIE_NAME)?.value ?? null;
}

/**
 * Get participant session from cookie
 */
export async function getParticipantSession(): Promise<ParticipantTokenPayload | null> {
  const token = await getParticipantToken();
  if (!token) return null;
  return verifyParticipantToken(token);
}

/**
 * Remove participant cookie
 */
export async function removeParticipantCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PARTICIPANT_COOKIE_NAME);
}

/**
 * Get participant from request (for API routes)
 */
export function getParticipantTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(PARTICIPANT_COOKIE_NAME)?.value ?? null;
}

/**
 * Verify participant from request
 */
export async function verifyParticipantRequest(
  request: NextRequest
): Promise<ParticipantTokenPayload | null> {
  const token = getParticipantTokenFromRequest(request);
  if (!token) return null;
  return verifyParticipantToken(token);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do comparison to maintain constant time
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
