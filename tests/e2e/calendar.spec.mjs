import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title==='legacy cache cannot override newly installed application') return;
  await page.goto('./');
  await expect(page.locator('#summaryTypes')).toHaveText('วันพระ + วันสำคัญ');
});

test('legacy cache cannot override newly installed application', async ({ page, baseURL }) => {
  await page.route('**/src/ui/app.js', route => route.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto('./');
  await page.unroute('**/src/ui/app.js');
  await page.evaluate(async url => {
    const legacy = await caches.open('wanpra-v2-20261004');
    await legacy.put(url, new Response('<html><body>Stale legacy application</body></html>', { headers: { 'Content-Type': 'text/html' } }));
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  }, baseURL);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect(page.locator('#summaryTypes')).toHaveText('วันพระ + วันสำคัญ');
  await expect(page.locator('#help')).toBeVisible();
  await expect(page.locator('#appError')).toBeHidden();
});

test('project subpath, refresh and required assets have no errors', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./index.html');
  await expect(page.locator('#coverage')).toHaveText('ข้อมูล พ.ศ. 2569–2570');
  await page.reload();
  await expect(page.locator('#appError')).toBeHidden();
  await expect(page.locator('#eventCount')).toHaveText('111 รายการ');
  for (const asset of ['manifest.webmanifest', 'sw.js', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'src/data/calendar-data.json', 'feeds/wanpra-default.ics', 'feeds/wanpra-only.ics']) {
    expect((await request.get(asset)).status(), asset).toBe(200);
  }
  expect(errors).toEqual([]);
});

test('categories are independent and empty selection cannot download', async ({ page }) => {
  await page.locator('label').filter({ has: page.locator('#wanpra') }).click();
  await page.locator('label').filter({ has: page.locator('#important') }).click();
  await expect(page.locator('#summaryTypes')).toHaveText('ยังไม่ได้เลือก');
  await expect(page.locator('#eventCount')).toHaveText('0 รายการ');
  await page.locator('#generateBtn').click();
  await expect(page.locator('#toast')).toHaveText('กรุณาเลือกอย่างน้อย 1 ประเภท');
  await page.locator('label').filter({ has: page.locator('#wankon') }).click();
  await expect(page.locator('#summaryTypes')).toHaveText('วันโกน');
  const dataset = await page.evaluate(async () => (await fetch('./src/data/calendar-data.json')).json());
  const count = dataset.events.filter(e => e.type === 'wanphra' && e.date > dataset.metadata.coverage.from).length;
  await expect(page.locator('#eventCount')).toHaveText(`${count} รายการ`);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#generateBtn').click();
  const text = await fs.readFile(await (await downloadPromise).path(), 'utf8');
  expect(text).toContain('CATEGORIES:WANKON');
  expect(text).not.toContain('CATEGORIES:WANPHRA');
  expect(text).not.toContain('CATEGORIES:IMPORTANT');
});

test('custom reminders, downloaded alarms and persisted settings agree', async ({ page }) => {
  await page.locator('#daysBefore').selectOption('2');
  await page.locator('#reminderTime').fill('19:30');
  await page.locator('#reminderTime').dispatchEvent('change');
  await page.locator('label').filter({ has: page.locator('#morningReminder') }).click();
  await expect(page.locator('#summaryAlert')).toHaveText('2 วันก่อน เวลา 19:30 + เช้าวันพระ 06:00');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#generateBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('wanpra-custom.ics');
  const text = await fs.readFile(await download.path(), 'utf8');
  expect(text).toContain('BEGIN:VCALENDAR\r\nVERSION:2.0');
  expect(text).toContain('BEGIN:VEVENT');
  expect(text).toContain('UID:wanphra-2026-001@wanpra-calendar');
  expect(text).toContain('DTSTART;VALUE=DATE:20260103');
  expect(text).toContain('TRIGGER;VALUE=DATE-TIME:20260101T123000Z');
  expect(text).toContain('TRIGGER;VALUE=DATE-TIME:20260102T230000Z');
  expect(text).toContain('ACTION:DISPLAY');
  expect(text.replaceAll('\r\n', '')).not.toMatch(/[\r\n]/);
  for (const line of text.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  await page.reload();
  await expect(page.locator('#summaryAlert')).toHaveText('2 วันก่อน เวลา 19:30 + เช้าวันพระ 06:00');
});

test('presets, themes and responsive layout work', async ({ page }) => {
  await page.locator('[data-days="0"]').click();
  await expect(page.locator('#summaryAlert')).toHaveText('วันเดียวกัน เวลา 06:00');
  await page.locator('[data-days="1"]').click();
  await expect(page.locator('#summaryAlert')).toHaveText('1 วันก่อน เวลา 17:00');
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).toHaveClass(/dark/);
  await page.locator('#themeToggle').click();
  await expect(page.locator('body')).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('manifest and service worker remain inside project scope', async ({ page, baseURL }) => {
  const manifest = await page.evaluate(async () => {
    const url = document.querySelector('link[rel="manifest"]').href;
    return { url, data: await (await fetch(url)).json() };
  });
  expect(new URL(manifest.data.start_url, manifest.url).href).toBe(baseURL);
  expect(new URL(manifest.data.scope, manifest.url).href).toBe(baseURL);
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, script: registration.active.scriptURL };
  });
  expect(worker.scope).toBe(baseURL);
  expect(worker.script).toBe(new URL('sw.js', baseURL).href);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
});

test('offline reload works and worker activation preserves other apps caches', async ({ page, context }) => {
  await page.evaluate(async () => {
    await caches.open('another-app-cache');
    await navigator.serviceWorker.ready;
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.unregister();
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match(new URL('./src/data/calendar-data.json', location.href).href)))).toBe(true);
  expect(await page.evaluate(() => caches.has('another-app-cache'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#eventCount')).toHaveText('111 รายการ');
  await expect(page.locator('#appError')).toBeHidden();
});

test('keyboard controls have visible focus and reduced motion is respected', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'ข้ามไปเนื้อหาหลัก' })).toBeFocused();
  await page.locator('#morningReminder').focus();
  await expect(page.locator('#morningReminder')).toBeFocused();
  const outline = await page.locator('#morningReminder + .switch').evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Space');
  await expect(page.locator('#summaryAlert')).toContainText('เช้าวันพระ 06:00');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).scrollBehavior)).toBe('auto');
});

test('custom subscription serves selected categories and reminders without duplicate events', async ({ page, request }) => {
  await page.locator('label').filter({ has: page.locator('#wanpra') }).click();
  await page.locator('label').filter({ has: page.locator('#important') }).click();
  await page.locator('label').filter({ has: page.locator('#wankon') }).click();
  await page.locator('#daysBefore').selectOption('2');
  await page.locator('#reminderTime').fill('19:30');
  await page.locator('#reminderTime').dispatchEvent('change');
  await page.locator('#customSubscribeBtn').click();
  const url = await page.locator('#subscriptionUrl').inputValue();
  expect(new URL(url).searchParams.get('wankon')).toBe('1');
  expect(new URL(url).searchParams.get('wanphra')).toBe('0');
  expect(new URL(url).searchParams.get('time')).toBe('19:30');
  await expect(page.locator('#appleSubscriptionLink')).toHaveAttribute('href', url.replace(/^https?:/, 'webcal:'));
  const response = await request.get(url);
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('CATEGORIES:WANKON');
  expect(body).not.toContain('CATEGORIES:WANPHRA');
  expect(body).not.toContain('CATEGORIES:IMPORTANT');
  expect(body).toContain('TRIGGER;VALUE=DATE-TIME:20260108T123000Z');
  const uids = [...body.matchAll(/^UID:(.+)$/gm)].map(match => match[1]);
  expect(uids).toHaveLength(98);
  expect(new Set(uids).size).toBe(98);
  expect(await (await request.get(url)).text()).toBe(body);
  await page.locator('#daysBefore').selectOption('1');
  await expect(page.locator('#subscriptionPanel')).toBeHidden();
  await expect(page.locator('#subscriptionUrl')).toHaveValue('');
});

test('custom subscription offers manual copy when clipboard permission is denied', async ({ page }) => {
  await page.locator('#customSubscribeBtn').click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.locator('#copySubscriptionBtn').click();
  await expect(page.locator('#subscriptionUrl')).toBeFocused();
  expect(await page.locator('#subscriptionUrl').evaluate(el => el.selectionEnd - el.selectionStart)).toBeGreaterThan(0);
  await page.locator('label').filter({ has: page.locator('#wanpra') }).click();
  await page.locator('label').filter({ has: page.locator('#important') }).click();
  await page.locator('#customSubscribeBtn').click();
  await expect(page.locator('#toast')).toHaveText('กรุณาเลือกอย่างน้อย 1 ประเภท');
  await expect(page.locator('#subscriptionPanel')).toBeHidden();
});
