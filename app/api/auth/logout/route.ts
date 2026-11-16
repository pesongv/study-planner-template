import { cookies } from "next/headers";
import { COOKIE, RETURN_COOKIE } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(RETURN_COOKIE);
  return Response.json({ ok: true });
}
