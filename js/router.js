
/* NightCast cinematic entry router — progress follows actual startup work. */
(function () {
    "use strict";
    const MIN_SPLASH_MS = 1150;
    const MAX_AUTH_WAIT_MS = 6500;
    const FADE_MS = 720;
    let progressTimer = 0;

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const bounded = (promise, ms, fallback) => Promise.race([
        Promise.resolve(promise).catch(() => fallback),
        sleep(ms).then(() => fallback)
    ]);

    function setProgress(value, label) {
        const bar = document.getElementById("loaderProgress");
        const caption = document.querySelector(".loader small");
        if (bar) bar.style.width = Math.max(0, Math.min(100, value)) + "%";
        if (caption && label) caption.textContent = label;
    }

    function animateProgress() {
        const start = performance.now();
        const stages = [
            [0, "در حال بیدار کردن جهان NightCast…"],
            [22, "در حال آماده‌سازی فضا…"],
            [48, "در حال بررسی نشست کاربری…"],
            [68, "در حال تنظیم مسیر شنیدن…"],
            [84, "تقریباً آماده‌ایم…"]
        ];
        progressTimer = window.setInterval(() => {
            const elapsed = performance.now() - start;
            const ratio = Math.min(.86, elapsed / 1500);
            const stage = stages[Math.min(stages.length - 1, Math.floor(ratio * stages.length))];
            const current = Number.parseFloat(document.getElementById("loaderProgress")?.style.width || "0");
            setProgress(Math.min(88, Math.max(current, ratio * 100)), stage[1]);
        }, 100);
    }

    async function navigate() {
        const splash = document.getElementById("appSplash");
        animateProgress();
        const started = performance.now();

        let destination = "/users/index.html";
        try {
            const fontReady = document.fonts && document.fonts.ready
                ? bounded(document.fonts.ready, 1800, null)
                : Promise.resolve(null);
            const stylesheetReady = Promise.allSettled(
                Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => {
                    if (link.sheet) return Promise.resolve();
                    return bounded(new Promise(resolve => {
                        link.addEventListener("load", resolve, { once: true });
                        link.addEventListener("error", resolve, { once: true });
                    }), 1800, null);
                })
            );
            await Promise.all([fontReady, stylesheetReady]);
            setProgress(52, "ظاهر و نوشتار در حال آماده‌شدن است");

            if (window.NightCastAuth && typeof window.NightCastAuth.isLoggedIn === "function" &&
                window.NightCastAuth.isLoggedIn() &&
                typeof window.NightCastAuth.validate === "function") {
                setProgress(70, "در حال بررسی نشست کاربری…");
                await bounded(window.NightCastAuth.validate(), MAX_AUTH_WAIT_MS, false);
            }
        } catch (error) {
            console.warn("NightCast startup checks did not complete:", error);
        }

        await sleep(Math.max(0, MIN_SPLASH_MS - (performance.now() - started)));
        clearInterval(progressTimer);
        setProgress(100, "جهان NightCast آماده است");
        await sleep(180);
        if (splash) {
            splash.classList.add("is-departing");
            await sleep(FADE_MS);
        }
        window.location.replace(destination);
    }

    document.addEventListener("DOMContentLoaded", navigate, { once: true });
})();
