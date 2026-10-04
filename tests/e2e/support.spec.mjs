import { test, expect } from '@playwright/test';
// Keep recipient fixtures isolated from service-worker caches; worker behavior is covered separately.
test.use({ serviceWorkers: 'block' });
// Invalid all-zero fixture; never a real recipient or a production payment route.
async function fixture(page) {
  await page.route('**/src/support-config.js', route => route.fulfill({ contentType: 'text/javascript', body: "export const SUPPORT_PAYMENT = { number: '0000000000', name: 'TEST RECIPIENT' };" }));
}
test('support requires fresh acknowledgement, copies digits and resets on return', async ({ page }) => {
  await fixture(page);
  await page.goto('./');
  await page.getByRole('link', { name: 'สนับสนุน WanPra', exact: true }).click();
  await expect(page).toHaveURL(/\/wanpra-calendar\/support\.html$/);
  await expect(page.locator('#revealPayment')).toBeDisabled();
  await expect(page.locator('#paymentDetails')).toBeHidden();
  await expect(page.locator('#bankAccount')).toHaveValue('');
  await page.locator('#supportAge').check();
  await expect(page.locator('#revealPayment')).toBeDisabled();
  await page.locator('#supportConsent').focus();
  await page.keyboard.press('Space');
  await page.locator('#revealPayment').click();
  await expect(page.locator('#paymentHeading')).toBeFocused();
  await expect(page.locator('#bankAccount')).toHaveValue('000-0-00000-0');
  await expect(page.locator('#recipientName')).toHaveText('TEST RECIPIENT');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedAccount = value; } } }));
  await page.locator('#copyBankAccount').click();
  expect(await page.evaluate(() => window.copiedAccount)).toBe('0000000000');
  await expect(page.locator('#paymentStatus')).toContainText('คัดลอกเลขบัญชีแล้ว');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const link of await page.locator('.bank-links a').all()) {
    expect(await link.getAttribute('href')).toMatch(/^https:\/\/(itunes\.apple\.com|play\.google\.com|www\.scb\.co\.th|krungthai\.com)\//);
    expect(await link.getAttribute('rel')).toContain('noreferrer');
  }
  await page.reload();
  await expect(page.locator('#supportConsent')).not.toBeChecked();
  await expect(page.locator('#supportAge')).not.toBeChecked();
  await expect(page.locator('#paymentDetails')).toBeHidden();
  await page.locator('#supportAge').check();
  await page.locator('#supportConsent').check();
  await page.locator('#revealPayment').click();
  await page.locator('header').getByRole('link', { name: 'กลับไปปฏิทิน' }).click();
  await page.goBack();
  await expect(page.locator('#supportConsent')).not.toBeChecked();
  await expect(page.locator('#supportAge')).not.toBeChecked();
  await expect(page.locator('#paymentDetails')).toBeHidden();
});
test('clipboard denial allows manual copy and withdrawal clears the account', async ({ page }) => {
  await fixture(page);
  await page.goto('./support.html');
  await page.locator('#supportAge').check();
  await page.locator('#supportConsent').check();
  await page.locator('#revealPayment').click();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.locator('#copyBankAccount').click();
  await expect(page.locator('#bankAccount')).toBeFocused();
  await expect(page.locator('#bankAccount')).toHaveValue('0000000000');
  expect(await page.locator('#bankAccount').evaluate(el => el.selectionEnd - el.selectionStart)).toBe(10);
  await page.locator('#supportAge').uncheck();
  await expect(page.locator('#paymentDetails')).toBeHidden();
  await expect(page.locator('#bankAccount')).toHaveValue('');
  await expect(page.locator('#revealPayment')).toBeDisabled();
  await page.locator('#supportAge').check();
  await page.locator('#supportConsent').check();
  await page.locator('#revealPayment').click();
  await page.locator('#hidePayment').click();
  await expect(page.locator('#supportConsent')).toBeFocused();
  await expect(page.locator('#supportConsent')).not.toBeChecked();
  await expect(page.locator('#supportAge')).not.toBeChecked();
  await expect(page.locator('#paymentDetails')).toBeHidden();
});
test('unconfigured payment cannot reveal a bank account', async ({ page }) => {
  await page.route('**/src/support-config.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export const SUPPORT_PAYMENT = null;' }));
  await page.goto('./support.html');
  await page.locator('#supportAge').check();
  await page.locator('#supportConsent').check();
  await expect(page.locator('#revealPayment')).toBeDisabled();
  await expect(page.locator('#paymentUnavailable')).toBeVisible();
  await expect(page.locator('#bankAccount')).toHaveValue('');
});

test('acknowledgement alone cannot bypass the age policy or reveal payment programmatically', async ({ page }) => {
  await fixture(page);
  await page.goto('./support.html');
  await page.locator('#supportConsent').check();
  await expect(page.locator('#revealPayment')).toBeDisabled();
  await page.evaluate(() => document.querySelector('#revealPayment').dispatchEvent(new Event('click')));
  await expect(page.locator('#bankAccount')).toHaveValue('');
  await expect(page.locator('#paymentDetails')).toBeHidden();
  await page.locator('#supportAge').check();
  await page.locator('#revealPayment').click();
  await expect(page.locator('#paymentDetails')).toBeVisible();
  await page.locator('#supportConsent').uncheck();
  await expect(page.locator('#paymentDetails')).toBeHidden();
  await expect(page.locator('#supportAge')).not.toBeChecked();
});
