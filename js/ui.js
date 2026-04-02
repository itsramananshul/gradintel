/* ═══════ GRADINTEL V3 JS ═══════════════════════════════ */

/* ── Tab switching ── */
function gv3Switch(tab) {
  if (typeof showTab === 'function') showTab(tab);
  document.querySelectorAll('.gv3-item').forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('data-tab') === tab);
  });
  gv3CloseMob();
}
(function() {
  var orig = window.showTab;
  window.showTab = function(tab) {
    if (orig) orig.call(this, tab);
    document.querySelectorAll('.gv3-item').forEach(function(b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === tab);
    });
  };
})();

/* ── Collapse — logo is the toggle, no separate button ── */
function gv3ToggleCollapse() {
  var collapsed = document.body.classList.toggle('gv3-collapsed');
  try { localStorage.setItem('gv3_col', collapsed ? '1' : ''); } catch(e){}
}

/* ── Mobile ── */
function gv3ToggleMob() {
  document.getElementById('gv3-sb').classList.toggle('mob-open');
  document.getElementById('gv3-mob-overlay').classList.toggle('on');
}
function gv3CloseMob() {
  document.getElementById('gv3-sb').classList.remove('mob-open');
  document.getElementById('gv3-mob-overlay').classList.remove('on');
}

/* ── Theme system ── */
var GV3_THEMES = {
  violet:  {a1:'#a78bfa', a2:'#f472b6', label:'Violet'},
  ocean:   {a1:'#38bdf8', a2:'#6366f1', label:'Ocean'},
  emerald: {a1:'#34d399', a2:'#38bdf8', label:'Emerald'},
  sunset:  {a1:'#fb7185', a2:'#fbbf24', label:'Sunset'},
  gold:    {a1:'#fbbf24', a2:'#f97316', label:'Gold'},
  neon:    {a1:'#a3e635', a2:'#22d3ee', label:'Neon'},
  crimson: {a1:'#ef4444', a2:'#a78bfa', label:'Crimson'},
  arctic:  {a1:'#bae6fd', a2:'#818cf8', label:'Arctic'},
};

function gv3Hex2Rgb(h) {
  return parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16);
}

function gv3SetTheme(name) {
  var t = GV3_THEMES[name]; if (!t) return;
  var rs = document.documentElement.style;
  /* Set our vars */
  rs.setProperty('--a1',  t.a1);
  rs.setProperty('--a2',  t.a2);
  rs.setProperty('--bd1', 'rgba('+gv3Hex2Rgb(t.a1)+',0.10)');
  rs.setProperty('--bd2', 'rgba('+gv3Hex2Rgb(t.a1)+',0.22)');
  rs.setProperty('--c-bd',  'rgba('+gv3Hex2Rgb(t.a1)+',0.10)');
  rs.setProperty('--c-bd2', 'rgba('+gv3Hex2Rgb(t.a1)+',0.22)');
  /* Also update originals so existing components pick up the color */
  rs.setProperty('--accent',  t.a1);
  rs.setProperty('--accent2', t.a2);
  rs.setProperty('--border',  'rgba('+gv3Hex2Rgb(t.a1)+',0.10)');
  rs.setProperty('--border2', 'rgba('+gv3Hex2Rgb(t.a1)+',0.22)');

  /* Update the SVG gradient in defs */
  var stops = document.querySelectorAll('#site-ig stop');
  if (stops.length >= 2) {
    stops[0].setAttribute('stop-color', t.a1);
    stops[1].setAttribute('stop-color', t.a2);
  }

  /* Update dot + label */
  var dot = document.querySelector('.gv3-dot');
  if (dot) { dot.style.background = t.a1; dot.style.boxShadow = '0 0 5px '+t.a1; }
  var lbl = document.getElementById('gv3-theme-lbl');
  if (lbl) lbl.textContent = t.label;

  /* Mark active card */
  document.querySelectorAll('.gv3-tc').forEach(function(c) { c.classList.remove('on'); });
  var ac = document.querySelector('.gv3-tc[onclick*="'+name+'"]');
  if (ac) ac.classList.add('on');

  try { localStorage.setItem('gv3_theme', name); } catch(e){}
  gv3ClosePanel();
}

function gv3TogglePanel() {
  document.getElementById('gv3-theme-panel').classList.toggle('open');
}
function gv3ClosePanel() {
  document.getElementById('gv3-theme-panel').classList.remove('open');
}
document.addEventListener('click', function(e) {
  var p = document.getElementById('gv3-theme-panel');
  var b = document.getElementById('gv3-theme-btn');
  if (p && b && !p.contains(e.target) && !b.contains(e.target)) p.classList.remove('open');
});

/* ── 3D card tilt ── */
function gv3InitTilt() {
  document.querySelectorAll('.card, .stat-card, .export-card, .ai-prov-card, .badge-card').forEach(function(card) {
    if (card._gv3) return;
    card._gv3 = true;
    card.addEventListener('mousemove', function(e) {
      var r = card.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width/2)  / (r.width/2);
      var dy = (e.clientY - r.top  - r.height/2) / (r.height/2);
      var mx = card.classList.contains('stat-card') ? 6 : 4;
      card.style.transform = 'perspective(700px) rotateX('+(-dy*mx)+'deg) rotateY('+(dx*mx)+'deg) translateZ(4px)';
      var px = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
      var py = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      var sh = card.querySelector('.gv3-shine');
      if (!sh) { sh = document.createElement('div'); sh.className='gv3-shine'; card.appendChild(sh); }
      sh.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;transition:opacity .3s;';
      sh.style.background = 'radial-gradient(circle at '+px+'% '+py+'%, rgba(255,255,255,0.08), transparent 55%)';
      sh.style.opacity = '1';
    });
    card.addEventListener('mouseleave', function() {
      card.style.transform = '';
      var sh = card.querySelector('.gv3-shine');
      if (sh) sh.style.opacity = '0';
    });
  });
}

/* ── Restore saved settings on load ── */
document.addEventListener('DOMContentLoaded', function() {
  try {
    var t = localStorage.getItem('gv3_theme');
    if (t && GV3_THEMES[t]) gv3SetTheme(t);
    if (localStorage.getItem('gv3_col') === '1') document.body.classList.add('gv3-collapsed');
  } catch(e){}
  setTimeout(gv3InitTilt, 600);
});
setInterval(gv3InitTilt, 2500);

/* ═══════════════════════════════════════════════════════
   CANVAS LMS INTEGRATION
════════════════════════════════════════════════════════ */
var cvCourses = [];
var cvSelected = new Set();
var cvConfig = {};
var cvToastTimer = null;

function cvLoadConfig() {
  try {
    var raw = localStorage.getItem('gradintel_canvas_config');
    cvConfig = raw ? JSON.parse(raw) : {};
  } catch(e) { cvConfig = {}; }
  if (cvConfig.url)    document.getElementById('cv-url').value    = cvConfig.url;
  if (cvConfig.token)  document.getElementById('cv-token').value  = cvConfig.token;
  if (cvConfig.worker) document.getElementById('cv-worker').value = cvConfig.worker;
  if (cvConfig.enrollState) document.getElementById('cv-enroll-state').value = cvConfig.enrollState;
  cvUpdateStatus();
}

function cvSaveConfig() {
  cvConfig = {
    url:         document.getElementById('cv-url').value.trim().replace(/\/+$/, ''),
    token:       document.getElementById('cv-token').value.trim(),
    worker:      document.getElementById('cv-worker').value.trim().replace(/\/+$/, ''),
    enrollState: document.getElementById('cv-enroll-state').value,
    connected:   cvConfig.connected || false,
    lastSync:    cvConfig.lastSync  || null,
  };
  localStorage.setItem('gradintel_canvas_config', JSON.stringify(cvConfig));
  cvUpdateStatus();
}

function cvUpdateStatus() {
  var dot  = document.getElementById('cv-dot');
  var text = document.getElementById('cv-status-text');
  var sub  = document.getElementById('cv-status-sub');
  var disc = document.getElementById('cv-disconnect-btn');
  if (!dot) return;
  if (cvConfig.connected && cvConfig.lastSync) {
    dot.className  = 'cv-status-dot connected';
    text.textContent = '✓ Connected to ' + (cvConfig.url || 'Canvas');
    sub.textContent  = 'Last synced: ' + cvConfig.lastSync;
    disc.style.display = 'flex';
  } else if (cvConfig.url && cvConfig.token && cvConfig.worker) {
    dot.className  = 'cv-status-dot';
    dot.style.background = 'var(--a1)'; dot.style.boxShadow = '0 0 8px var(--a1)';
    text.textContent = 'Ready to sync';
    sub.textContent  = 'Press "Sync from Canvas" to fetch your courses';
    disc.style.display = 'none';
  } else {
    dot.className  = 'cv-status-dot';
    dot.style.background = ''; dot.style.boxShadow = '';
    text.textContent = 'Not connected';
    sub.textContent  = 'Fill in the fields below to get started';
    disc.style.display = 'none';
  }
}

function cvLog(msg, type) {
  var log = document.getElementById('cv-log');
  log.classList.add('show');
  var line = document.createElement('div');
  line.className = type || '';
  line.textContent = (type === 'ok' ? '✓ ' : type === 'err' ? '✗ ' : '→ ') + msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function cvClearLog() {
  var log = document.getElementById('cv-log');
  log.innerHTML = '';
  log.classList.remove('show');
}

async function cvFetch(path) {
  var worker = cvConfig.worker;
  var token  = cvConfig.token;
  var base   = cvConfig.url;
  if (!worker || !token || !base) throw new Error('Missing config');
  var targetUrl = base + path;
  var proxyUrl  = worker + '?url=' + encodeURIComponent(targetUrl) + '&token=' + encodeURIComponent(token);
  var resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' from Canvas');
  return resp.json();
}

async function cvTestConnection() {
  cvClearLog();
  cvLog('Testing connection…', 'inf');
  try {
    var profile = await cvFetch('/api/v1/users/self/profile');
    cvLog('Connected as: ' + (profile.name || profile.short_name || 'Unknown'), 'ok');
    cvConfig.connected = true;
    cvSaveConfig();
    cvShowToast('✓ Connected as ' + (profile.name || 'Canvas User'));
  } catch(e) {
    cvLog('Connection failed: ' + e.message, 'err');
    cvLog('Check your Canvas URL, token, and Worker URL', 'inf');
    cvShowToast('Connection failed — check the log below');
  }
}

async function cvSync() {
  var btn = document.getElementById('cv-sync-btn');
  if (!cvConfig.url || !cvConfig.token || !cvConfig.worker) {
    cvShowToast('⚠️ Please fill in Canvas URL, token, and Worker URL first');
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:spin 1s linear infinite"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/></svg> Syncing…';

  var dot = document.getElementById('cv-dot');
  dot.className = 'cv-status-dot syncing';

  cvClearLog();
  cvLog('Connecting to Canvas…', 'inf');
  cvCourses = [];
  cvSelected.clear();

  try {
    // Fetch courses
    var enrollState = cvConfig.enrollState || 'active';
    var param = enrollState === 'all' ? '' : '&enrollment_state=' + enrollState;
    cvLog('Fetching courses…', 'inf');
    var courses = await cvFetch('/api/v1/courses?include[]=total_scores&include[]=current_grading_period_scores&per_page=50' + param);

    // Filter out courses without names (sandbox/deleted)
    courses = (courses || []).filter(function(c) { return c.name && !c.access_restricted_by_date; });
    cvLog('Found ' + courses.length + ' courses', 'ok');

    // Fetch assignments for each course (up to 10 courses to avoid rate limits)
    var enriched = [];
    var toFetch = courses.slice(0, 12);
    for (var i = 0; i < toFetch.length; i++) {
      var c = toFetch[i];
      cvLog('Loading ' + c.name + '…', 'inf');
      try {
        // Assignment groups (weights)
        var groups = await cvFetch('/api/v1/courses/' + c.id + '/assignment_groups?include[]=assignments&include[]=submission');
        c._groups = groups || [];

        // Upcoming assignments (due soon)
        var assigns = await cvFetch('/api/v1/courses/' + c.id + '/assignments?include[]=submission&order_by=due_at&per_page=30');
        c._assignments = (assigns || []).filter(function(a) {
          return a.due_at && new Date(a.due_at) > new Date();
        }).slice(0, 8);
      } catch(e2) {
        c._groups = []; c._assignments = [];
      }
      enriched.push(c);
    }

    cvCourses = enriched;
    cvConfig.connected = true;
    cvConfig.lastSync  = new Date().toLocaleString();
    cvSaveConfig();

    cvRenderCourses();
    cvRenderAssignments();

    document.getElementById('cv-courses-section').style.display = 'block';
    document.getElementById('cv-how-section').style.display = 'none';

    cvLog('Sync complete! Select courses below to import into Gradintel.', 'ok');
    cvShowToast('✓ Synced ' + courses.length + ' courses from Canvas');

  } catch(e) {
    cvLog('Sync failed: ' + e.message, 'err');
    cvShowToast('Sync failed — see log below');
    dot.className = 'cv-status-dot error';
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> Sync from Canvas';
}

function cvGradeToPercent(c) {
  if (c.enrollments && c.enrollments.length > 0) {
    var e = c.enrollments[0];
    if (e.computed_current_score != null) return e.computed_current_score;
    if (e.current_score != null) return e.current_score;
  }
  return null;
}

function cvPercentToLetter(pct) {
  if (pct == null) return null;
  if (pct >= 93) return 'A';  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+'; if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-'; if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+'; if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-'; return 'F';
}

function cvRenderCourses() {
  var grid = document.getElementById('cv-courses-grid');
  grid.innerHTML = '';
  cvCourses.forEach(function(c) {
    var pct = cvGradeToPercent(c);
    var letter = cvPercentToLetter(pct);
    var assignCount = (c._assignments || []).length;
    var totalAssigns = 0;
    (c._groups || []).forEach(function(g) { totalAssigns += (g.assignments || []).length; });

    var card = document.createElement('div');
    card.className = 'cv-course-card';
    card.setAttribute('data-id', c.id);
    card.innerHTML =
      '<div class="cv-cc-top">' +
        '<div><div class="cv-cc-name">' + cvEsc(c.name) + '</div>' +
        '<div class="cv-cc-code">' + cvEsc(c.course_code || '') + '</div></div>' +
        '<div class="cv-cc-grade ' + (pct == null ? 'no-grade' : '') + '">' +
          (pct != null ? (pct.toFixed(1) + '%') : 'N/A') + '</div>' +
      '</div>' +
      '<div class="cv-cc-meta">' +
        '<span class="cv-cc-tag">' + (letter || '–') + '</span>' +
        '<span class="cv-cc-assignments">' +
          (totalAssigns > 0 ? totalAssigns + ' assignments' : '') +
          (assignCount > 0 ? ' · ' + assignCount + ' upcoming' : '') +
        '</span>' +
      '</div>' +
      '<div class="cv-cc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>';
    card.onclick = function() { cvToggleCourse(c.id, card); };
    grid.appendChild(card);
  });
  cvUpdateSemTargets();
}

function cvToggleCourse(id, card) {
  if (cvSelected.has(id)) {
    cvSelected.delete(id);
    card.classList.remove('selected');
  } else {
    cvSelected.add(id);
    card.classList.add('selected');
  }
  cvUpdateImportConfirm();
}

function cvSelectAll() {
  cvCourses.forEach(function(c) {
    cvSelected.add(c.id);
    var card = document.querySelector('.cv-course-card[data-id="' + c.id + '"]');
    if (card) card.classList.add('selected');
  });
  cvUpdateImportConfirm();
}

function cvUpdateImportConfirm() {
  var box = document.getElementById('cv-import-confirm');
  if (cvSelected.size === 0) { box.classList.remove('show'); return; }

  var selectedCourses = cvCourses.filter(function(c) { return cvSelected.has(c.id); });
  var totalAssigns = 0;
  selectedCourses.forEach(function(c) {
    (c._groups || []).forEach(function(g) { totalAssigns += (g.assignments || []).length; });
  });

  document.getElementById('cv-import-summary').innerHTML =
    '<span>' + cvSelected.size + '</span> course(s) selected · ' +
    '<span>' + totalAssigns + '</span> total assignments · ' +
    'Will be added to Gradintel as subjects with exam weights';
  box.classList.add('show');
}

function cvRenderAssignments() {
  var allUpcoming = [];
  cvCourses.forEach(function(c) {
    (c._assignments || []).forEach(function(a) {
      a._courseName = c.name;
      allUpcoming.push(a);
    });
  });
  allUpcoming.sort(function(a, b) { return new Date(a.due_at) - new Date(b.due_at); });

  if (allUpcoming.length === 0) return;

  var card = document.getElementById('cv-assign-card');
  card.style.display = 'block';
  document.getElementById('cv-assign-count').textContent = '(' + allUpcoming.length + ' upcoming)';

  var list = document.getElementById('cv-assign-list');
  list.innerHTML = '';
  allUpcoming.slice(0, 20).forEach(function(a) {
    var sub = a.submission || {};
    var score = null, scoreClass = 'pending';
    if (sub.score != null && a.points_possible > 0) {
      score = sub.score.toFixed(1) + '/' + a.points_possible;
      scoreClass = sub.score / a.points_possible >= 0.7 ? '' : 'missing';
    } else if (sub.missing) {
      score = 'MISSING'; scoreClass = 'missing';
    } else {
      score = '—'; scoreClass = 'pending';
    }

    var dueDate = new Date(a.due_at);
    var today = new Date();
    var diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    var dueStr = diffDays === 0 ? 'Today' :
                 diffDays === 1 ? 'Tomorrow' :
                 diffDays < 7  ? 'In ' + diffDays + 'd' :
                 dueDate.toLocaleDateString('en-US', { month:'short', day:'numeric' });

    var row = document.createElement('div');
    row.className = 'cv-assign-row';
    row.innerHTML =
      '<div class="cv-assign-name">' + cvEsc(a.name) + '<span style="font-weight:400;color:var(--c-muted);font-size:11px;margin-left:6px">' + cvEsc(a._courseName) + '</span></div>' +
      '<span class="cv-assign-due">' + dueStr + '</span>' +
      '<span class="cv-assign-score ' + scoreClass + '">' + score + '</span>';
    list.appendChild(row);
  });
}

function cvUpdateSemTargets() {
  var sel = document.getElementById('cv-sem-target');
  sel.innerHTML = '<option value="new">➕ Create new semester</option>';
  if (typeof semesters !== 'undefined') {
    semesters.forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name;
      sel.appendChild(opt);
    });
  }
}

function cvCourseToSubject(course) {
  // Convert Canvas course + assignment groups → Gradintel subject schema
  var pct   = cvGradeToPercent(course);
  var groups = course._groups || [];

  // Build exam list from Canvas assignment groups
  var exams = [];
  var otherPct = 0;
  var otherScore = pct || 0;
  var examTotalPct = 0;

  // Identify if there are meaningful assignment groups with weights
  var weightedGroups = groups.filter(function(g) { return g.group_weight > 0; });

  if (weightedGroups.length >= 2) {
    // Use the two largest weighted groups as "exams", rest as "other"
    weightedGroups.sort(function(a, b) { return b.group_weight - a.group_weight; });

    // Top groups become exams (max 4)
    var examGroups = weightedGroups.slice(0, 4);
    examGroups.forEach(function(g) {
      // Calculate this group's current score
      var assigns = g.assignments || [];
      var graded  = assigns.filter(function(a) { return a.submission && a.submission.score != null; });
      var earned  = graded.reduce(function(s, a) { return s + a.submission.score; }, 0);
      var max     = graded.reduce(function(s, a) { return s + (a.points_possible || 0); }, 0);
      var groupScore = max > 0 ? (earned / max * 100) : null;

      exams.push({
        name:   g.name,
        weight: Math.round(g.group_weight),
        taken:  groupScore != null,
        score:  groupScore != null ? parseFloat(groupScore.toFixed(1)) : null
      });
      examTotalPct += g.group_weight;
    });

    otherPct   = Math.max(0, Math.round(100 - examTotalPct));
    otherScore = pct || 0;
  } else {
    // No meaningful groups — treat entire grade as "other"
    otherPct   = 100;
    otherScore = pct || 0;
    exams = [{ name: 'Final Exam', weight: 100, taken: false, score: null }];
    examTotalPct = 0;
    otherPct = 100;
  }

  // Keep exam weights as absolute percentages of total course grade — do NOT normalize to 100
  // examTotalPct already holds the correct sum

  return {
    id:          uid(),
    name:        course.name,
    credits:     course.credits_hours || 3,
    other_pct:   examTotalPct > 0 ? otherPct : 100,
    other_score: parseFloat((otherScore).toFixed(1)),
    exam_pct:    examTotalPct > 0 ? Math.round(examTotalPct) : 0,
    exams:       exams,
    status:      'normal',
    _canvas_id:  course.id,
  };
}

async function cvImportSelected() {
  if (cvSelected.size === 0) { cvShowToast('Select at least one course first'); return; }

  var selectedCourses = cvCourses.filter(function(c) { return cvSelected.has(c.id); });
  var subjects = selectedCourses.map(cvCourseToSubject);

  var semTarget = document.getElementById('cv-sem-target').value;
  var semName   = document.getElementById('cv-sem-name').value.trim() ||
                  'Canvas Sync — ' + new Date().toLocaleDateString('en-US', { month:'short', year:'numeric' });

  try {
    if (semTarget === 'new') {
      // Create new semester
      var sem = {
        id:       uid(),
        name:     semName,
        date:     new Date().toLocaleDateString(),
        subjects: subjects
      };
      var semCP = subjects.reduce(function(a, s) {
        return a + s.credits * (s.other_pct === 100 ? s.other_score / 100 : s.other_score / 100);
      }, 0);
      var semCR = subjects.reduce(function(a, s) { return a + s.credits; }, 0);
      sem._gpa = semCR > 0 ? parseFloat((semCP / semCR).toFixed(3)) : 0;
      await saveSemesterToDB(sem);
    } else {
      // Add to existing semester
      var existing = semesters.find(function(s) { return s.id === semTarget; });
      if (!existing) { cvShowToast('Semester not found'); return; }
      subjects.forEach(function(s) { existing.subjects.push(s); });
      await saveSemesterToDB(existing);
    }

    // Refresh app
    if (typeof renderSemesterList === 'function') renderSemesterList();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderDash === 'function') renderDash();

    cvShowToast('✓ Imported ' + subjects.length + ' course(s) into Gradintel!');
    cvLog('Imported ' + subjects.length + ' courses as subjects', 'ok');

    // Reset selection
    cvSelected.clear();
    document.querySelectorAll('.cv-course-card').forEach(function(c) { c.classList.remove('selected'); });
    document.getElementById('cv-import-confirm').classList.remove('show');

  } catch(e) {
    cvShowToast('Import failed: ' + e.message);
    cvLog('Import error: ' + e.message, 'err');
  }
}

function cvDisconnect() {
  if (!confirm('Disconnect Canvas? This only removes the connection — your imported data stays.')) return;
  cvConfig = {};
  localStorage.removeItem('gradintel_canvas_config');
  document.getElementById('cv-url').value    = '';
  document.getElementById('cv-token').value  = '';
  document.getElementById('cv-worker').value = '';
  cvCourses = [];
  cvSelected.clear();
  document.getElementById('cv-courses-section').style.display = 'none';
  document.getElementById('cv-how-section').style.display = 'block';
  cvUpdateStatus();
  cvShowToast('Disconnected from Canvas');
}

function cvShowToast(msg) {
  var t = document.getElementById('cv-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(cvToastTimer);
  cvToastTimer = setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function cvEsc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Load config when canvas tab opens
document.addEventListener('DOMContentLoaded', function() {
  // Inject spin keyframe for sync
  var style = document.createElement('style');
  style.textContent = '@keyframes gv3spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  cvLoadConfig();
});

/* ─── AI FLOAT BUBBLE ─── */
function toggleAIBubble(){
  const box=document.getElementById('ai-floatbox');
  const btn=document.getElementById('ai-bubble');
  const show=!box.classList.contains('show');
  box.classList.toggle('show',show);
  btn.classList.toggle('open',show);
  if(show) document.getElementById('ai-float-input').focus();
}

async function sendFloatAI(){
  const inp     = document.getElementById('ai-float-input');
  const msgs    = document.getElementById('ai-float-msgs');
  const sendBtn = document.getElementById('ai-float-send');
  const text    = inp.value.trim();
  if (!text) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'af-msg user'; userDiv.textContent = text;
  msgs.appendChild(userDiv); inp.value = ''; sendBtn.disabled = true;

  const thinkDiv = document.createElement('div');
  thinkDiv.className = 'af-msg thinking'; thinkDiv.textContent = 'Thinking…';
  msgs.appendChild(thinkDiv); msgs.scrollTop = msgs.scrollHeight;

  const allSubjects = [];
  (semesters||[]).forEach(function(sem){
    (sem.subjects||[]).forEach(function(s){
      try { const r=computeSubject(s); allSubjects.push(s.name+': '+r.cur.toFixed(1)+'% ('+r.curG.l+'), '+r.remExams.length+' exams remaining'); }
      catch(e){ allSubjects.push(s.name); }
    });
  });
  const ctx = allSubjects.length ? 'Student courses: '+allSubjects.join('; ') : 'No course data yet.';
  const systemPrompt = 'You are a concise, friendly academic advisor embedded in Gradintel, a GPA tracker. '+ctx+' Answer briefly in 2-4 sentences max.';

  let reply = '';
  try {
    // Free AI with multiple fallbacks — no key needed
    reply = await callFreeAI(systemPrompt, text);
  } catch(e) {
    if (e.message === '__NEEDS_CONNECT__') {
      thinkDiv.className = 'af-msg ai';
      thinkDiv.innerHTML = '<div style="text-align:center;padding:10px">' +
        '<div style="font-size:22px;margin-bottom:8px">🤖</div>' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:6px">Connect Free AI</div>' +
        '<div style="font-size:12px;color:var(--muted2);margin-bottom:12px">Free · No credit card · 30 seconds</div>' +
        '<button onclick="connectPollAI()" style="padding:9px 18px;background:linear-gradient(135deg,var(--accent),var(--accent2));' +
          'color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">' +
          '🌸 Connect Pollinations (free)</button></div>';
      sendBtn.disabled = false;
      return;
    }
    reply = '❌ ' + e.message;
  }

  thinkDiv.className = 'af-msg ai'; thinkDiv.textContent = reply;
  sendBtn.disabled = false; msgs.scrollTop = msgs.scrollHeight;
}
