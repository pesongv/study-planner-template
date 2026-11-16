-- 우리 반 독서실 표 만들기. 수파베이스 SQL Editor에 통째로 붙여 넣고 Run.
-- 모든 칸은 글자(text). 표마다 RLS를 켜고 정책을 안 만들어서, 서버의 비밀 키 말고는 아무도 못 읽고 못 씀.

-- 학생
create table if not exists public.students (
  id bigint generated always as identity primary key,
  "student_id" text not null default '',
  "name" text not null default '',
  "role" text not null default '',
  "password_hash" text not null default '',
  "character" text not null default '',
  "seat_no" text not null default '',
  "must_change_pw" text not null default '',
  "created_at" text not null default ''
);
alter table public.students enable row level security;
create index if not exists students_student_id on public.students ("student_id");

-- 목표
create table if not exists public.goals (
  id bigint generated always as identity primary key,
  "goal_id" text not null default '',
  "student_id" text not null default '',
  "level" text not null default '',
  "parent_id" text not null default '',
  "period_start" text not null default '',
  "period_end" text not null default '',
  "title" text not null default '',
  "subject" text not null default '',
  "target_amount" text not null default '',
  "unit" text not null default '',
  "done_amount" text not null default '',
  "status" text not null default '',
  "updated_at" text not null default '',
  "ranges_json" text not null default ''
);
alter table public.goals enable row level security;
create index if not exists goals_student_id on public.goals ("student_id");

-- 교재
create table if not exists public.books (
  id bigint generated always as identity primary key,
  "book_id" text not null default '',
  "student_id" text not null default '',
  "title" text not null default '',
  "subject" text not null default '',
  "units_json" text not null default '',
  "total_pages" text not null default '',
  "deadline" text not null default '',
  "rest_days" text not null default '',
  "created_at" text not null default ''
);
alter table public.books enable row level security;
create index if not exists books_student_id on public.books ("student_id");

-- 출석
create table if not exists public.attendance (
  id bigint generated always as identity primary key,
  "session_id" text not null default '',
  "student_id" text not null default '',
  "date" text not null default '',
  "check_in" text not null default '',
  "check_out" text not null default '',
  "method" text not null default ''
);
alter table public.attendance enable row level security;
create index if not exists attendance_student_id on public.attendance ("student_id");

-- 공부기록
create table if not exists public.study_logs (
  id bigint generated always as identity primary key,
  "log_id" text not null default '',
  "student_id" text not null default '',
  "date" text not null default '',
  "goal_id" text not null default '',
  "subject" text not null default '',
  "minutes" text not null default '',
  "method" text not null default '',
  "created_at" text not null default ''
);
alter table public.study_logs enable row level security;
create index if not exists study_logs_student_id on public.study_logs ("student_id");

-- 회고
create table if not exists public.reflections (
  id bigint generated always as identity primary key,
  "student_id" text not null default '',
  "date" text not null default '',
  "learned" text not null default '',
  "mood" text not null default '',
  "week_review" text not null default '',
  "created_at" text not null default ''
);
alter table public.reflections enable row level security;
create index if not exists reflections_student_id on public.reflections ("student_id");

-- 퀴즈
create table if not exists public.quizzes (
  id bigint generated always as identity primary key,
  "quiz_id" text not null default '',
  "student_id" text not null default '',
  "date" text not null default '',
  "subject" text not null default '',
  "question" text not null default '',
  "answer" text not null default '',
  "type" text not null default '',
  "choices_json" text not null default '',
  "solved_date" text not null default '',
  "correct" text not null default ''
);
alter table public.quizzes enable row level security;
create index if not exists quizzes_student_id on public.quizzes ("student_id");

-- 포인트뱃지
create table if not exists public.points (
  id bigint generated always as identity primary key,
  "student_id" text not null default '',
  "date" text not null default '',
  "type" text not null default '',
  "value" text not null default '',
  "reason" text not null default ''
);
alter table public.points enable row level security;
create index if not exists points_student_id on public.points ("student_id");

-- 설정
create table if not exists public.settings (
  id bigint generated always as identity primary key,
  "key" text not null default '',
  "value" text not null default ''
);
alter table public.settings enable row level security;

