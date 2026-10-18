# NightCast SEO Plan — Keyword Research, Search Intent & Fact Check

Updated: 2026-10-18

## Scope and evidence

- Primary public archive URL: https://nightcast.ir/podcasts
- Canonical configured in users/index.html: https://nightcast.ir/podcasts
- Content dataset currently reports 26 podcast records in users/data/podcasts.json (repository snapshot reviewed on 2026-10-18).
- Actual content themes in the reviewed records and page copy include book summaries/reviews, personal and organizational growth, psychology, management, and ideas/knowledge.
- Search volumes, keyword difficulty, rankings, organic clicks, and indexing status have not been verified. Keyword priorities below are qualitative hypotheses, not measured search-volume claims.

## Keyword clusters and intended landing pages

| Priority | Cluster / example Persian query | Intent | Recommended page |
|---|---|---|---|
| P1 | پادکست فارسی | Broad discovery | Canonical archive; support with useful navigation and descriptions |
| P1 | خلاصه کتاب صوتی | Find an audio book summary | Archive and matching podcast detail, when a stable detail URL exists |
| P1 | پادکست کتاب / بررسی کتاب | Find book-related audio | Archive and individual podcast pages |
| P1 | شنیدن پادکست فارسی آنلاین | Listen immediately | Archive/player; make play controls accessible and clear |
| P1 | پادکست رشد فردی | Topic discovery | Only create a category page if real records support it |
| P1 | پادکست روان‌شناسی | Topic discovery | Only create a category page if real records support it |
| P1 | پادکست مدیریت و کسب‌وکار | Topic discovery | Only create a category page if real records support it |
| P2 | نام دقیق کتاب + پادکست | Known-item search | A stable, crawlable page per podcast/episode |
| P2 | نام نویسنده + خلاصه کتاب صوتی | Known topic/author | Podcast detail page with accurate book and author metadata |
| P2 | آرشیو پادکست فارسی | Browse/catalogue | Canonical archive |

Do not target every cluster on every page. Assign one primary intent to each indexable URL and use related wording naturally.

## Search intent and copy direction

- Archive: help people discover and search available Persian audio summaries and book reviews.
- Individual podcast/episode: answer what the book is about, who wrote it, what the episode covers, its duration, and how to listen—only where the data exists.
- About: explain the real editorial mission and production approach; avoid unverifiable superlatives.
- Contact: provide verified contact routes and explain the reason for contacting the team.

## Metadata now applied to the archive

- Title: پادکست فارسی کتاب و اندیشه | خلاصه و بررسی کتاب — نایت‌کست
- Description: در نایت‌کست به خلاصه و بررسی کتاب‌ها در حوزه‌های رشد فردی، روان‌شناسی، مدیریت و اندیشه گوش دهید. پادکست‌ها را جست‌وجو کنید و توضیحات هر مجموعه را بخوانید.
- Open Graph and Twitter titles/descriptions aligned with the same content promise.
- WebSite structured-data description aligned with actual book-summary/review positioning.
- Removed the SearchAction structured-data target that pointed to /?q=..., because the root URL is a transitional splash redirect and the query-forwarding behavior has not been verified.

## Sitemap and canonical policy

- sitemap.xml now lists only https://nightcast.ir/podcasts, the configured canonical archive URL.
- The root URL currently serves a brief splash page with noindex,follow and a JavaScript redirect; it is intentionally excluded from the sitemap rather than advertising a noindex splash as an indexable landing page.
- /users/ redirects to /podcasts, so it is not listed as a separate sitemap URL.
- About/contact currently route to the same archive document; do not list them as separate canonical pages until they have distinct, useful, crawlable page content.

## Fact-check / do not claim without evidence

- Do not publish search-volume estimates, keyword difficulty, traffic forecasts, rankings, or claims that pages are indexed unless verified with Search Console or a suitable measurement source.
- Do not claim the site is the biggest, most popular, exclusive, or the largest Persian podcast archive without reliable evidence.
- Use only real podcast metadata. Do not generate fictional episode transcripts, author names, publication dates, durations, categories, or audio links.
- The repository dataset snapshot contains 26 podcast records; verify production API/feed parity before stating that the live site currently exposes all 26.
- Validate phone/address/schema organization details against the current official contact page before treating them as confirmed business facts.

## Next technical SEO checks

1. Inspect Google Search Console Pages/Indexing and Performance reports.
2. Verify production HTTP status, canonical, robots directives, sitemap response, and redirect behavior for /, /podcasts, /podcasts/, and /users/.
3. Confirm that search engines can discover the actual podcast titles/descriptions and that pagination does not hide content.
4. Consider stable, unique URLs for individual podcasts/episodes before adding per-episode sitemap entries or PodcastEpisode structured data.
5. Run Lighthouse and accessibility checks on mobile and desktop; no performance score is asserted in this plan.
