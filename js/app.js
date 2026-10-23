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
  const emptyDB = () => ({ colleges: [], homes: [], activities: [], followups: [], mous: [], reviews: [], resources: [], requests: [], messages: [], users: [], logs: [], settings: { monthlyTarget: 4 } });
  function load() {
    if (API) return emptyDB();
    try { const x = localStorage.getItem(KEY); if (x) { const d = JSON.parse(x); ['requests', 'messages'].forEach(k => { if (!d[k]) d[k] = clone(window.SEED[k] || []); }); return d; } } catch (e) { }
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
  async function refresh() { const seq = mutSeq; const j = await api('bootstrap'); if (seq !== mutSeq || pending > 0) return false; DB = j.data; S.user = j.user; return true; }
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
  const ALL_NAV = ['dashboard', 'colleges', 'homes', 'activities', 'calendar', 'followups', 'requests', 'mous', 'documents', 'reports'];
  const ROLES = {
    college: { label: 'College Coordinator', nav: ['dashboard', 'activities', 'calendar', 'followups', 'requests', 'documents', 'reports'] },
    home: { label: 'Welfare Home', nav: ['dashboard', 'activities', 'calendar', 'followups', 'requests', 'documents'] },
    district: { label: 'District Administration', nav: ALL_NAV },
    admin: { label: 'Admin / Intern', nav: ALL_NAV.concat('users') },
    superadmin: { label: 'Super Admin', nav: ALL_NAV.concat('users', 'logs') }
  };
  const isStaff = () => ['district', 'admin', 'superadmin'].includes(S.user.role);
  const canManageUsers = () => ['admin', 'superadmin'].includes(S.user.role);
  const canManageOrgs = () => ['admin', 'superadmin', 'district'].includes(S.user.role);

  const NAV = {
    dashboard: ['Dashboard', 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10'],
    colleges: ['Partner Colleges', 'M3 9l9-5 9 5-9 5-9-5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5'],
    homes: ['Welfare Homes', 'M4 21V10l8-6 8 6v11M9 21v-6h6v6'],
    activities: ['Activities', 'M9 11l3 3 8-8M4 12v7a1 1 0 001 1h14'],
    calendar: ['Calendar', 'M4 7h16v13H4zM4 11h16M8 3v4M16 3v4'],
    followups: ['Follow-ups', 'M12 8v4l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5'],
    requests: ['Requests', 'M21 12a8 8 0 01-11.5 7.2L4 20l1-4.2A8 8 0 1121 12zM8 11h8M8 14h5'],
    mous: ['MoU & Reviews', 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6'],
    documents: ['Documents', 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
    reports: ['Reports', 'M5 20V10M12 20V4M19 20v-7'],
    users: ['Users', 'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8'],
    logs: ['Audit Log', 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4']
  };
  const svg = (d, cls) => `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ''}><path d="${d}"/></svg>`;

  // The DCIP logo is optional: drop assets/dcip-logo.png into the repo and it appears everywhere.
  const LOGO_DCIP = '<img src="assets/dcip-logo.png" alt="DCIP Kozhikode" onerror="this.remove()">';

  /* ---------- state ---------- */
  const S = { user: null, token: '', route: 'dashboard', cal: new Date(new Date().getFullYear(), new Date().getMonth(), 1), f: { q: '', college: '', status: '', wf: '' }, logQ: '', menu: false, reqSel: '', reqTab: 'active' };

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
  const TONE = { Completed: 't-green', Ongoing: 't-blue', Planned: 't-grey', Upcoming: 't-violet', Delayed: 't-red', Postponed: 't-amber', 'On Hold': 't-amber', Draft: 't-grey', Submitted: 't-blue', Verified: 't-green', Returned: 't-red', Active: 't-green', Expiring: 't-amber', Expired: 't-red', Held: 't-green', Scheduled: 't-violet', 'To schedule': 't-grey', Open: 't-amber', 'In progress': 't-blue', Closed: 't-green', Urgent: 't-red', Normal: 't-grey' };
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
  const canEditAct = a => isStaff() || (S.user.role === 'college' && a.collegeId === S.user.collegeId && ['Draft', 'Returned'].includes(a.wf));
  const canAddAct = () => isStaff() || S.user.role === 'college';

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
  }
  function shell() {
    const r = ROLES[S.user.role];
    const nOpen = openReqCount();
    const items = r.nav.map(k => `<a data-act="nav" data-r="${k}" class="${S.route === k ? 'active' : ''}">${svg(NAV[k][1])}${NAV[k][0]}${k === 'requests' && nOpen ? `<span class="count">${nOpen}</span>` : ''}</a>`).join('');
    const who = S.user.role === 'college' ? college(S.user.collegeId).name : S.user.role === 'home' ? home(S.user.homeId).name : 'District Administration, Kozhikode';
    return `<div class="shell">
      <aside class="sidebar ${S.menu ? 'open' : ''}">
        <div class="brand"><img class="logo-img" src="assets/happy-hill-logo.png" alt="Happy Hill"></div>
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
    return ({ dashboard, colleges: collegesV, homes: homesV, activities: activitiesV, calendar: calendarV, followups: followupsV, requests: requestsV, mous: mousV, documents: documentsV, reports: reportsV, users: usersV, logs: logsV })[S.route]();
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
      <p>${c.Delayed ? `${c.Delayed} activit${c.Delayed > 1 ? 'ies are' : 'y is'} running late.` : 'Everything is on track.'} ${verifyQ.length && isStaff() ? `${verifyQ.length} waiting for verification.` : `${monthDone} of ${target} activities completed this month.`}</p></div>
      ${canAddAct() ? `<button class="btn" data-act="newAct">${svg('M12 5v14M5 12h14')}New activity</button>` : `<button class="btn" data-act="nav" data-r="activities">View activities</button>`}</section>`;
    return `${hero}<div class="grid g-kpi">
      ${isStaff() ? kpi(DB.colleges.length, 'Partner colleges', 't-green', NAV.colleges[1]) + kpi(DB.homes.length, 'Welfare homes', 't-brown', NAV.homes[1]) : ''}
      ${kpi(c.total, 'Activities planned', 't-blue', NAV.activities[1])}
      ${kpi(c.Completed, 'Completed', 't-green', 'M5 13l4 4L19 7')}
      ${kpi(c.pending, 'Pending', 't-amber', NAV.followups[1])}
      ${kpi(c.Delayed, 'Delayed', 't-red', 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z')}
      ${kpi(openReqCount(), 'Open requests', 't-violet', NAV.requests[1])}
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
      <div class="card"><div class="card-head"><h2>Recent updates</h2></div>${recent.length ? recent.map(actRow).join('') : empty('No updates yet.')}</div>
    </div>
    ${(isStaff() && verifyQ.length) || mouAlerts.length ? `<div class="grid g-2" style="margin-top:16px">
      ${isStaff() ? `<div class="card"><div class="card-head"><h2>Awaiting verification</h2><span class="chip t-blue">${verifyQ.length}</span></div>${verifyQ.length ? verifyQ.slice(0, 5).map(actRow).join('') : empty('All caught up.')}</div>` : ''}
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
    return `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>College / Home</th><th>Planned</th><th>Actual</th><th>Status</th><th>Review</th><th>Follow-up</th></tr></thead><tbody>
    ${list.map(a => `<tr class="click" data-act="openAct" data-id="${a.id}"><td><b>${esc(a.title)}</b><div class="sub">${esc(a.coordinator)}</div></td><td>${esc(college(a.collegeId).name)}<div class="sub">${esc(home(a.homeId).name)}</div></td><td>${fmt(a.planned)}</td><td>${fmt(a.actual)}</td><td>${chip(derived(a))}</td><td>${chip(a.wf)}${a.homeConfirmed ? '<div class="sub">Home confirmed</div>' : ''}</td><td>${a.followUp ? chip('Needed') : '—'}</td></tr>`).join('')}</tbody></table></div>`;
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
      <div class="full"><label>Evidence link (report, photographs)</label><input name="evidence" type="url" placeholder="https://drive.google.com/…" value="${esc(a.evidence || '')}"></div>
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
    if (isStaff() || S.user.role === 'college') btns.push(`<button class="btn" data-act="addFollow" data-id="${id}">Add follow-up</button>`);
    const link = a.evidence ? `<a href="${esc(a.evidence)}" target="_blank" rel="noopener">Open evidence</a>` : '—';
    openModal(a.title, `<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">${chip(derived(a))}${chip(a.wf)}${a.homeConfirmed ? chip('Home confirmed') : ''}${a.followUp ? chip('Follow-up needed') : ''}</div>
      <dl class="kv"><dt>Description</dt><dd>${esc(a.desc) || '—'}</dd><dt>College</dt><dd>${esc(college(a.collegeId).name)}</dd><dt>Welfare home</dt><dd>${esc(home(a.homeId).name)}</dd>
      <dt>Planned / actual</dt><dd>${fmt(a.planned)} / ${fmt(a.actual)}</dd><dt>Coordinator</dt><dd>${esc(a.coordinator) || '—'}</dd><dt>Outcome</dt><dd>${esc(a.outcome) || '—'}</dd>
      <dt>Evidence</dt><dd>${link}</dd><dt>Challenges</dt><dd>${esc(a.challenges) || '—'}</dd><dt>Next action</dt><dd>${esc(a.nextAction) || '—'}</dd><dt>Last updated</dt><dd>${fmt(a.updatedAt)} by ${esc(a.updatedBy)}</dd></dl>
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
      ${needs.map(a => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div><b>${esc(a.title)}</b><div class="muted small">${esc(college(a.collegeId).name)} · ${chip(derived(a))}</div></div>${isStaff() || S.user.role === 'college' ? `<button class="btn sm" data-act="addFollow" data-id="${a.id}">Add follow-up</button>` : ''}</div>`).join('')}</div>` : ''}
    <div class="card"><div class="card-head"><h2>Follow-up actions</h2></div>${list.length ? `<div class="table-wrap"><table><thead><tr><th>Activity</th><th>Reason for delay</th><th>Action</th><th>Responsible</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(f => { const a = actById(f.activityId) || {}, od = !f.done && daysTo(f.due) < 0; return `<tr><td><b>${esc(a.title)}</b><div class="sub">${esc(college(a.collegeId).name)}</div></td><td>${esc(f.reason)}</td><td>${esc(f.action)}</td><td>${esc(f.owner)}</td><td>${fmt(f.due)}</td><td>${chip(f.done ? 'Completed' : od ? 'Delayed' : 'Ongoing')}</td><td>${!f.done && (isStaff() || S.user.role === 'college') ? `<button class="btn sm" data-act="doneFollow" data-id="${f.id}">Mark done</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : empty('No follow-ups recorded.')}</div>`;
  }
  function followModal(actId) {
    const a = actById(actId);
    openModal('Add follow-up', `<p class="muted" style="margin-top:0">${esc(a.title)} · ${esc(college(a.collegeId).name)}</p><form data-form="follow" data-id="${actId}"><div class="form">
      <div class="full"><label>Reason for delay / need</label><input name="reason" required></div><div class="full"><label>Follow-up action</label><input name="action" required></div>
      <div><label>Responsible person</label><input name="owner" value="${esc(a.coordinator)}"></div><div><label>Follow-up date</label><input name="due" type="date" required value="${iso(new Date(Date.now() + 7 * DAY))}"></div>
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save follow-up</button></div></form>`);
  }

  /* ---------- MoU & reviews ---------- */
  const mouStatus = m => { const d = daysTo(m.end); return d < 0 ? 'Expired' : d <= 60 ? 'Expiring' : 'Active'; };
  function mousV() {
    const cols = scopeColleges().map(c => c.id), mous = DB.mous.filter(m => cols.includes(m.collegeId)), revs = DB.reviews.filter(r => cols.includes(r.collegeId)).sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="card"><div class="card-head"><h2>MoU register</h2></div><div class="table-wrap"><table><thead><tr><th>College</th><th>Welfare home</th><th>Start</th><th>Expiry</th><th>Status</th><th>Renewal</th><th></th></tr></thead><tbody>
      ${mous.map(m => `<tr><td><b>${esc(college(m.collegeId).name)}</b></td><td>${esc(home(m.homeId).name)}</td><td>${fmt(m.start)}</td><td>${fmt(m.end)}<div class="sub">${daysTo(m.end) < 0 ? Math.abs(daysTo(m.end)) + ' days ago' : 'in ' + daysTo(m.end) + ' days'}</div></td><td>${chip(mouStatus(m))}</td><td>${esc(m.renewal) || '—'}</td><td>${isStaff() ? `<button class="btn sm" data-act="editMou" data-id="${m.id}">Update</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="7">${empty('No MoU records.')}</td></tr>`}</tbody></table></div></div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h2>Quarterly reviews</h2>${isStaff() ? `<button class="btn primary sm" data-act="addReview">${svg('M12 5v14M5 12h14')}Schedule review</button>` : ''}</div>
      ${revs.length ? `<div class="table-wrap"><table><thead><tr><th>College</th><th>Date</th><th>Quarter</th><th>Status</th><th>Minutes</th><th>Action points</th><th></th></tr></thead><tbody>${revs.map(r => `<tr><td><b>${esc(college(r.collegeId).name)}</b></td><td>${fmt(r.date)}</td><td>${esc(r.quarter)}</td><td>${chip(r.minutes ? 'Held' : daysTo(r.date) >= 0 ? 'Scheduled' : 'To schedule')}</td><td>${esc(r.minutes) || '—'}</td><td>${esc(r.actions) || '—'}</td><td>${isStaff() ? `<button class="btn sm" data-act="editReview" data-id="${r.id}">Edit</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('No reviews scheduled.')}</div>`;
  }
  function mouModal(id) {
    const m = DB.mous.find(x => x.id === id);
    openModal('Update MoU — ' + college(m.collegeId).name, `<form data-form="mou" data-id="${id}"><div class="form"><div><label>Start date</label><input name="start" type="date" value="${m.start}"></div><div><label>Expiry date</label><input name="end" type="date" value="${m.end}"></div>
      <div class="full"><label>Renewal status / note</label><input name="renewal" value="${esc(m.renewal)}"></div></div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save</button></div></form>`);
  }
  function reviewModal(id) {
    const r = id ? DB.reviews.find(x => x.id === id) : { date: today(), quarter: '', minutes: '', actions: '' };
    openModal(id ? 'Edit review' : 'Schedule review', `<form data-form="review" data-id="${id || ''}"><div class="form">
      <div class="full"><label>College</label><select name="collegeId" required>${DB.colleges.map(c => `<option value="${c.id}" ${r.collegeId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div><label>Date</label><input name="date" type="date" required value="${r.date}"></div><div><label>Quarter</label><input name="quarter" placeholder="e.g. Q-2" value="${esc(r.quarter)}"></div>
      <div class="full"><label>Minutes</label><textarea name="minutes" rows="3">${esc(r.minutes)}</textarea></div><div class="full"><label>Action points</label><textarea name="actions" rows="2">${esc(r.actions)}</textarea></div>
      </div><div class="modal-foot"><button type="button" class="btn" data-act="close">Cancel</button><button class="btn primary">Save</button></div></form>`);
  }

  /* ---------- documents ---------- */
  function documentsV() {
    const withEv = scopeActs().filter(a => a.evidence);
    return `<div class="grid g-2"><div class="card"><div class="card-head"><h2>Templates and guidelines</h2></div>
      ${DB.resources.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>${esc(d.title)}</b></div><span class="chip t-brown">${esc(d.kind)}</span></div>`).join('')}
      <p class="muted small" style="margin-bottom:0">Links open the approved shared folder once connected.</p></div>
      <div class="card"><div class="card-head"><h2>Activity evidence</h2></div>${withEv.length ? withEv.map(a => `<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>${esc(a.title)}</b><div class="muted small">${esc(college(a.collegeId).name)} · ${fmt(a.actual || a.planned)}</div></div><a href="${esc(a.evidence)}" target="_blank" rel="noopener">Open</a></div>`).join('') : empty('No evidence links yet.')}</div></div>`;
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

  function reqRow(r) {
    const t = REQ_TYPES[r.type] || REQ_TYPES.Other;
    return `<div data-act="reqOpen" data-id="${r.id}" style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer">
      <div style="min-width:0"><b>${esc(r.title)}</b><div class="muted small">${esc(t.label)} · ${esc(college(r.collegeId).name)} ↔ ${esc(home(r.homeId).name)} · ${ago(r.updatedAt)}</div></div>
      <div style="display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end">${r.priority === 'Urgent' && r.status !== 'Closed' ? chip('Urgent') : ''}${chip(r.status)}</div></div>`;
  }
  function reqBlock() {
    const u = S.user, all = scopeReqs().slice().sort(reqSort);
    const list = u.role === 'home' ? all.slice(0, 5) : all.filter(isOpenReq).slice(0, 5);
    const title = u.role === 'home' ? 'Your requests' : u.role === 'college' ? 'Pending requests' : 'Open requests';
    const sub = u.role === 'home' ? 'Track what you have asked for, and its status.' : 'Waiting to be attended.';
    return `<div class="card" style="margin-top:16px"><div class="card-head"><div><h2>${title}</h2><div class="muted small">${sub}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="nav" data-r="requests">Open all</button><button class="btn sm primary" data-act="newReq">${svg('M12 5v14M5 12h14')}New request</button></div></div>
      ${list.length ? list.map(reqRow).join('') : empty(u.role === 'home' ? 'No requests yet. Raise one when you need something.' : 'Nothing pending.')}</div>`;
  }

  function reqListHtml() {
    const all = scopeReqs().slice().sort(reqSort), tab = S.reqTab;
    const list = all.filter(r => tab === 'all' || (tab === 'Closed' ? r.status === 'Closed' : r.status !== 'Closed'));
    if (!list.length) return empty(tab === 'Closed' ? 'No closed requests yet.' : 'No requests here.');
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
    const btns = [];
    if (r.status === 'Open') btns.push(`<button class="btn sm" data-act="reqStatus" data-id="${r.id}" data-to="In progress">Start work</button>`);
    if (r.status !== 'Closed') btns.push(`<button class="btn sm primary" data-act="reqClose" data-id="${r.id}">Close request</button>`);
    else btns.push(`<button class="btn sm" data-act="reqStatus" data-id="${r.id}" data-to="Open">Reopen</button>`);
    return `<button class="btn sm back" data-act="reqBack">\u2039 All requests</button>
      <div class="card-head" style="margin:8px 0 4px"><h2>${esc(r.title)}</h2><div style="display:flex;gap:6px;flex-wrap:wrap">${chip(r.status)}${r.priority === 'Urgent' ? chip('Urgent') : ''}</div></div>
      <div class="muted small">${esc(r.id)} · ${esc(college(r.collegeId).name)} \u2194 ${esc(home(r.homeId).name)}</div>
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
    const all = scopeReqs(), n = {
      active: all.filter(isOpenReq).length, Closed: all.filter(r => r.status === 'Closed').length, all: all.length
    };
    const shown = all.slice().sort(reqSort).filter(r => S.reqTab === 'all' || (S.reqTab === 'Closed' ? r.status === 'Closed' : r.status !== 'Closed'));
    if (!reqById(S.reqSel) || !shown.some(r => r.id === S.reqSel)) S.reqSel = window.innerWidth > 900 && shown[0] ? shown[0].id : '';
    const sel = reqById(S.reqSel);
    const tab = (k, l) => `<button class="tab ${S.reqTab === k ? 'on' : ''}" data-act="reqTab" data-k="${k}">${l} <span>${n[k]}</span></button>`;
    return `<div class="toolbar"><div class="tabs">${tab('active', 'Active')}${tab('Closed', 'Closed')}${tab('all', 'All')}</div><span style="flex:1"></span>
      <button class="btn primary" data-act="newReq">${svg('M12 5v14M5 12h14')}New request</button></div>
      <div class="req-wrap ${sel ? 'has-sel' : ''}"><div class="req-list" id="req-list">${reqListHtml()}</div>
      <div class="card req-pane" id="req-pane">${sel ? `<div id="req-head">${reqHead(sel)}</div><div class="req-body" id="req-body">${reqBody(sel)}</div>
        <form class="composer" data-form="reqmsg" data-id="${sel.id}"><textarea name="text" rows="2" placeholder="Write a message. Press Enter to send." required></textarea><button class="btn primary">Send</button></form>`
        : `<div class="empty">Pick a request on the left, or raise a new one.<br><br><button class="btn primary" data-act="newReq">New request</button></div>`}</div></div>`;
  }
  // Update the list and thread in place so a half-typed message is never lost.
  function renderReqPartial() {
    const l = $('#req-list'), h = $('#req-head'), b = $('#req-body'), r = reqById(S.reqSel);
    if (!l || !r || !h || !b) { render(); return; }
    l.innerHTML = reqListHtml(); h.innerHTML = reqHead(r); b.innerHTML = reqBody(r); b.scrollTop = b.scrollHeight;
    const badge = document.querySelector('.nav a[data-r=requests] .count'); if (badge) badge.textContent = openReqCount();
  }
  function reqForm() {
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
      log(to === 'Closed' ? 'Closed request' : to === 'Open' ? 'Reopened request' : 'Request in progress', r.id + ' ' + r.title); save();
    }
    return true;
  }

  /* ---------- modal ---------- */
  function openModal(title, body) {
    $('#modal-root').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2 style="font-size:19px">${esc(title)}</h2><button class="x" data-act="close" aria-label="Close">✕</button></div>${body}</div></div>`;
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  /* ---------- actions ---------- */
  function stamp(a, text) { a.updatedAt = today(); a.updatedBy = S.user.name; a.history.push({ t: new Date().toISOString(), by: S.user.name, text }); }
  async function setWf(id, to) {
    const a = actById(id); a.wf = to; stamp(a, to === 'Submitted' ? 'Submitted for verification' : to === 'Verified' ? 'Verified' : 'Returned for correction');
    log(to === 'Submitted' ? 'Submitted activity' : to === 'Verified' ? 'Verified activity' : 'Returned activity', a.id + ' ' + a.title); save();
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
      S.user = null; S.route = 'dashboard'; S.reqSel = ''; try { sessionStorage.removeItem(SESS_KEY); sessionStorage.removeItem(ROUTE_KEY); } catch (e) { }
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
    addReview: () => reviewModal(),
    editReview: d => reviewModal(d.id),
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

  /* forms */
  document.addEventListener('submit', async e => {
    const form = e.target, kind = form.dataset.form; if (!kind) return; e.preventDefault();
    const fd = Object.fromEntries(new FormData(form)); const mode = e.submitter && e.submitter.value;
    const done = msg => { closeModal(); render(); toast(msg); };
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
    if (kind === 'review') {
      const id = form.dataset.id, r = id ? DB.reviews.find(x => x.id === id) : { id: nextId(DB.reviews, 'R') };
      Object.assign(r, { collegeId: fd.collegeId, date: fd.date, quarter: fd.quarter, minutes: fd.minutes, actions: fd.actions }); if (!id) DB.reviews.push(r);
      log(id ? 'Edited review' : 'Scheduled review', college(r.collegeId).name); save(); if (!await sync('reviews', r, !id)) return; return done('Review saved');
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
