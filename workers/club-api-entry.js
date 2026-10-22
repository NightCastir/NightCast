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

      const admin = await DB.prepare(`
        SELECT admins.id, admins.username, admins.full_name, 'admin' AS role
        FROM admin_sessions
        INNER JOIN admins ON admins.id = admin_sessions.admin_id
        WHERE admin_sessions.session_token = ?
          AND julianday(admin_sessions.expires_at) > julianday('now')
        LIMIT 1
      `).bind(token).first();
      if (admin) return admin;

      return await DB.prepare(`
        SELECT users.id, users.username, users.full_name, users.role
        FROM user_sessions
        INNER JOIN users ON users.id = user_sessions.user_id
        WHERE user_sessions.session_token = ?
          AND julianday(user_sessions.expires_at) > julianday('now')
        LIMIT 1
      `).bind(token).first() || null;
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
