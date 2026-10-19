# NightCast project structure and startup flow

## Canonical entry points

- **Website:** root `index.html` is the canonical public entry and begins with the podcast archive. It must not route through a separate welcome document.
- **Android:** `MainActivity` launches Capacitor's WebView. The remote entry URL is defined once in `capacitor.config.ts` as `https://www.nightcast.ir`.
- **Native Google sign-in:** `NightCastGoogleAuth.java` is a separate Capacitor plugin registered by `MainActivity`. Keep this separate from app startup; it has a different responsibility.

## Public routes and single-document navigation

- The only full public HTML document is root `index.html`. It contains the podcast archive and the About/Contact sections.
- `users/index.html`, `about/index.html`, and `contact/index.html` are lightweight compatibility aliases, not independent copies of the site. They preserve the query string and an existing hash; otherwise they target `/#podcasts`, `/#about`, or `/#contact`.
- `_redirects` keeps clean and legacy URLs working. The About/Contact rewrites serve their small alias documents, which then navigate to the matching section in the canonical document.
- `js/clean-routes.js` must honor explicit `#podcasts`, `#about`, and `#contact` hashes. With no section hash, the root entry defaults to the podcast archive.
- `sitemap.xml` lists the canonical root URL only. Section aliases are not separate indexable HTML pages.
- Do not restore full-page copies in compatibility files: that duplicates hundreds of kilobytes of HTML, causes route behavior to drift, and increases maintenance and validation costs.

## Source vs generated files

The Android build recreates the `android/` directory during CI. Consequently, files written only into `android/app/src/main/java/` during a workflow are build outputs and are not durable source files.

The tracked native Java sources live in:

- `android-template/src/main/java/ir/nightcast/app/MainActivity.java`
- `android-template/src/main/java/ir/nightcast/app/NightCastGoogleAuth.java`

The Android workflow copies these sources into the generated Android project before compiling. Edit the tracked templates, not a temporary generated copy.

Capacitor's generated runtime configuration at `android/app/src/main/assets/capacitor.config.json` is a build artifact. Do not maintain a second root `capacitor.config.json`; `capacitor.config.ts` is the source of truth.

## Startup flow

```text
Android launcher
  -> MainActivity (BridgeActivity)
  -> Capacitor WebView
  -> https://www.nightcast.ir
  -> root index.html
  -> podcast archive / podcastGrid
```

The website and Android APK have separate acceptance checks. Android build success does not substitute for browser acceptance tests.

## Structural guardrails

Run `node tests/android-source-structure.cjs` to verify the single entry configuration, tracked native Java sources, plugin registration, and workflow copy path. The GitHub Actions Android build also compiles the copied Java files and verifies the generated Capacitor config included in the app.
