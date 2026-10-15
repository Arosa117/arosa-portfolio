/* ============================================================
   Arosa · 摄影师作品集   main.js(黑白极简)
   纯原生 JS, 无依赖; 支持 file:// 直接打开
   ============================================================ */
'use strict';

/* ---------- 站点默认配置(可在 index.html 的 SITE_CONFIG 覆盖) ---------- */
var SITE = Object.assign({
  brandZh: 'Arosa',             // 品牌名
  brandEn: 'PHOTOGRAPHER',      // 品牌英文小标
  heroTitle1: 'Arosa',           // 首页大标题(上)
  heroTitle2: '',                // 首页大标题(下, 可留空)
  heroEyebrow: 'PHOTOGRAPHER · 自由摄影师',
  heroSub: '我是 Arosa, 一名风格灵活多变的自由摄影师。人像、概念、合成、商业与后期——不拘一格, 只为把脑海里的画面, 变成值得被看见的作品。',
  heroWork: '',                  // 首页主图: 填作品 id(如 01) 或留空自动取第一张
  aboutLabel: '关于',
  aboutName: 'Arosa',
  aboutRole: '自由摄影师 · 风格灵活多变',
  footerNote: ''
}, window.SITE_CONFIG || {});

var DATA = window.PORTFOLIO_DATA || { works: [] };
var WORKS = DATA.works || [];

/* ---------- 工具 ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function encUrl(p) {
  return p.split('/').map(function(seg){ return encodeURIComponent(seg); }).join('/');
}
var CN_NUM = ['〇','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六'];
function cnNum(n) { return CN_NUM[n] || String(n); }
function pad2(n) { return n < 10 ? '0' + n : String(n); }

/* ---------- 导航: 滚动状态 / 移动端菜单 / 锚点高亮 ---------- */
var nav = $('.site-nav');
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 24);
  // 滚动高亮当前区块
  var links = $all('.nav-links a[href^="#"]');
  var pos = window.scrollY + window.innerHeight * 0.32;
  var cur = null;
  links.forEach(function(a){
    var sec = document.querySelector(a.getAttribute('href'));
    if (sec && sec.offsetTop <= pos) cur = a;
  });
  links.forEach(function(a){ a.classList.toggle('active', a === cur && a.classList.contains('cta') === false && cur !== null && cur.getAttribute('href') !== '#home'); });
  if (!cur || cur.getAttribute('href') === '#home') { links.forEach(function(a){ if (!a.classList.contains('cta')) a.classList.remove('active'); }); }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

var burger = $('.nav-burger');
burger.addEventListener('click', function(){
  document.body.classList.toggle('menu-open');
});
$all('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ document.body.classList.remove('menu-open'); }); });

/* ---------- 站点文案注入 ---------- */
function setText(sel, txt) { var el = $(sel); if (el && txt) el.textContent = txt; }
setText('.brand .zh', SITE.brandZh);
setText('.brand .en', SITE.brandEn);
setText('.hero h1 .l1', SITE.heroTitle1 || SITE.brandZh);
setText('.hero h1 .l2', SITE.heroTitle2 || '');
setText('.hero .eyebrow .t', SITE.heroEyebrow);
setText('.hero .sub', SITE.heroSub);
var heroL2 = $('.hero h1 .l2'); if (heroL2 && !SITE.heroTitle2) heroL2.remove();
document.title = SITE.brandZh + ' · ' + SITE.brandEn;
var yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();

/* ---------- 关于 / 统计注入 ---------- */
setText('.about-name-inline', SITE.aboutName);
setText('.about-role', SITE.aboutRole);
var countEl = $('#work-count'); if (countEl) countEl.textContent = WORKS.length;
var rangeEl = $('#range-years');
if (rangeEl && WORKS.length) {
  var dates = WORKS.map(function(w){ return String(w.mtime || ''); }).filter(Boolean).sort();
  if (dates.length) {
    var fmt = function(d){ var m = d.slice(0, 7).split('-'); return m[0] + '.' + m[1]; };
    var first = fmt(dates[0]), last = fmt(dates[dates.length - 1]);
    rangeEl.textContent = (first === last) ? first : (first + ' — ' + last);
  }
}
$all('.work-total').forEach(function(el){ el.textContent = WORKS.length; });

/* ---------- 生成作品区 ---------- */
var gallery = $('#gallery');
if (!gallery || !WORKS.length) {
  if (gallery) gallery.innerHTML = '<p style="color:#6b665f;padding:40px 0">暂无作品。请把图片放进本文件夹后运行 python build.py 生成。</p>';
} else {
  var html = [];
  WORKS.forEach(function(w, i){
    var ratio = w.h && w.w ? (w.w / w.h) : 1;
    var orient = w.orientation === 'portrait' ? 'is-portrait' : (w.orientation === 'pano' ? 'is-pano' : 'is-landscape');
    var sizeTxt = w.w + ' × ' + w.h;
    var dimTxt = w.mb ? sizeTxt + ' · ' + w.mb + ' MB' : sizeTxt;
    var note = w.note ? '<p class="work-note">' + esc(w.note) + '</p>' : '';
    html.push(
      '<article class="work ' + orient + ' reveal" id="work-' + w.id + '" data-index="' + i + '">' +
        '<div class="work-stage">' +
          '<span class="work-mark" aria-hidden="true">' + cnNum(i + 1) + '</span>' +
          '<div class="work-media" role="button" tabindex="0" aria-label="查看作品大图">' +
            '<span class="ph">载入中…</span>' +
            '<img class="work-img" alt="作品 ' + pad2(i + 1) + '" src="' + encUrl(w.thumb) + '" data-src="' + encUrl(w.web) + '" data-w="' + w.w + '" data-h="' + w.h + '" loading="lazy" decoding="async">' +
            '<span class="open-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>查看大图</span>' +
          '</div>' +
        '</div>' +
        '<div class="work-cap">' +
          '<div class="meta"><span class="no">№ ' + pad2(i + 1) + '</span><span>' + dimTxt + '</span><span>' + esc(w.mtime || '') + '</span></div>' +
        '</div>' + note +
      '</article>'
    );
  });
  gallery.innerHTML = html.join('');
  layoutWorks();
  bindImgLoaders();
  bindWorks();
  observeReveal();
}

/* ---------- 精确占位布局: 根据视口高度与比例预留图片空间 ---------- */
function layoutWorks(){
  var capH = Math.max(280, window.innerHeight - 320);
  $all('.work').forEach(function(art){
    var media = $('.work-media', art);
    var img = $('.work-img', media);
    if (!media || !img) return;
    var w = parseInt(img.getAttribute('data-w'), 10) || 4;
    var h = parseInt(img.getAttribute('data-h'), 10) || 3;
    var ratio = w / h;
    var stageW = art.querySelector('.work-stage').clientWidth || media.parentElement.clientWidth;
    var width = Math.min(stageW, capH * ratio);
    media.style.width = Math.max(60, Math.floor(width)) + 'px';
    media.style.aspectRatio = w + ' / ' + h;
  });
}
var rzTimer = null;
window.addEventListener('resize', function(){ clearTimeout(rzTimer); rzTimer = setTimeout(layoutWorks, 150); });

/* ---------- 渐进加载: 缩略图 -> 高清图(滚动进入视口后替换) ---------- */
var imgObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if (!en.isIntersecting) return;
    var img = en.target;
    imgObserver.unobserve(img);
    if (img.dataset.src) {
      var full = new Image();
      full.onload = function(){ img.src = img.dataset.src; img.classList.add('loaded'); };
      full.onerror = function(){ img.classList.add('loaded'); };
      full.src = img.dataset.src;
      img.dataset.src = '';
    } else {
      img.classList.add('loaded');
    }
  });
}, { rootMargin: '600px 0px' }) : null;
function bindImgLoaders(){
  $all('.work-img').forEach(function(img){
    if (imgObserver) imgObserver.observe(img);
    else { var s = img.dataset.src; if (s) { img.src = s; img.classList.add('loaded'); } }
  });
}

/* ---------- 入场动画 ---------- */
function observeReveal(){
  if (!('IntersectionObserver' in window)) { $all('.reveal').forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.06 });
  $all('.reveal').forEach(function(el){ io.observe(el); });
}

/* ---------- 灯箱 ---------- */
var lb = $('#lightbox');
var lbImg = $('#lb-img');
var lbTitle = $('#lb-title');
var lbMeta = $('#lb-meta');
var lbOrig = $('#lb-orig');
var lbLoading = $('#lb-loading');
var cur = -1;

function loadLightbox(i){
  if (i < 0) i = WORKS.length - 1;
  if (i >= WORKS.length) i = 0;
  cur = i;
  var w = WORKS[i];
  lbImg.classList.remove('ready');
  lbLoading.style.display = 'grid';
  lbImg.onload = function(){ lbImg.classList.add('ready'); lbLoading.style.display = 'none'; };
  lbImg.src = encUrl(w.web);
  lbMeta.innerHTML = '<span class="no">№ ' + pad2(i + 1) + ' / ' + WORKS.length + '</span><span>' + w.w + ' × ' + w.h + '</span>' + (w.mb ? '<span>' + w.mb + ' MB</span>' : '') + '<span>' + esc(w.mtime || '') + '</span>' + '<span class="shot">SHOT BY AROSA</span>';
  if (lbOrig) {
    lbOrig.href = encUrl(w.file);
    lbOrig.setAttribute('download', w.file);
  }
  var noEl = $('#lb-no'); if (noEl) noEl.textContent = pad2(i + 1);
}
function openLightbox(i){ loadLightbox(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeLightbox(){ lb.classList.remove('open'); document.body.style.overflow = ''; }
function step(d){ if (cur >= 0) loadLightbox(cur + d); }

function bindWorks(){
  $all('.work-media').forEach(function(m){
    var art = m.closest('.work');
    var idx = parseInt(art.getAttribute('data-index'), 10);
    var open = function(e){ if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); openLightbox(idx); };
    m.addEventListener('click', open);
    m.addEventListener('keydown', open);
  });
}

$('#lb-close').addEventListener('click', closeLightbox);
$('#lb-prev').addEventListener('click', function(){ step(-1); });
$('#lb-next').addEventListener('click', function(){ step(1); });
lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-stage')) closeLightbox(); });
document.addEventListener('keydown', function(e){
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

/* ---------- 联系信息(从 SITE_CONFIG 读取, 未填则隐藏) ---------- */
var contactRows = [
  { key: 'qq', tag: 'QQ', href: null, val: SITE.qq || '' },
  { key: 'email', tag: '邮箱', href: null, val: SITE.email || '' },
  { key: 'wechat', tag: '微信', href: null, val: SITE.wechat || '' },
  { key: 'phone', tag: '电话', href: null, val: SITE.phone || '' },
  { key: 'xiaohongshu', tag: '小红书', href: null, val: SITE.xiaohongshu || '' },
  { key: 'zcool', tag: '站酷', href: null, val: SITE.zcool || '' },
  { key: 'weibo', tag: '微博', href: null, val: SITE.weibo || '' },
];
contactRows.forEach(function(r){
  if (r.key === 'email' && r.val) r.href = 'mailto:' + r.val;
  if (r.key === 'phone' && r.val) r.href = 'tel:' + String(r.val).replace(/[^0-9+]/g, '');
  if ((r.key === 'xiaohongshu' || r.key === 'zcool' || r.key === 'weibo') && r.val && !/^https?:\/\//.test(r.val)) r.val = 'https://' + r.val;
  if ((r.key === 'xiaohongshu' || r.key === 'zcool' || r.key === 'weibo') && r.href === null) r.href = r.val;
});
var filled = contactRows.filter(function(r){ return r.val; });
var list = $('#contact-list');
if (list) {
  if (!filled.length) {
    list.innerHTML = '<li><div class="row"><span class="tag">提示</span><span class="contact-empty">还没有填写联系方式。请在 index.html 顶部的 SITE_CONFIG 里补充 email / wechat / xiaohongshu 等字段, 这里会自动显示。</span></div></li>';
  } else {
    var lis = [];
    filled.forEach(function(r){
      var arrow = r.href ? '<span class="go">→</span>' : '';
      var openTag = r.href ? '<a href="' + esc(r.href) + '" target="_blank" rel="noopener">' : '<div class="row">';
      var closeTag = r.href ? '</a>' : '</div>';
      lis.push('<li>' + openTag + '<span class="tag">' + r.tag + '</span><span class="val">' + esc(r.val) + '</span>' + arrow + closeTag + '</li>');
    });
    list.innerHTML = lis.join('');
  }
}

/* ---------- 约稿下单 ---------- */
var ORDER_SERVICES = SITE.orderServices || [
  {
    name: '约拍 / 陪拍 / 外景正片', price: 120, priceText: '120', priceSuffix: 'r/h',
    unit: '小时', min: 2, depositRate: 0.3, tag: '2 小时起拍 · 定金 30%',
    notes: ['2 小时起拍, 定金为全款 30%', '跑单、迟到超 30 分钟不退', '10 公里以内免交通费用, 超出需另付', '返图时间在 7 天以内']
  },
  {
    name: '漫展场照', price: 20, priceText: '20', priceSuffix: 'r/张',
    unit: '张', min: 4, depositRate: 0.3, tag: '四张起拍 · 定金 30%',
    notes: ['四张起拍, 定金为全款 30%', '跑单、迟到超 30 分钟不退', '可提供动作指导, 需自备动作', '后期只做调色、轻微磨皮 · 返图 14 天内']
  },
  {
    name: '半合成场照', price: 50, priceText: '50', priceSuffix: 'r/张',
    unit: '张', min: 1, depositRate: 0.3, tag: '定金 30% · 指定特效额外收费',
    notes: ['定金为全款 30%', '指定特效额外收费']
  },
  {
    name: '全合成场照', price: 100, priceText: '100', priceSuffix: 'r/张',
    unit: '张', min: 1, depositRate: 0.3, tag: '定金 30% · 指定特效额外收费',
    notes: ['定金为全款 30%', '指定特效额外收费']
  }
];
var ORDER_DEADLINES = SITE.orderDeadlines || ['尽快安排', '一周内', '两周内', '本月内', '时间待定'];
var ORDER_GEAR = SITE.orderGear || '佳能 R6 + 腾龙 a007 24-70mm f2.8 · 佳能原厂 50mm f1.8 三代 · 神牛 V850 三代 x1 / V860 三代 x2';
var ORDER_EMAIL = SITE.orderEmail || SITE.email || '';
var ORDER_QQ = SITE.orderQQ || SITE.qq || '';

var ofForm = $('#order-form');
if (ofForm) {
  var ofServicesEl = $('#of-services');
  var ofQty = $('#of-qty');
  var ofQtyLabel = $('#of-qty-label');
  var ofDeadline = $('#of-deadline');
  var ofBrief = $('#of-brief');
  var ofName = $('#of-name');
  var ofContact = $('#of-contact');
  var ofMsg = $('#of-msg');
  var ocBody = $('#oc-body');
  var ocActions = $('#oc-actions');
  var ocHint = $('#oc-hint');
  var ofCopy = $('#of-copy');
  var ofMail = $('#of-mail');
  var ofQQ = $('#of-qq');
  var ofPriceList = $('#price-list');
  var ofGear = $('#price-gear');
  var generated = false;

  ORDER_DEADLINES.forEach(function(t){
    var o = document.createElement('option');
    o.value = t; o.textContent = t;
    ofDeadline.appendChild(o);
  });

  if (ofPriceList) {
    var plHtml = [];
    ORDER_SERVICES.forEach(function(s){
      var notes = (s.notes || []).map(function(n){ return '<span>' + esc(n) + '</span>'; }).join('');
      plHtml.push(
        '<div class="pl-row">' +
          '<div class="pl-main">' +
            '<div class="pl-name">' + esc(s.name) + '</div>' +
            '<div class="pl-notes">' + notes + '</div>' +
          '</div>' +
          '<div class="pl-price"><b>' + esc(s.priceText) + '</b><i>' + esc(s.priceSuffix) + '</i></div>' +
        '</div>'
      );
    });
    ofPriceList.innerHTML = plHtml.join('');
  }
  if (ofGear) ofGear.textContent = '设备 · ' + ORDER_GEAR;

  ORDER_SERVICES.forEach(function(s, i){
    var label = document.createElement('label');
    label.className = 'of-service' + (i === 0 ? ' is-on' : '');
    label.innerHTML = '<input type="radio" name="of-service" value="' + i + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span class="s-name">' + esc(s.name) + '</span>' +
      (s.tag ? '<span class="s-desc">' + esc(s.tag) + '</span>' : '') +
      '<span class="s-price">' + esc(s.priceText + s.priceSuffix) + '</span>';
    ofServicesEl.appendChild(label);
  });

  function syncServiceUI() {
    var svc = ORDER_SERVICES[currentServiceIndex()] || ORDER_SERVICES[0] || {};
    var min = svc.min || 1;
    if (ofQtyLabel) ofQtyLabel.textContent = (svc.unit === '小时') ? '时长（小时）' : '张数';
    ofQty.min = min;
    if ((parseInt(ofQty.value, 10) || 0) < min) ofQty.value = min;
  }

  function currentServiceIndex() {
    var el = ofForm.querySelector('input[name="of-service"]:checked');
    return el ? parseInt(el.value, 10) : 0;
  }
  function orderData() {
    var svc = ORDER_SERVICES[currentServiceIndex()] || ORDER_SERVICES[0] || {};
    var min = svc.min || 1;
    var qty = parseInt(ofQty.value, 10) || min;
    if (qty < min) qty = min;
    if (qty > 999) qty = 999;
    var price = svc.price || 0;
    var sub = price * qty;
    var rate = (typeof svc.depositRate === 'number') ? svc.depositRate : 0;
    var deposit = Math.round(sub * rate);
    return {
      service: svc.name || '',
      unit: svc.unit || '张',
      priceText: (svc.priceText || '0') + (svc.priceSuffix || ''),
      min: min,
      depositRate: rate,
      deposit: deposit,
      balance: sub - deposit,
      qty: qty,
      sub: sub,
      deadline: ofDeadline.value || ORDER_DEADLINES[0],
      brief: (ofBrief.value || '').trim(),
      name: (ofName.value || '').trim(),
      contact: (ofContact.value || '').trim()
    };
  }
  function orderText() {
    var d = orderData();
    var lines = [
      '【约稿订单】',
      '服务：' + d.service,
      '数量：' + d.qty + ' ' + d.unit,
      '单价：' + d.priceText,
      '小计：' + d.sub + 'r',
      '定金：' + d.deposit + 'r (全款 ' + Math.round(d.depositRate * 100) + '%, 需预付)',
      '尾款：' + d.balance + 'r',
      '期望档期：' + d.deadline,
      '画面需求：' + (d.brief || '(未填写)'),
      '称呼：' + (d.name || '(未填写)'),
      '联系方式：' + (d.contact || '(未填写)'),
      '—— 来自 Arosa 作品集网站'
    ];
    return lines.join('\n');
  }
  function row(k, v) {
    return '<div class="oc-row"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v || '—') + '</span></div>';
  }
  function renderOrder() {
    var d = orderData();
    ocBody.innerHTML =
      row('服务', d.service) +
      row('数量', d.qty + ' ' + d.unit) +
      row('单价', d.priceText) +
      row('小计', d.sub + 'r') +
      row('定金', d.deposit + 'r（' + Math.round(d.depositRate * 100) + '%, 需预付）') +
      row('尾款', d.balance + 'r') +
      row('期望档期', d.deadline) +
      row('画面需求', d.brief || '待填写') +
      row('称呼', d.name || '待填写') +
      row('联系方式', d.contact || '待填写') +
      '<div class="oc-total"><span>合计</span><b>' + d.sub + '<i>r</i></b></div>';
    if (generated) refreshActions();
  }
  function refreshActions() {
    var d = orderData();
    var text = orderText();
    if (ofMail) {
      if (ORDER_EMAIL) {
        ofMail.hidden = false;
        ofMail.onclick = function(){
          var subject = '约稿订单 · ' + d.service + ' · ' + d.qty + ' 张';
          window.location.href = 'mailto:' + encodeURIComponent(ORDER_EMAIL) +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(text);
        };
      } else { ofMail.hidden = true; }
    }
    if (ofQQ) {
      if (ORDER_QQ) {
        ofQQ.hidden = false;
        ofQQ.href = 'https://wpa.qq.com/msgrd?v=3&uin=' + encodeURIComponent(ORDER_QQ) + '&site=qq&menu=yes';
      } else { ofQQ.hidden = true; }
    }
    if (ofCopy) {
      ofCopy.onclick = function(){
        var t = orderText();
        var done = function(){ ofMsg.textContent = '订单信息已复制, 粘贴到 QQ / 微信发给我即可。'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(done, function(){ legacyCopy(t); done(); });
        } else { legacyCopy(t); done(); }
      };
    }
  }
  function legacyCopy(t) {
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  ofServicesEl.addEventListener('change', function(e){
    if (!e.target || e.target.name !== 'of-service') return;
    $all('.of-service', ofServicesEl).forEach(function(el){
      el.classList.toggle('is-on', $('input', el).checked);
    });
    syncServiceUI();
    renderOrder();
  });
  ['input', 'change'].forEach(function(evt){
    ofForm.addEventListener(evt, function(e){
      if (e.target && e.target.name === 'of-service') return;
      renderOrder();
    });
  });
  ofBrief.addEventListener('input', renderOrder);

  ofForm.addEventListener('submit', function(e){
    e.preventDefault();
    var d = orderData();
    if (!d.name || !d.contact) {
      ofMsg.textContent = '请先填写「称呼」和「联系方式」, 方便我回复你。';
      generated = false;
      ocActions.hidden = true;
      (d.name ? ofContact : ofName).focus();
      return;
    }
    var depositTxt = d.deposit ? '（定金 ' + d.deposit + 'r 需预付）' : '';
    if (!d.brief) {
      ofMsg.textContent = '订单已生成' + depositTxt + ', 未填画面需求也可以直接发送。';
    } else {
      ofMsg.textContent = '订单已生成' + depositTxt + ', 选择下面的方式发给我即可。';
    }
    generated = true;
    refreshActions();
    ocActions.hidden = false;
    renderOrder();
    if (!ocHint.dataset.done) {
      ocHint.dataset.done = '1';
    }
  });
  ofForm.addEventListener('reset', function(){
    generated = false;
    ocActions.hidden = true;
    ofMsg.textContent = '';
    window.setTimeout(function(){
      ofServicesEl.querySelectorAll('.of-service').forEach(function(el, i){
        el.classList.toggle('is-on', i === 0);
      });
      ofDeadline.selectedIndex = 0;
      ofQty.value = (ORDER_SERVICES[0] && ORDER_SERVICES[0].min) || 1;
      syncServiceUI();
      renderOrder();
    }, 0);
  });

  ocHint.textContent = SITE.orderNote || '本站为作品展示页, 生成订单后通过邮件或 QQ 发给我, 我会尽快回复档期与报价。';
  syncServiceUI();
  renderOrder();
}

/* ---------- Hero 主图: 优先 SITE.heroWork, 否则第一张 ---------- */
function pickHero(){
  var target = SITE.heroWork;
  var w = null;
  if (target) {
    WORKS.forEach(function(x){ if (x.id === target || x.title === target) w = x; });
  }
  if (!w && WORKS.length) w = WORKS[0];
  if (!w) return;
  var bg = $('.hero-bg');
  if (!bg) return;
  var pre = new Image();
  pre.onload = function(){ bg.style.backgroundImage = 'url("' + encUrl(w.web) + '")'; bg.classList.add('ready'); };
  pre.src = encUrl(w.web);
}
pickHero();

/* ---------- 页脚作品数 ---------- */
$all('.foot-count').forEach(function(el){ el.textContent = WORKS.length; });

if (window.PORTFOLIO_READY) window.PORTFOLIO_READY();
