# NightCast CDN asset migration

## Objective

Move static third-party assets used by NightCast pages into versioned paths inside this repository, then remove their runtime CDN dependencies without breaking themes, authentication, podcast cards, responsive layouts, or audio features.

## Stage 1 — inventory

Run `node tests/cdn-asset-audit.cjs`. The **NightCast CDN Asset Inventory** workflow runs this scan on relevant changes and publishes Markdown and JSON artifacts with each external URL, source file, line number, host and classification.

Known static asset families found during the initial review:

- Theme preview/background images: Unsplash URLs in `js/nightcast-theme.js` and `css/nightcast-themes.css`.
- Vazirmatn web font: Google Fonts CSS in the homepage, sign-in/registration pages and 404 page.
- Font Awesome: CSS from cdnjs and jsDelivr, including duplicate versions on the legacy login route and dynamic fallback logic in `js/nightcast-cosmos.js`.
- Leaflet map library: CSS and JavaScript loaded from unpkg by `js/nightcast-player.js`; its marker images must also be included when self-hosted.
- Podcast covers: some records point to `NightCast-Media` on raw.githubusercontent.com. These are reported separately from theme images.

## What must not be blindly copied

- Worker URLs (`*.workers.dev`) are live APIs, not static assets.
- OpenStreetMap tile URLs are a live map service. Copying a few tiles is not equivalent to self-hosting a map and can violate provider usage rules. The Leaflet library itself can be self-hosted separately.
- Google sign-in endpoints, user-provided profile images, podcast audio streams, RSS feeds, canonical/social URLs and service APIs are runtime services or content, not CDN libraries. They need a separate decision and must not be replaced with guessed local paths.
- Preserve upstream license notices for fonts, icons and libraries when their files are copied.

## Migration acceptance criteria

1. The repository-wide inventory lists external references with file and line number.
2. Static assets are copied into organized repository folders such as `assets/fonts/`, `assets/vendor/fontawesome/`, `assets/vendor/leaflet/` and `assets/themes/`.
3. Runtime HTML, CSS and JavaScript use local paths for those assets; CDN fallbacks are removed.
4. The inventory scanner reports zero static-CDN references in runtime files in strict mode.
5. Browser tests verify local fonts, icons and theme imagery load; all eight themes apply; mobile/tablet/desktop/TV layouts have no horizontal overflow.
6. Acceptance workflows are checked after changes. Only actual passing results are reported.

## Stage 2 — static assets localized

Committed to `main` in commit `5b313efe3b730a55534b5c36f6051c38b912b1cf`:

- Eight theme background/preview images are stored in `assets/themes/` and used by the theme controller and theme CSS.
- Vazirmatn CSS and WOFF2 subsets are stored in `assets/fonts/`.
- Font Awesome 6.7.2 CSS and required webfonts are stored in `assets/vendor/fontawesome/`.
- Leaflet 1.9.4 JavaScript, CSS, marker icons and layer images are stored in `assets/vendor/leaflet/`.
- Twenty OpenMoji avatar SVGs are stored in `assets/avatars/openmoji/`; old saved avatar URLs are normalized to local paths.
- The 26 fallback-catalog podcast covers are stored in `assets/podcasts/covers/`; the JSON and RSS cover references now use NightCast-hosted paths. D1/API cover URLs are normalized to those local files in the frontend.
- HTML pages no longer request the listed static CSS/font/image CDNs; the runtime stylesheet and script references now use repository paths.

The migration workflow completed its strict CDN audit, JavaScript/JSON checks, theme-system browser tests and browser/API acceptance suite successfully before pushing the asset commit. The live map tile provider (OpenStreetMap), Worker APIs, Google sign-in, and podcast audio streams remain external services by design; they are not static design assets and were not blindly mirrored.

The follow-up acceptance and Pages deployment runs are used to verify the committed revision separately. The strict inventory gate is available with `node tests/cdn-asset-audit.cjs --strict-assets`.
