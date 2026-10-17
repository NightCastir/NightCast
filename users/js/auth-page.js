/* NightCast legacy welcome/auth page controller.
   Keeps this page compatible with the current public catalogue and login routes. */
(() => {
  "use strict";

  const openidButton = document.getElementById("openidButton");
  const guestButton = document.getElementById("guestButton");
  const message = document.getElementById("authMessage");

  function navigate(button, target, statusText) {
    if (!button || button.disabled) return;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    if (message) {
      message.textContent = statusText;
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");
    }
    // Relative URLs work on both the public site and Capacitor's local web root.
    window.location.replace(new URL(target, window.location.href).toString());
  }

  openidButton?.addEventListener("click", () => {
    navigate(openidButton, "login.html", "در حال انتقال به ورود امن…");
  });

  guestButton?.addEventListener("click", () => {
    navigate(guestButton, "index.html", "در حال بازکردن آرشیو NightCast…");
  });
})();
