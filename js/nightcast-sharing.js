(function () {
  'use strict';
  function currentPodcast() {
    var bridge = window.NightCastPodcastBridge;
    return bridge && typeof bridge.getCurrentPodcast === 'function' ? bridge.getCurrentPodcast() : null;
  }
  function findPodcast(id) {
    var bridge = window.NightCastPodcastBridge;
    var list = bridge && typeof bridge.getPodcasts === 'function' ? bridge.getPodcasts() : [];
    return (list || []).find(function (item) { return String(item.id) === String(id); }) || null;
  }
  function shareData(podcast) {
    var title = String(podcast && (podcast.title || podcast.book_name) || 'پادکست NightCast');
    var slugOrId = String(podcast && (podcast.slug || podcast.id) || '');
    var url = new URL('/', window.location.origin);
    if (slugOrId) url.searchParams.set('podcast', slugOrId);
    var teasers = [
      'یک ایده تازه شاید نگاهت را به دنیا عوض کند؛ این پادکست NightCast را از دست نده.',
      'چند دقیقه برای خودت وقت بگذار؛ این روایت می‌تواند جرقه یک فکر تازه باشد.',
      'این اپیزود را گوش کن؛ شاید همان نکته‌ای باشد که امروز به آن نیاز داری.'
    ];
    var teaser = teasers[Math.floor(Math.random() * teasers.length)];
    return { title: 'پیشنهاد شنیدنی از NightCast: ' + title, text: teaser + '\n🎧 ' + title, url: url.href };
  }
  function toast(message) {
    var bridge = window.NightCastPodcastBridge;
    if (bridge && typeof bridge.toast === 'function') bridge.toast(message);
    else {
      var node = document.getElementById('nc-share-status');
      if (!node) {
        node = document.createElement('div');
        node.id = 'nc-share-status';
        node.className = 'nc-share-status';
        node.setAttribute('role', 'status');
        node.setAttribute('aria-live', 'polite');
        document.body.appendChild(node);
      }
      node.textContent = message;
      node.classList.add('is-visible');
      window.setTimeout(function () { node.classList.remove('is-visible'); }, 3200);
    }
  }
  async function share(podcast) {
    if (!podcast) { toast('ابتدا یک پادکست را انتخاب کن.'); return; }
    var data = shareData(podcast);
    try {
      if (navigator.share) {
        await navigator.share(data);
        toast('پنجره اشتراک‌گذاری باز شد؛ مخاطب و برنامه دلخواهت را انتخاب کن.');
        return;
      }
      var clipboardText = data.text + '\n' + data.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clipboardText);
        toast('متن و پیوند آماده ارسال کپی شد؛ آن را در پیام‌رسان دلخواهت بفرست.');
      } else {
        window.prompt('متن آماده ارسال را کپی کن:', clipboardText);
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(data.text + '\n' + data.url);
        toast('پیوند و متن آماده ارسال کپی شد.');
      } catch (_) { toast('اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود.'); }
    }
  }
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-action="share"],[data-action="share-current"]') : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    var podcast = button.getAttribute('data-action') === 'share-current' ? currentPodcast() : findPodcast(button.getAttribute('data-id'));
    share(podcast);
  });
}());