-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This adds security to your database tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- Allow anyone to read sessions (needed for join page)
CREATE POLICY "Anyone can read sessions"
ON sessions FOR SELECT
USING (true);

-- Only service role can insert/update/delete sessions
-- (API routes use service role key for admin actions)
CREATE POLICY "Service role can manage sessions"
ON sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- QUESTIONS TABLE POLICIES
-- ============================================

-- Allow anyone to read questions (for quiz display)
CREATE POLICY "Anyone can read questions"
ON questions FOR SELECT
USING (true);

-- Only service role can insert/update/delete questions
CREATE POLICY "Service role can manage questions"
ON questions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- PARTICIPANTS TABLE POLICIES
-- ============================================

-- Allow anyone to read participants (for leaderboard)
CREATE POLICY "Anyone can read participants"
ON participants FOR SELECT
USING (true);

-- Allow anyone to insert themselves as participant
-- (public join endpoint)
CREATE POLICY "Anyone can join as participant"
ON participants FOR INSERT
WITH CHECK (true);

-- Only service role can update/delete participants
CREATE POLICY "Service role can manage participants"
ON participants FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete participants"
ON participants FOR DELETE
USING (auth.role() = 'service_role');

-- ============================================
-- ANSWERS TABLE POLICIES
-- ============================================

-- Allow anyone to read answers (for leaderboard calculation)
CREATE POLICY "Anyone can read answers"
ON answers FOR SELECT
USING (true);

-- Allow anyone to submit an answer
-- (the API route validates session/participant/question)
CREATE POLICY "Anyone can submit answers"
ON answers FOR INSERT
WITH CHECK (true);

-- Only service role can update/delete answers
CREATE POLICY "Service role can manage answers"
ON answers FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete answers"
ON answers FOR DELETE
USING (auth.role() = 'service_role');

-- ============================================
-- ALTERNATIVE: More Restrictive Policies
-- ============================================
-- If you want tighter security, you can use a service_role
-- key on your server and restrict anon access completely.
-- 
-- To do this:
-- 1. Create a new environment variable: SUPABASE_SERVICE_ROLE_KEY
-- 2. Use service role client for all server-side operations
-- 3. Change policies to only allow service_role access
--
-- Example:
-- DROP POLICY IF EXISTS "Anyone can read sessions" ON sessions;
-- CREATE POLICY "Only service role can access"
-- ON sessions FOR ALL
-- USING (auth.role() = 'service_role');
-- ============================================

