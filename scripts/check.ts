// 순수 로직 점검. 실행: npm run check
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CHARACTERS, pixels, runs } from "../lib/characters.ts";
import { maskName, openSession, AUTO_CHECKOUT_MS } from "../lib/attendance.ts";
import { now, today } from "../lib/time.ts";
import type { Row } from "../lib/schema.ts";
import { starsFor, summarize } from "../lib/study.ts";
import { certify, isCorrect, latestReflection, starTotals } from "../lib/journal.ts";
import { badgesFor, bestWeek, latestSettings, streaks, weekCompare } from "../lib/achieve.ts";
import { toCsv, weekReport, weekReviewOf } from "../lib/report.ts";
import { addDays, mondayOf, lastDayOf, weeksOfMonth, monthOfWeek, latestGoals, progress, splitMonth, splitRanges, rangeLabel, todayShare, type Goal } from "../lib/goals.ts";

// 캐릭터: 16x16, 아는 색만 사용, id 중복 없음, 8종 이상
assert.ok(CHARACTERS.length >= 8);
assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, CHARACTERS.length);
for (const c of CHARACTERS) {
  if (!c.art) {
    assert.ok(existsSync(new URL(`../public${c.src}`, import.meta.url)), `${c.id} 그림 파일 없음`);
    continue;
  }
  assert.equal(c.art.length, 16, c.id);
  c.art.forEach((row, y) => assert.equal([...row].length, 16, `${c.id} row ${y}`));
  pixels(c).forEach(([x, y, fill]) => assert.ok(fill, `${c.id} (${x},${y}) 색 없음`));
  assert.equal(runs(c).reduce((n, r) => n + r[2], 0), pixels(c).length, `${c.id} runs`);
}

// 이름 가리기
assert.equal(maskName("홍길동"), "홍*동");
assert.equal(maskName("김철"), "김*");
assert.equal(maskName("남궁민수"), "남**수");
assert.equal(maskName("이"), "이");

// 출석 세션
const at = new Date("2026-11-15T05:00:00Z"); // KST 14:00
const row = (o: Partial<Row<"출석">>): Row<"출석"> =>
  ({ session_id: "s", student_id: "1", date: today(at), check_in: now(at), check_out: "", method: "", ...o });
assert.equal(openSession([row({})], "1", at)?.index, 0);
assert.equal(openSession([row({})], "2", at), null, "다른 학생");
assert.equal(openSession([row({ check_out: now(at) })], "1", at), null, "퇴실함");
assert.equal(openSession([row({ date: "2026-11-14" })], "1", at), null, "어제");
const old = new Date(at.getTime() - AUTO_CHECKOUT_MS - 1000);
assert.equal(openSession([row({ check_in: now(old) })], "1", at), null, "자동 퇴실");
assert.equal(openSession([row({ check_in: now(old) })], "1", at, now(at))?.index, 0, "타이머 기록이 있으면 계속 앉아 있음");
assert.equal(openSession([row({ check_out: now(at) }), row({})], "1", at)?.index, 1, "다시 입실");

// 계획: 날짜, 주차, 진행률, 분배
assert.equal(addDays("2026-11-30", 1), "2026-12-01");
assert.equal(addDays("2028-02-28", 1), "2028-02-29");
assert.equal(mondayOf("2026-11-15"), "2026-11-09"); // 일요일 → 그 주 월요일
assert.equal(mondayOf("2026-11-09"), "2026-11-09");
assert.equal(lastDayOf("2026-02"), "2026-02-28");
// 2026-11: 1일이 일요일 → 첫 주차는 11/2(월). 11/30(월)~12/6 주는 목요일이 12월이라 12월 주차
assert.deepEqual(weeksOfMonth("2026-11").map((w) => w.start), ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]);
assert.equal(weeksOfMonth("2026-10")[0].start, "2026-09-28"); // 10/1(목) 이 들어간 주
assert.equal(monthOfWeek("2026-11-30"), "2026-12");

const g = (o: Partial<Goal>): Goal => ({
  goal_id: "x", student_id: "1", level: "day", parent_id: "", period_start: "", period_end: "", title: "", subject: "",
  target_amount: "", unit: "", done_amount: "", status: "todo", updated_at: "", ...o,
});
assert.deepEqual(latestGoals([g({ goal_id: "a", title: "1" }), g({ goal_id: "a", title: "2" }), g({ goal_id: "b", status: "deleted" })]).map((x) => x.title), ["2"]);
const m = g({ goal_id: "m", level: "month" });
const w1 = g({ goal_id: "w1", level: "week", parent_id: "m" });
const w2 = g({ goal_id: "w2", level: "week", parent_id: "m", target_amount: "10", done_amount: "5" });
const d1 = g({ goal_id: "d1", parent_id: "w1", status: "done" });
const d2 = g({ goal_id: "d2", parent_id: "w1" });
const all = [m, w1, w2, d1, d2];
assert.equal(progress(d1, all), 1);
assert.equal(progress(w1, all), 0.5); // 하루 2개 중 1개
assert.equal(progress(w2, all), 0.5); // 5/10
assert.equal(progress(m, all), 0.5);
const split = splitMonth(g({ goal_id: "m", level: "month", period_start: "2026-11-01", title: "수학 문제집", target_amount: "10", unit: "쪽" }));
assert.deepEqual(split.map((s) => s.target_amount), ["3", "3", "2", "2"]);
assert.equal(split[0].title, "수학 문제집 (1주차)");

// 범위 → 날짜별 분배 (2026-11-16 월요일부터, 시험 11-23 월요일)
const base = { from: "2026-11-16", examDate: "2026-11-23", restDays: [] as number[], reviewDays: 0 };
let parts = splitRanges({ ...base, ranges: [[30, 50]] }); // 21쪽 / 7일(16~22)
assert.equal(parts.length, 7);
assert.deepEqual(parts[0], { date: "2026-11-16", count: 3, ranges: [[30, 32]] });
assert.deepEqual(parts.at(-1)!.ranges, [[48, 50]]); assert.equal(parts.at(-1)!.date, "2026-11-22");
parts = splitRanges({ ...base, ranges: [[1, 20]], restDays: [0, 6], reviewDays: 1 }); // 주말 빼고, 22일(일)은 원래 쉼 → 16~20 (5일)
assert.deepEqual(parts.map((p) => p.date), ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]);
assert.deepEqual(parts.map((p) => p.count), [4, 4, 4, 4, 4]);
parts = splitRanges({ ...base, ranges: [[1, 3]] }); // 분량 < 날 → 앞 3일만
assert.deepEqual(parts.map((p) => p.ranges), [[[1, 1]], [[2, 2]], [[3, 3]]]);
assert.deepEqual(splitRanges({ ...base, examDate: "2026-11-16", ranges: [[1, 10]] }), [], "시험이 오늘이면 나눌 날 없음");
// 여러 범위: 13~20(8쪽) + 30~40(11쪽) = 19쪽 / 7일 → 3,3,3,3,3,2,2. 셋째 날이 두 범위에 걸침
parts = splitRanges({ ...base, ranges: [[13, 20], [30, 40]] });
assert.deepEqual(parts.map((p) => p.count), [3, 3, 3, 3, 3, 2, 2]);
assert.deepEqual(parts[2].ranges, [[19, 20], [30, 30]]);
assert.deepEqual(parts.at(-1)!.ranges, [[39, 40]]);
assert.equal(rangeLabel([[30, 33]], "쪽"), "30~33쪽");
assert.equal(rangeLabel([[5, 5]], "쪽"), "5쪽");
assert.equal(rangeLabel([[19, 20], [30, 30]], "쪽"), "19~20, 30쪽");

// 주간 목표 → 오늘 몫: 13쪽, 3쪽 끝냄, 오늘(11/13 금)~11/15(일) 3일 → ceil(10/3)=4
const wk = g({ goal_id: "w", level: "week", period_end: "2026-11-15", target_amount: "13" });
assert.equal(todayShare(wk, [wk, g({ parent_id: "w", status: "done", target_amount: "3" }), g({ parent_id: "w", target_amount: "5" })], "2026-11-13"), 4);
assert.equal(todayShare(wk, [wk], "2026-11-15"), 13, "마지막 날이면 남은 전부");
assert.equal(todayShare(g({ goal_id: "w", level: "week", period_end: "2026-11-15" }), [], "2026-11-13"), 0, "목표량 없음");

// 별: 25분당 1개
assert.equal(starsFor(24), 0);
assert.equal(starsFor(25), 1);
assert.equal(starsFor(50), 2);
assert.equal(starsFor(74), 2);
const log = (date: string, minutes: string) => ({ log_id: "", student_id: "1", date, goal_id: "", subject: "", minutes, method: "", created_at: "" });
assert.deepEqual(summarize([log("2026-11-15", "25"), log("2026-11-15", "50"), log("2026-11-02", "30"), log("2026-10-31", "100")], "2026-11-15"),
  { todayMinutes: 75, todayStars: 3, monthStars: 4, totalStars: 8 });

// 채점: 띄어쓰기·대소문자·끝 마침표 무시
assert.ok(isCorrect({ answer: "광합성" }, " 광 합성. "));
assert.ok(isCorrect({ answer: "Photosynthesis" }, "photosynthesis"));
assert.ok(isCorrect({ answer: "O" }, "o"));
assert.ok(!isCorrect({ answer: "광합성" }, "호흡"));
assert.ok(!isCorrect({ answer: "광합성" }, "  "), "빈 답은 오답");

// 회고: 같은 날 여러 번 쓰면 마지막 것
const refl = (date: string, learned: string) => ({ student_id: "1", date, learned, mood: "😀", week_review: "", created_at: "" });
assert.equal(latestReflection([refl("2026-11-15", "a"), refl("2026-11-15", "b"), refl("2026-11-14", "c")], "1", "2026-11-15")?.learned, "b");

// 오늘 인증: 2개 이상
const D = "2026-11-15";
const quiz = (o: object) => ({ quiz_id: "q", student_id: "1", date: "2026-11-14", subject: "", question: "", answer: "", type: "short", choices_json: "", solved_date: "", correct: "", ...o });
const none = { dayGoals: [], logs: [], reflections: [], quizzes: [], sid: "1", today: D };
assert.deepEqual(certify(none), { todo: false, timer: false, reflection: false, quiz: false, count: 0, done: false });
let c = certify({ ...none, dayGoals: [g({ period_start: D, status: "done" })], reflections: [refl(D, "광합성 배움")] });
assert.equal(c.count, 2); assert.ok(c.done);
c = certify({ ...none, logs: [log(D, "20")], quizzes: [quiz({ solved_date: D })] });
assert.ok(!c.timer && c.quiz && !c.done, "타이머 20분은 부족");
c = certify({ ...none, logs: [log(D, "20"), log(D, "10")], quizzes: [quiz({ date: D })] });
assert.ok(c.timer && c.quiz && c.done, "합쳐서 30분 + 오늘 문제 냄");
assert.ok(!certify({ ...none, reflections: [refl(D, "")] }).reflection, "빈 회고는 안 됨");

// 별 합계 = 타이머 별 + 인증한 날마다 1개
const doneDay = (d: string) => g({ goal_id: d, period_start: d, status: "done" });
const st = starTotals({
  goals: [doneDay(D), doneDay("2026-11-10"), doneDay("2026-10-30")],
  logs: [log(D, "50"), log("2026-11-10", "10")],
  reflections: [refl("2026-11-10", "배움"), refl("2026-10-30", "배움")],
  quizzes: [], sid: "1", today: D,
});
// 오늘: 할 일+타이머50분 → 인증 ⭐1 + 타이머 ⭐2 / 11-10: 할 일+회고 → 인증 ⭐1 / 10-30: 할 일+회고 → 인증 ⭐1 (지난달)
assert.equal(st.todayStars, 3); assert.equal(st.monthStars, 4); assert.equal(st.totalStars, 5); assert.ok(st.certToday);
assert.equal(starTotals({ goals: [doneDay(D)], logs: [], reflections: [], quizzes: [], sid: "1", today: D }).totalStars, 0, "1개만 하면 별 없음");

// 스트릭: 오늘 아직이면 어제까지 이어진 것 인정
assert.deepEqual(streaks(["2026-11-13", "2026-11-14", "2026-11-15"], D), { current: 3, max: 3 });
assert.deepEqual(streaks(["2026-11-13", "2026-11-14"], D), { current: 2, max: 2 }, "오늘 아직 → 어제까지");
assert.deepEqual(streaks(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-13"], D), { current: 0, max: 4 }, "끊김");
assert.deepEqual(streaks([], D), { current: 0, max: 0 });
assert.equal(bestWeek(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-02"]), 5);
// 지난주 비교: 이번 주 월(11/9)~일(11/15) vs 11/2~11/8
assert.deepEqual(weekCompare([log("2026-11-10", "60"), log(D, "40"), log("2026-11-03", "50"), log("2026-11-01", "999")], D), { thisWeek: 100, lastWeek: 50, diff: 50 });
const stats = { checkins: 1, certDays: 1, maxStreak: 3, bestWeek: 2, totalMinutes: 99, quizCorrect: 10, totalStars: 5 };
assert.deepEqual(badgesFor(stats).filter((b) => b.earned).map((b) => b.id), ["first_seat", "first_cert", "streak3", "quiz10"]);
const setting = (key: string, value: string) => ({ key, value });
assert.deepEqual(latestSettings([setting("cheer", "a"), setting("goal_hours", "100"), setting("cheer", "b")]), { cheer: "b", goal_hours: "100" });
assert.deepEqual(starTotals({ goals: [doneDay(D)], logs: [log(D, "30")], reflections: [], quizzes: [], sid: "1", today: D }).certDays, [D]);

// 주간 리포트 (11/9 월 ~ 11/15 일)
const lg = (date: string, minutes: string, subject = "", goal_id = "") => ({ ...log(date, minutes), subject, goal_id });
const rep = weekReport({
  monday: "2026-11-09",
  logs: [lg("2026-11-09", "30", "수학"), lg("2026-11-09", "20", "", "gEng"), lg(D, "25"), lg("2026-11-08", "999", "수학")],
  goals: [g({ goal_id: "gEng", subject: "영어", period_start: "2026-11-10", status: "done" }), g({ goal_id: "x", period_start: "2026-11-12" })],
  certDays: ["2026-11-09", D, "2026-11-01"],
});
assert.deepEqual(rep.days.map((d) => d.minutes), [50, 0, 0, 0, 0, 0, 25]);
assert.deepEqual(rep.subjects, [{ subject: "수학", minutes: 30 }, { subject: "기타", minutes: 25 }, { subject: "영어", minutes: 20 }]);
assert.deepEqual(rep.goals, { done: 1, total: 2 });
assert.equal(rep.certDays, 2);
// 주간 회고 줄은 한 줄 회고를 가리지 않음
const wr = { student_id: "1", date: "2026-11-09", learned: "", mood: "", week_review: "이번 주 잘함", created_at: "" };
assert.equal(weekReviewOf([refl("2026-11-09", "a"), wr], "1", "2026-11-09"), "이번 주 잘함");
assert.equal(latestReflection([refl("2026-11-09", "a"), wr], "1", "2026-11-09")?.learned, "a");
// CSV: BOM, 따옴표/쉼표, 수식 막기
assert.equal(toCsv([["학번", "회고"], ["30105", '쉼표, "따옴표"'], ["1", "=1+1"]]), '\uFEFF학번,회고\r\n30105,"쉼표, ""따옴표"""\r\n1,\'=1+1\r\n');

console.log("✅ check 통과");
