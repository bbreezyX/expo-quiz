-- Create question_bank table
create table if not exists question_bank (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options text[] not null,
  correct_index int not null,
  points int not null default 100,
  created_at timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

-- Policies for question_bank
-- Allow anyone to read question_bank (for admin display, restricted by app logic if needed, but safe for read)
-- Or better, restrict to service role if we want strict admin only, but for this app structure we often use public read for admin pages or rely on client-side auth protection + RLS
-- Let's mirror the questions policy:
CREATE POLICY "Anyone can read question_bank"
ON question_bank FOR SELECT
USING (true);

-- Only service role can insert/update/delete (via API routes)
CREATE POLICY "Service role can manage question_bank"
ON question_bank FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
