// 날짜/시간은 모두 한국 시간(Asia/Seoul) 문자열로 저장: "YYYY-MM-DD HH:mm:ss"
export const now = (d = new Date()) => d.toLocaleString("sv-SE", { timeZone: "Asia/Seoul" });
export const today = (d = new Date()) => now(d).slice(0, 10);
export const parseKst = (s: string) => new Date(s.replace(" ", "T") + "+09:00");
