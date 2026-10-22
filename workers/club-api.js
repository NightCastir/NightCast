import quizBank from "../data/club-quiz-questions.json" with { type: "json" };
/**
 * NightCast Club API route module.
 *
 * Both the tracked legacy API router and the dedicated production entry point may call
 * handleClubApi with a shared-session checkAuth() resolver. This module does not mint or
 * store authentication tokens; identity and session validity are resolved from existing D1 tables.
 * Production entry point: workers/club-api-entry.js; production Worker: nightcast-club-api.
 */
const CLUB_PREFIX = "/api/v1/club";

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}
function missionPeriod(cadence) {
  if (cadence === "once") return "once";
  if (cadence === "event") return "event";
  if (cadence === "weekly") {
    const d = new Date(utcDay() + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  return utcDay();
}

function safeInt(value, min, max) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : null;
}

function randomId() {
  return crypto.randomUUID();
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function setting(DB, key, fallback = "false") {
  const row = await DB.prepare(
    "SELECT setting_value FROM club_settings WHERE setting_key = ?"
  ).bind(key).first();
  return row ? String(row.setting_value) : fallback;
}

async function requireMember(checkAuth) {
  const actor = await checkAuth();
  if (!actor) return { error: { status: 401, message: "برای استفاده از باشگاه وارد حساب کاربری شوید." } };
  if (String(actor.role || "").toLowerCase() === "admin") {
    return { error: { status: 403, message: "این عملیات فقط برای حساب شنونده مجاز است." } };
  }
  const userId = Number(actor.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { error: { status: 403, message: "شناسه کاربر معتبر نیست." } };
  }
  return { actor, userId };
}

async function requireAdmin(checkAuth) {
  const actor = await checkAuth();
  if (!actor) return { error: { status: 401, message: "ورود مدیر الزامی است." } };
  if (String(actor.role || "").toLowerCase() !== "admin") {
    return { error: { status: 403, message: "دسترسی مدیر لازم است." } };
  }
  return { actor };
}

async function awardEligibleBadges(DB, userId, sourceId) {
  const badges = await DB.prepare("SELECT id,criteria_json FROM club_badges WHERE is_active=1").all();
  const rows = badges.results || [];
  if (!rows.length) return;
  const [events, podcasts, points] = await Promise.all([
    DB.prepare("SELECT COUNT(*) AS total,COALESCE(SUM(accepted_seconds),0) AS seconds FROM club_activity_events WHERE user_id=? AND event_type='listen' AND status='accepted'").bind(userId).first(),
    DB.prepare("SELECT COUNT(DISTINCT podcast_id) AS total FROM club_activity_events WHERE user_id=? AND event_type='listen' AND status='accepted' AND podcast_id IS NOT NULL").bind(userId).first(),
    DB.prepare("SELECT COALESCE(SUM(delta),0) AS total FROM club_point_ledger WHERE user_id=? AND status='posted' AND source_type='listening_minute' AND delta>0").bind(userId).first()
  ]);
  const metrics = {
    accepted_listen_events: Number(events?.total || 0),
    listening_minutes: Math.floor(Number(events?.seconds || 0) / 60),
    unique_podcasts: Number(podcasts?.total || 0),
    points_earned: Number(points?.total || 0)
  };
  const statements = [];
  for (const badge of rows) {
    let criteria;
    try { criteria = JSON.parse(String(badge.criteria_json || "{}")); } catch (_) { continue; }
    const type = String(criteria.type || "");
    const target = Number(criteria.target);
    if (!Object.prototype.hasOwnProperty.call(metrics, type) ||
        !Number.isSafeInteger(target) || target < 1 || metrics[type] < target) continue;
    statements.push(DB.prepare("INSERT OR IGNORE INTO club_user_badges(user_id,badge_id,source_type,source_id) VALUES(?,?,'listening',?)")
      .bind(userId, badge.id, sourceId));
    statements.push(DB.prepare("INSERT OR IGNORE INTO club_audit_logs(id,actor_user_id,action,target_type,target_id,metadata_json) VALUES(?,?,'club.badge.earned','club_badge',?,?)")
      .bind("badge-earned:" + userId + ":" + badge.id, userId, badge.id, JSON.stringify({ source_id: sourceId, criteria: type, target })));
  }
  if (statements.length) await DB.batch(statements);
}

function fail(json, status, message, code) {
  return json({ success: false, message, ...(code ? { code } : {}) }, status);
}

export async function handleClubApi({ request, url, DB, json, checkAuth }) {
  if (!url.pathname.startsWith(CLUB_PREFIX)) return null;

  const path = url.pathname.slice(CLUB_PREFIX.length) || "/";
  const method = request.method.toUpperCase();

  try {
    if (path === "/checkin" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true") {
        return fail(json, 503, "امتیازگیری باشگاه در حال حاضر غیرفعال است.", "club_earning_disabled");
      }
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const prior = await DB.prepare("SELECT points_awarded,created_at FROM club_daily_checkins WHERE user_id=? AND checkin_day=?").bind(auth.userId, day).first();
      if (prior) return json({ success: true, duplicate: true, points_awarded: Number(prior.points_awarded), checkin_day: day });
      const points = 2;
      try {
        await DB.batch([
          DB.prepare("INSERT INTO club_daily_checkins(user_id,checkin_day,points_awarded) VALUES(?,?,?)").bind(auth.userId, day, points),
          DB.prepare("INSERT INTO club_point_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json,created_by) VALUES(?,?,'daily_checkin',?,?, 'posted',?,'system')")
            .bind(auth.userId, points, day, "club-checkin:" + auth.userId + ":" + day, JSON.stringify({ checkin_day: day }))
        ]);
      } catch (error) {
        const duplicate = await DB.prepare("SELECT points_awarded FROM club_daily_checkins WHERE user_id=? AND checkin_day=?").bind(auth.userId, day).first();
        if (duplicate) return json({ success: true, duplicate: true, points_awarded: Number(duplicate.points_awarded), checkin_day: day });
        throw error;
      }
      return json({ success: true, duplicate: false, points_awarded: points, checkin_day: day }, 201);
    }

    if (path === "/quiz/status" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true") {
        return json({ success:true, enabled:false, should_remind:false });
      }
      const recent = await DB.prepare("SELECT question_id,shown_at FROM club_quiz_impressions WHERE user_id=? AND shown_at>=datetime('now','-24 hours') ORDER BY shown_at DESC LIMIT 1").bind(auth.userId).first();
      const answered = recent ? await DB.prepare("SELECT id FROM club_quiz_answers WHERE user_id=? AND question_id=?").bind(auth.userId, recent.question_id).first() : null;
      const seen = await DB.prepare("SELECT COUNT(*) AS total FROM club_quiz_impressions WHERE user_id=?").bind(auth.userId).first();
      const exhausted = Number(seen && seen.total || 0) >= quizBank.questions.length;
      return json({ success:true, enabled:true, should_remind:!answered && !exhausted, has_question:!!recent, answered:!!answered, exhausted:exhausted });
    }

    if (path === "/quiz/today" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true") {
        return fail(json, 503, "بخش پرسش روزانه در حال حاضر غیرفعال است.", "club_quiz_disabled");
      }
      const recent = await DB.prepare("SELECT question_id,shown_at FROM club_quiz_impressions WHERE user_id=? AND shown_at>=datetime('now','-24 hours') ORDER BY shown_at DESC LIMIT 1").bind(auth.userId).first();
      if (recent) {
        const answered = await DB.prepare("SELECT selected_option,is_correct,points_awarded,answered_at FROM club_quiz_answers WHERE user_id=? AND question_id=?").bind(auth.userId, recent.question_id).first();
        const q = quizBank.questions.find(item => item.id === recent.question_id);
        if (!q) return fail(json, 500, "پرسش ثبت‌شده در بانک نسخه فعلی وجود ندارد.", "club_quiz_bank_mismatch");
        return json({ success: true, already_shown: true, answered: !!answered, question: { id:q.id,category:q.category,question:q.question,options:q.options }, answer: answered ? { selected_option:Number(answered.selected_option),is_correct:Number(answered.is_correct)===1,points_awarded:Number(answered.points_awarded),explanation:q.explanation,correct_option:q.answer } : null, shown_at:recent.shown_at });
      }
      const seen = await DB.prepare("SELECT question_id FROM club_quiz_impressions WHERE user_id=?").bind(auth.userId).all();
      const seenIds = new Set((seen.results || []).map(row => String(row.question_id)));
      const available = quizBank.questions.filter(q => !seenIds.has(q.id));
      if (!available.length) return json({ success: true, exhausted: true, message: "همه پرسش‌های فعلی را پاسخ داده‌اید؛ به‌زودی پرسش‌های تازه اضافه می‌شوند." });
      const question = available[Math.floor(Math.random() * available.length)];
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      try {
        await DB.prepare("INSERT INTO club_quiz_impressions(user_id,question_id,shown_day) VALUES(?,?,?)").bind(auth.userId, question.id, day).run();
      } catch (error) {
        const concurrent = await DB.prepare("SELECT question_id,shown_at FROM club_quiz_impressions WHERE user_id=? AND shown_at>=datetime('now','-24 hours') ORDER BY shown_at DESC LIMIT 1").bind(auth.userId).first();
        if (concurrent) return fail(json, 409, "پرسش روزانه همین حالا برای این حساب ثبت شده است؛ صفحه را تازه‌سازی کنید.", "club_quiz_already_shown");
        throw error;
      }
      return json({ success: true, already_shown: false, answered: false, question: { id:question.id,category:question.category,question:question.question,options:question.options }, shown_at:new Date().toISOString() }, 201);
    }

    if (path === "/quiz/answer" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true") {
        return fail(json, 503, "بخش پرسش روزانه در حال حاضر غیرفعال است.", "club_quiz_disabled");
      }
      const body = await request.json().catch(() => ({}));
      const questionId = String(body.question_id || "");
      const selected = safeInt(body.selected_option, 0, 3);
      if (!/^[a-z0-9_-]{1,40}$/.test(questionId) || selected === null) return fail(json, 400, "گزینه انتخاب‌شده معتبر نیست.", "club_quiz_invalid_answer");
      const impression = await DB.prepare("SELECT id FROM club_quiz_impressions WHERE user_id=? AND question_id=?").bind(auth.userId, questionId).first();
      if (!impression) return fail(json, 409, "این پرسش برای حساب شما ثبت نشده است.", "club_quiz_not_shown");
      const existing = await DB.prepare("SELECT selected_option,is_correct,points_awarded FROM club_quiz_answers WHERE user_id=? AND question_id=?").bind(auth.userId, questionId).first();
      if (existing) {
        const q = quizBank.questions.find(item => item.id === questionId);
        return json({ success: true, duplicate: true, locked: true, selected_option:Number(existing.selected_option), is_correct:Number(existing.is_correct)===1, points_awarded:Number(existing.points_awarded), correct_option:q ? q.answer : null, explanation:q ? q.explanation : "" });
      }
      const question = quizBank.questions.find(item => item.id === questionId);
      if (!question) return fail(json, 404, "پرسش در بانک نسخه فعلی پیدا نشد.", "club_quiz_unknown_question");
      const correct = selected === question.answer;
      const points = correct ? 5 : 0;
      try {
        const statements = [
          DB.prepare("INSERT INTO club_quiz_answers(user_id,question_id,selected_option,is_correct,points_awarded) VALUES(?,?,?,?,?)").bind(auth.userId, questionId, selected, correct ? 1 : 0, points)
        ];
        if (points) statements.push(DB.prepare("INSERT INTO club_point_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json,created_by) VALUES(?,?,'daily_quiz',?,?,'posted',?,'system')")
          .bind(auth.userId, points, questionId, "club-quiz:" + auth.userId + ":" + questionId, JSON.stringify({ question_id:questionId })));
        await DB.batch(statements);
      } catch (error) {
        const prior = await DB.prepare("SELECT selected_option,is_correct,points_awarded FROM club_quiz_answers WHERE user_id=? AND question_id=?").bind(auth.userId, questionId).first();
        if (prior) return fail(json, 409, "پاسخ این پرسش قبلاً ثبت شده و قابل تغییر نیست.", "club_quiz_answer_locked");
        throw error;
      }
      return json({ success:true, locked:true, selected_option:selected, is_correct:correct, points_awarded:points, correct_option:question.answer, explanation:question.explanation });
    }

    if (path === "/referrals/code" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      let row = await DB.prepare("SELECT invite_code FROM club_invite_codes WHERE user_id=?").bind(auth.userId).first();
      if (!row) {
        const code = randomId().replace(/-/g, "").slice(0, 10).toUpperCase();
        const hash = await sha256(code);
        try {
          await DB.prepare("INSERT INTO club_invite_codes(user_id,invite_code,code_hash) VALUES(?,?,?)").bind(auth.userId, code, hash).run();
        } catch (error) {
          row = await DB.prepare("SELECT invite_code FROM club_invite_codes WHERE user_id=?").bind(auth.userId).first();
          if (!row) throw error;
        }
        if (!row) row = { invite_code: code };
      }
      return json({ success:true, invite_code:row.invite_code, invite_url:"https://nightcast.ir/?ref=" + encodeURIComponent(row.invite_code), points_per_referral:10 });
    }

    if (path === "/referrals/claim" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true") {
        return fail(json, 503, "دعوت دوستان در حال حاضر غیرفعال است.", "club_referrals_disabled");
      }
      const body = await request.json().catch(() => ({}));
      const code = String(body.code || "").trim().toUpperCase();
      if (!/^[A-Z0-9]{10}$/.test(code)) return fail(json, 400, "کد دعوت معتبر نیست.", "club_referral_invalid_code");
      const inviter = await DB.prepare("SELECT user_id,code_hash FROM club_invite_codes WHERE invite_code=?").bind(code).first();
      if (!inviter) return fail(json, 404, "کد دعوت پیدا نشد.", "club_referral_code_not_found");
      if (Number(inviter.user_id) === auth.userId) return fail(json, 400, "نمی‌توانید از کد دعوت خودتان استفاده کنید.", "club_referral_self");
      const existing = await DB.prepare("SELECT status,points_awarded FROM club_referrals WHERE invitee_user_id=?").bind(auth.userId).first();
      if (existing) return json({ success:true, duplicate:true, status:existing.status, points_awarded:0 });
      const points = 10;
      try {
        await DB.batch([
          DB.prepare("INSERT INTO club_referrals(inviter_user_id,invitee_user_id,invite_code_hash,status,points_awarded,qualified_at) VALUES(?,?,?,'qualified',?,CURRENT_TIMESTAMP)")
            .bind(Number(inviter.user_id), auth.userId, inviter.code_hash, points),
          DB.prepare("INSERT INTO club_point_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json,created_by) VALUES(?,?,'referral',?,?,'posted',?,'system')")
            .bind(Number(inviter.user_id), points, String(auth.userId), "club-referral:" + auth.userId + ":" + Number(inviter.user_id), JSON.stringify({ invitee_user_id:auth.userId })),
          DB.prepare("INSERT OR IGNORE INTO club_notification_events(user_id,notification_key,notification_type,payload_json) VALUES(?,?,'referral',?)")
            .bind(Number(inviter.user_id), "referral-invitee-" + auth.userId, JSON.stringify({ points_awarded:points, invitee_user_id:auth.userId }))
        ]);
      } catch (error) {
        const prior = await DB.prepare("SELECT status,points_awarded FROM club_referrals WHERE invitee_user_id=?").bind(auth.userId).first();
        if (prior) return json({ success:true, duplicate:true, status:prior.status, points_awarded:0 });
        throw error;
      }
      return json({ success:true, duplicate:false, status:"qualified", points_awarded:points, recipient_user_id:Number(inviter.user_id) }, 201);
    }

    if (path === "/share-events" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const body = await request.json().catch(() => ({}));
      const podcastId = safeInt(body.podcast_id, 1, 2147483647);
      const channel = String(body.channel || "native");
      if (!["native","sms","whatsapp","telegram","soroush","copy","other"].includes(channel)) return fail(json, 400, "کانال اشتراک‌گذاری معتبر نیست.", "club_share_channel_invalid");
      if (podcastId !== null) {
        const podcast = await DB.prepare("SELECT id FROM podcasts WHERE id=?").bind(podcastId).first();
        if (!podcast) return fail(json, 404, "پادکست پیدا نشد.", "club_share_podcast_not_found");
      }
      await DB.prepare("INSERT INTO club_share_events(user_id,podcast_id,channel) VALUES(?,?,?)").bind(auth.userId, podcastId, channel).run();
      return json({ success:true, recorded:true }, 201);
    }

    if (path === "/notifications" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const rows = await DB.prepare("SELECT id,notification_key,notification_type,payload_json,created_at FROM club_notification_events WHERE user_id=? AND read_at IS NULL ORDER BY created_at DESC LIMIT 20").bind(auth.userId).all();
      const items = (rows.results || []).map(row => {
        let payload = {};
        try { payload = JSON.parse(String(row.payload_json || "{}")); } catch (_) {}
        return { id:Number(row.id), key:String(row.notification_key), type:String(row.notification_type), payload, created_at:row.created_at };
      });
      return json({ success:true, notifications:items });
    }

    if (path === "/notifications/read" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const body = await request.json().catch(() => ({}));
      const key = String(body.key || "");
      if (!key || key.length > 180) return fail(json, 400, "شناسه اعلان معتبر نیست.", "club_notification_invalid_key");
      await DB.prepare("UPDATE club_notification_events SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND notification_key=?").bind(auth.userId, key).run();
      return json({ success:true });
    }

    if (path === "/leaderboard" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const result = await DB.prepare(`SELECT u.id,COALESCE(NULLIF(cp.display_name,''),u.username,'شنونده') AS display_name,
          COALESCE(SUM(CASE WHEN l.status='posted' THEN l.delta ELSE 0 END),0) AS points
        FROM users u
        LEFT JOIN club_profiles cp ON cp.user_id=u.id
        LEFT JOIN club_point_ledger l ON l.user_id=u.id
        WHERE COALESCE(cp.leaderboard_opt_out,0)=0
        GROUP BY u.id,cp.display_name,u.username
        HAVING COALESCE(SUM(CASE WHEN l.status='posted' THEN l.delta ELSE 0 END),0)>0
        ORDER BY points DESC,u.id ASC LIMIT 100`).all();
      const entries = (result.results || []).map((row,index)=>({ rank:index+1, medal:index===0?"gold":index===1?"silver":index===2?"bronze":null, display_name:String(row.display_name || "شنونده").slice(0,80), points:Number(row.points || 0), is_self:Number(row.id)===auth.userId }));
      return json({ success:true, entries });
    }

    if (path.startsWith("/admin/")) {
      const auth = await requireAdmin(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_admin_required");

      if (path === "/admin/missions" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const title = String(body.title_fa || "").trim();
        const description = String(body.description_fa || "").trim();
        const cadence = String(body.cadence || "");
        const eventType = String(body.event_type || "");
        const target = safeInt(body.target_value, 1, 1000000);
        const points = safeInt(body.reward_points ?? 0, 0, 100000);
        const xp = safeInt(body.reward_xp ?? 0, 0, 100000);
        if (!title || title.length > 160 || description.length > 1200 ||
            !["daily", "weekly", "event", "once"].includes(cadence) ||
            !["listen", "listen_minutes", "podcast_play"].includes(eventType) ||
            target === null || points === null || xp === null) {
          return fail(json, 400, "اطلاعات مأموریت معتبر نیست.", "club_invalid_mission");
        }
        const id = randomId();
        await DB.batch([
          DB.prepare(`INSERT INTO club_missions
            (id,title_fa,description_fa,cadence,event_type,target_value,reward_points,reward_xp,
             starts_at,ends_at,is_active,rules_json,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)`)
            .bind(id, title, description, cadence, eventType, target, points, xp,
              body.starts_at || null, body.ends_at || null,
              JSON.stringify({ version: 1 }), String(auth.actor.username || "admin")),
          DB.prepare(`INSERT INTO club_audit_logs
            (id,actor_user_id,action,target_type,target_id,metadata_json)
            VALUES (?,NULL,'club.mission.create','club_mission',?,?)`)
            .bind(randomId(), id, JSON.stringify({ actor: String(auth.actor.username || "admin") }))
        ]);
        return json({ success: true, mission: { id, title_fa: title, is_active: false } }, 201);
      }

      if (path === "/admin/rewards" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const title = String(body.title_fa || "").trim();
        const description = String(body.description_fa || "").trim();
        const rewardType = String(body.reward_type || "");
        const cost = safeInt(body.cost_points, 1, 100000000);
        const stock = body.stock_remaining === null || body.stock_remaining === undefined
          ? null : safeInt(body.stock_remaining, 0, 10000000);
        const maxPerUser = body.max_per_user === null || body.max_per_user === undefined
          ? null : safeInt(body.max_per_user, 1, 100000);
        if (!title || title.length > 160 || description.length > 1200 ||
            !["digital", "coupon", "merchandise", "experience"].includes(rewardType) ||
            cost === null || (stock === null && body.stock_remaining !== null && body.stock_remaining !== undefined) ||
            (maxPerUser === null && body.max_per_user !== null && body.max_per_user !== undefined)) {
          return fail(json, 400, "اطلاعات پاداش معتبر نیست.", "club_invalid_reward");
        }
        const id = randomId();
        await DB.batch([
          DB.prepare(`INSERT INTO club_rewards
            (id,title_fa,description_fa,reward_type,cost_points,stock_remaining,max_per_user,
             starts_at,ends_at,is_active,delivery_config_json,created_by)
            VALUES (?,?,?,?,?,?,?,?,?,0,'{}',?)`)
            .bind(id, title, description, rewardType, cost, stock, maxPerUser,
              body.starts_at || null, body.ends_at || null, String(auth.actor.username || "admin")),
          DB.prepare(`INSERT INTO club_audit_logs
            (id,actor_user_id,action,target_type,target_id,metadata_json)
            VALUES (?,NULL,'club.reward.create','club_reward',?,?)`)
            .bind(randomId(), id, JSON.stringify({ actor: String(auth.actor.username || "admin") }))
        ]);
        return json({ success: true, reward: { id, title_fa: title, is_active: false } }, 201);
      }

      if (path === "/admin/overview" && method === "GET") {
        const [missions, rewards, redemptions, settings] = await Promise.all([
          DB.prepare("SELECT id,title_fa,cadence,event_type,target_value,reward_points,reward_xp,is_active,starts_at,ends_at,created_at FROM club_missions ORDER BY created_at DESC LIMIT 100").all(),
          DB.prepare("SELECT id,title_fa,reward_type,cost_points,stock_remaining,max_per_user,is_active,starts_at,ends_at FROM club_rewards ORDER BY created_at DESC LIMIT 100").all(),
          DB.prepare("SELECT rr.id,rr.user_id,u.username,rr.reward_id,r.title_fa AS reward_title,rr.cost_points,rr.status,rr.delivery_reference,rr.created_at FROM club_reward_redemptions rr JOIN users u ON u.id=rr.user_id JOIN club_rewards r ON r.id=rr.reward_id ORDER BY rr.created_at DESC LIMIT 100").all(),
          DB.prepare("SELECT setting_key,setting_value FROM club_settings WHERE setting_key IN ('club_enabled','earning_enabled','rewards_enabled','daily_points_cap','daily_xp_cap') ORDER BY setting_key").all()
        ]);
        return json({ success: true, missions: missions.results || [], rewards: rewards.results || [],
          redemptions: redemptions.results || [], settings: settings.results || [] });
      }

      const missionState = path.match(/^\/admin\/missions\/([a-zA-Z0-9_-]{1,100})\/(activate|deactivate)$/);
      if (missionState && method === "POST") {
        const active = missionState[2] === "activate" ? 1 : 0;
        const result = await DB.prepare("UPDATE club_missions SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(active, missionState[1]).run();
        if (!Number(result?.meta?.changes || 0)) return fail(json, 404, "مأموریت پیدا نشد.", "club_mission_not_found");
        await DB.prepare("INSERT INTO club_audit_logs(id,action,target_type,target_id,metadata_json) VALUES(?,?,'club_mission',?,?)")
          .bind(randomId(), active ? "club.mission.activate" : "club.mission.deactivate", missionState[1], JSON.stringify({ active })).run();
        return json({ success: true, id: missionState[1], is_active: !!active });
      }

      const rewardState = path.match(/^\/admin\/rewards\/([a-zA-Z0-9_-]{1,100})\/(activate|deactivate)$/);
      if (rewardState && method === "POST") {
        const active = rewardState[2] === "activate" ? 1 : 0;
        const result = await DB.prepare("UPDATE club_rewards SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(active, rewardState[1]).run();
        if (!Number(result?.meta?.changes || 0)) return fail(json, 404, "پاداش پیدا نشد.", "club_reward_not_found");
        await DB.prepare("INSERT INTO club_audit_logs(id,action,target_type,target_id,metadata_json) VALUES(?,?,'club_reward',?,?)")
          .bind(randomId(), active ? "club.reward.activate" : "club.reward.deactivate", rewardState[1], JSON.stringify({ active })).run();
        return json({ success: true, id: rewardState[1], is_active: !!active });
      }

      const fulfillment = path.match(/^\/admin\/redemptions\/([a-zA-Z0-9_-]{1,100})\/(fulfill|cancel)$/);
      if (fulfillment && method === "POST") {
        const id = fulfillment[1], action = fulfillment[2], body = await request.json().catch(() => ({}));
        const redemption = await DB.prepare("SELECT id,user_id,reward_id,cost_points,status FROM club_reward_redemptions WHERE id=?").bind(id).first();
        if (!redemption) return fail(json, 404, "درخواست دریافت پاداش پیدا نشد.", "club_redemption_not_found");
        if (action === "fulfill") {
          const result = await DB.prepare("UPDATE club_reward_redemptions SET status='fulfilled',fulfilled_at=CURRENT_TIMESTAMP,delivery_reference=? WHERE id=? AND status='pending'")
            .bind(String(body.delivery_reference || "").slice(0, 240) || null, id).run();
          if (!Number(result?.meta?.changes || 0)) {
            const current = await DB.prepare("SELECT status FROM club_reward_redemptions WHERE id=?").bind(id).first();
            if (current?.status === "fulfilled") return json({ success: true, duplicate: true, status: "fulfilled" });
            return fail(json, 409, "فقط درخواست در انتظار را می‌توان تحویل‌شده کرد.", "club_redemption_state_conflict");
          }
          await DB.prepare("INSERT INTO club_audit_logs(id,action,target_type,target_id,metadata_json) VALUES(?,'club.reward.fulfill','club_reward_redemption',?,?)")
            .bind(randomId(), id, JSON.stringify({ delivery_reference: body.delivery_reference || null })).run();
          return json({ success: true, id, status: "fulfilled" });
        }
        if (redemption.status === "cancelled") return json({ success: true, duplicate: true, status: "cancelled" });
        if (redemption.status !== "pending") return fail(json, 409, "فقط درخواست در انتظار را می‌توان لغو کرد.", "club_redemption_state_conflict");
        await DB.batch([
          DB.prepare("UPDATE club_reward_redemptions SET status='cancelled' WHERE id=? AND status='pending'").bind(id),
          DB.prepare("UPDATE club_rewards SET stock_remaining=CASE WHEN stock_remaining IS NULL THEN NULL ELSE stock_remaining+1 END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM club_reward_redemptions WHERE id=? AND status='cancelled') AND NOT EXISTS(SELECT 1 FROM club_point_ledger WHERE source_type='reward_refund' AND source_id=?)").bind(redemption.reward_id, id, id),
          DB.prepare("INSERT OR IGNORE INTO club_point_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json,created_by) SELECT user_id,cost_points,'reward_refund',id,'club-reward-refund:' || id,'posted',json_object('reward_id',reward_id),'admin' FROM club_reward_redemptions WHERE id=? AND status='cancelled'").bind(id),
          DB.prepare("INSERT OR IGNORE INTO club_audit_logs(id,action,target_type,target_id,metadata_json) SELECT 'refund-audit:' || id,'club.reward.cancel','club_reward_redemption',id,json_object('refund_points',cost_points) FROM club_reward_redemptions WHERE id=? AND status='cancelled'").bind(id)
        ]);
        return json({ success: true, id, status: "cancelled", refunded_points: Number(redemption.cost_points) });
      }

      return fail(json, 404, "مسیر مدیریتی باشگاه پیدا نشد.", "club_admin_route_not_found");
    }

    if (path === "/summary" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const userId = auth.userId;
      await DB.prepare("INSERT OR IGNORE INTO club_profiles(user_id) VALUES (?)").bind(userId).run();
      const [profile, points, xp, levels, missionCount, badgeCount] = await Promise.all([
        DB.prepare("SELECT display_name, leaderboard_opt_out, notifications_enabled FROM club_profiles WHERE user_id=?").bind(userId).first(),
        DB.prepare("SELECT COALESCE(SUM(delta),0) AS total FROM club_point_ledger WHERE user_id=? AND status='posted'").bind(userId).first(),
        DB.prepare("SELECT COALESCE(SUM(delta),0) AS total FROM club_experience_ledger WHERE user_id=? AND status='posted'").bind(userId).first(),
        DB.prepare("SELECT level,slug,title_fa,min_xp FROM club_levels WHERE is_active=1 ORDER BY min_xp").all(),
        DB.prepare("SELECT COUNT(*) AS total FROM club_missions WHERE is_active=1 AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP)").first(),
        DB.prepare("SELECT COUNT(*) AS total FROM club_user_badges WHERE user_id=?").bind(userId).first()
      ]);
      const totalXp = Number(xp?.total || 0);
      const levelRows = levels?.results || [];
      const currentLevel = levelRows.filter(row => Number(row.min_xp) <= totalXp).slice(-1)[0] || levelRows[0] || null;
      const nextLevel = currentLevel ? levelRows.find(row => Number(row.min_xp) > totalXp) || null : null;
      return json({ success: true, enabled: (await setting(DB, "club_enabled")) === "true",
        earning_enabled: (await setting(DB, "earning_enabled")) === "true",
        rewards_enabled: (await setting(DB, "rewards_enabled")) === "true",
        profile: profile || null, points: Number(points?.total || 0), xp: totalXp,
        level: currentLevel, next_level: nextLevel, active_missions: Number(missionCount?.total || 0),
        badges_earned: Number(badgeCount?.total || 0) });
    }

    if (path === "/ledger" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const limit = safeInt(url.searchParams.get("limit") || 20, 1, 50) || 20;
      const cursor = safeInt(url.searchParams.get("before") || 2147483647, 1, 2147483647) || 2147483647;
      const [points, xp] = await Promise.all([
        DB.prepare("SELECT id,delta,source_type,source_id,status,created_at FROM club_point_ledger WHERE user_id=? AND id<? ORDER BY id DESC LIMIT ?").bind(auth.userId, cursor, limit).all(),
        DB.prepare("SELECT id,delta,source_type,source_id,status,created_at FROM club_experience_ledger WHERE user_id=? AND id<? ORDER BY id DESC LIMIT ?").bind(auth.userId, cursor, limit).all()
      ]);
      return json({ success: true, points: points.results || [], experience: xp.results || [] });
    }

    if (path === "/missions" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const rows = await DB.prepare(`SELECT m.id,m.title_fa,m.description_fa,m.cadence,m.event_type,
        m.target_value,m.reward_points,m.reward_xp,um.progress_value,um.status AS user_status
        FROM club_missions m LEFT JOIN club_user_missions um ON um.mission_id=m.id AND um.user_id=?
          AND um.period_key=CASE m.cadence WHEN 'daily' THEN date('now')
            WHEN 'weekly' THEN date('now','-' || ((CAST(strftime('%w','now') AS INTEGER)+6)%7) || ' days')
            WHEN 'event' THEN 'event' ELSE 'once' END
        WHERE m.is_active=1 AND (m.starts_at IS NULL OR m.starts_at<=CURRENT_TIMESTAMP)
          AND (m.ends_at IS NULL OR m.ends_at>CURRENT_TIMESTAMP)
        ORDER BY m.cadence,m.created_at DESC`).bind(auth.userId).all();
      return json({ success: true, missions: rows.results || [] });
    }

    const missionClaim = path.match(/^\/missions\/([a-zA-Z0-9_-]{1,100})\/claim$/);
    if (missionClaim && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "earning_enabled")) !== "true")
        return fail(json, 503, "دریافت امتیاز مأموریت در حال حاضر غیرفعال است.", "club_earning_disabled");
      const mission = await DB.prepare("SELECT id,cadence,target_value,reward_points,reward_xp FROM club_missions WHERE id=? AND is_active=1 AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP)").bind(missionClaim[1]).first();
      if (!mission) return fail(json, 404, "مأموریت در دسترس نیست.", "club_mission_unavailable");
      const period = missionPeriod(mission.cadence);
      const existing = await DB.prepare("SELECT status,progress_value FROM club_user_missions WHERE user_id=? AND mission_id=? AND period_key=?").bind(auth.userId, mission.id, period).first();
      if (existing?.status === "claimed") return json({ success: true, duplicate: true, status: "claimed" });
      if (!existing || Number(existing.progress_value) < Number(mission.target_value) || existing.status !== "completed")
        return fail(json, 409, "ابتدا باید پیشرفت مأموریت به حد نصاب برسد.", "club_mission_not_complete");
      const pointKey = "club-mission-points:" + auth.userId + ":" + mission.id + ":" + period;
      const xpKey = "club-mission-xp:" + auth.userId + ":" + mission.id + ":" + period;
      const claimBatch = await DB.batch([
        DB.prepare("UPDATE club_user_missions SET status='claimed',claimed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=? AND period_key=? AND status='completed' AND progress_value>=?").bind(auth.userId, mission.id, period, mission.target_value),
        DB.prepare("INSERT OR IGNORE INTO club_point_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json) SELECT ?,?,'mission',?,?,'posted',? WHERE ?>0 AND EXISTS(SELECT 1 FROM club_user_missions WHERE user_id=? AND mission_id=? AND period_key=? AND status='claimed')").bind(auth.userId, Number(mission.reward_points), mission.id, pointKey, JSON.stringify({ period }), Number(mission.reward_points), auth.userId, mission.id, period),
        DB.prepare("INSERT OR IGNORE INTO club_experience_ledger(user_id,delta,source_type,source_id,idempotency_key,status,metadata_json) SELECT ?,?,'mission',?,?,'posted',? WHERE ?>0 AND EXISTS(SELECT 1 FROM club_user_missions WHERE user_id=? AND mission_id=? AND period_key=? AND status='claimed')").bind(auth.userId, Number(mission.reward_xp), mission.id, xpKey, JSON.stringify({ period }), Number(mission.reward_xp), auth.userId, mission.id, period),
        DB.prepare("INSERT OR IGNORE INTO club_audit_logs(id,actor_user_id,action,target_type,target_id,metadata_json) SELECT ?,?,'club.mission.claim','club_mission',?,? WHERE EXISTS(SELECT 1 FROM club_user_missions WHERE user_id=? AND mission_id=? AND period_key=? AND status='claimed')").bind("mission-claim:" + auth.userId + ":" + mission.id + ":" + period, auth.userId, mission.id, JSON.stringify({ period }), auth.userId, mission.id, period)
      ]);
      const claimed = await DB.prepare("SELECT status FROM club_user_missions WHERE user_id=? AND mission_id=? AND period_key=?").bind(auth.userId, mission.id, period).first();
      if (claimed?.status !== "claimed") return fail(json, 409, "دریافت پاداش مأموریت انجام نشد.", "club_mission_claim_conflict");
      const duplicate = !Number(claimBatch?.[0]?.meta?.changes || 0);
      return json({ success: true, duplicate, status: "claimed",
        points_awarded: duplicate ? 0 : Number(mission.reward_points),
        xp_awarded: duplicate ? 0 : Number(mission.reward_xp) });
    }

    if (path === "/badges" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const rows = await DB.prepare(`SELECT b.id,b.slug,b.title_fa,b.description_fa,b.icon_path,b.rarity,
        ub.earned_at FROM club_badges b LEFT JOIN club_user_badges ub
          ON ub.badge_id=b.id AND ub.user_id=?
        WHERE b.is_active=1 ORDER BY CASE WHEN ub.earned_at IS NULL THEN 1 ELSE 0 END,b.rarity,b.title_fa`)
        .bind(auth.userId).all();
      return json({ success: true, badges: rows.results || [] });
    }

    if (path === "/rewards" && method === "GET") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      const rows = await DB.prepare(`SELECT id,title_fa,description_fa,reward_type,cost_points,
        stock_remaining,max_per_user,starts_at,ends_at
        FROM club_rewards WHERE is_active=1
          AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP)
          AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP)
        ORDER BY cost_points,title_fa`).all();
      return json({ success: true, rewards: rows.results || [] });
    }

    if (path === "/listen-events" && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true") {
        return fail(json, 503, "باشگاه شنوندگان هنوز فعال نشده است.", "club_disabled");
      }
      const body = await request.json().catch(() => ({}));
      const eventId = String(body.event_id || "");
      const sessionId = String(body.session_id || "");
      const sequence = safeInt(body.sequence_number, 1, 2147483647);
      const podcastId = safeInt(body.podcast_id, 1, 2147483647);
      if (!/^[a-zA-Z0-9_-]{12,100}$/.test(eventId) ||
          !/^[a-zA-Z0-9_-]{12,160}$/.test(sessionId) || sequence === null || podcastId === null) {
        return fail(json, 400, "اطلاعات رویداد شنیدن معتبر نیست.", "club_invalid_listen_event");
      }
      const podcast = await DB.prepare("SELECT id FROM podcasts WHERE id=?").bind(podcastId).first();
      if (!podcast) return fail(json, 404, "پادکست پیدا نشد.", "club_podcast_not_found");
      const sessionHash = await sha256(String(auth.userId) + ":" + sessionId);
      const idem = "club-listen:" + auth.userId + ":" + eventId;
      const duplicate = await DB.prepare("SELECT id,status,accepted_seconds FROM club_activity_events WHERE idempotency_key=?").bind(idem).first();
      if (duplicate) return json({ success: true, duplicate: true, event: duplicate });
      const previous = await DB.prepare(`SELECT sequence_number,received_at FROM club_activity_events
        WHERE user_id=? AND session_key_hash=? AND event_type='listen'
        ORDER BY sequence_number DESC LIMIT 1`).bind(auth.userId, sessionHash).first();
      if (previous && sequence <= Number(previous.sequence_number)) {
        return fail(json, 409, "شماره توالی رویداد تکراری یا قدیمی است.", "club_sequence_replay");
      }
      let elapsed = 0;
      let status = "received";
      let acceptedSeconds = 0;
      if (previous) {
        const stamp = String(previous.received_at || "").replace(" ", "T") + "Z";
        elapsed = Math.floor((Date.now() - Date.parse(stamp)) / 1000);
        if (!Number.isFinite(elapsed) || elapsed < 0) elapsed = 0;
        if (elapsed < 15) status = "rejected";
        else if (elapsed > 300) status = "review";
        else {
          status = "accepted";
          acceptedSeconds = Math.min(elapsed, 60);
        }
      }
      const id = String(auth.userId) + ":" + eventId;
      const statements = [
        DB.prepare(`INSERT INTO club_activity_events
          (id,user_id,event_type,podcast_id,session_key_hash,elapsed_seconds,accepted_seconds,status,
           idempotency_key,metadata_json,sequence_number,received_at)
          VALUES (?,?,'listen',?,?,?,?,?,?,?, ?,CURRENT_TIMESTAMP)`)
          .bind(id, auth.userId, podcastId, sessionHash, Math.max(0, elapsed), acceptedSeconds, status, idem,
            JSON.stringify({ rules_version: await setting(DB, "rules_version", "1") }), sequence),
        DB.prepare(`INSERT INTO club_point_ledger
          (user_id,delta,source_type,source_id,idempotency_key,status,metadata_json)
          SELECT ?,1,'listening_minute',?,'club-listen-point:' || ?, 'posted',?
          WHERE (SELECT setting_value FROM club_settings WHERE setting_key='club_enabled')='true'
            AND (SELECT setting_value FROM club_settings WHERE setting_key='earning_enabled')='true'
            AND ?='accepted' AND ? >= 60
            AND (SELECT COALESCE(SUM(delta),0) FROM club_point_ledger
                 WHERE user_id=? AND status='posted' AND delta>0 AND date(created_at)=date('now'))
              < CAST(COALESCE((SELECT setting_value FROM club_settings WHERE setting_key='daily_points_cap'),'100') AS INTEGER)`)
          .bind(auth.userId, id, id, JSON.stringify({ podcast_id: podcastId }), status, acceptedSeconds, auth.userId),
        DB.prepare(`INSERT INTO club_experience_ledger
          (user_id,delta,source_type,source_id,idempotency_key,status,metadata_json)
          SELECT ?,MIN(2,MAX(0,CAST(COALESCE((SELECT setting_value FROM club_settings WHERE setting_key='daily_xp_cap'),'250') AS INTEGER) -
            (SELECT COALESCE(SUM(delta),0) FROM club_experience_ledger
             WHERE user_id=? AND status='posted' AND delta>0 AND date(created_at)=date('now')))),
            'listening_minute',?,'club-listen-xp:' || ?, 'posted',?
          WHERE (SELECT setting_value FROM club_settings WHERE setting_key='club_enabled')='true'
            AND (SELECT setting_value FROM club_settings WHERE setting_key='earning_enabled')='true'
            AND ?='accepted' AND ? >= 60
            AND (SELECT COALESCE(SUM(delta),0) FROM club_experience_ledger
                 WHERE user_id=? AND status='posted' AND delta>0 AND date(created_at)=date('now'))
              < CAST(COALESCE((SELECT setting_value FROM club_settings WHERE setting_key='daily_xp_cap'),'250') AS INTEGER)`)
          .bind(auth.userId, auth.userId, id, id, JSON.stringify({ podcast_id: podcastId }), status, acceptedSeconds, auth.userId)
      ];
      statements.push(DB.prepare(`INSERT INTO club_user_missions
        (user_id,mission_id,period_key,progress_value,status,completed_at)
        SELECT ?,m.id,
          CASE m.cadence WHEN 'daily' THEN date('now')
            WHEN 'weekly' THEN date('now','-' || ((CAST(strftime('%w','now') AS INTEGER)+6)%7) || ' days')
            WHEN 'event' THEN 'event' ELSE 'once' END,
          CASE WHEN m.event_type='listen_minutes' THEN CAST(? / 60 AS INTEGER) ELSE 1 END,
          CASE WHEN (CASE WHEN m.event_type='listen_minutes' THEN CAST(? / 60 AS INTEGER) ELSE 1 END) >= m.target_value THEN 'completed' ELSE 'active' END,
          CASE WHEN (CASE WHEN m.event_type='listen_minutes' THEN CAST(? / 60 AS INTEGER) ELSE 1 END) >= m.target_value THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM club_missions m
        WHERE m.is_active=1 AND (m.starts_at IS NULL OR m.starts_at<=CURRENT_TIMESTAMP)
          AND (m.ends_at IS NULL OR m.ends_at>CURRENT_TIMESTAMP)
          AND ((m.event_type='listen' AND ?='accepted' AND ?>=60)
            OR (m.event_type='listen_minutes' AND ?='accepted' AND ?>=60)
            OR (m.event_type='podcast_play' AND ?='accepted' AND ?>=60 AND ?=2))
        ON CONFLICT(user_id,mission_id,period_key) DO UPDATE SET
          progress_value=MIN((SELECT target_value FROM club_missions WHERE id=club_user_missions.mission_id),
            club_user_missions.progress_value + excluded.progress_value),
          status=CASE WHEN club_user_missions.status='claimed' THEN 'claimed'
            WHEN MIN((SELECT target_value FROM club_missions WHERE id=club_user_missions.mission_id),
              club_user_missions.progress_value + excluded.progress_value) >=
              (SELECT target_value FROM club_missions WHERE id=club_user_missions.mission_id)
            THEN 'completed' ELSE 'active' END,
          completed_at=CASE WHEN MIN((SELECT target_value FROM club_missions WHERE id=club_user_missions.mission_id),
            club_user_missions.progress_value + excluded.progress_value) >=
            (SELECT target_value FROM club_missions WHERE id=club_user_missions.mission_id)
            THEN COALESCE(club_user_missions.completed_at,CURRENT_TIMESTAMP) ELSE club_user_missions.completed_at END,
          updated_at=CURRENT_TIMESTAMP`)
        .bind(auth.userId, acceptedSeconds, acceptedSeconds, acceptedSeconds, status, acceptedSeconds, status, acceptedSeconds, status, acceptedSeconds, sequence));
      try {
        await DB.batch(statements);
      } catch (error) {
        const replay = await DB.prepare("SELECT id,status,accepted_seconds FROM club_activity_events WHERE idempotency_key=?").bind(idem).first();
        if (replay) return json({ success: true, duplicate: true, event: replay });
        if (String(error?.message || "").includes("uq_club_activity_session_sequence") ||
            String(error?.message || "").includes("UNIQUE constraint failed")) {
          return fail(json, 409, "این رویداد قبلاً ثبت شده است.", "club_event_replay");
        }
        throw error;
      }
      if (status === "accepted") {
        try {
          await awardEligibleBadges(DB, auth.userId, id);
        } catch (badgeError) {
          console.error("NightCast Club badge evaluation failed", badgeError);
        }
      }
      const [pointAward, xpAward] = await Promise.all([
        DB.prepare("SELECT id FROM club_point_ledger WHERE idempotency_key=?").bind("club-listen-point:" + id).first(),
        DB.prepare("SELECT id FROM club_experience_ledger WHERE idempotency_key=?").bind("club-listen-xp:" + id).first()
      ]);
      return json({ success: true, event: { id, status, elapsed_seconds: elapsed, accepted_seconds: acceptedSeconds },
        points_awarded: !!pointAward, xp_awarded: !!xpAward });
    }

    const redeemMatch = path.match(/^\/rewards\/([a-zA-Z0-9_-]{1,100})\/redeem$/);
    if (redeemMatch && method === "POST") {
      const auth = await requireMember(checkAuth);
      if (auth.error) return fail(json, auth.error.status, auth.error.message, "club_auth_required");
      if ((await setting(DB, "club_enabled")) !== "true" || (await setting(DB, "rewards_enabled")) !== "true") {
        return fail(json, 503, "دریافت پاداش در حال حاضر غیرفعال است.", "club_rewards_disabled");
      }
      const body = await request.json().catch(() => ({}));
      const idemInput = String(request.headers.get("Idempotency-Key") || body.idempotency_key || "");
      if (!/^[a-zA-Z0-9:_-]{12,120}$/.test(idemInput)) {
        return fail(json, 400, "کلید یکتای درخواست الزامی است.", "club_idempotency_required");
      }
      const idem = "club-redeem:" + auth.userId + ":" + idemInput;
      const prior = await DB.prepare("SELECT id,reward_id,cost_points,status,created_at FROM club_reward_redemptions WHERE idempotency_key=?").bind(idem).first();
      if (prior) {
        if (String(prior.reward_id) !== redeemMatch[1]) return fail(json, 409, "این کلید قبلاً برای پاداش دیگری استفاده شده است.", "club_idempotency_conflict");
        return json({ success: true, duplicate: true, redemption: prior });
      }
      const reward = await DB.prepare(`SELECT id,cost_points FROM club_rewards WHERE id=?
        AND is_active=1 AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP)
        AND (ends_at IS NULL OR ends_at>CURRENT_TIMESTAMP)`).bind(redeemMatch[1]).first();
      if (!reward) return fail(json, 404, "این پاداش در دسترس نیست.", "club_reward_unavailable");
      const id = randomId();
      try {
        await DB.prepare(`INSERT INTO club_reward_redemptions
          (id,user_id,reward_id,cost_points,idempotency_key,status)
          VALUES (?,?,?,?,?,'pending')`)
          .bind(id, auth.userId, reward.id, Number(reward.cost_points), idem).run();
      } catch (error) {
        const message = String(error?.message || "");
        const existing = await DB.prepare("SELECT id,reward_id,cost_points,status,created_at FROM club_reward_redemptions WHERE idempotency_key=?").bind(idem).first();
        if (existing) return json({ success: true, duplicate: true, redemption: existing });
        if (/club_rewards_disabled|club_reward_unavailable|club_insufficient_points|club_reward_user_limit|UNIQUE constraint failed/.test(message)) {
          return fail(json, 409, "پاداش قابل دریافت نیست؛ موجودی امتیاز، ظرفیت یا محدودیت دریافت را بررسی کنید.", "club_redemption_rejected");
        }
        throw error;
      }
      const redemption = await DB.prepare("SELECT id,reward_id,cost_points,status,created_at FROM club_reward_redemptions WHERE id=?").bind(id).first();
      return json({ success: true, redemption }, 201);
    }

    return fail(json, 404, "مسیر باشگاه پیدا نشد.", "club_route_not_found");
  } catch (error) {
    return json({ success: false, message: "خطای داخلی باشگاه شنوندگان.", code: "club_internal_error" }, 500);
  }
}
