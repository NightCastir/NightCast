import { buildPushPayload } from "@block65/webcrypto-web-push";

function trustedEndpoint(value) {
  try {
    const url = new URL(String(value));
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" ||
       host.endsWith(".push.services.mozilla.com") || host.endsWith(".notify.windows.com") ||
       host === "web.push.apple.com" || host.endsWith(".push.apple.com"));
  } catch (_) { return false; }
}

async function sendOne(DB, env, subscriptionRow, message) {
  let sub;
  try { sub = JSON.parse(subscriptionRow.subscription_json); } catch (_) { return true; }
  if (!trustedEndpoint(sub.endpoint) || !sub.keys) {
    await DB.prepare("DELETE FROM club_push_subscriptions WHERE id=?").bind(subscriptionRow.id).run();
    return true;
  }
  const vapid = { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };
  try {
    const init = await buildPushPayload({ data: JSON.stringify(message), options: { ttl: 86400 } }, sub, vapid);
    const response = await fetch(sub.endpoint, init);
    if (response.status === 404 || response.status === 410) {
      await DB.prepare("DELETE FROM club_push_subscriptions WHERE id=?").bind(subscriptionRow.id).run();
      return true;
    }
    return response.ok || response.status < 500;
  } catch (error) {
    console.error("NightCast Web Push delivery error", error);
    return false;
  }
}

export async function dispatchClubNotifications(env) {
  const DB = env.NightCastBinding;
  if (!DB || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return;
  const latest = await DB.prepare("SELECT COALESCE(MAX(id),0) AS id FROM podcasts WHERE status='published'").first();
  const latestId = Number(latest?.id || 0);
  const listeners = await DB.prepare("SELECT DISTINCT p.user_id,COALESCE(p.last_seen_podcast_id,0) AS last_seen_podcast_id FROM club_profiles p JOIN club_push_subscriptions s ON s.user_id=p.user_id WHERE p.notifications_enabled=1").all();
  for (const listener of listeners.results || []) {
    let lastSeen = Number(listener.last_seen_podcast_id || 0);
    // First-time subscribers start at the current catalog to avoid a burst of historical alerts.
    if (!lastSeen) {
      await DB.prepare("UPDATE club_profiles SET last_seen_podcast_id=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(latestId,listener.user_id).run();
      continue;
    }
    if (latestId <= lastSeen) continue;
    const fresh = await DB.prepare("SELECT id,title,slug FROM podcasts WHERE status='published' AND id>? AND id<=? ORDER BY id ASC LIMIT 30").bind(lastSeen,latestId).all();
    const subs = await DB.prepare("SELECT id,user_id,subscription_json FROM club_push_subscriptions WHERE user_id=?").bind(listener.user_id).all();
    for (const podcast of fresh.results || []) {
      const payload = {
        title: "پادکست تازه در NightCast 🎧",
        body: "اپیزود تازه «" + String(podcast.title || "پادکست تازه").slice(0,160) + "» منتشر شده؛ همین حالا گوش بده.",
        url: "/?podcast=" + encodeURIComponent(String(podcast.slug || podcast.id)),
        tag: "nightcast-podcast-" + podcast.id
      };
      let delivered = true;
      for (const row of subs.results || []) {
        if (!(await sendOne(DB,env,row,payload))) delivered = false;
      }
      if (!delivered) break;
      await DB.prepare("UPDATE club_profiles SET last_seen_podcast_id=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(Number(podcast.id),listener.user_id).run();
    }
  }

  // One late-evening reminder per account/day. The open app also renders a live local-midnight countdown.
  const hour = new Date().getUTCHours();
  if (hour < 17 || hour > 23) return;
  const day = new Date().toISOString().slice(0, 10);
  const users = await DB.prepare(`SELECT DISTINCT p.user_id FROM club_profiles p
    JOIN club_push_subscriptions s ON s.user_id=p.user_id
    WHERE p.notifications_enabled=1 AND NOT EXISTS
      (SELECT 1 FROM club_quiz_sessions q WHERE q.user_id=p.user_id AND q.day_key=? AND q.answered_at IS NOT NULL)`).bind(day).all();
  const seconds = Math.max(0, Math.floor((Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),new Date().getUTCDate()+1)-Date.now())/1000));
  const countdown = String(Math.floor(seconds/3600)).padStart(2,"0")+":"+String(Math.floor(seconds%3600/60)).padStart(2,"0");
  for (const user of users.results || []) {
    const result = await DB.prepare("INSERT OR IGNORE INTO club_notification_dispatch_log(user_id,notification_type,day_key) VALUES(?,'quiz_reminder',?)").bind(user.user_id,day).run();
    if (!Number(result?.meta?.changes || 0)) continue;
    const subs = await DB.prepare("SELECT id,user_id,subscription_json FROM club_push_subscriptions WHERE user_id=?").bind(user.user_id).all();
    const payload = { title:"فرصت سؤال روز NightCast 🎁", body:"فرصت باقی‌مانده: "+countdown+"؛ هنوز فرصت داری به سؤال روز پاسخ بدهی و جایزه بگیری.", url:"/quiz", tag:"nightcast-quiz-reminder-"+day };
    for (const row of subs.results || []) await sendOne(DB,env,row,payload);
  }
}
