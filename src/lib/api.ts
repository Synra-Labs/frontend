import { withSessionHeaders } from "@/context/session";


const API = process.env.NEXT_PUBLIC_API_URL!; // e.g. https://nspire-api.up.railway.app


export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
const headers = withSessionHeaders(init.headers);
// Only set JSON if we aren't sending a FormData body
if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
headers.set("Content-Type", "application/json");
}
const res = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
if (!res.ok) {
const text = await res.text().catch(() => "");
throw new Error(text || res.statusText);
}
return res.json() as Promise<T>;
}
