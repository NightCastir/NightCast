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

The inventory stage does not claim that any CDN assets have already been copied or localized.
