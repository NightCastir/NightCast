const API_BASE = "https://nightcast-api.internal";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
  "cache-control": "no-store"
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }
function hex(bytes) { return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join(""); }
function randomHex(size = 16) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return hex(bytes); }
function normalizeAnswer(value) {
  return String(value ?? "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).trim();
}
async function digest(value) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))); }
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
function protectedAction(path, method) {
  if (method !== "POST") return null;
  if (path.endsWith("/comments")) return "comment";
  if (path.endsWith("/book-summary-requests")) return "suggestion";
  return null;
}
export class CaptchaStore {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "POST") return json({ success: false, message: "Method not allowed" }, 405);
    const body = await request.json().catch(() => ({}));
    if (url.pathname === "/rate") {
      const now = Date.now();
      const result = await this.state.storage.transaction(async tx => {
        const old = await tx.get("rate");
        const current = old && old.expiresAt > now ? old : { count: 0, expiresAt: now + 10 * 60 * 1000 };
        if (current.count >= 10) return { ok: false, retryAfter: Math.ceil((current.expiresAt - now) / 1000) };
        current.count += 1; await tx.put("rate", current); return { ok: true };
      });
      return json(result, result.ok ? 200 : 429);
    }
    if (url.pathname === "/create") { await this.state.storage.put("challenge", body.challenge); return json({ success: true }); }
    if (url.pathname === "/consume") {
      const now = Date.now();
      const result = await this.state.storage.transaction(async tx => {
        const record = await tx.get("challenge");
        if (!record || record.expiresAt <= now || record.action !== body.action) {
          if (record && record.expiresAt <= now) await tx.delete("challenge");
          return { ok: false, reason: "expired" };
        }
        if (record.answerHash !== body.answerHash) {
          record.attempts = (record.attempts || 0) + 1;
          if (record.attempts >= 3) await tx.delete("challenge"); else await tx.put("challenge", record);
          return { ok: false, reason: record.attempts >= 3 ? "locked" : "wrong" };
        }
        await tx.delete("challenge"); return { ok: true };
      });
      return json(result, result.ok ? 200 : 403);
    }
    return json({ success: false, message: "Not found" }, 404);
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
    if (url.pathname === "/api/v1/captcha/challenge" && request.method === "POST") {
      if (!env.CAPTCHA_STORE || !env.NIGHTCAST_CAPTCHA_SECRET || !env.NIGHTCAST_CAPTCHA_PEPPER) return json({ success: false, message: "سامانه تأیید امنیتی موقتاً آماده نیست." }, 503);
      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "");
      if (!["comment", "suggestion"].includes(action)) return json({ success: false, message: "نوع درخواست معتبر نیست." }, 400);
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const ipHash = await hmac(ip, env.NIGHTCAST_CAPTCHA_SECRET);
      const rateId = env.CAPTCHA_STORE.idFromName("rate:" + ipHash);
      const rateResponse = await env.CAPTCHA_STORE.get(rateId).fetch("https://captcha-store/rate", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (!rateResponse.ok) return json({ success: false, message: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." }, 429);
      const a = 1 + crypto.getRandomValues(new Uint8Array(1))[0] % 9;
      const b = 1 + crypto.getRandomValues(new Uint8Array(1))[0] % 9;
      const id = randomHex(16), expiresAt = Date.now() + 5 * 60 * 1000;
      const answerHash = await digest(id + ":" + String(a + b) + ":" + env.NIGHTCAST_CAPTCHA_PEPPER);
      const challengeId = env.CAPTCHA_STORE.idFromName("challenge:" + id);
      const created = await env.CAPTCHA_STORE.get(challengeId).fetch("https://captcha-store/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge: { action, answerHash, expiresAt, attempts: 0 } }) });
      if (!created.ok) return json({ success: false, message: "ساخت پرسش امنیتی انجام نشد." }, 503);
      return json({ success: true, id, action, question: a + " + " + b + " = ؟", expiresIn: 300 });
    }
    const action = protectedAction(url.pathname, request.method);
    let upstreamRequest;
    if (action) {
      if (!env.CAPTCHA_STORE || !env.NIGHTCAST_CAPTCHA_PEPPER) return json({ success: false, message: "تأیید امنیتی موقتاً در دسترس نیست." }, 503);
      const body = await request.clone().json().catch(() => null), proof = body && body.captcha;
      if (!proof || typeof proof.id !== "string" || !/^[a-f0-9]{32}$/.test(proof.id) || normalizeAnswer(proof.answer) === "") return json({ success: false, code: "CAPTCHA_REQUIRED", message: "لطفاً پرسش امنیتی NightCast را پاسخ دهید." }, 403);
      const answerHash = await digest(proof.id + ":" + normalizeAnswer(proof.answer) + ":" + env.NIGHTCAST_CAPTCHA_PEPPER);
      const challengeId = env.CAPTCHA_STORE.idFromName("challenge:" + proof.id);
      const verify = await env.CAPTCHA_STORE.get(challengeId).fetch("https://captcha-store/consume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, answerHash }) });
      const verdict = await verify.json().catch(() => ({}));
      if (!verify.ok || !verdict.ok) return json({ success: false, code: "CAPTCHA_INVALID", message: verdict.reason === "wrong" ? "پاسخ درست نیست؛ پرسش تازه‌ای دریافت کنید." : "پرسش امنیتی منقضی یا استفاده شده است؛ پرسش تازه‌ای دریافت کنید." }, 403);
      delete body.captcha;
      const headers = new Headers(request.headers); headers.delete("content-length");
      upstreamRequest = new Request(new URL(url.pathname + url.search, API_BASE), { method: request.method, headers, body: JSON.stringify(body), redirect: "manual" });
    } else {
      upstreamRequest = new Request(new URL(url.pathname + url.search, API_BASE), request);
    }
    try {
      const response = await env.NIGHTCAST_API.fetch(upstreamRequest);
      const headers = new Headers(response.headers);
      headers.set("access-control-allow-origin", request.headers.get("origin") || "*");
      headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
      headers.set("access-control-allow-headers", "Content-Type, Authorization");
      headers.set("cache-control", "no-store");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (_) { return json({ success: false, message: "ارتباط با سرویس NightCast برقرار نشد؛ دوباره تلاش کنید." }, 502); }
  }
};