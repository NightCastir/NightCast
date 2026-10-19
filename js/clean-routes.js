/* Canonical single-document routes and hash-aware section entry for NightCast. */
(() => {
  "use strict";

  const routes = {
    "/": "podcasts",
    "/index.html": "podcasts",
    "/podcasts": "podcasts",
    "/about": "about",
    "/contact": "contact"
  };
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const requestedHash = window.location.hash.slice(1);
  const validSections = new Set(["podcasts", "about", "contact"]);
  const hashTarget = validSections.has(requestedHash) ? requestedHash : null;
  const targetId = hashTarget || routes[path];
  if (!targetId) return;

  function activateRoute() {
    const target = document.getElementById(targetId);
    if (!target) return false;

    document.querySelectorAll(".nav-link").forEach(link => {
      const href = link.getAttribute("href");
      const active = href === "#" + targetId ||
        href === path ||
        ((path === "/" || path === "/index.html") && !hashTarget && href === "#podcasts");
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
