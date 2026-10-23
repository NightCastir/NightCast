import { handleClubApi } from "./club-api.js";
import { dispatchClubNotifications } from "./club-notification-dispatch.js";

/**
 * Dedicated production entry point for NightCast Club.
 * Uses the existing D1 user/admin session tables; never issues or stores auth tokens.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Cache-Control": "no-store"
    };
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!url.pathname.startsWith("/api/v1/club")) {
      return json({ success: false, message: "Route not found" }, 404);
    }

    const DB = env.NightCastBinding;
    async function checkAuth() {
      const authorization = request.headers.get("Authorization") || "";
      if (!authorization.startsWith("Bearer ")) return null;
      const token = authorization.slice(7).trim();
      if (!token || token.length > 512) return null;

      const configuredAdminEmail = String(env.ADMIN_EMAIL || env.ADMIN || "").trim().toLowerCase();

      const admin = await DB.prepare(`
        SELECT admins.id, admins.username, admins.full_name, COALESCE(NULLIF(TRIM(admins.email),''), admins.username) AS email
        FROM admin_sessions
        INNER JOIN admins ON admins.id = admin_sessions.admin_id
        WHERE admin_sessions.session_token = ?
          AND julianday(admin_sessions.expires_at) > julianday('now')
        LIMIT 1
      `).bind(token).first();
      if (admin) {
        const isAllowlisted = Boolean(configuredAdminEmail) &&
          String(admin.email || "").trim().toLowerCase() === configuredAdminEmail;
        return isAllowlisted ? { ...admin, role: "admin" } : null;
      }

      const user = await DB.prepare(`
        SELECT users.id, users.username, users.full_name, COALESCE(NULLIF(TRIM(users.email),''), users.username) AS email
        FROM user_sessions
        INNER JOIN users ON users.id = user_sessions.user_id
        WHERE user_sessions.session_token = ?
          AND julianday(user_sessions.expires_at) > julianday('now')
        LIMIT 1
      `).bind(token).first();
      if (!user) return null;

      const isAllowlisted = Boolean(configuredAdminEmail) &&
        String(user.email || "").trim().toLowerCase() === configuredAdminEmail;
      // Never trust a persisted/client-provided role for the allowlisted admin decision.
      return { ...user, role: isAllowlisted ? "admin" : "user" };
    }


    // Strictly admin-only podcast CRUD. The browser UI is not a security boundary;
    // every read/write is authorized here against the server-verified session + email allowlist.
    if (url.pathname === "/api/v1/club/admin/podcasts" || /^\/api\/v1\/club\/admin\/podcasts\/\d+$/.test(url.pathname)) {
      const actor = await checkAuth();
      const configuredAdminEmail = String(env.ADMIN_EMAIL || env.ADMIN || "").trim().toLowerCase();
      if (!actor || String(actor.role || "").toLowerCase() !== "admin" ||
          !configuredAdminEmail || String(actor.email || "").trim().toLowerCase() !== configuredAdminEmail) {
        return json({ success: false, message: "این عملیات فقط برای مدیر مجاز است.", code: "admin_required" }, actor ? 403 : 401);
      }
      if (!DB) return json({ success: false, message: "پایگاه داده در دسترس نیست.", code: "database_unavailable" }, 503);
      const fields = ["title","slug","book_name","author_name","category_name","tags","episode_number","summary","transcript","duration_seconds","listen_count","audio_url","cover_url","status","publish_date","description"];
      const nullableText = ["book_name","author_name","category_name","tags","summary","transcript","audio_url","cover_url","publish_date","description"];
      const readBody = async () => {
        try { return await request.json(); } catch (_) { return null; }
      };
      const cleanText = (value, max) => {
        if (value === undefined || value === null) return null;
        const s = String(value).trim();
        if (s.length > max) throw new Error("یکی از فیلدهای متنی بیش از حد طولانی است.");
        return s || null;
      };
      const normalizePodcast = (body, partial) => {
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("بدنه درخواست معتبر نیست.");
        const out = {};
        for (const key of fields) {
          if (partial && !Object.prototype.hasOwnProperty.call(body, key)) continue;
          if (["episode_number","duration_seconds","listen_count"].includes(key)) {
            const raw = body[key];
            const n = raw === "" || raw === null || raw === undefined ? 0 : Number(raw);
            if (!Number.isSafeInteger(n) || n < 0 || n > (key === "episode_number" ? 100000 : 10000000)) throw new Error("مقدار شماره قسمت یا مدت معتبر نیست.");
            out[key] = n;
          } else if (key === "status") {
            const status = String(body[key] || (partial ? "" : "draft")).trim().toLowerCase();
            if (!status && partial) continue;
            if (!["active","draft","archived"].includes(status)) throw new Error("وضعیت پادکست معتبر نیست.");
            out[key] = status;
          } else {
            const max = key === "transcript" ? 50000 : key === "description" ? 10000 : key === "summary" ? 5000 : ["audio_url","cover_url"].includes(key) ? 2000 : key === "tags" ? 1000 : 300;
            const value = cleanText(body[key], max);
            if (["title","slug"].includes(key) && !value) throw new Error("عنوان و slug الزامی هستند.");
            if (key === "slug" && value && !/^[A-Za-z0-9._-]+$/.test(value)) throw new Error("slug فقط باید شامل حروف لاتین، عدد، نقطه، خط تیره یا زیرخط باشد.");
            if (["audio_url","cover_url"].includes(key) && value) {
              let parsed;
              try { parsed = new URL(value); } catch (_) { throw new Error("نشانی صوت یا کاور باید URL معتبر باشد."); }
              if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("پروتکل URL معتبر نیست.");
            }
            if (value !== null || !partial || nullableText.includes(key)) out[key] = value;
          }
        }
        if (!partial && (!out.title || !out.slug || !out.audio_url)) throw new Error("عنوان، slug و نشانی فایل صوتی الزامی هستند.");
        return out;
      };
      try {
        const idMatch = url.pathname.match(/\/podcasts\/(\d+)$/);
        const id = idMatch ? Number(idMatch[1]) : null;
        if (request.method === "GET" && !id) {
          const result = await DB.prepare("SELECT id,title,slug,book_name,author_name,category_name,tags,episode_number,summary,transcript,duration_seconds,listen_count,audio_url,cover_url,status,publish_date,listen_count,created_at,updated_at,description FROM podcasts ORDER BY id DESC LIMIT 1000").all();
          return json({ success: true, podcasts: result.results || [] });
        }
        if (request.method === "POST" && !id) {
          const body = await readBody();
          const data = normalizePodcast(body, false);
          const cols = Object.keys(data);
          const placeholders = cols.map(() => "?").join(",");
          const result = await DB.prepare("INSERT INTO podcasts (" + cols.join(",") + ",updated_at) VALUES (" + placeholders + ",CURRENT_TIMESTAMP)")
            .bind(...cols.map(k => data[k])).run();
          return json({ success: true, id: result.meta.last_row_id, message: "پادکست ثبت شد." }, 201);
        }
        if (request.method === "PUT" && id) {
          if (!Number.isSafeInteger(id) || id < 1) return json({ success: false, message: "شناسه پادکست معتبر نیست." }, 400);
          const body = await readBody();
          const data = normalizePodcast(body, true);
          const cols = Object.keys(data);
          if (!cols.length) return json({ success: false, message: "هیچ فیلدی برای ویرایش ارسال نشده است." }, 400);
          const result = await DB.prepare("UPDATE podcasts SET " + cols.map(k => k + " = ?").join(",") + ", updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(...cols.map(k => data[k]), id).run();
          if (!result.meta.changes) return json({ success: false, message: "پادکست پیدا نشد.", code: "podcast_not_found" }, 404);
          return json({ success: true, id, message: "تغییرات پادکست ذخیره شد." });
        }
        return json({ success: false, message: "روش یا مسیر درخواست مجاز نیست." }, 405);
      } catch (error) {
        const message = String(error && error.message || "");
        const status = /UNIQUE constraint failed: podcasts\.slug/i.test(message) ? 409 : 400;
        return json({ success: false, message: status === 409 ? "این slug قبلاً ثبت شده است." : (message || "اطلاعات پادکست معتبر نیست.") }, status);
      }
    }

    if (url.pathname === "/api/v1/club/admin/status" && request.method === "GET") {
      try {
        const configuredAdminEmail = String(env.ADMIN_EMAIL || env.ADMIN || "").trim().toLowerCase();
        if (!configuredAdminEmail) {
          return json({ success: true, isAdmin: false, code: "admin_allowlist_not_configured" }, 503);
        }
        const actor = await checkAuth();
        const isAdmin = Boolean(
          actor &&
          String(actor.role || "").toLowerCase() === "admin" &&
          String(actor.email || "").trim().toLowerCase() === configuredAdminEmail
        );
        return json({ success: true, isAdmin }, isAdmin ? 200 : (actor ? 403 : 401));
      } catch (error) {
        console.error("NightCast admin authorization check failed", error);
        return json({ success: false, isAdmin: false, code: "admin_authorization_unavailable" }, 500);
      }
    }

    try {
      const response = await handleClubApi({ request, url, env, DB, json, checkAuth });
      return response || json({ success: false, message: "Route not found" }, 404);
    } catch (error) {
      console.error("NightCast Club API error", error);
      return json({ success: false, message: "Club API temporarily unavailable", code: "club_internal_error" }, 500);
    }
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(dispatchClubNotifications(env));
  }
};
