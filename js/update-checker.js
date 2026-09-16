(function () {
    "use strict";

    const CURRENT_VERSION = "4.1.0";

    const VERSION_URL =
        "https://www.NightCast.ir/version.json";

    function compareVersions(a, b) {
        const pa = String(a).split(".").map(Number);
        const pb = String(b).split(".").map(Number);

        const length = Math.max(
            pa.length,
            pb.length
        );

        for (let i = 0; i < length; i++) {
            const x = Number.isFinite(pa[i])
                ? pa[i]
                : 0;

            const y = Number.isFinite(pb[i])
                ? pb[i]
                : 0;

            if (x > y) {
                return 1;
            }

            if (x < y) {
                return -1;
            }
        }

        return 0;
    }

    function showUpdate(data) {

        if (
            document.getElementById(
                "nightcastUpdateBox"
            )
        ) {
            return;
        }

        const box =
            document.createElement("div");

        box.id =
            "nightcastUpdateBox";

        box.innerHTML = `
            <div style="
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.70);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:999999;
                padding:20px;
                direction:rtl;
            ">

                <div style="
                    width:min(420px,100%);
                    background:#0b1220;
                    color:#ffffff;
                    border-radius:20px;
                    padding:25px;
                    text-align:center;
                    box-shadow:0 20px 60px rgba(0,0,0,.55);
                    font-family:Tahoma,Arial,sans-serif;
                ">

                    <h2 style="
                        margin:0 0 15px;
                        font-size:22px;
                    ">
                        ${data.title || "نسخه جدید NightCast"}
                    </h2>

                    <p style="
                        line-height:1.9;
                        margin:0;
                    ">
                        ${data.message || "نسخه جدید برنامه منتشر شده است."}
                    </p>

                    <p style="
                        opacity:.7;
                        margin-top:15px;
                    ">
                        نسخه جدید: ${data.version}
                    </p>

                    <a
                        href="${data.downloadUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            display:block;
                            background:#ffffff;
                            color:#000000;
                            padding:13px;
                            border-radius:12px;
                            text-decoration:none;
                            margin-top:20px;
                            font-weight:bold;
                        "
                    >
                        دریافت نسخه جدید
                    </a>

                    <button
                        id="nightcastUpdateLater"
                        style="
                            width:100%;
                            margin-top:10px;
                            padding:12px;
                            border:0;
                            border-radius:12px;
                            background:#182235;
                            color:#ffffff;
                            font-size:14px;
                            cursor:pointer;
                        "
                    >
                        بعداً
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(box);

        const laterButton =
            document.getElementById(
                "nightcastUpdateLater"
            );

        if (laterButton) {
            laterButton.addEventListener(
                "click",
                function () {
                    box.remove();
                }
            );
        }
    }

    async function check() {

        try {

            const response =
                await fetch(
                    VERSION_URL +
                    "?t=" +
                    Date.now(),
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.version) {
                return;
            }

            if (
                compareVersions(
                    data.version,
                    CURRENT_VERSION
                ) > 0
            ) {
                showUpdate(data);
            }

        } catch (error) {

            console.log(
                "NightCast Update Check:",
                error
            );
        }
    }

    window.NightCastUpdateChecker = {
        check: check
    };

})();
