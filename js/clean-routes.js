/* Clean, hash-free routes for the shared NightCast document. */
(() => {
  "use strict";

  const sectionPaths = {
    podcasts: "/",
    about: "/about",
    contact: "/contact"
  };
  const routes = {
    "/": "podcasts",
    "/index.html": "podcasts",
    "/podcasts": "podcasts",
    "/about": "about",
    "/contact": "contact"
  };
  const validSections = new Set(Object.keys(sectionPaths));
  const current = new URL(window.location.href);
  let path = current.pathname.replace(/\/+$/, "") || "/";
  const routeHint = current.searchParams.get("__route");
  const requestedHash = current.hash.slice(1);
  const legacySection = validSections.has(requestedHash) ? requestedHash : null;

  // Old alias documents pass a short-lived route hint. Replace it with a clean URL.
  if ((path === "/" || path === "/index.html") && validSections.has(routeHint)) {
    path = sectionPaths[routeHint];
    current.pathname = path;
    current.searchParams.delete("__route");
    current.hash = "";
    window.history.replaceState(null, "", current.pathname + current.search + current.hash);
  } else if (legacySection) {
    // Migrate old /#about-style links to their clean route without breaking bookmarks.
    path = sectionPaths[legacySection];
    current.pathname = path;
    current.hash = "";
    window.history.replaceState(null, "", current.pathname + current.search);
  }

  const targetId = legacySection || routes[path];
  if (!targetId) return;

  function activateRoute() {
    const target = document.getElementById(targetId);
    if (!target) return false;

    document.querySelectorAll(".nav-link").forEach(link => {
      const href = link.getAttribute("href");
      const active = href === path ||
        ((path === "/" || path === "/index.html") && href === "/");
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
