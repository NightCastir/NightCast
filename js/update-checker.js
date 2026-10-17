(() => {
    "use strict";

    const CURRENT_VERSION = window.NIGHTCAST_APP_VERSION || "0.0.0";
    const VERSION_URL = "https://www.nightcast.ir/version.json";

    function compareVersions(a, b) {
        const left = String(a).split(".").map(Number);
        const right = String(b).split(".").map(Number);
        const length = Math.max(left.length, right.length);

        for (let i = 0; i < length; i++) {
            const x = Number.isFinite(left[i]) ? left[i] : 0;
            const y = Number.isFinite(right[i]) ? right[i] : 0;
            if (x > y) return 1;
            if (x < y) return -1;
        }
        return 0;
    }

    function element(tag, styles, text) {
        const node = document.createElement(tag);
        if (styles) node.style.cssText = styles;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function showUpdate(data) {
        if (document.getElementById("nightcastUpdateBox")) return;

        let downloadUrl;
        try {
            downloadUrl = new URL(String(data.downloadUrl || ""));
        } catch {
            return;
        }
        if (downloadUrl.protocol !== "https:") return;

        const box = document.createElement("div");
        box.id = "nightcastUpdateBox";
        box.style.cssText = "position:fixed;inset:0;z-index:999999;padding:20px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.70);direction:rtl;font-family:Tahoma,Arial,sans-serif";

        const panel = element("div", "width:min(420px,100%);box-sizing:border-box;background:#0b1220;color:#fff;border-radius:20px;padding:25px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.55)");
        const heading = element("h2", "margin:0 0 15px;font-size:22px", asSafeText(data.title) || "نسخه جدید NightCast");
        const message = element("p", "line-height:1.9;margin:0", asSafeText(data.message) || "نسخه جدید برنامه منتشر شده است.");
        const version = element("p", "opacity:.7;margin-top:15px", "نسخه جدید: " + asSafeText(data.version));

        const link = element("a", "display:block;background:#fff;color:#000;padding:13px;border-radius:12px;text-decoration:none;margin-top:20px;font-weight:bold", "دریافت نسخه جدید");
        link.href = downloadUrl.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const later = element("button", "width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;background:#182235;color:#fff;font-size:14px;cursor:pointer", "بعداً");
        later.type = "button";
        later.addEventListener("click", () => box.remove());

        panel.append(heading, message, version, link, later);
        box.appendChild(panel);
        document.body.appendChild(box);
    }

    function asSafeText(value) {
        return typeof value === "string" || typeof value === "number" ? String(value) : "";
    }

    async function check() {
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

    window.NightCastUpdateChecker = { check };
})();
