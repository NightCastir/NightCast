/* NightCast install guidance + root-scoped PWA registration. */
(function () {
  'use strict';
  const dialog = document.getElementById('ncPwaInstallDialog');
  const title = document.getElementById('ncPwaInstallTitle');
  const content = document.getElementById('ncPwaInstallContent');
  const trigger = document.getElementById('ncIosPwaButton');
  if (!dialog || !title || !content || !trigger) return;

  const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  function showGuide() {
    if (iosDevice && standalone) {
      title.textContent = 'NightCast روی دستگاه شما نصب است';
      content.innerHTML = '<p>شما در حال استفاده از نسخه نصب‌شده NightCast هستید. برای شنیدن پادکست‌ها، همین صفحه را ادامه دهید.</p>';
    } else if (iosDevice) {
      title.textContent = 'نصب NightCast روی iPhone یا iPad';
      content.innerHTML = '<p>NightCast برای iOS به‌صورت وب‌اپ (PWA) ارائه می‌شود؛ نیازی به فایل یا نصب از App Store نیست.</p><ol><li>این صفحه را در <strong>Safari</strong> باز کنید.</li><li>دکمه <strong>Share / اشتراک‌گذاری</strong> را در نوار Safari بزنید.</li><li>گزینه <strong>Add to Home Screen / افزودن به صفحه اصلی</strong> را انتخاب کنید.</li><li>در صورت نمایش گزینه <strong>Open as Web App</strong> آن را فعال کنید و <strong>Add / افزودن</strong> را بزنید.</li><li>از آیکون NightCast در صفحه اصلی، برنامه را مانند یک اپ مستقل باز کنید.</li></ol>';
    } else {
      title.textContent = 'نسخه iOS به‌صورت وب‌اپ در دسترس است';
      content.innerHTML = '<p>برای نصب NightCast روی iPhone یا iPad، همین نشانی را در Safari آن دستگاه باز کنید و مراحل زیر را انجام دهید:</p><ol><li>در Safari روی <strong>Share / اشتراک‌گذاری</strong> بزنید.</li><li><strong>Add to Home Screen / افزودن به صفحه اصلی</strong> را انتخاب کنید.</li><li>در صورت وجود، <strong>Open as Web App</strong> را فعال و سپس <strong>Add</strong> را انتخاب کنید.</li></ol><p>در دستگاه فعلی نیز می‌توانید نسخه وب NightCast را باز کنید.</p>';
    }
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nc-pwa-dialog-open');
    const close = dialog.querySelector('[data-pwa-close]');
    if (close) close.focus();
  }

  function closeGuide() {
    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nc-pwa-dialog-open');
    trigger.focus();
  }

  trigger.addEventListener('click', showGuide);
  dialog.querySelectorAll('[data-pwa-close]').forEach((element) => element.addEventListener('click', closeGuide));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) closeGuide();
  });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        console.warn('NightCast offline support could not be initialized.', error);
      });
    }, { once: true });
  }
})();
