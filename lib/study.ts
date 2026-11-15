// 공부법, 별 계산. 순수 함수만 (서버·브라우저 공용) — scripts/check.ts 에서 테스트
import type { Row } from "./schema";

export type Method = "pomodoro" | "50-10" | "free";
// focus: 집중 시간(분), rest: 쉬는 시간(분). 자유 타이머는 시간이 올라가고 최대 cap분까지 기록
export const METHODS: Record<Method, { label: string; focus: number; rest: number; cap: number }> = {
  pomodoro: { label: "포모도로 25/5", focus: 25, rest: 5, cap: 25 },
  "50-10": { label: "50/10", focus: 50, rest: 10, cap: 50 },
  free: { label: "자유 타이머", focus: 0, rest: 0, cap: 180 },
};

export const STAR_MINUTES = 25;
/** 한 번 공부할 때마다 25분당 별 1개 (24분은 0개, 50분은 2개) */
export const starsFor = (minutes: number) => Math.floor(minutes / STAR_MINUTES);

/** 내 공부 기록 요약 */
export function summarize(logs: Row<"공부기록">[], today: string) {
  const s = { todayMinutes: 0, todayStars: 0, monthStars: 0, totalStars: 0 };
  for (const l of logs) {
    const m = Number(l.minutes) || 0;
    const st = starsFor(m);
    s.totalStars += st;
    if (l.date.slice(0, 7) === today.slice(0, 7)) s.monthStars += st;
    if (l.date === today) {
      s.todayMinutes += m;
      s.todayStars += st;
    }
  }
  return s;
}

export const REST_TIPS = [
  "물 한 잔 마셔요 💧",
  "일어나서 기지개를 쭉 켜 봐요 🙆",
  "창밖 먼 곳을 20초 바라봐요 👀",
  "목과 어깨를 천천히 돌려 봐요 🔄",
  "심호흡 세 번! 후— 🌬️",
];
