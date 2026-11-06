/**
 * @OnlyCurrentDoc
 * Happy Hill Tracker - Google Apps Script backend.
 * Bound to the Google Sheet that stores the data. Deploy as a Web app
 * (Execute as: Me, Who has access: Anyone) and paste the URL into js/config.js.
 * The sheet itself stays private; every read/write goes through the checks below.
 */
var DEFAULT_PASSWORD = 'NK@12345';
var SESSION_SECONDS = 43200;          // 12 hours; sessions are signed tokens, so they survive page refreshes and cache clean-ups
var MAX_FAILS = 5;                    // failed sign-ins before a 15 minute lock

var STAFF = ['district', 'admin', 'superadmin'];

var T = {
  users:      { sheet: 'Users', prefix: 'U', cols: ['id', 'name', 'email', 'role', 'collegeId', 'homeId', 'active', 'passHash', 'salt', 'mustChange'], bool: ['active', 'mustChange'] },
  colleges:   { sheet: 'Colleges', prefix: 'C', cols: ['id', 'name', 'coordinator', 'phone', 'email', 'homeId', 'target'], num: ['target'] },
  homes:      { sheet: 'Homes', prefix: 'H', cols: ['id', 'name', 'head', 'phone', 'email', 'collegeId'] },
  activities: { sheet: 'Activities', prefix: 'A', cols: ['id', 'title', 'desc', 'collegeId', 'homeId', 'planned', 'actual', 'status', 'wf', 'coordinator', 'outcome', 'evidence', 'challenges', 'nextAction', 'followUp', 'homeConfirmed', 'updatedBy', 'updatedAt', 'history'], bool: ['followUp', 'homeConfirmed'], json: ['history'] },
  followups:  { sheet: 'Followups', prefix: 'F', cols: ['id', 'activityId', 'reason', 'action', 'owner', 'due', 'done'], bool: ['done'] },
  mous:       { sheet: 'MoUs', prefix: 'M', cols: ['id', 'collegeId', 'homeId', 'start', 'end', 'renewal', 'history'], json: ['history'] },
  meetings:   { sheet: 'Meetings', prefix: 'E', cols: ['id', 'title', 'type', 'date', 'time', 'venue', 'agenda', 'collegeIds', 'homeIds', 'status', 'minutes', 'actions', 'seriesId', 'createdBy', 'createdAt'] },
  files:      { sheet: 'Files', prefix: 'X', cols: ['id', 'kind', 'activityId', 'meetingId', 'collegeId', 'homeId', 'name', 'mime', 'size', 'driveId', 'thumbId', 'caption', 'consent', 'status', 'uploadedBy', 'uploadedAt', 'approvedBy'], bool: ['consent'], num: ['size'] },
  updates:    { sheet: 'Updates', prefix: 'P', cols: ['id', 'at', 'type', 'text', 'collegeIds', 'homeIds', 'actor'] },
  resources:  { sheet: 'Resources', prefix: 'D', cols: ['id', 'title', 'kind', 'url'] },
  requests:   { sheet: 'Requests', prefix: 'Q', cols: ['id', 'collegeId', 'homeId', 'type', 'title', 'details', 'specifics', 'priority', 'neededBy', 'activityId', 'status', 'raisedBy', 'raisedRole', 'createdAt', 'updatedAt', 'closedBy', 'closedAt', 'closeNote'] },
  messages:   { sheet: 'Messages', prefix: 'G', cols: ['id', 'requestId', 'by', 'role', 'at', 'kind', 'text'] }
};
var REQ_TYPES = ['Material', 'Session', 'Intervention', 'Attention', 'Other'];
var MEETING_TYPES = ['Quarterly review', 'Monthly assessment', 'Other'];
var MEETING_STATUS = ['Scheduled', 'Held', 'Cancelled'];
var ACT_STATUS = ['Planned', 'Ongoing', 'Completed', 'Postponed', 'On Hold'];
var FILE_MAX = 5.5 * 1024 * 1024;            // 5.5 MB per file (photos are shrunk by the browser before upload)
var PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
var DOC_MIME = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'].concat(PHOTO_MIME);
function isAdminRole_(r) { return r === 'admin' || r === 'superadmin'; }
function splitIds_(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; }); }
var LOG_COLS = ['t', 'user', 'role', 'action', 'detail'];
var SETTINGS_COLS = ['key', 'value'];

/* ------------------------------------------------------------------ */
/* Web app entry points                                                */
/* ------------------------------------------------------------------ */
function doGet() { return json_({ ok: true, service: 'Happy Hill Tracker API' }); }

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    return json_(route_(req));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function route_(req) {
  var a = req.action;
  if (a === 'login') return login_(req);
  var user = auth_(req.token);
  if (a === 'bootstrap') return { ok: true, user: publicUser_(user), data: bootstrap_(user) };
  if (a === 'logout') { addLog_(user, 'Signed out', ''); return { ok: true }; }
  if (a === 'changePassword') return changePassword_(user, req);
  if (a === 'resetPassword') return resetPassword_(user, req);
  if (a === 'save') return withLock_(function () { return save_(user, req); });
  if (a === 'upload') return withLock_(function () { return upload_(user, req); });
  if (a === 'fileData') return fileData_(user, req);
  if (a === 'fileStatus') return withLock_(function () { return fileStatus_(user, req); });
  if (a === 'fileDelete') return withLock_(function () { return fileDelete_(user, req); });
  throw new Error('Unknown action');
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */
function hash_(salt, pw) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pw, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function newSalt_() { return Utilities.getUuid().replace(/-/g, ''); }

function login_(req) {
  var email = String(req.email || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var failKey = 'f_' + email;
  if (Number(cache.get(failKey) || 0) >= MAX_FAILS) throw new Error('Too many attempts. Try again in 15 minutes.');
  var user = readAll_('users').filter(function (u) { return u.email.toLowerCase() === email; })[0];
  if (!user || !user.active || hash_(user.salt, String(req.password || '')) !== user.passHash) {
    cache.put(failKey, String(Number(cache.get(failKey) || 0) + 1), 900);
    Utilities.sleep(400);
    throw new Error('Incorrect email or password');
  }
  cache.remove(failKey);
  var token = makeToken_(user);
  addLog_(user, 'Signed in', '');
  return { ok: true, token: token, mustChange: !!user.mustChange, user: publicUser_(user) };
}

/* Sessions are signed tokens (HMAC), not cache entries, so a refresh or a cache clean-up never logs anyone out.
   A token stops working when it expires, when the user is disabled, or when their password changes or is reset. */
function secret_() {
  var props = PropertiesService.getScriptProperties(), s = props.getProperty('HH_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('HH_SECRET', s); }
  return s;
}
function sign_(payload) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret_())); }
function makeToken_(user) {
  var p64 = Utilities.base64EncodeWebSafe(user.id + '|' + (Date.now() + SESSION_SECONDS * 1000) + '|' + String(user.passHash).slice(0, 10));
  return p64 + '.' + sign_(p64);
}
function auth_(token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) throw new Error('AUTH');
  var f = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString().split('|');
  if (Number(f[1]) < Date.now()) throw new Error('AUTH');
  var user = readAll_('users').filter(function (u) { return u.id === f[0]; })[0];
  if (!user || !user.active || String(user.passHash).slice(0, 10) !== f[2]) throw new Error('AUTH');
  return user;
}

function publicUser_(u) { return { id: u.id, name: u.name, email: u.email, role: u.role, collegeId: u.collegeId, homeId: u.homeId, active: u.active, mustChange: u.mustChange }; }

function changePassword_(user, req) {
  var np = String(req.newPassword || '');
  if (np.length < 8) throw new Error('New password must be at least 8 characters');
  if (np === DEFAULT_PASSWORD) throw new Error('Choose a password different from the default');
  if (hash_(user.salt, String(req.oldPassword || '')) !== user.passHash) throw new Error('Current password is incorrect');
  return withLock_(function () {
    var salt = newSalt_();
    var newHash = hash_(salt, np);
    updateUser_(user.id, { salt: salt, passHash: newHash, mustChange: false });
    addLog_(user, 'Changed own password', '');
    return { ok: true, token: makeToken_({ id: user.id, passHash: newHash }) };   // the old token stops working, so hand back a fresh one
  });
}

function resetPassword_(actor, req) {
  if (['admin', 'superadmin'].indexOf(actor.role) < 0) throw new Error('Not allowed');
  return withLock_(function () {
    var target = readAll_('users').filter(function (u) { return u.id === req.userId; })[0];
    if (!target) throw new Error('User not found');
    if (target.role === 'superadmin' && actor.role !== 'superadmin') throw new Error('Not allowed');
    var salt = newSalt_();
    updateUser_(target.id, { salt: salt, passHash: hash_(salt, DEFAULT_PASSWORD), mustChange: true });
    addLog_(actor, 'Reset password', target.name);
    return { ok: true };
  });
}

function updateUser_(id, patch) {
  var row = findRow_('users', id), t = T.users, sh = sheet_('users');
  var cur = rowObj_(t, sh.getRange(row, 1, 1, t.cols.length).getValues()[0]);
  Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
  writeRow_('users', row, cur);
}

/* ------------------------------------------------------------------ */
/* Reading data (scoped to the signed-in user)                         */
/* ------------------------------------------------------------------ */
function bootstrap_(user) {
  var d = {
    colleges: readAll_('colleges'), homes: readAll_('homes'), activities: readAll_('activities'), followups: readAll_('followups'),
    mous: readAll_('mous'), meetings: readAll_('meetings'), files: readAll_('files'), updates: readAll_('updates').slice(-300), resources: readAll_('resources'), requests: readAll_('requests'), messages: readAll_('messages'), settings: readSettings_(), users: [], logs: []
  };
  if (user.role === 'college') {
    d.colleges = d.colleges.filter(function (c) { return c.id === user.collegeId; });
    d.homes = d.homes.filter(function (h) { return h.collegeId === user.collegeId; });
    d.activities = d.activities.filter(function (a) { return a.collegeId === user.collegeId; });
    d.mous = d.mous.filter(function (m) { return m.collegeId === user.collegeId; });
  } else if (user.role === 'home') {
    d.homes = d.homes.filter(function (h) { return h.id === user.homeId; });
    d.colleges = d.colleges.filter(function (c) { return c.homeId === user.homeId; });
    d.activities = d.activities.filter(function (a) { return a.homeId === user.homeId; });
    d.mous = d.mous.filter(function (m) { return m.homeId === user.homeId; });
  }
  if (user.role === 'college' || user.role === 'home') {
    d.meetings = d.meetings.filter(function (m) { return meetingHas_(m, user); });
    d.updates = d.updates.filter(function (u) { return user.role === 'college' ? splitIds_(u.collegeIds).indexOf(user.collegeId) >= 0 : splitIds_(u.homeIds).indexOf(user.homeId) >= 0; });
  }
  var mmap = {};
  d.meetings.forEach(function (m) { mmap[m.id] = m; });
  d.files = d.files.filter(function (f) { return f.status !== 'Deleted' && canViewFile_(user, f, mmap); }).map(function (f) { delete f.driveId; delete f.thumbId; return f; });
  d.updates.reverse();
  var ids = {};
  d.activities.forEach(function (a) { ids[a.id] = true; });
  d.followups = d.followups.filter(function (f) { return ids[f.activityId]; });
  d.requests = d.requests.filter(function (r) { return canSeeRequest_(user, r); });
  var rids = {};
  d.requests.forEach(function (r) { rids[r.id] = true; });
  d.messages = d.messages.filter(function (m) { return rids[m.requestId]; });
  if (user.role === 'admin' || user.role === 'superadmin') d.users = readAll_('users').map(publicUser_);
  if (user.role === 'superadmin') d.logs = readLogs_(500);
  return d;
}

/* ------------------------------------------------------------------ */
/* Writing data                                                        */
/* ------------------------------------------------------------------ */
function save_(user, req) {
  var key = req.table, t = T[key];
  if (!t) throw new Error('Unknown table');
  var incoming = req.row || {}, isNew = !!req.isNew, existing = null, row = 0;
  if (!isNew) {
    row = findRow_(key, incoming.id);
    existing = rowObj_(t, sheet_(key).getRange(row, 1, 1, t.cols.length).getValues()[0]);
  }
  var out = authorize_(user, key, existing, incoming);
  var action;
  if (isNew) { out.id = nextId_(key); row = sheet_(key).getLastRow() + 1; action = 'Created'; }
  else { out.id = existing.id; action = 'Edited'; }
  writeRow_(key, row, out);
  if (key === 'messages') touchRequest_(out.requestId, out.at);
  if (key === 'requests' && existing) {
    action = out.status === 'Closed' ? 'Closed' : existing.status === 'Closed' ? 'Reopened' : 'Started';
    addStatusMessage_(out, user);
  }

  saveHooks_(user, key, existing, out);
  var label = String(out.title || out.name || out.reason || out.quarter || out.text || out.id).slice(0, 80);
  if (key === 'activities' && existing && existing.wf !== out.wf) action = { Submitted: 'Submitted', Verified: 'Verified', Returned: 'Returned', Draft: 'Edited' }[out.wf] || 'Edited';
  if (key === 'activities' && existing && !existing.homeConfirmed && out.homeConfirmed) action = 'Home confirmed';
  if (key === 'followups' && existing && !existing.done && out.done) action = 'Closed';
  if (key === 'users' && existing && existing.active !== out.active) action = out.active ? 'Enabled' : 'Disabled';
  addLog_(user, action + ' ' + singular_(key), out.id + ' ' + label);
  return { ok: true, row: key === 'users' ? publicUser_(out) : out };
}

function singular_(k) { return { requests: 'request', messages: 'message', users: 'user', colleges: 'college', homes: 'welfare home', activities: 'activity', followups: 'follow-up', mous: 'MoU', meetings: 'meeting', resources: 'resource' }[k]; }

function authorize_(user, key, existing, inc) {
  var role = user.role, isStaff = STAFF.indexOf(role) >= 0, now = today_();
  var out = {};
  T[key].cols.forEach(function (c) { out[c] = inc[c] != null ? inc[c] : (existing ? existing[c] : ''); });

  var isAdmin = isAdminRole_(role);
  if (key === 'activities') {
    function copyOf(o) { var k = {}; Object.keys(o).forEach(function (x) { k[x] = o[x]; }); return k; }
    if (role === 'college') {
      if (!existing) {
        if (inc.collegeId !== user.collegeId) throw new Error('Not allowed: other college');
        if (['Draft', 'Submitted'].indexOf(out.wf) < 0) throw new Error('Not allowed: review state');
        out.homeConfirmed = false;
      } else {
        if (existing.collegeId !== user.collegeId) throw new Error('Not allowed: other college');
        if (['Draft', 'Returned'].indexOf(existing.wf) >= 0) {
          if (inc.collegeId !== user.collegeId) throw new Error('Not allowed: other college');
          if (['Draft', 'Returned', 'Submitted'].indexOf(out.wf) < 0) throw new Error('Not allowed: review state');
          out.homeConfirmed = existing.homeConfirmed;
        } else {
          // Submitted or Verified: the details are locked, but the coordinator can move the status on (for example to Completed).
          if (ACT_STATUS.indexOf(inc.status) < 0) throw new Error('Choose a valid status');
          var kc = copyOf(existing);
          if (inc.status !== existing.status) {
            kc.status = inc.status;
            if (inc.status === 'Completed') {
              kc.actual = /^\d{4}-\d{2}-\d{2}$/.test(String(inc.actual || '')) ? String(inc.actual) : now;
              var oc = String(inc.outcome || '').trim() || String(existing.outcome || '').trim();
              if (!oc) throw new Error('Add a short outcome before marking it completed');
              kc.outcome = oc.slice(0, 2000);
            }
            if (existing.wf === 'Verified') { kc.wf = 'Submitted'; kc.homeConfirmed = false; }   // a change after verification needs verifying again
          }
          kc.history = inc.history || existing.history;
          out = kc;
        }
      }
    } else if (role === 'home') {
      if (!existing || existing.homeId !== user.homeId || existing.wf !== 'Submitted') throw new Error('Not allowed');
      var keep = copyOf(existing);
      keep.homeConfirmed = true; keep.history = inc.history || existing.history;
      out = keep;
    } else if (role === 'district') {
      if (!existing || existing.wf !== 'Submitted' || ['Verified', 'Returned'].indexOf(inc.wf) < 0) throw new Error('The District can verify or return submitted activities only');
      var kd = copyOf(existing);
      kd.wf = inc.wf; kd.history = inc.history || existing.history;
      out = kd;
    } else if (!isAdmin) throw new Error('Not allowed');
    var c = readAll_('colleges').filter(function (x) { return x.id === out.collegeId; })[0];
    if (!c) throw new Error('College not found');
    out.homeId = c.homeId;
    out.updatedBy = user.name; out.updatedAt = now;
    return out;
  }
  if (key === 'requests') {
    var nowIso = new Date().toISOString();
    if (!existing) {
      if (role === 'college') throw new Error('Colleges attend requests; your welfare home or the District raises them');
      var cols = readAll_('colleges'), col;
      if (role === 'home') col = cols.filter(function (c) { return c.homeId === user.homeId; })[0];
      else col = cols.filter(function (c) { return c.id === inc.collegeId; })[0];
      if (!col) throw new Error('College not found');
      var title = String(inc.title || '').trim(), details = String(inc.details || '').trim();
      if (!title || !details) throw new Error('Subject and details are required');
      if (REQ_TYPES.indexOf(inc.type) < 0) throw new Error('Choose a type of request');
      return {
        id: '', collegeId: col.id, homeId: col.homeId, type: inc.type, title: title.slice(0, 120), details: details.slice(0, 2000),
        specifics: String(inc.specifics || '').trim().slice(0, 200), priority: inc.priority === 'Urgent' ? 'Urgent' : 'Normal',
        neededBy: String(inc.neededBy || ''), activityId: String(inc.activityId || ''), status: 'Open',
        raisedBy: user.name, raisedRole: role, createdAt: nowIso, updatedAt: nowIso, closedBy: '', closedAt: '', closeNote: ''
      };
    }
    if (!canSeeRequest_(user, existing)) throw new Error('Not allowed');
    var to = inc.status;
    if (['Open', 'In progress', 'Closed'].indexOf(to) < 0 || to === existing.status) throw new Error('No change to make');
    if (to === 'In progress' && existing.status !== 'Open') throw new Error('Only an open request can be started');
    var provider = role === 'college' || isAdmin;      // the college (or Admin) attends a request; the District only oversees
    if (to === 'In progress' && !provider) throw new Error('Only the college or Admin can start work on a request');
    if (to === 'Closed' && !provider && !(role === 'home' && existing.raisedRole === 'home')) throw new Error('Only the college or Admin can close this request');
    if (to === 'Open' && !provider && role !== 'district' && !(role === 'home' && existing.raisedRole === 'home')) throw new Error('Not allowed');
    var upd = {}; Object.keys(existing).forEach(function (k) { upd[k] = existing[k]; });
    upd.status = to; upd.updatedAt = nowIso;
    if (to === 'Closed') {
      var note = String(inc.closeNote || '').trim();
      if (!note) throw new Error('Add a short closing note');
      upd.closedBy = user.name; upd.closedAt = nowIso; upd.closeNote = note.slice(0, 500);
    } else if (existing.status === 'Closed') { upd.closedBy = ''; upd.closedAt = ''; upd.closeNote = ''; }
    return upd;
  }
  if (key === 'messages') {
    if (existing) throw new Error('Messages cannot be edited');
    var rq = readAll_('requests').filter(function (r) { return r.id === inc.requestId; })[0];
    if (!rq || !canSeeRequest_(user, rq)) throw new Error('Not allowed');
    var text = String(inc.text || '').trim();
    if (!text) throw new Error('Write a message first');
    return { id: '', requestId: rq.id, by: user.name, role: role, at: new Date().toISOString(), kind: 'message', text: text.slice(0, 1000) };
  }
  if (key === 'followups') {
    if (!(isAdmin || role === 'college')) throw new Error('Not allowed');
    var act = readAll_('activities').filter(function (a) { return a.id === out.activityId; })[0];
    if (!act) throw new Error('Activity not found');
    if (role === 'college' && act.collegeId !== user.collegeId) throw new Error('Not allowed: other college');
    return out;
  }
  if (key === 'users') {
    if (['admin', 'superadmin'].indexOf(role) < 0) throw new Error('Not allowed');
    if (role !== 'superadmin' && (out.role === 'superadmin' || (existing && existing.role === 'superadmin'))) throw new Error('Only the Super Admin can manage that account');
    if (['college', 'home', 'district', 'admin', 'superadmin'].indexOf(out.role) < 0) throw new Error('Invalid role');
    out.email = String(out.email).trim().toLowerCase();
    if (!out.email || !out.name) throw new Error('Name and email are required');
    var clash = readAll_('users').filter(function (u) { return u.email.toLowerCase() === out.email && (!existing || u.id !== existing.id); })[0];
    if (clash) throw new Error('That email is already in use');
    if (existing) { out.passHash = existing.passHash; out.salt = existing.salt; out.mustChange = existing.mustChange; }
    else { out.salt = newSalt_(); out.passHash = hash_(out.salt, DEFAULT_PASSWORD); out.mustChange = true; out.active = true; }
    return out;
  }
  if (key === 'meetings') {
    if (!isStaff) throw new Error('Not allowed');
    var allC = readAll_('colleges').map(function (x) { return x.id; }), allH = readAll_('homes').map(function (x) { return x.id; });
    var cIds = splitIds_(inc.collegeIds).filter(function (x) { return allC.indexOf(x) >= 0; }), hIds = splitIds_(inc.homeIds).filter(function (x) { return allH.indexOf(x) >= 0; });
    if (!cIds.length && !hIds.length) throw new Error('Choose who should attend');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(inc.date || ''))) throw new Error('Choose a date');
    var mt = MEETING_TYPES.indexOf(inc.type) >= 0 ? inc.type : 'Other';
    var ms = existing ? (MEETING_STATUS.indexOf(inc.status) >= 0 ? inc.status : existing.status) : 'Scheduled';
    var mo = existing ? JSON.parse(JSON.stringify(existing)) : { id: '', minutes: '', actions: '', createdBy: user.name, createdAt: new Date().toISOString(), seriesId: String(inc.seriesId || '').slice(0, 40) };
    mo.title = (String(inc.title || '').trim() || mt).slice(0, 120); mo.type = mt; mo.date = String(inc.date); mo.time = String(inc.time || '').slice(0, 20);
    mo.venue = String(inc.venue || '').slice(0, 160); mo.agenda = String(inc.agenda || '').slice(0, 1500);
    mo.collegeIds = cIds.join(','); mo.homeIds = hIds.join(','); mo.status = ms;
    if (isAdmin) { if (inc.minutes != null) mo.minutes = String(inc.minutes).slice(0, 6000); if (inc.actions != null) mo.actions = String(inc.actions).slice(0, 3000); }
    return mo;
  }
  // colleges, homes, mous, resources: Admin and Super Admin only
  if (!isAdmin) throw new Error('Not allowed');
  return out;
}

function meetingHas_(m, user) {
  if (STAFF.indexOf(user.role) >= 0) return true;
  if (user.role === 'college') return splitIds_(m.collegeIds).indexOf(user.collegeId) >= 0;
  if (user.role === 'home') return splitIds_(m.homeIds).indexOf(user.homeId) >= 0;
  return false;
}
function addUpdate_(user, type, text, collegeIds, homeIds) {
  try {
    writeRow_('updates', sheet_('updates').getLastRow() + 1, { id: nextId_('updates'), at: new Date().toISOString(), type: type, text: String(text).slice(0, 240), collegeIds: collegeIds || '', homeIds: homeIds || '', actor: user ? user.name : '' });
  } catch (e) { }
}
function fmtDate_(d) { var p = String(d).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; }
function saveHooks_(user, key, existing, out) {
  if (key === 'activities' && existing) {
    if (existing.wf !== out.wf && (out.wf === 'Verified' || out.wf === 'Returned')) addUpdate_(user, 'activity', 'Activity ' + (out.wf === 'Verified' ? 'verified' : 'returned for correction') + ': ' + out.title, out.collegeId, out.homeId);
    if (existing.status !== out.status && out.status === 'Completed') addUpdate_(user, 'activity', 'Activity completed: ' + out.title, out.collegeId, out.homeId);
  }
  if (key === 'requests' && existing && out.status === 'Closed' && existing.status !== 'Closed') addUpdate_(user, 'request', 'Request closed: ' + out.title, out.collegeId, out.homeId);
  if (key === 'meetings') {
    if (!existing) addUpdate_(user, 'meeting', 'Meeting scheduled: ' + out.title + ' on ' + fmtDate_(out.date) + (out.time ? ' at ' + out.time : ''), out.collegeIds, out.homeIds);
    else if (existing.status !== out.status) addUpdate_(user, 'meeting', 'Meeting ' + out.status.toLowerCase() + ': ' + out.title + ' (' + fmtDate_(out.date) + ')', out.collegeIds, out.homeIds);
    else if (existing.date !== out.date || existing.time !== out.time) addUpdate_(user, 'meeting', 'Meeting rescheduled: ' + out.title + ' now ' + fmtDate_(out.date) + (out.time ? ' at ' + out.time : ''), out.collegeIds, out.homeIds);
  }
  if (key === 'mous' && existing && existing.end !== out.end) {
    var col = readAll_('colleges').filter(function (c) { return c.id === out.collegeId; })[0];
    addUpdate_(user, 'mou', 'MoU renewed: ' + (col ? col.name : out.collegeId) + ', valid until ' + fmtDate_(out.end), out.collegeId, out.homeId);
  }
}

function canSeeRequest_(user, r) {
  if (STAFF.indexOf(user.role) >= 0) return true;
  if (user.role === 'college') return r.collegeId === user.collegeId;
  if (user.role === 'home') return r.homeId === user.homeId;
  return false;
}
function touchRequest_(id, at) {
  var row = findRow_('requests', id), t = T.requests;
  var cur = rowObj_(t, sheet_('requests').getRange(row, 1, 1, t.cols.length).getValues()[0]);
  cur.updatedAt = at;
  writeRow_('requests', row, cur);
}
function addStatusMessage_(req, user) {
  var text = req.status === 'Closed' ? 'closed the request: ' + req.closeNote : req.status === 'In progress' ? 'marked it in progress' : 'reopened the request';
  var id = nextId_('messages');
  writeRow_('messages', sheet_('messages').getLastRow() + 1, { id: id, requestId: req.id, by: user.name, role: user.role, at: req.updatedAt, kind: 'status', text: text });
}

/* ------------------------------------------------------------------ */
/* Files (photos and reports) are stored in a private Drive folder      */
/* ------------------------------------------------------------------ */
function folder_(name) {
  var props = PropertiesService.getScriptProperties(), key = 'HH_FOLDER_' + (name || 'ROOT'), id = props.getProperty(key), f = null;
  if (id) { try { f = DriveApp.getFolderById(id); } catch (e) { f = null; } }
  if (!f) {
    f = name ? folder_('').createFolder(name) : DriveApp.createFolder('Happy Hill Tracker Files');
    props.setProperty(key, f.getId());
  }
  return f;
}
function canViewFile_(user, f, mmap) {
  if (STAFF.indexOf(user.role) >= 0) return true;
  if (f.kind === 'report') { var m = mmap[f.meetingId]; return !!m && meetingHas_(m, user); }
  if (user.role === 'college') return f.collegeId === user.collegeId;
  if (user.role === 'home') return f.status === 'Approved' && f.homeId === user.homeId;
  return false;
}
function fileRow_(id) {
  var row = findRow_('files', id), t = T.files;
  return { row: row, f: rowObj_(t, sheet_('files').getRange(row, 1, 1, t.cols.length).getValues()[0]) };
}
function safeName_(s) { return String(s || 'file').replace(/[^\w.\- ()]/g, '_').slice(0, 100); }

function upload_(user, req) {
  var kind = req.kind === 'report' ? 'report' : 'photo', admin = isAdminRole_(user.role);
  var mime = String(req.mime || ''), name = safeName_(req.name);
  if ((kind === 'photo' ? PHOTO_MIME : DOC_MIME).indexOf(mime) < 0) throw new Error('This file type is not allowed');
  var act = null, mtg = null;
  if (kind === 'photo') {
    act = readAll_('activities').filter(function (a) { return a.id === req.activityId; })[0];
    if (!act) throw new Error('Activity not found');
    if (!(admin || (user.role === 'college' && act.collegeId === user.collegeId))) throw new Error('Not allowed');
    if (req.consent !== true) throw new Error('Please confirm the photo has consent and shows no identifiable residents');
  } else {
    if (!admin) throw new Error('Only Admin can add reports');
    mtg = readAll_('meetings').filter(function (m) { return m.id === req.meetingId; })[0];
    if (!mtg) throw new Error('Meeting not found');
  }
  var bytes = Utilities.base64Decode(String(req.data || ''));
  if (!bytes.length) throw new Error('The file is empty');
  if (bytes.length > FILE_MAX) throw new Error('The file is too large (limit 5 MB)');
  var folder = folder_(kind === 'photo' ? 'Photos' : 'Reports');
  var file = folder.createFile(Utilities.newBlob(bytes, mime, name));
  var thumbId = '';
  if (kind === 'photo' && req.thumb) {
    var tb = Utilities.base64Decode(String(req.thumb));
    if (tb.length && tb.length < 400 * 1024) thumbId = folder.createFile(Utilities.newBlob(tb, 'image/jpeg', 'thumb_' + name)).getId();
  }
  var row = {
    id: nextId_('files'), kind: kind, activityId: act ? act.id : '', meetingId: mtg ? mtg.id : '', collegeId: act ? act.collegeId : '', homeId: act ? act.homeId : '',
    name: name, mime: mime, size: bytes.length, driveId: file.getId(), thumbId: thumbId, caption: String(req.caption || '').slice(0, 200), consent: kind === 'photo',
    status: kind === 'report' || admin ? 'Approved' : 'Pending', uploadedBy: user.name, uploadedAt: new Date().toISOString(), approvedBy: kind === 'report' || admin ? user.name : ''
  };
  writeRow_('files', sheet_('files').getLastRow() + 1, row);
  addLog_(user, 'Uploaded ' + kind, row.id + ' ' + name);
  var pub = {}; Object.keys(row).forEach(function (k) { if (k !== 'driveId' && k !== 'thumbId') pub[k] = row[k]; });
  return { ok: true, file: pub };
}

function fileData_(user, req) {
  var r = fileRow_(req.id), f = r.f;
  var mmap = {}; if (f.kind === 'report') readAll_('meetings').forEach(function (m) { mmap[m.id] = m; });
  if (f.status === 'Deleted' || !canViewFile_(user, f, mmap)) throw new Error('Not allowed');
  var id = req.thumb && f.thumbId ? f.thumbId : f.driveId;
  var blob = DriveApp.getFileById(id).getBlob();
  return { ok: true, name: f.name, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

function trashFile_(f) {
  [f.driveId, f.thumbId].forEach(function (id) { if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { } } });
}

function fileStatus_(user, req) {
  if (!isAdminRole_(user.role)) throw new Error('Only Admin can approve photos');
  var r = fileRow_(req.id), f = r.f, to = req.status === 'Approved' ? 'Approved' : req.status === 'Rejected' ? 'Rejected' : '';
  if (!to) throw new Error('Choose approve or reject');
  f.status = to; f.approvedBy = user.name;
  if (to === 'Rejected') trashFile_(f);
  writeRow_('files', r.row, f);
  addLog_(user, to + ' photo', f.id + ' ' + f.name);
  if (to === 'Approved' && f.kind === 'photo') addUpdate_(user, 'gallery', 'New photo in the Gallery', f.collegeId, f.homeId);
  return { ok: true };
}

function fileDelete_(user, req) {
  var r = fileRow_(req.id), f = r.f;
  var own = f.uploadedBy === user.name && f.status === 'Pending';
  if (!isAdminRole_(user.role) && !own) throw new Error('Not allowed');
  trashFile_(f); f.status = 'Deleted';
  writeRow_('files', r.row, f);
  addLog_(user, 'Deleted file', f.id + ' ' + f.name);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(key) { var s = ss_().getSheetByName(T[key].sheet); if (!s) throw new Error('Run setup() first'); return s; }
function today_() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }

function conv_(t, c, v) {
  if (t.bool && t.bool.indexOf(c) >= 0) return v === true || String(v).toLowerCase() === 'true';
  if (t.num && t.num.indexOf(c) >= 0) return Number(v) || 0;
  if (t.json && t.json.indexOf(c) >= 0) { try { return JSON.parse(v || '[]'); } catch (e) { return []; } }
  return v == null ? '' : String(v);
}
function cell_(t, c, v) {
  if (t.json && t.json.indexOf(c) >= 0) return JSON.stringify(v || []);
  if (t.bool && t.bool.indexOf(c) >= 0) return v ? 'TRUE' : 'FALSE';
  return v == null ? '' : String(v);
}
function rowObj_(t, r) { var o = {}; t.cols.forEach(function (c, i) { o[c] = conv_(t, c, r[i]); }); return o; }

function readAll_(key) {
  var t = T[key], sh = sheet_(key), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, t.cols.length).getValues().filter(function (r) { return r[0] !== ''; }).map(function (r) { return rowObj_(t, r); });
}
function findRow_(key, id) {
  var sh = sheet_(key), n = sh.getLastRow() - 1;
  if (n < 1 || !id) throw new Error('Record not found');
  var ids = sh.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  throw new Error('Record not found');
}
function writeRow_(key, row, obj) {
  var t = T[key];
  sheet_(key).getRange(row, 1, 1, t.cols.length).setValues([t.cols.map(function (c) { return cell_(t, c, obj[c]); })]);
}
function nextId_(key) {
  var t = T[key], max = 0;
  readAll_(key).forEach(function (r) { var n = parseInt(String(r.id).slice(t.prefix.length), 10) || 0; if (n > max) max = n; });
  return t.prefix + (max + 1);
}

function readSettings_() {
  var sh = ss_().getSheetByName('Settings'), out = { monthlyTarget: 4, updateDeadlineDays: 3 };
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0] !== '') out[r[0]] = isNaN(Number(r[1])) ? r[1] : Number(r[1]); });
  return out;
}

function addLog_(user, action, detail) {
  try {
    var sh = ss_().getSheetByName('Logs');
    sh.appendRow([new Date().toISOString(), user ? user.name : '', user ? user.role : '', action, detail || '']);
  } catch (e) { }
}
function readLogs_(limit) {
  var sh = ss_().getSheetByName('Logs'), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var from = Math.max(2, sh.getLastRow() - limit + 1);
  return sh.getRange(from, 1, sh.getLastRow() - from + 1, LOG_COLS.length).getValues().map(function (r) {
    return { t: String(r[0]), user: String(r[1]), role: String(r[2]), action: String(r[3]), detail: String(r[4]) };
  }).reverse();
}

/* ------------------------------------------------------------------ */
/* One-time setup: creates the tabs and the sample accounts            */
/* Run setup() once from the Apps Script editor.                       */
/* ------------------------------------------------------------------ */
function setup() {
  var ss = ss_();
  function ensure(name, cols) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');   // keep dates as plain text
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#e6f0e0');
    sh.setFrozenRows(1);
    return sh;
  }
  Object.keys(T).forEach(function (k) { ensure(T[k].sheet, T[k].cols); });
  ensure('Logs', LOG_COLS); ensure('Settings', SETTINGS_COLS);

  if (readAll_('users').length === 0) {
    var d = function (n) { return Utilities.formatDate(new Date(Date.now() + n * 864e5), 'Asia/Kolkata', 'yyyy-MM-dd'); };
    var put = function (key, objs) { objs.forEach(function (o, i) { writeRow_(key, i + 2, o); }); };
    var cols = [], homes = [], mous = [];
    for (var i = 1; i <= 5; i++) {
      cols.push({ id: 'C' + i, name: 'Partner College ' + i, coordinator: 'Coordinator ' + i, phone: '', email: 'coordinator' + i + '@example.org', homeId: 'H' + i, target: 4 });
      homes.push({ id: 'H' + i, name: 'Welfare Home ' + i, head: 'Superintendent ' + i, phone: '', email: 'home' + i + '@example.org', collegeId: 'C' + i });
      mous.push({ id: 'M' + i, collegeId: 'C' + i, homeId: 'H' + i, start: d(-300 + i * 20), end: d([30, 420, 200, 60, 365][i - 1]), renewal: '' });
    }
    put('colleges', cols); put('homes', homes); put('mous', mous);
    put('resources', [
      { id: 'D1', title: 'Activity report template', kind: 'Template', url: '' }, { id: 'D2', title: 'Project guidelines for partner colleges', kind: 'Guideline', url: '' },
      { id: 'D3', title: 'IEC materials folder', kind: 'IEC', url: '' }, { id: 'D4', title: 'MoU format', kind: 'Template', url: '' }]);
    var sample = [
      ['Super Admin', 'superadmin@example.org', 'superadmin', '', ''], ['DCIP Intern', 'admin@example.org', 'admin', '', ''],
      ['District Officer', 'district@example.org', 'district', '', ''], ['Coordinator 1', 'coordinator1@example.org', 'college', 'C1', ''],
      ['Superintendent 1', 'home1@example.org', 'home', '', 'H1']];
    put('users', sample.map(function (s, i) {
      var salt = newSalt_();
      return { id: 'U' + (i + 1), name: s[0], email: s[1], role: s[2], collegeId: s[3], homeId: s[4], active: true, passHash: hash_(salt, DEFAULT_PASSWORD), salt: salt, mustChange: false };
    }));
    ss.getSheetByName('Settings').getRange(2, 1, 2, 2).setValues([['monthlyTarget', '4'], ['updateDeadlineDays', '3']]);
  }
  var def = ss.getSheetByName('Sheet1'); if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
  Logger.log('Setup complete. Sample accounts use the default password.');
}
