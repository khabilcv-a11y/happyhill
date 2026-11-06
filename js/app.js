/* Happy Hill Tracker - front-end prototype (sample data, no server yet) */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 864e5;
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const today = () => iso(new Date());
  const daysTo = d => Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / DAY);
  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtT = t => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  /* ---------- storage ---------- */
  const CFG = window.HH_CONFIG || {};
  const API = !!CFG.API_URL;                 // true once the Apps Script URL is set in js/config.js
  const DEFAULT_PW = 'NK@12345';
  const KEY = 'hh-prototype-v1', TOKEN_KEY = 'hh-token', SESS_KEY = 'hh-session', ROUTE_KEY = 'hh-route';
  const clone = o => JSON.parse(JSON.stringify(o));
  const emptyDB = () => ({ colleges: [], homes: [], activities: [], followups: [], mous: [], meetings: [], files: [], updates: [], resources: [], requests: [], messages: [], users: [], logs: [], settings: { monthlyTarget: 4 } });
  function load() {
    if (API) return emptyDB();
    try { const x = localStorage.getItem(KEY); if (x) { const d = JSON.parse(x); ['requests', 'messages', 'meetings', 'files', 'updates'].forEach(k => { if (!d[k]) d[k] = clone(window.SEED[k] || []); }); return d; } } catch (e) { }
    return clone(window.SEED);
  }
  let DB = load();
  function save() { if (API) return; try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }

  /* ---------- API (Google Apps Script) ---------- */
  async function api(action, payload) {
    const res = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action, token: S.token }, payload || {})) });
    const j = await res.json();
    if (!j.ok) {
      if (j.error === 'AUTH') { S.user = null; S.token = ''; try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { } render(); throw new Error('Session expired — please sign in again'); }
      throw new Error(j.error || 'Request failed');
    }
    return j;
  }
  // A refresh that started before a save finished would overwrite the save with stale data, so it is dropped.
  let mutSeq = 0, pending = 0;
  async function refresh() { const seq = mutSeq, tok = S.token; const j = await api('bootstrap'); if (seq !== mutSeq || pending > 0 || !S.token || tok !== S.token) return false; DB = j.data; S.user = j.user; return true; }   // also dropped if the user signed out meanwhile
  // Saves one row to the sheet. Returns false (after reloading) if the server refused it.
  async function sync(table, row, isNew) {
    if (!API) return true;
    mutSeq++; pending++;
    let ok = false, err;
    try { const j = await api('save', { table, row, isNew: !!isNew }); Object.assign(row, j.row); ok = true; } catch (e) { err = e; }
    pending--; mutSeq++;
    if (!ok) { toast(err.message); try { await refresh(); } catch (_) { } render(); }
    return ok;
  }
  const nextId = (arr, p) => p + (arr.reduce((m, x) => Math.max(m, parseInt(String(x.id).slice(p.length)) || 0), 0) + 1);

  /* ---------- roles ---------- */
  const ALL_NAV = ['dashboard', 'colleges', 'homes', 'activities', 'calendar', 'followups', 'requests', 'mous', 'gallery', 'documents', 'reports'];
  const ROLES = {
    college: { label: 'College Coordinator', nav: ['dashboard', 'activities', 'calendar', 'followups', 'requests', 'mous', 'gallery', 'documents', 'reports'] },
    home: { label: 'Welfare Home', nav: ['dashboard', 'activities', 'calendar', 'followups', 'requests', 'mous', 'gallery', 'documents'] },
    district: { label: 'District Administration', nav: ALL_NAV },
    admin: { label: 'Admin / Intern', nav: ALL_NAV.concat('users') },
    superadmin: { label: 'Super Admin', nav: ALL_NAV.concat('users', 'logs') }
  };
  const isStaff = () => ['district', 'admin', 'superadmin'].includes(S.user.role);
  const isAdmin = () => ['admin', 'superadmin'].includes(S.user.role);       // Admin / Intern and Super Admin do the day-to-day work
  const canManageUsers = isAdmin;
  const canManageOrgs = isAdmin;                                             // the District oversees: it views, comments, verifies and raises requests
  const canFollow = () => isAdmin() || S.user.role === 'college';
  const canMeet = () => isStaff();

  const NAV = {
    dashboard: ['Dashboard', 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10'],
    colleges: ['Partner Colleges', 'M3 9l9-5 9 5-9 5-9-5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5'],
    homes: ['Welfare Homes', 'M4 21V10l8-6 8 6v11M9 21v-6h6v6'],
    activities: ['Activities', 'M9 11l3 3 8-8M4 12v7a1 1 0 001 1h14'],
    calendar: ['Calendar', 'M4 7h16v13H4zM4 11h16M8 3v4M16 3v4'],
    followups: ['Follow-ups', 'M12 8v4l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5'],
    requests: ['Requests', 'M21 12a8 8 0 01-11.5 7.2L4 20l1-4.2A8 8 0 1121 12zM8 11h8M8 14h5'],
    mous: ['MoU & Meetings', 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6'],
    gallery: ['Gallery', 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9h.01'],
    documents: ['Documents', 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
    reports: ['Reports', 'M5 20V10M12 20V4M19 20v-7'],
    users: ['Users', 'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8'],
    logs: ['Audit Log', 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4']
  };
  const svg = (d, cls) => `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ''}><path d="${d}"/></svg>`;

  // The DCIP logo is optional: drop assets/dcip-logo.png into the repo and it appears everywhere.
  const LOGO_DCIP = '<img src="assets/dcip-logo.png" alt="DCIP Kozhikode" onerror="this.remove()">';

  /* ---------- state ---------- */
  const S = { user: null, token: '', route: 'dashboard', cal: new Date(new Date().getFullYear(), new Date().getMonth(), 1), f: { q: '', college: '', status: '', wf: '' }, logQ: '', menu: false, reqSel: '', reqTab: '' };

  function log(action, detail) {
    if (API) return;                          // the server writes the audit log itself
    DB.logs.unshift({ t: new Date().toISOString(), user: S.user ? S.user.name : 'System', role: S.user ? S.user.role : '', action, detail: detail || '' });
    save();
  }

  /* ---------- derived values ---------- */
  function derived(a) {
    if (a.status === 'Completed') return 'Completed';
    if (a.status === 'Postponed' || a.status === 'On Hold') return a.status;
    if (a.status === 'Planned') {
      const d = daysTo(a.planned);
      if (d < 0) return 'Delayed';
      if (d <= 14) return 'Upcoming';
    }
    return a.status;
  }
  const TONE = { Completed: 't-green', Ongoing: 't-blue', Planned: 't-grey', Upcoming: 't-violet', Delayed: 't-red', Postponed: 't-amber', 'On Hold': 't-amber', Draft: 't-grey', Submitted: 't-blue', Verified: 't-green', Returned: 't-red', Active: 't-green', Expiring: 't-amber', Expired: 't-red', Held: 't-green', Scheduled: 't-violet', 'To schedule': 't-grey', Cancelled: 't-red', 'Date passed': 't-amber', Approved: 't-green', Pending: 't-amber', Open: 't-amber', 'In progress': 't-blue', Closed: 't-green', Urgent: 't-red', Normal: 't-grey' };
  const chip = t => `<span class="chip ${TONE[t] || 't-grey'}">${esc(t)}</span>`;
  const college = id => DB.colleges.find(c => c.id === id) || { name: '—' };
  const home = id => DB.homes.find(h => h.id === id) || { name: '—' };
  const actById = id => DB.activities.find(a => a.id === id);

  function scopeActs() {
    const u = S.user;
    if (u.role === 'college') return DB.activities.filter(a => a.collegeId === u.collegeId);
    if (u.role === 'home') return DB.activities.filter(a => a.homeId === u.homeId);
    return DB.activities;
  }
  const scopeColleges = () => S.user.role === 'college' ? DB.colleges.filter(c => c.id === S.user.collegeId) : S.user.role === 'home' ? DB.colleges.filter(c => c.homeId === S.user.homeId) : DB.colleges;
  function counts(list) {
    const c = { total: list.length, Completed: 0, Ongoing: 0, Upcoming: 0, Planned: 0, Delayed: 0, Postponed: 0, 'On Hold': 0 };
    list.forEach(a => { c[derived(a)]++; });
    c.pending = c.Ongoing + c.Upcoming + c.Planned + c.Postponed + c['On Hold'];
    c.pct = c.total ? Math.round(c.Completed / c.total * 100) : 0;
    return c;
  }
  const canEditAct = a => isAdmin() || (S.user.role === 'college' && a.collegeId === S.user.collegeId && ['Draft', 'Returned'].includes(a.wf));
  const canAddAct = () => isAdmin() || S.user.role === 'college';
  // Moving the status on (start, complete) stays open to the college even after the details are locked.
  const canQuick = a => a.status !== 'Completed' && (isAdmin() || (S.user.role === 'college' && a.collegeId === S.user.collegeId));

  /* ---------- helpers ---------- */
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
  function download(name, rows) {
    const csv = rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = name; a.click();
  }
  const empty = (t) => `<div class="empty">${esc(t)}</div>`;
  const bar = p => `<div class="bar"><i style="width:${p}%"></i></div>`;
  const kpi = (n, l, tone, icon) => `<div class="card kpi"><div class="ic ${tone}">${svg(icon)}</div><div class="n">${n}</div><div class="l">${l}</div></div>`;

  /* ---------- render root ---------- */
  function render() {
    $('#app').innerHTML = S.user ? shell() : loginView();
    if (S.user) setTimeout(hydrate, 0);
  }
  function shell() {
    const r = ROLES[S.user.role];
    const nOpen = openReqCount(), nPend = isAdmin() ? scopeFiles().filter(f => f.kind === 'photo' && f.status === 'Pending').length : 0;
    const items = r.nav.map(k => `<a data-act="nav" data-r="${k}" class="${S.route === k ? 'active' : ''}">${svg(NAV[k][1])}${NAV[k][0]}${k === 'requests' && nOpen ? `<span class="count">${nOpen}</span>` : ''}${k === 'gallery' && nPend ? `<span class="count">${nPend}</span>` : ''}</a>`).join('');
    const who = S.user.role === 'college' ? college(S.user.collegeId).name : S.user.role === 'home' ? home(S.user.homeId).name : 'District Administration, Kozhikode';
    return `<div class="shell">
      <aside class="sidebar ${S.menu ? 'open' : ''}">
        <div class="brand"><a href="index.html" title="Back to the Happy Hill home page"><img class="logo-img" src="assets/happy-hill-logo.png" alt="Happy Hill"></a></div>
        <nav class="nav">${items}</nav>
        <div class="side-foot">
          <div class="side-logos">${LOGO_DCIP}<img src="assets/district-logo.png" alt="District Administration Kozhikode"></div>
          <span class="small muted">Nammude Kozhikode Initiative<br>DCIP · District Collector’s Internship Programme</span>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <button class="btn menu-btn" data-act="menu" aria-label="Menu">${svg('M4 6h16M4 12h16M4 18h16')}</button>
          <div class="grow"><h1>${NAV[S.route][0]}</h1><div class="muted small">${esc(who)}</div></div>
          <div class="user-chip"><div class="avatar">${esc(S.user.name.split(' ').map(w => w[0]).slice(0, 2).join(''))}</div><div><b>${esc(S.user.name)}</b><span>${r.label}</span></div></div>
          <button class="btn" data-act="changePw">Password</button>
          <button class="btn" data-act="logout">Sign out</button>
        </div>
        ${API ? '' : '<div class="preview-banner"><b>Preview mode.</b> Data is saved only on this device. Connect the Google Sheet to share updates between colleges, homes and the District.</div>'}
        <div id="view">${view()}</div>
      </main>
    </div>`;
  }
  function view() {
    return ({ dashboard, colleges: collegesV, homes: homesV, activities: activitiesV, calendar: calendarV, followups: followupsV, requests: requestsV, mous: mousV, gallery: galleryV, documents: documentsV, reports: reportsV, users: usersV, logs: logsV })[S.route]();
  }
  function go(r) {
    if (!ROLES[S.user.role].nav.includes(r)) r = 'dashboard'; S.route = r; S.menu = false; render(); window.scrollTo(0, 0);
    try { sessionStorage.setItem(ROUTE_KEY, r); } catch (e) { }
    if (API) refresh().then(() => { if (S.route === r && S.user && !document.querySelector('.overlay')) render(); }).catch(() => { });   // pick up other people's changes
  }

  /* ---------- login ---------- */
  function loginView() {
    const demo = [['superadmin@example.org', 'Super Admin', 'superadmin@example.org'], ['admin@example.org', 'Admin / Intern', 'admin@example.org'], ['district@example.org', 'District Administration', 'district@example.org'], ['coordinator1@example.org', 'College Coordinator', 'coordinator1@example.org'], ['home1@example.org', 'Welfare Home', 'home1@example.org']];
    return `<div class="login">
      <section class="login-art">
        <div class="badges"><div class="badge"><img src="assets/district-logo.png" alt=""><span>District Administration<br>Kozhikode</span></div>${LOGO_DCIP ? `<div class="badge">${LOGO_DCIP}<span>District Collector’s<br>Internship Programme</span></div>` : ''}</div>
        <div><h1>Tracking every step of the Happy Hill journey.</h1><p>One shared place for partner colleges, welfare homes and the District Administration to plan activities, follow up and report progress.</p></div>
        <div class="small" style="opacity:.8;position:relative;z-index:1">Nammude Kozhikode Initiative · DCIP internship programme</div>
      </section>
      <section class="login-form">
        <a class="back-home" href="index.html">‹ Back to the Happy Hill home page</a>
        <img class="logo-img logo" src="assets/happy-hill-logo.png" alt="Happy Hill">
        <h2 style="font-size:22px">Sign in</h2>
        <p class="muted" style="margin:4px 0 16px">Use your authorised account to continue.</p>
        <form data-form="login">
          <label>Email</label><input name="email" type="email" placeholder="you@example.org" autocomplete="username">
          <div style="height:10px"></div>
          <label>Password</label><input name="pw" type="password" placeholder="••••••••" autocomplete="current-password">
          <div style="height:14px"></div>
          <button class="btn primary" style="width:100%;justify-content:center;padding:10px">Sign in</button>
        </form>
        ${CFG.SHOW_SAMPLE_ACCOUNTS === false ? '' : `<div class="sample-title"><b>Sample accounts</b><span class="small muted">Tap to fill · password <b>${DEFAULT_PW}</b></span></div>
        <div class="role-grid">${demo.map(d => `<button type="button" class="role-card" data-act="fill" data-email="${d[0]}"><b>${d[1]}</b><span>${d[2]}</span></button>`).join('')}</div>`}
        ${API ? '' : `<div class="note">Preview mode with sample data. The Google Sheets connection is not switched on yet.</div><a class="small" style="margin-top:12px;cursor:pointer" data-act="reset">Reset sample data</a>`}
      </section></div>`;
  }

  /* ---------- dashboard ---------- */
  function dashboard() {
    const acts = scopeActs(), c = counts(acts), t = today(), ym = t.slice(0, 7);
    const cols = scopeColleges();
    const target = cols.reduce((s, x) => s + (+x.target || 0), 0);
    const monthDone = acts.filter(a => a.status === 'Completed' && (a.actual || a.planned).slice(0, 7) === ym).length;
    const donut = [['Completed', '#3a7a38'], ['Ongoing', '#2f6fb2'], ['Upcoming', '#6b4fb3'], ['Planned', '#9aa59c'], ['Delayed', '#c0392b'], ['Postponed', '#b7791f']];
    let acc = 0; const stops = donut.filter(d => c[d[0]]).map(d => { const s = acc; acc += c[d[0]] / (c.total || 1) * 100; return `${d[1]} ${s}% ${acc}%`; }).join(',') || '#e4e8df 0 100%';
    // last 6 months completed
    const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ k: iso(d).slice(0, 7), l: d.toLocaleString('en-GB', { month: 'short' }) }); }
    const mc = months.map(m => acts.filter(a => a.status === 'Completed' && (a.actual || a.planned).slice(0, 7) === m.k).length), mx = Math.max(1, ...mc);
    const upcoming = acts.filter(a => ['Upcoming', 'Planned', 'Ongoing'].includes(derived(a)) && daysTo(a.planned) >= 0).sort((a, b) => a.planned.localeCompare(b.planned)).slice(0, 5);
    const recent = acts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    const verifyQ = acts.filter(a => a.wf === 'Submitted');
    const mouAlerts = DB.mous.filter(m => mouStatus(m) !== 'Active' && (isStaff() || m.collegeId === S.user.collegeId || m.homeId === S.user.homeId));
    const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const hero = `<section class="hero"><div><h2>${greet}, ${esc(S.user.name.split(' ')[0])}</h2>
      <p>${c.Delayed ? `${c.Delayed} activit${c.Delayed > 1 ? 'ies are' : 'y is'} running late.` : 'Everything is on track.'} ${verifyQ.length && isStaff() ? `${verifyQ.length} waiting for verification.` : `${monthDone} of ${target} activities completed this month.`}${S.user.role === 'college' && openReqCount() ? ` ${openReqCount()} request${openReqCount() > 1 ? 's' : ''} to attend.` : ''}</p></div>
      ${canAddAct() ? `<button class="btn" data-act="newAct">${svg('M12 5v14M5 12h14')}New activity</button>` : `<button class="btn" data-act="nav" data-r="activities">View activities</button>`}</section>`;
    return `${hero}<div class="grid g-kpi">
      ${isStaff() ? kpi(DB.colleges.length, 'Partner colleges', 't-green', NAV.colleges[1]) + kpi(DB.homes.length, 'Welfare homes', 't-brown', NAV.homes[1]) : ''}
      ${kpi(c.total, 'Activities planned', 't-blue', NAV.activities[1])}
      ${kpi(c.Completed, 'Completed', 't-green', 'M5 13l4 4L19 7')}
      ${kpi(c.pending, 'Pending', 't-amber', NAV.followups[1])}
      ${kpi(c.Delayed, 'Delayed', 't-red', 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z')}
      ${kpi(openReqCount(), S.user.role === 'college' ? 'Requests to attend' : 'Open requests', 't-violet', NAV.requests[1])}
    </div>
    ${reqBlock()}
    <div class="grid g-2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h2>Status overview</h2><span class="muted small">${c.pct}% completed</span></div>
        <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
          <div class="donut" style="background:conic-gradient(${stops})"><div><span><b>${c.total}</b><span class="muted small">activities</span></span></div></div>
          <div class="legend">${donut.map(d => `<div><i style="background:${d[1]}"></i>${d[0]} <b>${c[d[0]]}</b></div>`).join('')}</div>
        </div></div>
      <div class="card"><div class="card-head"><h2>Monthly target</h2><span class="muted small">${monthDone} of ${target} this month</span></div>
        ${bar(Math.min(100, target ? Math.round(monthDone / target * 100) : 0))}
        <div class="bars" style="margin-top:14px">${months.map((m, i) => `<div><b>${mc[i]}</b><span style="height:${Math.round(mc[i] / mx * 100)}%"></span>${m.l}</div>`).join('')}</div>
        <div class="muted small" style="margin-top:8px">Completed activities, last 6 months. Target per college is set in Partner Colleges.</div></div>
    </div>
    <div class="grid g-2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h2>Upcoming</h2><a class="small" style="cursor:pointer" data-act="nav" data-r="calendar">Open calendar</a></div>
        ${upcoming.length ? upcoming.map(actRow).join('') : empty('Nothing scheduled.')}</div>
      ${updatesCard()}
    </div>
    <div class="grid g-2" style="margin-top:16px">
      ${upMeetingsCard()}
      ${isStaff() ? `<div class="card"><div class="card-head"><h2>Awaiting verification</h2><span class="chip t-blue">${verifyQ.length}</span></div>${verifyQ.length ? verifyQ.slice(0, 5).map(actRow).join('') : empty('All caught up.')}</div>` : (mouAlerts.length ? mouCard(mouAlerts) : '')}
    </div>
    ${isStaff() && mouAlerts.length ? `<div class="grid g-2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h2>MoU alerts</h2></div>${mouAlerts.length ? mouAlerts.map(m => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><div><b>${esc(college(m.collegeId).name)}</b><div class="sub muted small">Expires ${fmt(m.end)}</div></div>${chip(mouStatus(m))}</div>`).join('') : empty('No MoU issues.')}</div></div>` : ''}`;
  }
  function actRow(a) {
    return `<div data-act="openAct" data-id="${a.id}" style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);cursor:pointer">
      <div style="min-width:0"><b>${esc(a.title)}</b><div class="muted small">${esc(college(a.collegeId).name)} · ${esc(home(a.homeId).name)} · ${fmt(a.planned)}</div></div>${chip(derived(a))}</div>`;
  }

  /* ---------- colleges / homes ---------- */
  function collegesV() {
    return `<div class="toolbar">${canManageOrgs() ? `<button class="btn primary" data-act="entity" data-k="college">${svg('M12 5v14M5 12h14')}Add college</button>` : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>College</th><th>Welfare home</th><th>Coordinator</th><th>Planned</th><th>Completed</th><th>Pending</th><th>Delayed</th><th style="width:150px">Progress</th><th></th></tr></thead><tbody>
    ${DB.colleges.map(c => { const k = counts(DB.activities.filter(a => a.collegeId === c.id)); return `<tr class="click" data-act="filterBy" data-k="college" data-id="${c.id}"><td><b>${esc(c.name)}</b><div class="sub">${esc(c.email)}</div></td><td>${esc(home(c.homeId).name)}</td><td>${esc(c.coordinator)}</td><td>${k.total}</td><td>${k.Completed}</td><td>${k.pending}</td><td>${k.Delayed ? chip(k.Delayed + ' delayed') : '0'}</td><td>${bar(k.pct)}<span class="small muted">${k.pct}% · target ${c.target}/mo</span></td><td>${canManageOrgs() ? `<button class="btn sm" data-act="entity" data-k="college" data-id="${c.id}">Edit</button>` : ''}</td></tr>`; }).join('')}
    </tbody></table></div></div>`;
  }
  function homesV() {
    return `<div class="toolbar">${canManageOrgs() ? `<button class="btn primary" data-act="entity" data-k="home">${svg('M12 5v14M5 12h14')}Add welfare home</button>` : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Welfare home</th><th>Head</th><th>Partner college</th><th>Planned</th><th>Completed</th><th>Pending</th><th>Delayed</th><th></th></tr></thead><tbody>
    ${DB.homes.map(h => { const k = counts(DB.activities.filter(a => a.homeId === h.id)); return `<tr class="click" data-act="filterBy" data-k="home" data-id="${h.id}"><td><b>${esc(h.name)}</b><div class="sub">${esc(h.email)}</div></td><td>${esc(h.head)}</td><td>${esc(college(h.collegeId).name)}</td><td>${k.total}</td><td>${k.Completed}</td><td>${k.pending}</td><td>${k.Delayed ? chip(k.Delayed + ' delayed') : '0'}</td><td>${canManageOrgs() ? `<button class="btn sm" data-act="entity" data-k="home" data-id="${h.id}">Edit</button>` : ''}</td></tr>`; }).join('')}
    </tbody></table></div></div>`;
  }
  function entityModal(k, id) {
    const isC = k === 'college', o = id ? (isC ? DB.colleges : DB.homes).find(x => x.id === id) : {};
    const opts = (arr, sel) => arr.map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    openModal(`${id ? 'Edit' : 'Add'} ${isC ? 'partner college' : 'welfare home'}`, `<form data-form="entity" data-k="${k}" data-id="${id || ''}"><div class="form">
      <div class="full"><label>Name</label><input name="name" required value="${esc(o.name || '')}"></div>
      <div><label>${isC ? 'Coordinator' : 'Head / Superintendent'}</label><input name="person" value="${esc(isC ? o.coordinator : o.head || '')}"></div>
      <div><label>Phone</label><input name="phone" value="${esc(o.phone || '')}"></div>
      <div class="full"><label>Email</label><input name="email" type="email" value="${esc(o.email || '')}"></div>
      ${isC ? `<div><label>Welfare home</label><select name="link"><option value="">—</option>${opts(DB.homes, o.homeId)}</select></div><div><label>Monthly target (activities)</label><input name="target" type="number" min="0" value="${o.target == null ? DB.settings.monthlyTarget : o.target}"></div>`
        : `<div class="full"><label>Partner college</label><select name="link"><option value="">—</option>${opts(DB.colleges, o.collegeId)}</select></div>`}
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save</button></div></form>`);
  }

  /* ---------- activities ---------- */
  function filtered() {
    const f = S.f, q = f.q.toLowerCase();
    return scopeActs().filter(a => (!f.college || a.collegeId === f.college || a.homeId === f.college) && (!f.status || derived(a) === f.status) && (!f.wf || a.wf === f.wf) &&
      (!q || (a.title + ' ' + a.desc + ' ' + college(a.collegeId).name + ' ' + home(a.homeId).name).toLowerCase().includes(q))).sort((a, b) => b.planned.localeCompare(a.planned));
  }
  function actTable() {
    const list = filtered();
    if (!list.length) return empty('No activities match these filters.');
    return `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>College / Home</th><th>Planned</th><th>Actual</th><th>Status</th><th>Review</th><th>Follow-up</th><th></th></tr></thead><tbody>
    ${list.map(a => `<tr class="click" data-act="openAct" data-id="${a.id}"><td><b>${esc(a.title)}</b><div class="sub">${esc(a.coordinator)}</div></td><td>${esc(college(a.collegeId).name)}<div class="sub">${esc(home(a.homeId).name)}</div></td><td>${fmt(a.planned)}</td><td>${fmt(a.actual)}</td><td>${chip(derived(a))}</td><td>${chip(a.wf)}${a.homeConfirmed ? '<div class="sub">Home confirmed</div>' : ''}</td><td>${a.followUp ? chip('Needed') : '—'}</td><td class="right">${canQuick(a) ? `<button class="btn sm" data-act="completeAct" data-id="${a.id}">Mark completed</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function activitiesV() {
    const f = S.f, opt = (arr, v) => arr.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('');
    return `<div class="toolbar">
      <input data-filter="q" placeholder="Search activities…" value="${esc(f.q)}">
      ${isStaff() ? `<select data-filter="college"><option value="">All colleges and homes</option>${DB.colleges.map(c => `<option value="${c.id}" ${f.college === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : ''}
      <select data-filter="status"><option value="">All statuses</option>${opt(['Planned', 'Upcoming', 'Ongoing', 'Completed', 'Delayed', 'Postponed', 'On Hold'], f.status)}</select>
      <select data-filter="wf"><option value="">All review states</option>${opt(['Draft', 'Submitted', 'Verified', 'Returned'], f.wf)}</select>
      <span style="flex:1"></span>
      <button class="btn" data-act="exportActs">${svg('M12 4v12M7 11l5 5 5-5M5 20h14')}Export CSV</button>
      ${canAddAct() ? `<button class="btn primary" data-act="newAct">${svg('M12 5v14M5 12h14')}New activity</button>` : ''}
    </div><div class="card" id="act-table">${actTable()}</div>`;
  }
  function actForm(id) {
    const a = id ? actById(id) : { status: 'Planned', coordinator: S.user.role === 'college' ? S.user.name : '', collegeId: S.user.role === 'college' ? S.user.collegeId : '', planned: today() };
    const sOpt = ['Planned', 'Ongoing', 'Completed', 'Postponed', 'On Hold'].map(s => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('');
    const colSel = S.user.role === 'college'
      ? `<input value="${esc(college(a.collegeId).name)}" disabled><input type="hidden" name="collegeId" value="${a.collegeId}">`
      : `<select name="collegeId" required><option value="">Select…</option>${DB.colleges.map(c => `<option value="${c.id}" ${a.collegeId === c.id ? 'selected' : ''}>${esc(c.name)} — ${esc(home(c.homeId).name)}</option>`).join('')}</select>`;
    openModal(id ? 'Edit activity' : 'New activity', `<form data-form="act" data-id="${id || ''}"><div class="form">
      <div class="full"><label>Activity title</label><input name="title" required value="${esc(a.title || '')}"></div>
      <div class="full"><label>Description</label><textarea name="desc" rows="2">${esc(a.desc || '')}</textarea></div>
      <div class="full"><label>Partner college and welfare home</label>${colSel}</div>
      <div><label>Planned date</label><input name="planned" type="date" required value="${a.planned || ''}"></div>
      <div><label>Actual date</label><input name="actual" type="date" value="${a.actual || ''}"></div>
      <div><label>Status</label><select name="status">${sOpt}</select></div>
      <div><label>Responsible coordinator</label><input name="coordinator" value="${esc(a.coordinator || '')}"></div>
      <div class="full"><label>Outcome / observations</label><textarea name="outcome" rows="2">${esc(a.outcome || '')}</textarea></div>
      <div class="full"><label>Related link (optional). Add photos from the activity page.</label><input name="evidence" type="url" placeholder="https://drive.google.com/…" value="${esc(a.evidence || '')}"></div>
      <div class="full"><label>Challenges / remarks</label><textarea name="challenges" rows="2">${esc(a.challenges || '')}</textarea></div>
      <div class="full"><label>Next action required</label><input name="nextAction" value="${esc(a.nextAction || '')}"></div>
      <div class="full"><label class="check"><input type="checkbox" name="followUp" ${a.followUp ? 'checked' : ''}> Follow-up required</label></div>
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button>
      <button class="btn" name="mode" value="save">${S.user.role === 'college' ? 'Save draft' : 'Save'}</button>
      <button class="btn primary" name="mode" value="${S.user.role === 'college' ? 'submit' : 'verify'}">${S.user.role === 'college' ? 'Submit for verification' : 'Save & verify'}</button></div></form>`);
  }
  function actDetail(id) {
    const a = actById(id); if (!a) return;
    const btns = [];
    if (canEditAct(a)) btns.push(`<button class="btn" data-act="editAct" data-id="${id}">Edit</button>`);
    if (S.user.role === 'college' && ['Draft', 'Returned'].includes(a.wf) && a.collegeId === S.user.collegeId) btns.push(`<button class="btn primary" data-act="wf" data-to="Submitted" data-id="${id}">Submit for verification</button>`);
    if (S.user.role === 'home' && a.homeId === S.user.homeId && a.wf === 'Submitted' && !a.homeConfirmed) btns.push(`<button class="btn primary" data-act="homeConfirm" data-id="${id}">Confirm activity was held</button>`);
    if (isStaff() && a.wf === 'Submitted') btns.push(`<button class="btn danger" data-act="wf" data-to="Returned" data-id="${id}">Return for correction</button><button class="btn primary" data-act="wf" data-to="Verified" data-id="${id}">Verify</button>`);
    if (canFollow()) btns.push(`<button class="btn" data-act="addFollow" data-id="${id}">Add follow-up</button>`);
    if (canQuick(a)) { if (derived(a) !== 'Ongoing') btns.unshift(`<button class="btn" data-act="startAct" data-id="${id}">Mark ongoing</button>`); btns.unshift(`<button class="btn primary" data-act="completeAct" data-id="${id}">Mark completed</button>`); }
    const link = a.evidence ? `<a href="${esc(a.evidence)}" target="_blank" rel="noopener">Open link</a>` : '—';
    const myPhotos = scopeFiles().filter(f => f.kind === 'photo' && f.activityId === a.id && ['Approved', 'Pending'].includes(f.status));
    const canPhoto = isAdmin() || (S.user.role === 'college' && a.collegeId === S.user.collegeId);
    openModal(a.title, `<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">${chip(derived(a))}${chip(a.wf)}${a.homeConfirmed ? chip('Home confirmed') : ''}${a.followUp ? chip('Follow-up needed') : ''}</div>
      <dl class="kv"><dt>Description</dt><dd>${esc(a.desc) || '—'}</dd><dt>College</dt><dd>${esc(college(a.collegeId).name)}</dd><dt>Welfare home</dt><dd>${esc(home(a.homeId).name)}</dd>
      <dt>Planned / actual</dt><dd>${fmt(a.planned)} / ${fmt(a.actual)}</dd><dt>Coordinator</dt><dd>${esc(a.coordinator) || '—'}</dd><dt>Outcome</dt><dd>${esc(a.outcome) || '—'}</dd>
      <dt>Related link</dt><dd>${link}</dd><dt>Challenges</dt><dd>${esc(a.challenges) || '—'}</dd><dt>Next action</dt><dd>${esc(a.nextAction) || '—'}</dd><dt>Last updated</dt><dd>${fmt(a.updatedAt)} by ${esc(a.updatedBy)}</dd></dl>
      <h3 style="margin:18px 0 10px">Photos</h3>
      <div class="mini">${myPhotos.map(f => `<figure data-act="openPhoto" data-id="${f.id}"><img data-fid="${f.id}" data-thumb="1" alt="${esc(f.caption || a.title)}">${f.status === 'Pending' ? '<span class="pend">Awaiting approval</span>' : ''}</figure>`).join('') || '<span class="muted small">No photos yet.</span>'}</div>
      ${canPhoto ? `<button class="btn sm" style="margin-top:10px" data-act="addPhotos" data-id="${a.id}">${svg('M12 5v14M5 12h14')}Add photos</button>` : ''}
      <h3 style="margin:18px 0 10px">History</h3><ul class="timeline">${a.history.slice().reverse().map(h => `<li><b>${esc(h.text)}</b><div class="muted small">${fmt(h.t.slice(0, 10))} · ${esc(h.by)}</div></li>`).join('')}</ul>
      <div class="modal-foot">${btns.join('')}</div>`);
  }

  /* ---------- calendar ---------- */
  function calendarV() {
    const y = S.cal.getFullYear(), m = S.cal.getMonth(), first = new Date(y, m, 1), startOff = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const acts = scopeActs(), t = today(); let cells = '';
    for (let i = 0; i < Math.ceil((startOff + days) / 7) * 7; i++) {
      const d = new Date(y, m, 1 - startOff + i), k = iso(d), out = d.getMonth() !== m;
      const evs = acts.filter(a => a.planned === k).map(a => `<button class="ev ${TONE[derived(a)]}" data-act="openAct" data-id="${a.id}" title="${esc(a.title)}">${esc(a.title)}</button>`).join('');
      cells += `<div class="day ${out ? 'out' : ''} ${k === t ? 'today' : ''}"><div class="d">${d.getDate()}</div>${evs}</div>`;
    }
    return `<div class="toolbar"><button class="btn" data-act="calPrev">‹</button><h2 style="min-width:160px;text-align:center">${first.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h2><button class="btn" data-act="calNext">›</button><button class="btn" data-act="calToday">Today</button>
      <span style="flex:1"></span><span class="chip t-green">Completed</span><span class="chip t-violet">Upcoming</span><span class="chip t-red">Delayed</span><span class="chip t-blue">Ongoing</span></div>
      <div class="card"><div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div></div>`;
  }

  /* ---------- follow-ups ---------- */
  function followupsV() {
    const ids = new Set(scopeActs().map(a => a.id));
    const list = DB.followups.filter(f => ids.has(f.activityId)).sort((a, b) => a.done - b.done || a.due.localeCompare(b.due));
    const covered = new Set(DB.followups.filter(f => !f.done).map(f => f.activityId));
    const needs = scopeActs().filter(a => (derived(a) === 'Delayed' || a.followUp) && !covered.has(a.id));
    return `${needs.length ? `<div class="card" style="margin-bottom:16px"><div class="card-head"><h2>Needs a follow-up</h2><span class="chip t-red">${needs.length}</span></div>
      ${needs.map(a => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>${esc(a.title)}</b><div class="muted small">${esc(college(a.collegeId).name)} · ${chip(derived(a))}</div></div>${canFollow() ? `<button class="btn sm" data-act="addFollow" data-id="${a.id}">Add follow-up</button>` : ''}</div>`).join('')}</div>` : ''}
    <div class="card"><div class="card-head"><h2>Follow-up actions</h2></div>${list.length ? `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>Reason for delay</th><th>Action</th><th>Responsible</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(f => { const a = actById(f.activityId) || {}, od = !f.done && daysTo(f.due) < 0; return `<tr><td><b>${esc(a.title)}</b><div class="sub">${esc(college(a.collegeId).name)}</div></td><td>${esc(f.reason)}</td><td>${esc(f.action)}</td><td>${esc(f.owner)}</td><td>${fmt(f.due)}</td><td>${chip(f.done ? 'Completed' : od ? 'Delayed' : 'Ongoing')}</td><td>${!f.done && canFollow() ? `<button class="btn sm" data-act="doneFollow" data-id="${f.id}">Mark done</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : empty('No follow-ups recorded.')}</div>`;
  }
  function followModal(actId) {
    const a = actById(actId);
    openModal('Add follow-up', `<p class="muted" style="margin-top:0">${esc(a.title)} · ${esc(college(a.collegeId).name)}</p><form data-form="follow" data-id="${actId}"><div class="form">
      <div class="full"><label>Reason for delay / need</label><input name="reason" required></div><div class="full"><label>Follow-up action</label><input name="action" required></div>
      <div><label>Responsible person</label><input name="owner" value="${esc(a.coordinator)}"></div><div><label>Follow-up date</label><input name="due" type="date" required value="${iso(new Date(Date.now() + 7 * DAY))}"></div>
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save follow-up</button></div></form>`);
  }

  /* ---------- MoU & meetings ---------- */
  const mouStatus = m => { const d = daysTo(m.end); return d < 0 ? 'Expired' : d <= 60 ? 'Expiring' : 'Active'; };
  const MEET_TYPES = ['Quarterly review', 'Monthly assessment', 'Other'];
  const idsOf = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const meetById = id => (DB.meetings || []).find(m => m.id === id);
  const fmtTime = s => { if (!s) return ''; const m = /^(\d{1,2}):(\d{2})/.exec(s); if (!m) return s; let h = +m[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + m[2] + ' ' + ap; };
  const addMonths = (d, k) => { const [y, mo, dd] = d.split('-').map(Number), x = new Date(y, mo - 1 + k, 1), last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(dd, last)); return iso(x); };
  function scopeMeetings() {
    const u = S.user, all = DB.meetings || [];
    if (u.role === 'college') return all.filter(m => idsOf(m.collegeIds).includes(u.collegeId));
    if (u.role === 'home') return all.filter(m => idsOf(m.homeIds).includes(u.homeId));
    return all;
  }
  const meetKey = m => m.date + (m.time || '');
  const upcomingMeetings = n => scopeMeetings().filter(m => m.status === 'Scheduled' && m.date >= today()).sort((a, b) => meetKey(a).localeCompare(meetKey(b))).slice(0, n);
  const attendeeText = m => { const c = idsOf(m.collegeIds).length, h = idsOf(m.homeIds).length; return `${c} college${c === 1 ? '' : 's'} · ${h} home${h === 1 ? '' : 's'}`; };
  const meetStatusChip = m => chip(m.status === 'Scheduled' && m.date < today() ? 'Date passed' : m.status);
  function meetRow(m) {
    const n = daysTo(m.date);
    return `<div data-act="openMeeting" data-id="${m.id}" style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer">
      <div style="min-width:0"><b>${esc(m.title)}</b><div class="muted small">${fmt(m.date)}${m.time ? ' · ' + fmtTime(m.time) : ''}${m.venue ? ' · ' + esc(m.venue) : ''}</div></div>
      <div style="display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end">${m.status === 'Scheduled' && n >= 0 ? chip(n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days').replace('t-grey', 't-violet') : meetStatusChip(m)}</div></div>`;
  }
  function upMeetingsCard() {
    const list = upcomingMeetings(3);
    return `<div class="card"><div class="card-head"><h2>Upcoming meetings</h2><a class="small" style="cursor:pointer" data-act="nav" data-r="mous">All meetings</a></div>${list.length ? list.map(meetRow).join('') : empty('No meetings scheduled.')}</div>`;
  }
  function mouCard(list) {
    return `<div class="card"><div class="card-head"><h2>MoU alerts</h2></div>${list.map(m => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><div><b>${esc(college(m.collegeId).name)}</b><div class="sub muted small">Expires ${fmt(m.end)}</div></div>${chip(mouStatus(m))}</div>`).join('')}</div>`;
  }
  function mousV() {
    const cols = scopeColleges().map(c => c.id), mous = DB.mous.filter(m => cols.includes(m.collegeId));
    const all = scopeMeetings().slice().sort((a, b) => meetKey(a).localeCompare(meetKey(b))), td = today();
    const up = all.filter(m => m.status === 'Scheduled' && m.date >= td), rest = all.filter(m => !(m.status === 'Scheduled' && m.date >= td)).reverse(), ordered = up.concat(rest);
    const repCount = id => scopeFiles().filter(f => f.kind === 'report' && f.meetingId === id).length;
    return `<div class="card"><div class="card-head"><h2>Meetings</h2>${canMeet() ? `<button class="btn primary sm" data-act="addMeeting">${svg('M12 5v14M5 12h14')}Schedule meeting</button>` : ''}</div>
      ${ordered.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>Meeting</th><th>Attending</th><th>Status</th><th>Reports</th></tr></thead><tbody>${ordered.map(m => `<tr class="click" data-act="openMeeting" data-id="${m.id}"><td><b>${fmt(m.date)}</b><div class="sub">${esc(fmtTime(m.time))}</div></td><td><b>${esc(m.title)}</b><div class="sub">${esc(m.type)}${m.venue ? ' · ' + esc(m.venue) : ''}</div></td><td>${attendeeText(m)}</td><td>${meetStatusChip(m)}</td><td>${repCount(m.id) || (m.minutes ? 'Minutes' : '—')}</td></tr>`).join('')}</tbody></table></div>` : empty('No meetings scheduled yet.')}</div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h2>MoU register</h2></div><div class="table-wrap"><table><thead><tr><th>College</th><th>Welfare home</th><th>Start</th><th>Expiry</th><th>Status</th><th>Renewal</th><th></th></tr></thead><tbody>
      ${mous.map(m => `<tr><td><b>${esc(college(m.collegeId).name)}</b></td><td>${esc(home(m.homeId).name)}</td><td>${fmt(m.start)}</td><td>${fmt(m.end)}<div class="sub">${daysTo(m.end) < 0 ? Math.abs(daysTo(m.end)) + ' days ago' : 'in ' + daysTo(m.end) + ' days'}</div></td><td>${chip(mouStatus(m))}</td><td>${esc(m.renewal) || '—'}${(m.history || []).length ? `<div class="sub">Renewed ${(m.history || []).length}×</div>` : ''}</td><td class="right">${isAdmin() ? `<button class="btn sm primary" data-act="renewMou" data-id="${m.id}">Renew</button> <button class="btn sm" data-act="editMou" data-id="${m.id}">Edit dates</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="7">${empty('No MoU records.')}</td></tr>`}</tbody></table></div></div>`;
  }
  function mouModal(id) {
    const m = DB.mous.find(x => x.id === id);
    openModal('Edit MoU dates — ' + college(m.collegeId).name, `<form data-form="mou" data-id="${id}"><div class="form"><div><label>Start date</label><input name="start" type="date" value="${m.start}"></div><div><label>Expiry date</label><input name="end" type="date" value="${m.end}"></div>
      <div class="full"><label>Renewal status / note</label><input name="renewal" value="${esc(m.renewal)}"></div></div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save</button></div></form>`);
  }
  function renewModal(id) {
    const m = DB.mous.find(x => x.id === id), ns = m.end >= today() ? m.end : today(), ne = addMonths(ns, 12);
    openModal('Renew MoU — ' + college(m.collegeId).name, `<p class="muted" style="margin-top:0">Current term: ${fmt(m.start)} to ${fmt(m.end)} (${mouStatus(m).toLowerCase()}). The old term is kept in the history.</p><form data-form="renew" data-id="${id}"><div class="form">
      <div><label>New term starts</label><input name="start" type="date" required value="${ns}"></div><div><label>New term ends</label><input name="end" type="date" required value="${ne}"></div>
      <div class="full"><label>Note (optional)</label><input name="renewal" placeholder="e.g. Renewed after the review meeting"></div></div>
      <div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Renew MoU</button></div></form>`);
  }
  function meetingForm(id) {
    const m = id ? meetById(id) : { title: '', type: 'Quarterly review', date: today(), time: '15:00', venue: 'Nammude Kozhikode Mission Room', agenda: '', collegeIds: '', homeIds: '', minutes: '', actions: '' };
    const cs = idsOf(m.collegeIds), hs = idsOf(m.homeIds);
    openModal(id ? 'Edit meeting' : 'Schedule a meeting', `<form data-form="meeting" data-id="${id || ''}"><div class="form">
      <div><label>Type</label><select name="type">${MEET_TYPES.map(x => `<option ${m.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div><label>Title (optional)</label><input name="title" maxlength="120" value="${esc(m.title)}" placeholder="e.g. Quarter 2 review"></div>
      <div><label>Date</label><input name="date" type="date" required value="${esc(m.date)}"></div>
      <div><label>Time</label><input name="time" type="time" value="${esc(m.time)}"></div>
      <div class="full"><label>Venue</label><input name="venue" maxlength="160" value="${esc(m.venue)}"></div>
      <div class="full"><label>Agenda (optional)</label><textarea name="agenda" rows="2">${esc(m.agenda)}</textarea></div>
      <div class="full"><label>Who should attend</label>
        <label class="check selall"><input type="checkbox" data-selall> All partner colleges and welfare homes</label>
        <div class="attend"><div><b class="small">Partner colleges</b>${DB.colleges.map(c => `<label class="check"><input type="checkbox" name="col" value="${c.id}" ${cs.includes(c.id) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}</div>
        <div><b class="small">Welfare homes</b>${DB.homes.map(h => `<label class="check"><input type="checkbox" name="hom" value="${h.id}" ${hs.includes(h.id) ? 'checked' : ''}> ${esc(h.name)}</label>`).join('')}</div></div></div>
      ${id ? '' : `<div><label>Repeat</label><select name="repeat"><option value="0">Does not repeat</option><option value="1">Every month on this date</option></select></div><div><label>How many months</label><input name="months" type="number" min="2" max="12" value="6"></div>`}
      ${id && isAdmin() ? `<div class="full"><label>Minutes</label><textarea name="minutes" rows="3">${esc(m.minutes)}</textarea></div><div class="full"><label>Action points</label><textarea name="actions" rows="2">${esc(m.actions)}</textarea></div>` : ''}
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">${id ? 'Save changes' : 'Schedule'}</button></div></form>`);
  }
  function meetingModal(id) {
    const m = meetById(id); if (!m) return;
    const reps = scopeFiles().filter(f => f.kind === 'report' && f.meetingId === id);
    const cn = idsOf(m.collegeIds).map(x => esc(college(x).name)), hn = idsOf(m.homeIds).map(x => esc(home(x).name));
    const btns = [];
    if (canMeet()) btns.push(`<button class="btn" data-act="editMeeting" data-id="${id}">Edit</button>`);
    if (canMeet() && m.status === 'Scheduled') btns.push(`<button class="btn danger" data-act="meetStatus" data-id="${id}" data-to="Cancelled">Cancel meeting</button><button class="btn primary" data-act="meetStatus" data-id="${id}" data-to="Held">Mark as held</button>`);
    openModal(m.title, `<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">${meetStatusChip(m)}<span class="chip t-brown">${esc(m.type)}</span></div>
      <dl class="kv"><dt>When</dt><dd>${fmt(m.date)}${m.time ? ' at ' + fmtTime(m.time) : ''}</dd><dt>Venue</dt><dd>${esc(m.venue) || '—'}</dd><dt>Agenda</dt><dd>${esc(m.agenda) || '—'}</dd>
      <dt>Partner colleges</dt><dd>${cn.join(', ') || '—'}</dd><dt>Welfare homes</dt><dd>${hn.join(', ') || '—'}</dd>
      <dt>Minutes</dt><dd>${esc(m.minutes).replace(/\n/g, '<br>') || '—'}</dd><dt>Action points</dt><dd>${esc(m.actions).replace(/\n/g, '<br>') || '—'}</dd></dl>
      <h3 style="margin:18px 0 8px">Reports</h3>
      ${reps.map(f => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(f.name)}<span class="muted small"> · ${fmt(String(f.uploadedAt).slice(0, 10))}</span></span><button class="btn sm" data-act="dl" data-id="${f.id}">Download</button></div>`).join('') || '<span class="muted small">No reports yet.</span>'}
      ${isAdmin() ? `<label class="btn sm" style="margin-top:10px;cursor:pointer">${svg('M12 5v14M5 12h14')}Add minutes or report<input type="file" hidden data-reportfor="${id}" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"></label>` : ''}
      <div class="modal-foot">${btns.join('')}</div>`);
  }

  /* ---------- updates feed ---------- */
  const UP_ICON = { activity: 'M5 13l4 4L19 7', meeting: NAV.calendar[1], mou: NAV.mous[1], request: NAV.requests[1], gallery: NAV.gallery[1] };
  const UP_TONE = { activity: 't-green', meeting: 't-violet', mou: 't-brown', request: 't-amber', gallery: 't-blue' };
  function addUpdateLocal(type, text, collegeIds, homeIds) {
    if (API) return;                                                    // the server writes updates itself
    DB.updates.unshift({ id: nextId(DB.updates, 'P'), at: new Date().toISOString(), type, text, collegeIds: collegeIds || '', homeIds: homeIds || '', actor: S.user.name });
  }
  function myUpdates() {
    const u = S.user, all = (DB.updates || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (u.role === 'college') return all.filter(x => idsOf(x.collegeIds).includes(u.collegeId));
    if (u.role === 'home') return all.filter(x => idsOf(x.homeIds).includes(u.homeId));
    return all;
  }
  function updatesCard() {
    const list = myUpdates().slice(0, 7);
    return `<div class="card"><div class="card-head"><h2>Recent updates</h2></div>${list.length ? list.map(u => `<div class="upd"><span class="uic ${UP_TONE[u.type] || 't-green'}">${svg(UP_ICON[u.type] || UP_ICON.activity)}</span><div><b>${esc(u.text)}</b><div class="muted small">${ago(u.at)}${u.actor ? ' · ' + esc(u.actor) : ''}</div></div></div>`).join('') : empty('No updates yet.')}</div>`;
  }

  /* ---------- gallery and reports (files live in the Drive folder) ---------- */
  const FILES = new Map();                       // preview mode only: id -> { full, thumb } kept in memory
  const urlCache = new Map();
  const fileById = id => (DB.files || []).find(f => f.id === id);
  function scopeFiles() {
    const u = S.user, all = DB.files || [];
    if (!u || ['district', 'admin', 'superadmin'].includes(u.role)) return all;
    if (u.role === 'college') return all.filter(f => f.kind === 'photo' ? f.collegeId === u.collegeId : (meetById(f.meetingId) && idsOf(meetById(f.meetingId).collegeIds).includes(u.collegeId)));
    return all.filter(f => f.kind === 'photo' ? f.status === 'Approved' && f.homeId === u.homeId : (meetById(f.meetingId) && idsOf(meetById(f.meetingId).homeIds).includes(u.homeId)));
  }
  function fileUrl(id, thumb) {
    const key = id + (thumb ? ':t' : '');
    if (urlCache.has(key)) return urlCache.get(key);
    let p;
    if (!API) { const f = FILES.get(id); p = Promise.resolve(f ? (thumb ? f.thumb : f.full) : ''); }
    else p = api('fileData', { id, thumb: !!thumb }).then(j => 'data:' + j.mime + ';base64,' + j.data).catch(() => '');
    urlCache.set(key, p); return p;
  }
  let hydrating = 0; const hq = [];
  function hydrate(root) {
    (root || document).querySelectorAll('img[data-fid]:not([src])').forEach(img => { if (!hq.includes(img)) hq.push(img); });
    pump();
  }
  function pump() {
    while (hydrating < 4 && hq.length) {
      const img = hq.shift(); if (!img.isConnected || img.getAttribute('src')) continue;
      hydrating++;
      fileUrl(img.dataset.fid, img.dataset.thumb === '1').then(u => { if (u) img.src = u; else img.classList.add('missing'); }).finally(() => { hydrating--; pump(); });
    }
  }
  const b64 = u => u.slice(u.indexOf(',') + 1);
  const readFile = (file, asText) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  function shrink(im, max, q) {
    const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', q);
  }
  async function guard(fn) {                    // keeps a background refresh from overwriting an upload in progress
    if (!API) return fn();
    mutSeq++; pending++;
    try { return await fn(); } finally { pending--; mutSeq++; }
  }
  async function uploadPhotos(files, activityId) {
    const a = actById(activityId); let ok = 0, n = 0;
    for (const file of files) {
      n++; toast('Uploading photo ' + n + ' of ' + files.length + '…');
      try {
        const im = await loadImg(await readFile(file)), full = shrink(im, 1600, .82), thumb = shrink(im, 360, .75), name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        let row;
        if (API) row = (await guard(() => api('upload', { kind: 'photo', activityId, name, mime: 'image/jpeg', data: b64(full), thumb: b64(thumb), consent: true }))).file;
        else row = { id: nextId(DB.files, 'X'), kind: 'photo', activityId, meetingId: '', collegeId: a.collegeId, homeId: a.homeId, name, mime: 'image/jpeg', size: 0, caption: '', consent: true, status: isAdmin() ? 'Approved' : 'Pending', uploadedBy: S.user.name, uploadedAt: new Date().toISOString(), approvedBy: isAdmin() ? S.user.name : '' };
        FILES.set(row.id, { full, thumb }); urlCache.set(row.id, Promise.resolve(full)); urlCache.set(row.id + ':t', Promise.resolve(thumb));
        DB.files.push(row); if (!API) { log('Uploaded photo', row.id + ' ' + name); save(); }
        ok++;
      } catch (e) { toast(e.message || 'Upload failed'); }
    }
    return ok;
  }
  const MIME_BY_EXT = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', txt: 'text/plain', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  async function uploadReport(file, meetingId) {
    if (file.size > 5 * 1024 * 1024) return toast('That file is over 5 MB');
    const ext = (file.name.split('.').pop() || '').toLowerCase(), mime = file.type || MIME_BY_EXT[ext] || '';
    toast('Uploading…');
    try {
      const dataUrl = await readFile(file); let row;
      if (API) row = (await guard(() => api('upload', { kind: 'report', meetingId, name: file.name, mime, data: b64(dataUrl) }))).file;
      else { row = { id: nextId(DB.files, 'X'), kind: 'report', activityId: '', meetingId, collegeId: '', homeId: '', name: file.name, mime, size: file.size, caption: '', consent: false, status: 'Approved', uploadedBy: S.user.name, uploadedAt: new Date().toISOString(), approvedBy: S.user.name }; log('Uploaded report', row.id + ' ' + file.name); }
      FILES.set(row.id, { full: dataUrl, thumb: dataUrl }); urlCache.set(row.id, Promise.resolve(dataUrl));
      DB.files.push(row); save(); meetingModal(meetingId); toast('Report added');
    } catch (e) { toast(e.message || 'Upload failed'); }
  }
  async function downloadFile(id) {
    const f = fileById(id); toast('Preparing the file…');
    const u = await fileUrl(id, false); if (!u) return toast('This file is available once the portal is connected to the sheet');
    const a = document.createElement('a'); a.href = u; a.download = f ? f.name : 'file'; a.click();
  }
  async function setFileStatus(id, status) {
    const f = fileById(id);
    try { if (API) await guard(() => api('fileStatus', { id, status })); } catch (e) { toast(e.message); return false; }
    f.status = status; f.approvedBy = S.user.name;
    if (!API) { log(status + ' photo', f.id); if (status === 'Approved') addUpdateLocal('gallery', 'New photo in the Gallery', f.collegeId, f.homeId); save(); }
    return true;
  }
  async function removeFile(id) {
    try { if (API) await guard(() => api('fileDelete', { id })); } catch (e) { toast(e.message); return false; }
    const i = DB.files.findIndex(x => x.id === id); if (i >= 0) DB.files.splice(i, 1);
    if (!API) { log('Deleted file', id); save(); }
    return true;
  }
  function galleryV() {
    const all = scopeFiles().filter(f => f.kind === 'photo' && ['Approved', 'Pending'].includes(f.status));
    const pend = all.filter(f => f.status === 'Pending'), appr = all.filter(f => f.status === 'Approved');
    if (S.gTab === 'pending' && !pend.length) S.gTab = 'approved';
    const list = (S.gTab === 'pending' ? pend : appr).slice().sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
    const q = S.gCollege ? list.filter(f => f.collegeId === S.gCollege || f.homeId === S.gCollege) : list;
    const tab = (k, l, n) => `<button class="tab ${(S.gTab || 'approved') === k ? 'on' : ''}" data-act="gTab" data-k="${k}">${l} <span>${n}</span></button>`;
    return `<div class="toolbar"><div class="tabs">${tab('approved', 'Gallery', appr.length)}${pend.length ? tab('pending', isAdmin() ? 'Awaiting approval' : 'My pending', pend.length) : ''}</div>
      ${isStaff() ? `<select data-gcol><option value="">All colleges and homes</option>${DB.colleges.map(c => `<option value="${c.id}" ${S.gCollege === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : ''}
      <span style="flex:1"></span>${isAdmin() || S.user.role === 'college' ? `<button class="btn primary" data-act="addPhotos">${svg('M12 5v14M5 12h14')}Add photos</button>` : ''}</div>
      ${q.length ? `<div class="gal">${q.map(f => { const a = actById(f.activityId); return `<figure class="gcard" data-act="openPhoto" data-id="${f.id}"><img data-fid="${f.id}" data-thumb="1" alt="${esc(a ? a.title : 'Photo')}"><figcaption><b>${esc(a ? a.title : 'Activity photo')}</b><span>${esc(college(f.collegeId).name)} · ${fmt(String(f.uploadedAt).slice(0, 10))}</span>${f.status === 'Pending' ? '<em>Awaiting approval</em>' : ''}</figcaption></figure>`; }).join('')}</div>`
        : `<div class="card">${empty(S.gTab === 'pending' ? 'Nothing is waiting for approval.' : 'No photos yet. Add photos from an activity or with the button above. Only photos with consent and no identifiable residents, please.')}</div>`}`;
  }
  function photoViewer(id) {
    const f = fileById(id); if (!f) return; const a = actById(f.activityId);
    const btns = [`<button class="btn" data-act="dl" data-id="${id}">Download</button>`];
    if (isAdmin() && f.status === 'Pending') btns.push(`<button class="btn danger" data-act="rejectPhoto" data-id="${id}">Reject</button><button class="btn primary" data-act="approvePhoto" data-id="${id}">Approve</button>`);
    if (isAdmin() || (f.status === 'Pending' && f.uploadedBy === S.user.name)) btns.push(`<button class="btn danger" data-act="delPhoto" data-id="${id}">Delete</button>`);
    openModal(a ? a.title : 'Photo', `<div class="viewer"><img data-fid="${id}" alt="${esc(a ? a.title : 'Photo')}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${chip(f.status === 'Pending' ? 'Pending' : 'Approved')}</div>
      <dl class="kv"><dt>College</dt><dd>${esc(college(f.collegeId).name)}</dd><dt>Welfare home</dt><dd>${esc(home(f.homeId).name)}</dd><dt>Added</dt><dd>${fmt(String(f.uploadedAt).slice(0, 10))} by ${esc(f.uploadedBy)}</dd></dl>
      <div class="modal-foot">${btns.join('')}</div>`);
  }
  function photoModal(activityId) {
    const acts = scopeActs().filter(a => isAdmin() || a.collegeId === S.user.collegeId).slice().sort((a, b) => b.planned.localeCompare(a.planned)).slice(0, 80);
    openModal('Add photos', `<form data-form="photos"><div class="form">
      <div class="full"><label>Activity</label><select name="activityId" required>${acts.map(a => `<option value="${a.id}" ${a.id === activityId ? 'selected' : ''}>${esc(a.title)} · ${fmt(a.planned)}</option>`).join('')}</select></div>
      <div class="full"><label>Photos</label><input type="file" name="photos" accept="image/*" multiple required></div>
      <div class="full"><label class="check"><input type="checkbox" name="consent" required> These photos were taken with consent and show no identifiable residents</label></div></div>
      <p class="muted small">${isAdmin() ? 'Admin uploads appear in the Gallery straight away.' : 'An Admin approves each photo before it appears for everyone.'} Photos are resized and saved in the project\u2019s private Drive folder.</p>
      <div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Upload</button></div></form>`);
  }
  function completeForm(id) {
    const a = actById(id);
    openModal('Mark as completed', `<p class="muted" style="margin-top:0">${esc(a.title)}</p><form data-form="complete" data-id="${id}"><div class="form">
      <div><label>Date it was held</label><input name="actual" type="date" required value="${today()}"></div><div></div>
      <div class="full"><label>Outcome / observations</label><textarea name="outcome" rows="3" required>${esc(a.outcome || '')}</textarea></div>
      <div class="full"><label>Photos (optional)</label><input type="file" name="photos" accept="image/*" multiple></div>
      <div class="full"><label class="check"><input type="checkbox" name="consent"> The photos have consent and show no identifiable residents</label></div></div>
      ${S.user.role === 'college' ? '<p class="muted small">This goes to the Admin for verification. If it was already verified, it will be verified again.</p>' : ''}
      <div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Mark completed</button></div></form>`);
  }

  /* ---------- documents ---------- */
  function documentsV() {
    const reps = scopeFiles().filter(f => f.kind === 'report').sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
    return `<div class="grid g-2"><div class="card"><div class="card-head"><h2>Templates and guidelines</h2></div>
      ${DB.resources.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>${esc(d.title)}</b></div><span class="chip t-brown">${esc(d.kind)}</span></div>`).join('')}
      <p class="muted small" style="margin-bottom:0">Links open the approved shared folder once connected.</p></div>
      <div class="card"><div class="card-head"><h2>Meeting reports</h2></div>${reps.length ? reps.map(f => { const m = meetById(f.meetingId); return `<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>${esc(f.name)}</b><div class="muted small">${m ? esc(m.title) + ' · ' + fmt(m.date) : ''}</div></div><button class="btn sm" data-act="dl" data-id="${f.id}">Download</button></div>`; }).join('') : empty('Minutes and reports added to a meeting appear here.')}</div></div>`;
  }

  /* ---------- reports ---------- */
  function reportsV() {
    const acts = scopeActs(), rowFor = (name, sub, list) => { const k = counts(list); return `<tr><td><b>${esc(name)}</b><div class="sub">${esc(sub)}</div></td><td>${k.total}</td><td>${k.Completed}</td><td>${k.pending}</td><td>${k.Delayed}</td><td style="width:140px">${bar(k.pct)}<span class="small muted">${k.pct}%</span></td></tr>`; };
    const head = '<thead><tr><th>Name</th><th>Planned</th><th>Completed</th><th>Pending</th><th>Delayed</th><th>Completion</th></tr></thead>';
    const cols = scopeColleges(), t = counts(acts);
    return `<div class="toolbar"><button class="btn" data-act="exportActs">${svg('M12 4v12M7 11l5 5 5-5M5 20h14')}Export activities (CSV)</button><button class="btn" data-act="print">Print report</button></div>
    <div class="card"><div class="card-head"><h2>Overall progress</h2><span class="muted small">${t.Completed} of ${t.total} completed · ${t.Delayed} delayed</span></div>${bar(t.pct)}</div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h2>College-wise</h2></div><div class="table-wrap"><table>${head}<tbody>${cols.map(c => rowFor(c.name, home(c.homeId).name, acts.filter(a => a.collegeId === c.id))).join('')}</tbody></table></div></div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h2>Welfare-home-wise</h2></div><div class="table-wrap"><table>${head}<tbody>${cols.map(c => rowFor(home(c.homeId).name, college(c.id).name, acts.filter(a => a.homeId === c.homeId))).join('')}</tbody></table></div></div>`;
  }

  /* ---------- users & logs ---------- */
  function usersV() {
    return `<div class="toolbar"><button class="btn primary" data-act="addUser">${svg('M12 5v14M5 12h14')}Add user</button></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Linked to</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.users.map(u => `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${ROLES[u.role].label}</td><td>${u.collegeId ? esc(college(u.collegeId).name) : u.homeId ? esc(home(u.homeId).name) : '—'}</td><td>${chip(u.active ? 'Active' : 'Expired').replace('Expired', 'Disabled')}</td><td>${u.role === 'superadmin' && S.user.role !== 'superadmin' ? '' : `<button class="btn sm" data-act="toggleUser" data-id="${u.id}">${u.active ? 'Disable' : 'Enable'}</button> <button class="btn sm" data-act="resetPw" data-id="${u.id}">Reset password</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function userModal() {
    const roles = Object.keys(ROLES).filter(r => r !== 'superadmin' || S.user.role === 'superadmin' && false);
    openModal('Add user', `<form data-form="user"><div class="form"><div><label>Name</label><input name="name" required></div><div><label>Email</label><input name="email" type="email" required></div>
      <div class="full"><label>Role</label><select name="role" data-role-pick>${roles.map(r => `<option value="${r}">${ROLES[r].label}</option>`).join('')}</select></div>
      <div class="full"><label>College (for College Coordinator) / Welfare home (for Welfare Home)</label><select name="link"><option value="">—</option>${DB.colleges.map(c => `<option value="c:${c.id}">${esc(c.name)}</option>`).join('')}${DB.homes.map(h => `<option value="h:${h.id}">${esc(h.name)}</option>`).join('')}</select></div>
      </div><p class="muted small">Passwords are set when sign-in goes live in the next phase.</p><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Add user</button></div></form>`);
  }
  function logsV() {
    const q = S.logQ.toLowerCase(), list = DB.logs.filter(l => !q || (l.user + l.action + l.detail + l.role).toLowerCase().includes(q));
    return `<div class="toolbar"><input data-logq placeholder="Search the log…" value="${esc(S.logQ)}"><span style="flex:1"></span><button class="btn" data-act="exportLogs">${svg('M12 4v12M7 11l5 5 5-5M5 20h14')}Export CSV</button></div>
    <div class="card" id="log-table">${logTable(list)}</div><p class="muted small">Only the Super Admin can see this log. It records sign-ins and every change to activities, users and records.</p>`;
  }
  const logTable = list => list.length ? `<div class="table-wrap"><table><thead><tr><th>When</th><th>User</th><th>Role</th><th>Action</th><th>Detail</th></tr></thead><tbody>${list.slice(0, 300).map(l => `<tr><td class="small">${fmtT(l.t)}</td><td>${esc(l.user)}</td><td>${l.role ? ROLES[l.role].label : '—'}</td><td><b>${esc(l.action)}</b></td><td>${esc(l.detail)}</td></tr>`).join('')}</tbody></table></div>` : empty('No log entries.');

  /* ---------- requests: structured chat between homes, colleges and the District ---------- */
  const REQ_TYPES = {
    Material: { label: 'Material needed', hint: 'Item and quantity', ph: 'e.g. 200 envelopes and 1 ream of paper' },
    Session: { label: 'Session or training', hint: 'Topic and resource person', ph: 'e.g. Counselling session, resource person if known' },
    Intervention: { label: 'Intervention required', hint: 'Who needs to act', ph: 'e.g. Social Justice Department, maintenance team' },
    Attention: { label: 'Seeking attention', hint: 'Matter needing attention', ph: 'e.g. Water supply in the activity room' },
    Other: { label: 'Other', hint: 'Specifics', ph: '' }
  };
  const ago = t => { const m = Math.round((Date.now() - new Date(t)) / 6e4); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; const d = Math.round(h / 24); return d < 30 ? d + ' d ago' : fmt(String(t).slice(0, 10)); };
  const reqById = id => (DB.requests || []).find(r => r.id === id);
  const msgsFor = id => (DB.messages || []).filter(m => m.requestId === id).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  function scopeReqs() {
    const u = S.user, all = DB.requests || [];
    if (u.role === 'college') return all.filter(r => r.collegeId === u.collegeId);
    if (u.role === 'home') return all.filter(r => r.homeId === u.homeId);
    return all;
  }
  const isOpenReq = r => r.status !== 'Closed';
  const reqSort = (a, b) => (a.status === 'Closed') - (b.status === 'Closed') || (b.priority === 'Urgent') - (a.priority === 'Urgent') || String(b.updatedAt).localeCompare(String(a.updatedAt));
  const openReqCount = () => scopeReqs().filter(isOpenReq).length;
  // Colleges are the providers: they attend the requests their welfare home (or the District) raises, they do not raise any.
  const canRaiseReq = () => S.user.role !== 'college';
  const canWorkReq = r => isAdmin() || (S.user.role === 'college' && r.collegeId === S.user.collegeId);
  const canCloseReq = r => canWorkReq(r) || (S.user.role === 'home' && r.homeId === S.user.homeId && r.raisedRole === 'home');
  const inTab = (r, tab) => tab === 'all' || (tab === 'Closed' ? r.status === 'Closed' : tab === 'active' ? r.status !== 'Closed' : r.status === tab);

  function reqRow(r) {
    const t = REQ_TYPES[r.type] || REQ_TYPES.Other;
    return `<div data-act="reqOpen" data-id="${r.id}" style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer">
      <div style="min-width:0"><b>${esc(r.title)}</b><div class="muted small">${esc(t.label)} · ${esc(college(r.collegeId).name)} ↔ ${esc(home(r.homeId).name)} · ${ago(r.updatedAt)}</div></div>
      <div style="display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end">${r.priority === 'Urgent' && r.status !== 'Closed' ? chip('Urgent') : ''}${chip(r.status)}</div></div>`;
  }
  function reqBlock() {
    const u = S.user, all = scopeReqs().slice().sort(reqSort);
    const list = u.role === 'home' ? all.slice(0, 5) : all.filter(isOpenReq).slice(0, 5);
    const title = u.role === 'home' ? 'Your requests' : u.role === 'college' ? 'Requests to attend' : 'Open requests';
    const sub = u.role === 'home' ? 'Track what you have asked for, and its status.' : u.role === 'college' ? 'Raised by your welfare home. Pick them up and close them when done.' : 'Waiting to be attended.';
    return `<div class="card" style="margin-top:16px"><div class="card-head"><div><h2>${title}</h2><div class="muted small">${sub}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="nav" data-r="requests">Open all</button>${canRaiseReq() ? `<button class="btn sm primary" data-act="newReq">${svg('M12 5v14M5 12h14')}New request</button>` : ''}</div></div>
      ${list.length ? list.map(reqRow).join('') : empty(u.role === 'home' ? 'No requests yet. Raise one when you need something.' : u.role === 'college' ? 'Nothing waiting. Requests from your welfare home appear here.' : 'Nothing pending.')}</div>`;
  }

  function reqListHtml() {
    const all = scopeReqs().slice().sort(reqSort), tab = S.reqTab;
    const list = all.filter(r => inTab(r, tab));
    if (!list.length) return empty(tab === 'Closed' ? 'No closed requests yet.' : S.user.role === 'college' ? 'Nothing here. Requests from your welfare home appear in this list.' : 'No requests here.');
    return list.map(r => {
      const t = REQ_TYPES[r.type] || REQ_TYPES.Other, ms = msgsFor(r.id), last = ms.filter(m => m.kind !== 'status').pop();
      return `<div class="req-item ${S.reqSel === r.id ? 'active' : ''}" data-act="reqSel" data-id="${r.id}">
        <div class="req-top">${chip(r.status)}${r.priority === 'Urgent' && r.status !== 'Closed' ? chip('Urgent') : ''}<span class="muted small" style="margin-left:auto">${ago(r.updatedAt)}</span></div>
        <b>${esc(r.title)}</b>
        <div class="muted small">${esc(t.label)} · ${esc(college(r.collegeId).name)} ↔ ${esc(home(r.homeId).name)}</div>
        ${last ? `<div class="small muted req-last">${esc(last.by)}: ${esc(String(last.text).slice(0, 80))}</div>` : ''}</div>`;
    }).join('');
  }
  function reqHead(r) {
    const btns = [], who = college(r.collegeId).name;
    if (r.status === 'Open' && canWorkReq(r)) btns.push(`<button class="btn sm" data-act="reqStatus" data-id="${r.id}" data-to="In progress">Start work</button>`);
    if (r.status !== 'Closed' && canCloseReq(r)) btns.push(`<button class="btn sm primary" data-act="reqClose" data-id="${r.id}">${canWorkReq(r) ? 'Close request' : 'Mark as resolved'}</button>`);
    if (r.status === 'Closed') btns.push(`<button class="btn sm" data-act="reqStatus" data-id="${r.id}" data-to="Open">Reopen</button>`);
    const line = r.status === 'Open' ? `Waiting for ${who} to pick this up.` : r.status === 'In progress' ? `${who} is working on it.` : '';
    return `<button class="btn sm back" data-act="reqBack">\u2039 All requests</button>
      <div class="card-head" style="margin:8px 0 4px"><h2>${esc(r.title)}</h2><div style="display:flex;gap:6px;flex-wrap:wrap">${chip(r.status)}${r.priority === 'Urgent' ? chip('Urgent') : ''}</div></div>
      <div class="muted small">${esc(r.id)} · ${esc(college(r.collegeId).name)} \u2194 ${esc(home(r.homeId).name)}${line ? ' · ' + esc(line) : ''}</div>
      ${r.status === 'Closed' ? `<div class="req-closed"><b>Closed by ${esc(r.closedBy)}</b> · ${ago(r.closedAt)}<br>${esc(r.closeNote)}</div>` : ''}
      <div class="req-actions">${btns.join('')}</div>`;
  }
  function reqBody(r) {
    const t = REQ_TYPES[r.type] || REQ_TYPES.Other, act = r.activityId && actById(r.activityId);
    const card = `<div class="req-card"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="chip t-brown">${esc(t.label)}</span><span class="muted small">Raised by ${esc(r.raisedBy)} · ${ago(r.createdAt)}</span></div>
      <p style="margin:10px 0 0">${esc(r.details).replace(/\n/g, '<br>')}</p>
      <div class="req-grid"><div><label>${esc(t.hint)}</label>${esc(r.specifics) || '\u2014'}</div><div><label>Needed by</label>${r.neededBy ? fmt(r.neededBy) : '\u2014'}</div><div><label>Priority</label>${esc(r.priority)}</div><div><label>Related activity</label>${act ? esc(act.title) : '\u2014'}</div></div></div>`;
    const msgs = msgsFor(r.id).map(m => m.kind === 'status'
      ? `<div class="sys">${esc(m.by)} \u00b7 ${esc(m.text)} \u00b7 ${ago(m.at)}</div>`
      : `<div class="bubble ${m.by === S.user.name && m.role === S.user.role ? 'me' : ''}"><div class="who">${esc(m.by)} \u00b7 ${esc(ROLES[m.role] ? ROLES[m.role].label : m.role)} \u00b7 ${ago(m.at)}</div>${esc(m.text).replace(/\n/g, '<br>')}</div>`).join('');
    return card + msgs;
  }
  function requestsV() {
    if (!S.reqTab) S.reqTab = S.user.role === 'college' ? 'Open' : 'active';
    const all = scopeReqs(), n = {};
    ['active', 'Open', 'In progress', 'Closed', 'all'].forEach(k => { n[k] = all.filter(r => inTab(r, k)).length; });
    const shown = all.slice().sort(reqSort).filter(r => inTab(r, S.reqTab));
    if (!reqById(S.reqSel) || !shown.some(r => r.id === S.reqSel)) S.reqSel = window.innerWidth > 900 && shown[0] ? shown[0].id : '';
    const sel = reqById(S.reqSel);
    const tab = (k, l) => `<button class="tab ${S.reqTab === k ? 'on' : ''}" data-act="reqTab" data-k="${k}">${l} <span>${n[k]}</span></button>`;
    return `<div class="toolbar"><div class="tabs">${tab('active', 'Active')}${tab('Open', S.user.role === 'college' ? 'New' : 'Open')}${tab('In progress', 'In progress')}${tab('Closed', 'Closed')}${tab('all', 'All')}</div><span style="flex:1"></span>
      ${canRaiseReq() ? `<button class="btn primary" data-act="newReq">${svg('M12 5v14M5 12h14')}New request</button>` : ''}</div>
      <div class="req-wrap ${sel ? 'has-sel' : ''}"><div class="req-list" id="req-list">${reqListHtml()}</div>
      <div class="card req-pane" id="req-pane">${sel ? `<div id="req-head">${reqHead(sel)}</div><div class="req-body" id="req-body">${reqBody(sel)}</div>
        <form class="composer" data-form="reqmsg" data-id="${sel.id}"><textarea name="text" rows="2" placeholder="Write a message. Press Enter to send." required></textarea><button class="btn primary">Send</button></form>`
        : `<div class="empty">${canRaiseReq() ? 'Pick a request on the left, or raise a new one.<br><br><button class="btn primary" data-act="newReq">New request</button>' : 'Pick a request on the left to read it and reply.'}</div>`}</div></div>`;
  }
  // Update the list and thread in place so a half-typed message is never lost.
  function renderReqPartial() {
    const l = $('#req-list'), h = $('#req-head'), b = $('#req-body'), r = reqById(S.reqSel);
    if (!l || !r || !h || !b) { render(); return; }
    l.innerHTML = reqListHtml(); h.innerHTML = reqHead(r); b.innerHTML = reqBody(r); b.scrollTop = b.scrollHeight;
    const badge = document.querySelector('.nav a[data-r=requests] .count'); if (badge) badge.textContent = openReqCount();
  }
  function reqForm() {
    if (!canRaiseReq()) return toast('Colleges attend requests. Your welfare home raises them.');
    const staff = isStaff();
    const types = Object.keys(REQ_TYPES).map(k => `<option value="${k}">${REQ_TYPES[k].label}</option>`).join('');
    const first = REQ_TYPES.Material;
    const acts = scopeActs().slice().sort((a, b) => b.planned.localeCompare(a.planned)).slice(0, 60).map(a => `<option value="${a.id}">${esc(a.title)} \u00b7 ${fmt(a.planned)}</option>`).join('');
    const colSel = staff ? `<div class="full"><label>Partner college (and its welfare home)</label><select name="collegeId" required><option value="">Select\u2026</option>${DB.colleges.map(c => `<option value="${c.id}">${esc(c.name)} \u2014 ${esc(home(c.homeId).name)}</option>`).join('')}</select></div>` : '';
    openModal('New request', `<form data-form="req"><div class="form">
      ${colSel}
      <div><label>Type of request</label><select name="type" data-reqtype>${types}</select></div>
      <div><label>Priority</label><select name="priority"><option>Normal</option><option>Urgent</option></select></div>
      <div class="full"><label>Subject</label><input name="title" required maxlength="120" placeholder="A short headline"></div>
      <div class="full"><label id="spec-label">${first.hint}</label><input name="specifics" maxlength="200" placeholder="${first.ph}"></div>
      <div class="full"><label>Details</label><textarea name="details" rows="3" required placeholder="What is needed, and why?"></textarea></div>
      <div><label>Needed by (optional)</label><input name="neededBy" type="date"></div>
      <div><label>Related activity (optional)</label><select name="activityId"><option value="">None</option>${acts}</select></div>
      </div><p class="muted small" style="margin:12px 0 0">Please do not write residents\u2019 names or personal details here.</p>
      <div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Send request</button></div></form>`);
  }
  function reqCloseForm(id) {
    openModal('Close request', `<form data-form="reqclose" data-id="${id}"><label>What was done? (shown to everyone on the request)</label>
      <textarea name="note" rows="3" required placeholder="e.g. Materials delivered on 12 Nov"></textarea>
      <div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Close request</button></div></form>`);
  }
  async function setReqStatus(id, to, note) {
    const r = reqById(id), from = r.status, now = new Date().toISOString();
    r.status = to; r.updatedAt = now;
    if (to === 'Closed') { r.closedBy = S.user.name; r.closedAt = now; r.closeNote = note || ''; } else if (from === 'Closed') { r.closedBy = ''; r.closedAt = ''; r.closeNote = ''; }
    if (API) { if (!await sync('requests', r)) return false; await refresh(); }
    else {
      DB.messages.push({ id: nextId(DB.messages, 'G'), requestId: id, by: S.user.name, role: S.user.role, at: now, kind: 'status', text: to === 'Closed' ? 'closed the request' + (note ? ': ' + note : '') : to === 'In progress' ? 'marked it in progress' : 'reopened the request' });
      log(to === 'Closed' ? 'Closed request' : to === 'Open' ? 'Reopened request' : 'Request in progress', r.id + ' ' + r.title);
      if (to === 'Closed') addUpdateLocal('request', 'Request closed: ' + r.title, r.collegeId, r.homeId); save();
    }
    return true;
  }

  /* ---------- modal ---------- */
  function openModal(title, body) {
    $('#modal-root').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2 style="font-size:19px">${esc(title)}</h2><button class="x" data-act="close" aria-label="Close">✕</button></div>${body}</div></div>`;
    hydrate($('#modal-root'));
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  /* ---------- actions ---------- */
  function stamp(a, text) { a.updatedAt = today(); a.updatedBy = S.user.name; a.history.push({ t: new Date().toISOString(), by: S.user.name, text }); }
  async function setWf(id, to) {
    const a = actById(id); a.wf = to; stamp(a, to === 'Submitted' ? 'Submitted for verification' : to === 'Verified' ? 'Verified' : 'Returned for correction');
    log(to === 'Submitted' ? 'Submitted activity' : to === 'Verified' ? 'Verified activity' : 'Returned activity', a.id + ' ' + a.title);
    if (to === 'Verified' || to === 'Returned') addUpdateLocal('activity', 'Activity ' + (to === 'Verified' ? 'verified' : 'returned for correction') + ': ' + a.title, a.collegeId, a.homeId); save();
    if (!await sync('activities', a)) return;
    closeModal(); render(); toast('Activity ' + to.toLowerCase());
  }
  function changePwModal(forced) {
    openModal(forced ? 'Set a new password' : 'Change password', `${forced ? '<p class="muted" style="margin-top:0">For security, please replace the default password before you continue.</p>' : ''}<form data-form="pw"><div class="form">
      <div class="full"><label>Current password</label><input name="old" type="password" required autocomplete="current-password"></div>
      <div class="full"><label>New password (at least 8 characters)</label><input name="nw" type="password" required minlength="8" autocomplete="new-password"></div>
      </div><div class="modal-foot">${forced ? '' : '<button type="button" class="btn" data-act="close">Cancel</button>'}<button class="btn primary">Update password</button></div></form>`);
  }
  const A = {
    nav: d => go(d.r),
    menu: () => { S.menu = !S.menu; render(); },
    logout: () => {
      log('Signed out');
      if (API) { api('logout').catch(() => { }); DB = emptyDB(); try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { } S.token = ''; }
      S.user = null; S.route = 'dashboard'; S.reqSel = ''; S.reqTab = ''; try { sessionStorage.removeItem(SESS_KEY); sessionStorage.removeItem(ROUTE_KEY); } catch (e) { }
      render();
    },
    retry: () => location.reload(),
    newReq: () => reqForm(),
    reqSel: d => { S.reqSel = d.id; render(); const b = $('#req-body'); if (b) b.scrollTop = b.scrollHeight; },
    reqOpen: d => { S.reqSel = d.id; S.reqTab = 'all'; go('requests'); },
    reqBack: () => { S.reqSel = ''; render(); },
    reqTab: d => { S.reqTab = d.k; S.reqSel = ''; render(); },
    reqClose: d => reqCloseForm(d.id),
    reqStatus: async d => { if (await setReqStatus(d.id, d.to)) { renderReqPartial(); toast(d.to === 'Open' ? 'Request reopened' : 'Marked in progress'); } },
    fill: d => { const f = document.querySelector('form[data-form=login]'); f.email.value = d.email; f.pw.value = DEFAULT_PW; f.pw.focus(); },
    changePw: () => changePwModal(false),
    resetPw: async d => {
      if (!API) return toast('Password reset works once the Google Sheets connection is on');
      if (!confirm('Reset this user’s password to the default?')) return;
      try { await api('resetPassword', { userId: d.id }); toast('Password reset to the default'); } catch (e) { toast(e.message); }
    },
    reset: () => { DB = clone(window.SEED); save(); try { sessionStorage.removeItem(SESS_KEY); } catch (e) { } toast('Sample data reset'); },
    close: () => closeModal(),
    overlay: (d, el, e) => { if (e.target === el) closeModal(); },
    openAct: d => actDetail(d.id),
    newAct: () => actForm(),
    editAct: d => actForm(d.id),
    wf: d => setWf(d.id, d.to),
    homeConfirm: async d => { const a = actById(d.id); a.homeConfirmed = true; stamp(a, 'Confirmed as held by welfare home'); log('Home confirmed activity', a.id + ' ' + a.title); save(); if (!await sync('activities', a)) return; closeModal(); render(); toast('Thank you — confirmed'); },
    addFollow: d => followModal(d.id),
    doneFollow: async d => { const f = DB.followups.find(x => x.id === d.id); f.done = true; log('Closed follow-up', f.id); save(); if (!await sync('followups', f)) return; render(); },
    calPrev: () => { S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() - 1, 1); render(); },
    calNext: () => { S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() + 1, 1); render(); },
    calToday: () => { const n = new Date(); S.cal = new Date(n.getFullYear(), n.getMonth(), 1); render(); },
    filterBy: d => { S.f = { q: '', college: d.k === 'college' ? d.id : DB.homes.find(h => h.id === d.id).collegeId, status: '', wf: '' }; go('activities'); },
    entity: (d, el, e) => { e.stopPropagation(); entityModal(d.k, d.id); },
    editMou: d => mouModal(d.id),
    addMeeting: () => meetingForm(),
    editMeeting: d => meetingForm(d.id),
    openMeeting: d => meetingModal(d.id),
    meetStatus: async d => {
      const m = meetById(d.id), was = m.status; m.status = d.to; log((d.to === 'Held' ? 'Marked meeting held' : 'Cancelled meeting'), m.id + ' ' + m.title);
      addUpdateLocal('meeting', 'Meeting ' + d.to.toLowerCase() + ': ' + m.title + ' (' + fmt(m.date) + ')', m.collegeIds, m.homeIds); save();
      if (!await sync('meetings', m)) { m.status = was; return; } meetingModal(d.id); render(); toast('Meeting ' + d.to.toLowerCase());
    },
    renewMou: d => renewModal(d.id),
    completeAct: (d, el, e) => { e.stopPropagation(); completeForm(d.id); },
    startAct: async d => {
      const a = actById(d.id); a.status = 'Ongoing';
      if (S.user.role === 'college' && a.wf === 'Verified') { a.wf = 'Submitted'; a.homeConfirmed = false; }
      stamp(a, 'Marked ongoing'); log('Marked activity ongoing', a.id + ' ' + a.title); save();
      if (!await sync('activities', a)) return; closeModal(); render(); toast('Marked ongoing');
    },
    addPhotos: d => photoModal(d.id),
    openPhoto: d => photoViewer(d.id),
    approvePhoto: async d => { if (await setFileStatus(d.id, 'Approved')) { closeModal(); render(); toast('Photo approved'); } },
    rejectPhoto: async d => { if (await setFileStatus(d.id, 'Rejected')) { closeModal(); render(); toast('Photo rejected'); } },
    delPhoto: async d => { if (confirm('Delete this photo?') && await removeFile(d.id)) { closeModal(); render(); toast('Photo deleted'); } },
    dl: (d, el, e) => { e.stopPropagation(); downloadFile(d.id); },
    gTab: d => { S.gTab = d.k; render(); },
    addUser: () => userModal(),
    toggleUser: async d => { const u = DB.users.find(x => x.id === d.id); u.active = !u.active; log(u.active ? 'Enabled user' : 'Disabled user', u.name); save(); if (!await sync('users', u)) return; render(); },
    exportActs: () => { const rows = [['ID', 'Title', 'College', 'Welfare home', 'Planned', 'Actual', 'Status', 'Review state', 'Coordinator', 'Outcome', 'Evidence', 'Challenges', 'Next action']]; filtered().forEach(a => rows.push([a.id, a.title, college(a.collegeId).name, home(a.homeId).name, a.planned, a.actual, derived(a), a.wf, a.coordinator, a.outcome, a.evidence, a.challenges, a.nextAction])); download('happy-hill-activities.csv', rows); log('Exported activities', rows.length - 1 + ' rows'); },
    exportLogs: () => { const rows = [['When', 'User', 'Role', 'Action', 'Detail']]; DB.logs.forEach(l => rows.push([l.t, l.user, l.role, l.action, l.detail])); download('happy-hill-audit-log.csv', rows); },
    print: () => window.print()
  };
  document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el) return; const f = A[el.dataset.act]; if (f) f(el.dataset, el, e); });

  /* filters */
  function onFilter(e) {
    const el = e.target;
    if (el.dataset.filter) { S.f[el.dataset.filter] = el.value; $('#act-table').innerHTML = actTable(); }
    if (el.hasAttribute('data-logq')) { S.logQ = el.value; $('#log-table').innerHTML = logTable(DB.logs.filter(l => !el.value || (l.user + l.action + l.detail + l.role).toLowerCase().includes(el.value.toLowerCase()))); }
  }
  document.addEventListener('input', onFilter); document.addEventListener('change', onFilter);
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.matches && el.matches('[data-selall]')) el.form.querySelectorAll('input[name=col],input[name=hom]').forEach(c => { c.checked = el.checked; });
    if (el.matches && el.matches('input[name=col]')) {                            // ticking a college also ticks the home it is paired with
      const c = DB.colleges.find(x => x.id === el.value), h = c && el.form.querySelector(`input[name=hom][value="${c.homeId}"]`); if (h && el.checked) h.checked = true;
    }
    if (el.matches && el.matches('input[data-reportfor]') && el.files[0]) { uploadReport(el.files[0], el.dataset.reportfor); el.value = ''; }
    if (el.matches && el.matches('[data-gcol]')) { S.gCollege = el.value; render(); }
  });

  /* forms */
  document.addEventListener('submit', async e => {
    const form = e.target, kind = form.dataset.form; if (!kind) return; e.preventDefault();
    const fd = Object.fromEntries(new FormData(form)); const mode = e.submitter && e.submitter.value;
    const done = msg => { closeModal(); render(); toast(msg); if (API) refresh().then(ok => { if (ok && S.user && !document.querySelector('.overlay')) render(); }).catch(() => { }); };
    if (kind === 'login') {
      const email = (fd.email || '').trim().toLowerCase();
      if (API) {
        try {
          const j = await api('login', { email, password: fd.pw || '' });
          S.token = j.token; try { sessionStorage.setItem(TOKEN_KEY, j.token); } catch (x) { }
          await refresh(); S.route = 'dashboard'; render();
          if (j.mustChange) changePwModal(true);
        } catch (err) { toast(err.message); }
        return;
      }
      const u = DB.users.find(x => x.email.toLowerCase() === email && x.active);
      if (!u || fd.pw !== DEFAULT_PW) return toast('Incorrect email or password');
      S.user = u; S.route = 'dashboard'; try { sessionStorage.setItem(SESS_KEY, u.id); } catch (x) { } log('Signed in'); return render();
    }
    if (kind === 'pw') {
      if (!API) return toast('Password changes work once the Google Sheets connection is on');
      try { const j = await api('changePassword', { oldPassword: fd.old, newPassword: fd.nw }); if (j.token) { S.token = j.token; try { sessionStorage.setItem(TOKEN_KEY, j.token); } catch (x) { } } closeModal(); toast('Password updated'); } catch (err) { toast(err.message); }
      return;
    }
    if (kind === 'req') {
      if (!canRaiseReq()) return toast('Colleges attend requests. Your welfare home raises them.');
      const u = S.user, colId = u.role === 'college' ? u.collegeId : u.role === 'home' ? (DB.colleges.find(c => c.homeId === u.homeId) || {}).id : fd.collegeId;
      const c = DB.colleges.find(x => x.id === colId); if (!c) return toast('Choose a college');
      const now = new Date().toISOString();
      const r = { id: nextId(DB.requests, 'Q'), collegeId: c.id, homeId: c.homeId, type: fd.type, title: fd.title.trim(), details: fd.details.trim(), specifics: (fd.specifics || '').trim(), priority: fd.priority, neededBy: fd.neededBy || '', activityId: fd.activityId || '', status: 'Open', raisedBy: u.name, raisedRole: u.role, createdAt: now, updatedAt: now, closedBy: '', closedAt: '', closeNote: '' };
      DB.requests.push(r); log('Raised request', r.id + ' ' + r.title); save();
      if (!await sync('requests', r, true)) return;
      S.reqSel = r.id; S.reqTab = 'active'; return done('Request sent');
    }
    if (kind === 'reqmsg') {
      const text = (fd.text || '').trim(); if (!text) return;
      const r = reqById(form.dataset.id), now = new Date().toISOString();
      const m = { id: nextId(DB.messages, 'G'), requestId: r.id, by: S.user.name, role: S.user.role, at: now, kind: 'message', text };
      DB.messages.push(m); r.updatedAt = now; save();
      form.reset(); renderReqPartial();
      if (!await sync('messages', m, true)) return;
      return;
    }
    if (kind === 'reqclose') {
      if (!await setReqStatus(form.dataset.id, 'Closed', (fd.note || '').trim())) return;
      closeModal(); renderReqPartial(); return toast('Request closed');
    }
    if (kind === 'act') {
      const id = form.dataset.id, c = DB.colleges.find(x => x.id === fd.collegeId); if (!c) return toast('Choose a college');
      const a = id ? actById(id) : { id: nextId(DB.activities, 'A'), wf: 'Draft', history: [{ t: new Date().toISOString(), by: S.user.name, text: 'Activity created' }] };
      Object.assign(a, { title: fd.title.trim(), desc: fd.desc, collegeId: c.id, homeId: c.homeId, planned: fd.planned, actual: fd.actual, status: fd.status, coordinator: fd.coordinator, outcome: fd.outcome, evidence: fd.evidence, challenges: fd.challenges, nextAction: fd.nextAction, followUp: !!fd.followUp });
      if (fd.status === 'Completed' && !a.actual) a.actual = a.planned;
      if (id) stamp(a, 'Edited'); else { a.updatedAt = today(); a.updatedBy = S.user.name; DB.activities.push(a); }
      if (mode === 'submit') { a.wf = 'Submitted'; stamp(a, 'Submitted for verification'); }
      if (mode === 'verify') { a.wf = 'Verified'; stamp(a, 'Verified'); }
      log((id ? 'Edited' : 'Created') + ' activity' + (mode === 'submit' ? ' and submitted' : mode === 'verify' ? ' and verified' : ''), a.id + ' ' + a.title);
      save(); if (!await sync('activities', a, !id)) return; return done('Activity saved');
    }
    if (kind === 'follow') {
      const a = actById(form.dataset.id), f = { id: nextId(DB.followups, 'F'), activityId: a.id, reason: fd.reason, action: fd.action, owner: fd.owner, due: fd.due, done: false };
      DB.followups.push(f); a.followUp = true; stamp(a, 'Follow-up added'); log('Added follow-up', a.id + ' ' + a.title); save();
      if (!await sync('followups', f, true)) return; if (!await sync('activities', a)) return; return done('Follow-up saved');
    }
    if (kind === 'entity') {
      const isC = form.dataset.k === 'college', arr = isC ? DB.colleges : DB.homes, id = form.dataset.id;
      const o = id ? arr.find(x => x.id === id) : { id: nextId(arr, isC ? 'C' : 'H') };
      o.name = fd.name; o.phone = fd.phone; o.email = fd.email;
      if (isC) { o.coordinator = fd.person; o.homeId = fd.link; o.target = +fd.target || 0; } else { o.head = fd.person; o.collegeId = fd.link; }
      if (!id) arr.push(o);
      if (!await sync(isC ? 'colleges' : 'homes', o, !id)) return;
      const other = isC ? DB.homes.find(x => x.id === o.homeId) : DB.colleges.find(x => x.id === o.collegeId);   // keep the college-home pair in step
      if (other) { if (isC) other.collegeId = o.id; else other.homeId = o.id; if (!await sync(isC ? 'homes' : 'colleges', other)) return; }
      log((id ? 'Edited ' : 'Added ') + (isC ? 'college' : 'welfare home'), o.name); save(); return done('Saved');
    }
    if (kind === 'mou') { const m = DB.mous.find(x => x.id === form.dataset.id); Object.assign(m, { start: fd.start, end: fd.end, renewal: fd.renewal }); log('Updated MoU', college(m.collegeId).name); save(); if (!await sync('mous', m)) return; return done('MoU updated'); }
    if (kind === 'renew') {
      const m = DB.mous.find(x => x.id === form.dataset.id);
      if (fd.end <= fd.start) return toast('The end date must be after the start date');
      m.history = (m.history || []).concat([{ start: m.start, end: m.end, by: S.user.name, at: today() }]);
      Object.assign(m, { start: fd.start, end: fd.end, renewal: (fd.renewal || '').trim() || 'Renewed on ' + fmt(today()) });
      log('Renewed MoU', college(m.collegeId).name); addUpdateLocal('mou', 'MoU renewed: ' + college(m.collegeId).name + ', valid until ' + fmt(m.end), m.collegeId, m.homeId); save();
      if (!await sync('mous', m)) return; return done('MoU renewed');
    }
    if (kind === 'meeting') {
      const all = new FormData(form), cols = all.getAll('col'), homs = all.getAll('hom'), id = form.dataset.id;
      if (!cols.length && !homs.length) return toast('Choose who should attend');
      const base = { type: fd.type, title: (fd.title || '').trim() || fd.type, date: fd.date, time: fd.time || '', venue: (fd.venue || '').trim(), agenda: (fd.agenda || '').trim(), collegeIds: cols.join(','), homeIds: homs.join(',') };
      if (id) {
        const m = meetById(id), moved = m.date !== base.date || m.time !== base.time;
        Object.assign(m, base); if (isAdmin()) { if (fd.minutes != null) m.minutes = fd.minutes; if (fd.actions != null) m.actions = fd.actions; }
        log('Edited meeting', m.id + ' ' + m.title); if (moved) addUpdateLocal('meeting', 'Meeting rescheduled: ' + m.title + ' now ' + fmt(m.date), m.collegeIds, m.homeIds); save();
        if (!await sync('meetings', m)) return; return done('Meeting updated');
      }
      const n = fd.repeat === '1' ? Math.min(12, Math.max(2, +fd.months || 6)) : 1, series = n > 1 ? 'S' + Date.now().toString(36) : '';
      for (let i = 0; i < n; i++) {
        const m = Object.assign({ id: nextId(DB.meetings, 'E'), status: 'Scheduled', minutes: '', actions: '', seriesId: series, createdBy: S.user.name, createdAt: new Date().toISOString() }, base, { date: addMonths(base.date, i) });
        DB.meetings.push(m); log('Scheduled meeting', m.id + ' ' + m.title); addUpdateLocal('meeting', 'Meeting scheduled: ' + m.title + ' on ' + fmt(m.date), m.collegeIds, m.homeIds); save();
        if (!await sync('meetings', m, true)) return;
      }
      return done(n > 1 ? n + ' meetings scheduled' : 'Meeting scheduled');
    }
    if (kind === 'complete') {
      const a = actById(form.dataset.id), files = form.querySelector('input[type=file]').files, prevWf = a.wf;
      if (files.length && !fd.consent) return toast('Please confirm the photos have consent and show no identifiable residents');
      a.status = 'Completed'; a.actual = fd.actual || today(); a.outcome = (fd.outcome || '').trim();
      if (S.user.role === 'college') { if (['Draft', 'Returned'].includes(a.wf)) a.wf = 'Submitted'; else if (a.wf === 'Verified') { a.wf = 'Submitted'; a.homeConfirmed = false; } }
      stamp(a, 'Marked completed' + (prevWf === 'Verified' && S.user.role === 'college' ? ' (sent back for verification)' : ''));
      log('Marked activity completed', a.id + ' ' + a.title); addUpdateLocal('activity', 'Activity completed: ' + a.title, a.collegeId, a.homeId); save();
      if (!await sync('activities', a)) return;
      closeModal(); render(); toast('Marked completed');
      if (files.length) { const n = await uploadPhotos(files, a.id); render(); toast(n + ' photo' + (n === 1 ? '' : 's') + ' uploaded'); }
      return;
    }
    if (kind === 'photos') {
      const files = form.querySelector('input[type=file]').files; if (!files.length) return toast('Choose at least one photo');
      const n = await uploadPhotos(files, fd.activityId); closeModal(); render(); return toast(n + ' photo' + (n === 1 ? '' : 's') + ' uploaded' + (n && !isAdmin() ? ', awaiting approval' : ''));
    }
    if (kind === 'user') {
      const u = { id: nextId(DB.users, 'U'), name: fd.name, email: fd.email, role: fd.role, active: true };
      if (fd.link && fd.link.startsWith('c:')) u.collegeId = fd.link.slice(2); if (fd.link && fd.link.startsWith('h:')) u.homeId = fd.link.slice(2);
      if (u.role === 'college' && !u.collegeId) return toast('Pick a college for this coordinator');
      if (u.role === 'home' && !u.homeId) return toast('Pick a welfare home for this user');
      DB.users.push(u); log('Added user', u.name + ' (' + ROLES[u.role].label + ')'); save(); if (!await sync('users', u, true)) return; return done('User added — default password applies');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && !e.shiftKey && e.target.matches && e.target.matches('.composer textarea')) { e.preventDefault(); e.target.form.requestSubmit(); }
  });
  document.addEventListener('change', e => {
    if (e.target.matches && e.target.matches('[data-reqtype]')) {
      const t = REQ_TYPES[e.target.value] || REQ_TYPES.Other, f = e.target.form;
      $('#spec-label').textContent = t.hint; f.specifics.placeholder = t.ph;
    }
  });

  /* start: restore the session on refresh, keep data fresh */
  const splash = msg => `<div class="splash"><img class="logo-img" src="assets/happy-hill-logo.png" alt="Happy Hill"><p>${msg}</p></div>`;
  function restoreRoute() { try { const r = sessionStorage.getItem(ROUTE_KEY); if (r && S.user && ROLES[S.user.role].nav.includes(r)) S.route = r; } catch (e) { } }
  function startPolling() {
    if (API) {
      setInterval(async () => {
        if (!S.user || document.hidden || document.querySelector('.overlay')) return;
        const ae = document.activeElement, typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
        try { await refresh(); if (S.route === 'requests') renderReqPartial(); else if (!typing && !['users'].includes(S.route)) render(); } catch (e) { }
      }, 30000);
    } else {
      window.addEventListener('storage', e => {            // another tab on this device saved something
        if (e.key !== KEY || !S.user || document.querySelector('.overlay')) return;
        DB = load(); S.user = DB.users.find(u => u.id === S.user.id) || null; render();
      });
    }
  }
  (async function init() {
    if (API) {
      try { S.token = sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { }
      if (S.token) {
        $('#app').innerHTML = splash('Restoring your session\u2026');
        try { await refresh(); restoreRoute(); }
        catch (e) {
          if (/Session expired/.test(e.message)) { S.token = ''; S.user = null; }
          else { $('#app').innerHTML = `<div class="splash"><img class="logo-img" src="assets/happy-hill-logo.png" alt="Happy Hill"><p>Could not reach the server. Your session is kept.</p><button class="btn primary" data-act="retry">Try again</button></div>`; return; }
        }
      }
    } else {
      try { const id = sessionStorage.getItem(SESS_KEY), u = id && DB.users.find(x => x.id === id && x.active); if (u) { S.user = u; restoreRoute(); } } catch (e) { }
    }
    render(); startPolling();
  })();
})();
