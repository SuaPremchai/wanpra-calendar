import { SUPPORT_PAYMENT } from '../support-config.js';
const payment = SUPPORT_PAYMENT && /^\d{10}$/.test(SUPPORT_PAYMENT.number) && typeof SUPPORT_PAYMENT.name === 'string' && SUPPORT_PAYMENT.name.trim() ? SUPPORT_PAYMENT : null;
const consent = document.querySelector('#supportConsent');
const age = document.querySelector('#supportAge');
const reveal = document.querySelector('#revealPayment');
const details = document.querySelector('#paymentDetails');
const account = document.querySelector('#bankAccount');
const status = document.querySelector('#paymentStatus');
let visit = 0;
function reset() {
  visit++;
  consent.checked = false;
  age.checked = false;
  reveal.disabled = true;
  reveal.setAttribute('aria-expanded', 'false');
  details.hidden = true;
  account.value = '';
  document.querySelector('#recipientName').textContent = '';
  status.textContent = '';
}
document.querySelector('#paymentUnavailable').hidden = Boolean(payment);
for (const checkbox of [consent, age]) checkbox.addEventListener('change', () => {
  if (!checkbox.checked && !details.hidden) reset();
  else reveal.disabled = !payment || !consent.checked || !age.checked;
});
reveal.addEventListener('click', () => {
  if (!consent.checked || !age.checked || !payment) return;
  account.value = payment.number.replace(/^(\d{3})(\d)(\d{5})(\d)$/, '$1-$2-$3-$4');
  document.querySelector('#recipientName').textContent = payment.name;
  details.hidden = false;
  reveal.setAttribute('aria-expanded', 'true');
  document.querySelector('#paymentHeading').focus();
});
document.querySelector('#copyBankAccount').addEventListener('click', async () => {
  if (!consent.checked || !age.checked || details.hidden || !payment) return;
  const currentVisit = visit;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(payment.number);
    if (currentVisit === visit && consent.checked && age.checked && !details.hidden) status.textContent = 'คัดลอกเลขบัญชีแล้ว กรุณาตรวจชื่อผู้รับก่อนยืนยันโอน';
  } catch {
    if (currentVisit !== visit || !consent.checked || !age.checked || details.hidden) return;
    account.value = payment.number;
    account.focus();
    account.select();
    status.textContent = 'กรุณากดคัดลอกเลขบัญชีที่เลือกไว้ แล้วเปิดแอปธนาคารของคุณ';
  }
});
document.querySelector('#hidePayment').addEventListener('click', () => { reset(); consent.focus(); });
window.addEventListener('pageshow', reset);
window.addEventListener('pagehide', reset);
reset();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
