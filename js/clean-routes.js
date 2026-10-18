/* Clean, shareable routes for NightCast archive sections. */
(() => {
  "use strict";
  const routes = {
    "/podcasts": "podcasts",
    "/about": "about",
    "/contact": "contact"
  };
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const targetId = routes[path];
  if (!targetId) return;

  function activateRoute() {
    const target = document.getElementById(targetId);
    if (!target) return false;
    document.querySelectorAll(".nav-link").forEach(link => {
      const active = link.getAttribute("href") === path;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    target.scrollIntoView({ behavior: "auto", block: "start" });
    return true;
  }

  const tryActivate = () => {
    if (!activateRoute()) window.addEventListener("load", activateRoute, { once: true });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryActivate, { once: true });
  } else {
    tryActivate();
  }
})();
