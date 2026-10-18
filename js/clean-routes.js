/* Clean, shareable routes for NightCast's archive sections. */
(() => {
  "use strict";
  const routes = {
    "/podcasts": { target: "podcasts", label: "پادکست‌ها" },
    "/about": { target: "about", label: "درباره NightCast" },
    "/contact": { target: "contact", label: "تماس با ما" }
  };
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const route = routes[path];
  if (!route) return;

  function activateRoute() {
    const target = document.getElementById(route.target);
    if (!target) return false;
    document.querySelectorAll(".nav-link").forEach(link => {
      const active = link.getAttribute("href") === path;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (!activateRoute()) window.addEventListener("load", activateRoute, { once: true });
    }, { once: true });
  } else if (!activateRoute()) {
    window.addEventListener("load", activateRoute, { once: true });
  }
})();
