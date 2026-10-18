(() => {
    "use strict";

    const CURRENT_VERSION = window.NIGHTCAST_APP_VERSION || "0.0.0";
    const VERSION_URL = new URL("/version.json", window.location.href).href;
    const FALLBACK_GITHUB_APK = "https://github.com/NightCastir/NightCast/raw/refs/heads/main/downloadrelease/NightCast.apk";

    function compareVersions(a, b) {
        const left = String(a).split(".").map(Number);
        const right = String(b).split(".").map(Number);
        for (let i = 0; i < Math.max(left.length, right.length); i++) {
            const x = Number.isFinite(left[i]) ? left[i] : 0;
            const y = Number.isFinite(right[i]) ? right[i] : 0;
            if (x !== y) return x > y ? 1 : -1;
        }
        return 0;
    }

    function safeText(value) {
        return typeof value === "string" || typeof value === "number" ? String(value) : "";
    }

    function addButton(panel, label, href, primary) {
        if (typeof href !== "string" || !/^https:\/\//i.test(href)) return;
        let parsed;
        try { parsed = new URL(href); } catch (_) { return; }
        if (parsed.protocol !== "https:") return;
        const link = document.createElement("a");
        link.href = parsed.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;
        link.style.cssText = "display:block;box-sizing:border-box;width:100%;padding:13px 16px;border-radius:12px;text-decoration:none;margin-top:10px;font-weight:700;background:" + (primary ? "#e9f5ff;color:#07111f" : "#182235;color:#fff") + ";";
        panel.appendChild(link);
    }

    function showUpdate(data) {
        if (document.getElementById("nightcastUpdateBox")) return;
        const box = document.createElement("div");
        box.id = "nightcastUpdateBox";
        box.style.cssText = "position:fixed;inset:0;z-index:2147483647;padding:20px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.78);direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif";
        const panel = document.createElement("section");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", "nightcastUpdateTitle");
        panel.style.cssText = "width:min(440px,100%);max-height:90dvh;overflow:auto;box-sizing:border-box;background:#0b1220;color:#fff;border:1px solid rgba(160,200,255,.25);border-radius:20px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.55)";
        const title = document.createElement("h2");
        title.id = "nightcastUpdateTitle";
        title.textContent = safeText(data.title) || "به‌روزرسانی NightCast";
        title.style.cssText = "margin:0 0 12px;font-size:22px";
        const message = document.createElement("p");
        message.textContent = safeText(data.message) || "نسخه جدید NightCast آماده است. برای دریافت امکانات و اصلاحات جدید، برنامه را به‌روزرسانی کنید.";
        message.style.cssText = "line-height:1.9;margin:0";
        const version = document.createElement("p");
        version.textContent = "نسخه نصب‌شده: " + CURRENT_VERSION + "  |  نسخه جدید: " + safeText(data.version);
        version.style.cssText = "font-size:13px;color:#b8c8e6;margin:14px 0 4px";
        panel.append(title, message, version);

        if (data.marketUrl) addButton(panel, "به‌روزرسانی از کافه‌بازار", data.marketUrl, true);
        addButton(panel, "دانلود مستقیم از GitHub", data.githubUrl || FALLBACK_GITHUB_APK, !data.marketUrl);
        if (data.downloadUrl) addButton(panel, "دانلود مستقیم از وب‌سایت NightCast", data.downloadUrl, false);

        const later = document.createElement("button");
        later.type = "button";
        later.textContent = "بعداً";
        later.style.cssText = "width:100%;margin-top:12px;padding:12px;border:0;border-radius:12px;background:transparent;color:#b8c8e6;font-size:14px;cursor:pointer";
        later.addEventListener("click", () => box.remove());
        panel.appendChild(later);
        box.appendChild(panel);
        document.body.appendChild(box);
    }

    async function check() {
        // This prompt is for the installed Android app, not ordinary web visitors.
        const nativeCapacitor = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
        if (!nativeCapacitor) return;
        if (!CURRENT_VERSION || CURRENT_VERSION === "0.0.0") {
            console.warn("NightCast update check skipped: bundled app version is missing.");
            return;
        }
        try {
            const response = await fetch(VERSION_URL + "?t=" + Date.now(), { cache: "no-store" });
            if (!response.ok) return;
            const data = await response.json();
            if (!data || !data.version) return;
            if (compareVersions(data.version, CURRENT_VERSION) > 0) showUpdate(data);
        } catch (error) {
            console.info("NightCast update check skipped:", error);
        }
    }

    window.NightCastUpdateChecker = { check, compareVersions };
})();