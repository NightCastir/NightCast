const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html lang="fa" dir="rtl"><body>
      <section class="nc-comments-card">
        <form id="ncCommentsForm">
          <div class="nc-shield-widget" data-nc-shield="comment"></div>
          <button id="ncCommentsSubmit" type="submit"><span>ثبت دیدگاه</span></button>
        </form>
      </section>
      <section class="book-summary-request-modal">
        <form id="bookSummaryRequestForm">
          <div class="nc-shield-widget" data-nc-shield="suggestion"></div>
          <button id="bookSummaryRequestSubmit" type="submit">ثبت درخواست</button>
        </form>
      </section>
      <script>
        window.fetch = async (url, options) => {
          const body = JSON.parse(options.body || '{}');
          return new Response(JSON.stringify({
            success: true,
            id: body.action === 'comment' ? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' : 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            action: body.action,
            question: '3 + 4 = ؟'
          }), { status: 200, headers: { 'content-type': 'application/json' } });
        };
      </script>
    </body></html>`);
    await page.addScriptTag({ content: fs.readFileSync(path.join(process.cwd(), 'js/nightcast-shield.js'), 'utf8') });
    await page.waitForFunction(() =>
      document.querySelectorAll('[data-nc-shield][data-state="ready"]').length === 2,
      null,
      { timeout: 5000 }
    );

    for (const item of [
      { action: 'comment', formId: 'ncCommentsForm', submitId: 'ncCommentsSubmit', duplicateLabel: 'ثبت و تایید دیدگاه' },
      { action: 'suggestion', formId: 'bookSummaryRequestForm', submitId: 'bookSummaryRequestSubmit', duplicateLabel: 'ارسال درخواست پادکست پیشنهادی' }
    ]) {
      await page.evaluate(({ formId, duplicateLabel }) => {
        const form = document.getElementById(formId);
        const duplicate = document.createElement('button');
        duplicate.type = 'submit';
        duplicate.textContent = duplicateLabel;
        duplicate.dataset.testDuplicate = 'true';
        form.appendChild(duplicate);
      }, item);
      await page.waitForFunction(formId =>
        document.getElementById(formId).querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])').length === 1,
        item.formId,
        { timeout: 3000 }
      );
      const result = await page.evaluate(({ formId, submitId }) => {
        const form = document.getElementById(formId);
        const submit = document.getElementById(submitId);
        return {
          count: form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])').length,
          duplicateExists: Boolean(form.querySelector('[data-test-duplicate="true"]')),
          canonicalExists: Boolean(submit && form.contains(submit)),
          canonicalType: submit && submit.type
        };
      }, item);
      assert.deepEqual(result, {
        count: 1,
        duplicateExists: false,
        canonicalExists: true,
        canonicalType: 'submit'
      }, item.action + ' must retain exactly one canonical submit control');
      console.log('PASS | ' + item.action + ' form removes duplicate submit controls and preserves the canonical action');
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
