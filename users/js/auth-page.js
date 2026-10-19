/* Legacy compatibility entry: NightCast supports Google account sign-in only. */
(function () {
  "use strict";
  var current = new URL(window.location.href);
  var target = new URL("/login", window.location.origin);
  var next = current.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    target.searchParams.set("next", next);
  }
  window.location.replace(target.toString());
})();
