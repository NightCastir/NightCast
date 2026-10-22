(function () {
  "use strict";
  const API = "https://club-api.nightcast.ir/api/v1";
  const token = localStorage.getItem("NightCastToken") || "";
  const $ = id => document.getElementById(id);
  const notice = $("notice");
  const connection = $("connection");
  let snapshot = { missions: [], rewards: [], redemptions: [], settings: [] };

  function message(text, type) {
    notice.textContent = text;
    notice.className = "notice" + (type ? " " + type : "");
  }
  function authHeaders() {
    return { "Content-Type": "application/json", "Authorization": "Bearer " + token };
  }
  async function api(path, method, body) {
    const response = await fetch(API + "/club" + path, {
      method: method || "GET",
      headers: authHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || ("درخواست ناموفق بود (" + response.status + ")"));
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
    return data;
  }
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }
  function button(text, kind, action) {
    const b = node("button", kind || "secondary", text);
    b.type = "button";
    b.addEventListener("click", action);
    return b;
  }
  function item(title, meta, actions, active) {
    const row = node("article", "item");
    const main = node("div", "item-main");
    main.append(node("div", "item-title", title));
    main.append(node("div", "meta", meta));
    main.append(node("span", "pill" + (active ? " active" : ""), active ? "فعال" : "غیرفعال"));
    row.append(main);
    const actionBox = node("div", "actions");
    actions.forEach(action => actionBox.append(action));
    row.append(actionBox);
    return row;
  }
  function showList(targetId, rows, emptyText, render) {
    const target = $(targetId);
    target.replaceChildren();
    if (!rows.length) {
      target.append(node("div", "empty", emptyText));
      return;
    }
    rows.forEach(row => target.append(render(row)));
  }
  function render() {
    const flags = Object.fromEntries((snapshot.settings || []).map(x => [x.setting_key, x.setting_value]));
    $("metrics").replaceChildren(
      node("div", "metric", "باشگاه: " + (flags.club_enabled === "true" ? "فعال" : "غیرفعال")),
      node("div", "metric", "امتیازگیری: " + (flags.earning_enabled === "true" ? "فعال" : "غیرفعال")),
      node("div", "metric", "پاداش‌ها: " + (flags.rewards_enabled === "true" ? "فعال" : "غیرفعال")),
      node("div", "metric", "سقف امتیاز روزانه: " + (flags.daily_points_cap || "—")),
      node("div", "metric", "سقف XP روزانه: " + (flags.daily_xp_cap || "—"))
    );
    showList("missions", snapshot.missions, "مأموریتی ثبت نشده است.", m => item(
      m.title_fa, m.cadence + " · " + m.event_type + " · هدف " + m.target_value + " · " + m.reward_points + " امتیاز / " + m.reward_xp + " XP",
      [button(m.is_active ? "غیرفعال‌کردن" : "فعال‌کردن", "secondary", async () => {
        await mutate("/admin/missions/" + encodeURIComponent(m.id) + "/" + (m.is_active ? "deactivate" : "activate"));
      })], !!m.is_active
    ));
    showList("rewards", snapshot.rewards, "پاداشی ثبت نشده است.", r => item(
      r.title_fa, r.reward_type + " · هزینه " + r.cost_points + " · موجودی " + (r.stock_remaining === null ? "نامحدود" : r.stock_remaining),
      [button(r.is_active ? "غیرفعال‌کردن" : "فعال‌کردن", "secondary", async () => {
        await mutate("/admin/rewards/" + encodeURIComponent(r.id) + "/" + (r.is_active ? "deactivate" : "activate"));
      })], !!r.is_active
    ));
    showList("redemptions", snapshot.redemptions, "درخواستی برای دریافت پاداش وجود ندارد.", r => {
      const actions = [];
      if (r.status === "pending") {
        actions.push(button("ثبت تحویل", "good", async () => {
          const ref = window.prompt("شناسه تحویل یا توضیح (اختیاری):", "") || "";
          await mutate("/admin/redemptions/" + encodeURIComponent(r.id) + "/fulfill", { delivery_reference: ref });
        }));
        actions.push(button("لغو و بازپرداخت", "danger", async () => {
          if (window.confirm("درخواست لغو و امتیازها به کاربر بازگردانده شود؟")) {
            await mutate("/admin/redemptions/" + encodeURIComponent(r.id) + "/cancel", {});
          }
        }));
      }
      return item(r.reward_title + " · " + r.username, "امتیاز: " + r.cost_points + " · وضعیت: " + r.status + " · " + r.created_at, actions, r.status === "fulfilled");
    });
  }
  async function load() {
    const data = await api("/admin/overview");
    snapshot = { missions: data.missions || [], rewards: data.rewards || [], redemptions: data.redemptions || [], settings: data.settings || [] };
    render();
    $("dashboard").hidden = false;
    connection.textContent = "اتصال امن برقرار است · مدیر";
    message("اطلاعات از API و D1 دریافت شد. مأموریت و پاداش تازه به‌صورت پیش‌فرض غیرفعال ایجاد می‌شوند.", "ok");
  }
  async function mutate(path, body) {
    try {
      await api(path, "POST", body === undefined ? {} : body);
      await load();
      message("تغییر با موفقیت ثبت شد.", "ok");
    } catch (error) {
      message(error.message || "ثبت تغییر انجام نشد.", "error");
    }
  }
  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }
  $("mission-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formData(form);
    data.target_value = Number(data.target_value);
    data.reward_points = Number(data.reward_points || 0);
    data.reward_xp = Number(data.reward_xp || 0);
    await mutate("/admin/missions", data);
    form.reset();
  });
  $("reward-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formData(form);
    data.cost_points = Number(data.cost_points);
    data.stock_remaining = data.stock_remaining === "" ? null : Number(data.stock_remaining);
    data.max_per_user = data.max_per_user === "" ? null : Number(data.max_per_user);
    await mutate("/admin/rewards", data);
    form.reset();
  });
  if (!token) {
    connection.textContent = "ورود لازم است";
    message("توکن ورود NightCast در این مرورگر پیدا نشد. ابتدا با حساب مدیر وارد سایت شوید و سپس این صفحه را دوباره باز کنید.", "error");
    return;
  }
  async function verifyAdminAllowlist() {
    const response = await fetch(API + "/club/admin/status", {
      method: "GET",
      headers: authHeaders(),
      credentials: "omit",
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.isAdmin !== true) {
      const error = new Error(data.code === "admin_allowlist_not_configured"
        ? "دسترسی مدیر هنوز در تنظیمات امن Worker پیکربندی نشده است."
        : (data.message || "این صفحه فقط برای مدیر مجاز است."));
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
  }

  verifyAdminAllowlist().then(load).catch(error => {
    connection.textContent = error.status === 403 ? "دسترسی غیرمجاز" : "اتصال ناموفق";
    message(error.status === 401 ? "نشست ورود منقضی شده است؛ دوباره وارد شوید." :
      error.status === 403 ? "ایمیل حساب واردشده با ایمیل مدیر تطابق ندارد. دسترسی رد شد." :
      error.code === "admin_allowlist_not_configured" ? error.message :
      "تأیید هویت مدیر یا اتصال به API ناموفق بود: " + error.message, "error");
    $("dashboard").hidden = true;
    if (error.status === 403 || error.status === 401) {
      window.setTimeout(() => window.location.replace("/"), 1800);
    }
  });
})();
