/* ==================================================
   NightCast SMS Login
   File:
   users/js/login.js
================================================== */

(function () {

    "use strict";


    const API_URL =
        "https://nightcast-api.tomasgermany2580.workers.dev/api/v1";


    const Login = {

        mobile: null,

        resendTimer: null,


        /* ==========================================
           INIT
        ========================================== */

        init() {

            const token =
                localStorage.getItem(
                    "NightCastToken"
                );

            const user =
                localStorage.getItem(
                    "NightCastUser"
                );


            if (token && user) {

                window.location.replace(
                    "index.html"
                );

                return;

            }


            this.bindEvents();

        },


        /* ==========================================
           EVENTS
        ========================================== */

        bindEvents() {

            const sendButton =
                document.getElementById(
                    "sendCodeButton"
                );


            const verifyButton =
                document.getElementById(
                    "verifyCodeButton"
                );


            const changeButton =
                document.getElementById(
                    "changeNumberButton"
                );


            const resendButton =
                document.getElementById(
                    "resendButton"
                );


            if (sendButton) {

                sendButton.addEventListener(
                    "click",
                    () => this.requestCode(false)
                );

            }


            if (verifyButton) {

                verifyButton.addEventListener(
                    "click",
                    () => this.verifyCode()
                );

            }


            if (changeButton) {

                changeButton.addEventListener(
                    "click",
                    () => this.changeNumber()
                );

            }


            if (resendButton) {

                resendButton.addEventListener(
                    "click",
                    () => this.requestCode(true)
                );

            }


            const mobile =
                document.getElementById(
                    "mobile"
                );


            if (mobile) {

                mobile.addEventListener(
                    "input",
                    () => {

                        mobile.value =
                            mobile.value
                                .replace(/\D/g, "")
                                .slice(0, 16);

                    }
                );


                mobile.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter"
                        ) {

                            this.requestCode(false);

                        }

                    }
                );

            }


            const otp =
                document.getElementById(
                    "otp"
                );


            if (otp) {

                otp.addEventListener(
                    "input",
                    () => {

                        otp.value =
                            otp.value
                                .replace(/\D/g, "")
                                .slice(0, 6);

                    }
                );


                otp.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter"
                        ) {

                            this.verifyCode();

                        }

                    }
                );

            }

        },


        /* ==========================================
           REQUEST OTP
        ========================================== */

        async requestCode(isResend = false) {

            this.clearMessage();


            const input =
                document.getElementById(
                    "mobile"
                );


            const button =
                isResend
                    ? document.getElementById(
                        "resendButton"
                    )
                    : document.getElementById(
                        "sendCodeButton"
                    );


            const mobile =
                this.normalizeMobile(
                    input.value
                );


            if (!mobile) {

                this.showError(
                    "شماره موبایل معتبر نیست."
                );

                return;

            }


            this.mobile = mobile;


            this.setButtonBusy(
                button,
                true,
                "در حال ارسال..."
            );


            try {

                const response =
                    await fetch(
                        API_URL +
                        "/public/sms/request",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    mobile:
                                        mobile
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "ارسال کد انجام نشد."
                    );

                }


                document
                    .getElementById(
                        "phoneStep"
                    )
                    .classList
                    .add("hidden");


                document
                    .getElementById(
                        "otpStep"
                    )
                    .classList
                    .remove("hidden");


                document
                    .getElementById(
                        "otpDescription"
                    )
                    .textContent =
                        "کد تأیید به شماره " +
                        this.displayMobile(
                            mobile
                        ) +
                        " ارسال شد.";


                document
                    .getElementById(
                        "otp"
                    )
                    .value = "";


                document
                    .getElementById(
                        "otp"
                    )
                    .focus();


                this.showSuccess(
                    "کد تأیید ارسال شد."
                );


                this.startResendTimer();

            }

            catch (error) {

                console.error(
                    "NightCast SMS Request Error:",
                    error
                );


                this.showError(
                    error.message ||
                    "ارسال پیامک انجام نشد."
                );

            }

            finally {

                this.setButtonBusy(
                    button,
                    false,
                    isResend
                        ? "ارسال مجدد"
                        : "دریافت کد تأیید"
                );

            }

        },


        /* ==========================================
           VERIFY OTP
        ========================================== */

        async verifyCode() {

            this.clearMessage();


            const otpInput =
                document.getElementById(
                    "otp"
                );


            const button =
                document.getElementById(
                    "verifyCodeButton"
                );


            if (!this.mobile) {

                this.showError(
                    "شماره موبایل مشخص نیست."
                );

                return;

            }


            const otp =
                otpInput.value
                    .replace(/\D/g, "")
                    .slice(0, 6);


            if (
                otp.length !== 6
            ) {

                this.showError(
                    "کد تأیید باید ۶ رقم باشد."
                );

                otpInput.focus();

                return;

            }


            this.setButtonBusy(
                button,
                true,
                "در حال بررسی..."
            );


            try {

                const response =
                    await fetch(
                        API_URL +
                        "/public/sms/verify",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    mobile:
                                        this.mobile,

                                    otp:
                                        otp
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "کد تأیید صحیح نیست."
                    );

                }


                /* ==================================
                   SAME NIGHTCAST SESSION CONTRACT
                ================================== */

                if (!data.token) {

                    throw new Error(
                        "Session از سرور دریافت نشد."
                    );

                }


                if (!data.user) {

                    throw new Error(
                        "اطلاعات کاربر دریافت نشد."
                    );

                }


                this.saveSession(
                    data.token,
                    data.user
                );


                /* ==================================
                   VERIFY LOCAL STORAGE
                ================================== */

                const savedToken =
                    localStorage.getItem(
                        "NightCastToken"
                    );


                const savedUser =
                    localStorage.getItem(
                        "NightCastUser"
                    );


                if (
                    !savedToken ||
                    !savedUser
                ) {

                    throw new Error(
                        "Session ذخیره نشد."
                    );

                }


                this.showSuccess(
                    "ورود موفق بود. در حال انتقال..."
                );


                clearInterval(
                    this.resendTimer
                );


                setTimeout(
                    () => {

                        window.location.replace(
                            "index.html"
                        );

                    },
                    300
                );

            }

            catch (error) {

                console.error(
                    "NightCast SMS Verify Error:",
                    error
                );


                this.showError(
                    error.message ||
                    "خطا در تأیید کد."
                );

            }

            finally {

                this.setButtonBusy(
                    button,
                    false,
                    "تأیید و ورود"
                );

            }

        },


        /* ==========================================
           SAVE SESSION
        ========================================== */

        saveSession(token, user) {

            if (!token) {

                throw new Error(
                    "Token خالی است."
                );

            }


            if (!user) {

                throw new Error(
                    "User خالی است."
                );

            }


            localStorage.setItem(
                "NightCastToken",
                token
            );


            localStorage.setItem(
                "NightCastUser",
                JSON.stringify(user)
            );

        },


        /* ==========================================
           CHANGE NUMBER
        ========================================== */

        changeNumber() {

            clearInterval(
                this.resendTimer
            );


            this.mobile = null;


            document
                .getElementById(
                    "otp"
                )
                .value = "";


            document
                .getElementById(
                    "phoneStep"
                )
                .classList
                .remove("hidden");


            document
                .getElementById(
                    "otpStep"
                )
                .classList
                .add("hidden");


            document
                .getElementById(
                    "resendButton"
                )
                .disabled = true;


            document
                .getElementById(
                    "resendText"
                )
                .textContent =
                    "ارسال مجدد تا ۶۰ ثانیه";


            this.clearMessage();


            document
                .getElementById(
                    "mobile"
                )
                .focus();

        },


        /* ==========================================
           RESEND TIMER
        ========================================== */

        startResendTimer() {

            clearInterval(
                this.resendTimer
            );


            const button =
                document.getElementById(
                    "resendButton"
                );


            const text =
                document.getElementById(
                    "resendText"
                );


            let seconds = 60;


            button.disabled = true;


            text.textContent =
                `ارسال مجدد تا ${seconds} ثانیه`;


            this.resendTimer =
                setInterval(
                    () => {

                        seconds--;


                        if (
                            seconds <= 0
                        ) {

                            clearInterval(
                                this.resendTimer
                            );


                            button.disabled =
                                false;


                            text.textContent =
                                "کد را دریافت نکردید؟";

                            return;

                        }


                        text.textContent =
                            `ارسال مجدد تا ${seconds} ثانیه`;

                    },
                    1000
                );

        },


        /* ==========================================
           MOBILE NORMALIZATION
        ========================================== */

        normalizeMobile(value) {

            let mobile =
                String(value || "")
                    .trim()
                    .replace(/\s+/g, "")
                    .replace(/-/g, "");


            if (
                mobile.startsWith("+98")
            ) {

                mobile =
                    "0" +
                    mobile.substring(3);

            }


            if (
                mobile.startsWith("98")
            ) {

                mobile =
                    "0" +
                    mobile.substring(2);

            }


            if (
                !/^09\d{9}$/.test(
                    mobile
                )
            ) {

                return null;

            }


            return mobile;

        },


        /* ==========================================
           DISPLAY MOBILE
        ========================================== */

        displayMobile(mobile) {

            if (
                !mobile ||
                mobile.length !== 11
            ) {

                return mobile;

            }


            return (
                mobile.substring(0, 4) +
                "••••" +
                mobile.substring(8)
            );

        },


        /* ==========================================
           BUTTON
        ========================================== */

        setButtonBusy(
            button,
            busy,
            text
        ) {

            if (!button) {
                return;
            }


            button.disabled = busy;


            button.innerHTML =
                busy

                    ? '<i class="fa-solid fa-spinner fa-spin"></i> ' +
                      text

                    : text;

        },


        /* ==========================================
           MESSAGE
        ========================================== */

        clearMessage() {

            const box =
                document.getElementById(
                    "smsMessage"
                );


            box.textContent = "";


            box.className =
                "sms-message";

        },


        showError(message) {

            const box =
                document.getElementById(
                    "smsMessage"
                );


            box.textContent =
                message;


            box.className =
                "sms-message show error";

        },


        showSuccess(message) {

            const box =
                document.getElementById(
                    "smsMessage"
                );


            box.textContent =
                message;


            box.className =
                "sms-message show success";

        }

    };


    window.NightCastLogin =
        Login;


    document.addEventListener(
        "DOMContentLoaded",
        () => Login.init()
    );

})();
