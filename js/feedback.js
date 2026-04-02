// Patch the bookmarklet to also send assignment due dates
// This extends the existing ciGetBookmarkletCode — after grades are sent,
// also send deadlines payload separately so deadline tracker can pick them up.

const _origCiGetBookmarkletCode = ciGetBookmarkletCode;
function ciGetBookmarkletCode() {
  // We rebuild the full bookmarklet with deadline sending added
  const sbUrl  = SUPABASE_URL;
  const sbAnon = SUPABASE_ANON;
  const userId = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'anonymous';

  const fn = `(function(){
  var SBURL  = ${JSON.stringify(sbUrl)};
  var SBANON = ${JSON.stringify(sbAnon)};
  var UID    = ${JSON.stringify(userId)};

  function send(data) {
    fetch(SBURL + '/rest/v1/canvas_sync', {
      method: 'POST',
      headers: {'Content-Type':'application/json','apikey':SBANON,'Authorization':'Bearer '+SBANON,'Prefer':'return=minimal'},
      body: JSON.stringify({ user_id: UID, payload: data, created_at: new Date().toISOString() })
    }).catch(function(){});
    try { var bc=new BroadcastChannel('gradintel_canvas'); bc.postMessage({type:'GRADINTEL_CANVAS',data:data}); bc.close(); } catch(e){}
    try { window.opener && window.opener.postMessage({type:'GRADINTEL_CANVAS',data:data},'*'); } catch(e){}
  }

  function sendDeadlines(deadlines) {
    fetch(SBURL + '/rest/v1/canvas_sync', {
      method: 'POST',
      headers: {'Content-Type':'application/json','apikey':SBANON,'Authorization':'Bearer '+SBANON,'Prefer':'return=minimal'},
      body: JSON.stringify({ user_id: UID, payload: deadlines, created_at: new Date().toISOString() })
    }).catch(function(){});
    try { var bc=new BroadcastChannel('gradintel_canvas'); bc.postMessage({type:'GRADINTEL_DEADLINES',data:deadlines}); bc.close(); } catch(e){}
  }

  function toast(msg) {
    var d=document.createElement('div');
    d.style.cssText='position:fixed;bottom:24px;right:24px;background:#818cf8;color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:700;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.4)';
    d.textContent=msg; document.body.appendChild(d); setTimeout(function(){d.remove()},3500);
  }
  toast('📊 Gradintel: reading grades & deadlines…');

  var m = location.href.match(/courses\\/([0-9]+)/);
  var courseId = m ? m[1] : null;
  var canvasBase = location.origin;

  function extractFromDOM() {
    var rows = [];
    document.querySelectorAll('#grades_summary tr.student_assignment').forEach(function(tr){
      var name = tr.querySelector('.title a,.title') ? (tr.querySelector('.title a')||tr.querySelector('.title')).textContent.trim() : null;
      var score = tr.querySelector('.score_value') ? tr.querySelector('.score_value').textContent.trim() : null;
      var possible = tr.querySelector('.points_possible') ? tr.querySelector('.points_possible').textContent.trim() : null;
      var pct = null;
      if (score && possible && parseFloat(possible) > 0) pct = (parseFloat(score)/parseFloat(possible)*100).toFixed(1);
      if (score === null || score === '--') score = null;
      if (name) rows.push({name:name, score:score, possible:possible, pct:pct});
    });
    return rows;
  }

  var courseNameEl = document.querySelector('h1.course-title,.context_module_sub_header,.course-name,title');
  var courseName = courseNameEl ? courseNameEl.textContent.trim().replace(' Grades','') : (document.title||'Canvas Course');

  if (courseId) {
    fetch(canvasBase+'/api/v1/courses/'+courseId+'/assignment_groups?include[]=assignments&include[]=submission&per_page=100', {credentials:'include'})
      .then(function(r){return r.json();}).then(function(groups){
        var rows = [];
        var deadlines = [];
        groups.forEach(function(g){
          var gw = g.group_weight||0;
          (g.assignments||[]).forEach(function(a){
            var sub = a.submission||{};
            var pct = null;
            if (sub.score!=null && a.points_possible>0) pct = (sub.score/a.points_possible*100).toFixed(1);
            rows.push({name:a.name,group:g.name,weight:gw,score:sub.score!=null?sub.score.toString():null,possible:a.points_possible?a.points_possible.toString():null,pct:pct,due:a.due_at?a.due_at.split('T')[0]:null});
            // Collect upcoming deadlines (not yet submitted, has due date)
            if(a.due_at && (!sub.submitted_at) && sub.workflow_state !== 'graded'){
              deadlines.push({name:a.name,course:courseName,due:a.due_at,group:g.name,points:a.points_possible||0});
            }
          });
        });
        send({source:'api', courseName:courseName, courseId:courseId, rows:rows});
        if(deadlines.length) sendDeadlines({type:'GRADINTEL_DEADLINES',courseName:courseName,courseId:courseId,deadlines:deadlines});
        toast('✅ Gradintel: '+rows.length+' grades + '+deadlines.length+' upcoming deadlines synced!');
      }).catch(function(){
        var domRows = extractFromDOM();
        if (domRows.length) { send({source:'dom', courseName:courseName, courseId:courseId, rows:domRows}); toast('✅ Gradintel: '+domRows.length+' grades found!'); }
        else toast('⚠️ Gradintel: no grades found on this page.');
      });
  } else {
    var domRows = extractFromDOM();
    if (domRows.length) { send({source:'dom', courseName:courseName, courseId:null, rows:domRows}); toast('✅ Gradintel: '+domRows.length+' grades found!'); }
    else toast('⚠️ Gradintel: navigate to a Canvas Grades page first, then click again.');
  }
})();`;
  return 'javascript:' + encodeURIComponent(fn);
}

// Listen for deadline data from bookmarklet and auto-import into deadline tracker
(function(){
  function handleDeadlineData(data){
    if(!data || !data.deadlines || !data.deadlines.length) return;
    var imported = 0;
    data.deadlines.forEach(function(dl){
      // Don't add if already exists (same name + course)
      var exists = (deadlines||[]).some(function(d){ return d.name===dl.name && d.course===dl.course; });
      if(exists) return;
      var newDl = {
        id: uid(),
        name: dl.name,
        course: dl.course || dl.courseName || 'Canvas',
        date: dl.due ? dl.due.split('T')[0] : null,
        type: dl.group || 'Assignment',
        done: false
      };
      if(!deadlines) window.deadlines = [];
      deadlines.push(newDl);
      imported++;
    });
    if(imported > 0){
      saveDeadlinesToDB && saveDeadlinesToDB();
      if(typeof renderDeadlines === 'function') renderDeadlines();
      showToast('📅 Imported ' + imported + ' deadline' + (imported!==1?'s':'') + ' from Canvas!');
    }
  }

  // BroadcastChannel for same-origin
  try {
    var bc2 = new BroadcastChannel('gradintel_canvas');
    var _orig = bc2.onmessage;
    bc2.onmessage = function(e){
      if(e.data && e.data.type==='GRADINTEL_DEADLINES') handleDeadlineData(e.data.data);
    };
  } catch(e){}

  // postMessage
  window.addEventListener('message', function(e){
    if(e.data && e.data.type==='GRADINTEL_DEADLINES') handleDeadlineData(e.data.data);
  });

  // Supabase realtime for deadlines (piggybacks on canvas_sync table)
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      if(sb && typeof currentUser !== 'undefined' && currentUser){
        sb.channel('canvas-deadlines-'+currentUser.id)
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'canvas_sync',filter:'user_id=eq.'+currentUser.id},
          function(payload){
            if(payload.new && payload.new.payload && payload.new.payload.type==='GRADINTEL_DEADLINES'){
              handleDeadlineData(payload.new.payload);
              sb.from('canvas_sync').delete().eq('id',payload.new.id).then(function(){});
            }
          }).subscribe();
      }
    }, 3000);
  });
})();

/* ═══════════════════════════════════════════════════════════
   ASSIGNMENTS BOOKMARKLET — mirrors grades bookmarklet exactly
   Uses same Supabase canvas_sync table + Realtime listener
   type: 'GRADINTEL_ASSIGNMENTS' to distinguish from grades
═══════════════════════════════════════════════════════════ */

function abmGetCode() {
  var sbUrl  = SUPABASE_URL;
  var sbAnon = SUPABASE_ANON;
  var userId = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'anonymous';

  var fn = '(function(){'
    + 'var SBURL="' + sbUrl + '";'
    + 'var SBANON="' + sbAnon + '";'
    + 'var UID="' + userId + '";'

    + 'function sendToSupabase(payload){'
      + 'fetch(SBURL+"/rest/v1/canvas_sync",{'
        + 'method:"POST",'
        + 'headers:{"Content-Type":"application/json","apikey":SBANON,"Authorization":"Bearer "+SBANON,"Prefer":"return=minimal"},'
        + 'body:JSON.stringify({user_id:UID,payload:payload,created_at:new Date().toISOString()})'
      + '}).catch(function(){});'
      // BroadcastChannel fallback (same browser, same origin)
      + 'try{var bc=new BroadcastChannel("gradintel_canvas");bc.postMessage({type:"GRADINTEL_ASSIGNMENTS",data:payload});bc.close();}catch(e){}'
      // postMessage fallback
      + 'try{window.opener&&window.opener.postMessage({type:"GRADINTEL_ASSIGNMENTS",data:payload},"*");}catch(e){}'
    + '}'

    + 'function toast(msg){'
      + 'var d=document.createElement("div");'
      + 'd.style.cssText="position:fixed;bottom:24px;right:24px;background:#818cf8;color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:700;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.4)";'
      + 'd.textContent=msg;document.body.appendChild(d);setTimeout(function(){d.remove();},3500);'
    + '}'

    + 'toast("📝 Gradintel: fetching assignments…");'

    + 'var canvasBase=location.origin;'

    // Try upcoming_events first (works anywhere on Canvas)
    + 'fetch(canvasBase+"/api/v1/users/self/upcoming_events?per_page=100",{credentials:"include",headers:{"Accept":"application/json","X-Requested-With":"XMLHttpRequest"}})'
    + '.then(function(r){return r.json();})'
    + '.then(function(events){'
      + 'var assigns=events.filter(function(e){return e.assignment||e.type==="assignment";});'
      + 'if(assigns.length>0){'
        + 'var dls=assigns.map(function(e){'
          + 'var a=e.assignment||e;'
          + 'return{name:a.name||e.title||"Assignment",course:e.context_name||"",courseName:e.context_name||"",due:a.due_at||e.end_at||null,type:"assignment",points:a.points_possible||null};'
        + '});'
        + 'sendToSupabase({type:"GRADINTEL_ASSIGNMENTS",deadlines:dls});'
        + 'toast("✅ Gradintel: "+dls.length+" upcoming assignment(s) synced! Switch back to Gradintel.");'
        + 'return;'
      + '}'
      // Fall through to per-course fetch if upcoming_events returns no assignments
      + 'return fetchAllCourses();'
    + '})'
    + '.catch(function(){return fetchAllCourses();});'

    // Per-course assignments fetch
    + 'function fetchAllCourses(){'
      + 'fetch(canvasBase+"/api/v1/courses?enrollment_state=active&per_page=50",{credentials:"include",headers:{"Accept":"application/json","X-Requested-With":"XMLHttpRequest"}})'
      + '.then(function(r){return r.json();})'
      + '.then(function(courses){'
        + 'if(!courses||!courses.length){toast("⚠️ No active courses found. Make sure you are logged into Canvas.");return;}'
        + 'var all=[],done=0,total=courses.length;'
        + 'courses.forEach(function(c){'
          + 'fetch(canvasBase+"/api/v1/courses/"+c.id+"/assignments?bucket=upcoming&per_page=50",{credentials:"include",headers:{"Accept":"application/json","X-Requested-With":"XMLHttpRequest"}})'
          + '.then(function(r){return r.json();})'
          + '.then(function(as){'
            + 'as.forEach(function(a){'
              + 'all.push({name:a.name,course:c.name,courseName:c.name,due:a.due_at||null,type:"assignment",points:a.points_possible||null,submissionTypes:a.submission_types||[]});'
            + '});'
          + '})'
          + '.catch(function(){})'
          + '.finally(function(){'
            + 'done++;'
            + 'if(done===total){'
              + 'if(!all.length){toast("⚠️ No upcoming assignments found. Try visiting a Canvas Assignments page first.");return;}'
              + 'sendToSupabase({type:"GRADINTEL_ASSIGNMENTS",deadlines:all});'
              + 'toast("✅ Gradintel: "+all.length+" assignment(s) synced! Switch back to Gradintel.");'
            + '}'
          + '});'
        + '});'
      + '})'
      + '.catch(function(err){toast("❌ Error: "+err.message+". Make sure you are logged into Canvas.");});'
    + '}'

  + '})();';

  return 'javascript:' + encodeURIComponent(fn);
}

function abmInitLink() {
  var link = document.getElementById('abm-bm-link');
  if (link) link.href = abmGetCode();
}

function openAssignBmPanel() {
  var panel = document.getElementById('dl-canvas-status');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // Re-generate bookmarklet code (bakes in fresh userId)
    abmInitLink();
  }
}

// Supabase Realtime listener for assignments
// Piggybacks on canvas_sync table, filters by type === 'GRADINTEL_ASSIGNMENTS'
function abmStartListener() {
  if (typeof sb === 'undefined' || !sb || typeof currentUser === 'undefined' || !currentUser) return;
  try {
    sb.channel('canvas-assignments-' + currentUser.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'canvas_sync',
        filter: 'user_id=eq.' + currentUser.id
      }, function(payload) {
        if (payload.new && payload.new.payload && payload.new.payload.type === 'GRADINTEL_ASSIGNMENTS') {
          abmHandleData(payload.new.payload);
          sb.from('canvas_sync').delete().eq('id', payload.new.id).then(function(){});
        }
      })
      .subscribe();
  } catch(e) { console.warn('ABM realtime failed:', e); }

  // BroadcastChannel fallback
  try {
    var bc = new BroadcastChannel('gradintel_canvas');
    var _orig = bc.onmessage;
    bc.onmessage = function(e) {
      if (e.data && e.data.type === 'GRADINTEL_ASSIGNMENTS') abmHandleData(e.data.data);
      else if (_orig) _orig.call(bc, e);
    };
  } catch(e) {}

  // postMessage fallback
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'GRADINTEL_ASSIGNMENTS') abmHandleData(e.data.data);
  });
}

function abmHandleData(data) {
  if (!data || !data.deadlines || !data.deadlines.length) {
    showToast('⚠️ No assignment data received.');
    return;
  }

  var imported = 0;
  var skipped  = 0;
  var dls      = getDeadlines();
  var existingKeys = new Set(dls.map(function(d) { return (d.title||'').toLowerCase().trim() + '|' + (d.date||'').slice(0,10); }));

  data.deadlines.forEach(function(a) {
    var title  = (a.title || a.name || '').trim();
    if (!title) return;
    var dueRaw = a.due || a.due_at || null;
    var dateStr = '';
    if (dueRaw) { try { dateStr = new Date(dueRaw).toISOString().slice(0,16); } catch(e){} }
    var key = title.toLowerCase() + '|' + dateStr.slice(0,10);
    if (existingKeys.has(key)) { skipped++; return; }

    // Try to match canvas course name to a subject
    var subId = '';
    var courseName = a.course || a.courseName || '';
    if (courseName) {
      (semesters || []).forEach(function(sem) {
        (sem.subjects || []).forEach(function(s) {
          if (!s.name) return;
          var sn = s.name.toLowerCase();
          var cn = courseName.toLowerCase();
          if (cn.indexOf(sn.slice(0,5)) >= 0 || sn.indexOf(cn.slice(0,5)) >= 0) subId = s.id;
        });
      });
    }

    var types = (a.submissionTypes || []).join(',');
    var type  = types.indexOf('quiz') >= 0 ? 'quiz'
              : types.indexOf('discussion') >= 0 ? 'project'
              : 'assignment';

    dls.push({
      id:      'dl_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      title:   title,
      date:    dateStr,
      course:  subId,
      weight:  a.points ? Math.min(20, Math.round(a.points / 10)) : 0,
      type:    type,
      done:    false,
      created: new Date().toISOString()
    });
    imported++;
    existingKeys.add(key);
  });

  saveDeadlines(dls);
  if (typeof renderDeadlines === 'function') renderDeadlines();

  // Close the panel
  var panel = document.getElementById('dl-canvas-status');
  if (panel) panel.style.display = 'none';

  var msg = '📅 Imported ' + imported + ' assignment(s) from Canvas!';
  if (skipped > 0) msg += ' (' + skipped + ' already added)';
  showToast(msg);
}

// abmStartListener is called from launchApp() after auth

function abmCopyCode() {
  var code = abmGetCode();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function(){ showToast('Bookmarklet code copied!'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = code; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    showToast('Bookmarklet code copied!');
  }
}


/* ═══════════════════════════════════════════════════════════
   NEW FEATURES: GPA Goal Sim, Finals Survival, Panic Mode, Share Card
═══════════════════════════════════════════════════════════ */

// ── GPA Goal Simulator ─────────────────────────────────────────
function runGoalSim() {
  var target  = parseFloat(document.getElementById('gs-target').value) || 0;
  var done    = parseFloat(document.getElementById('gs-done').value);
  var rem     = parseFloat(document.getElementById('gs-rem').value);
  var res     = document.getElementById('gs-result');

  // Update header
  var curGPA = computeAllGPA ? (computeAllGPA().cumGPA || 0) : 0;
  var el = document.getElementById('goal-cur-gpa');
  if (el) el.textContent = curGPA.toFixed(2);
  var td = document.getElementById('goal-target-disp');
  if (td) td.textContent = target ? target.toFixed(2) : '—';
  var gd = document.getElementById('goal-gap-disp');
  if (gd) {
    var gap = target - curGPA;
    gd.textContent = (gap >= 0 ? '+' : '') + gap.toFixed(2);
    gd.style.color = gap <= 0 ? 'var(--green)' : 'var(--yellow)';
  }

  if (!target || isNaN(done) || isNaN(rem) || rem <= 0) { res.style.display = 'none'; return; }
  res.style.display = '';

  // Required avg GPA in remaining credits
  // target = (curGPA * done + reqAvg * rem) / (done + rem)
  var reqAvg = (target * (done + rem) - curGPA * done) / rem;

  var scale = GPA[0] ? GPA : [{l:'A',p:4.0},{l:'B',p:3.0},{l:'C',p:2.0},{l:'F',p:0}];
  var maxP  = scale[0].p;

  var verdict = document.getElementById('gs-verdict');
  if (reqAvg > maxP) {
    verdict.style.background = 'rgba(239,68,68,.12)';
    verdict.style.color = 'var(--red)';
    verdict.innerHTML = '⚠️ Not achievable — you\'d need a <strong>' + reqAvg.toFixed(2) + '</strong> average, which exceeds the ' + maxP.toFixed(1) + ' scale. Consider adjusting your goal or timeframe.';
  } else if (reqAvg <= 0) {
    verdict.style.background = 'rgba(52,211,153,.12)';
    verdict.style.color = 'var(--green)';
    verdict.innerHTML = '🎉 Already on track! Your current GPA of <strong>' + curGPA.toFixed(2) + '</strong> already meets or exceeds your goal.';
  } else {
    var pct = reqAvg / maxP * 100;
    var diff = reqAvg - curGPA;
    var color = pct < 70 ? 'rgba(52,211,153,.12)' : pct < 85 ? 'rgba(251,191,36,.12)' : 'rgba(239,68,68,.12)';
    var tc = pct < 70 ? 'var(--green)' : pct < 85 ? 'var(--yellow)' : 'var(--red)';
    verdict.style.background = color;
    verdict.style.color = tc;
    verdict.innerHTML = 'You need an average GPA of <strong>' + reqAvg.toFixed(2) + '</strong> across your remaining ' + rem + ' credits. That\'s ' + (diff > 0 ? '<strong>+' + diff.toFixed(2) + '</strong> above' : '<strong>' + diff.toFixed(2) + '</strong> below') + ' your current average.';
  }

  // Scenarios table
  var scenarios = [
    { label: '🏆 All A\'s', gpa: maxP },
    { label: '📈 Mostly A\'s', gpa: maxP * 0.925 },
    { label: '📊 A/B Mix', gpa: maxP * 0.85 },
    { label: '📉 Mostly B\'s', gpa: maxP * 0.75 },
    { label: '😰 B/C Mix', gpa: maxP * 0.65 },
  ];
  var scEl = document.getElementById('gs-scenarios');
  scEl.innerHTML = scenarios.map(function(sc) {
    var finalGPA = (curGPA * done + sc.gpa * rem) / (done + rem);
    var hit = finalGPA >= target;
    return '<div style="background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:12px;text-align:center">'
      + '<div style="font-size:12px;font-weight:700;margin-bottom:6px">' + sc.label + '</div>'
      + '<div style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:22px;color:' + (hit ? 'var(--green)' : 'var(--red)') + '">' + finalGPA.toFixed(2) + '</div>'
      + '<div style="font-size:10px;margin-top:4px;color:' + (hit ? 'var(--green)' : 'var(--red)') + '">' + (hit ? '✓ Reaches goal' : '✗ Below goal') + '</div>'
      + '</div>';
  }).join('');
}

// ── Finals Survival Plan ─────────────────────────────────────
function runFinalsSurvival() {
  var el = document.getElementById('fsp-content');
  var courses = [];
  (semesters || []).forEach(function(sem) {
    (sem.subjects || []).forEach(function(s) {
      var r = computeSubject(s);
      if (!r.remExams.length) return;
      // Calculate what score is needed on remaining exams for each grade
      var targets = r.targets || [];
      var bTarget = targets.find(function(t) { return t.l === 'B'; });
      var aTarget = targets.find(function(t) { return t.l === 'A'; });
      courses.push({
        name:    s.name,
        cur:     r.cur,
        curG:    r.curG,
        remExams: r.remExams,
        remFrac: r.remFrac,
        needForB: bTarget ? bTarget.avg : null,
        needForA: aTarget ? aTarget.avg : null,
      });
    });
  });

  if (!courses.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:13px">No courses with remaining exams found. Add courses and mark upcoming exams as not yet taken.</div>';
    return;
  }

  // Sort by urgency: lowest current grade first
  courses.sort(function(a, b) { return a.cur - b.cur; });

  // Allocate study hours proportionally to how much grade improvement is possible
  var totalStudyHours = 20;
  var weights = courses.map(function(c) { return Math.max(1, 100 - c.cur); });
  var totalW  = weights.reduce(function(a,b){return a+b;}, 0);

  el.innerHTML = courses.map(function(c, i) {
    var hrs  = Math.round(weights[i] / totalW * totalStudyHours);
    var urgency = c.cur < 70 ? '🔴 Critical' : c.cur < 80 ? '🟡 At Risk' : '🟢 On Track';
    var urgColor = c.cur < 70 ? 'var(--red)' : c.cur < 80 ? 'var(--yellow)' : 'var(--green)';
    var needB = c.needForB !== null ? (c.needForB > 100 ? '⚠️ Not possible' : c.needForB < 0 ? '✅ Already secured' : Math.round(c.needForB) + '%') : '—';
    var needA = c.needForA !== null ? (c.needForA > 100 ? '⚠️ Not possible' : c.needForA < 0 ? '✅ Already secured' : Math.round(c.needForA) + '%') : '—';
    return '<div style="background:var(--surface2);border:1px solid var(--border2);border-radius:12px;padding:16px;margin-bottom:10px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
        + '<div style="font-weight:700;font-size:14px">' + c.name + '</div>'
        + '<div style="font-size:12px;font-weight:700;color:' + urgColor + '">' + urgency + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;font-size:12px">'
        + '<div style="text-align:center"><div style="color:var(--muted);margin-bottom:2px">Current</div><div style="font-weight:700">' + Math.round(c.cur) + '% (' + c.curG.l + ')</div></div>'
        + '<div style="text-align:center"><div style="color:var(--muted);margin-bottom:2px">Need for B</div><div style="font-weight:700">' + needB + '</div></div>'
        + '<div style="text-align:center"><div style="color:var(--muted);margin-bottom:2px">Need for A</div><div style="font-weight:700">' + needA + '</div></div>'
        + '<div style="text-align:center;background:rgba(129,140,248,.1);border-radius:8px;padding:4px"><div style="color:var(--accent);margin-bottom:2px;font-weight:700">Study</div><div style="font-weight:700;color:var(--accent)">' + hrs + 'h</div></div>'
      + '</div>'
      + (i === 0 ? '<div style="margin-top:8px;font-size:11px;color:var(--accent);font-weight:600">👆 Focus here first — most impact on your GPA</div>' : '')
    + '</div>';
  }).join('');
}

// ── Panic Mode ────────────────────────────────────────────────
var _panicActive = false;

function activatePanicMode() {
  _panicActive = true;

  // Apply red theme to body
  document.body.classList.add('panic-mode');

  // Shake animation
  document.body.style.animation = 'panicShake 0.5s ease both';
  setTimeout(function(){ document.body.style.animation = ''; }, 500);

  // Show modal — use flex so it actually appears
  var modal = document.getElementById('panic-modal');
  modal.style.display = 'flex';
  modal.style.animation = 'panicFadeIn 0.3s ease both';

  // Restore cursor inside modal area (body has cursor:none)
  document.body.style.cursor = 'auto';

  // Render content
  renderPanicModalContent();
}

function deactivatePanicMode() {
  _panicActive = false;
  document.body.classList.remove('panic-mode');
  document.body.style.cursor = '';  // restore custom cursor:none from CSS
  var modal = document.getElementById('panic-modal');
  modal.style.display = 'none';
}

function renderPanicModalContent() {
  var el = document.getElementById('panic-modal-content');
  var courses = [];

  (semesters || []).forEach(function(sem) {
    (sem.subjects || []).forEach(function(s) {
      var r = computeSubject(s);
      if (!r.remExams || !r.remExams.length) return; // skip fully-done courses

      // Collect all grade targets
      var gradeMap = {};
      (r.targets || []).forEach(function(t) { gradeMap[t.l] = t.avg; });

      courses.push({
        name:     s.name,
        cur:      r.cur,
        curG:     r.curG,
        remExams: r.remExams,
        grades:   gradeMap,
      });
    });
  });

  // Also add courses with no remaining exams as a "locked" row
  var lockedCourses = [];
  (semesters || []).forEach(function(sem) {
    (sem.subjects || []).forEach(function(s) {
      var r = computeSubject(s);
      if (!r.remExams || r.remExams.length === 0) {
        lockedCourses.push({ name: s.name, curG: r.curG, cur: r.cur });
      }
    });
  });

  if (!courses.length && !lockedCourses.length) {
    el.innerHTML = '<div style="color:#f87171;font-size:14px;text-align:center;padding:24px">No courses found. Add some courses and exams first!</div>';
    return;
  }

  var gradeOrder = ['A','A-','B+','B','B-','C+','C','C-','D+','D','D-'];
  var gradeColors = {
    'A':'#34d399','A-':'#6ee7b7',
    'B+':'#60a5fa','B':'#60a5fa','B-':'#93c5fd',
    'C+':'#fbbf24','C':'#fbbf24','C-':'#fde68a',
    'D+':'#f87171','D':'#f87171','D-':'#fca5a5'
  };

  function fmtScore(val) {
    if (val === undefined || val === null) return '<span style="color:#6b7280">—</span>';
    if (val < 0) return '<span style="color:#34d399;font-weight:700">✓ Already secured</span>';
    if (val > 100) return '<span style="color:#f87171;font-weight:700">✗ Impossible</span>';
    var col = val > 90 ? '#f87171' : val > 75 ? '#fbbf24' : '#34d399';
    return '<span style="color:' + col + ';font-weight:800;font-size:15px">' + Math.ceil(val) + '%</span>';
  }

  var html = '';

  if (courses.length) {
    html += '<div style="margin-bottom:20px">';
    html += '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#f87171;margin-bottom:12px">Courses With Remaining Exams</div>';

    courses.forEach(function(c) {
      var relevantGrades = gradeOrder.filter(function(g) { return c.grades[g] !== undefined; });
      if (!relevantGrades.length) relevantGrades = gradeOrder;

      html += '<div style="background:#200808;border:1px solid rgba(239,68,68,0.35);border-radius:16px;padding:20px;margin-bottom:14px">';

      // Course header
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
      html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:17px;color:#fff">' + c.name + '</div>';
      html += '<div style="display:flex;align-items:center;gap:10px">';
      html += '<div style="font-size:12px;color:#9ca3af">Current: <strong style="color:#f1f0ff">' + Math.round(c.cur) + '% (' + c.curG.l + ')</strong></div>';
      html += '<div style="font-size:11px;color:#f87171;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:100px;padding:3px 10px;">' + c.remExams.length + ' exam' + (c.remExams.length > 1 ? 's' : '') + ' left</div>';
      html += '</div></div>';

      // Grade grid
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px">';
      relevantGrades.forEach(function(g) {
        var val = c.grades[g];
        var col = gradeColors[g] || '#9ca3af';
        html += '<div style="background:rgba(0,0,0,0.4);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:10px 6px;text-align:center">';
        html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:800;font-size:16px;color:' + col + ';margin-bottom:4px">' + g + '</div>';
        html += '<div style="font-size:11px;color:#9ca3af;margin-bottom:2px">avg needed</div>';
        html += '<div style="font-size:13px">' + fmtScore(val) + '</div>';
        html += '</div>';
      });
      html += '</div>'; // end grade grid

      // Show remaining exams
      if (c.remExams.length > 0) {
        html += '<div style="margin-top:12px;font-size:11px;color:#9ca3af">';
        html += '<span style="color:#f87171;font-weight:700">Upcoming: </span>';
        html += c.remExams.map(function(e) {
          return '<span style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:2px 8px;margin-right:4px;display:inline-block">' + e.name + ' (' + e.weight + '%)</span>';
        }).join('');
        html += '</div>';
      }

      html += '</div>'; // end course card
    });

    html += '</div>';
  }

  if (lockedCourses.length) {
    html += '<div>';
    html += '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#6b7280;margin-bottom:10px">Grade Locked (No Exams Remaining)</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px">';
    lockedCourses.forEach(function(c) {
      html += '<div style="background:#150303;border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between">';
      html += '<div style="font-size:13px;color:#9ca3af;font-weight:600">' + c.name + '</div>';
      html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:800;font-size:16px;color:#34d399">✓ ' + c.curG.l + '</div>';
      html += '</div>';
    });
    html += '</div></div>';
  }

  el.innerHTML = html;
}

// Legacy kept for compatibility
function runPanicMode() { activatePanicMode(); }

// ── Shareable GPA Card ─────────────────────────────────────────
function openShareCard() {
  var modal = document.getElementById('share-card-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  var allGPA = computeAllGPA ? computeAllGPA() : null;
  var curSem = semesters && semesters.length ? semesters[semesters.length-1] : null;

  document.getElementById('sc-gpa').textContent = allGPA ? (allGPA.cumGPA||0).toFixed(2) : '—';
  document.getElementById('sc-semester').textContent = curSem ? (curSem.name || 'Current Semester') : 'Cumulative GPA';

  if (curSem) {
    var lines = (curSem.subjects || []).map(function(s) {
      var r = computeSubject(s);
      return '<div>' + r.curG.l + '&nbsp;&nbsp;' + s.name + '</div>';
    }).join('');
    document.getElementById('sc-courses').innerHTML = lines;
  }
}

function copyShareCard() {
  showToast('📸 Screenshot this card and share it!');
}

// ── Smart Study Plan ─────────────────────────────────────────
function generateSmartStudyPlan() {
  var btn = document.getElementById('ssp-btn');
  var out = document.getElementById('ssp-output');
  if (!btn || !out) return;

  btn.disabled = true;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Generating...';

  // Collect all subjects across semesters
  var courses = [];
  (semesters || []).forEach(function(sem) {
    (sem.subjects || []).forEach(function(s) {
      var r = computeSubject(s);
      var gradeMap = {};
      (r.targets || []).forEach(function(t) { gradeMap[t.l] = t.avg; });

      var status, urgency, color, emoji;
      var hasRem = r.remExams && r.remExams.length > 0;

      if (!hasRem) {
        status = 'locked';
        urgency = 0;
        emoji = '✅';
        color = '#34d399';
      } else {
        var needA = gradeMap['A'];
        var needB = gradeMap['B'];
        var needC = gradeMap['C'];
        var needD = gradeMap['D'];

        if (needD !== undefined && needD > 100) {
          status = 'critical'; urgency = 100; emoji = '🔴'; color = '#ef4444';
        } else if (needC !== undefined && needC > 100) {
          status = 'danger'; urgency = 85; emoji = '🟠'; color = '#f97316';
        } else if (needB !== undefined && needB > 100) {
          status = 'tough'; urgency = 60; emoji = '🟡'; color = '#fbbf24';
        } else if (needA !== undefined && needA > 100) {
          status = 'recoverable'; urgency = 35; emoji = '🔵'; color = '#60a5fa';
        } else {
          status = 'good'; urgency = 10; emoji = '🟢'; color = '#34d399';
        }
      }

      courses.push({
        name: s.name,
        credits: s.credits || 3,
        cur: r.cur,
        curG: r.curG,
        remExams: r.remExams || [],
        grades: gradeMap,
        status: status,
        urgency: urgency,
        emoji: emoji,
        color: color,
        hasRem: hasRem,
        semName: sem.name,
      });
    });
  });

  if (!courses.length) {
    out.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:16px;text-align:center">No courses found. Add some subjects first!</div>';
    btn.disabled = false;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate My Study Plan';
    return;
  }

  // Sort by urgency desc
  courses.sort(function(a, b) { return b.urgency - a.urgency; });

  var activeCourses = courses.filter(function(c) { return c.hasRem; });
  var lockedCourses = courses.filter(function(c) { return !c.hasRem; });

  function fmtNeeded(val, grade) {
    if (val === undefined || val === null) return null;
    if (val <= 0) return '<span style="color:#34d399;font-weight:700">✓ Already secured</span>';
    if (val > 100) return '<span style="color:#f87171;font-weight:700">✗ Not achievable</span>';
    var col = val >= 90 ? '#f87171' : val >= 75 ? '#fbbf24' : '#34d399';
    return 'need <strong style="color:' + col + '">' + Math.ceil(val) + '%</strong> for ' + grade;
  }

  var html = '';

  // Header summary
  var critCount = activeCourses.filter(function(c){ return c.status==='critical'||c.status==='danger'; }).length;
  var goodCount = activeCourses.filter(function(c){ return c.status==='good'; }).length;

  html += '<div style="background:rgba(129,140,248,0.06);border:1px solid rgba(129,140,248,0.2);border-radius:14px;padding:16px 20px;margin-bottom:20px">';
  html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:15px;margin-bottom:8px;color:var(--text)">📋 Your Study Situation</div>';
  html += '<div style="font-size:13px;color:var(--muted2);line-height:1.8">';
  html += 'You have <strong style="color:var(--text)">' + activeCourses.length + ' course' + (activeCourses.length!==1?'s':'') + '</strong> with upcoming exams. ';
  if (critCount > 0) {
    html += '<strong style="color:#ef4444">' + critCount + ' need urgent attention.</strong> ';
  }
  if (goodCount > 0) {
    html += goodCount + ' are in good shape — focus your energy elsewhere.';
  }
  html += '</div></div>';

  // Priority list
  if (activeCourses.length > 0) {
    html += '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Study Priority Order</div>';

    activeCourses.forEach(function(c, i) {
      var needA = fmtNeeded(c.grades['A'], 'A');
      var needB = fmtNeeded(c.grades['B'], 'B');
      var needC = fmtNeeded(c.grades['C'], 'C');
      var needD = fmtNeeded(c.grades['D'], 'D (pass)');

      // Verdict sentence
      var verdict = '';
      if (c.status === 'critical') {
        verdict = 'Passing this course is at risk — every point counts right now.';
      } else if (c.status === 'danger') {
        verdict = 'A C is in jeopardy. Push hard on upcoming exams.';
      } else if (c.status === 'tough') {
        verdict = 'Still recoverable — a strong exam performance can pull this up.';
      } else if (c.status === 'recoverable') {
        verdict = 'Solid standing — an A is out of reach but B or higher is very achievable.';
      } else {
        verdict = 'You\'re in great shape here. Maintain momentum.';
      }

      html += '<div style="background:var(--surface2);border:1px solid var(--border2);border-radius:14px;padding:18px;margin-bottom:10px;border-left:3px solid ' + c.color + '">';
      html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">';
      html += '<div>';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      html += '<span style="font-size:16px">' + c.emoji + '</span>';
      html += '<span style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:16px">' + c.name + '</span>';
      html += '<span style="background:rgba(0,0,0,0.2);border-radius:100px;padding:2px 8px;font-size:10px;font-weight:700;color:' + c.color + '">' + c.status.toUpperCase() + '</span>';
      html += '</div>';
      html += '<div style="font-size:12px;color:var(--muted2)">' + verdict + '</div>';
      html += '</div>';
      html += '<div style="text-align:right;flex-shrink:0">';
      html += '<div style="font-size:10px;color:var(--muted);margin-bottom:2px">Current</div>';
      html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:800;font-size:20px;color:' + c.color + '">' + Math.round(c.cur) + '%</div>';
      html += '<div style="font-size:11px;color:var(--muted)">' + c.curG.l + ' grade</div>';
      html += '</div>';
      html += '</div>';

      // Grade targets row
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:10px">';
      [['A','#34d399'],['B','#60a5fa'],['C','#fbbf24'],['D','#f87171']].forEach(function(pair) {
        var g = pair[0], col = pair[1];
        var val = c.grades[g];
        if (val === undefined) return;
        var display;
        if (val <= 0) display = '<span style="color:#34d399;font-size:12px;font-weight:700">✓ Already secured</span>';
        else if (val > 100) display = '<span style="color:#f87171;font-size:12px;font-weight:700">✗ Not achievable</span>';
        else display = '<span style="color:' + (val>=90?'#f87171':val>=75?'#fbbf24':'#34d399') + ';font-size:14px;font-weight:800">' + Math.ceil(val) + '%</span><span style="font-size:11px;color:var(--muted)"> avg needed</span>';
        html += '<div style="background:var(--surface3);border-radius:10px;padding:8px 10px;text-align:center">';
        html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:800;font-size:14px;color:' + col + ';margin-bottom:3px">' + g + '</div>';
        html += '<div>' + display + '</div>';
        html += '</div>';
      });
      html += '</div>';

      // Upcoming exams
      if (c.remExams.length > 0) {
        html += '<div style="font-size:11px;color:var(--muted);margin-top:4px"><span style="color:var(--accent);font-weight:600">Upcoming: </span>';
        html += c.remExams.map(function(e){
          return '<span style="background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.2);border-radius:6px;padding:2px 8px;margin-right:4px;display:inline-block">' + e.name + ' (' + e.weight + '%)</span>';
        }).join('');
        html += '</div>';
      }

      // Focus tip for #1 priority
      if (i === 0 && c.status !== 'good') {
        html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(129,140,248,0.08);border-radius:8px;font-size:12px;color:var(--accent);font-weight:600">👆 Start here — this is your highest priority right now.</div>';
      }

      html += '</div>';
    });
  }

  // Locked / done courses
  if (lockedCourses.length > 0) {
    html += '<div style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;margin-top:8px">Grade Locked — No Action Needed</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">';
    lockedCourses.forEach(function(c) {
      html += '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--muted2)">' + c.name + '</div>';
      html += '<div style="font-family:\'Clash Display\',sans-serif;font-weight:800;font-size:16px;color:#34d399">✓ ' + c.curG.l + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  out.innerHTML = html;
  btn.disabled = false;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Regenerate Plan';
}

// goal sim inits via showTab and updateStats hooks

// ══════════════════════════════════════════════════════════════
// FEEDBACK
// ══════════════════════════════════════════════════════════════
let _fbRating = 0;
function setFbRating(n) {
  _fbRating = n;
  document.querySelectorAll('#fb-stars button').forEach(function(b) {
    const v = parseInt(b.getAttribute('data-rating'));
    b.style.background = v <= n ? 'rgba(129,140,248,.15)' : 'transparent';
    b.style.borderColor = v <= n ? 'var(--accent)' : 'var(--border2)';
    b.style.color = v <= n ? 'var(--accent)' : 'var(--muted)';
  });
}
async function submitFeedback() {
  const type    = document.getElementById('fb-type')?.value || 'general';
  const subject = document.getElementById('fb-subject')?.value.trim();
  const message = document.getElementById('fb-message')?.value.trim();
  const status  = document.getElementById('fb-status');
  if (!subject || !message) { showToast('⚠️ Please fill in subject and message'); return; }
  const payload = {
    user_id:    currentUser?.id || null,
    user_email: currentUser?.email || 'anonymous',
    type, subject, message,
    rating: _fbRating || null,
    created_at: new Date().toISOString(),
    user_agent: navigator.userAgent.slice(0, 200)
  };
  try {
    const { error } = await sb.from('gradintel_feedback').insert(payload);
    if (error) throw error;
    status.style.display = 'block';
    status.style.background = 'rgba(52,211,153,.1)';
    status.style.border = '1px solid rgba(52,211,153,.3)';
    status.style.color = 'var(--green)';
    status.textContent = '✅ Thank you! Your feedback has been sent.';
    document.getElementById('fb-subject').value = '';
    document.getElementById('fb-message').value = '';
    _fbRating = 0; setFbRating(0);
  } catch(e) {
    status.style.display = 'block';
    status.style.background = 'rgba(248,113,113,.1)';
    status.style.border = '1px solid rgba(248,113,113,.3)';
    status.style.color = 'var(--red)';
    status.textContent = '❌ Could not send feedback: ' + (e.message || 'Unknown error');
  }
}

// ══════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════
const ADMIN_EMAIL = 'akanshul20062008@gmail.com'; // ← your admin email

let _adminAllFeedback = [];
let _adminFilter = 'all';

function maybeShowAdminBtn() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
  // Show admin nav item
  const btn = document.getElementById('admin-nav-btn');
  if (btn) btn.style.display = '';
  // Set email display
  const ed = document.getElementById('admin-email-display');
  if (ed) ed.textContent = currentUser.email;
  // Auto-load feedback when tab is first shown
  loadAdminFeedback();
}

async function loadAdminFeedback() {
  const list = document.getElementById('admin-feedback-list');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:40px">⏳ Loading…</div>';
  try {
    const { data, error } = await sb.from('gradintel_feedback').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    _adminAllFeedback = data || [];
    // Update stats
    document.getElementById('admin-stat-total').textContent = _adminAllFeedback.length;
    document.getElementById('admin-stat-bugs').textContent = _adminAllFeedback.filter(f=>f.type==='bug').length;
    document.getElementById('admin-stat-features').textContent = _adminAllFeedback.filter(f=>f.type==='feature').length;
    const rated = _adminAllFeedback.filter(f=>f.rating);
    document.getElementById('admin-stat-avg').textContent = rated.length ? (rated.reduce((a,f)=>a+f.rating,0)/rated.length).toFixed(1)+'★' : '—';
    renderAdminFeedback();
  } catch(e) {
    list.innerHTML = '<div style="color:var(--red);font-size:13px;text-align:center;padding:40px">❌ ' + (e.message||'Could not load feedback') + '<br><br><small>Make sure the Supabase table and RLS policy are set up correctly.</small></div>';
  }
}

function adminFilter(type) {
  _adminFilter = type;
  ['all','bug','feature','general','praise'].forEach(t => {
    const btn = document.getElementById('af-'+t);
    if (btn) { btn.className = t === type ? 'btn btn-primary' : 'btn btn-secondary'; btn.style.fontSize='11px'; btn.style.padding='5px 12px'; }
  });
  renderAdminFeedback();
}

function renderAdminFeedback() {
  const list = document.getElementById('admin-feedback-list');
  if (!list) return;
  const filtered = _adminFilter === 'all' ? _adminAllFeedback : _adminAllFeedback.filter(f=>f.type===_adminFilter);
  if (!filtered.length) { list.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:40px">No feedback found.</div>'; return; }
  const typeColors = { bug:'#f87171', feature:'#818cf8', general:'#60a5fa', praise:'#34d399' };
  const typeIcons  = { bug:'🐛', feature:'✨', general:'💬', praise:'🙌' };
  list.innerHTML = filtered.map(function(f) {
    const col   = typeColors[f.type] || 'var(--muted)';
    const ico   = typeIcons[f.type]  || '💬';
    const stars = f.rating ? '★'.repeat(f.rating) + '<span style="opacity:.3">★</span>'.repeat(5-f.rating) : '—';
    const date  = new Date(f.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
    return '<div class="card" style="margin-bottom:12px;border-left:3px solid '+col+'">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
        '<span style="background:'+col+'22;color:'+col+';border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700">'+ico+' '+(f.type||'general').toUpperCase()+'</span>' +
        '<span style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:15px">'+escHtml(f.subject||'(no subject)')+'</span>' +
        '<span style="margin-left:auto;font-size:11px;color:var(--muted)">'+date+'</span>' +
      '</div>' +
      '<div style="font-size:13px;color:var(--muted2);line-height:1.7;margin-bottom:10px;white-space:pre-wrap">'+escHtml(f.message||'')+'</div>' +
      '<div style="display:flex;gap:16px;font-size:12px;color:var(--muted);flex-wrap:wrap">' +
        '<span>👤 '+escHtml(f.user_email||'anonymous')+'</span>' +
        '<span>⭐ '+stars+'</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}