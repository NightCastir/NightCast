import { handleClubApi } from "../workers/club-api.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const DB = env.NightCastBinding;
    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    };
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const checkAuth = async () => {
      const auth = request.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) return null;
      const token = auth.slice(7);
      const admin = await DB.prepare(`
        SELECT admins.id,admins.username,admins.full_name,'admin' AS role
        FROM admin_sessions INNER JOIN admins ON admins.id=admin_sessions.admin_id
        WHERE admin_sessions.session_token=? AND admin_sessions.expires_at>CURRENT_TIMESTAMP LIMIT 1
      `).bind(token).first();
      if (admin) return admin;
      return await DB.prepare(`
        SELECT users.id,users.username,users.full_name,users.role
        FROM user_sessions INNER JOIN users ON users.id=user_sessions.user_id
        WHERE user_sessions.session_token=? AND user_sessions.expires_at>CURRENT_TIMESTAMP LIMIT 1
      `).bind(token).first();
    };

    const response = await handleClubApi({ request, url, env, DB, json, checkAuth });
    return response || json({ success: false, message: "Not found" }, 404);
  }
};
