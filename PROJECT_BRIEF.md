# NightCast Project Brief

## پروژه
NightCast
وب‌سایت پادکست فارسی خلاصه کتاب

دامنه:
https://nightcast.ir

Repository:
NightCastir/NightCast

Hosting:
GitHub Pages

DNS:
Cloudflare

---

## هدف

ساخت یک وب‌سایت مدرن، مینیمال، سریع و Mobile First که تمام محتوای آن به صورت خودکار از کانال عمومی ایتا دریافت شود.

هیچ اپیزودی نباید به صورت دستی داخل سایت قرار بگیرد.

---

## منبع اطلاعات

https://eitaa.com/NightCast

یا

https://eitaa.com/s/NightCast

اطلاعات استخراجی:

- تصویر
- فایل صوتی
- عنوان
- توضیح
- تاریخ
- مدت زمان

در صورت نبود RSS، Parser باید HTML را تحلیل کرده و feed.json تولید کند.

---

## ساختار پروژه

index.html

css/
style.css

js/
app.js
feed.js

data/
feed.json

assets/

.github/workflows/

---

## قوانین پروژه

- Vanilla JavaScript
- بدون jQuery
- Mobile First
- RTL
- Lazy Load
- Infinite Scroll
- HTML5 Audio
- فقط یک فایل همزمان پخش شود.
- SEO Friendly
- Accessibility
- Responsive

---

## رنگ‌ها

Background
#FAFAFA

Cards
#FFFFFF

Primary Text
#222222

Secondary Text
#666666

Accent
#D9A441

---

## فونت

Vazirmatn

---

## طراحی

الهام گرفته از

Spotify Podcasts

Apple Podcasts

اما مینیمال‌تر

---

## وضعیت فعلی

✓ دامنه NightCast.ir فعال شده

✓ Cloudflare متصل شده

✓ GitHub Pages فعال است

✓ CNAME تنظیم شده

✓ DNS صحیح است

✓ HTTPS آماده است

اکنون وارد مرحله توسعه Frontend و سیستم Feed خودکار شده‌ایم.

---

## قوانین همکاری

هر تغییری باید مرحله‌ای باشد.

هر فایل کامل تحویل داده شود.

هیچ فایل ناقصی ارائه نشود.

همیشه ساختار GitHub حفظ شود.

قبل از تغییر index.html، وابستگی‌ها بررسی شوند.

تمام کدها Production Ready باشند.



# PROJECT UPDATE
Version: 1.1
Date: 2026-07-26

---

# وضعیت زیرساخت

پروژه با موفقیت از حالت توسعه خارج شده و زیرساخت Production آماده است.

زیرساخت نهایی:

User
↓
nightcast.ir
↓
Cloudflare
↓
GitHub Pages
↓
GitHub Repository
↓
index.html

---

## Domain

دامنه:

nightcast.ir

کاملاً فعال است.

---

## Hosting

GitHub Pages

به عنوان هاست استاتیک استفاده می‌شود.

هیچ هاست اشتراکی یا VPS وجود ندارد.

---

## CDN

Cloudflare

به عنوان:

- DNS
- CDN
- SSL
- Cache
- Security Layer

استفاده می‌شود.

---

## DNS

DNS Check

کاملاً موفق بوده است.

GitHub Pages دامنه را تأیید کرده است.

Custom Domain

nightcast.ir

DNS Check Successful

---

## CNAME

در Root پروژه فایل

CNAME

وجود دارد.

محتوا:

nightcast.ir

---

# فلسفه پروژه

NightCast یک وب‌سایت معمولی نیست.

هدف ساخت یک Podcast Platform سبک، سریع و کاملاً خودکار است.

هیچ محتوایی نباید داخل HTML نوشته شود.

تمام اطلاعات باید از Data Layer خوانده شوند.

---

# معماری سیستم

چهار لایه مستقل وجود دارد.

Layer 1

Data Source

↓

Eitaa Public Channel

↓

Layer 2

Parser

↓

feed.json

↓

Layer 3

Frontend

↓

Layer 4

Cloudflare CDN

---

# قانون طلایی پروژه

Frontend

هرگز

نباید

HTML کانال ایتا را بخواند.

Frontend فقط مجاز است:

data/feed.json

را بخواند.

---

# Parser

Parser خارج از مرورگر اجرا می‌شود.

محل قرارگیری:

parser/

وظایف:

- دریافت HTML کانال عمومی ایتا
- استخراج تصویر
- استخراج عنوان
- استخراج توضیح
- استخراج لینک فایل صوتی
- استخراج تاریخ
- استخراج مدت زمان (در صورت وجود)
- تولید feed.json

---

# GitHub Actions

GitHub Action به صورت زمان‌بندی شده اجرا می‌شود.

فرآیند:

Parser

↓

Generate feed.json

↓

Commit

↓

Deploy

↓

GitHub Pages

↓

Cloudflare

↓

Website Updated

---

# Design Philosophy

هدف طراحی:

ترکیبی از:

Spotify Podcasts

+

Apple Podcasts

اما

ساده‌تر

سبک‌تر

مینیمال‌تر

و کاملاً فارسی

---

# UI Principle

White Space زیاد

کارت‌های بزرگ

بدون شلوغی

بدون Banner های اضافی

بدون Slider

تمرکز فقط روی شنیدن

---

# Hero Episode

آخرین اپیزود

باید به صورت Hero Card نمایش داده شود.

تمام اپیزودهای بعدی

به صورت Card نمایش داده می‌شوند.

---

# Layout

Header

↓

Hero Episode

↓

Latest Episodes

↓

Infinite Scroll

↓

Footer

---

# Responsive

Mobile First

سپس

Tablet

سپس

Desktop

---

# Grid

Mobile

1 Card

Tablet

2 Cards

Desktop

3 Cards

---

# تصاویر

تمام تصاویر

Aspect Ratio

16:9

دارند.

---

# Radius

تمام پروژه

20px

---

# Shadow

فقط یک نوع Shadow

بسیار نرم

---

# Typography

Heading

32px

Card Title

20px

Body

16px

Description

14px

Meta

12px

---

# Color Palette

Background

#FAFAFA

Cards

#FFFFFF

Primary Text

#222222

Secondary Text

#666666

Accent

#D9A441

---

# Performance Rules

Vanilla JavaScript

بدون jQuery

بدون Bootstrap JS

بدون Framework

بدون Library سنگین

Lazy Loading

Infinite Scroll

Preload="none"

Intersection Observer

CSS Animation

---

# Accessibility

RTL

Keyboard Navigation

ARIA Label

SEO Friendly

Schema.org

PodcastEpisode

AudioObject

---

# مهم‌ترین تصمیم معماری

کل سایت

فقط

یک Audio Player خواهد داشت.

نه یک پلیر برای هر Card.

Player در پایین صفحه قرار می‌گیرد.

دقیقاً مشابه Spotify.

مزایا:

- فقط یک فایل همزمان پخش می‌شود.
- هنگام اسکرول صدا قطع نمی‌شود.
- مصرف RAM کمتر.
- مدیریت JavaScript بسیار ساده‌تر.
- امکان افزودن Queue، Resume و قابلیت‌های آینده.

---

# مهم‌ترین اصل توسعه

هیچ داده‌ای داخل HTML هاردکد نمی‌شود.

تمام صفحات فقط از feed.json داده دریافت می‌کنند.

Frontend کاملاً از Data Source مستقل خواهد بود.

---

# وضعیت فعلی پروژه

✅ دامنه متصل شده

✅ Cloudflare فعال است

✅ GitHub Pages فعال است

✅ HTTPS فعال است

✅ DNS صحیح است

✅ معماری پروژه نهایی شده است

⏳ مرحله بعد:

پیاده‌سازی Frontend Production بر اساس این معماری.
