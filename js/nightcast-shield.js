(function () {
  "use strict";
  const API_BASE = "https://nightcast-shield.tomasgermany2580.workers.dev/api/v1";
  const widgets = new Map();

  async function load(widget) {
    const action = widget.dataset.ncShield;
    const status = widget.querySelector("[data-nc-shield-status]");
    const question = widget.querySelector("[data-nc-shield-question]");
    const answer = widget.querySelector("[data-nc-shield-answer]");
    const refresh = widget.querySelector("[data-nc-shield-refresh]");
    refresh.disabled = true;
    status.textContent = "در حال دریافت پرسش امنیتی…";
    widgets.set(action, { loading: true });
    try {
      const response = await fetch(API_BASE + "/captcha/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ action }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.id || !data.question) throw new Error(data.message || "دریافت پرسش امنیتی انجام نشد.");
      widgets.set(action, { id: data.id, action, widget });
      question.textContent = data.question;
      answer.value = "";
      answer.disabled = false;
      status.textContent = "برای ادامه، پاسخ را وارد کنید.";
      status.dataset.state = "ready";
    } catch (error) {
      widgets.set(action, null);
      question.textContent = "پرسش فعلاً در دسترس نیست";
      status.textContent = error.message || "اتصال را بررسی کنید و دوباره تلاش کنید.";
      status.dataset.state = "error";
      answer.disabled = true;
    } finally {
      refresh.disabled = false;
    }
  }

  function getProof(action) {
    const current = widgets.get(action);
    const widget = current && current.widget;
    const input = widget && widget.querySelector("[data-nc-shield-answer]");
    const answer = String(input && input.value || "").trim();
    if (!current || !current.id) throw new Error("پرسش امنیتی آماده نیست؛ لطفاً پرسش تازه‌ای دریافت کنید.");
    if (!/^[0-9۰-۹٠-٩]{1,2}$/.test(answer)) {
      input && input.focus();
      throw new Error("لطفاً پاسخ عددی پرسش امنیتی را وارد کنید.");
    }
    return { id: current.id, answer };
  }

  function init() {
    document.querySelectorAll("[data-nc-shield]").forEach(widget => {
      const action = widget.dataset.ncShield;
      if (!["login", "comment", "suggestion"].includes(action)) return;
      const title = document.createElement("div");
      title.className = "nc-shield-title";
      title.innerHTML = '<span aria-hidden="true">🛡️</span><span>تأیید امنیتی NightCast</span>';
      const questionRow = document.createElement("div");
      questionRow.className = "nc-shield-question-row";
      const question = document.createElement("strong");
      question.dataset.ncShieldQuestion = "";
      question.textContent = "در حال دریافت پرسش…";
      questionRow.appendChild(question);
      const label = document.createElement("label");
      label.className = "nc-shield-answer-label";
      const labelText = document.createElement("span");
      labelText.textContent = "پاسخ";
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.autocomplete = "off";
      input.enterKeyHint = "done";
      input.maxLength = 2;
      input.placeholder = "مثلاً ۹";
      input.setAttribute("aria-label", "پاسخ پرسش امنیتی");
      input.dataset.ncShieldAnswer = "";
      label.append(labelText, input);
      const refresh = document.createElement("button");
      refresh.type = "button";
      refresh.className = "nc-shield-refresh";
      refresh.dataset.ncShieldRefresh = "";
      refresh.textContent = "پرسش تازه";
      refresh.addEventListener("click", () => load(widget));
      const status = document.createElement("p");
      status.className = "nc-shield-status";
      status.dataset.ncShieldStatus = "";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      widget.replaceChildren(title, questionRow, label, refresh, status);
      load(widget);
    });
  }

  window.NightCastShield = {
    getProof,
    refresh(action) {
      const widget = document.querySelector('[data-nc-shield="' + String(action).replace(/[^a-z]/g, "") + '"]');
      if (widget) return load(widget);
      return Promise.resolve();
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();