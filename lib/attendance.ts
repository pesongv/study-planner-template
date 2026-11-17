// 출석(입실/퇴실) 계산. 순수 함수만 — scripts/check.ts 에서 테스트
import type { Row } from "./schema";
import { parseKst, today } from "./time.ts";

// 퇴실을 안 누르면 마지막 활동(입실 또는 타이머 기록) 3시간 뒤(또는 자정) 자동 퇴실로 계산
export const AUTO_CHECKOUT_MS = 3 * 60 * 60 * 1000;

/** 지금 앉아 있는 세션 (오늘 날짜, 퇴실 안 함, 자동 퇴실 시간 전). 배열 위치(index)도 함께. lastActive = 오늘 마지막 공부기록 시각 */
export function openSession(rows: Row<"출석">[], sid: string, at = new Date(), lastActive = "") {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.student_id !== sid || r.date !== today(at)) continue;
    const last = lastActive > r.check_in ? lastActive : r.check_in;
    if (r.check_out || at.getTime() - parseKst(last).getTime() > AUTO_CHECKOUT_MS) return null;
    return { row: r, index: i };
  }
  return null;
}

/** 학생별 오늘 마지막 공부기록 시각 */
export function lastActivity(logs: Row<"공부기록">[], day: string) {
  const m = new Map<string, string>();
  for (const l of logs) if (l.date === day && l.created_at > (m.get(l.student_id) ?? "")) m.set(l.student_id, l.created_at);
  return m;
}

/** 이름표용 가림: 홍길동 → 홍*동, 김철 → 김*, 남궁민수 → 남**수 */
/** 테스트 계정: 학번 99999 또는 이름에 '테스트' (선생님 미리보기용, 이름을 가리지 않음) */
export function isTestAccount(u: { student_id: string; name: string }) {
  return u.student_id === "99999" || u.name.includes("테스트");
}

export function maskName(name: string) {
  const n = [...name];
  if (n.length <= 1) return name;
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n.at(-1);
}
