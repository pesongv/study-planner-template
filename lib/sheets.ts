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
});
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// 캐시는 여러 학생이 자주 부르는 화면(독서실 현황, TOP 5, 학급 배너)만 maxAgeMs로 씀.
// 기본은 바로 읽기 — 라우트·서버(Vercel 함수)마다 캐시가 따로라서 "방금 저장한 게 안 보이는" 일을 막기 위해.
// globalThis에 두면 개발 서버에서는 라우트끼리 공유됨
const cache: Map<Tab, { at: number; rows: Record<string, string>[] }> =
  ((globalThis as { __sheetCache?: Map<Tab, { at: number; rows: Record<string, string>[] }> }).__sheetCache ??= new Map());

function toRows<T extends Tab>(tab: T, values: string[][] = []): Row<T>[] {
  const headers = TABS[tab];
  return values.slice(1).map((v) => Object.fromEntries(headers.map((h, i) => [h, v[i] ?? ""])) as Row<T>);
}

/** 여러 탭을 한 번의 batchGet으로 읽는다. maxAgeMs 안에 읽어 둔 탭은 다시 안 읽음 (기본 0 = 항상 새로) */
export async function readTabs<T extends Tab>(tabs: T[], maxAgeMs = 0): Promise<{ [K in T]: Row<K>[] }> {
  const stale = tabs.filter((t) => Date.now() - (cache.get(t)?.at ?? 0) >= maxAgeMs || !cache.has(t));
  if (stale.length) {
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: stale.map((t) => `'${t}'`),
    });
    stale.forEach((t, i) => cache.set(t, { at: Date.now(), rows: toRows(t, res.data.valueRanges?.[i]?.values as string[][]) }));
  }
  return Object.fromEntries(tabs.map((t) => [t, cache.get(t)!.rows])) as unknown as { [K in T]: Row<K>[] };
}

export async function readTab<T extends Tab>(tab: T, maxAgeMs = 0): Promise<Row<T>[]> {
  return (await readTabs([tab], maxAgeMs))[tab];
}

/** 자주 불리는 공용 화면용 캐시 시간 */
export const SHARED_CACHE_MS = 15_000;

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
  cache.delete(tab);
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
  cache.delete(tab);
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
  cache.clear();
}
