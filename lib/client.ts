// 브라우저에서 /api 호출용. body가 있으면 POST (method로 바꿀 수 있음)
export async function api<T = Record<string, unknown>>(url: string, body?: unknown, method = "POST"): Promise<T & { error?: string }> {
  const res = await fetch(url, body === undefined ? undefined : {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.error) data.error = "잠시 문제가 생겼어요. 다시 해 볼까요?";
  return data;
}

export async function logout() {
  await api("/api/auth/logout", {});
  location.assign("/login");
}
