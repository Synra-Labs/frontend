// A per-browser UUID we send with every request so the backend knows the user session.
export const sessionId = (() => {
if (typeof window === "undefined") return "server";
const k = "nspire_session_id";
let v = localStorage.getItem(k);
if (!v) { v = crypto.randomUUID(); localStorage.setItem(k, v); }
return v;
})();


export function withSessionHeaders(h?: HeadersInit) {
const headers = new Headers(h);
headers.set("X-Session-Id", sessionId);
return headers;
}
