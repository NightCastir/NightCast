
        (() => {
            "use strict";

            const bridge = window.NightCastPodcastBridge;
            if (!bridge) console.error("NightCast podcast bridge is unavailable.");
            const CONFIG = { API_BASE: bridge?.apiBase || "", LOGIN_PAGE: bridge?.loginPage || "/login" };
            const state = {
                get all() { return bridge?.getPodcasts?.() || []; },
                get current() { return bridge?.getCurrentPodcast?.() || null; }
            };
            const toast = message => bridge?.toast?.(message);
            const escapeHtml = value => bridge?.escapeHtml?.(value) ?? String(value ?? "");
            const getToken = () => bridge?.getToken?.() || "";
            const isLoggedIn = () => !!bridge?.isLoggedIn?.();
            const showDownloadLoginPrompt = callback => bridge?.showDownloadLoginPrompt?.(callback);

            const NC_MAP_LAT = 36.350303;
            const NC_MAP_LNG = 59.503020;
            const NC_ADDRESS = "مشهد، بلوار شاهد، شاهد ۲۵، پلاک ۲۱";
            const NC_DIRECTIONS =
                "https://www.google.com/maps/dir/?api=1&destination=36.350303%2C59.503020";

            function toPersianDigits(value) {
                return String(value ?? "").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
            }

            function bindAboutStats() {
                const sourceMap = [
                    ["podcastCount", "ncAboutPodcastCount"],
                    ["bookCount", "ncAboutBookCount"],
                    ["favoriteCount", "ncAboutFavoriteCount"]
                ];

                sourceMap.forEach(([sourceId, targetId]) => {
                    const source = document.getElementById(sourceId);
                    const target = document.getElementById(targetId);
                    if (!source || !target) return;

                    const sync = () => {
                        target.textContent = source.textContent || "۰";
                    };

                    sync();

                    const observer = new MutationObserver(sync);
                    observer.observe(source, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                });

                const latestSource = document.getElementById("latestPodcastTitle");
                const latestTargets = [
                    document.getElementById("ncOnAirLatestTitle")
                ].filter(Boolean);

                const syncLatest = () => {
                    const title = latestSource?.textContent?.trim();
                    latestTargets.forEach(target => {
                        target.textContent =
                            title && title !== "در حال آماده‌سازی..."
                                ? title
                                : "در حال آماده‌سازی آخرین اپیزود...";
                    });
                };

                syncLatest();

                if (latestSource) {
                    const observer = new MutationObserver(syncLatest);
                    observer.observe(latestSource, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                }
            }

            function bindLatestEpisodeActions() {
                const source = document.getElementById("latestCta");
                const targets = [
                    document.getElementById("ncAboutLatestCta"),
                    document.getElementById("ncOnAirCta")
                ].filter(Boolean);

                targets.forEach(target => {
                    target.addEventListener("click", () => {
                        if (source && !source.disabled) {
                            source.click();
                        }
                    });
                });
            }

            let ncLeafletLoadPromise = null;

            function ensureLeafletLoaded() {
                if (window.L) return Promise.resolve();
                if (ncLeafletLoadPromise) return ncLeafletLoadPromise;

                ncLeafletLoadPromise = new Promise((resolve, reject) => {
                    const stylesheet = document.querySelector('link[data-nc-leaflet-css]') ||
                        document.createElement("link");
                    stylesheet.rel = "stylesheet";
                    stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                    stylesheet.crossOrigin = "";
                    stylesheet.dataset.ncLeafletCss = "true";
                    const cssReady = stylesheet.sheet
                        ? Promise.resolve()
                        : new Promise((cssResolve, cssReject) => {
                            stylesheet.addEventListener("load", cssResolve, { once: true });
                            stylesheet.addEventListener("error", () => cssReject(new Error("Leaflet CSS could not be loaded")), { once: true });
                        });
                    if (!stylesheet.isConnected) document.head.appendChild(stylesheet);

                    const script = document.querySelector('script[data-nc-leaflet-js]') ||
                        document.createElement("script");
                    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    script.crossOrigin = "";
                    script.dataset.ncLeafletJs = "true";
                    const jsReady = window.L
                        ? Promise.resolve()
                        : new Promise((jsResolve, jsReject) => {
                            script.addEventListener("load", jsResolve, { once: true });
                            script.addEventListener("error", () => jsReject(new Error("Leaflet JavaScript could not be loaded")), { once: true });
                        });
                    if (!script.isConnected && !window.L) document.body.appendChild(script);

                    Promise.all([cssReady, jsReady]).then(resolve).catch(error => {
                        ncLeafletLoadPromise = null;
                        reject(error);
                    });
                });
                return ncLeafletLoadPromise;
            }

            async function initMap() {
                const mapEl = document.getElementById("ncMap");
                if (!mapEl || mapEl.dataset.ncMapInitialized === "true" ||
                    mapEl.dataset.ncMapInitialized === "loading") return;
                mapEl.dataset.ncMapInitialized = "loading";

                try {
                    await ensureLeafletLoaded();
                } catch (error) {
                    mapEl.dataset.ncMapInitialized = "false";
                    mapEl.innerHTML = `
                        <div class="empty"
                             style="height:100%;display:grid;place-items:center;margin:0">
                            نقشه در حال حاضر در دسترس نیست.
                        </div>
                    `;
                    return;
                }

                mapEl.dataset.ncMapInitialized = "true";
                const map = L.map(mapEl, {
                    center: [NC_MAP_LAT, NC_MAP_LNG],
                    zoom: 16,
                    zoomControl: true,
                    scrollWheelZoom: true,
                    attributionControl: true
                });
                // Keep a reference so the map can be resized after its hidden panel becomes visible.
                window.ncMapInstance = map;

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                    }
                ).addTo(map);

                const markerIcon = L.divIcon({
                    className: "",
                    html: `
                        <div class="nc-map-marker"
                             title="رادیو NightCast"
                             aria-hidden="true">
                            <i class="fa-solid fa-radio"></i>
                        </div>
                    `,
                    iconSize: [44, 44],
                    iconAnchor: [22, 40],
                    popupAnchor: [0, -39]
                });

                const marker = L.marker(
                    [NC_MAP_LAT, NC_MAP_LNG],
                    {
                        icon: markerIcon,
                        title: "رادیو NightCast",
                        alt: "موقعیت رادیو NightCast"
                    }
                ).addTo(map);

                marker.bindPopup(`
                    <div class="nc-map-popup-title">رادیو NightCast</div>
                    <div class="nc-map-popup-address">${NC_ADDRESS}</div>
                    <a class="btn btn-primary"
                       style="width:100%;margin-top:10px;min-height:38px;font-size:.7rem"
                       href="${NC_DIRECTIONS}"
                       target="_blank"
                       rel="noopener noreferrer">
                        <i class="fa-solid fa-route"></i>
                        مسیریابی
                    </a>
                `, {
                    closeButton: true,
                    autoPan: true
                }).openPopup();

                requestAnimationFrame(() => map.invalidateSize());

                let resizeTimer;
                window.addEventListener("resize", () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(
                        () => map.invalidateSize(),
                        120
                    );
                }, { passive: true });
            }

            function bindSectionNavigation() {
                const navLinks = [
                    ...document.querySelectorAll(".nc-nav .nav-link"),
                    ...document.querySelectorAll(".mobile-nav a"),
                    ...document.querySelectorAll(".nc-drawer-links a")
                ];
                const home = document.querySelector("main#home > .hero");
                const pages = [
                    home && { id: "home", element: home },
                    ...["podcasts", "about", "contact"].map(id => {
                        const element = document.getElementById(id);
                        return element ? { id, element } : null;
                    })
                ].filter(Boolean);
                if (!pages.length) return;

                const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
                const routePage = cleanPath === "/" || cleanPath === "/index.html" || cleanPath === "/podcasts"
                    ? "podcasts"
                    : cleanPath.split("/").pop();
                const hashPage = location.hash.slice(1);
                let activeId = ["podcasts", "about", "contact"].includes(hashPage)
                    ? hashPage
                    : (["podcasts", "about", "contact"].includes(routePage) ? routePage : "home");
                let animating = false;
                let queuedNavigation = null;
                let transitionTimer = 0;
                const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const drawer = document.getElementById("ncMobileDrawer");
                const backdrop = document.getElementById("ncDrawerBackdrop");
                const menuToggle = document.getElementById("ncMenuToggle");
                const drawerClose = document.getElementById("ncDrawerClose");
                let lastFocusedElement = null;

                function setActiveLinks(id) {
                    navLinks.forEach(link => {
                        const route = id === "podcasts" ? "/" : "/" + id;
                        const active = link.getAttribute("href") === route;
                        link.classList.toggle("active", active);
                        if (active) link.setAttribute("aria-current", "page");
                        else link.removeAttribute("aria-current");
                    });
                }

                function closeDrawer({ restoreFocus = false } = {}) {
                    if (!drawer || !backdrop) return;
                    drawer.classList.remove("is-open");
                    backdrop.classList.remove("is-open");
                    drawer.setAttribute("aria-hidden", "true");
                    if ("inert" in drawer) drawer.inert = true;
                    document.body.classList.remove("nc-drawer-open");
                    if (menuToggle) {
                        menuToggle.setAttribute("aria-expanded", "false");
                        menuToggle.setAttribute("aria-label", "باز کردن منوی سایت");
                        menuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
                    }
                    window.setTimeout(() => {
                        if (!drawer.classList.contains("is-open")) backdrop.hidden = true;
                    }, reducedMotion ? 0 : 300);
                    if (restoreFocus && lastFocusedElement?.focus) lastFocusedElement.focus();
                }

                function openDrawer() {
                    if (!drawer || !backdrop || window.matchMedia("(min-width: 801px)").matches) return;
                    lastFocusedElement = document.activeElement;
                    backdrop.hidden = false;
                    drawer.inert = false;
                    drawer.setAttribute("aria-hidden", "false");
                    document.body.classList.add("nc-drawer-open");
                    if (menuToggle) {
                        menuToggle.setAttribute("aria-expanded", "true");
                        menuToggle.setAttribute("aria-label", "بستن منوی سایت");
                        menuToggle.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
                    }
                    requestAnimationFrame(() => {
                        backdrop.classList.add("is-open");
                        drawer.classList.add("is-open");
                    });
                    const firstLink = drawer.querySelector("a");
                    window.setTimeout(() => firstLink?.focus(), reducedMotion ? 0 : 120);
                }

                function showPage(id, options = {}) {
                    const target = pages.find(page => page.id === id);
                    if (!target) return;
                    if (animating) {
                        queuedNavigation = { id, options };
                        return;
                    }
                    if (id === activeId && !options.force) {
                        setActiveLinks(id);
                        closeDrawer();
                        return;
                    }

                    const previous = pages.find(page => page.id === activeId);
                    const direction = pages.findIndex(page => page.id === id) >=
                        pages.findIndex(page => page.id === activeId) ? 1 : -1;
                    animating = true;
                    pages.forEach(page => {
                        page.element.classList.remove("nc-page-enter", "nc-page-leave", "nc-page-from-left", "nc-page-from-right");
                        page.element.setAttribute("aria-hidden", page.id === id ? "false" : "true");
                        if ("inert" in page.element) page.element.inert = page.id !== id;
                    });
                    if (previous && previous !== target) previous.element.classList.add("nc-page-leave");
                    target.element.hidden = false;
                    target.element.classList.add(direction > 0 ? "nc-page-from-right" : "nc-page-from-left");
                    void target.element.offsetWidth;
                    target.element.classList.add("nc-page-enter");
                    closeDrawer();

                    window.clearTimeout(transitionTimer);
                    transitionTimer = window.setTimeout(() => {
                        pages.forEach(page => {
                            const isCurrent = page.id === id;
                            page.element.hidden = !isCurrent;
                            page.element.classList.remove("nc-page-enter", "nc-page-leave", "nc-page-from-left", "nc-page-from-right");
                        });
                        activeId = id;
                        animating = false;
                        setActiveLinks(id);
                        const cleanRoute = id === "podcasts" ? "/" : "/" + id;
                        if (options.updateHash !== false && (location.pathname !== cleanRoute || location.hash)) {
                            history.pushState({ nightcastPage: id }, "", cleanRoute + location.search);
                        }
                        if (id === "contact") {
                            window.setTimeout(() => {
                                initMap();
                                if (window.ncMapInstance) window.ncMapInstance.invalidateSize();
                            }, 80);
                        }
                        if (options.scroll !== false) {
                            window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
                        }
                        if (queuedNavigation) {
                            const next = queuedNavigation;
                            queuedNavigation = null;
                            if (next.id !== activeId || next.options.force) showPage(next.id, next.options);
                        }
                    }, reducedMotion ? 0 : 380);
                }

                pages.forEach(page => {
                    const isCurrent = page.id === activeId;
                    page.element.hidden = !isCurrent;
                    page.element.classList.add("nc-page");
                    page.element.setAttribute("aria-hidden", isCurrent ? "false" : "true");
                    if ("inert" in page.element) page.element.inert = !isCurrent;
                });
                setActiveLinks(activeId);

                document.addEventListener("click", event => {
                    const link = event.target.closest("a[href]");
                    if (!link) return;
                    const url = new URL(link.href, location.href);
                    if (url.origin !== location.origin) return;
                    const cleanRoute = url.pathname.replace(/\/+$/, "") || "/";
                    const id = cleanRoute === "/" || cleanRoute === "/index.html" || cleanRoute === "/podcasts"
                        ? "podcasts"
                        : cleanRoute.slice(1);
                    if (!pages.some(page => page.id === id)) return;
                    event.preventDefault();
                    showPage(id);
                });

                if (menuToggle) menuToggle.addEventListener("click", () => {
                    drawer?.classList.contains("is-open") ? closeDrawer({ restoreFocus: true }) : openDrawer();
                });
                if (drawerClose) drawerClose.addEventListener("click", () => closeDrawer({ restoreFocus: true }));
                if (backdrop) backdrop.addEventListener("click", () => closeDrawer({ restoreFocus: true }));

                document.addEventListener("keydown", event => {
                    if (event.key === "Escape" && drawer?.classList.contains("is-open")) {
                        closeDrawer({ restoreFocus: true });
                    }
                    if (event.key === "Tab" && drawer?.classList.contains("is-open")) {
                        const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled])')];
                        if (!focusable.length) return;
                        const first = focusable[0];
                        const last = focusable[focusable.length - 1];
                        if (event.shiftKey && document.activeElement === first) {
                            event.preventDefault(); last.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                            event.preventDefault(); first.focus();
                        }
                    }
                });

                window.addEventListener("resize", () => {
                    if (window.matchMedia("(min-width: 801px)").matches) closeDrawer();
                }, { passive: true });

                const requestedSection = location.hash.slice(1);
                const initialId = ["podcasts", "about", "contact"].includes(requestedSection)
                    ? requestedSection
                    : routePage;
                if (pages.some(page => page.id === initialId)) {
                    activeId = "home";
                    showPage(initialId, { updateHash: false, scroll: false, force: true });
                } else {
                    setActiveLinks("home");
                }

                window.addEventListener("popstate", () => {
                    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
                    const hashSection = location.hash.slice(1);
                    const id = ["podcasts", "about", "contact"].includes(hashSection)
                        ? hashSection
                        : (currentPath === "/" || currentPath === "/index.html" || currentPath === "/podcasts"
                            ? "podcasts"
                            : currentPath.slice(1));
                    if (pages.some(page => page.id === id)) showPage(id, { updateHash: false, scroll: false, force: true });
                });
                window.NightCastNavigate = showPage;
            }

            function bindReveal() {
                const items = document.querySelectorAll(".nc-reveal");
                if (!items.length) return;

                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
                    !("IntersectionObserver" in window)) {
                    items.forEach(item => item.classList.add("is-visible"));
                    return;
                }

                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    });
                }, {
                    threshold: 0.08,
                    rootMargin: "0px 0px -30px 0px"
                });

                items.forEach(item => observer.observe(item));
            }


            /* =========================================================
               PODCAST COMMENTS
            ========================================================= */
            let activeCommentsPodcastId = null;
            let commentsRequestSequence = 0;

            function normalizeCommentForModeration(value) {
                return String(value || "").normalize("NFKC")
                    .replace(/[يى]/g, "ی").replace(/ك/g, "ک")
                    .replace(/[\u064B-\u065F\u0670]/g, "")
                    .replace(/[\u200c\u200d\uFEFF]/g, "").toLowerCase();
            }

            function hasInappropriateCommentLanguage(value) {
                const normalized = normalizeCommentForModeration(value);
                const words = normalized.match(/[\p{L}\p{N}]+/gu) || [];
                const blocked = new Set(["احمق","بی‌شعور","بیشعور","عوضی","حرومزاده","حرامزاده","کثافت","آشغال","اشغال","گوه","گوهی","کسکش","کصکش","کیر","کون","جنده","فاحشه","لاشی","بی‌ناموس","بیناموس","پفیوز","خفه‌شو","خفهشو","لعنتی","shit","fuck","bitch","asshole","motherfucker"]);
                return words.some(word => blocked.has(word)) || ["بی ادب","بی‌ادب","بی احترامی","بی‌احترامی","fuck you","son of a bitch"].some(phrase => normalized.includes(phrase));
            }

            function setCommentsNotice(message, type = "error") {
                const notice = document.getElementById("ncCommentsNotice");
                if (!notice) return;
                notice.textContent = message || "";
                notice.className = "nc-comments-notice" + (message ? " show " + type : "");
            }

            let podcastCardStatsRequest = 0;
            document.addEventListener("click", event => {
                if (event.target.closest('[data-action="favorite"]')) setTimeout(loadPodcastCardStats, 900);
            });
            async function loadPodcastCardStats() {
                const request = ++podcastCardStatsRequest;
                try {
                    const response = await fetch(CONFIG.API_BASE + "/public/podcasts/stats", {headers:{"Accept":"application/json"}, cache:"no-store"});
                    const data = await response.json().catch(() => ({}));
                    if (request !== podcastCardStatsRequest || !response.ok || !data.success) return;
                    const stats = data.stats || {};
                    document.querySelectorAll("[data-comment-count]").forEach(el => {
                        const item = stats[String(el.dataset.commentCount)] || {};
                        el.textContent = Number(item.comments || 0).toLocaleString("fa-IR");
                    });
                    document.querySelectorAll("[data-like-count]").forEach(el => {
                        const item = stats[String(el.dataset.likeCount)] || {};
                        el.textContent = Number(item.likes || 0).toLocaleString("fa-IR");
                    });
                } catch (error) { console.warn("Podcast card stats unavailable:", error); }
            }

                        window.NightCastLoadPodcastCardStats = loadPodcastCardStats;
            loadPodcastCardStats();

            function openPodcastComments(id) {
                // Do not assume the legacy catalogue state is in this script's lexical scope.
                // The bridge is the preferred source; the rendered card is a safe UI fallback.
                const podcasts = (typeof state !== "undefined" && Array.isArray(state.all))
                    ? state.all
                    : (window.NightCastPodcastBridge?.getPodcasts?.() || []);
                const podcastId = Number(id);
                const card = [...document.querySelectorAll(".podcast-card[data-id]")]
                    .find(item => Number(item.dataset.id) === podcastId);
                const podcast = podcasts.find(item => Number(item.id) === podcastId) || (card ? {
                    id: podcastId,
                    title: card.querySelector(".podcast-title")?.textContent?.trim() || "پادکست NightCast"
                } : null);
                if (!podcast) {
                    toast("پادکست مورد نظر پیدا نشد.");
                    return;
                }
                activeCommentsPodcastId = Number(podcast.id);
                const modal = document.getElementById("ncCommentsModal");
                const title = document.getElementById("ncCommentsPodcastTitle");
                const input = document.getElementById("ncCommentsInput");
                const list = document.getElementById("ncCommentsList");
                if (!modal || !list) return;
                if (title) title.textContent = podcast.title || "پادکست NightCast";
                if (input) {
                    input.value = "";
                    input.disabled = false;
                }
                const count = document.getElementById("ncCommentsCharCount");
                if (count) count.textContent = "0 / 1000";
                setCommentsNotice("");
                const submit = document.getElementById("ncCommentsSubmit");
                if (submit) submit.disabled = false;
                list.innerHTML = '<div class="nc-comments-loading">در حال دریافت دیدگاه‌ها…</div>';
                modal.classList.add("open");
                modal.setAttribute("aria-hidden", "false");
                document.body.classList.add("nc-comments-open");
                loadPodcastComments(activeCommentsPodcastId);
                if (input) setTimeout(() => input.focus({preventScroll:true}), 120);
            }

            window.NightCastOpenPodcastComments = openPodcastComments;


            function closePodcastComments() {
                const modal = document.getElementById("ncCommentsModal");
                if (!modal) return;
                modal.classList.remove("open");
                modal.setAttribute("aria-hidden", "true");
                document.body.classList.remove("nc-comments-open");
                activeCommentsPodcastId = null;
            }

            function formatCommentDate(value) {
                if (!value) return "";
                const date = new Date(String(value).replace(" ", "T") + (String(value).endsWith("Z") ? "" : "Z"));
                if (Number.isNaN(date.getTime())) return "";
                try { return new Intl.DateTimeFormat("fa-IR", {dateStyle:"medium", timeStyle:"short"}).format(date); }
                catch { return date.toLocaleString(); }
            }

            function renderPodcastComments(comments) {
                const list = document.getElementById("ncCommentsList");
                if (!list) return;
                if (!Array.isArray(comments) || !comments.length) {
                    list.innerHTML = '<div class="nc-comments-empty"><i class="fa-regular fa-comments" aria-hidden="true"></i>هنوز دیدگاهی ثبت نشده است.<br>اولین نفری باشید که نظرش را با دیگران به اشتراک می‌گذارد.</div>';
                    return;
                }
                list.innerHTML = comments.map(comment => '<article class="nc-comment-item"><div class="nc-comment-meta"><span class="nc-comment-author">' + escapeHtml(comment.author_name || "شنونده NightCast") + '</span><time class="nc-comment-date">' + escapeHtml(formatCommentDate(comment.created_at)) + '</time></div><p class="nc-comment-body">' + escapeHtml(comment.body || "") + '</p></article>').join("");
            }

            async function loadPodcastComments(id) {
                const requestId = ++commentsRequestSequence;
                const list = document.getElementById("ncCommentsList");
                try {
                    const response = await fetch(CONFIG.API_BASE + "/public/podcasts/" + encodeURIComponent(id) + "/comments", {headers:{"Accept":"application/json"}});
                    const data = await response.json().catch(() => ({}));
                    if (requestId !== commentsRequestSequence || Number(activeCommentsPodcastId) !== Number(id)) return;
                    if (!response.ok || !data.success) throw new Error(data.message || "دریافت دیدگاه‌ها ممکن نشد.");
                    renderPodcastComments(data.comments || []);
                    loadPodcastCardStats();
                } catch (error) {
                    if (requestId !== commentsRequestSequence) return;
                    if (list) list.innerHTML = '<div class="nc-comments-empty"><i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>' + escapeHtml(error.message || "دریافت دیدگاه‌ها ممکن نشد.") + '<br>اتصال را بررسی کنید و دوباره پنجره را باز کنید.</div>';
                }
            }

            async function submitPodcastComment(event) {
                event.preventDefault();
                const id = activeCommentsPodcastId;
                const input = document.getElementById("ncCommentsInput");
                const submit = document.getElementById("ncCommentsSubmit");
                const body = String(input?.value || "").trim();
                if (!id) return;
                if (!isLoggedIn()) {
                    setCommentsNotice("برای ثبت دیدگاه باید وارد حساب کاربری خود شوید. دیدگاه‌های دیگران را همچنان می‌توانید بخوانید.", "error");
                    showDownloadLoginPrompt(() => {
                        const next = location.pathname + location.search + location.hash;
                        location.href = CONFIG.LOGIN_PAGE + "?next=" + encodeURIComponent(next);
                    });
                    return;
                }
                if (!body) {
                    setCommentsNotice("لطفاً ابتدا متن دیدگاه خود را بنویسید.", "error");
                    input?.focus();
                    return;
                }
                if (hasInappropriateCommentLanguage(body)) {
                    setCommentsNotice("لطفاً محترمانه صحبت کنید. واژه‌های توهین‌آمیز را اصلاح کنید و دوباره بفرستید.", "error");
                    input?.focus();
                    return;
                }
                if (submit) {
                    submit.disabled = true;
                    submit.querySelector("span").textContent = "در حال ثبت…";
                }
                setCommentsNotice("");
                try {
                    const response = await fetch(CONFIG.API_BASE + "/public/podcasts/" + encodeURIComponent(id) + "/comments", {
                        method:"POST",
                        headers:{"Accept":"application/json","Content-Type":"application/json","Authorization":"Bearer " + getToken()},
                        body:JSON.stringify({body})
                    });
                    const data = await response.json().catch(() => ({}));
                    if (response.status === 401 || data.code === "LOGIN_REQUIRED") {
                        setCommentsNotice("نشست کاربری شما معتبر نیست. لطفاً دوباره وارد شوید.", "error");
                        return;
                    }
                    if (!response.ok || !data.success) throw new Error(data.message || "ثبت دیدگاه انجام نشد.");
                    input.value = "";
                    const count = document.getElementById("ncCommentsCharCount");
                    if (count) count.textContent = "0 / 1000";
                    setCommentsNotice("دیدگاه شما با موفقیت ثبت شد.", "success");
                    await loadPodcastComments(id);
                } catch (error) {
                    setCommentsNotice(error.message || "ثبت دیدگاه انجام نشد. دوباره تلاش کنید.", "error");
                } finally {
                    if (submit) {
                        submit.disabled = false;
                        submit.querySelector("span").textContent = "ثبت دیدگاه";
                    }
                }
            }

            function bindCommentsUI() {
                const modal = document.getElementById("ncCommentsModal");
                const close = document.getElementById("ncCommentsClose");
                const form = document.getElementById("ncCommentsForm");
                const input = document.getElementById("ncCommentsInput");
                const count = document.getElementById("ncCommentsCharCount");
                const submit = document.getElementById("ncCommentsSubmit");
                const nowComments = document.getElementById("ncNowComments");
                close?.addEventListener("click", closePodcastComments);
                modal?.addEventListener("click", event => { if (event.target === modal) closePodcastComments(); });
                form?.addEventListener("submit", submitPodcastComment);
                nowComments?.addEventListener("click", () => {
                    const currentPodcast = typeof state !== "undefined"
                        ? state.current
                        : window.NightCastPodcastBridge?.getCurrentPodcast?.();
                    if (currentPodcast) openPodcastComments(currentPodcast.id);
                    else toast("ابتدا یک پادکست انتخاب کنید.");
                });
                input?.addEventListener("input", () => {
                    const value = input.value;
                    if (count) count.textContent = value.length + " / 1000";
                    if (hasInappropriateCommentLanguage(value)) {
                        setCommentsNotice("لطفاً محترمانه صحبت کنید؛ این متن شامل واژه نامناسب است و تا اصلاح آن ثبت نمی‌شود.", "error");
                        if (submit) submit.disabled = true;
                    } else {
                        setCommentsNotice("");
                        if (submit) submit.disabled = false;
                    }
                });
                document.addEventListener("keydown", event => {
                    if (event.key === "Escape" && modal?.classList.contains("open")) closePodcastComments();
                });
            }


            function initNightCastEnhancement() {
                bindAboutStats();
                bindLatestEpisodeActions();
                bindCommentsUI();
                bindSectionNavigation();
                bindReveal();
            }

            if (document.readyState === "loading") {
                document.addEventListener(
                    "DOMContentLoaded",
                    initNightCastEnhancement,
                    { once: true }
                );
            } else {
                initNightCastEnhancement();
            }
        })();
    