/* Happy Hill home page: renders the sections from js/landing-data.js */
(function () {
  'use strict';
  const D = window.HH_SITE || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  document.documentElement.classList.add('js');

  const ICONS = {
    college: 'M3 9l9-5 9 5-9 5-9-5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5',
    experts: 'M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8z',
    link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
    mind: 'M12 20s-7-4.4-7-9.6A4.2 4.2 0 0112 8a4.2 4.2 0 017 2.4C19 15.6 12 20 12 20z',
    craft: 'M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10',
    learn: 'M4 5h6a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v13a2 2 0 012-2h6z',
    play: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
    docs: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
    build: 'M4 21V10l8-6 8 6v11M9 21v-6h6v6',
    health: 'M3 12h4l2-6 4 12 2-6h6',
    culture: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
    meet: 'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8',
    pin: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',
    cal: 'M4 7h16v13H4zM4 11h16M8 3v4M16 3v4',
    down: 'M12 4v12M7 11l5 5 5-5M5 20h14',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    check: 'M5 13l4 4L19 7',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18'
  };
  const ico = (k, cls) => `<svg viewBox="0 0 24 24" class="${cls || 'ic'}" aria-hidden="true"><path d="${ICONS[k] || ICONS.spark}"/></svg>`;

  // Coloured illustration used when an item has no photograph
  const PAL = { craft: ['#2f8f46', '#6cc24a'], mind: ['#7050c8', '#a68cf0'], culture: ['#d97a2b', '#f6c945'], health: ['#2b78c2', '#6cc2e8'], play: ['#d2453a', '#f49a6b'], learn: ['#1f6b33', '#3fae6a'], meet: ['#7a3a22', '#c8875a'], build: ['#4f6b57', '#9bb3a0'] };
  let uid = 0;
  function art(kind) {
    const [a, b] = PAL[kind] || PAL.craft, id = 'g' + (++uid);
    return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="400" height="240" fill="url(#${id})"/>
      <circle cx="330" cy="40" r="90" fill="#fff" opacity=".10"/><circle cx="40" cy="220" r="110" fill="#fff" opacity=".10"/><circle cx="300" cy="210" r="46" fill="#fff" opacity=".08"/>
      <g fill="#fff" opacity=".18"><path d="M70 150c18-34 52-44 80-30-10 34-44 52-80 30z"/><path d="M250 70c14-24 40-30 60-18-8 24-32 38-60 18z"/></g>
      <circle cx="200" cy="120" r="46" fill="#fff" opacity=".94"/>
      <g transform="translate(176 96) scale(2)" fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[kind] || ICONS.craft}"/></g></svg>`;
  }
  const media = (item, extra) => (item.image ? `<img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" style="object-position:${esc(item.pos || '50% 40%')}">` : art(item.art)) + (item.sample && D.SHOW_SAMPLE_TAGS ? '<span class="sample">Sample</span>' : '') + (extra || '');

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateOf = it => it.date ? new Date(it.date + 'T00:00:00') : it.inDays != null ? new Date(Date.now() + it.inDays * 864e5) : new Date(Date.now() - (it.daysAgo || 0) * 864e5);
  const long = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const until = d => { const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / 864e5); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n > 1 ? `In ${n} days` : 'Held'; };

  /* ----- stats ----- */
  $('#stats').innerHTML = (D.stats || []).map(s => `<div class="stat"><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join('');

  /* ----- pillars & programmes ----- */
  $('#pillars').innerHTML = (D.pillars || []).map((p, i) => `<article class="card pillar reveal" style="--d:${i * 80}ms"><div class="ico">${ico(p.icon)}</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('');
  $('#programmes').innerHTML = (D.programmes || []).map((p, i) => `<article class="card prog reveal" style="--d:${i * 60}ms"><div class="ico sm">${ico(p.icon)}</div><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></article>`).join('');

  /* ----- milestones ----- */
  const ST = { done: ['Done', 'done'], now: ['In progress', 'now'], next: ['Coming up', 'next'] };
  $('#timeline').innerHTML = (D.milestones || []).map((m, i) => {
    const s = ST[m.status] || ST.next;
    return `<li class="tl ${s[1]} reveal" style="--d:${i * 70}ms"><span class="dot">${m.status === 'done' ? ico('check', 'ic') : ''}</span>
      <div class="tl-card"><div class="tl-top"><span class="pill ${s[1]}">${s[0]}</span>${m.date ? `<span class="muted">${esc(m.date)}</span>` : ''}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></div></li>`;
  }).join('');

  /* ----- institutions ----- */
  $('#institutions').innerHTML = (D.institutions || []).map((n, i) => `<article class="card inst reveal" style="--d:${i * 50}ms">
      <div class="mark">${n.logo ? `<img src="${esc(n.logo)}" alt="" onerror="this.parentNode.textContent='${esc(n.mark)}'">` : esc(n.mark)}</div><h3>${esc(n.name)}</h3><p>${esc(n.role)}</p></article>`).join('');

  /* ----- colleges ----- */
  $('#colleges').innerHTML = (D.colleges || []).map((c, i) => `<article class="card colc reveal" style="--d:${i * 50}ms">
      ${c.image ? `<div class="thumb sq"><img src="${esc(c.image)}" alt="${esc(c.name)} at the certificate ceremony" loading="lazy" style="object-position:${esc(c.pos || '50% 38%')}"></div>` : ''}
      <div class="body"><div class="ico sm">${ico('college')}</div><div><h3>${esc(c.name)}</h3><p>${ico('link', 'ic xs')} ${esc(c.home)}</p><span class="pill soft">Annual MoU</span></div></div>${c.sample && D.SHOW_SAMPLE_TAGS ? '<span class="sample">Please confirm</span>' : ''}</article>`).join('');

  /* ----- activities ----- */
  $('#activity-cards').innerHTML = (D.activities || []).map((a, i) => `<article class="card act reveal" style="--d:${i * 60}ms">
      <div class="thumb">${media(a)}</div>
      <div class="body"><div class="meta"><span>${a.date || a.daysAgo != null ? ico('cal', 'ic xs') + ' ' + long(dateOf(a)) : (a.label ? esc(a.label) : '')}</span>${a.tag || a.college ? `<span class="pill soft">${esc(a.tag || a.college)}</span>` : ''}</div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div></article>`).join('');

  /* ----- photo slideshow: runs by itself, always centred, nothing cropped ----- */
  const gal = D.gallery || [], track = $('#track'), slider = $('#slider');
  if (gal.length) {
    const one = gal.map(g => `<figure class="slide"><span class="bg" style="background-image:url('${esc(g.image)}')"></span><img src="${esc(g.image)}" alt="${esc(g.alt)}" loading="lazy"></figure>`).join('');
    track.innerHTML = one + one + one;                       // three copies so the loop never runs out
    const slides = [...track.children], n = gal.length;
    slides.forEach((el, i) => { if (i < n || i >= 2 * n) el.setAttribute('aria-hidden', 'true'); });
    let idx = n;
    const place = () => {
      const el = slides[idx];
      track.style.transform = `translateX(${slider.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)}px)`;
      slides.forEach((s2, i) => s2.classList.toggle('on', i === idx));
    };
    const jump = () => { track.classList.add('jump'); place(); void track.offsetWidth; track.classList.remove('jump'); };
    track.addEventListener('transitionend', e => { if (e.target === track && idx >= 2 * n) { idx -= n; jump(); } });
    window.addEventListener('resize', jump);
    jump();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(() => { if (document.hidden) return; idx++; place(); }, 3800);
    }
  }

  /* ----- events ----- */
  $('#event-cards').innerHTML = (D.events || []).slice().sort((x, y) => dateOf(x) - dateOf(y)).map((e, i) => {
    const d = dateOf(e);
    return `<article class="card ev reveal" style="--d:${i * 80}ms">
      <div class="thumb">${media(e, `<div class="date"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()]}</span></div><span class="when">${until(d)}</span>`)}</div>
      <div class="body"><h3>${esc(e.title)}</h3><p>${ico('pin', 'ic xs')} ${esc(e.where)}</p><p>${ico('college', 'ic xs')} ${esc(e.college)}</p></div></article>`;
  }).join('') || '<p class="muted">No events scheduled right now. Please check back soon.</p>';

  /* ----- reports ----- */
  $('#report-cards').innerHTML = (D.reports || []).map((r, i) => `<article class="card rep reveal" style="--d:${i * 60}ms">
      <div class="ico">${ico('docs')}</div>
      <div class="grow"><span class="pill soft">${esc(r.kind)}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>
      ${r.file ? `<a class="btn btn-line" href="${esc(r.file)}" target="_blank" rel="noopener">${ico('down', 'ic xs')} Download</a>` : `<span class="soon">Available soon</span>`}
      ${r.sample && D.SHOW_SAMPLE_TAGS ? '<span class="sample">Sample</span>' : ''}</article>`).join('');

  /* ----- contact ----- */
  const c = D.contact || {};
  $('#contact-box').innerHTML = `<p><b>${esc(c.org)}</b><br>${esc(c.line)}</p><p>${(c.address || []).map(esc).join('<br>')}</p>
    <p>${ico('phone', 'ic xs')} <a href="tel:${esc((c.phone || '').replace(/\s/g, ''))}">${esc(c.phone)}</a></p><p>${ico('mail', 'ic xs')} <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>`;
  $('#yr').textContent = new Date().getFullYear();

  /* ----- nav: burger, active link, header shadow ----- */
  const burger = $('#burger'), nav = document.querySelector('.nav');
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $('#menu').addEventListener('click', e => { if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });
  const links = [...document.querySelectorAll('#menu a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ----- reveal on scroll ----- */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('in'));
  window.addEventListener('beforeprint', () => items.forEach(el => el.classList.add('in')));
})();
