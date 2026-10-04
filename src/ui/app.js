import { buildCalendarEvents, nextEvents, validateDataset } from '../core/calendar.js';
import { formatThaiDate } from '../core/date.js';
import { loadCalendarDataset } from '../data/repository.js';
import { generateIcs } from '../exporters/ics.js';
import { buildSubscriptionUrl } from '../core/subscription.js';
import { CUSTOM_FEED_ENDPOINT } from '../config.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const SETTINGS_KEY='wanpra.settings.v1';
let dataset; let deferredPrompt=null;
const state={years:'all'};

function readSettings(){ try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch{return{}} }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY,JSON.stringify(settingsFromForm())); }
function settingsFromForm(){return{includeWanPhra:$('#wanpra').checked,includeWanKon:$('#wankon').checked,includeImportant:$('#important').checked,daysBefore:Number($('#daysBefore').value),time:$('#reminderTime').value,extraMorning:$('#morningReminder').checked};}
function applySettings(s){if(typeof s.includeWanPhra==='boolean')$('#wanpra').checked=s.includeWanPhra;if(typeof s.includeWanKon==='boolean')$('#wankon').checked=s.includeWanKon;if(typeof s.includeImportant==='boolean')$('#important').checked=s.includeImportant;if(Number.isInteger(s.daysBefore))$('#daysBefore').value=String(s.daysBefore);if(/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time||''))$('#reminderTime').value=s.time;if(typeof s.extraMorning==='boolean')$('#morningReminder').checked=s.extraMorning;}

function selectedEvents(){const s=settingsFromForm();return buildCalendarEvents(dataset,{...s,from:dataset.metadata.coverage.from,to:dataset.metadata.coverage.to});}
function updateSummary(){const s=settingsFromForm();const types=[];if(s.includeWanPhra)types.push('วันพระ');if(s.includeWanKon)types.push('วันโกน');if(s.includeImportant)types.push('วันสำคัญ');$('#summaryTypes').textContent=types.join(' + ')||'ยังไม่ได้เลือก';$('#summaryAlert').textContent=`${s.daysBefore===0?'วันเดียวกัน':`${s.daysBefore} วันก่อน`} เวลา ${s.time}${s.extraMorning?' + เช้าวันพระ 06:00':''}`;$('#summaryYears').textContent=dataset?dataset.metadata.coverage.beYears.join('–'):'—';$('#eventCount').textContent=dataset?`${selectedEvents().length} รายการ`:'—';saveSettings();renderPreview();}
function renderPreview(){if(!dataset)return;const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Bangkok'});const events=nextEvents(selectedEvents(),today,4);const root=$('#previewList');root.replaceChildren();for(const e of events){const article=document.createElement('article');article.className='event-card';article.innerHTML=`<div class="date-box"><strong>${e.date.slice(8)}</strong><span>${new Intl.DateTimeFormat('th-TH',{month:'short',timeZone:'UTC'}).format(new Date(e.date+'T00:00:00Z'))}</span></div><div class="event-copy"><span class="event-type">${e.type==='wanphra'?'วันพระ':e.type==='wankon'?'วันโกน':'วันสำคัญ'}</span><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.description||formatThaiDate(e.date))}</p></div><span class="event-icon">${e.type==='important'?'✦':e.type==='wankon'?'◒':'◐'}</span>`;root.append(article);}if(!events.length)root.innerHTML='<div class="empty">ไม่มีรายการในช่วงข้อมูลที่รองรับ</div>';}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600);}
function downloadIcs(){const s=settingsFromForm();const events=selectedEvents();if(!events.length){toast('กรุณาเลือกอย่างน้อย 1 ประเภท');return;}const content=generateIcs(events,{calendarName:'WanPra — วันพระไทย',reminder:{daysBefore:s.daysBefore,time:s.time},extraMorning:s.extraMorning,datasetVersion:dataset.metadata.datasetVersion,sequence:dataset.metadata.revision});const blob=new Blob([content],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wanpra-custom.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`สร้างปฏิทิน ${events.length} รายการแล้ว`);}
function subscribeDefault(){const httpsUrl=new URL('./feeds/wanpra-default.ics',location.href).href;const webcal=httpsUrl.replace(/^https:/,'webcal:');if(/iPhone|iPad|Macintosh/.test(navigator.userAgent)){location.href=webcal;return;}navigator.clipboard?.writeText(httpsUrl).then(()=>toast('คัดลอก Subscription URL แล้ว')).catch(()=>{prompt('คัดลอก URL นี้',httpsUrl)});}

function subscribeCustom() {
  if (!selectedEvents().length) { toast('กรุณาเลือกอย่างน้อย 1 ประเภท'); return; }
  if (!CUSTOM_FEED_ENDPOINT) { toast('ใช้ไฟล์ .ics หรือ Subscribe ค่าแนะนำได้ในระหว่างนี้'); return; }
  try {
    const url = buildSubscriptionUrl(CUSTOM_FEED_ENDPOINT, settingsFromForm());
    $('#subscriptionUrl').value = url;
    $('#appleSubscriptionLink').href = url.replace(/^https?:/, 'webcal:');
    $('#subscriptionProfile').textContent = `${$('#summaryTypes').textContent} • ${$('#summaryAlert').textContent}`;
    $('#subscriptionPanel').hidden = false;
    $('#copySubscriptionBtn').textContent = 'คัดลอกลิงก์';
    $('#subscriptionUrl').focus();
    $('#subscriptionPanel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  } catch {
    toast('ตรวจประเภท วัน และเวลาเตือน แล้วลองอีกครั้ง');
  }
}

async function copySubscription() {
  const url = $('#subscriptionUrl').value;
  if (!url) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    $('#copySubscriptionBtn').textContent = 'คัดลอกแล้ว';
    toast('คัดลอกลิงก์ปฏิทินแล้ว');
  } catch {
    $('#subscriptionUrl').focus();
    $('#subscriptionUrl').select();
    toast('เลือกข้อความลิงก์แล้ว ใช้เมนูคัดลอกของอุปกรณ์');
  }
}

function initSubscription() {
  $('#customSubscribeBtn').disabled = !CUSTOM_FEED_ENDPOINT;
  $('#subscriptionUnavailable').hidden = Boolean(CUSTOM_FEED_ENDPOINT);
  $('#customSubscribeBtn').addEventListener('click', subscribeCustom);
  $('#copySubscriptionBtn').addEventListener('click', copySubscription);
  $$('input,select').forEach(el => {
    if (el.id === 'subscriptionUrl') return;
    el.addEventListener('change', () => { $('#subscriptionPanel').hidden = true; $('#subscriptionUrl').value = ''; });
  });
  $$('.preset').forEach(el => el.addEventListener('click', () => { $('#subscriptionPanel').hidden = true; $('#subscriptionUrl').value = ''; }));
}

async function init(){dataset=await loadCalendarDataset();const errors=validateDataset(dataset);if(errors.length)throw new Error(`Calendar dataset failed validation: ${errors[0]}`);applySettings(readSettings());$('#dataVersion').textContent=`Dataset ${dataset.metadata.datasetVersion}`;$('#coverage').textContent=`ข้อมูล พ.ศ. ${dataset.metadata.coverage.beYears.join('–')}`;$$('input,select').forEach(el=>el.addEventListener('change',updateSummary));$$('.preset').forEach(btn=>btn.addEventListener('click',()=>{$$('.preset').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$('#daysBefore').value=btn.dataset.days;$('#reminderTime').value=btn.dataset.time;updateSummary();}));$$('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.scroll).scrollIntoView({behavior:'smooth'})));$('#generateBtn').addEventListener('click',downloadIcs);$('#subscribeBtn').addEventListener('click',subscribeDefault);$('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');$('#themeToggle').textContent=document.body.classList.contains('dark')?'☀':'☾';});$('#installBtn').addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;}else toast(/iPhone|iPad/.test(navigator.userAgent)?'บน iPhone ใช้ Share → Add to Home Screen':'ใช้เมนู Browser → ติดตั้งแอป / เพิ่มไปยังหน้าจอหลัก');});updateSummary();}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
init().then(initSubscription).catch(error=>{console.error(error);$('#appError').hidden=false;$('#appError').textContent='โหลดข้อมูลปฏิทินไม่สำเร็จ กรุณาลองรีเฟรชอีกครั้ง';});
