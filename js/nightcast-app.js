

        (() => {

            "use strict";


            /* =========================================================
               CONFIG
            ========================================================= */

            const CONFIG = Object.freeze({

                FEED_URL:
                    "/users/data/podcasts.json",

                API_BASE:
                    "https://nightcast-shield.tomasgermany2580.workers.dev/api/v1",

                CACHE_KEY:
                    "NightCastPodcastCache",

                FAVORITE_KEY:
                    "NightCastFavorite",

                TOKEN_KEY:
                    "NightCastToken",

                USER_KEY:
                    "NightCastUser",

                LOGIN_PAGE:
                    "/login",

                PROFILE_PAGE:
                    "profile.html",

                SOCIALS: [

                    {
                        key: "aparat",
                        label: "آپارات",
                        icon: "fa-solid fa-comments",
                        url: "https://www.aparat.com/NightCast"
                    },

                    {
                        key: "instagram",
                        label: "اینستاگرام",
                        icon: "fa-brands fa-instagram",
                        url: "https://www.instagram.com/NightCast.ir"
                    },

                    {
                        key: "telegram",
                        label: "تلگرام",
                        icon: "fa-brands fa-telegram",
                        url: "https://t.me/NightCast_ir"
                    },

                    {
                        key: "youtube",
                        label: "یوتیوب",
                        icon: "fa-brands fa-youtube",
                        url: "https://www.youtube.com/@NightCast-r5e"
                    },

                    {
                        key: "eitaa",
                        label: "ایتا",
                        icon: "fa-solid fa-paper-plane",
                        url: "https://eitaa.com/NightCast"
                    },

                    {
                        key: "soroush",
                        label: "سروش",
                        icon: "fa-solid fa-paper-plane",
                        url: "https://splus.ir/NightCast"
                    }

                ]

            });


            /* =========================================================
               DOM
            ========================================================= */

            const $ =
                s => document.querySelector(s);

            const $$ =
                s => [...document.querySelectorAll(s)];


            const els = {

                grid:
                    $("#podcastGrid"),

                search:
                    $("#searchInput"),

                clear:
                    $("#searchClear"),

                count:
                    $("#podcastCount"),

                books:
                    $("#bookCount"),

                favCount:
                    $("#favoriteCount"),

                latestTitle:
                    $("#latestPodcastTitle"),

                latestPlay:
                    $("#latestPodcastPlay"),

                latestCta:
                    $("#latestCta"),

                player:
                    $("#playerBar"),

                audio:
                    $("#audioPlayer"),

                playerTitle:
                    $("#playerTitle"),

                playerAuthor:
                    $("#playerAuthor"),

                playerCover:
                    $("#playerCover"),

                play:
                    $("#playButton"),

                playIcon:
                    $("#playIcon"),

                prev:
                    $("#prevBtn"),

                next:
                    $("#nextBtn"),

                progress:
                    $("#progressBar"),

                current:
                    $("#currentTimeBox"),

                duration:
                    $("#durationBox"),

                volume:
                    $("#volumeBar"),

                toast:
                    $("#toast"),

                socialWrap:
                    $("#socialWrap"),

                socialToggle:
                    $("#socialToggle"),

                socialMenu:
                    $("#socialMenu"),

                loginBtn:
                    $("#loginBtn"),

                userAvatar:
                    $("#userAvatar")

            };


            /* =========================================================
               STATE
            ========================================================= */

    
            let state = {

                all: [],

                visible: [],

                renderedCount: 0,

                page: 1,

                pageSize: 6,

                current: null,

                query: "",

                searchTimer: null,

                toastTimer: null

            };

            // Explicit bridge for later independent inline scripts (comments/map UI).
            // These scripts do not share this IIFE's lexical scope.
            window.NightCastPodcastBridge = Object.freeze({
                getPodcasts: () => state.all,
                getCurrentPodcast: () => state.current,
                apiBase: CONFIG.API_BASE,
                loginPage: CONFIG.LOGIN_PAGE,
                getToken: () => getToken(),
                isLoggedIn: () => isLoggedIn(),
                toast: message => toast(message),
                escapeHtml: value => escapeHtml(value),
                showDownloadLoginPrompt: callback => showDownloadLoginPrompt(callback)
            });


            document.body.classList.remove("player-open");

            // Mobile/tablet gesture: swipe the mini-player from left to right to pause and dismiss it.
            // Interactive controls and the seek/volume sliders retain their normal touch behavior.
            (() => {
                const player = els.player;
                if (!player || player.dataset.ncSwipeDismissBound === "1") return;
                player.dataset.ncSwipeDismissBound = "1";
                player.setAttribute("aria-hidden", player.classList.contains("show") ? "false" : "true");
                let gesture = null;
                const isTouchLayout = () => window.matchMedia("(max-width: 1024px)").matches;
                const resetDrag = () => {
                    player.classList.remove("nc-player-dragging");
                    player.style.transform = "";
                    player.style.opacity = "";
                };
                const dismissPlayer = () => {
                    try { els.audio?.pause(); } catch (_) {}
                    player.classList.remove("show");
                    player.setAttribute("aria-hidden", "true");
                    document.body.classList.remove("player-open");
                    resetDrag();
                    updateCardPlaying();
                };
                player.addEventListener("pointerdown", event => {
                    if (!isTouchLayout() || event.pointerType !== "touch" || event.isPrimary === false) return;
                    if (event.target instanceof Element && event.target.closest("button,input,select,textarea,a,[role='button']")) return;
                    gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, dx: 0, dy: 0 };
                }, { passive: true });
                player.addEventListener("pointermove", event => {
                    if (!gesture || event.pointerId !== gesture.id || !isTouchLayout()) return;
                    gesture.dx = event.clientX - gesture.x;
                    gesture.dy = event.clientY - gesture.y;
                    if (gesture.dx > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2) {
                        player.classList.add("nc-player-dragging");
                        player.style.transform = "translateX(" + Math.min(gesture.dx, window.innerWidth) + "px)";
                        player.style.opacity = String(Math.max(.25, 1 - gesture.dx / Math.max(window.innerWidth * .85, 1)));
                    }
                }, { passive: true });
                const finishGesture = event => {
                    if (!gesture || (event && event.pointerId !== gesture.id)) return;
                    const shouldDismiss = isTouchLayout() && gesture.dx >= 90 && gesture.dx > Math.abs(gesture.dy) * 1.35;
                    gesture = null;
                    if (shouldDismiss) dismissPlayer();
                    else resetDrag();
                };
                player.addEventListener("pointerup", finishGesture, { passive: true });
                player.addEventListener("pointercancel", () => { gesture = null; resetDrag(); }, { passive: true });
                player.addEventListener("lostpointercapture", () => { gesture = null; resetDrag(); }, { passive: true });
            })();



            const placeholder = "/assets/icons/icon-512.png";
            const localizeCover = value => {
                const raw = String(value || "");
                try {
                    const url = new URL(raw, window.location.href);
                    if (url.hostname === "raw.githubusercontent.com" && url.pathname.startsWith("/NightCastir/NightCast-Media/main/covers/")) {
                        const filename = decodeURIComponent(url.pathname.split("/").pop());
                        if (/^[A-Za-z0-9._-]+$/.test(filename)) return "/assets/podcasts/covers/" + filename;
                    }
                } catch (_) {}
                return raw;
            };


            /* =========================================================
               HELPERS
            ========================================================= */

            function escapeHtml(v) {

                return String(v ?? "")

                    .replace(/&/g, "&amp;")

                    .replace(/</g, "&lt;")

                    .replace(/>/g, "&gt;")

                    .replace(/"/g, "&quot;")

                    .replace(/'/g, "&#039;");

            }


            function normalizePodcastRecord(record) {
                const p = record && typeof record === "object" ? { ...record } : {};
                // D1 currently stores description, summary and transcript. Support
                // the older/API aliases too, without dropping fields during rendering.
                p.short_description = String(p.short_description || p.description || "").trim();
                p.long_description = String(p.long_description || p.transcript || "").trim();
                p.description = String(p.description || p.short_description || "").trim();
                p.transcript = String(p.transcript || p.long_description || "").trim();
                p.summary = String(p.summary || "").trim();
                return p;
            }


            function formatTime(sec) {

                sec = Number(sec);

                if (
                    !Number.isFinite(sec) ||
                    sec < 0
                ) {
                    return "00:00";
                }

                const h =
                    Math.floor(sec / 3600);

                const m =
                    Math.floor((sec % 3600) / 60);

                const s =
                    Math.floor(sec % 60);


                if (h) {

                    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

                }


                return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

            }


            function showDownloadLoginPrompt(onContinue) {
                // Use a polished in-page dialog instead of an abrupt redirect.
                let dialog = document.getElementById("ncDownloadLoginDialog");
                if (!dialog) {
                    dialog = document.createElement("div");
                    dialog.id = "ncDownloadLoginDialog";
                    dialog.className = "nc-download-auth";
                    dialog.setAttribute("role", "dialog");
                    dialog.setAttribute("aria-modal", "true");
                    dialog.setAttribute("aria-labelledby", "ncDownloadAuthTitle");
                    dialog.innerHTML = `
                        <div class="nc-download-auth-card">
                            <div class="nc-download-auth-icon"><i class="fa-solid fa-headphones"></i></div>
                            <button type="button" class="nc-download-auth-close" aria-label="بستن پیام"><i class="fa-solid fa-xmark"></i></button>
                            <span class="nc-download-auth-kicker">عضویت در NightCast</span>
                            <h2 id="ncDownloadAuthTitle">این پادکست منتظر شماست!</h2>
                            <p>برای ذخیره و دانلود پادکست‌ها، لطفاً وارد حساب کاربری‌تان شوید یا به خانوادهٔ NightCast بپیوندید.</p>
                            <div class="nc-download-auth-actions">
                                <button type="button" class="nc-download-auth-primary" data-auth-continue><i class="fa-solid fa-arrow-right-to-bracket"></i> ورود به حساب کاربری</button>
                                <button type="button" class="nc-download-auth-secondary" data-auth-cancel>فعلاً نه</button>
                            </div>
                            <small><i class="fa-solid fa-shield-heart"></i> سریع، ساده و محترمانه؛ بعد از ورود می‌توانید دانلود را انجام دهید.</small>
                        </div>`;
                    document.body.appendChild(dialog);
                    dialog.querySelector(".nc-download-auth-close").addEventListener("click", () => dialog.classList.remove("open"));
                    dialog.querySelector("[data-auth-cancel]").addEventListener("click", () => dialog.classList.remove("open"));
                    dialog.addEventListener("click", e => {
                        if (e.target === dialog) dialog.classList.remove("open");
                    });
                    dialog.querySelector("[data-auth-continue]").addEventListener("click", () => {
                        const action = dialog._onContinue;
                        dialog.classList.remove("open");
                        if (typeof action === "function") action();
                    });
                    dialog._escapeHandler = e => {
                        if (e.key === "Escape" && dialog.classList.contains("open")) dialog.classList.remove("open");
                    };
                    document.addEventListener("keydown", dialog._escapeHandler);
                }
                dialog._onContinue = onContinue;
                requestAnimationFrame(() => {
                    dialog.classList.add("open");
                    dialog.querySelector("[data-auth-continue]")?.focus({ preventScroll: true });
                });
            }

            function toast(msg) {

                els.toast.textContent =
                    msg;

                els.toast.classList.add("show");


                clearTimeout(
                    state.toastTimer
                );


                state.toastTimer =
                    setTimeout(
                        () =>
                            els.toast.classList.remove("show"),
                        2800
                    );

            }


            /* =========================================================
               AUTH
            ========================================================= */
            let totalFavoriteCount = 0;
            let favoriteIds =
                new Set();


            function getToken() {

                return (
                    localStorage.getItem(
                        CONFIG.TOKEN_KEY
                    ) || ""
                );

            }


            function getSessionUser() {

                try {

                    const raw =
                        localStorage.getItem(
                            CONFIG.USER_KEY
                        );


                    if (!raw) {
                        return null;
                    }


                    return JSON.parse(raw);

                } catch (err) {

                    console.error(
                        "NightCast User Parse Error:",
                        err
                    );

                    return null;

                }

            }


            function isLoggedIn() {

                return Boolean(
                    getToken() &&
                    getSessionUser()
                );

            }


            /* =========================================================
               GOOGLE PROFILE IMAGE
            ========================================================= */

            function getUserAvatar(user) {

                if (!user) {
                    return "";
                }


                const possibleImages = [

                    user.picture,

                    user.avatar,

                    user.avatar_url,

                    user.avatarUrl,

                    user.photoURL,

                    user.photoUrl,

                    user.photo,

                    user.profile_picture,

                    user.profilePicture,

                    user.image,

                    user.image_url,

                    user.imageUrl,

                    user.picture_url,

                    user.pictureUrl

                ];


                for (const image of possibleImages) {

                    if (
                        typeof image === "string" &&
                        image.trim()
                    ) {

                        return image.trim();

                    }

                }


                return "";

            }


            function getUserName(user) {

                if (!user) {
                    return "حساب کاربری";
                }


                return (
                    user.name ||
                    user.full_name ||
                    user.fullName ||
                    user.displayName ||
                    user.username ||
                    user.email ||
                    "حساب کاربری"
                );

            }


            function updateUserUI() {

                const user =
                    getSessionUser();

                const token =
                    getToken();


                if (
                    !user ||
                    !token
                ) {

                    els.loginBtn.classList.remove(
                        "has-avatar"
                    );

                    els.loginBtn.title =
                        "ورود / حساب کاربری";

                    els.loginBtn.setAttribute(
                        "aria-label",
                        "ورود / حساب کاربری"
                    );

                    els.userAvatar.removeAttribute(
                        "src"
                    );

                    return;

                }


                const avatar =
                    getUserAvatar(user);

                const name =
                    getUserName(user);


                els.loginBtn.title =
                    name;

                els.loginBtn.setAttribute(
                    "aria-label",
                    `حساب کاربری ${name}`
                );


                if (avatar) {

                    els.userAvatar.src =
                        avatar;

                    els.userAvatar.alt =
                        name;

                    els.loginBtn.classList.add(
                        "has-avatar"
                    );


                    els.userAvatar.onerror =
                        () => {

                            console.warn(
                                "NightCast: تصویر پروفایل قابل بارگذاری نیست."
                            );

                            els.userAvatar.removeAttribute(
                                "src"
                            );

                            els.loginBtn.classList.remove(
                                "has-avatar"
                            );

                        };

                } else {

                    els.userAvatar.removeAttribute(
                        "src"
                    );

                    els.loginBtn.classList.remove(
                        "has-avatar"
                    );

                }

            }


            function openUserAccount() {

                /* =========================================================
                   USER NOT LOGGED IN
                ========================================================= */

                if (!isLoggedIn()) {

                    window.location.href =
                        CONFIG.LOGIN_PAGE;

                    return;

                }


                /* =========================================================
                   GET EXISTING PROFILE OVERLAY
                ========================================================= */

                const overlay =
                    document.getElementById(
                        "profileOverlay"
                    );

                const user =
                    getSessionUser();


                if (!overlay || !user) {

                    console.error(
                        "NightCast: Profile Overlay یا اطلاعات کاربر پیدا نشد."
                    );

                    return;

                }


                /* =========================================================
                   USER INFORMATION
                ========================================================= */

                const name =
                    getUserName(user);

                const email =
                    user.email ||
                    user.mail ||
                    "ایمیل ثبت نشده";

                const avatar =
                    getUserAvatar(user);


                /* =========================================================
                   PROFILE ELEMENTS
                ========================================================= */

                const profileName =
                    document.getElementById(
                        "profileName"
                    );

                const profileEmail =
                    document.getElementById(
                        "profileEmail"
                    );

                const profileAvatar =
                    document.getElementById(
                        "profileAvatar"
                    );

                const profileGuest =
                    document.getElementById(
                        "profileGuest"
                    );

                const profileLogged =
                    document.getElementById(
                        "profileLogged"
                    );

                const profileFavoriteCount =
                    document.getElementById(
                        "profileFavoriteCount"
                    );

                const profilePodcastCount =
                    document.getElementById(
                        "profilePodcastCount"
                    );

                const profileBookCount =
                    document.getElementById(
                        "profileBookCount"
                    );


                /* =========================================================
                   NAME
                ========================================================= */

                if (profileName) {

                    profileName.textContent =
                        name;

                }


                /* =========================================================
                   EMAIL
                ========================================================= */

                if (profileEmail) {

                    profileEmail.textContent =
                        email;

                }


                /* =========================================================
                   AVATAR
                ========================================================= */

                if (profileAvatar) {

                    if (avatar) {

                        profileAvatar.src =
                            avatar;

                        profileAvatar.alt =
                            name;

                    } else {

                        profileAvatar.removeAttribute(
                            "src"
                        );

                        profileAvatar.alt =
                            name;

                    }

                }


                /* =========================================================
                   SHOW LOGGED-IN PROFILE
                ========================================================= */

                if (profileGuest) {

                    profileGuest.hidden =
                        true;

                }


                if (profileLogged) {

                    profileLogged.hidden =
                        false;

                }


                /* =========================================================
                   PROFILE STATISTICS
                ========================================================= */

                if (profileFavoriteCount) {

                    profileFavoriteCount.textContent =
                        totalFavoriteCount.toLocaleString(
                            "fa-IR"
                        );

                }


                if (profilePodcastCount) {

                    profilePodcastCount.textContent =
                        state.all.length.toLocaleString(
                            "fa-IR"
                        );

                }


                if (profileBookCount) {

                    profileBookCount.textContent =
                        new Set(
                            state.all
                                .map(
                                    x =>
                                        x.book_name
                                )
                                .filter(Boolean)
                        )
                            .size
                            .toLocaleString(
                                "fa-IR"
                            );

                }


                /* =========================================================
                   SHOW PROFILE OVERLAY
                ========================================================= */

                overlay.classList.add(
                    "show"
                );

                overlay.setAttribute(
                    "aria-hidden",
                    "false"
                );


                /* Prevent background scrolling */

                document.body.style.overflow =
                    "hidden";

            }

            /* =========================================================
                CLOSE PROFILE OVERLAY
            ========================================================= */

            function closeProfileOverlay() {

                const overlay =
                    document.getElementById(
                        "profileOverlay"
                    );

                if (!overlay) {
                    return;
                }

                overlay.classList.remove(
                    "show"
                );

                overlay.setAttribute(
                    "aria-hidden",
                    "true"
                );

                document.body.style.overflow =
                    "";

            }


            /* =========================================================
LOGOUT
========================================================= */

            function logoutUser() {

                /* -----------------------------------------
                   حذف نشست کاربر
                ----------------------------------------- */

                localStorage.removeItem(
                    CONFIG.TOKEN_KEY
                );

                localStorage.removeItem(
                    CONFIG.USER_KEY
                );


                /* -----------------------------------------
                   پاک کردن علاقه‌مندی‌های محلی
                ----------------------------------------- */

                favoriteIds =
                    new Set();


                totalFavoriteCount =
                    0;


                /* -----------------------------------------
                   بستن Profile
                ----------------------------------------- */

                closeProfileOverlay();


                /* -----------------------------------------
                   به‌روزرسانی وضعیت Header
                ----------------------------------------- */

                updateUserUI();


                /* -----------------------------------------
                   به‌روزرسانی علاقه‌مندی‌ها
                ----------------------------------------- */

                loadFavorites();


                /* -----------------------------------------
                   پیام
                ----------------------------------------- */

                toast(
                    "با موفقیت از حساب کاربری خارج شدید."
                );

            }
            /* =========================================================
               FAVORITES
            ========================================================= */

            function isFavorite(id) {

                return favoriteIds.has(
                    Number(id)
                );

            }


            async function loadFavorites() {

                const token =
                    getToken();

                try {

                    const headers = {
                        "Accept": "application/json"
                    };

                    if (token) {

                        headers.Authorization =
                            `Bearer ${token}`;

                    }

                    const res =
                        await fetch(
                            `${CONFIG.API_BASE}/public/favorites`,
                            {
                                method: "GET",
                                headers
                            }
                        );

                    if (!res.ok) {

                        throw new Error(
                            `خطا در دریافت تعداد علاقه‌مندی‌ها: ${res.status}`
                        );

                    }

                    const data =
                        await res.json();

                    totalFavoriteCount =
                        Number(
                            data.total || 0
                        );

                    if (token) {

                        const favorites =
                            Array.isArray(data.favorites)
                                ? data.favorites
                                : [];

                        favoriteIds =
                            new Set(
                                favorites.map(
                                    x =>
                                        Number(
                                            typeof x === "object"
                                                ? x.podcast_id || x.id
                                                : x
                                        )
                                )
                            );

                    } else {

                        favoriteIds =
                            new Set();

                    }

                    updateStats();
                    syncAllFavoriteButtons();
                    if (token) { applyView(); }

                }
                catch (err) {

                    console.error(
                        "Favorites Load Error:",
                        err
                    );

                }

            }

            /* =========================================================
درخواست خلاصه کتاب
========================================================= */

            async function requestBookSummary(data) {

                if (!isLoggedIn()) {
                    window.location.href = CONFIG.LOGIN_PAGE;
                    return {
                        success: false,
                        message: "برای ثبت درخواست ابتدا وارد حساب کاربری شوید."
                    };
                }

                const token = getToken();

                try {

                    const response = await fetch(
                        `${CONFIG.API_BASE}/book-summary-requests`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "Authorization": `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                book_name: String(
                                    data?.book_name || ""
                                ).trim(),

                                author_name: String(
                                    data?.author_name || ""
                                ).trim(),

                                description: String(
                                    data?.description || ""
                                ).trim(),

                                captcha: window.NightCastShield.getProof("suggestion")
                            })
                        }
                    );

                    const result = await response.json();

                    if (response.status === 401) {

                        localStorage.removeItem(
                            CONFIG.TOKEN_KEY
                        );

                        localStorage.removeItem(
                            CONFIG.USER_KEY
                        );

                        window.location.href =
                            CONFIG.LOGIN_PAGE;

                        return {
                            success: false,
                            message:
                                "نشست شما منقضی شده است."
                        };
                    }

                    if (!response.ok) {
                        if (response.status === 403 && window.NightCastShield) await window.NightCastShield.refresh("suggestion");
                        return {
                            success: false,
                            message: result?.message || "ثبت درخواست انجام نشد."
                        };
                    }

                    return {
                        success: true,
                        message:
                            result?.message ||
                            "درخواست شما با موفقیت ثبت شد.",

                        request:
                            result?.request || null
                    };

                } catch (error) {

                    console.error(
                        "NightCast Book Summary Request Error:",
                        error
                    );

                    return {
                        success: false,
                        message:
                            "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید."
                    };
                }
            }
            /* =========================================================
               تابع بعدی باید از اینجا شروع شود
            ========================================================= */


            function updateStats() {
                // These counters are optional UI. The catalogue and favorites must
                // continue working when the count panels are intentionally absent.
                if (els.count) {
                    els.count.textContent = state.all.length.toLocaleString("fa-IR");
                }

                if (els.books) {
                    els.books.textContent = new Set(
                        state.all
                            .map(x => x.book_name)
                            .filter(Boolean)
                    ).size.toLocaleString("fa-IR");
                }

                if (els.favCount) {
                    els.favCount.textContent = totalFavoriteCount.toLocaleString("fa-IR");
                }
            }


            // Optimistic favorites: update immediately, then quietly sync the final intent.
            const favoriteWriteQueue = new Map();
            const favoriteWriteTimers = new Map();
            const favoriteInFlight = new Set();

            function syncFavoriteButtons(id) {
                const podcastId = Number(id), active = favoriteIds.has(podcastId);
                document.querySelectorAll(`[data-action="favorite"][data-id="${podcastId}"],[data-like-id="${podcastId}"]`).forEach(button => {
                    button.classList.toggle("active", active);
                    button.setAttribute("aria-pressed", active ? "true" : "false");
                    button.setAttribute("aria-label", active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها");
                    const icon = button.querySelector("i");
                    if (icon) icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
                });
            }
            function syncAllFavoriteButtons() {
                document.querySelectorAll('[data-action="favorite"][data-id]').forEach(button => syncFavoriteButtons(button.dataset.id));
                if (state.current) syncFavoriteButtons(state.current.id);
            }
            function scheduleFavoriteWrite(id, desiredFavorite) {
                const podcastId = Number(id);
                favoriteWriteQueue.set(podcastId, { desiredFavorite, token: getToken() });
                clearTimeout(favoriteWriteTimers.get(podcastId));
                favoriteWriteTimers.set(podcastId, setTimeout(() => flushFavoriteWrite(podcastId), 180));
            }
            async function flushFavoriteWrite(podcastId) {
                if (favoriteInFlight.has(podcastId)) {
                    clearTimeout(favoriteWriteTimers.get(podcastId));
                    favoriteWriteTimers.set(podcastId, setTimeout(() => flushFavoriteWrite(podcastId), 220));
                    return;
                }
                const job = favoriteWriteQueue.get(podcastId);
                if (!job) return;
                favoriteWriteQueue.delete(podcastId);
                favoriteWriteTimers.delete(podcastId);
                favoriteInFlight.add(podcastId);
                try {
                    const res = await fetch(`${CONFIG.API_BASE}/public/favorites/${podcastId}`, {
                        method: job.desiredFavorite ? "POST" : "DELETE",
                        headers: { "Authorization": `Bearer ${job.token}`, "Content-Type": "application/json", "Accept": "application/json" },
                        keepalive: true
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.status === 401) {
                        localStorage.removeItem(CONFIG.TOKEN_KEY); localStorage.removeItem(CONFIG.USER_KEY);
                        toast("برای همگام‌سازی علاقه‌مندی، دوباره وارد حساب شوید."); return;
                    }
                    if (!res.ok || data.success === false) throw new Error(data.message || "همگام‌سازی علاقه‌مندی ناموفق بود.");
                } catch (err) {
                    console.error("Favorite sync error:", err);
                    favoriteWriteQueue.set(podcastId, job);
                    clearTimeout(favoriteWriteTimers.get(podcastId));
                    favoriteWriteTimers.set(podcastId, setTimeout(() => flushFavoriteWrite(podcastId), 2500));
                } finally {
                    favoriteInFlight.delete(podcastId);
                    if (favoriteWriteQueue.has(podcastId) && !favoriteWriteTimers.has(podcastId)) favoriteWriteTimers.set(podcastId, setTimeout(() => flushFavoriteWrite(podcastId), 0));
                }
            }
            function toggleFavorite(id) {
                if (!isLoggedIn()) {
                    toast("برای لایک کردن، ابتدا وارد حساب کاربری شوید.");
                    setTimeout(() => {
                        const loginUrl = new URL(CONFIG.LOGIN_PAGE, window.location.href);
                        loginUrl.searchParams.set("next", window.location.pathname + window.location.search + window.location.hash);
                        window.location.href = loginUrl.href;
                    }, 280);
                    return;
                }
                const podcastId = Number(id);
                if (!Number.isFinite(podcastId)) return;
                const wasFavorite = favoriteIds.has(podcastId);
                if (wasFavorite) { favoriteIds.delete(podcastId); totalFavoriteCount = Math.max(0, totalFavoriteCount - 1); }
                else { favoriteIds.add(podcastId); totalFavoriteCount += 1; }
                syncFavoriteButtons(podcastId);
                updateStats();
                scheduleFavoriteWrite(podcastId, !wasFavorite);
            }

            /* =========================================================
               PODCAST RENDER
            ========================================================= */

            function skeletons(n = 4) {

                els.grid.className =
                    "loading-grid";


                els.grid.innerHTML =
                    Array.from(
                        {
                            length: n
                        },
                        () => `
                                                                                                                <div class="sk-card">

                                                                                                                    <div class="skeleton sk-cover"></div>

                                                                                                                    <div class="skeleton sk-line"></div>

                                                                                                                    <div class="skeleton sk-line short"></div>

                                                                                                                </div>
                                                                                                            `
                    )
                        .join("");

            }


            function formatPodcastDate(value) {
                if (!value) return "";
                const raw = String(value).trim();
                if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return "";
                const date = new Date(raw.replace(" ", "T"));
                if (Number.isNaN(date.getTime())) return "";
                try { return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date); }
                catch { return ""; }
            }

            let lastPodcastDetailsTrigger = null;

            async function sharePodcast(id) {
                const podcast = state.all.find(item => Number(item.id) === Number(id));
                if (!podcast) { toast("ابتدا یک پادکست انتخاب کنید."); return; }
                const title = String(podcast.title || podcast.book_name || "پادکست NightCast");
                const slug = String(podcast.slug || podcast.id);
                let url = "https://nightcast.ir/podcasts#podcast-" + encodeURIComponent(slug);
                const token = getToken();
                if (token) {
                    try {
                        const referralResponse = await fetch("https://club-api.nightcast.ir/api/v1/club/referrals/code", {
                            headers: { "Accept": "application/json", "Authorization": "Bearer " + token },
                            credentials: "omit", cache: "no-store"
                        });
                        const referralData = await referralResponse.json().catch(() => ({}));
                        if (referralResponse.ok && referralData.invite_url) {
                            const inviteUrl = new URL(referralData.invite_url);
                            inviteUrl.hash = "podcast-" + encodeURIComponent(slug);
                            url = inviteUrl.toString();
                        }
                    } catch (_) { /* sharing remains available without referral attribution */ }
                }
                const invitation = "اگر به شنیدن و ایده‌های تازه علاقه داری، این پادکست NightCast را از دست نده: «" + title + "». شاید یک نکته‌اش نگاهت را عوض کند.\n" + url;
                const record = function (channel) {
                    if (!token) return;
                    fetch("https://club-api.nightcast.ir/api/v1/club/share-events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + token },
                        credentials: "omit", cache: "no-store",
                        body: JSON.stringify({ podcast_id: Number(podcast.id), channel: channel })
                    }).catch(() => {});
                };
                try {
                    if (navigator.share) {
                        await navigator.share({ title: title + " | NightCast", text: invitation, url: url });
                        record("native");
                        toast("پنجره اشتراک‌گذاری دستگاه باز شد؛ مخاطب را خودت انتخاب کن.");
                    } else if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(invitation);
                        record("copy");
                        toast("متن معرفی و لینک اختصاصی کپی شد؛ حالا در پیام‌رسان دلخواه بفرست.");
                    } else {
                        window.prompt("متن معرفی پادکست را کپی کنید:", invitation);
                    }
                } catch (error) {
                    if (error && error.name !== "AbortError") toast("اشتراک‌گذاری انجام نشد؛ دوباره تلاش کن.");
                }
            }

            function openPodcastDetails(id) {
                const podcast = state.all.find(item => Number(item.id) === Number(id));
                const modal = document.getElementById("ncPodcastDetail");
                const body = document.getElementById("ncPodcastDetailBody");
                if (!podcast || !modal || !body) {
                    toast("جزئیات این پادکست در دسترس نیست.");
                    return;
                }

                const title = String(podcast.title || podcast.book_name || "پادکست NightCast");
                const author = String(podcast.author_name || "NightCast");
                const book = String(podcast.book_name || "");
                const category = String(podcast.category_name || podcast.category || "");
                const shortDescription = String(podcast.short_description || podcast.description || podcast.summary || "").trim();
                const summary = String(podcast.summary || "").trim();
                const transcript = String(podcast.long_description || podcast.transcript || "").trim();
                const tags = (Array.isArray(podcast.tags) ? podcast.tags : String(podcast.tags || "").split(/[,،]/))
                    .map(tag => String(tag).trim()).filter(Boolean);
                const date = formatPodcastDate(podcast.publish_date || podcast.created_at);
                const duration = formatTime(podcast.duration_seconds || 0);
                const cover = (localizeCover(podcast.cover_url) || placeholder);
                const sections = [];

                if (shortDescription) sections.push({ title: "معرفی کوتاه", text: shortDescription });
                if (summary && summary !== shortDescription) sections.push({ title: "خلاصه اپیزود", text: summary });
                if (!shortDescription && !summary && !transcript) sections.push({ title: "درباره این پادکست", text: "توضیحی برای این پادکست ثبت نشده است." });

                const sectionMarkup = sections.map(section =>
                    '<section class="nc-detail-section"><h3>' + escapeHtml(section.title) +
                    '</h3><p>' + escapeHtml(section.text) + '</p></section>'
                ).join("");

                const transcriptMarkup = transcript
                    ? '<details class="nc-detail-transcript"><summary><i class="fa-solid fa-file-lines" aria-hidden="true"></i> مشاهده متن کامل اپیزود</summary><div class="nc-detail-transcript-body">' + escapeHtml(transcript) + '</div></details>'
                    : '<p class="nc-detail-no-transcript">متن کامل این اپیزود در پایگاه داده ثبت نشده است.</p>';

                body.innerHTML =
                    '<div class="nc-detail-hero">' +
                        '<img class="nc-detail-cover" src="' + escapeHtml(cover) + '" alt="' + escapeHtml(title) + '" onerror="this.onerror=null;this.src=\'' + placeholder + '\'">' +
                        '<div class="nc-detail-heading">' +
                            '<span class="nc-detail-kicker">' + escapeHtml(category || "پادکست NightCast") + '</span>' +
                            '<h2 id="ncPodcastDetailTitle">' + escapeHtml(title) + '</h2>' +
                            '<p class="nc-detail-author">' + escapeHtml(author) + (book ? ' <span aria-hidden="true">·</span> ' + escapeHtml(book) : '') + '</p>' +
                            '<div class="nc-detail-meta">' +
                                (duration !== "00:00" ? '<span><i class="fa-regular fa-clock" aria-hidden="true"></i> ' + escapeHtml(duration) + '</span>' : '') +
                                (podcast.episode_number ? '<span><i class="fa-solid fa-headphones" aria-hidden="true"></i> قسمت ' + escapeHtml(String(podcast.episode_number)) + '</span>' : '') +
                                (date ? '<span><i class="fa-regular fa-calendar" aria-hidden="true"></i> ' + escapeHtml(date) + '</span>' : '') +
                            '</div>' +
                            '<button type="button" class="btn btn-primary nc-detail-play" data-action="play" data-id="' + Number(podcast.id) + '"' + (podcast.audio_url ? '' : ' disabled') + '><i class="fa-solid fa-play" aria-hidden="true"></i> پخش اپیزود</button>' +
                        '</div>' +
                    '</div>' +
                    sectionMarkup +
                    (tags.length ? '<section class="nc-detail-section"><h3>موضوعات و برچسب‌ها</h3><div class="nc-detail-tags">' + tags.map(tag => '<span>' + escapeHtml(tag) + '</span>').join("") + '</div></section>' : '') +
                    '<section class="nc-detail-section"><h3>متن کامل اپیزود</h3>' + transcriptMarkup + '</section>';

                lastPodcastDetailsTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                modal.classList.add("open");
                modal.setAttribute("aria-hidden", "false");
                document.body.classList.add("nc-detail-open");
                updateCardPlaying();
                modal.querySelector("[data-action='close-details']")?.focus({ preventScroll: true });
            }

            function closePodcastDetails() {
                const modal = document.getElementById("ncPodcastDetail");
                if (!modal) return;
                modal.classList.remove("open");
                modal.setAttribute("aria-hidden", "true");
                document.body.classList.remove("nc-detail-open");
                lastPodcastDetailsTrigger?.focus?.({ preventScroll: true });
            }

            // The details dialog is outside #podcastGrid, so delegate its controls at document level.
            // All play controls use the same audio element and shared playback state.
            document.addEventListener("click", event => {
                const target = event.target;
                if (!(target instanceof Element)) return;

                const playButton = target.closest('#ncPodcastDetail [data-action="play"]');
                if (playButton) {
                    event.preventDefault();
                    if (playButton.disabled) return;
                    const id = Number(playButton.dataset.id);
                    if (!Number.isFinite(id)) return;
                    if (state.current && Number(state.current.id) === id) {
                        togglePlay();
                    } else {
                        playPodcast(id);
                    }
                    return;
                }

                const closeButton = target.closest('#ncPodcastDetail [data-action="close-details"]');
                if (closeButton) {
                    event.preventDefault();
                    closePodcastDetails();
                }
            });

            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && document.getElementById("ncPodcastDetail")?.classList.contains("open")) {
                    closePodcastDetails();
                }
            });

            function renderCard(p) {
                const id = Number(p.id);
                const title = String(p.title || p.book_name || "بدون عنوان");
                const author = String(p.author_name || "NightCast");
                const book = String(p.book_name || "");
                const category = String(p.category_name || p.category || "پادکست");
                const desc = String(p.short_description || p.description || p.summary || "توضیحی برای این پادکست ثبت نشده است.");
                const cover = (localizeCover(p.cover_url) || placeholder);
                const audio = String(p.audio_url || "");
                const duration = formatTime(p.duration_seconds || 0);
                const date = formatPodcastDate(p.publish_date || p.created_at);
                const fav = isFavorite(id);
                const tags = (Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(/[,،]/))
                    .map(tag => String(tag).trim()).filter(Boolean).slice(0, 3);
                const episode = p.episode_number ? "قسمت " + String(p.episode_number) : "";
                const tagMarkup = tags.map(tag => '<span class="podcast-tag">' + escapeHtml(tag) + '</span>').join("");

                return '<article id="podcast-' + escapeHtml(String(p.slug || id)) + '" class="podcast-card" data-id="' + id + '">' +
                    '<div class="podcast-cover">' +
                        '<img src="' + escapeHtml(cover) + '" alt="جلد پادکست ' + escapeHtml(title) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + placeholder + '\'">' +
                        '<div class="cover-shade"></div>' +
                        '<span class="podcast-cover-label"><i class="fa-solid fa-wave-square" aria-hidden="true"></i> NIGHTCAST</span>' +
                        '<button type="button" class="play-card" data-action="play" data-id="' + id + '" aria-label="پخش ' + escapeHtml(title) + '"' + (audio ? "" : " disabled") + '><i class="fa-solid fa-play" aria-hidden="true"></i></button>' +
                    '</div>' +
                    '<div class="podcast-info">' +
                        '<div class="podcast-card-overline"><span class="podcast-category">' + escapeHtml(category) + '</span>' +
                            (episode ? '<span class="podcast-episode">' + escapeHtml(episode) + '</span>' : '') +
                        '</div>' +
                        '<h3 class="podcast-title">' + escapeHtml(title) + '</h3>' +
                        '<div class="meta">' +
                            '<span><i class="fa-solid fa-user" aria-hidden="true"></i>' + escapeHtml(author) + '</span>' +
                            (book ? '<span><i class="fa-solid fa-book" aria-hidden="true"></i>' + escapeHtml(book) + '</span>' : '') +
                            (duration !== "00:00" ? '<span><i class="fa-regular fa-clock" aria-hidden="true"></i>' + escapeHtml(duration) + '</span>' : '') +
                            (date ? '<span><i class="fa-regular fa-calendar" aria-hidden="true"></i>' + escapeHtml(date) + '</span>' : '') +
                        '</div>' +
                        '<p class="podcast-desc">' + escapeHtml(desc) + '</p>' +
                        (tagMarkup ? '<div class="podcast-card-tags" aria-label="موضوعات">' + tagMarkup + '</div>' : '') +
                        '<div class="card-footer">' +
                            '<button type="button" class="btn btn-primary" data-action="play" data-id="' + id + '"' + (audio ? "" : " disabled") + '><i class="fa-solid fa-play" aria-hidden="true"></i> پخش</button>' +
                            '<button type="button" class="btn btn-secondary nc-card-details" data-action="details" data-id="' + id + '" aria-label="جزئیات ' + escapeHtml(title) + '"><i class="fa-regular fa-file-lines" aria-hidden="true"></i><span>جزئیات</span></button>' +
                            '<button type="button" class="btn btn-secondary nc-card-share" data-action="share" data-id="' + id + '" aria-label="اشتراک‌گذاری ' + escapeHtml(title) + '"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span>اشتراک</span></button>' +
                            '<button type="button" class="btn btn-secondary nc-card-download" data-action="download" data-id="' + id + '" aria-label="دریافت ' + escapeHtml(title) + '"' + (audio ? "" : " disabled") + '><i class="fa-solid fa-download" aria-hidden="true"></i></button>' +
                            '<button type="button" class="favorite ' + (fav ? "active" : "") + '" data-action="favorite" data-id="' + id + '" aria-label="' + (fav ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها") + '" aria-pressed="' + (fav ? "true" : "false") + '"><i class="' + (fav ? "fa-solid" : "fa-regular") + ' fa-heart" aria-hidden="true"></i></button>' +
                            '<button type="button" class="nc-comment-action" data-action="comments" data-id="' + id + '" aria-label="مشاهده و ثبت دیدگاه برای ' + escapeHtml(title) + '"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><span>دیدگاه‌ها</span><b class="nc-card-stat-count" data-comment-count="' + id + '" aria-label="تعداد دیدگاه‌ها">۰</b></button>' +
                        '</div>' +
                    '</div>' +
                '</article>';
            }

            function render(items, append = false) {

                els.grid.className =
                    "podcast-grid";


                if (!items.length) {

                    els.grid.innerHTML = `

                                                                                                            <div
                                                                                                                class="empty"
                                                                                                                style="grid-column:1/-1">

                                                                                                                <i class="fa-solid fa-magnifying-glass"></i>

                                                                                                                <h3>
                                                                                                                    ${state.query
                            ? `پادکستی برای «${escapeHtml(state.query)}» پیدا نشد.`
                            : "هنوز پادکستی ثبت نشده است."
                        }
                                                                                                                </h3>

                                                                                                                <p>
                                                                                                                    ${state.query
                            ? "عبارت دیگری را امتحان کنید."
                            : "به‌زودی محتوای جدید در NightCast منتشر می‌شود."
                        }
                                                                                                                </p>

                                                                                                                ${state.query
                            ? `
                                                                                                                            <button
                                                                                                                                class="btn btn-secondary"
                                                                                                                                data-action="clear-search">

                                                                                                                                پاک کردن جستجو

                                                                                                                            </button>
                                                                                                                          `
                            : ""
                        }

                                                                                                            </div>

                                                                                                        `;

                    return;

                }


                const cardsHtml = items.map(renderCard).join("");
                if (append) {
                    els.grid.insertAdjacentHTML("beforeend", cardsHtml);
                } else {
                    els.grid.innerHTML = cardsHtml;
                }


                updateCardPlaying();
                if (typeof window.NightCastLoadPodcastCardStats === "function") {
                    window.NightCastLoadPodcastCardStats();
                }

            }


            /* Compact numeric MP3 readiness indicator, positioned at the top edge of the player. */
            const ncLoadFeedback = (() => {
                if (!els.player) return null;
                let node = document.getElementById("ncAudioLoadFeedback");
                if (!node) {
                    node = document.createElement("div");
                    node.id = "ncAudioLoadFeedback";
                    node.className = "nc-audio-load-feedback";
                    node.setAttribute("role", "status");
                    node.setAttribute("aria-live", "polite");
                    node.innerHTML = '<span class="nc-audio-load-percent">۰٪</span><div class="nc-audio-load-track" role="progressbar" aria-label="درصد آماده‌شدن فایل صوتی" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="nc-audio-load-fill"></span></div>';
                    els.player.appendChild(node);
                }
                return {
                    root: node,
                    percent: node.querySelector(".nc-audio-load-percent"),
                    track: node.querySelector(".nc-audio-load-track"),
                    fill: node.querySelector(".nc-audio-load-fill")
                };
            })();
            let ncLoadCompleteTimer = 0;
            function ncSetAudioLoadFeedback(percent, visible) {
                if (!ncLoadFeedback) return;
                const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
                ncLoadFeedback.root.classList.toggle("is-visible", !!visible);
                ncLoadFeedback.percent.textContent = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(safe) + "٪";
                ncLoadFeedback.fill.style.width = safe + "%";
                ncLoadFeedback.track.setAttribute("aria-valuenow", String(safe));
            }
            function ncUpdateAudioLoadProgress() {
                if (!ncLoadFeedback || !state.current) return;
                const audio = els.audio;
                let ratio = 0;
                try {
                    if (audio.duration > 0 && audio.buffered.length) {
                        ratio = Math.max(0, Math.min(1, audio.buffered.end(audio.buffered.length - 1) / audio.duration));
                    }
                } catch (_) {}
                if (audio.readyState >= 3 || (!audio.paused && !audio.seeking && audio.readyState >= 2)) {
                    ncSetAudioLoadFeedback(100, true);
                    window.clearTimeout(ncLoadCompleteTimer);
                    ncLoadCompleteTimer = window.setTimeout(() => ncSetAudioLoadFeedback(100, false), 650);
                } else {
                    window.clearTimeout(ncLoadCompleteTimer);
                    ncSetAudioLoadFeedback(ratio * 100, true);
                }
            }
            ["loadstart", "progress", "loadedmetadata", "loadeddata", "canplay", "canplaythrough", "waiting", "playing", "seeking", "seeked"].forEach(eventName => {
                els.audio.addEventListener(eventName, () => {
                    if (eventName === "playing" || eventName === "canplaythrough") {
                        ncSetAudioLoadFeedback(100, true);
                        window.clearTimeout(ncLoadCompleteTimer);
                        ncLoadCompleteTimer = window.setTimeout(() => ncSetAudioLoadFeedback(100, false), 650);
                    } else {
                        ncUpdateAudioLoadProgress();
                    }
                });
            });
            els.audio.addEventListener("error", () => {
                if (ncLoadFeedback && state.current) {
                    window.clearTimeout(ncLoadCompleteTimer);
                    ncSetAudioLoadFeedback(0, true);
                }
            });

            function updateCardPlaying() {
                const currentId = state.current ? Number(state.current.id) : null;
                const isPlaying = !!currentId && !els.audio.paused && !els.audio.ended;

                $$(".podcast-card").forEach(card => {
                    const cardId = Number(card.dataset.id);
                    const isCurrent = currentId !== null && cardId === currentId;
                    const playing = isCurrent && isPlaying;

                    // Keep every play control for this podcast in sync,
                    // including the cover overlay and the card's lower action button.
                    card.querySelectorAll('[data-action="play"]').forEach(button => {
                        const icon = button.querySelector("i");
                        if (icon) icon.className = playing
                            ? "fa-solid fa-pause"
                            : "fa-solid fa-play";

                        button.setAttribute("aria-label", playing
                            ? "توقف موقت پادکست " + (state.current?.title || "")
                            : "پخش " + (card.querySelector(".podcast-title")?.textContent?.trim() || ""));

                        button.setAttribute("aria-pressed", playing ? "true" : "false");
                        button.classList.toggle("is-playing", playing);
                    });

                    card.classList.toggle("is-playing", playing);
                });

                // Keep the featured/hero play button synchronized too.
                if (els.latestPlay) {
                    const latest = state.all.find(p => Number(p.id) === currentId);
                    const icon = els.latestPlay.querySelector("i");
                    const isLatestPlaying = !!latest && isPlaying;
                    if (icon) icon.className = isLatestPlaying
                        ? "fa-solid fa-pause"
                        : "fa-solid fa-play";
                    els.latestPlay.setAttribute("aria-label", isLatestPlaying
                        ? "توقف موقت پادکست " + (latest.title || "")
                        : "پخش آخرین پادکست");
                    els.latestPlay.setAttribute("aria-pressed", isLatestPlaying ? "true" : "false");
                }

                // The detail dialog is outside the grid; synchronize it from the real audio state.
                const detailButton = document.querySelector('#ncPodcastDetail [data-action="play"]');
                if (detailButton) {
                    const detailId = Number(detailButton.dataset.id);
                    const detailIsCurrent = Number.isFinite(detailId) && detailId === currentId;
                    const detailIsPlaying = detailIsCurrent && isPlaying;
                    const detailIcon = detailButton.querySelector("i");
                    if (detailIcon) detailIcon.className = detailIsPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";

                    const detailTitle = document.querySelector("#ncPodcastDetailTitle")?.textContent?.trim() || "";
                    detailButton.setAttribute("aria-label", detailIsPlaying
                        ? "توقف موقت اپیزود " + detailTitle
                        : "پخش اپیزود " + detailTitle);
                    detailButton.setAttribute("aria-pressed", detailIsPlaying ? "true" : "false");
                    detailButton.classList.toggle("is-playing", detailIsPlaying);

                    for (const node of detailButton.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            node.textContent = detailIsPlaying ? " توقف اپیزود" : " پخش اپیزود";
                            break;
                        }
                    }
                }
            }


            /* =========================================================
               INFINITE SCROLL — LOAD THREE PODCASTS AT A TIME
            ========================================================= */

            /* =========================================================
               VIEW
            ========================================================= */

            function applyView(options = {}) {
                // Search is the source of truth even when its debounce has not fired yet.
                state.query = els.search ? els.search.value.trim() : state.query;
                const q = state.query.toLocaleLowerCase("fa");
                const nextVisible = q
                    ? state.all.filter(p => [
                        p.title, p.book_name, p.author_name, p.category_name, p.tags,
                        p.description, p.short_description, p.summary, p.transcript, p.long_description
                    ].filter(Boolean).join(" ").toLocaleLowerCase("fa").includes(q))
                    : state.all;

                state.visible = nextVisible;
                const pageCount = Math.max(1, Math.ceil(nextVisible.length / state.pageSize));
                state.page = Math.min(Math.max(1, Number(state.page) || 1), pageCount);
                const start = (state.page - 1) * state.pageSize;
                const pageItems = nextVisible.slice(start, start + state.pageSize);

                const existingIds = Array.from(els.grid.querySelectorAll(".podcast-card"))
                    .map(card => String(card.dataset.id || ""));
                const expectedIds = pageItems.map(p => String(p.id));
                const canKeepDom = options.preserveExisting === true &&
                    existingIds.length === expectedIds.length &&
                    existingIds.length > 0 &&
                    existingIds.every((id, index) => id === expectedIds[index]);

                if (!canKeepDom) render(pageItems);
                state.renderedCount = pageItems.length;
                renderPagination(nextVisible.length);
                updateStats();
            }

            function renderPagination(totalItems) {
                let nav = document.getElementById("ncPodcastPagination");
                if (!nav) {
                    nav = document.createElement("nav");
                    nav.id = "ncPodcastPagination";
                    nav.className = "nc-podcast-pagination";
                    nav.setAttribute("aria-label", "صفحه‌بندی پادکست‌ها");
                    nav.setAttribute("dir", "rtl");
                    nav.addEventListener("click", event => {
                        const button = event.target.closest("button[data-page]");
                        if (!button || button.disabled) return;
                        const requestedPage = Number(button.dataset.page);
                        if (!Number.isInteger(requestedPage) || requestedPage < 1) return;
                        if (requestedPage === state.page) return;
                        state.page = requestedPage;
                        applyView();
                        const heading = document.getElementById("podcastHeading");
                        if (heading) {
                            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                            heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                        }
                    });
                    els.grid.insertAdjacentElement("afterend", nav);
                }

                const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
                if (totalItems <= state.pageSize) {
                    nav.hidden = true;
                    nav.replaceChildren();
                    return;
                }

                nav.hidden = false;
                const makeButton = (label, page, options = {}) => {
                    const active = page === state.page && !options.disabled;
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "nc-page-btn" + (active ? " is-active" : "") +
                        (options.kind ? " nc-page-" + options.kind : "");
                    button.dataset.page = String(page);
                    button.disabled = Boolean(options.disabled);
                    button.setAttribute("aria-label", options.ariaLabel || label);
                    if (active) button.setAttribute("aria-current", "page");
                    button.textContent = label;
                    return button;
                };

                const fragment = document.createDocumentFragment();
                fragment.appendChild(makeButton("‹", Math.max(1, state.page - 1), {
                    kind: "edge", disabled: state.page === 1, ariaLabel: "صفحه قبلی"
                }));
                for (let page = 1; page <= totalPages; page += 1) {
                    fragment.appendChild(makeButton(page.toLocaleString("fa-IR"), page, {
                        ariaLabel: "صفحه " + page.toLocaleString("fa-IR")
                    }));
                }
                fragment.appendChild(makeButton("›", Math.min(totalPages, state.page + 1), {
                    kind: "edge", disabled: state.page === totalPages, ariaLabel: "صفحه بعدی"
                }));
                nav.replaceChildren(fragment);
            }


            /* =========================================================
               LOAD PODCASTS
            ========================================================= */

            async function loadPodcasts() {

                const cacheKey = CONFIG.CACHE_KEY;
                let cached = [];

                try {
                    const parsed = JSON.parse(localStorage.getItem(cacheKey) || "[]");
                    cached = Array.isArray(parsed) ? parsed.map(normalizePodcastRecord) : [];
                } catch {
                    cached = [];
                }

                // Render a saved catalogue immediately. Refresh from the network afterwards.
                if (cached.length) {
                    state.all = cached;
                    updateLatest(cached);
                    updatePodcastCollectionSchema(cached);
                    applyView();
                    window.__NC_CACHED_CATALOG_RENDERED = true;
                } else {
                    skeletons();
                }

                async function fetchAllFromAPI() {
                    const pageSize = 5; // Worker API currently caps each page at five records.
                    const collected = [];

                    async function fetchPage(page) {
                        const response = await fetch(
                            `${CONFIG.API_BASE}/public/podcasts?page=${page}&limit=${pageSize}`,
                            {
                                method: "GET",
                                cache: "no-store",
                                headers: { "Accept": "application/json" }
                            }
                        );
                        if (!response.ok) {
                            throw new Error(`Podcast API returned HTTP ${response.status} on page ${page}`);
                        }
                        const payload = await response.json();
                        if (!payload || payload.success !== true || !Array.isArray(payload.podcasts)) {
                            throw new Error(`Podcast API response format was invalid on page ${page}.`);
                        }
                        return payload;
                    }

                    // One request discovers the total; fetch remaining pages concurrently.
                    const first = await fetchPage(1);
                    collected.push(...first.podcasts);
                    const reportedTotal = Number(first.total);
                    if (Number.isFinite(reportedTotal) && reportedTotal > 0) {
                        const pageCount = Math.min(100, Math.ceil(reportedTotal / pageSize));
                        if (pageCount > 1) {
                            const remaining = await Promise.all(
                                Array.from({ length: pageCount - 1 }, (_, index) => fetchPage(index + 2))
                            );
                            for (const payload of remaining) collected.push(...payload.podcasts);
                        }
                    } else {
                        // Compatibility fallback for API responses that omit the total.
                        let page = 2;
                        let lastPage = first.podcasts;
                        while (page <= 100 && lastPage.length === pageSize) {
                            const payload = await fetchPage(page);
                            lastPage = payload.podcasts;
                            if (!lastPage.length) break;
                            collected.push(...lastPage);
                            page += 1;
                        }
                    }

                    const unique = new Map();
                    for (const podcast of collected) {
                        if (podcast && podcast.id != null) {
                            unique.set(String(podcast.id), normalizePodcastRecord(podcast));
                        }
                    }
                    return [...unique.values()];
                }

                try {
                    // Prefer the live D1-backed API. Avoid a separate feed round-trip on success.
                    let freshItems = cached.length ? cached : [];
                    try {
                        const apiItems = await fetchAllFromAPI();
                        if (apiItems.length) freshItems = apiItems;
                        else if (!freshItems.length) throw new Error("The podcast API returned an empty catalogue.");
                    } catch (apiError) {
                        console.error("NightCast podcast API refresh failed; trying cached/static fallback.", apiError);
                        if (!freshItems.length) {
                            try {
                                const response = await fetch(CONFIG.FEED_URL, {
                                    method: "GET",
                                    headers: { "Accept": "application/json" }
                                });
                                if (!response.ok) throw new Error(`Podcast feed returned HTTP ${response.status}`);
                                const data = await response.json();
                                const feedItems = (Array.isArray(data)
                                    ? data
                                    : Array.isArray(data?.podcasts)
                                        ? data.podcasts
                                        : []).map(normalizePodcastRecord);
                                if (feedItems.length) freshItems = feedItems;
                                else throw new Error("The static podcast feed returned an empty catalogue.");
                            } catch (feedError) {
                                if (!freshItems.length) throw feedError || apiError;
                            }
                        }
                    }

                    if (!freshItems.length) {
                        throw new Error("No podcasts were returned by the API or fallback feed.");
                    }

                    freshItems = freshItems.map(normalizePodcastRecord);
                    state.all = freshItems;
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify(freshItems));
                    } catch (storageError) {
                        console.warn("NightCast podcast cache could not be saved.", storageError);
                    }

                    updateLatest(freshItems);
                    updatePodcastCollectionSchema(freshItems);
                    // Keep already-rendered podcast cards stable when the API refresh completes.
                    // Replacing the entire grid here caused cards to disappear/reappear during scroll.
                    applyView({ preserveExisting: true });

                } catch (err) {
                    console.error("NightCast Feed Error:", err);

                    if (cached.length) {
                        // Keep cached podcasts visible if both network sources fail.
                        state.all = cached;
                        updateLatest(cached);
                        updatePodcastCollectionSchema(cached);
                        applyView();
                        return;
                    }

                    els.grid.className = "podcast-grid";
                    els.grid.innerHTML = `
                        <div class="error-state" style="grid-column:1/-1">
                            <i class="fa-solid fa-circle-exclamation"></i>
                            <h3>دریافت پادکست‌ها ناموفق بود</h3>
                            <p>${escapeHtml(err?.message || "خطای نامشخص")}</p>
                            <button class="btn btn-primary" data-action="reload">
                                <i class="fa-solid fa-rotate"></i>
                                تلاش دوباره
                            </button>
                        </div>
                    `;
                }
            }


            /* =========================================================
               LATEST
            ========================================================= */


            function updatePodcastCollectionSchema(items) {
                const node = document.getElementById("podcastCollectionSchema");
                if (!node || !Array.isArray(items)) return;
                const schema = {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": "آرشیو پادکست‌های NightCast",
                    "url": "https://nightcast.ir/",
                    "description": "آرشیو پادکست‌های صوتی NightCast با خلاصه و تحلیل کتاب، روان‌شناسی، رشد فردی و مدیریت.",
                    "inLanguage": "fa-IR",
                    "isPartOf": { "@type": "WebSite", "name": "NightCast", "url": "https://nightcast.ir/" },
                    "mainEntity": {
                        "@type": "ItemList",
                        "numberOfItems": items.length,
                        "itemListElement": items.map((p, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "PodcastEpisode",
                                "name": String(p.title || p.book_name || "پادکست NightCast"),
                                "description": String(p.short_description || p.description || p.summary || ""),
                                "url": "https://nightcast.ir/#podcast-" + encodeURIComponent(String(p.slug || p.id || "")),
                                "image": (localizeCover(p.cover_url) || placeholder),
                                "inLanguage": "fa-IR",
                                "datePublished": p.publish_date || p.created_at || undefined,
                                "duration": Number(p.duration_seconds) > 0 ? "PT" + Math.floor(Number(p.duration_seconds) / 60) + "M" + (Number(p.duration_seconds) % 60) + "S" : undefined,
                                "associatedMedia": p.audio_url ? { "@type": "AudioObject", "contentUrl": String(p.audio_url), "encodingFormat": "audio/mpeg" } : undefined,
                                "author": { "@type": "Person", "name": String(p.author_name || "NightCast") }
                            }
                        }))
                    }
                };
                node.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
            }

            // Keep one random featured podcast per page load. If cached and fresh
            // API data both arrive, retain the same selection when that record exists.
            let featuredPodcastId = null;

            function updateLatest(items) {
                // The canonical archive no longer includes the welcome/featured hero.
                // Keep shared data-loading code safe on pages where these optional controls do not exist.
                if (!els.latestTitle || !els.latestPlay || !els.latestCta) return;
                const eligible = Array.isArray(items) ? items.filter(item => item && item.id != null) : [];
                if (!eligible.length) {
                    els.latestTitle.textContent = "هنوز پادکستی برای پیشنهاد وجود ندارد.";
                    els.latestPlay.disabled = true;
                    els.latestCta.disabled = true;
                    return;
                }

                let featured = eligible.find(item => String(item.id) === String(featuredPodcastId));
                if (!featured) {
                    featured = eligible[Math.floor(Math.random() * eligible.length)];
                    featuredPodcastId = featured.id;
                }

                const title = featured.title || "بدون عنوان";
                els.latestTitle.textContent = title;
                els.latestPlay.disabled = !featured.audio_url;
                els.latestCta.disabled = !featured.audio_url;
                els.latestPlay.setAttribute("aria-label", "پخش پادکست ویژه: " + title);
                els.latestPlay.onclick = () => featured.audio_url && playPodcast(featured.id);
                els.latestCta.setAttribute("aria-label", "پخش پادکست ویژه: " + title);
                els.latestCta.onclick = () => featured.audio_url && playPodcast(featured.id);
            }


            /* =========================================================
               PLAYER
            ========================================================= */

            /* Frequency-domain visualizer: driven by the currently playing media element. */
            let ncAudioContext = null;
            let ncAnalyser = null;
            let ncFrequencyData = null;
            let ncTimeData = null;
            let ncVisualizerFrame = 0;
            let ncVisualizerUnavailable = false;
            let ncVisualizerLastFrame = 0;
            let ncVisualizerLevels = [];

            function prepareAudioVisualizer() {
                const canvas = document.getElementById("ncAudioVisualizer");
                const status = document.getElementById("ncVisualizerStatus");
                if (!canvas) return;
                if (ncVisualizerUnavailable) {
                    if (status) status.textContent = "پخش فعال است؛ تحلیل این منبع محدود است";
                    return;
                }
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) throw new Error("Web Audio unavailable");
                    if (!ncAudioContext) {
                        ncAudioContext = new AudioContextClass();
                        ncAnalyser = ncAudioContext.createAnalyser();
                        /* Short analysis window + low analyser smoothing keeps speech transients responsive. */
                        ncAnalyser.fftSize = 256;
                        ncAnalyser.minDecibels = -88;
                        ncAnalyser.maxDecibels = -20;
                        ncAnalyser.smoothingTimeConstant = 0.42;
                        ncFrequencyData = new Uint8Array(ncAnalyser.frequencyBinCount);
                        ncTimeData = new Uint8Array(ncAnalyser.fftSize);
                        const source = ncAudioContext.createMediaElementSource(els.audio);
                        source.connect(ncAnalyser);
                        ncAnalyser.connect(ncAudioContext.destination);
                    }
                    if (ncAudioContext.state === "suspended") ncAudioContext.resume().catch(() => {});
                    if (status) status.textContent = "تحلیل زنده صدا";
                    drawAudioVisualizer();
                } catch (error) {
                    ncVisualizerUnavailable = true;
                    if (status) status.textContent = "نمایش فرکانس در دسترس نیست";
                    console.warn("NightCast visualizer unavailable:", error);
                }
            }

            function drawAudioVisualizer() {
                cancelAnimationFrame(ncVisualizerFrame);
                const canvases = [
                    document.getElementById("ncAudioVisualizerPrev"),
                    document.getElementById("ncAudioVisualizer")
                ].filter(Boolean);
                const renderTargets = canvases.map(canvas => ({
                    canvas,
                    context: canvas.getContext("2d", { alpha: true, desynchronized: true })
                })).filter(target => target.context);
                if (!renderTargets.length || !ncAnalyser || !ncFrequencyData || !ncTimeData) return;

                const render = timestamp => {
                    if (timestamp - ncVisualizerLastFrame < 30) {
                        ncVisualizerFrame = requestAnimationFrame(render);
                        return;
                    }
                    ncVisualizerLastFrame = timestamp;
                    ncAnalyser.getByteFrequencyData(ncFrequencyData);
                    ncAnalyser.getByteTimeDomainData(ncTimeData);

                    // Both canvases use the same analyser samples and the same computed levels.
                    // The previous-side copy is mirrored by CSS, not independently animated.
                    const primary = renderTargets.find(target => target.canvas.id === "ncAudioVisualizer") || renderTargets[0];
                    const width = primary.canvas.clientWidth || 38;
                    const height = primary.canvas.clientHeight || 34;
                    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
                    const bars = Math.max(16, Math.min(36, Math.floor(width / 2.2)));
                    const gap = Math.max(1, Math.min(2.2, width / (bars * 10)));
                    const barWidth = Math.max(1, (width - gap * (bars - 1)) / bars);
                    const mid = height / 2;
                    const maxHeight = Math.max(5, height - 5);

                    if (ncVisualizerLevels.length !== bars) ncVisualizerLevels = Array(bars).fill(0.035);
                    const levels = [];
                    for (let i = 0; i < bars; i++) {
                        const from = Math.floor(i * ncFrequencyData.length / bars);
                        const to = Math.max(from + 1, Math.floor((i + 1) * ncFrequencyData.length / bars));
                        let freqTotal = 0;
                        for (let j = from; j < to; j++) freqTotal += ncFrequencyData[j];
                        const frequency = (freqTotal / (to - from)) / 255;

                        const tFrom = Math.floor(i * ncTimeData.length / bars);
                        const tTo = Math.max(tFrom + 1, Math.floor((i + 1) * ncTimeData.length / bars));
                        let energy = 0;
                        for (let j = tFrom; j < tTo; j++) {
                            const sample = (ncTimeData[j] - 128) / 128;
                            energy += sample * sample;
                        }
                        const rms = Math.sqrt(energy / (tTo - tFrom));
                        const target = Math.min(1, Math.pow(frequency, .58) * .72 + Math.pow(rms, .72) * .9);
                        const previous = ncVisualizerLevels[i];
                        const level = previous + (target - previous) * (target > previous ? .72 : .28);
                        ncVisualizerLevels[i] = level;
                        levels.push(level);
                    }

                    renderTargets.forEach(({ canvas, context }) => {
                        const canvasWidth = canvas.clientWidth || width;
                        const canvasHeight = canvas.clientHeight || height;
                        const pixelWidth = Math.max(1, Math.round(canvasWidth * dpr));
                        const pixelHeight = Math.max(1, Math.round(canvasHeight * dpr));
                        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
                            canvas.width = pixelWidth;
                            canvas.height = pixelHeight;
                        }
                        context.setTransform(dpr, 0, 0, dpr, 0, 0);
                        context.clearRect(0, 0, canvasWidth, canvasHeight);
                        const gradient = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
                        gradient.addColorStop(0, "#43d9ff");
                        gradient.addColorStop(.52, "#55aaff");
                        gradient.addColorStop(1, "#b5a0ff");
                        context.fillStyle = gradient;
                        context.shadowColor = "rgba(62,181,255,.28)";
                        context.shadowBlur = 3;
                        const canvasMid = canvasHeight / 2;
                        const canvasMaxHeight = Math.max(5, canvasHeight - 5);
                        const canvasGap = Math.max(1, Math.min(2.2, canvasWidth / (bars * 10)));
                        const canvasBarWidth = Math.max(1, (canvasWidth - canvasGap * (bars - 1)) / bars);
                        levels.forEach((level, i) => {
                            const barHeight = Math.max(2.5, level * canvasMaxHeight);
                            const x = i * (canvasBarWidth + canvasGap);
                            const y = canvasMid - barHeight / 2;
                            const radius = Math.min(canvasBarWidth / 2, 2.5);
                            context.beginPath();
                            if (typeof context.roundRect === "function") context.roundRect(x, y, canvasBarWidth, barHeight, radius);
                            else context.rect(x, y, canvasBarWidth, barHeight);
                            context.fill();
                        });
                        context.shadowBlur = 0;
                    });

                    if (!els.audio.paused && !els.audio.ended) ncVisualizerFrame = requestAnimationFrame(render);
                    else ncVisualizerFrame = 0;
                };
                ncVisualizerLastFrame = 0;
                render(performance.now());
            }

            els.audio.addEventListener("play", () => {
                if (ncAudioContext?.state === "suspended") ncAudioContext.resume().catch(() => {});
                drawAudioVisualizer();
            });
            els.audio.addEventListener("pause", () => {
                cancelAnimationFrame(ncVisualizerFrame);
                drawAudioVisualizer();
            });
            els.audio.addEventListener("ended", () => {
                cancelAnimationFrame(ncVisualizerFrame);
                drawAudioVisualizer();
            });
            els.audio.addEventListener("error", () => {
                /* If a cross-origin source rejects CORS mode, retry ordinary playback without breaking the player. */
                if (els.audio.dataset.ncCorsFallback === "1" || !state.current || els.audio.crossOrigin !== "anonymous") return;
                els.audio.dataset.ncCorsFallback = "1";
                ncVisualizerUnavailable = true;
                const status = document.getElementById("ncVisualizerStatus");
                if (status) status.textContent = "پخش فعال است؛ تحلیل فرکانس این منبع محدود است";
                els.audio.removeAttribute("crossorigin");
                els.audio.src = state.current.audio_url;
                els.audio.load();
                els.audio.play().catch(() => toast("امکان پخش فایل صوتی وجود ندارد."));
            });

            function openDetailsForCurrentArtwork() {
                if (!state.current) {
                    toast("ابتدا یک پادکست انتخاب کنید.");
                    return;
                }
                const card = [...document.querySelectorAll(".podcast-card[data-id]")].find(item =>
                    Number(item.dataset.id) === Number(state.current.id));
                const detailButton = card?.querySelector('[data-action="details"]');
                if (detailButton) detailButton.click();
                else openPodcastDetails(state.current.id);
            }

            els.playerCover?.addEventListener("click", openDetailsForCurrentArtwork);
            els.playerCover?.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetailsForCurrentArtwork();
                }
            });

            function playPodcast(id) {

                const p =
                    state.all.find(
                        x =>
                            Number(x.id) ===
                            Number(id)
                    );


                if (!p) {

                    toast(
                        "پادکست مورد نظر پیدا نشد."
                    );

                    return;

                }


                if (!p.audio_url) {

                    toast(
                        "فایل صوتی این پادکست موجود نیست."
                    );

                    return;

                }


                state.current =
                    p;


                els.player.classList.add(
                    "show"
                );

                els.player.setAttribute("aria-hidden", "false");
                els.player.style.transform = "";
                els.player.style.opacity = "";
                els.player.classList.remove("nc-player-dragging");


                document.body.classList.add(
                    "player-open"
                );


                els.playerTitle.textContent =
                    p.title ||
                    "بدون عنوان";


                els.playerAuthor.textContent =
                    p.author_name ||
                    "NightCast Radio";


                els.playerCover.src =
                    localizeCover(p.cover_url) || placeholder;


                els.playerCover.alt =
                    p.title ||
                    "NightCast";

                syncNowPlayingDetails();
                
                els.audio.pause();


                /* CORS is needed for the analyser to read actual frequency bins. */
                els.audio.dataset.ncCorsFallback = "0";
                els.audio.crossOrigin = "anonymous";
                prepareAudioVisualizer();
                els.audio.src =
                    p.audio_url;


                els.audio.load();

                try {
                    var clubPodcastEvent;
                    if (typeof CustomEvent === "function") {
                        clubPodcastEvent = new CustomEvent("nightcast:podcastchange", { detail: { podcastId: Number(p.id) } });
                    } else {
                        clubPodcastEvent = document.createEvent("CustomEvent");
                        clubPodcastEvent.initCustomEvent("nightcast:podcastchange", false, false, { podcastId: Number(p.id) });
                    }
                    window.dispatchEvent(clubPodcastEvent);
                } catch (clubEventError) {
                    /* Tracking is optional and must never interrupt playback on older browsers. */
                }

                els.audio
                    .play()
                    .then(() => {
                        updateMediaSession();
                        updateCardPlaying();
                    })
                    .catch(() => {
                        updateCardPlaying();
                        toast("امکان پخش فایل صوتی وجود ندارد.");
                    });

                // Reflect the selected podcast immediately; the audio events
                // below will confirm the final playing/paused state.
                updateCardPlaying();

            }


            function syncNowPlayingDetails() {
                const p = state.current;
                if (!p) return;
                const setText = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value || "";
                };
                const cover = document.getElementById("ncNowCover");
                if (cover) {
                    cover.src = localizeCover(p.cover_url) || placeholder;
                    cover.alt = p.title || "NightCast";
                }
                [document.getElementById("ncPlayerLike"), document.getElementById("ncNowLike")].filter(Boolean).forEach(button => {
                    button.dataset.likeId = String(p.id);
                    button.hidden = false;
                });
                syncFavoriteButtons(p.id);
                setText("ncNowTitle", p.title || "بدون عنوان");
                setText("ncNowAuthor", p.author_name || "NightCast Radio");

                const shortDescription = String(p.short_description || p.description || "").trim();
                const summary = String(p.summary || "").trim();
                const descriptionParts = [];
                if (shortDescription) descriptionParts.push(shortDescription);
                if (summary && summary !== shortDescription) descriptionParts.push("خلاصه اپیزود:\n" + summary);
                if (p.long_description || p.transcript) descriptionParts.push("متن کامل اپیزود در پنجره «جزئیات» کارت پادکست در دسترس است.");
                setText("ncNowDescription", descriptionParts.join("\n\n") || "توضیحی برای این پادکست ثبت نشده است.");

                const book = document.getElementById("ncNowBook");
                if (book) {
                    book.textContent = p.book_name || "";
                    book.hidden = !p.book_name;
                }
                const meta = document.getElementById("ncNowMeta");
                if (meta) {
                    const chips = [];
                    const category = p.category_name || p.category;
                    const duration = formatTime(p.duration_seconds || p.duration || 0);
                    const published = formatPodcastDate(p.publish_date || p.published_at || p.created_at);
                    if (category) chips.push(category);
                    if (duration !== "00:00") chips.push("مدت: " + duration);
                    if (p.episode_number) chips.push("قسمت: " + p.episode_number);
                    if (published) chips.push("انتشار: " + published);
                    meta.innerHTML = chips.map(x => "<span>" + escapeHtml(String(x)) + "</span>").join("");
                }
                updateNowPlayingControls();
            }

            function updateNowPlayingControls() {
                const button = document.getElementById("ncNowToggle");
                const icon = button?.querySelector("i");
                const playing = !!state.current && !els.audio.paused && !els.audio.ended;
                if (icon) icon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
                if (button) button.setAttribute("aria-label", playing ? "توقف موقت" : "ادامه پخش");
                const progress = document.getElementById("ncNowProgress");
                if (progress && els.audio.duration) progress.value = (els.audio.currentTime / els.audio.duration) * 100;
                const current = document.getElementById("ncNowCurrent");
                const duration = document.getElementById("ncNowDuration");
                if (current) current.textContent = formatTime(els.audio.currentTime);
                if (duration) duration.textContent = formatTime(els.audio.duration);
            }

            function openNowPlaying() {
                if (!state.current) {
                    toast("ابتدا یک پادکست انتخاب کنید.");
                    return;
                }
                syncNowPlayingDetails();
                const panel = document.getElementById("ncNowPlaying");
                panel?.classList.add("open");
                panel?.setAttribute("aria-hidden", "false");
                document.body.classList.add("nc-now-open");
                document.getElementById("ncNowClose")?.focus({ preventScroll: true });
            }

            function closeNowPlaying() {
                const panel = document.getElementById("ncNowPlaying");
                panel?.classList.remove("open");
                panel?.setAttribute("aria-hidden", "true");
                document.body.classList.remove("nc-now-open");
                els.playerCover?.focus?.({ preventScroll: true });
            }

            function togglePlay() {

                if (!state.current) {

                    toast(
                        "ابتدا یک پادکست انتخاب کنید."
                    );

                    return;

                }


                if (
                    els.audio.paused
                ) {

                    els.audio
                        .play()
                        .catch(
                            () =>
                                toast(
                                    "امکان پخش فایل صوتی وجود ندارد."
                                )
                        );

                } else {

                    els.audio.pause();

                }

            }


            function nextPodcast(dir = 1) {

                if (!state.current) {
                    return;
                }


                const i =
                    state.all.findIndex(
                        x =>
                            Number(x.id) ===
                            Number(
                                state.current.id
                            )
                    );


                const n =
                    i + dir;


                if (
                    n < 0 ||
                    n >= state.all.length
                ) {

                    toast(
                        dir > 0
                            ? "این آخرین پادکست است."
                            : "این اولین پادکست است."
                    );

                    return;

                }


                playPodcast(
                    state.all[n].id
                );

            }


            function updateMediaSession() {

                if (
                    !("mediaSession" in navigator) ||
                    !state.current
                ) {

                    return;

                }


                try {

                    navigator.mediaSession.metadata =
                        new MediaMetadata({

                            title:
                                state.current.title ||
                                "NightCast",

                            artist:
                                state.current.author_name ||
                                "NightCast Radio",

                            album:
                                state.current.book_name ||
                                "NightCast Radio",

                            artwork: [

                                {
                                    src:
                                        localizeCover(state.current.cover_url) ||
                                        placeholder,

                                    sizes:
                                        "512x512",

                                    type:
                                        "image/png"
                                }

                            ]

                        });


                    navigator.mediaSession.setActionHandler(
                        "play",
                        () =>
                            els.audio.play()
                    );


                    navigator.mediaSession.setActionHandler(
                        "pause",
                        () =>
                            els.audio.pause()
                    );


                    navigator.mediaSession.setActionHandler(
                        "nexttrack",
                        () =>
                            nextPodcast(1)
                    );


                    navigator.mediaSession.setActionHandler(
                        "previoustrack",
                        () =>
                            nextPodcast(-1)
                    );

                } catch { }

            }


            /* =========================================================
               DOWNLOAD
            ========================================================= */

            function downloadPodcast(id) {

                // Downloading podcast audio is a members-only feature.
                // Keep the destination URL so the login page can return users here.
                if (!isLoggedIn()) {
                    const next = window.location.pathname + window.location.search + window.location.hash;
                    const loginUrl = new URL(CONFIG.LOGIN_PAGE, window.location.href);
                    loginUrl.searchParams.set("next", next);
                    showDownloadLoginPrompt(() => {
                        window.location.href = loginUrl.href;
                    });
                    return;
                }

                const p =
                    state.all.find(
                        x =>
                            Number(x.id) ===
                            Number(id)
                    );


                if (!p?.audio_url) {

                    toast(
                        "فایل دانلود موجود نیست."
                    );

                    return;

                }


                const a =
                    document.createElement(
                        "a"
                    );


                a.href =
                    p.audio_url;

                a.target =
                    "_blank";

                a.rel =
                    "noopener";

                a.click();

            }


            /* =========================================================
               SOCIAL
            ========================================================= */

            function renderSocials() {

                els.socialMenu.innerHTML =
                    CONFIG.SOCIALS
                        .map(
                            s =>
                                `
                                                                                                                    <a
                                                                                                                        class="social-item"
                                                                                                                        href="${s.url || "#"}"
                                                                                                                        data-social="${s.key}"
                                                                                                                        ${s.url
                                    ? 'target="_blank" rel="noopener noreferrer"'
                                    : ""
                                }>

                                                                                                                        <i class="${s.icon}"></i>

                                                                                                                        <span>
                                                                                                                            ${s.label}
                                                                                                                        </span>

                                                                                                                    </a>
                                                                                                                    `
                        )
                        .join("");

            }


        /* =========================================================
           EVENTS
        ========================================================= */
        
        function bindEvents() {
        
        
            /* -----------------------------------------------------
               Podcast Grid
            ----------------------------------------------------- */
        
            els.grid.addEventListener(
                "click",
                e => {

                    // Clicking the artwork itself must use the exact same play/pause
                    // state as the card's play button. Ignore clicks on controls layered
                    // over the artwork so they are handled only by their own action.
                    const cover = e.target.closest(".podcast-cover");
                    if (cover && !e.target.closest("[data-action]")) {
                        const card = cover.closest(".podcast-card[data-id]");
                        const playButton = card?.querySelector('[data-action="play"]');
                        if (playButton && !playButton.disabled) {
                            const id = card.dataset.id;
                            if (state.current && Number(state.current.id) === Number(id)) {
                                togglePlay();
                            } else {
                                playPodcast(id);
                            }
                        }
                        return;
                    }

                    const el =
                        e.target.closest(
                            "[data-action]"
                        );
        
                    if (!el) {
                        return;
                    }
        
                    const id =
                        el.dataset.id;
        
                    const action =
                        el.dataset.action;
        
        
                    if (
                        action === "play"
                    ) {
                        if (state.current && Number(state.current.id) === Number(id)) {
                            togglePlay();
                        } else {
                            playPodcast(id);
                        }
        
                    }
        
                    else if (action === "details") {
                        openPodcastDetails(id);
                    }

                    else if (action === "share") {
                        sharePodcast(id);
                    }

                    else if (action === "close-details") {
                        closePodcastDetails();
                    }

                    else if (
                        action === "favorite"
                    ) {
        
                        toggleFavorite(
                            id
                        );
        
                    }
        
                    else if (action === "comments") {
                        if (typeof window.NightCastOpenPodcastComments === "function") {
                            window.NightCastOpenPodcastComments(id);
                        } else {
                            console.error("NightCast comments module is not ready.");
                            toast("پنجره دیدگاه‌ها بارگذاری نشده است. صفحه را یک‌بار تازه‌سازی کنید.");
                        }
                    }

                    else if (
                        action === "download"
                    ) {
        
                        downloadPodcast(
                            id
                        );
        
                    }
        
                    else if (
                        action === "reload"
                    ) {
        
                        loadPodcasts();
        
                    }
        
                    else if (
                        action === "clear-search"
                    ) {
        
                        state.query =
                            "";
        
                        els.search.value =
                            "";
        
                        els.clear.classList.remove(
                            "show"
                        );
        
                        state.page =
                            1;
        
                        applyView();
        
                    }
        
                }
            );
        
        
            /* -----------------------------------------------------
               Search
            ----------------------------------------------------- */
        
            els.search.addEventListener(
                "input",
                () => {
        
                    state.query =
                        els.search.value.trim();
        
        
                    els.clear.classList.toggle(
                        "show",
                        !!state.query
                    );
        
        
                    clearTimeout(
                        state.searchTimer
                    );
        
        
                    state.searchTimer =
                        setTimeout(
                            () => {
        
                                state.page =
                                    1;
        
                                applyView();
        
                            },
                            180
                        );
        
                }
            );
        
        
            els.clear.addEventListener(
                "click",
                () => {
                    clearTimeout(state.searchTimer);
        
                    els.search.value =
                        "";
        
                    state.query =
                        "";
        
                    els.clear.classList.remove(
                        "show"
                    );
        
                    state.page =
                        1;
        
                    applyView();
        
                    els.search.focus();
        
                }
            );
        
        
            /* -----------------------------------------------------
               Player
            ----------------------------------------------------- */
        
            els.play.addEventListener(
                "click",
                togglePlay
            );

            // Tapping the mini-player artwork opens a full-screen podcast view.
            els.playerCover.setAttribute("role", "button");
            els.playerCover.setAttribute("tabindex", "0");
            els.playerCover.setAttribute("aria-label", "نمایش جزئیات پادکست");
            els.playerCover.addEventListener("click", openNowPlaying);
            els.playerCover.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openNowPlaying();
                }
            });
            document.getElementById("ncNowClose")?.addEventListener("click", closeNowPlaying);
            document.getElementById("ncNowToggle")?.addEventListener("click", togglePlay);
            document.getElementById("ncNowPrev")?.addEventListener("click", () => nextPodcast(-1));
            document.getElementById("ncNowNext")?.addEventListener("click", () => nextPodcast(1));
            document.getElementById("ncNowShare")?.addEventListener("click", () => { if (state.current) sharePodcast(state.current.id); else toast("ابتدا یک پادکست انتخاب کنید."); });
            document.getElementById("ncPlayerLike")?.addEventListener("click", () => { if (state.current) toggleFavorite(state.current.id); });
            document.getElementById("ncNowLike")?.addEventListener("click", () => { if (state.current) toggleFavorite(state.current.id); });
            document.getElementById("ncNowProgress")?.addEventListener("input", e => {
                if (els.audio.duration) els.audio.currentTime = (Number(e.target.value) / 100) * els.audio.duration;
            });
            document.addEventListener("keydown", e => {
                if (e.key === "Escape" && document.getElementById("ncNowPlaying")?.classList.contains("open")) closeNowPlaying();
            });
        
        
            els.prev.addEventListener(
                "click",
                () =>
                    nextPodcast(-1)
            );
        
        
            els.next.addEventListener(
                "click",
                () =>
                    nextPodcast(1)
            );
        
        
            els.progress.addEventListener(
                "input",
                () => {
        
                    if (
                        els.audio.duration
                    ) {
        
                        els.audio.currentTime =
                            (
                                els.progress.value /
                                100
                            ) *
                            els.audio.duration;
        
                    }
        
                }
            );
        
        
            els.volume.addEventListener(
                "input",
                () =>
                    els.audio.volume =
                    Number(
                        els.volume.value
                    ) / 100
            );
        
        
            els.audio.volume =
                1;
        
        
            els.audio.addEventListener(
                "play",
                () => {
                    els.playIcon.className = "fa-solid fa-pause";
                    updateCardPlaying();
                }
            );

            els.audio.addEventListener(
                "pause",
                () => {
                    els.playIcon.className = "fa-solid fa-play";
                    updateCardPlaying();
                    updateNowPlayingControls();
                }
            );

            els.audio.addEventListener("ended", updateCardPlaying);
        
        
            els.audio.addEventListener(
                "timeupdate",
                () => {
        
                    if (
                        els.audio.duration
                    ) {
        
                        els.progress.value =
                            (
                                els.audio.currentTime /
                                els.audio.duration
                            ) *
                            100;
        
        
                        els.current.textContent =
                            formatTime(
                                els.audio.currentTime
                            );
                        updateNowPlayingControls();
        
                    }
        
                }
            );
        
        
            els.audio.addEventListener(
                "loadedmetadata",
                () =>
                    els.duration.textContent =
                    formatTime(
                        els.audio.duration
                    )
            );
        
        
            els.audio.addEventListener(
                "ended",
                () =>
                    nextPodcast(1)
            );
        
        
            els.audio.addEventListener(
                "error",
                () =>
                    toast(
                        "فایل صوتی قابل پخش نیست."
                    )
            );
        
        
            /* -----------------------------------------------------
               Social
            ----------------------------------------------------- */
        
            els.socialToggle.addEventListener(
                "click",
                e => {
        
                    e.stopPropagation();
        
        
                    els.socialWrap.classList.toggle(
                        "open"
                    );
        
        
                    els.socialToggle.setAttribute(
                        "aria-expanded",
                        els.socialWrap.classList.contains(
                            "open"
                        )
                    );
        
                }
            );
        
        
            /* -----------------------------------------------------
               USER BUTTON
            ----------------------------------------------------- */
        
            els.loginBtn.addEventListener(
                "click",
                openUserAccount
            );
        
        
            /* -----------------------------------------------------
               BOOK SUMMARY REQUEST
            ----------------------------------------------------- */
        
            const requestBookSummaryBtn =
                document.getElementById(
                    "requestBookSummaryBtn"
                );
            
            const homeBookSummaryRequestBtn =
            document.getElementById(
                "homeBookSummaryRequestBtn"
            );
        
            const bookSummaryRequestModal =
                document.getElementById(
                    "bookSummaryRequestModal"
                );
        
        
            const bookSummaryRequestClose =
                document.getElementById(
                    "bookSummaryRequestClose"
                );
        
        
            const bookSummaryRequestCancel =
                document.getElementById(
                    "bookSummaryRequestCancel"
                );
        
        
            const bookSummaryRequestForm =
                document.getElementById(
                    "bookSummaryRequestForm"
                );
        
        
            const bookSummaryBookName =
                document.getElementById(
                    "bookSummaryBookName"
                );
        
        
            const bookSummaryAuthorName =
                document.getElementById(
                    "bookSummaryAuthorName"
                );
        
        
            const bookSummaryDescription =
                document.getElementById(
                    "bookSummaryDescription"
                );
        
        
            const bookSummaryRequestMessage =
                document.getElementById(
                    "bookSummaryRequestMessage"
                );
        
        
            const bookSummaryRequestSubmit =
                document.getElementById(
                    "bookSummaryRequestSubmit"
                );


    /* -----------------------------------------------------
       OPEN BOOK SUMMARY MODAL
    ----------------------------------------------------- */

    function openBookSummaryRequestModal() {

        if (!isLoggedIn()) {

            window.location.href =
                CONFIG.LOGIN_PAGE;

            return;
        }


        if (!bookSummaryRequestModal) {
            return;
        }


        if (bookSummaryRequestMessage) {

            bookSummaryRequestMessage.hidden =
                true;

            bookSummaryRequestMessage.textContent =
                "";

        }


        if (bookSummaryRequestForm) {

            bookSummaryRequestForm.reset();

        }


        bookSummaryRequestModal.hidden =
            false;


        requestAnimationFrame(
            () => {

                bookSummaryRequestModal.classList.add(
                    "active"
                );

            }
        );


        setTimeout(
            () => {

                if (bookSummaryBookName) {

                    bookSummaryBookName.focus();

                }

            },
            50
        );

    }


    /* -----------------------------------------------------
       CLOSE BOOK SUMMARY MODAL
    ----------------------------------------------------- */

    function closeBookSummaryRequestModal() {

        if (!bookSummaryRequestModal) {
            return;
        }


        bookSummaryRequestModal.classList.remove(
            "active"
        );


        setTimeout(
            () => {

                if (
                    bookSummaryRequestModal
                ) {

                    bookSummaryRequestModal.hidden =
                        true;

                }

            },
            200
        );

    }


   

function showBookSummaryRequestMessage(
            message,
            type = "error"
) {

            if (!bookSummaryRequestMessage) {
                return;
            }

            bookSummaryRequestMessage.textContent =
                message;

            bookSummaryRequestMessage.dataset.type =
                type;

            bookSummaryRequestMessage.hidden = false;
}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "#requestBookSummaryBtn, #homeBookSummaryRequestBtn, [data-request-book-summary]"
            );

        if (!button) {
            return;
        }

        openBookSummaryRequestModal();

    }
);


if (bookSummaryRequestClose) {

            bookSummaryRequestClose.addEventListener(
                "click",
                closeBookSummaryRequestModal
            );

}


if (bookSummaryRequestCancel) {

            bookSummaryRequestCancel.addEventListener(
                "click",
                closeBookSummaryRequestModal
            );

}


if (bookSummaryRequestModal) {

            bookSummaryRequestModal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        bookSummaryRequestModal
                    ) {
                        closeBookSummaryRequestModal();
                    }

                }
            );

}


if (bookSummaryRequestForm) {

            bookSummaryRequestForm.addEventListener(
                "submit",
                async (event) => {

                    event.preventDefault();

                    const bookName =
                        String(
                            bookSummaryBookName?.value || ""
                        ).trim();

                    const authorName =
                        String(
                            bookSummaryAuthorName?.value || ""
                        ).trim();

                    const description =
                        String(
                            bookSummaryDescription?.value || ""
                        ).trim();


                    if (!bookName) {

                        showBookSummaryRequestMessage(
                            "لطفاً نام کتاب را وارد کنید.",
                            "error"
                        );

                        bookSummaryBookName?.focus();

                        return;
                    }


                    if (bookName.length > 200) {

                        showBookSummaryRequestMessage(
                            "نام کتاب نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.",
                            "error"
                        );

                        return;
                    }


                    if (authorName.length > 200) {

                        showBookSummaryRequestMessage(
                            "نام نویسنده نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.",
                            "error"
                        );

                        return;
                    }


                    if (description.length > 2000) {

                        showBookSummaryRequestMessage(
                            "توضیحات نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد.",
                            "error"
                        );

                        return;
                    }


                    if (!isLoggedIn()) {

                        window.location.href =
                            CONFIG.LOGIN_PAGE;

                        return;
                    }


                    try {
                        window.NightCastShield.getProof("suggestion");
                    } catch (error) {
                        showBookSummaryRequestMessage(
                            error.message || "لطفاً پاسخ پرسش امنیتی را وارد کنید.",
                            "error"
                        );
                        return;
                    }

                    const originalButtonHTML =
                        bookSummaryRequestSubmit.innerHTML;


                    bookSummaryRequestSubmit.disabled =
                        true;


                  bookSummaryRequestSubmit.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> در حال ثبت...';


                    bookSummaryRequestMessage.hidden =
                        true;


                    try {

                        const result =
                            await requestBookSummary({

                                book_name:
                                    bookName,

                                author_name:
                                    authorName,

                                description:
                                    description

                            });


                        if (!result.success) {

                            showBookSummaryRequestMessage(
                                result.message ||
                                "ثبت درخواست انجام نشد.",
                                "error"
                            );

                            return;
                        }


                        bookSummaryRequestForm.reset();

                        if (window.NightCastSuccessDialog && typeof window.NightCastSuccessDialog.show === "function") {
                            await window.NightCastSuccessDialog.show({
                                title: "درخواست ثبت شد",
                                message: result.message || "درخواست پادکست پیشنهادی شما با موفقیت ثبت شد. از پیشنهاد ارزشمندتان سپاسگزاریم."
                            });
                        } else {
                            showBookSummaryRequestMessage(
                                result.message || "درخواست شما با موفقیت ثبت شد.",
                                "success"
                            );
                        }
                        closeBookSummaryRequestModal();


                    }
                    catch (error) {

                        console.error(
                            "NightCast Book Summary Form Error:",
                            error
                        );

                        showBookSummaryRequestMessage(
                            "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
                            "error"
                        );

                    }
                    finally {

                        bookSummaryRequestSubmit.disabled =
                            false;

                        bookSummaryRequestSubmit.innerHTML =
                            originalButtonHTML;

                    }

                }
            );

}


/* -----------------------------------------------------
           ESC → CLOSE BOOK SUMMARY MODAL
----------------------------------------------------- */

document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape" &&
                    bookSummaryRequestModal &&
                    !bookSummaryRequestModal.hidden
                ) {

                    closeBookSummaryRequestModal();

                }

            }
);


                /* -----------------------------------------------------
                     PROFILE CLOSE
                ----------------------------------------------------- */

                const profileClose =
                    document.getElementById(
                        "profileClose"
                    );

                if (profileClose) {

                    profileClose.addEventListener(
                        "click",
                        closeProfileOverlay
                    );

                }


                /* -----------------------------------------------------
                      PROFILE SETTINGS SHORTCUT
                 ----------------------------------------------------- */

                // Theme selection is bound by /js/nightcast-theme.js.
                // Keep this shortcut inside the profile overlay; do not scroll away or close the profile.


            /* -----------------------------------------------------
                      PROFILE LOGOUT
                 ----------------------------------------------------- */

                const profileLogout =
                    document.getElementById(
                        "profileLogout"
                    );

                if (profileLogout) {

                    profileLogout.addEventListener(
                        "click",
                        logoutUser
                    );

                }


                /* -----------------------------------------------------
                   PROFILE BACKDROP
                ----------------------------------------------------- */

                const profileOverlay =
                    document.getElementById(
                        "profileOverlay"
                    );

                if (profileOverlay) {

                    profileOverlay.addEventListener(
                        "click",
                        event => {

                            if (
                                event.target ===
                                profileOverlay
                            ) {

                                closeProfileOverlay();

                            }

                        }
                    );

                }

                /* -----------------------------------------------------
                   Mobile Navigation
                ----------------------------------------------------- */

                $$(".mobile-nav a")
                    .forEach(
                        a =>
                            a.addEventListener(
                                "click",
                                () => {

                                    $$(".mobile-nav a")
                                        .forEach(
                                            x =>
                                                x.classList.remove(
                                                    "active"
                                                )
                                        );


                                    a.classList.add(
                                        "active"
                                    );

                                }
                            )
                    );

            }

            /* -----------------------------------------------------
               PROFILE ESCAPE KEY
              ----------------------------------------------------- */

            document.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Escape"
                    ) {

                        const overlay =
                            document.getElementById(
                                "profileOverlay"
                            );

                        if (
                            overlay &&
                            overlay.classList.contains(
                                "show"
                            )
                        ) {

                            closeProfileOverlay();

                        }

                    }

                }
            );
            /* =========================================================
               PREVENT ZOOM
            ========================================================= */

            function preventZoom() {

                document.addEventListener(
                    "gesturestart",
                    e =>
                        e.preventDefault(),
                    {
                        passive: false
                    }
                );


                document.addEventListener(
                    "gesturechange",
                    e =>
                        e.preventDefault(),
                    {
                        passive: false
                    }
                );


                document.addEventListener(
                    "gestureend",
                    e =>
                        e.preventDefault(),
                    {
                        passive: false
                    }
                );


                let last =
                    0;


                document.addEventListener(
                    "touchend",
                    e => {

                        const now =
                            Date.now();


                        if (
                            now - last <
                            300
                        ) {

                            e.preventDefault();

                        }


                        last =
                            now;

                    },
                    {
                        passive: false
                    }
                );

            }


            /* =========================================================
               STORAGE / AUTH SYNC
            ========================================================= */

            window.addEventListener(
                "storage",
                event => {

                    if (
                        event.key ===
                        CONFIG.USER_KEY ||
                        event.key ===
                        CONFIG.TOKEN_KEY
                    ) {

                        updateUserUI();

                        loadFavorites();

                    }

                }
            );


            window.addEventListener(
                "pageshow",
                () => {

                    updateUserUI();

                    loadFavorites();

                }
            );


            document.addEventListener(
                "visibilitychange",
                () => {

                    if (
                        document.visibilityState ===
                        "visible"
                    ) {

                        updateUserUI();

                    }

                }
            );


            /* =========================================================
               INIT
            ========================================================= */

            function init() {


                $("#year").textContent =
                    new Date()
                        .getFullYear()
                        .toLocaleString(
                            "fa-IR"
                        );


                /*
                 * مهم:
                 * قبل از هر چیز وضعیت کاربر را
                 * از localStorage بخوان.
                 */

                updateUserUI();


                renderSocials();


                bindEvents();


                preventZoom();


                // Keep the galaxy loader until podcast data, favorites, fonts and the first render settle.
                const archiveReady = Promise.allSettled([loadPodcasts(), loadFavorites()]);
                const fontsReady = document.fonts && document.fonts.ready
                    ? document.fonts.ready.catch(() => undefined)
                    : Promise.resolve();
                let loaderDismissed = false;
                const dismissArchiveLoader = () => {
                    if (loaderDismissed) return;
                    loaderDismissed = true;
                    // The theme controller owns the visual progress and final fade-out.
                    window.dispatchEvent(new CustomEvent("nightcast:catalog-ready"));
                    const loader = document.getElementById("nc-entry-loader");
                    document.body.removeAttribute("aria-busy");
                    if (!loader) return;
                    // Defensive fallback if the theme controller is unavailable.
                    window.setTimeout(() => {
                        const activeLoader = document.getElementById("nc-entry-loader");
                        if (!activeLoader || activeLoader.classList.contains("is-hidden")) return;
                        activeLoader.classList.add("is-hidden");
                        window.setTimeout(() => activeLoader.remove(), 500);
                    }, 1800);
                };
                // The cached catalogue has already been rendered synchronously. Reveal it after
                // the first paint while the live API refresh continues in the background.
                if (window.__NC_CACHED_CATALOG_RENDERED) {
                    requestAnimationFrame(() => requestAnimationFrame(dismissArchiveLoader));
                }
                // A failed or stalled third-party request must never trap a listener behind the loader.
                window.setTimeout(dismissArchiveLoader, 25000);
                Promise.all([archiveReady, fontsReady]).then(() => {
                    requestAnimationFrame(() => requestAnimationFrame(dismissArchiveLoader));
                });
}


            document.readyState === "loading"

                ? document.addEventListener(
                    "DOMContentLoaded",
                    init
                )

                : init();


        })();

    