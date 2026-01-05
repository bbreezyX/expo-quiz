import useSWR, { SWRConfiguration } from "swr";
import { supabase } from "./supabase";

// Generic fetcher for API routes
const apiFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

// ============================================
// PARTICIPANT SESSION HOOKS
// ============================================

export type ParticipantSession = {
  authenticated: boolean;
  participantId?: string;
  sessionCode?: string;
  sessionId?: string;
};

export function useParticipantSession(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<ParticipantSession>(
    "/api/participant/verify",
    apiFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      ...options,
    }
  );

  return {
    session: data,
    isAuthenticated: data?.authenticated ?? false,
    participantId: data?.participantId,
    sessionCode: data?.sessionCode,
    sessionId: data?.sessionId,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================
// SESSION DATA HOOKS
// ============================================

export type SessionData = {
  id: string;
  code: string;
  title: string;
  created_at: string;
  ended_at: string | null;
};

export function useSession(code: string, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ session: SessionData }>(
    code ? `/api/session/${code}` : null,
    apiFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      ...options,
    }
  );

  return {
    session: data?.session,
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================
// QUESTIONS HOOKS
// ============================================

export type Question = {
  id: string;
  order_no: number;
  question: string;
  options: string[];
  points: number;
  correct_index?: number; // Only for admin
};

export function useQuestions(sessionId: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId ? `questions-${sessionId}` : null,
    async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from("questions")
        .select("id, order_no, question, options, points")
        .eq("session_id", sessionId)
        .order("order_no", { ascending: true });
      
      if (error) throw error;
      
      return (data ?? []).map((q) => ({
        ...q,
        options: q.options as string[],
      }));
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Cache questions for 10 seconds
      ...options,
    }
  );

  return {
    questions: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================
// LEADERBOARD HOOKS
// ============================================

export type LeaderboardRow = {
  participant_id: string;
  display_name: string;
  total_points: number;
  correct_count: number;
  last_answer_at: string;
};

export function useLeaderboard(sessionId: string | null, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId ? `leaderboard-${sessionId}` : null,
    async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from("v_leaderboard")
        .select("*")
        .eq("session_id", sessionId)
        .order("total_points", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as LeaderboardRow[];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000, // Refresh leaderboard every 2 seconds max
      ...options,
    }
  );

  return {
    rows: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================
// ANSWERS HOOKS (for tracking answered questions)
// ============================================

export function useAnsweredQuestions(
  sessionId: string | null, 
  participantId: string | null,
  options?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId && participantId ? `answers-${sessionId}-${participantId}` : null,
    async () => {
      if (!sessionId || !participantId) return new Set<string>();
      
      const { data, error } = await supabase
        .from("answers")
        .select("question_id")
        .eq("session_id", sessionId)
        .eq("participant_id", participantId);
      
      if (error) throw error;
      
      return new Set((data ?? []).map((a) => a.question_id));
    },
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    answeredQuestions: data ?? new Set<string>(),
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============================================
// ADMIN SESSION LIST HOOKS
// ============================================

export type SessionSummary = {
  id: string;
  code: string;
  title: string;
  created_at: string;
  ended_at: string | null;
};

export function useSessionList(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ sessions: SessionSummary[] }>(
    "/api/session/list",
    apiFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    sessions: data?.sessions ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}




