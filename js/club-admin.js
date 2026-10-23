(function () {
  "use strict";
  const API = "https://club-api.nightcast.ir/api/v1";
  const token = localStorage.getItem("NightCastToken") || "";
  const $ = id => document.getElementById(id);
  const notice = $("notice");
  const connection = $("connection");
  let snapshot = { missions: [], rewards: [], redemptions: [], settings: [] };
  let podcasts = [];
  let editingPodcastId = null;

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

  const podcastFields = ["title","slug","book_name","author_name","category_name","tags","episode_number","summary","transcript","duration_seconds","listen_count","audio_url","cover_url","status","publish_date","description"];
  function switchTab(name) {
    const podcastsTab = name === "podcasts";
    $("club-management-tab").hidden = podcastsTab;
    $("podcast-management-tab").hidden = !podcastsTab;
    $("tab-club").classList.toggle("active", !podcastsTab);
    $("tab-podcasts").classList.toggle("active", podcastsTab);
    $("tab-club").setAttribute("aria-selected", String(!podcastsTab));
    $("tab-podcasts").setAttribute("aria-selected", String(podcastsTab));
    if (podcastsTab && !podcasts.length) loadPodcasts();
  }
  function podcastValue(value) { return value === null || value === undefined ? "" : String(value); }
  function renderPodcasts() {
    const query = ($("podcast-search").value || "").trim().toLocaleLowerCase();
    const rows = podcasts.filter(p => [p.title,p.slug,p.book_name,p.author_name,p.category_name].some(v => podcastValue(v).toLocaleLowerCase().includes(query)));
    $("podcast-count").textContent = podcasts.length + " پادکست";
    const body = $("podcast-rows");
    body.replaceChildren();
    if (!rows.length) {
      const tr = document.createElement("tr"), td = node("td","empty",query ? "موردی با این جست‌وجو پیدا نشد." : "هنوز پادکستی ثبت نشده است.");
      td.colSpan = 6; tr.append(td); body.append(tr); return;
    }
    rows.forEach(p => {
      const tr = document.createElement("tr");
      [p.id,p.title, [p.book_name,p.author_name].filter(Boolean).join(" / ") || "—", p.status === "active" ? "منتشرشده" : p.status === "archived" ? "بایگانی" : "پیش‌نویس", Math.floor(Number(p.duration_seconds || 0)/60) + " دقیقه"].forEach(value => tr.append(node("td","",value)));
      const td = node("td");
      const actions = node("div","actions");
      actions.append(button("ویرایش","secondary",() => fillPodcastForm(p)));
      td.append(actions); tr.append(td); body.append(tr);
    });
  }
  async function loadPodcasts() {
    $("podcast-rows").replaceChildren();
    const tr = document.createElement("tr"), td = node("td","empty","در حال دریافت فهرست از پایگاه داده…"); td.colSpan = 6; tr.append(td); $("podcast-rows").append(tr);
    try {
      const data = await api("/admin/podcasts");
      podcasts = Array.isArray(data.podcasts) ? data.podcasts : [];
      renderPodcasts();
    } catch (error) {
      const row = document.createElement("tr"), cell = node("td","empty","دریافت پادکست‌ها ناموفق بود: " + error.message); cell.colSpan = 6; row.append(cell); $("podcast-rows").replaceChildren(row);
      message(error.message || "دریافت پادکست‌ها ناموفق بود.", "error");
    }
  }
  function fillPodcastForm(podcast) {
    editingPodcastId = Number(podcast.id);
    $("podcast-form-title").textContent = "ویرایش پادکست #" + podcast.id;
    $("podcast-save").textContent = "ذخیره تغییرات";
    $("podcast-cancel").hidden = false;
    podcastFields.forEach(key => {
      const field = $("podcast-" + ({book_name:"book",author_name:"author",category_name:"category",episode_number:"episode",duration_seconds:"duration",listen_count:"listen-count",audio_url:"audio",cover_url:"cover",publish_date:"publish-date" ,summary:"summary",description:"description",transcript:"transcript",status:"status",tags:"tags",title:"title",slug:"slug"}[key]));
      if (!field) return;
      let value = podcast[key];
      if (key === "publish_date" && value) value = String(value).replace(" ", "T").slice(0,16);
      field.value = podcastValue(value);
    });
    $("podcast-form").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function resetPodcastForm() {
    editingPodcastId = null;
    $("podcast-form").reset();
    $("podcast-id").value = "";
    $("podcast-episode").value = "1";
    $("podcast-duration").value = "0";
    $("podcast-listen-count").value = "0";
    $("podcast-status").value = "active";
    $("podcast-form-title").textContent = "ثبت پادکست جدید";
    $("podcast-save").textContent = "ثبت پادکست";
    $("podcast-cancel").hidden = true;
  }
  $("tab-club").addEventListener("click", () => switchTab("club"));
  $("tab-podcasts").addEventListener("click", () => switchTab("podcasts"));
  $("podcast-search").addEventListener("input", renderPodcasts);
  $("podcast-refresh").addEventListener("click", loadPodcasts);
  $("podcast-cancel").addEventListener("click", resetPodcastForm);
  $("podcast-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.id;
    ["episode_number","duration_seconds","listen_count"].forEach(k => data[k] = Number(data[k] || 0));
    if (data.publish_date) data.publish_date = data.publish_date.replace("T"," ");
    else data.publish_date = null;
    const buttonEl = $("podcast-save");
    buttonEl.disabled = true;
    try {
      const result = editingPodcastId
        ? await api("/admin/podcasts/" + editingPodcastId, "PUT", data)
        : await api("/admin/podcasts", "POST", data);
      message(result.message || "پادکست با موفقیت ذخیره شد.", "ok");
      resetPodcastForm();
      await loadPodcasts();
    } catch (error) {
      message(error.message || "ذخیره پادکست ناموفق بود.", "error");
    } finally { buttonEl.disabled = false; }
  });

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
    if ($("podcast-management-tab") && !$("podcast-management-tab").hidden) loadPodcasts();
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
