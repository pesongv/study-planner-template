// 시트 탭 + 헤더 생성 (여러 번 실행해도 안전). 실행: npm run init-sheet
import { createSign } from "node:crypto";
import { TABS } from "../lib/schema.ts";

const { GOOGLE_SERVICE_ACCOUNT_EMAIL: email, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID: id } = process.env;
const key = GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

// 서비스 계정 JWT → 액세스 토큰
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
  iss: email, scope: "https://www.googleapis.com/auth/spreadsheets",
  aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
})}`;
const jwt = `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(key, "base64url")}`;
const tok = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
}).then((r) => r.json());
if (!tok.access_token) throw new Error("토큰 발급 실패: " + JSON.stringify(tok));

const api = async (path, init = {}) => {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...init, headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message}`);
  return j;
};

const meta = await api("?fields=sheets.properties");
const existing = meta.sheets.map((s) => s.properties);
const requests = Object.keys(TABS)
  .filter((t) => !existing.some((p) => p.title === t))
  .map((title) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }));
// 기본 '시트1' 은 탭이 새로 생긴 뒤 삭제
const stray = existing.filter((p) => p.title === "시트1" || p.title === "Sheet1");
if (requests.length) await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
if (stray.length) await api(":batchUpdate", {
  method: "POST",
  body: JSON.stringify({ requests: stray.map((p) => ({ deleteSheet: { sheetId: p.sheetId } })) }),
});

await api("/values:batchUpdate", {
  method: "POST",
  body: JSON.stringify({
    valueInputOption: "RAW",
    data: Object.entries(TABS).map(([t, h]) => ({ range: `'${t}'!A1`, values: [h] })),
  }),
});
console.log("✅ 연결 성공, 탭 준비 완료:", Object.keys(TABS).join(", "));
