create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  order_no int not null,
  question text not null,
  options text[] not null,
  correct_index int not null,
  points int not null default 100,
  created_at timestamptz not null default now(),
  unique (session_id, order_no)
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_index int not null,
  is_correct boolean not null default false,
  points_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create index if not exists answers_session_idx on answers(session_id);
create index if not exists answers_participant_idx on answers(participant_id);
create index if not exists questions_session_idx on questions(session_id);
create index if not exists participants_session_idx on participants(session_id);

create or replace view v_leaderboard as
select
  p.id as participant_id,
  p.session_id,
  p.display_name,
  coalesce(sum(a.points_earned), 0) as total_points,
  count(*) filter (where a.is_correct) as correct_count,
  max(a.created_at) as last_answer_at
from participants p
left join answers a on a.participant_id = p.id
group by p.id, p.session_id, p.display_name;
