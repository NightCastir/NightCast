(function () {
  "use strict";
  const API_BASE = "https://nightcast-shield.tomasgermany2580.workers.dev/api/v1";
  const widgets = new Map();
  const labels = {
    login: { action: "ادامه با Google", hint: "پس از پاسخ، ادامه ورود با Google را انتخاب کنید." },
    comment: { hint: "پاسخ را وارد کنید؛ سپس فقط یک بار روی «ثبت دیدگاه» بزنید." },
    suggestion: { hint: "پاسخ را وارد کنید؛ سپس فقط یک بار روی «ثبت درخواست» بزنید." }
  };

  async function load(widget) {
    const action = widget.dataset.ncShield;
    const status = widget.querySelector("[data-nc-shield-status]");
    const question = widget.querySelector("[data-nc-shield-question]");
    const answer = widget.querySelector("[data-nc-shield-answer]");
    const refresh = widget.querySelector("[data-nc-shield-refresh]");
    const proceed = widget.querySelector("[data-nc-shield-continue]");
    refresh.disabled = true;
    if (proceed) proceed.disabled = true;
    widget.dataset.state = "loading";
    status.textContent = "در حال دریافت پرسش امنیتی…";
    widgets.set(action, { loading: true, widget });
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
      if (proceed) proceed.disabled = false;
      widget.dataset.state = "ready";
      status.textContent = labels[action].hint;
      status.dataset.state = "ready";
    } catch (error) {
      widgets.set(action, null);
      question.textContent = "پرسش فعلاً در دسترس نیست";
      status.textContent = error.message || "اتصال را بررسی کنید و دوباره تلاش کنید.";
      status.dataset.state = "error";
      widget.dataset.state = "error";
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

  function setStatus(widget, message, state) {
    const status = widget.querySelector("[data-nc-shield-status]");
    if (status) {
      status.textContent = message;
      status.dataset.state = state || "ready";
    }
  }

  async function continueAction(widget) {
    const action = widget.dataset.ncShield;
    const proceed = widget.querySelector("[data-nc-shield-continue]");
    try {
      getProof(action);
      if (action === "login") {
        setStatus(widget, "در حال ادامه ورود با Google…", "ready");
        if (window.NightCastLogin && typeof window.NightCastLogin.continueWithCaptcha === "function") {
          await window.NightCastLogin.continueWithCaptcha();
          return;
        }
        setStatus(widget, "سرویس ورود هنوز آماده نیست؛ چند لحظه دیگر تلاش کنید.", "error");
        return;
      }
      const form = widget.closest("form");
      if (!form) throw new Error("فرم مربوط به این عملیات پیدا نشد؛ صفحه را تازه‌سازی کنید.");
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else {
        const submit = form.querySelector('button[type="submit"],input[type="submit"]');
        if (submit) submit.click();
        else throw new Error("دکمه ثبت فرم پیدا نشد.");
      }
    } catch (error) {
      setStatus(widget, error.message || "لطفاً پاسخ را بررسی کنید و دوباره تلاش کنید.", "error");
    } finally {
      if (proceed) proceed.disabled = false;
    }
  }

  function init() {
    document.querySelectorAll("[data-nc-shield]").forEach(widget => {
      const action = widget.dataset.ncShield;
      if (!labels[action]) return;
      const title = document.createElement("div");
      title.className = "nc-shield-title";
      title.innerHTML = '<span class="nc-shield-emblem" aria-hidden="true">✦</span><span>تأیید امنیتی NightCast</span>';
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
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          const proceed = widget.querySelector("[data-nc-shield-continue]");
          if (action === "login" && proceed && !proceed.disabled) proceed.click();
          else if (action !== "login") {
            const form = widget.closest("form");
            if (form && typeof form.requestSubmit === "function") form.requestSubmit();
          }
        }
      });
      label.append(labelText, input);
      const actions = document.createElement("div");
      actions.className = "nc-shield-actions";
      let proceed = null;
      if (action === "login") {
        proceed = document.createElement("button");
        proceed.type = "button";
        proceed.className = "nc-shield-continue";
        proceed.dataset.ncShieldContinue = "";
        proceed.textContent = labels[action].action;
        proceed.addEventListener("click", () => continueAction(widget));
      }
      const refresh = document.createElement("button");
      refresh.type = "button";
      refresh.className = "nc-shield-refresh";
      refresh.dataset.ncShieldRefresh = "";
      refresh.textContent = "پرسش تازه";
      refresh.addEventListener("click", () => load(widget));
      if (proceed) actions.appendChild(proceed);
      actions.appendChild(refresh);
      const status = document.createElement("p");
      status.className = "nc-shield-status";
      status.dataset.ncShieldStatus = "";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      widget.replaceChildren(title, questionRow, label, actions, status);
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