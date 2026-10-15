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
  const KEY = 'hh-prototype-v1';
  const clone = o => JSON.parse(JSON.stringify(o));
  function load() { try { const x = localStorage.getItem(KEY); if (x) return JSON.parse(x); } catch (e) { } return clone(window.SEED); }
  let DB = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
  const nextId = (arr, p) => p + (arr.reduce((m, x) => Math.max(m, parseInt(String(x.id).slice(p.length)) || 0), 0) + 1);

  /* ---------- roles ---------- */
  const ALL_NAV = ['dashboard', 'colleges', 'homes', 'activities', 'calendar', 'followups', 'mous', 'documents', 'reports'];
  const ROLES = {
    college: { label: 'College Coordinator', nav: ['dashboard', 'activities', 'calendar', 'followups', 'documents', 'reports'] },
    home: { label: 'Welfare Home', nav: ['dashboard', 'activities', 'calendar', 'followups', 'documents'] },
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
    mous: ['MoU & Reviews', 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6'],
    documents: ['Documents', 'M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
    reports: ['Reports', 'M5 20V10M12 20V4M19 20v-7'],
    users: ['Users', 'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8'],
    logs: ['Audit Log', 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4']
  };
  const svg = (d, cls) => `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ''}><path d="${d}"/></svg>`;

  /* ---------- state ---------- */
  const S = { user: null, route: 'dashboard', cal: new Date(new Date().getFullYear(), new Date().getMonth(), 1), f: { q: '', college: '', status: '', wf: '' }, logQ: '', menu: false };

  function log(action, detail) {
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
  const TONE = { Completed: 't-green', Ongoing: 't-blue', Planned: 't-grey', Upcoming: 't-violet', Delayed: 't-red', Postponed: 't-amber', 'On Hold': 't-amber', Draft: 't-grey', Submitted: 't-blue', Verified: 't-green', Returned: 't-red', Active: 't-green', Expiring: 't-amber', Expired: 't-red', Held: 't-green', Scheduled: 't-violet', 'To schedule': 't-grey' };
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
    const items = r.nav.map(k => `<a data-act="nav" data-r="${k}" class="${S.route === k ? 'active' : ''}">${svg(NAV[k][1])}${NAV[k][0]}</a>`).join('');
    const who = S.user.role === 'college' ? college(S.user.collegeId).name : S.user.role === 'home' ? home(S.user.homeId).name : 'District Administration, Kozhikode';
    return `<div class="shell">
      <aside class="sidebar ${S.menu ? 'open' : ''}">
        <div class="brand"><img class="logo-img" src="assets/happy-hill-logo.png" alt="Happy Hill"></div>
        <nav class="nav">${items}</nav>
        <div class="side-foot">
          <img class="logo-img" src="assets/district-logo.png" alt="District Administration Kozhikode">
          <span class="small muted">Nammude Kozhikode Initiative</span>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <button class="btn menu-btn" data-act="menu" aria-label="Menu">${svg('M4 6h16M4 12h16M4 18h16')}</button>
          <div class="grow"><h1>${NAV[S.route][0]}</h1><div class="muted small">${esc(who)}</div></div>
          <div class="user-chip"><div class="avatar">${esc(S.user.name.split(' ').map(w => w[0]).slice(0, 2).join(''))}</div><div><b>${esc(S.user.name)}</b><span>${r.label}</span></div></div>
          <button class="btn" data-act="logout">Sign out</button>
        </div>
        <div id="view">${view()}</div>
      </main>
    </div>`;
  }
  function view() {
    return ({ dashboard, colleges: collegesV, homes: homesV, activities: activitiesV, calendar: calendarV, followups: followupsV, mous: mousV, documents: documentsV, reports: reportsV, users: usersV, logs: logsV })[S.route]();
  }
  function go(r) { if (!ROLES[S.user.role].nav.includes(r)) r = 'dashboard'; S.route = r; S.menu = false; render(); window.scrollTo(0, 0); }

  /* ---------- login ---------- */
  function loginView() {
    const demo = [['u1', 'Super Admin', 'Everything, including the audit log'], ['u2', 'Admin / Intern', 'Manage data, verify, users'], ['u3', 'District Administration', 'All options, all colleges'], ['u4', 'College Coordinator', 'Own college and home only'], ['u6', 'Welfare Home', 'Own home, confirm activities']];
    return `<div class="login">
      <section class="login-art">
        <div class="badge"><img src="assets/district-logo.png" alt=""><span>District Administration<br>Kozhikode</span></div>
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
        <div class="muted small" style="margin-top:22px">Prototype preview — pick a role to explore:</div>
        <div class="role-grid">${demo.map(d => `<button class="role-card" data-act="loginAs" data-u="${d[0].toUpperCase()}"><b>${d[1]}</b><span>${d[2]}</span></button>`).join('')}</div>
        <div class="note">Sample data only. Real sign-in and the Google Sheets connection come in the next phase.</div>
        <a class="small" style="margin-top:12px;cursor:pointer" data-act="reset">Reset sample data</a>
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
    return `<div class="grid g-kpi">
      ${isStaff() ? kpi(DB.colleges.length, 'Partner colleges', 't-green', NAV.colleges[1]) + kpi(DB.homes.length, 'Welfare homes', 't-brown', NAV.homes[1]) : ''}
      ${kpi(c.total, 'Activities planned', 't-blue', NAV.activities[1])}
      ${kpi(c.Completed, 'Completed', 't-green', 'M5 13l4 4L19 7')}
      ${kpi(c.pending, 'Pending', 't-amber', NAV.followups[1])}
      ${kpi(c.Delayed, 'Delayed', 't-red', 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z')}
    </div>
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
    ${DB.users.map(u => `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${ROLES[u.role].label}</td><td>${u.collegeId ? esc(college(u.collegeId).name) : u.homeId ? esc(home(u.homeId).name) : '—'}</td><td>${chip(u.active ? 'Active' : 'Expired').replace('Expired', 'Disabled')}</td><td>${u.role === 'superadmin' && S.user.role !== 'superadmin' ? '' : `<button class="btn sm" data-act="toggleUser" data-id="${u.id}">${u.active ? 'Disable' : 'Enable'}</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
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

  /* ---------- modal ---------- */
  function openModal(title, body) {
    $('#modal-root').innerHTML = `<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2 style="font-size:19px">${esc(title)}</h2><button class="x" data-act="close" aria-label="Close">✕</button></div>${body}</div></div>`;
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  /* ---------- actions ---------- */
  function stamp(a, text) { a.updatedAt = today(); a.updatedBy = S.user.name; a.history.push({ t: new Date().toISOString(), by: S.user.name, text }); }
  function setWf(id, to) {
    const a = actById(id); a.wf = to; stamp(a, to === 'Submitted' ? 'Submitted for verification' : to === 'Verified' ? 'Verified' : 'Returned for correction');
    log(to === 'Submitted' ? 'Submitted activity' : to === 'Verified' ? 'Verified activity' : 'Returned activity', a.id + ' ' + a.title); save(); closeModal(); render(); toast('Activity ' + to.toLowerCase());
  }
  const A = {
    nav: d => go(d.r),
    menu: () => { S.menu = !S.menu; render(); },
    logout: () => { log('Signed out'); S.user = null; render(); },
    loginAs: d => { S.user = DB.users.find(u => u.id === d.u); S.route = 'dashboard'; log('Signed in'); render(); },
    reset: () => { DB = clone(window.SEED); save(); toast('Sample data reset'); },
    close: () => closeModal(),
    overlay: (d, el, e) => { if (e.target === el) closeModal(); },
    openAct: d => actDetail(d.id),
    newAct: () => actForm(),
    editAct: d => actForm(d.id),
    wf: d => setWf(d.id, d.to),
    homeConfirm: d => { const a = actById(d.id); a.homeConfirmed = true; stamp(a, 'Confirmed as held by welfare home'); log('Home confirmed activity', a.id + ' ' + a.title); save(); closeModal(); render(); toast('Thank you — confirmed'); },
    addFollow: d => followModal(d.id),
    doneFollow: d => { const f = DB.followups.find(x => x.id === d.id); f.done = true; log('Closed follow-up', f.id); save(); render(); },
    calPrev: () => { S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() - 1, 1); render(); },
    calNext: () => { S.cal = new Date(S.cal.getFullYear(), S.cal.getMonth() + 1, 1); render(); },
    calToday: () => { const n = new Date(); S.cal = new Date(n.getFullYear(), n.getMonth(), 1); render(); },
    filterBy: d => { S.f = { q: '', college: d.k === 'college' ? d.id : DB.homes.find(h => h.id === d.id).collegeId, status: '', wf: '' }; go('activities'); },
    entity: (d, el, e) => { e.stopPropagation(); entityModal(d.k, d.id); },
    editMou: d => mouModal(d.id),
    addReview: () => reviewModal(),
    editReview: d => reviewModal(d.id),
    addUser: () => userModal(),
    toggleUser: d => { const u = DB.users.find(x => x.id === d.id); u.active = !u.active; log(u.active ? 'Enabled user' : 'Disabled user', u.name); save(); render(); },
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
  document.addEventListener('submit', e => {
    const form = e.target, kind = form.dataset.form; if (!kind) return; e.preventDefault();
    const fd = Object.fromEntries(new FormData(form)); const mode = e.submitter && e.submitter.value;
    if (kind === 'login') {
      const u = DB.users.find(x => x.email.toLowerCase() === (fd.email || '').trim().toLowerCase() && x.active);
      if (!u) return toast('No active account with that email');
      S.user = u; S.route = 'dashboard'; log('Signed in'); return render();
    }
    if (kind === 'act') {
      const id = form.dataset.id, c = DB.colleges.find(x => x.id === fd.collegeId); if (!c) return toast('Choose a college');
      const a = id ? actById(id) : { id: nextId(DB.activities, 'A'), wf: 'Draft', history: [{ t: new Date().toISOString(), by: S.user.name, text: 'Activity created' }] };
      Object.assign(a, { title: fd.title.trim(), desc: fd.desc, collegeId: c.id, homeId: c.homeId, planned: fd.planned, actual: fd.actual, status: fd.status, coordinator: fd.coordinator, outcome: fd.outcome, evidence: fd.evidence, challenges: fd.challenges, nextAction: fd.nextAction, followUp: !!fd.followUp });
      if (fd.status === 'Completed' && !a.actual) a.actual = a.planned;
      if (id) stamp(a, 'Edited'); else { a.updatedAt = today(); a.updatedBy = S.user.name; DB.activities.push(a); }
      if (mode === 'submit') { a.wf = 'Submitted'; stamp(a, 'Submitted for verification'); }
      if (mode === 'verify') { a.wf = 'Verified'; stamp(a, 'Verified'); }
      if (id && a.wf === 'Returned' && mode === 'save') a.wf = 'Returned';
      log((id ? 'Edited' : 'Created') + ' activity' + (mode === 'submit' ? ' and submitted' : mode === 'verify' ? ' and verified' : ''), a.id + ' ' + a.title);
      save(); closeModal(); render(); return toast('Activity saved');
    }
    if (kind === 'follow') {
      const a = actById(form.dataset.id); DB.followups.push({ id: nextId(DB.followups, 'F'), activityId: a.id, reason: fd.reason, action: fd.action, owner: fd.owner, due: fd.due, done: false });
      a.followUp = true; stamp(a, 'Follow-up added'); log('Added follow-up', a.id + ' ' + a.title); save(); closeModal(); render(); return toast('Follow-up saved');
    }
    if (kind === 'entity') {
      const isC = form.dataset.k === 'college', arr = isC ? DB.colleges : DB.homes, id = form.dataset.id;
      const o = id ? arr.find(x => x.id === id) : { id: nextId(arr, isC ? 'C' : 'H') };
      o.name = fd.name; o.phone = fd.phone; o.email = fd.email;
      if (isC) { o.coordinator = fd.person; o.homeId = fd.link; o.target = +fd.target || 0; if (o.homeId) { const h = DB.homes.find(x => x.id === o.homeId); if (h) h.collegeId = o.id; } }
      else { o.head = fd.person; o.collegeId = fd.link; if (o.collegeId) { const c = DB.colleges.find(x => x.id === o.collegeId); if (c) c.homeId = o.id; } }
      if (!id) arr.push(o);
      log((id ? 'Edited ' : 'Added ') + (isC ? 'college' : 'welfare home'), o.name); save(); closeModal(); render(); return toast('Saved');
    }
    if (kind === 'mou') { const m = DB.mous.find(x => x.id === form.dataset.id); Object.assign(m, { start: fd.start, end: fd.end, renewal: fd.renewal }); log('Updated MoU', college(m.collegeId).name); save(); closeModal(); render(); return toast('MoU updated'); }
    if (kind === 'review') {
      const id = form.dataset.id, r = id ? DB.reviews.find(x => x.id === id) : { id: nextId(DB.reviews, 'R') };
      Object.assign(r, { collegeId: fd.collegeId, date: fd.date, quarter: fd.quarter, minutes: fd.minutes, actions: fd.actions }); if (!id) DB.reviews.push(r);
      log(id ? 'Edited review' : 'Scheduled review', college(r.collegeId).name); save(); closeModal(); render(); return toast('Review saved');
    }
    if (kind === 'user') {
      const u = { id: nextId(DB.users, 'U'), name: fd.name, email: fd.email, role: fd.role, active: true };
      if (fd.link && fd.link.startsWith('c:')) u.collegeId = fd.link.slice(2); if (fd.link && fd.link.startsWith('h:')) u.homeId = fd.link.slice(2);
      if (u.role === 'college' && !u.collegeId) return toast('Pick a college for this coordinator');
      if (u.role === 'home' && !u.homeId) return toast('Pick a welfare home for this user');
      DB.users.push(u); log('Added user', u.name + ' (' + ROLES[u.role].label + ')'); save(); closeModal(); render(); return toast('User added');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  render();
})();
