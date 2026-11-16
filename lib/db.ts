// 데이터 저장소(수파베이스 Postgres) 접근은 반드시 이 파일을 통해서만 (서버 전용).
// 수파베이스 REST(PostgREST)를 fetch로 바로 부름 — 추가 라이브러리 없음. 표는 supabase/schema.sql
import "server-only";
import { TABS, type Tab, type Row } from "./schema";

const TABLE: Record<Tab, string> = {
  학생: "students", 목표: "goals", 교재: "books", 출석: "attendance", 공부기록: "study_logs",
  회고: "reflections", 퀴즈: "quizzes", 포인트뱃지: "points", 설정: "settings",
};
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? "";
const headers: Record<string, string> = {
  apikey: key,
  "Content-Type": "application/json",
  // 예전 service_role(JWT) 키는 Authorization에도 넣어야 함. 새 sb_secret_ 키는 apikey만
  ...(key.startsWith("eyJ") && { Authorization: `Bearer ${key}` }),
};

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers }, cache: "no-store" });
  if (!res.ok) throw new Error(`DB ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

// 짧은 캐시 + 동시 읽기 합치기 (데이터베이스라 한도 걱정은 없지만 무료 전송량을 아끼려고).
// 쓰면 그 서버의 캐시는 바로 지움. globalThis에 두면 개발 서버에서는 라우트끼리 공유됨
type Rows = Record<string, string>[];
const g = globalThis as { __dbCache?: Map<Tab, { at: number; rows: Rows }>; __dbInflight?: Map<Tab, Promise<Rows>>; __dbWritten?: Map<Tab, number> };
const cache = (g.__dbCache ??= new Map());
const inflight = (g.__dbInflight ??= new Map());
const writtenAt = (g.__dbWritten ??= new Map());
export const CACHE_MS = 5_000;
/** 자주 불리는 공용 화면(독서실 현황, TOP 5, 학급 배너)용 */
export const SHARED_CACHE_MS = 15_000;

/** 표 전체를 id 순서로 (한 번에 1000줄씩 이어서). 각 줄에 _id(표의 id)가 붙음 → updateRow에서 사용, 저장할 땐 빠짐 */
async function fetchTable(tab: Tab): Promise<Rows> {
  const cols = ["id", ...TABS[tab]].map((c) => `"${c}"`).join(",");
  const out: Rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await rest(`${TABLE[tab]}?select=${encodeURIComponent(cols)}&order=id`, { headers: { Range: `${from}-${from + 999}` } });
    const page = (await res.json()) as Record<string, string | number>[];
    for (const { id, ...r } of page) out.push({ ...(r as Record<string, string>), _id: String(id) });
    if (page.length < 1000) return out;
  }
}

function markWritten(tab: Tab) {
  writtenAt.set(tab, Date.now());
  cache.delete(tab);
}

/** 여러 표를 읽는다. maxAgeMs 안에 읽어 둔 표는 다시 안 읽음 */
export async function readTabs<T extends Tab>(tabs: T[], maxAgeMs = CACHE_MS): Promise<{ [K in T]: Row<K>[] }> {
  const startedAt = Date.now();
  for (const t of tabs) {
    if (inflight.has(t) || (cache.has(t) && startedAt - cache.get(t)!.at < maxAgeMs)) continue;
    const p = fetchTable(t)
      .then((rows) => {
        if ((writtenAt.get(t) ?? 0) <= startedAt) cache.set(t, { at: startedAt, rows }); // 읽는 동안 쓰였으면 캐시에 안 넣음
        return rows;
      })
      .finally(() => inflight.delete(t));
    inflight.set(t, p);
  }
  const rows = await Promise.all(tabs.map((t) => inflight.get(t) ?? cache.get(t)!.rows));
  return Object.fromEntries(tabs.map((t, i) => [t, rows[i]])) as unknown as { [K in T]: Row<K>[] };
}

export async function readTab<T extends Tab>(tab: T, maxAgeMs = CACHE_MS): Promise<Row<T>[]> {
  return (await readTabs([tab], maxAgeMs))[tab];
}

const pick = (tab: Tab, r: Record<string, unknown>) =>
  Object.fromEntries(TABS[tab].map((h) => [h, String(r[h] ?? "")]));

/** 새 줄 추가 */
export async function append<T extends Tab>(tab: T, rows: Partial<Row<T>>[]) {
  if (!rows.length) return;
  await rest(TABLE[tab], { method: "POST", body: JSON.stringify(rows.map((r) => pick(tab, r))), headers: { Prefer: "return=minimal" } });
  markWritten(tab);
}

/** 기존 줄 고치기. row에 붙은 _id로 찾음 (없으면 readTab 결과의 index 위치) */
export async function updateRow<T extends Tab>(tab: T, index: number, row: Row<T>) {
  const id = (row as { _id?: string })._id ?? ((await readTab(tab, 0))[index] as { _id?: string })?._id;
  if (id === undefined) throw new Error(`DB: ${tab} 줄을 찾을 수 없음`);
  await rest(`${TABLE[tab]}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(pick(tab, row)), headers: { Prefer: "return=minimal" } });
  markWritten(tab);
}

/** 처음 설치 확인: 표가 없으면 안내 문구로 오류 (표는 supabase/schema.sql 을 SQL Editor에서 실행해 만듦) */
export async function ensureTabs() {
  try {
    await rest(`${TABLE.학생}?select=id&limit=1`);
  } catch (e) {
    throw new Error(`수파베이스에 표가 없어요. 설치 안내서의 SQL을 먼저 실행해 주세요. (${(e as Error).message})`);
  }
}
