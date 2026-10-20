/* NightCast Theme System: global CSS theme tokens, persistent preference, and themed loader. */
(() => {
  "use strict";
  const STORAGE_KEY = "nightcast-theme";
  const DEFAULT_THEME = "midnight-cosmos";
  const themes = {
    "midnight-cosmos": { name:"Midnight Cosmos", fa:"کیهان نیمه‌شب", subtitle:"جهان شنیداری در دل کیهان", image:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=78", colors:["#050816","#8B5CF6","#38BDF8","#67E8F9"] },
    "moonlight": { name:"Moonlight", fa:"مهتاب", subtitle:"روشن، مینیمال و آرام", image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1600&q=78", colors:["#F7F8FC","#6366F1","#38BDF8","#8B5CF6"] },
    "aurora": { name:"Aurora", fa:"شفق قطبی", subtitle:"نورهای زنده در آسمان شب", image:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=78", colors:["#071410","#34D399","#2DD4BF","#A78BFA"] },
    "studio-noir": { name:"Studio Noir", fa:"استودیوی سیاه", subtitle:"حس استودیوی حرفه‌ای رادیو", image:"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=78", colors:["#101112","#F59E0B","#FBBF24","#4ADE80"] },
    "deep-ocean": { name:"Deep Ocean", fa:"اقیانوس عمیق", subtitle:"آرامش آبی و موج‌های نرم", image:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=78", colors:["#061826","#0EA5E9","#22D3EE","#2DD4BF"] },
    "royal-gold": { name:"Royal Gold", fa:"طلایی سلطنتی", subtitle:"هویت لوکس و ظریف", image:"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=78", colors:["#0B0B0D","#D4AF37","#F3D98B","#A67C36"] },
    "neon-city": { name:"Neon City", fa:"شهر نئون", subtitle:"انرژی موسیقی و نورهای شهری", image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=78", colors:["#100817","#F472B6","#22D3EE","#C084FC"] },
    "persian-heritage": { name:"Persian Heritage", fa:"میراث ایرانی", subtitle:"لاجورد، فیروزه و طلای ایرانی", image:"https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=72", loader:"https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1600&q=78", colors:["#101A32","#2CB7A5","#4263EB","#D6AD60"] },
  };
  const root = document.documentElement;
  const safeRead = () => { try { const value = localStorage.getItem(STORAGE_KEY); return themes[value] ? value : DEFAULT_THEME; } catch (_) { return DEFAULT_THEME; } };
  let currentTheme = safeRead();
  let progress = 4;
  let catalogReady = false;
  let fontsReady = false;
  let loaderDone = false;
  const loader = () => document.getElementById("nc-entry-loader");
  function setProgress(value, status) {
    progress = Math.max(progress, Math.min(100, Math.round(value)));
    const fill = document.getElementById("nc-entry-progress-fill");
    const track = document.querySelector("#nc-entry-loader .nc-entry-track");
    const percent = document.getElementById("nc-entry-percent");
    const statusNode = document.getElementById("nc-entry-status");
    if (fill) fill.style.width = progress + "%";
    if (track) track.setAttribute("aria-valuenow", String(progress));
    if (percent) percent.textContent = progress.toLocaleString("fa-IR") + "٪";
    if (statusNode && status) statusNode.firstChild ? statusNode.firstChild.textContent = status + " " : statusNode.textContent = status;
  }
  function applyTheme(id, persist = true) {
    const key = themes[id] ? id : DEFAULT_THEME;
    const theme = themes[key];
    currentTheme = key;
    root.dataset.theme = key;
    root.style.colorScheme = key === "moonlight" ? "light" : "dark";
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute("content", theme.colors[0]));
    const activeLoader = loader();
    if (activeLoader) {
      activeLoader.dataset.theme = key;
      activeLoader.style.setProperty("--nc-loader-image", 'url("' + theme.loader + '")');
    }
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      const selected = button.dataset.themeChoice === key;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      const selectedLabel = button.querySelector(".nc-theme-selected");
      if (selectedLabel) selectedLabel.setAttribute("aria-hidden", selected ? "false" : "true");
    });
    const current = document.getElementById("ncThemeCurrentName");
    if (current) current.textContent = theme.fa;
    const profileButton = document.getElementById("profileSettingsBtn");
    if (profileButton) {
      const small = profileButton.querySelector("small");
      if (small) small.textContent = "تم فعال: " + theme.fa + " · تغییر ظاهر سایت";
    }
    document.dispatchEvent(new CustomEvent("nightcast:themechange", { detail: { id:key, theme } }));
    if (persist) { try { localStorage.setItem(STORAGE_KEY, key); } catch (_) {} }
    return key;
  }
  function markCatalogReady() {
    catalogReady = true;
    setProgress(88, "آرشیو آماده شد؛ در حال نهایی‌سازی تجربه");
    maybeFinishLoader();
  }
  function maybeFinishLoader() {
    if (loaderDone || !catalogReady) return;
    if (progress < 92) setProgress(92, "در حال آماده‌سازی رابط کاربری");
    Promise.resolve(document.fonts && document.fonts.ready).catch(() => undefined).then(() => {
      fontsReady = true;
      if (!catalogReady || loaderDone) return;
      setProgress(97, "تقریباً آماده‌اید");
      window.setTimeout(() => {
        if (loaderDone) return;
        loaderDone = true;
        setProgress(100, "آماده‌ی شنیدن");
        const activeLoader = loader();
        if (activeLoader) {
          activeLoader.classList.add("is-hidden");
          window.setTimeout(() => activeLoader.remove(), 480);
        }
        document.body.removeAttribute("aria-busy");
        window.dispatchEvent(new CustomEvent("nightcast:loader-complete"));
      }, 140);
    });
  }
  let transitionBusy = false;
  let transitionToken = 0;
  let transitionInertState = [];
  function ensureTransitionOverlay() {
    let el = document.getElementById("nc-theme-transition");
    if (el) return el;
    if (!document.getElementById("nc-theme-transition-styles")) {
      const style = document.createElement("style");
      style.id = "nc-theme-transition-styles";
      style.textContent = `
        #nc-theme-transition{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:color-mix(in srgb,var(--nc-theme-bg,#050816) 91%,transparent);backdrop-filter:blur(18px);color:var(--nc-theme-text,#fff);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s ease,visibility .22s ease}
        #nc-theme-transition.is-active{opacity:1;visibility:visible;pointer-events:auto}
        #nc-theme-transition .nct-card{width:min(390px,92vw);padding:28px 24px;border:1px solid var(--nc-theme-border,rgba(255,255,255,.2));border-radius:24px;background:var(--nc-theme-surface,rgba(8,15,35,.95));box-shadow:0 28px 100px rgba(0,0,0,.4);text-align:center}
        #nc-theme-transition .nct-orbit{width:76px;height:76px;margin:0 auto 18px;border:1px solid var(--nc-theme-primary,#8b5cf6);border-right-color:var(--nc-theme-secondary,#38bdf8);border-radius:50%;display:grid;place-items:center;animation:nct-spin 1.2s linear infinite}
        #nc-theme-transition .nct-core{display:block;width:44px;height:44px;max-width:62%;max-height:62%;object-fit:contain;border-radius:10px;background:transparent;box-shadow:0 0 24px var(--nc-theme-glow,rgba(139,92,246,.32));animation:none}
        #nc-theme-transition .nct-title{font:800 19px/1.7 Vazirmatn,sans-serif;margin:0 0 5px}
        #nc-theme-transition .nct-status{font:500 12px/1.9 Vazirmatn,sans-serif;color:var(--nc-theme-muted,#b8c4dc);margin:0 0 16px}
        #nc-theme-transition .nct-track{height:7px;overflow:hidden;border-radius:999px;background:color-mix(in srgb,var(--nc-theme-primary,#8b5cf6) 15%,transparent);border:1px solid var(--nc-theme-border,rgba(255,255,255,.2))}
        #nc-theme-transition .nct-fill{height:100%;width:0;display:block;border-radius:inherit;background:linear-gradient(90deg,var(--nc-theme-primary,#8b5cf6),var(--nc-theme-secondary,#38bdf8),var(--nc-theme-accent,#67e8f9));transition:width .18s ease}
        #nc-theme-transition .nct-percent{display:block;margin-top:9px;font:800 12px/1.7 Vazirmatn,sans-serif;color:var(--nc-theme-secondary,#38bdf8);font-variant-numeric:tabular-nums}
        @keyframes nct-spin{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){#nc-theme-transition *,#nc-theme-transition{animation:none!important;transition:none!important}}
      `;
      document.head.append(style);
    }
    el = document.createElement("div");
    el.id = "nc-theme-transition";
    el.setAttribute("role","status");
    el.setAttribute("aria-live","polite");
    el.setAttribute("aria-label","در حال اعمال تم جدید");
    el.innerHTML = '<div class="nct-card"><div class="nct-orbit" aria-hidden="true"><img class="nct-core" src="/assets/icons/icon-192.png" alt="" width="44" height="44" decoding="async"></div><h2 class="nct-title">در حال تغییر فضای NightCast</h2><p class="nct-status">در حال هماهنگ‌سازی رنگ‌ها، پنل‌ها و تصاویر…</p><div class="nct-track" role="progressbar" aria-label="پیشرفت تغییر تم" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="nct-fill"></span></div><span class="nct-percent">۰٪</span></div>';
    document.body.append(el);
    return el;
  }
  const waitFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  function setTransitionProgress(el, value, status) {
    const n = Math.max(0, Math.min(100, Math.round(value)));
    const fill = el.querySelector(".nct-fill"), track = el.querySelector('[role="progressbar"]'), percent = el.querySelector(".nct-percent"), message = el.querySelector(".nct-status");
    if (fill) fill.style.width = n + "%";
    if (track) track.setAttribute("aria-valuenow", String(n));
    if (percent) percent.textContent = n.toLocaleString("fa-IR") + "٪";
    if (message && status) message.textContent = status;
  }
  function imageSettled(url, timeout = 8500) {
    return new Promise(resolve => {
      if (!url || url.startsWith("data:") || url.startsWith("blob:")) return resolve(true);
      const image = new Image();
      let done = false;
      const finish = ok => { if (done) return; done = true; clearTimeout(timer); image.onload = image.onerror = null; resolve(ok); };
      const timer = setTimeout(() => finish(false), timeout);
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = url;
      if (image.complete) finish(image.naturalWidth > 0);
    });
  }
  async function transitionToTheme(id) {
    const key = themes[id] ? id : DEFAULT_THEME;
    if (key === currentTheme || transitionBusy) return currentTheme;
    transitionBusy = true;
    const token = ++transitionToken;
    const overlay = ensureTransitionOverlay();
    const oldBusy = document.body.getAttribute("aria-busy");
    document.body.setAttribute("aria-busy","true");
    transitionInertState = [...document.body.children].filter(node => node !== overlay && !/^(SCRIPT|STYLE|LINK)$/.test(node.tagName)).map(node => ({node, inert:node.inert}));
    transitionInertState.forEach(entry => { entry.node.inert = true; });
    overlay.classList.add("is-active");
    overlay.querySelector(".nct-card").setAttribute("aria-busy","true");
    setTransitionProgress(overlay, 3, "در حال اعمال پالت رنگ و ساختار تم…");
    applyTheme(key, true);
    await waitFrame();
    if (token !== transitionToken) return currentTheme;
    setTransitionProgress(overlay, 12, "در حال بررسی تصاویر و پس‌زمینه‌ها…");
    const urls = new Set([themes[key].image, themes[key].loader]);
    document.querySelectorAll("img").forEach(img => {
      const src = img.currentSrc || img.src;
      if (src) urls.add(src);
    });
    // Collect actual CSS background images after the new theme tokens have been applied.
    document.querySelectorAll("body,main,header,footer,section,article,aside,button,[class*='card'],[class*='panel'],[class*='planet']").forEach(node => {
      const bg = getComputedStyle(node).backgroundImage || "";
      for (const match of bg.matchAll(/url\(["']?(.*?)["']?\)/g)) {
        try { urls.add(new URL(match[1], location.href).href); } catch (_) {}
      }
    });
    const list = [...urls].filter(Boolean);
    let settled = 0;
    const tasks = list.map(url => imageSettled(url).then(ok => {
      settled++;
      const pct = 12 + Math.round((settled / Math.max(1,list.length)) * 78);
      setTransitionProgress(overlay, pct, ok ? "در حال بارگذاری تصاویر و جزئیات تم…" : "در حال آماده‌سازی موارد باقی‌مانده…");
    }));
    await Promise.all(tasks);
    await Promise.resolve(document.fonts && document.fonts.ready).catch(() => undefined);
    await waitFrame();
    setTransitionProgress(overlay, 96, "در حال نهایی‌سازی چیدمان و دسترس‌پذیری…");
    await new Promise(resolve => setTimeout(resolve, 180));
    setTransitionProgress(overlay, 100, "تم جدید آماده است");
    await new Promise(resolve => setTimeout(resolve, 220));
    overlay.classList.remove("is-active");
    overlay.querySelector(".nct-card").removeAttribute("aria-busy");
    transitionInertState.forEach(entry => { entry.node.inert = entry.inert; });
    transitionInertState = [];
    document.body.setAttribute("aria-busy", oldBusy === null ? "false" : oldBusy);
    transitionBusy = false;
    document.dispatchEvent(new CustomEvent("nightcast:theme-transition-complete", {detail:{id:key}}));
    return key;
  }
  function initSelector() {
    const settingsButton = document.getElementById("profileSettingsBtn");
    const profileLogged = document.getElementById("profileLogged");
    const settingsPanel = document.getElementById("profileThemeSettings");
    const backButton = document.getElementById("ncThemeBack");
    if (settingsButton && profileLogged && settingsPanel && !settingsButton.dataset.themeBound) {
      settingsButton.dataset.themeBound = "true";
      settingsButton.addEventListener("click", () => {
        profileLogged.hidden = true;
        settingsPanel.hidden = false;
        applyTheme(currentTheme, false);
        const first = settingsPanel.querySelector("[data-theme-choice]");
        if (first) window.setTimeout(() => first.focus({ preventScroll:true }), 30);
      });
    }
    if (backButton && profileLogged && settingsPanel) backButton.addEventListener("click", () => {
      settingsPanel.hidden = true;
      profileLogged.hidden = false;
      settingsButton && settingsButton.focus({ preventScroll:true });
    });
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      if (button.dataset.themeBound) return;
      button.dataset.themeBound = "true";
      button.addEventListener("click", () => {
        transitionToTheme(button.dataset.themeChoice);
        const status = document.getElementById("ncThemeSelectionStatus");
        const theme = themes[currentTheme];
        if (status) status.textContent = "تم " + theme.fa + " فعال شد.";
        button.classList.remove("nc-theme-just-selected");
        void button.offsetWidth;
        button.classList.add("nc-theme-just-selected");
      });
    });
  }
  function initLoader() {
    const el = loader();
    if (!el) return;
    el.dataset.theme = currentTheme;
    el.style.setProperty("--nc-loader-image", 'url("' + themes[currentTheme].loader + '")');
    setProgress(8, "در حال راه‌اندازی NightCast");
    const resources = performance.getEntriesByType("resource");
    const count = Math.max(1, resources.length);
    setProgress(Math.min(30, 10 + Math.round(count * .45)), "در حال آماده‌سازی فایل‌های سایت");
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver(list => {
          const seen = list.getEntries().length;
          setProgress(Math.min(55, progress + Math.max(1, Math.round(seen * .35))), "فایل‌های اصلی دریافت شدند");
        });
        observer.observe({ type:"resource", buffered:true });
      } catch (_) {}
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fontsReady = true; setProgress(Math.max(progress, 62), "آماده‌سازی قلم و رابط کاربری"); }).catch(() => {});
    window.addEventListener("nightcast:catalog-ready", markCatalogReady, { once:true });
    // If the app fails before initialization, release the screen with an honest fallback state.
    window.setTimeout(() => {
      if (catalogReady || loaderDone) return;
      setProgress(Math.max(progress, 72), "اتصال کامل نشد؛ نمایش نسخه در دسترس");
      catalogReady = true;
      maybeFinishLoader();
    }, 12000);
  }
  function init() {
    applyTheme(currentTheme, false);
    initSelector();
    initLoader();
  }
  window.NightCastThemes = Object.freeze({ list:() => Object.entries(themes).map(([id, value]) => ({id, ...value})), getCurrent:() => currentTheme, apply:applyTheme, transition:transitionToTheme, isTransitioning:() => transitionBusy });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true }); else init();
})();