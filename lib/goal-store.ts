// 목표 탭 읽기/쓰기 (서버 전용). 쓰기는 항상 append — 같은 goal_id의 마지막 줄이 현재 상태
import "server-only";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { append, readTab } from "./sheets";
import { latestGoals, type Goal } from "./goals";
import { now } from "./time";

export async function myGoals(sid: string) {
  return latestGoals((await readTab("목표")).filter((g) => g.student_id === sid));
}

/** 새 목표들 저장 (goal_id 자동). */
export async function createGoals(sid: string, goals: Partial<Goal>[]) {
  const rows = goals.map((g) => ({
    target_amount: "", unit: "", done_amount: "", parent_id: "", subject: "", status: "todo", ranges_json: "",
    ...g, goal_id: randomUUID().slice(0, 8), student_id: sid, updated_at: now(),
  }));
  await append("목표", rows);
  return rows;
}

/** 기존 목표 변경 = 바뀐 전체 줄을 새로 append. */
export async function saveGoal(goal: Goal) {
  const row = { ...goal, updated_at: now() };
  await append("목표", [row]);
  return row;
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const amount = z.union([z.number(), z.string()]).transform(String).pipe(z.string().regex(/^\d{0,6}$/, "숫자만 넣어 주세요."));
const editable = {
  period_start: date,
  period_end: date,
  title: z.string().trim().min(1, "제목을 써 주세요.").max(60),
  subject: z.string().trim().max(20),
  target_amount: amount,
  unit: z.string().trim().max(10),
  done_amount: amount,
  status: z.enum(["todo", "doing", "done", "deleted"]),
};

export const RangeItemSchema = z.object({
  name: z.string().trim().max(10),
  start: z.number().int().min(0).max(9999),
  end: z.number().int().min(0).max(9999),
  unit: z.string().trim().min(1).max(5),
}).refine((r) => r.end >= r.start, "끝이 시작보다 작은 범위가 있어요.");
const RangesJson = z.string().max(2000).refine((s) => {
  if (!s) return true;
  try {
    return z.array(RangeItemSchema).max(10).safeParse(JSON.parse(s)).success;
  } catch {
    return false;
  }
}, "범위를 확인해 주세요.");

/** 새 목표 (빠진 칸은 기본값) */
export const GoalFields = z.object({
  ...editable,
  level: z.enum(["month", "week", "day", "dday"]),
  parent_id: z.string().max(20).default(""),
  subject: editable.subject.default(""),
  target_amount: editable.target_amount.default(""),
  unit: editable.unit.default(""),
  done_amount: editable.done_amount.default(""),
  status: editable.status.default("todo"),
  ranges_json: RangesJson.default(""),
});

/** 수정: 보낸 칸만 (기본값 없음 — 안 보낸 칸은 그대로 둠) */
export const GoalPatch = z.object(editable).partial();
