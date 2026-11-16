// 구글 시트 접근은 반드시 이 파일을 통해서만 (서버 전용)
import "server-only";
import { google } from "googleapis";
import { TABS, type Tab, type Row } from "./schema";

const sheets = google.sheets({
  version: "v4",
  auth: new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  }),
  // 구글 한도(로봇 계정당 1분에 읽기 60번)에 걸리면(429) 1·2·4·8초 기다렸다 다시 — 오류 대신 조금 늦게
  retry: true,
  retryConfig: { retry: 4, retryDelay: 1000, statusCodesToRetry: [[429, 429], [503, 503]], httpMethodsToRetry: ["GET", "POST", "PUT"] },
});
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// 읽기 줄이기: ① 10초 안에 읽은 탭은 다시 안 읽음 ② 같은 탭을 동시에 읽으면 한 번만 읽고 나눠 씀.
// 쓰면 그 서버의 캐시는 바로 지움 (다른 서버(Vercel 함수)에는 최대 10초 늦게 보일 수 있음).
// globalThis에 두면 개발 서버에서는 라우트끼리 공유됨
type Rows = Record<string, string>[];
const g = globalThis as { __sheetCache?: Map<Tab, { at: number; rows: Rows }>; __sheetInflight?: Map<Tab, Promise<Rows>>; __sheetWritten?: Map<Tab, number> };
const cache = (g.__sheetCache ??= new Map());
const inflight = (g.__sheetInflight ??= new Map());
const writtenAt = (g.__sheetWritten ??= new Map());
export const CACHE_MS = 10_000;
/** 자주 불리는 공용 화면(독서실 현황, TOP 5, 학급 배너)용 */
export const SHARED_CACHE_MS = 15_000;

function toRows<T extends Tab>(tab: T, values: string[][] = []): Row<T>[] {
  const headers = TABS[tab];
  return values.slice(1).map((v) => Object.fromEntries(headers.map((h, i) => [h, v[i] ?? ""])) as Row<T>);
}

function markWritten(tab: Tab) {
  writtenAt.set(tab, Date.now());
  cache.delete(tab);
}

/** 여러 탭을 한 번의 batchGet으로 읽는다. maxAgeMs 안에 읽어 둔 탭은 다시 안 읽음 */
export async function readTabs<T extends Tab>(tabs: T[], maxAgeMs = CACHE_MS): Promise<{ [K in T]: Row<K>[] }> {
  const startedAt = Date.now();
  const need = tabs.filter((t) => !inflight.has(t) && !(cache.has(t) && startedAt - cache.get(t)!.at < maxAgeMs));
  if (need.length) {
    const req = sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges: need.map((t) => `'${t}'`) });
    need.forEach((t, i) => {
      const p = req
        .then((res) => {
          const rows = toRows(t, res.data.valueRanges?.[i]?.values as string[][]);
          if ((writtenAt.get(t) ?? 0) <= startedAt) cache.set(t, { at: startedAt, rows }); // 읽는 동안 쓰였으면 캐시에 안 넣음
          return rows;
        })
        .finally(() => inflight.delete(t));
      inflight.set(t, p);
    });
  }
  const rows = await Promise.all(tabs.map((t) => inflight.get(t) ?? cache.get(t)!.rows));
  return Object.fromEntries(tabs.map((t, i) => [t, rows[i]])) as unknown as { [K in T]: Row<K>[] };
}

export async function readTab<T extends Tab>(tab: T, maxAgeMs = CACHE_MS): Promise<Row<T>[]> {
  return (await readTabs([tab], maxAgeMs))[tab];
}

/** 새 줄 추가 (덮어쓰기 대신 append가 기본). */
export async function append<T extends Tab>(tab: T, rows: Partial<Row<T>>[]) {
  const headers = TABS[tab] as readonly string[];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tab}'`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows.map((r) => headers.map((h) => (r as Record<string, string>)[h] ?? "")) },
  });
  markWritten(tab);
}

/** 기존 줄 덮어쓰기. index는 readTab 결과 배열의 위치 (줄 삭제는 하지 않으므로 위치가 안정적). */
export async function updateRow<T extends Tab>(tab: T, index: number, row: Row<T>) {
  const headers = TABS[tab] as readonly string[];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tab}'!A${index + 2}`,
    valueInputOption: "RAW",
    requestBody: { values: [headers.map((h) => (row as Record<string, string>)[h] ?? "")] },
  });
  markWritten(tab);
}

/**
 * 처음 설치할 때: 빠진 탭을 만들고 1행에 헤더를 씀. 기본 빈 탭(시트1/Sheet1)은 지움. 여러 번 불러도 안전.
 * (명령어 없이 설치할 수 있게 — 첫 선생님 로그인 때 실행)
 */
export async function ensureTabs() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
  const existing = meta.data.sheets?.map((s) => s.properties!) ?? [];
  const missing = (Object.keys(TABS) as Tab[]).filter((t) => !existing.some((p) => p.title === t));
  if (!missing.length) return;
  const stray = existing.filter((p) => p.title === "시트1" || p.title === "Sheet1");
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        ...missing.map((title) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })),
        ...stray.map((p) => ({ deleteSheet: { sheetId: p.sheetId } })),
      ],
    },
  });
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data: missing.map((t) => ({ range: `'${t}'!A1`, values: [[...TABS[t]]] })) },
  });
  missing.forEach(markWritten);
}
