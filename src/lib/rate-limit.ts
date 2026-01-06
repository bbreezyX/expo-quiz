import { supabaseAdmin } from "@/lib/supabase-admin";

type RateLimitConfig = {
    maxAttempts: number;
    windowMs: number;
};

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },     // 5 per 15 min
    answer: { maxAttempts: 60, windowMs: 60 * 1000 },        // 60 per minute
    join: { maxAttempts: 10, windowMs: 60 * 1000 },          // 10 per minute
};

/**
 * Persistent rate limiter using Supabase
 */
export async function checkRateLimit(
    type: keyof typeof RATE_LIMIT_CONFIGS,
    identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
        const config = RATE_LIMIT_CONFIGS[type];
        const now = Date.now();
        const key = `ratelimit:${type}:${identifier}`;
        const resetAt = now + config.windowMs;

        // 1. Get current limit
        const { data: record, error } = await supabaseAdmin
            .from("rate_limits")
            .select("count, reset_at")
            .eq("key", key)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Rate limit check failed:", error);
            return { allowed: true };
        }

        // 2. If no record or expired, reset/create
        if (!record || now > record.reset_at) {
            await supabaseAdmin
                .from("rate_limits")
                .upsert({
                    key,
                    count: 1,
                    reset_at: resetAt
                }, { onConflict: "key" });

            return { allowed: true };
        }

        // 3. Check limit
        if (record.count >= config.maxAttempts) {
            return {
                allowed: false,
                retryAfter: Math.ceil((record.reset_at - now) / 1000)
            };
        }

        // 4. Increment
        await supabaseAdmin
            .from("rate_limits")
            .update({ count: record.count + 1 })
            .eq("key", key);

        return { allowed: true };

    } catch (err) {
        console.error("Rate limit exception:", err);
        return { allowed: true };
    }
}

/**
 * Reset rate limit
 */
export async function resetRateLimit(type: keyof typeof RATE_LIMIT_CONFIGS, identifier: string): Promise<void> {
    const key = `ratelimit:${type}:${identifier}`;
    await supabaseAdmin.from("rate_limits").delete().eq("key", key);
}

// Aliases for compatibility
export async function checkLoginRateLimit(ip: string) {
    return checkRateLimit("login", ip);
}

export async function resetLoginRateLimit(ip: string) {
    await resetRateLimit("login", ip);
}
