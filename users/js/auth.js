/* ==================================================
NightCast User Authentication Manager V2
/users/js/core/auth.js
================================================== */

const NightCastAuth = {

    currentUser: null,

    async init() {

        this.bindEvents();

        await this.checkSession();

    },

    bindEvents() {

        const skipBtn = document.getElementById("skipLoginButton");
        if (skipBtn) {
            skipBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.enterGuestMode();
            });
        }

        const loginBtn = document.getElementById("loginButton");
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                this.openLogin();
            });
        }

        const closeBtn = document.getElementById("closeAuth");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this.closeLogin();
            });
        }

        const loginForm = document.getElementById("loginForm");

        if (loginForm) {

            loginForm.addEventListener("submit", async (e) => {

                e.preventDefault();

                const username =
                    document.getElementById("loginUsername").value.trim();

                const password =
                    document.getElementById("loginPassword").value;

                const result =
                    await this.login(username, password);

                if (result.success) {

                    NightCastUI.toast(
                        "ورود با موفقیت انجام شد",
                        "success"
                    );

                    this.closeLogin();

                    this.hideEntry();

                } else {

                    NightCastUI.toast(
                        result.message || "ورود ناموفق",
                        "error"
                    );

                }

            });

        }

    },

    async checkSession() {

        if (!window.NightCastAPI) {

            this.enterGuestMode();

            return;

        }

        if (!NightCastAPI.isLoggedIn()) {

            this.enterGuestMode();

            return;

        }

        const result = await NightCastAPI.me();

        if (result.success) {

            this.currentUser = result.user || result.data;

            this.hideEntry();

            NightCastUI.updateUserUI();

        } else {

            this.logoutLocal();

            this.enterGuestMode();

        }

    },

    async login(username, password) {

        if (!window.NightCastAPI) {

            return {
                success: false,
                message: "API آماده نیست."
            };

        }

        const result =
            await NightCastAPI.login(username, password);

        if (result.success) {

            await this.checkSession();

        }

        return result;

    },

    logout() {

        this.logoutLocal();

        this.enterGuestMode();

    },

    logoutLocal() {

        if (window.NightCastAPI) {

            NightCastAPI.removeToken();

        }

        this.currentUser = null;

    },

    enterGuestMode() {

        this.currentUser = {
            role: "guest"
        };

        this.hideEntry();

        if (window.NightCastUI) {

            NightCastUI.updateUserUI();

            NightCastUI.toast(
                "به صورت مهمان وارد شدید",
                "info"
            );

        }

    },

    hideEntry() {

        const entry =
            document.getElementById("loginEntry");

        if (entry) {

            entry.classList.add("hidden");

        }

    },

    showEntry() {

        const entry =
            document.getElementById("loginEntry");

        if (entry) {

            entry.classList.remove("hidden");

        }

    },

    openLogin() {

        if (window.NightCastUI) {

            NightCastUI.openModal("authModal");

        }

    },

    closeLogin() {

        if (window.NightCastUI) {

            NightCastUI.closeModal("authModal");

        }

    },

    isLoggedIn() {

        if (!window.NightCastAPI) return false;

        return NightCastAPI.isLoggedIn();

    },

    canDownload() {

        return this.isLoggedIn();

    },

    getUser() {

        return this.currentUser;

    }

};

window.NightCastAuth = NightCastAuth;
