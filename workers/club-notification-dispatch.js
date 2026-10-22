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

function localClock(date, timezone) {
  let zone = timezone || "Asia/Tehran";
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  } catch (_) {
    parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  }
  const value = (type) => (parts.find((part) => part.type === type) || {}).value || "00";
  return { day: value("year") + "-" + value("month") + "-" + value("day"), hour: Number(value("hour")), minute: Number(value("minute")), second: Number(value("second")) };
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

  // Refresh the same tagged notification once per hour in the listener's local evening.
  // Reusing a tag replaces the previous tray item instead of creating notification spam.
  const users = await DB.prepare("SELECT DISTINCT p.user_id,p.timezone FROM club_profiles p JOIN club_push_subscriptions s ON s.user_id=p.user_id WHERE p.notifications_enabled=1 AND NOT EXISTS (SELECT 1 FROM club_quiz_sessions q WHERE q.user_id=p.user_id AND q.answered_at IS NOT NULL AND q.shown_at >= datetime('now','-24 hours'))").all();
  for (const user of users.results || []) {
    const clock = localClock(new Date(), user.timezone);
    if (clock.hour < 21 || clock.hour > 23) continue;
    const seconds = Math.max(0, 86400 - (clock.hour * 3600 + clock.minute * 60 + clock.second));
    const countdown = String(Math.floor(seconds / 3600)).padStart(2, "0") + ":" + String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const reminderType = "quiz_reminder_" + clock.hour;
    const result = await DB.prepare("INSERT OR IGNORE INTO club_notification_dispatch_log(user_id,notification_type,day_key) VALUES(?,?,?)").bind(user.user_id, reminderType, clock.day).run();
    if (!Number(result?.meta?.changes || 0)) continue;
    const subs = await DB.prepare("SELECT id,user_id,subscription_json FROM club_push_subscriptions WHERE user_id=?").bind(user.user_id).all();
    const payload = { title: "فرصت سؤال روز NightCast 🎁", body: "فرصت باقی‌مانده: " + countdown + "؛ هنوز فرصت داری به سؤال روز پاسخ بدهی و جایزه بگیری.", url: "/quiz", tag: "nightcast-quiz-reminder-" + clock.day, renotify: false };
    for (const row of subs.results || []) await sendOne(DB, env, row, payload);
  }
}
