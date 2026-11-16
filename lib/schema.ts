// 시트 탭 이름과 헤더 — study-planner-spec.md 6번과 정확히 일치해야 함
export const TABS = {
  학생: ["student_id", "name", "role", "password_hash", "character", "seat_no", "must_change_pw", "created_at"],
  목표: ["goal_id", "student_id", "level", "parent_id", "period_start", "period_end", "title", "subject", "target_amount", "unit", "done_amount", "status", "updated_at", "ranges_json"],
  교재: ["book_id", "student_id", "title", "subject", "units_json", "total_pages", "deadline", "rest_days", "created_at"],
  출석: ["session_id", "student_id", "date", "check_in", "check_out", "method"],
  공부기록: ["log_id", "student_id", "date", "goal_id", "subject", "minutes", "method", "created_at"],
  회고: ["student_id", "date", "learned", "mood", "week_review", "created_at"],
  퀴즈: ["quiz_id", "student_id", "date", "subject", "question", "answer", "type", "choices_json", "solved_date", "correct"],
  포인트뱃지: ["student_id", "date", "type", "value", "reason"],
  설정: ["key", "value"],
  쪽지: ["msg_id", "student_id", "text", "created_at", "read_at"],
} as const;

export type Tab = keyof typeof TABS;
export type Row<T extends Tab> = Record<(typeof TABS)[T][number], string>;
