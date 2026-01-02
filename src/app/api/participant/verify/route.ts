import { NextResponse } from "next/server";
import { getParticipantSession } from "@/lib/auth";

export async function GET() {
  const session = await getParticipantSession();
  
  if (session) {
    return NextResponse.json({ 
      authenticated: true,
      participantId: session.participantId,
      sessionCode: session.sessionCode,
      sessionId: session.sessionId
    });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

