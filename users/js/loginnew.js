/* Legacy compatibility entry only. NightCast sign-in is Google-only. */
(function () {
  "use strict";
  var target = new URL("/login", window.location.origin);
  var current = new URL(window.location.href);
  var next = current.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    target.searchParams.set("next", next);
  }
  window.location.replace(target.toString());
})();
