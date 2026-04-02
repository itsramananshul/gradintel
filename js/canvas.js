// ══════════════════════════════════════════════════════════════
// ████  NEW FEATURES BLOCK  ████
// ══════════════════════════════════════════════════════════════

// ─── HELPERS ───────────────────────────────────────────────
function getNS(key, def=null){ try{const v=localStorage.getItem(key); return v!==null?JSON.parse(v):def;}catch{return def;} }
function setNS(key,val){ try{localStorage.setItem(key,JSON.stringify(val));}catch{} }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function userKey(k){ return k+'_'+(currentUser?.id||'anon'); }
function showXPPopup(msg){ const el=document.createElement('div'); el.className='xp-popup'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); }

// ─── XP & LEVELS ──────────────────────────────────────────
const XP_LEVELS=[
  {lvl:1,title:'Freshman',xp:0},
  {lvl:2,title:'Sophomore',xp:100},
  {lvl:3,title:'Junior',xp:250},
  {lvl:4,title:'Senior',xp:500},
  {lvl:5,title:'Honor Roll',xp:800},
  {lvl:6,title:'Dean\'s List',xp:1200},
  {lvl:7,title:'Scholar',xp:1800},
  {lvl:8,title:'Magna Cum Laude',xp:2600},
  {lvl:9,title:'Summa Cum Laude',xp:3500},
  {lvl:10,title:'Valedictorian',xp:5000}
];
function getXP(){ return getNS(userKey('gradintel_xp'),0); }
function addXP(pts, reason=''){
  const prev=getXP(); const next=prev+pts;
  setNS(userKey('gradintel_xp'),next);
  showXPPopup(`+${pts} XP — ${reason}`);
  const prevLvl=getLevel(prev); const nextLvl=getLevel(next);
  if(nextLvl.lvl>prevLvl.lvl){ setTimeout(()=>{ showXPPopup(`🎉 Level Up! ${nextLvl.title}`); fireConfetti(); },600); }
  checkBadges();
}
function getLevel(xp=null){
  if(xp===null) xp=getXP();
  let cur=XP_LEVELS[0];
  for(const l of XP_LEVELS){ if(xp>=l.xp) cur=l; else break; }
  return cur;
}

// ─── ACTIVITY STREAK ─────────────────────────────────────
function logActivity(){
  const k=userKey('gradintel_activity');
  const data=getNS(k,{});
  const today=todayStr();
  data[today]=(data[today]||0)+1;
  setNS(k,data);
}
function getStreak(){
  const data=getNS(userKey('gradintel_activity'),{});
  let streak=0; const d=new Date();
  for(let i=0;i<365;i++){
    const s=d.toISOString().slice(0,10);
    if(data[s]) streak++;
    else if(i>0) break;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

// ─── BADGES ───────────────────────────────────────────────
const ALL_BADGES=[
  {id:'first_login',ico:'🎓',name:'First Step',desc:'Signed in for the first time',xp:10},
  {id:'first_grade',ico:'📝',name:'First Grade',desc:'Logged your first exam score',xp:20},
  {id:'gpa_3',ico:'⭐',name:'3.0 Club',desc:'Achieved a semester GPA ≥ 3.0',xp:50},
  {id:'gpa_35',ico:'🌟',name:'Honor Roll',desc:'Achieved a semester GPA ≥ 3.5',xp:100},
  {id:'gpa_4',ico:'🏆',name:'Perfect GPA',desc:'Achieved a semester GPA of 4.0',xp:200},
  {id:'streak_3',ico:'🔥',name:'On Fire',desc:'3-day activity streak',xp:30},
  {id:'streak_7',ico:'💥',name:'Unstoppable',desc:'7-day activity streak',xp:75},
  {id:'streak_30',ico:'⚡',name:'Legend',desc:'30-day activity streak',xp:300},
  {id:'courses_5',ico:'📚',name:'Bookworm',desc:'Tracked 5+ courses total',xp:40},
  {id:'courses_20',ico:'🧠',name:'Genius',desc:'Tracked 20+ courses total',xp:150},
  {id:'sems_3',ico:'🗓️',name:'Veteran',desc:'Completed 3 semesters',xp:80},
  {id:'sems_6',ico:'🎖️',name:'Senior',desc:'Completed 6 semesters',xp:160},
  {id:'pomodoro_1',ico:'🍅',name:'First Pomo',desc:'Completed your first Pomodoro',xp:15},
  {id:'pomodoro_10',ico:'⏰',name:'Focus Master',desc:'10 Pomodoro sessions completed',xp:60},
  {id:'pomodoro_50',ico:'🧘',name:'Deep Work',desc:'50 Pomodoro sessions',xp:200},
  {id:'deadlines_1',ico:'📌',name:'Planner',desc:'Added your first deadline',xp:10},
  {id:'deadlines_done_5',ico:'✅',name:'Task Crusher',desc:'Completed 5 deadlines',xp:50},
  {id:'mood_10',ico:'😊',name:'Self-Aware',desc:'Logged mood 10 times',xp:30},
  {id:'degree_setup',ico:'🎓',name:'Goal Setter',desc:'Set up your degree plan',xp:25},
  {id:'req_done_10',ico:'📋',name:'On Track',desc:'Completed 10 course requirements',xp:100},
  {id:'simulator',ico:'🎯',name:'Strategist',desc:'Used the grade simulator',xp:15},
  {id:'time_machine',ico:'⏮️',name:'Time Traveler',desc:'Used the GPA time machine',xp:15},
];
function getUnlockedBadges(){ return getNS(userKey('gradintel_badges'),{}); }
function unlockBadge(id){
  const badges=getUnlockedBadges();
  if(badges[id]) return;
  const b=ALL_BADGES.find(x=>x.id===id); if(!b) return;
  badges[id]=new Date().toISOString();
  setNS(userKey('gradintel_badges'),badges);
  setTimeout(()=>{ showXPPopup(`🏆 Badge: ${b.name}!`); addXP(b.xp, b.name); },800);
}
function checkBadges(){
  const badges=getUnlockedBadges();
  // activity streaks
  const streak=getStreak();
  if(streak>=3) unlockBadge('streak_3');
  if(streak>=7) unlockBadge('streak_7');
  if(streak>=30) unlockBadge('streak_30');
  // courses
  let totalCourses=0; semesters.forEach(s=>totalCourses+=s.subjects.length);
  if(totalCourses>=1) unlockBadge('first_grade');
  if(totalCourses>=5) unlockBadge('courses_5');
  if(totalCourses>=20) unlockBadge('courses_20');
  // semesters
  if(semesters.length>=3) unlockBadge('sems_3');
  if(semesters.length>=6) unlockBadge('sems_6');
  // GPA
  semesters.forEach(sem=>{
    const g=sem._gpa||0;
    if(g>=3.0) unlockBadge('gpa_3');
    if(g>=3.5) unlockBadge('gpa_35');
    if(g>=3.99) unlockBadge('gpa_4');
  });
  // pomodoro
  const pomoSessions=getNS(userKey('gradintel_pomo_total'),0);
  if(pomoSessions>=1) unlockBadge('pomodoro_1');
  if(pomoSessions>=10) unlockBadge('pomodoro_10');
  if(pomoSessions>=50) unlockBadge('pomodoro_50');
  // deadlines
  const dls=getNS(userKey('gradintel_deadlines'),[]);
  if(dls.length>=1) unlockBadge('deadlines_1');
  const doneDls=dls.filter(d=>d.done).length;
  if(doneDls>=5) unlockBadge('deadlines_done_5');
  // mood
  const moods=getNS(userKey('gradintel_mood'),[]);
  if(moods.length>=10) unlockBadge('mood_10');
  // degree
  const degrees = getDegrees();
  if(degrees.some(d => d.name && d.name !== 'My Degree' && d.name !== 'New Degree')) unlockBadge('degree_setup');
  const allReqs = degrees.flatMap(d => d.requirements || []);
  const doneReqs = allReqs.filter(r => r.status === 'completed').length;
  if(doneReqs>=10) unlockBadge('req_done_10');
}

// ─── RENDER ACHIEVEMENTS ─────────────────────────────────
function renderAchievements(){
  logActivity();
  unlockBadge('first_login');
  checkBadges();
  const xp=getXP();
  const level=getLevel(xp);
  const nextLevel=XP_LEVELS.find(l=>l.xp>xp)||XP_LEVELS[XP_LEVELS.length-1];
  const prevLvlXP=level.xp;
  const nextLvlXP=nextLevel.xp;
  const pct=nextLvlXP>prevLvlXP?Math.min(100,Math.round((xp-prevLvlXP)/(nextLvlXP-prevLvlXP)*100)):100;
  document.getElementById('xp-total').textContent=xp.toLocaleString();
  document.getElementById('xp-level').textContent=level.lvl;
  document.getElementById('xp-title-lbl').textContent=level.title;
  document.getElementById('xp-level-label').textContent=`Level ${level.lvl} — ${level.title}`;
  document.getElementById('xp-next-label').textContent=`${xp} / ${nextLvlXP} XP`;
  setTimeout(()=>{ document.getElementById('xp-bar-fill').style.width=pct+'%'; },100);
  const activities=[
    'Log a grade → +20 XP','Complete a Pomodoro → +15 XP','Log mood → +5 XP',
    'Complete a deadline → +10 XP','Unlock a badge → bonus XP','Add a course → +5 XP'
  ];
  document.getElementById('xp-activities').innerHTML='<strong>How to earn XP:</strong> '+activities.join(' &nbsp;·&nbsp; ');
  const unlocked=getUnlockedBadges();
  document.getElementById('badges-count').textContent=Object.keys(unlocked).length;
  document.getElementById('badges-total').textContent=ALL_BADGES.length;
  const grid=document.getElementById('badges-grid'); grid.innerHTML='';
  ALL_BADGES.forEach(b=>{
    const isUnlocked=!!unlocked[b.id];
    const div=document.createElement('div'); div.className='badge-card'+(isUnlocked?' unlocked':'');
    const dateStr=isUnlocked?new Date(unlocked[b.id]).toLocaleDateString():'Locked';
    div.innerHTML=`<span class="badge-ico">${isUnlocked?b.ico:'🔒'}</span><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div><div class="badge-date">${isUnlocked?'Earned '+dateStr:'???'}</div>`;
    if(isUnlocked) div.style.cursor='pointer'; div.title=b.desc;
    grid.appendChild(div);
  });
  // GPA streak
  const gpaStreakSems=[];
  const goalGpa=policies.goalGpa||3.0;
  let streak=0; let max=0;
  semesters.forEach(sem=>{
    if((sem._gpa||0)>=goalGpa){ streak++; max=Math.max(max,streak); }
    else streak=0;
    gpaStreakSems.push({name:sem.name,gpa:sem._gpa||0,above:(sem._gpa||0)>=goalGpa});
  });
  const gsc=document.getElementById('gpa-streak-content');
  gsc.innerHTML=`<div style="font-size:13px;color:var(--muted2);margin-bottom:12px">Goal GPA: <strong>${goalGpa}</strong> · Current streak: <strong style="color:var(--accent)">${streak}</strong> semester${streak!==1?'s':''} · Best: <strong>${max}</strong></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${gpaStreakSems.map(s=>`<div style="background:${s.above?'rgba(52,211,153,.12)':'rgba(248,113,113,.08)'};border:1px solid ${s.above?'rgba(52,211,153,.3)':'rgba(248,113,113,.25)'};border-radius:var(--r-sm);padding:8px 12px;font-size:12px"><div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:15px;color:${s.above?'var(--green)':'var(--red)'}">${(s.gpa||0).toFixed(2)}</div><div style="color:var(--muted)">${s.name||'Sem'}</div></div>`).join('')}</div>`;
}

// ─── GRADE SIMULATOR ─────────────────────────────────────
let simCharts={};
function getAllActiveCourses(){
  if(!semesters.length) return [];
  return semesters.flatMap(sem=>sem.subjects.map(s=>({...s,semId:sem.id,semName:sem.name})));
}
function getRemExams(course){
  return (course.exams||[]).filter(e=>!e.taken);
}
function simGPAWithScores(scoreMap){
  // scoreMap: { subjectId: { examId: score } }
  let totalCP=0, totalCR=0;
  semesters.forEach(sem=>{
    sem.subjects.forEach(s=>{
      const simExams=(s.exams||[]).map(e=>{
        if(!e.taken && scoreMap[s.id]?.[e.id]!=null){
          return {...e,taken:true,score:scoreMap[s.id][e.id]};
        }
        return e;
      });
      const simS={...s,exams:simExams};
      const res=computeSubject(simS);
      totalCP+=s.credits*(res.curG?.p||0);
      totalCR+=s.credits;
    });
  });
  return totalCR?totalCP/totalCR:0;
}
function buildScoreMap(defaultScore){
  const map={};
  getAllActiveCourses().forEach(s=>{
    getRemExams(s).forEach(e=>{
      if(!map[s.id]) map[s.id]={};
      map[s.id][e.id]=defaultScore;
    });
  });
  return map;
}
function renderSimulator(){
  unlockBadge('simulator');
  const courses=getAllActiveCourses();
  const hasRem=courses.some(c=>getRemExams(c).length>0);
  document.getElementById('sim-no-data').style.display=hasRem?'none':'block';
  document.getElementById('sim-content').style.display=hasRem?'block':'none';
  if(!hasRem) return;
  // Scenarios & sliders removed — render safe zone + target grade only
  renderSafeZone();
  renderMinCalc();
}
function updateSimScore(courseId, val){
  document.getElementById('sim-score-'+courseId).textContent=val+'%';
  updateCustomScenario();
}
function updateCustomScenario(){
  const map={};
  getAllActiveCourses().forEach(s=>{
    getRemExams(s).forEach(e=>{
      const slider=document.querySelector(`[oninput*="updateSimScore('${s.id}'"]`);
      const score=slider?parseInt(slider.value):75;
      if(!map[s.id]) map[s.id]={};
      map[s.id][e.id]=score;
    });
  });
  const gpa=simGPAWithScores(map);
  const el=document.getElementById('sim-s3-gpa');
  if(el){ el.textContent=gpa.toFixed(2); el.style.color=gpa>=3.5?'var(--green)':gpa>=2.5?'var(--accent)':'var(--red)'; }
}
function renderSafeZone(){
  const c=document.getElementById('sim-safezone'); if(!c) return;
  const courses=getAllActiveCourses().filter(x=>getRemExams(x).length>0);
  c.innerHTML=courses.map(s=>{
    const gpa=s.credits>0?((s._gpa||computeSubject(s).curG.p)):0;
    const isGreen=gpa>=3.5; const isYellow=gpa>=2.5&&gpa<3.5;
    const zone=isGreen?'🟢 Safe Zone':isYellow?'🟡 Caution Zone':'🔴 Danger Zone';
    const zc=isGreen?'var(--green)':isYellow?'var(--yellow)':'var(--red)';
    return `<div class="safe-zone-bar"><div class="sz-name">${s.name}</div><div class="sz-indicator" style="background:${zc}22;color:${zc};border:1px solid ${zc}44">${zone}</div></div>`;
  }).join('');
}
function renderMinCalc(){
  const c=document.getElementById('sim-minimum'); if(!c) return;
  const courses=getAllActiveCourses().filter(x=>getRemExams(x).length>0);
  if(!courses.length){ c.innerHTML='<div style="color:var(--muted);font-size:13px">No remaining exams found.</div>'; return; }

  const gradeOpts = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'];

  c.innerHTML = courses.map(s => {
    const remExams = getRemExams(s);
    const selId = 'tgt-grade-' + s.id;
    const resId = 'tgt-result-' + s.id;
    const res = computeSubject(s);
    return `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">
        <div>
          <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:14px">${s.name}</div>
          <div style="font-size:11px;color:var(--muted)">${remExams.length} exam${remExams.length!==1?'s':''} remaining · Currently ${res.cur.toFixed(1)}% (${res.curG.l})</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:var(--muted2)">I want:</span>
          <select id="${selId}" onchange="calcTargetGrade('${s.id}')"
            style="padding:6px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--surface3);color:var(--text);font-family:'Clash Display',sans-serif;font-weight:700;font-size:14px;cursor:pointer">
            ${gradeOpts.map(g => `<option value="${g}" ${g==='A'?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="${resId}"></div>
    </div>`;
  }).join('');

  // Compute initial results for all courses
  courses.forEach(s => calcTargetGrade(s.id));
}

function calcTargetGrade(courseId){
  const s = getAllActiveCourses().find(x => x.id === courseId); if(!s) return;
  const selEl = document.getElementById('tgt-grade-' + courseId);
  const resEl = document.getElementById('tgt-result-' + courseId);
  if(!selEl || !resEl) return;

  const targetGrade = selEl.value;
  const res = computeSubject(s);
  const remExams = getRemExams(s);

  // Find the target GPA point from pctToG mapping
  const tgt = res.targets.find(t => t.l === targetGrade) || res.targets[0];
  if(!tgt){ resEl.innerHTML = '<span style="color:var(--muted);font-size:12px">No data.</span>'; return; }

  const avg = tgt.avg;
  let html = '';
  let overallColor;

  if(avg === null){
    html = `<div style="color:var(--green);font-family:'Clash Display',sans-serif;font-weight:700;font-size:13px">✅ Already secured! You've got ${targetGrade}.</div>`;
    overallColor = 'var(--green)';
  } else if(avg > 100){
    html = `<div style="color:var(--red);font-family:'Clash Display',sans-serif;font-weight:700;font-size:13px">❌ Not achievable — would need ${avg.toFixed(1)}% on remaining exams.</div>`;
    overallColor = 'var(--red)';
  } else {
    overallColor = avg < 70 ? 'var(--green)' : avg < 85 ? 'var(--yellow)' : 'var(--red)';
    html = `<div style="margin-bottom:8px;font-family:'Clash Display',sans-serif;font-weight:700;font-size:13px;color:${overallColor}">Need avg <strong>${avg.toFixed(1)}%</strong> on remaining exams for ${targetGrade}</div>`;
    // Per-exam breakdown
    if(tgt.perExam && tgt.perExam.length > 1){
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
      tgt.perExam.forEach(ex => {
        const nd = ex.needed;
        let col = 'var(--green)', txt;
        if(nd === null){ txt = 'N/A'; col = 'var(--muted)'; }
        else if(nd <= 0){ txt = 'Secured ✅'; col = 'var(--green)'; }
        else if(nd > 100){ txt = 'Too high ❌'; col = 'var(--red)'; }
        else { txt = nd.toFixed(1)+'%'; col = nd<70?'var(--green)':nd<85?'var(--yellow)':'var(--red)'; }
        html += `<div style="padding:4px 10px;border-radius:8px;background:var(--surface3);border:1px solid var(--border);font-size:11px">
          <span style="color:var(--muted2)">${ex.name}: </span><strong style="color:${col}">${txt}</strong>
        </div>`;
      });
      html += `</div>`;
    }
  }
  resEl.innerHTML = html;
}

// ─── TIME MACHINE ─────────────────────────────────────────
function renderTimeMachine(){
  const slider=document.getElementById('tm-slider');
  const val=parseInt(slider.value);
  document.getElementById('tm-val').textContent=(val>=0?'+':'')+val+'%';
  unlockBadge('time_machine');
  // compute actual GPA
  let totalCP=0, totalCR=0;
  semesters.forEach(sem=>sem.subjects.forEach(s=>{
    const res=computeSubject(s);
    totalCP+=s.credits*(res.curG?.p||0); totalCR+=s.credits;
  }));
  const actualGPA=totalCR?totalCP/totalCR:0;
  document.getElementById('tm-actual').textContent=actualGPA.toFixed(2);
  // compute hypothetical
  let hypCP=0, hypCR=0;
  semesters.forEach(sem=>sem.subjects.forEach(s=>{
    const hypExams=(s.exams||[]).map(e=>e.taken?{...e,score:Math.min(100,e.score+val)}:e);
    const hypS={...s,exams:hypExams};
    const res=computeSubject(hypS);
    hypCP+=s.credits*(res.curG?.p||0); hypCR+=s.credits;
  }));
  const hypGPA=hypCR?hypCP/hypCR:0;
  const el=document.getElementById('tm-hyp');
  el.textContent=hypGPA.toFixed(2);
  el.style.color=hypGPA>actualGPA?'var(--green)':hypGPA<actualGPA?'var(--red)':'var(--accent)';
}

// ─── ANALYTICS ─────────────────────────────────────────────
let dnaChartInst=null, distChartInst=null;
const SUBJECT_CATS={
  'math':['math','calculus','algebra','statistics','stat','linear','discrete'],
  'science':['physics','chemistry','biology','chem','bio','lab','engineering'],
  'cs':['computer','programming','algorithm','software','data','network','database','coding'],
  'humanities':['history','philosophy','english','writing','literature','art','music','language'],
  'business':['economics','finance','accounting','management','marketing','business'],
  'other':[]
};
function guessCategory(name){
  const n=name.toLowerCase();
  for(const [cat,kws] of Object.entries(SUBJECT_CATS)){
    if(cat==='other') continue;
    if(kws.some(k=>n.includes(k))) return cat;
  }
  return 'other';
}
function renderAnalytics(){
  const allSubjects=[];
  semesters.forEach(sem=>sem.subjects.forEach(s=>allSubjects.push({...s,semName:sem.name})));
  if(!allSubjects.length){ ['sem-delta-cards','heatmap-wrap','best-subjects-list','worst-subjects-list','danger-zone-content'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:8px 0">No data yet.</div>';});return;}
  // Sem delta
  const deltaEl=document.getElementById('sem-delta-cards');
  if(deltaEl){
    let deltaHTML='';
    semesters.forEach((sem,i)=>{
      const g=sem._gpa||0;
      const prev=semesters[i-1]?._gpa||0;
      const delta=i>0?g-prev:null;
      const sign=delta===null?'':delta>=0?'+':'';
      const col=delta===null?'var(--muted)':delta>0?'var(--green)':delta<0?'var(--red)':'var(--muted)';
      deltaHTML+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:13px;font-weight:600">${sem.name||'Sem '+(i+1)}</div>
        <div style="display:flex;gap:12px;align-items:center">
          <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:18px">${g.toFixed(2)}</div>
          ${delta!==null?`<div style="font-size:12px;font-weight:700;color:${col}">${sign}${delta.toFixed(2)}</div>`:''}
        </div>
      </div>`;
    });
    deltaEl.innerHTML=deltaHTML||'<div style="color:var(--muted)">Add semesters to see trends.</div>';
  }
  // DNA radar chart
  const catScores={math:[], science:[], cs:[], humanities:[], business:[], other:[]};
  allSubjects.forEach(s=>{
    const res=computeSubject(s); const cat=guessCategory(s.name);
    catScores[cat].push(res.cur);
  });
  const labels=['Math','Science','CS','Humanities','Business','Other'];
  const catKeys=['math','science','cs','humanities','business','other'];
  const data=catKeys.map(k=>catScores[k].length?Math.round(catScores[k].reduce((a,b)=>a+b,0)/catScores[k].length):null);
  const hasData=data.some(d=>d!==null);
  const dnaCtx=document.getElementById('dnaChart');
  if(dnaCtx){
    if(dnaChartInst){dnaChartInst.destroy();dnaChartInst=null;}
    if(hasData){
      dnaChartInst=new Chart(dnaCtx,{
        type:'radar',
        data:{labels,datasets:[{label:'Avg Score',data:data.map(d=>d||0),
          backgroundColor:'rgba(129,140,248,.15)',borderColor:'rgba(129,140,248,.8)',
          pointBackgroundColor:'rgba(244,114,182,.9)',pointRadius:4,borderWidth:2}]},
        options:{responsive:true,maintainAspectRatio:false,scales:{r:{beginAtZero:true,max:100,
          ticks:{color:'rgba(255,255,255,.3)',font:{size:9}},
          pointLabels:{color:'rgba(255,255,255,.7)',font:{size:10}},
          grid:{color:'rgba(255,255,255,.07)'},angleLines:{color:'rgba(255,255,255,.07)'}}},
          plugins:{legend:{display:false}}}
      });
    }
  }
  // Heatmap
  const hmWrap=document.getElementById('heatmap-wrap');
  if(hmWrap){
    let hmHTML='';
    semesters.forEach(sem=>{
      hmHTML+=`<div class="hm-row"><div class="hm-label">${(sem.name||'').slice(0,12)}</div><div>`;
      sem.subjects.forEach(s=>{
        const res=computeSubject(s); const sc=res.cur;
        const alpha=Math.max(0.15,sc/100);
        const col=sc>=87?`rgba(52,211,153,${alpha})`:sc>=73?`rgba(251,191,36,${alpha})`:sc>=60?`rgba(129,140,248,${alpha})`:`rgba(248,113,113,${alpha})`;
        hmHTML+=`<div class="hm-cell" style="background:${col};width:${Math.max(18,s.credits*10)}px" title="${s.name}: ${sc.toFixed(1)}%"></div>`;
      });
      hmHTML+='</div></div>';
    });
    hmWrap.innerHTML=hmHTML||'<div style="color:var(--muted);font-size:13px">No data.</div>';
  }
  // Best / worst
  const scored=allSubjects.map(s=>({...s,score:computeSubject(s).cur})).filter(s=>s.score>0);
  scored.sort((a,b)=>b.score-a.score);
  const bestEl=document.getElementById('best-subjects-list');
  if(bestEl) bestEl.innerHTML=scored.slice(0,5).map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
    <div style="font-size:15px">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
    <div style="flex:1;font-size:13px;font-weight:600">${s.name}<div style="font-size:10px;color:var(--muted)">${s.semName}</div></div>
    <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:16px;color:var(--green)">${s.score.toFixed(1)}%</div>
  </div>`).join('')||'<div style="color:var(--muted);font-size:13px">No data.</div>';
  const worstEl=document.getElementById('worst-subjects-list');
  // Only show subjects that genuinely need attention: below a B- (80%) threshold,
  // sorted worst-first, max 5. If everything is going well, show a positive message.
  const needsAttention=scored.filter(s=>s.score<80).sort((a,b)=>a.score-b.score).slice(0,5);
  if(worstEl) worstEl.innerHTML=needsAttention.length
    ? needsAttention.map(s=>{
        const col=s.score<60?'var(--red)':s.score<73?'var(--yellow)':'var(--accent)';
        const ico=s.score<60?'🚨':s.score<73?'⚠️':'📌';
        return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:15px">${ico}</div>
          <div style="flex:1;font-size:13px;font-weight:600">${s.name}<div style="font-size:10px;color:var(--muted)">${s.semName}</div></div>
          <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:16px;color:${col}">${s.score.toFixed(1)}%</div>
        </div>`;
      }).join('')
    : '<div style="color:var(--green);font-size:13px;padding:8px 0">🎉 All subjects are in good shape!</div>';
  // Grade distribution
  const gradeCounts={};
  GPA.forEach(g=>gradeCounts[g.l]=0);
  allSubjects.forEach(s=>{ const l=computeSubject(s).curG.l; if(gradeCounts[l]!=null) gradeCounts[l]++; });
  const distCtx=document.getElementById('distChart');
  if(distCtx){
    if(distChartInst){distChartInst.destroy();distChartInst=null;}
    const dLabels=Object.keys(gradeCounts); const dData=Object.values(gradeCounts);
    distChartInst=new Chart(distCtx,{
      type:'bar',
      data:{labels:dLabels,datasets:[{data:dData,backgroundColor:dLabels.map(l=>gCol(l)+'aa'),borderColor:dLabels.map(l=>gCol(l)),borderWidth:1,borderRadius:4}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:'rgba(255,255,255,.5)',font:{size:10}},grid:{color:'rgba(255,255,255,.04)'}},
                y:{ticks:{color:'rgba(255,255,255,.5)',font:{size:10},stepSize:1},grid:{color:'rgba(255,255,255,.04)'}}}}
    });
  }
  // Danger zone
  const dzEl=document.getElementById('danger-zone-content');
  if(dzEl&&semesters.length){
    const activeSem=semesters[semesters.length-1];
    const goalGpa=policies.goalGpa||3.0;
    dzEl.innerHTML=activeSem.subjects.map(s=>{
      const res=computeSubject(s); const cur=res.curG.p;
      const isAt=cur>=goalGpa; const isPossible=res.maxGpa>=goalGpa;
      return `<div class="safe-zone-bar">
        <div class="sz-name">${s.name}<div style="font-size:10px;color:var(--muted)">Current: ${res.cur.toFixed(1)}%</div></div>
        <div class="sz-indicator" style="background:${isAt?'rgba(52,211,153,.12)':isPossible?'rgba(251,191,36,.12)':'rgba(248,113,113,.12)'};
          color:${isAt?'var(--green)':isPossible?'var(--yellow)':'var(--red)'};border:1px solid ${isAt?'rgba(52,211,153,.3)':isPossible?'rgba(251,191,36,.3)':'rgba(248,113,113,.3)'}">
          ${isAt?'✅ On Track':isPossible?'⚠️ At Risk':'❌ Off Track'}</div>
      </div>`;
    }).join('')||'No active semester courses.';
  }
}

// ─── DEADLINES ────────────────────────────────────────────
function toggleDeadlinePanel(){
  const panel = document.getElementById('dl-slide-panel');
  const overlay = document.getElementById('dl-slide-overlay');
  if(panel.classList.contains('open')){ closeDeadlinePanel(); return; }
  panel.classList.add('open');
  overlay.style.display = 'block';
  setTimeout(()=>{ overlay.style.opacity='1'; }, 10);
  renderDeadlines();
}
function closeDeadlinePanel(){
  const panel = document.getElementById('dl-slide-panel');
  const overlay = document.getElementById('dl-slide-overlay');
  panel.classList.remove('open');
  overlay.style.opacity = '0';
  setTimeout(()=>{ overlay.style.display='none'; }, 300);
}
function updateDeadlineBadge(){
  const dls = getDeadlines();
  const now = new Date();
  const pending = dls.filter(d => !d.done).length;
  const overdue = dls.filter(d => !d.done && d.date && new Date(d.date) < now).length;
  const badge = document.getElementById('dl-count-badge');
  if(badge){
    badge.textContent = pending;
    badge.style.background = overdue > 0 ? 'var(--red)' : 'var(--accent)';
    badge.style.display = pending === 0 ? 'none' : 'flex';
  }
}
let deadlineFilter='all';
function getDeadlines(){ return getNS(userKey('gradintel_deadlines'),[]); }
function saveDeadlines(dls){ setNS(userKey('gradintel_deadlines'),dls); }
function openAddDeadlineModal(){
  const sel=document.getElementById('dl-course');
  sel.innerHTML='<option value="">— None —</option>';
  semesters.forEach(sem=>sem.subjects.forEach(s=>{
    const o=document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o);
  }));
  document.getElementById('dl-title').value='';
  document.getElementById('dl-date').value='';
  document.getElementById('dl-weight').value='';
  document.getElementById('dl-type').value='assignment';
  document.getElementById('deadline-modal').classList.add('show');
}
function saveDeadline(){
  const title=document.getElementById('dl-title').value.trim();
  if(!title){ showToast('Add a title!'); return; }
  const dls=getDeadlines();
  dls.push({
    id:'dl_'+Date.now(), title,
    date:document.getElementById('dl-date').value,
    course:document.getElementById('dl-course').value,
    weight:parseFloat(document.getElementById('dl-weight').value)||0,
    type:document.getElementById('dl-type').value,
    done:false, created:new Date().toISOString()
  });
  saveDeadlines(dls);
  document.getElementById('deadline-modal').classList.remove('show');
  renderDeadlines(); updateDeadlineBadge(); checkBadges(); unlockBadge('deadlines_1');
  addXP(5,'Added deadline');
  showToast('📌 Deadline saved!');
}
function importDeadlinesFromCanvas(){
  const statusEl = document.getElementById('dl-canvas-status');
  if(statusEl) statusEl.style.display = 'block';
  showToast('📡 Go to Canvas → click your Gradintel bookmarklet to sync deadlines!');
  if(typeof ciStartListener === 'function') ciStartListener();
}

function filterDeadlines(f){
  deadlineFilter=f;
  ['all','upcoming','overdue'].forEach(x=>{
    const el=document.getElementById('dl-filter-'+x);
    if(el){ el.style.borderColor=x===f?'var(--accent)':''; el.style.color=x===f?'var(--accent)':''; }
  });
  renderDeadlines();
}
function renderDeadlines(){
  let dls=getDeadlines();
  const now=new Date();
  const typeIco={assignment:'📝',exam:'📋',quiz:'⚡',project:'🚀',other:'📌'};
  if(deadlineFilter==='upcoming') dls=dls.filter(d=>!d.done&&new Date(d.date)>now);
  if(deadlineFilter==='overdue') dls=dls.filter(d=>!d.done&&d.date&&new Date(d.date)<now);
  dls.sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
  const el=document.getElementById('deadline-list');
  if(!el) return;
  updateDeadlineBadge();
  if(!dls.length){
    el.innerHTML='<div style="text-align:center;padding:32px 16px"><div style="font-size:28px;margin-bottom:10px">🎉</div><div style="font-size:13px;color:var(--muted)">No deadlines here!<br>Hit <strong>+ Add Deadline</strong> to get started.</div></div>';
    return;
  }
  el.innerHTML=dls.map(d=>{
    const due=d.date?new Date(d.date):null;
    const isOverdue=due&&due<now&&!d.done;
    const isSoon=due&&!isOverdue&&(due-now)<86400000*3;
    const cls=isOverdue?'overdue':isSoon?'due-soon':d.done?'done':'';
    const dotColor=d.done?'var(--muted)':isOverdue?'var(--red)':isSoon?'var(--yellow)':'var(--accent)';
    const urgency=d.done?'✓ Done':isOverdue?'Overdue':due?Math.ceil((due-now)/86400000)+'d left':'';
    const urgencyColor=d.done?'var(--green)':isOverdue?'var(--red)':isSoon?'var(--yellow)':'var(--muted)';
    const courseName=d.course?semesters.flatMap(s=>s.subjects).find(s=>s.id===d.course)?.name||'':'';
    return `<div class="dl-notif ${cls}">
      <div class="dl-notif-dot" style="background:${dotColor}"></div>
      <div class="dl-notif-body">
        <div class="dl-notif-title" style="${d.done?'text-decoration:line-through;color:var(--muted)':''}">${typeIco[d.type]||'📌'} ${d.title}${d.weight?` <span style="font-size:10px;color:var(--accent);background:rgba(129,140,248,.12);padding:1px 5px;border-radius:4px;font-weight:700">${d.weight}%</span>`:''}</div>
        <div class="dl-notif-meta">${courseName?courseName+' · ':''}${due?due.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'No date set'} <span style="color:${urgencyColor};font-weight:700;margin-left:4px">${urgency}</span></div>
      </div>
      <div class="dl-notif-actions">
        <button class="ca-btn" onclick="toggleDeadlineDone('${d.id}')" title="Toggle done" style="${d.done?'color:var(--muted)':'color:var(--green)'}">✓</button>
        <button class="ca-btn" onclick="deleteDeadline('${d.id}')" title="Delete" style="color:var(--red)">🗑</button>
      </div>
    </div>`;
  }).join('');
}
function toggleDeadlineDone(id){
  const dls=getDeadlines();
  const dl=dls.find(d=>d.id===id); if(!dl) return;
  dl.done=!dl.done;
  saveDeadlines(dls);
  if(dl.done){ addXP(10,'Completed deadline'); checkBadges(); }
  renderDeadlines(); updateDeadlineBadge();
  showToast(dl.done?'✅ Deadline done!':'↩️ Marked undone');
}
function deleteDeadline(id){
  const dls=getDeadlines().filter(d=>d.id!==id);
  saveDeadlines(dls); renderDeadlines(); updateDeadlineBadge(); showToast('🗑 Deadline removed');
}

// ─── POMODORO ─────────────────────────────────────────────
let pomoState={mode:'focus',running:false,remaining:25*60,sessions:0,interval:null};
const POMO_DURATIONS={focus:25*60,short:5*60,long:15*60};
function setPomoMode(m){
  clearInterval(pomoState.interval); pomoState.running=false;
  pomoState.mode=m; pomoState.remaining=POMO_DURATIONS[m];
  ['focus','short','long'].forEach(x=>{
    const el=document.getElementById('pomo-'+x);
    if(el){ el.style.borderColor=x===m?'var(--accent)':''; el.style.color=x===m?'var(--accent)':''; }
  });
  const labels={focus:'🍅 Focus Session',short:'☕ Short Break',long:'🌿 Long Break'};
  const el=document.getElementById('pomo-mode-label'); if(el) el.textContent=labels[m];
  const btn=document.getElementById('pomo-btn'); if(btn) btn.textContent='▶ Start';
  updatePomoDisplay();
}
function updatePomoDisplay(){
  const mins=Math.floor(pomoState.remaining/60);
  const secs=pomoState.remaining%60;
  const el=document.getElementById('pomo-display');
  if(el) el.textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
function togglePomo(){
  if(pomoState.running){
    clearInterval(pomoState.interval); pomoState.running=false;
    document.getElementById('pomo-btn').textContent='▶ Start';
  } else {
    pomoState.running=true;
    document.getElementById('pomo-btn').textContent='⏸ Pause';
    pomoState.interval=setInterval(()=>{
      pomoState.remaining--;
      updatePomoDisplay();
      if(pomoState.remaining<=0){
        clearInterval(pomoState.interval); pomoState.running=false;
        if(pomoState.mode==='focus'){
          pomoState.sessions++;
          const total=getNS(userKey('gradintel_pomo_total'),0)+1;
          setNS(userKey('gradintel_pomo_total'),total);
          addXP(15,'Pomodoro session');
          // log session
          const course=document.getElementById('pomo-course-select')?.value||'';
          const courseName=course?semesters.flatMap(s=>s.subjects).find(s=>s.id===course)?.name||'General':'General';
          const logs=getNS(userKey('gradintel_pomo_log'),[]);
          logs.unshift({time:new Date().toISOString(),course:courseName});
          setNS(userKey('gradintel_pomo_log'),logs.slice(0,20));
          renderPomoLog(); checkBadges();
        }
        document.getElementById('pomo-btn').textContent='▶ Start';
        document.getElementById('pomo-session-count').textContent=pomoState.sessions;
        setPomoMode(pomoState.mode==='focus'?'short':'focus');
        showToast(pomoState.mode==='short'?'🍅 Focus time!':'☕ Break time!');
        if(!document.body.classList.contains('reduced-motion')) fireConfetti();
      }
    },1000);
  }
}
function resetPomo(){ clearInterval(pomoState.interval); pomoState.running=false; pomoState.remaining=POMO_DURATIONS[pomoState.mode]; updatePomoDisplay(); document.getElementById('pomo-btn').textContent='▶ Start'; }
function skipPomo(){ clearInterval(pomoState.interval); pomoState.running=false; setPomoMode(pomoState.mode==='focus'?'short':'focus'); }
function renderPomoCoursePicker(){
  const sel=document.getElementById('pomo-course-select'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">— None —</option>';
  semesters.forEach(sem=>sem.subjects.forEach(s=>{
    const o=document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o);
  }));
  if(cur) sel.value=cur;
  renderPomoLog();
}
function renderPomoLog(){
  const el=document.getElementById('pomo-log-list'); if(!el) return;
  const logs=getNS(userKey('gradintel_pomo_log'),[]);
  if(!logs.length){ el.innerHTML='<div style="font-size:11px;color:var(--muted)">No sessions yet today.</div>'; return; }
  el.innerHTML=logs.slice(0,5).map(l=>`<div class="pomo-log-item"><span>${new Date(l.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><span>${l.course}</span></div>`).join('');
}

// ─── COURSE NOTES ─────────────────────────────────────────
function renderNotesCourseList(){
  const sel=document.getElementById('notes-course-select'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Select course…</option>';
  semesters.forEach(sem=>sem.subjects.forEach(s=>{
    const o=document.createElement('option'); o.value=s.id; o.textContent=s.name+' ('+sem.name+')'; sel.appendChild(o);
  }));
  if(cur) sel.value=cur;
}
function loadCourseNotes(){
  const id=document.getElementById('notes-course-select')?.value;
  const area=document.getElementById('notes-area'); if(!area) return;
  area.value=id?getNS(userKey('gradintel_notes_'+id),''):'';
  document.getElementById('notes-save-status').textContent='Auto-saved';
}
let notesTimer=null;
function saveCourseNotes(){
  const id=document.getElementById('notes-course-select')?.value; if(!id) return;
  const val=document.getElementById('notes-area')?.value||'';
  clearTimeout(notesTimer);
  notesTimer=setTimeout(()=>{ setNS(userKey('gradintel_notes_'+id),val); document.getElementById('notes-save-status').textContent='Saved ✓ '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); },600);
}

// ─── STREAK GRID ─────────────────────────────────────────
function renderStreakGrid(){
  const el=document.getElementById('streak-grid'); if(!el) return;
  const data=getNS(userKey('gradintel_activity'),{});
  const days=140; // ~20 weeks
  const cells=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const s=d.toISOString().slice(0,10);
    const v=data[s]||0;
    const alpha=v===0?0:v===1?0.3:v<=3?0.6:1;
    const col=v===0?'var(--surface3)':`rgba(129,140,248,${alpha})`;
    cells.push(`<div class="streak-cell" style="background:${col}" title="${s}: ${v} activities"></div>`);
  }
  // Group into rows of 7
  let html='<div style="display:flex;flex-wrap:wrap;gap:2px;max-width:100%;overflow-x:auto">';
  html+=cells.join('')+'</div>';
  el.innerHTML=html;
  const streak=getStreak();
  const sc=document.getElementById('streak-count'); if(sc) sc.textContent=streak;
  checkBadges();
}

// ─── MOOD LOG ─────────────────────────────────────────────
let moodChartInst=null;
function logMood(val){
  const moods=getNS(userKey('gradintel_mood'),[]);
  moods.push({date:todayStr(),mood:val,time:new Date().toISOString()});
  setNS(userKey('gradintel_mood'),moods);
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.mood)===val));
  addXP(5,'Mood logged'); checkBadges();
  renderMoodChart(); showToast('😊 Mood logged!');
}
function renderMoodChart(){
  const moods=getNS(userKey('gradintel_mood'),[]);
  // Show today's logged mood
  const today=todayStr();
  const todayMood=moods.filter(m=>m.date===today).pop();
  if(todayMood) document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.mood)===todayMood.mood));
  // Chart last 14 days
  const days=14; const labels=[]; const data=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const s=d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('en',{month:'short',day:'numeric'}));
    const dayMoods=moods.filter(m=>m.date===s);
    data.push(dayMoods.length?Math.round(dayMoods.reduce((a,b)=>a+b.mood,0)/dayMoods.length):null);
  }
  const ctx=document.getElementById('moodChart'); if(!ctx) return;
  if(moodChartInst){moodChartInst.destroy();moodChartInst=null;}
  moodChartInst=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Mood',data,borderColor:'rgba(244,114,182,.8)',backgroundColor:'rgba(244,114,182,.1)',
      pointBackgroundColor:'rgba(244,114,182,.9)',tension:.4,fill:true,spanGaps:true,pointRadius:4,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{y:{min:1,max:5,ticks:{color:'rgba(255,255,255,.4)',font:{size:9},callback:v=>['😞','😰','😐','🙂','😄'][v-1]||v},
        grid:{color:'rgba(255,255,255,.04)'}},
        x:{ticks:{color:'rgba(255,255,255,.4)',font:{size:9}},grid:{display:false}}}}
  });
}

// ─── DEGREE PROGRESS ──────────────────────────────────────
let currentPnRating=3;
// ══════════════════════════════════════════════════════════════
// MULTI-DEGREE SYSTEM
// ══════════════════════════════════════════════════════════════
let activeDegreeId = null;

function getDegrees() {
  let degrees = getNS(userKey('gradintel_degrees'), null);
  // Migrate legacy single-degree data on first load
  if (!degrees) {
    const legacy = getNS(userKey('gradintel_degree'), {});
    const legacyReqs = getNS(userKey('gradintel_requirements'), []);
    const id = 'deg_' + Date.now();
    degrees = [{
      id, name: legacy.name || 'My Degree',
      totalCredits: legacy.totalCredits || 120,
      targetGpa: legacy.targetGpa || 3.5,
      requirements: legacyReqs
    }];
    setNS(userKey('gradintel_degrees'), degrees);
  }
  return degrees;
}
function saveDegrees(degrees) { setNS(userKey('gradintel_degrees'), degrees); }
function getActiveDegree() {
  const degrees = getDegrees();
  return degrees.find(d => d.id === activeDegreeId) || degrees[0] || null;
}

function addNewDegree() {
  const degrees = getDegrees();
  const id = 'deg_' + Date.now();
  degrees.push({ id, name: 'New Degree', totalCredits: 120, targetGpa: 3.5, requirements: [] });
  saveDegrees(degrees);
  activeDegreeId = id;
  renderDegree();
  // Focus the name input of the new degree
  setTimeout(() => { const el = document.getElementById('deg-name'); if (el) { el.focus(); el.select(); } }, 100);
}

function switchDegree(id) {
  activeDegreeId = id;
  renderDegree();
}

function deleteDegree(id) {
  const degrees = getDegrees();
  if (degrees.length <= 1) { showToast('⚠️ You need at least one degree.'); return; }
  if (!confirm('Delete this degree and all its requirements?')) return;
  const filtered = degrees.filter(d => d.id !== id);
  saveDegrees(filtered);
  if (activeDegreeId === id) activeDegreeId = filtered[0].id;
  renderDegree();
}

function saveDegreeSetup() {
  const degrees = getDegrees();
  const deg = degrees.find(d => d.id === activeDegreeId) || degrees[0];
  if (!deg) return;
  deg.name = document.getElementById('deg-name')?.value || deg.name;
  deg.totalCredits = parseFloat(document.getElementById('deg-total-credits')?.value) || 120;
  deg.targetGpa = parseFloat(document.getElementById('deg-target-gpa')?.value) || 3.5;
  saveDegrees(degrees);
  renderDegreeTabs();
  renderDegProgress(deg);
  checkBadges();
}

function renderDegreeTabs() {
  const degrees = getDegrees();
  const tabsEl = document.getElementById('degree-tabs');
  if (!tabsEl) return;
  if (!activeDegreeId || !degrees.find(d => d.id === activeDegreeId)) {
    activeDegreeId = degrees[0]?.id;
  }
  tabsEl.innerHTML = degrees.map(d => `
    <div style="display:flex;align-items:center;gap:0;border-radius:10px;overflow:hidden;
      border:1px solid ${d.id === activeDegreeId ? 'var(--accent)' : 'var(--border2)'};
      background:${d.id === activeDegreeId ? 'rgba(129,140,248,.12)' : 'var(--surface2)'}">
      <button onclick="switchDegree('${d.id}')"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;
               font-family:'Clash Display',sans-serif;font-weight:700;font-size:13px;
               color:${d.id === activeDegreeId ? 'var(--accent)' : 'var(--muted2)'}">
        🎓 ${d.name || 'Unnamed Degree'}
      </button>
      ${degrees.length > 1 ? `<button onclick="deleteDegree('${d.id}')"
        style="padding:8px 10px;border:none;border-left:1px solid var(--border2);background:transparent;
               cursor:pointer;color:var(--red);font-size:12px;line-height:1">✕</button>` : ''}
    </div>`).join('');
}

function renderDegProgress(deg) {
  const el = document.getElementById('deg-progress-wrap'); if (!el) return;
  let totalCP = 0, totalCR = 0;
  semesters.forEach(sem => sem.subjects.forEach(s => {
    const res = computeSubject(s); totalCP += s.credits * (res.curG?.p || 0); totalCR += s.credits;
  }));
  const credPct = deg.totalCredits ? Math.min(100, Math.round(totalCR / deg.totalCredits * 100)) : 0;
  const curGpa = totalCR ? totalCP / totalCR : 0;
  const gpaPct = deg.targetGpa ? Math.min(100, Math.round(curGpa / deg.targetGpa * 100)) : 0;
  el.innerHTML = `
    <div class="deg-prog-wrap">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>Credits: ${totalCR} / ${deg.totalCredits}</span><span>${credPct}%</span></div>
      <div class="deg-prog-bar"><div class="deg-prog-fill" style="width:${credPct}%"></div></div>
    </div>
    <div class="deg-prog-wrap">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>GPA Progress: ${curGpa.toFixed(2)} / ${deg.targetGpa}</span><span>${gpaPct}%</span></div>
      <div class="deg-prog-bar"><div class="deg-prog-fill" style="width:${gpaPct}%;background:linear-gradient(90deg,var(--accent2),var(--accent))"></div></div>
    </div>
    <div style="margin-top:10px;font-size:12px;color:var(--muted2)">
      Estimated semesters remaining: <strong>${Math.max(0, Math.ceil((deg.totalCredits - totalCR) / 18))}</strong>
      &nbsp;·&nbsp; Credits remaining: <strong>${Math.max(0, deg.totalCredits - totalCR)}</strong>
    </div>`;
}

function renderDegree() {
  const degrees = getDegrees();
  if (!activeDegreeId || !degrees.find(d => d.id === activeDegreeId)) {
    activeDegreeId = degrees[0]?.id;
  }
  renderDegreeTabs();
  const deg = getActiveDegree();
  if (!deg) { document.getElementById('degree-content').innerHTML = '<div style="color:var(--muted);padding:20px">No degree found.</div>'; return; }

  document.getElementById('degree-content').innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div class="card-title" style="margin-bottom:0">⚙️ Degree Setup</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="field"><label>Degree Name</label>
          <input type="text" id="deg-name" placeholder="e.g. B.Sc. Computer Science" value="${deg.name || ''}" oninput="saveDegreeSetup()"/></div>
        <div class="field"><label>Total Credits Required</label>
          <input type="number" id="deg-total-credits" placeholder="e.g. 120" min="1" value="${deg.totalCredits || 120}" oninput="saveDegreeSetup()"/></div>
        <div class="field"><label>Target Graduation GPA</label>
          <input type="number" id="deg-target-gpa" placeholder="e.g. 3.5" min="0" max="5" step="0.01" value="${deg.targetGpa || 3.5}" oninput="saveDegreeSetup()"/></div>
      </div>
      <div id="deg-progress-wrap"></div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-title">📋 Course Requirements — ${deg.name || 'This Degree'}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Track which required courses you've completed or still need</div>
      <button class="btn btn-primary" onclick="openAddRequirementModal()" style="margin-bottom:14px">+ Add Requirement</button>
      <div id="requirements-list"></div>
    </div>`;

  renderDegProgress(deg);
  renderRequirements();
  renderProfNotes();
}

// ── REQUIREMENTS (now scoped to active degree) ────────────────
function getRequirements() {
  const deg = getActiveDegree();
  return deg ? (deg.requirements || []) : [];
}
function saveRequirementsForDegree(reqs) {
  const degrees = getDegrees();
  const deg = degrees.find(d => d.id === activeDegreeId) || degrees[0];
  if (!deg) return;
  deg.requirements = reqs;
  saveDegrees(degrees);
}

function openAddRequirementModal() {
  openAddReq();
}
function saveRequirement() {
  const name = document.getElementById('req-name')?.value.trim();
  if (!name) { showToast('Add a course name!'); return; }
  const editId = document.getElementById('req-edit-id')?.value || '';
  const reqs = getRequirements();
  const entry = {
    id: editId || ('req_' + Date.now()),
    name,
    credits: parseFloat(document.getElementById('req-credits')?.value) || 3,
    category: document.getElementById('req-category')?.value.trim() || 'General',
    status: document.getElementById('req-status')?.value || 'pending'
  };
  if (editId) {
    const idx = reqs.findIndex(r => r.id === editId);
    if (idx >= 0) reqs[idx] = entry; else reqs.push(entry);
    showToast('✏️ Requirement updated!');
  } else {
    reqs.push(entry);
    showToast('📋 Requirement added!');
  }
  saveRequirementsForDegree(reqs);
  document.getElementById('req-modal').classList.remove('show');
  renderRequirements(); checkBadges();
}
function openAddReq() {
  document.getElementById('req-modal-title').textContent = 'Add Course Requirement';
  document.getElementById('req-edit-id').value = '';
  document.getElementById('req-name').value = '';
  document.getElementById('req-credits').value = '';
  document.getElementById('req-category').value = '';
  document.getElementById('req-status').value = 'pending';
  document.getElementById('req-modal').classList.add('show');
}
function openEditReq(id) {
  const r = getRequirements().find(x => x.id === id); if (!r) return;
  document.getElementById('req-modal-title').textContent = 'Edit Course Requirement';
  document.getElementById('req-edit-id').value = r.id;
  document.getElementById('req-name').value = r.name;
  document.getElementById('req-credits').value = r.credits;
  document.getElementById('req-category').value = r.category || '';
  document.getElementById('req-status').value = r.status || 'pending';
  document.getElementById('req-modal').classList.add('show');
}
function renderRequirements() {
  const reqs = getRequirements();
  const el = document.getElementById('requirements-list'); if (!el) return;
  if (!reqs.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">No requirements added yet.</div>'; return; }
  const statusConfig = {
    pending: { label: 'Pending', bg: 'rgba(107,114,128,.12)', col: 'var(--muted)' },
    in_progress: { label: 'In Progress', bg: 'rgba(129,140,248,.12)', col: 'var(--accent)' },
    completed: { label: 'Completed', bg: 'rgba(52,211,153,.12)', col: 'var(--green)' },
    waived: { label: 'Waived', bg: 'rgba(251,191,36,.12)', col: 'var(--yellow)' }
  };
  el.innerHTML = reqs.map(r => {
    const sc = statusConfig[r.status] || statusConfig.pending;
    return `<div class="req-item">
      <div style="flex:1"><div style="font-weight:700;font-size:13px">${r.name}</div>
        <div style="font-size:11px;color:var(--muted)">${r.category} · ${r.credits} credits</div></div>
      <div class="req-status-badge" style="background:${sc.bg};color:${sc.col}">${sc.label}</div>
      <select onchange="updateReqStatus('${r.id}',this.value)" style="font-size:11px;background:var(--surface3);border:1px solid var(--border2);border-radius:6px;padding:3px 6px;color:var(--text)">
        ${['pending', 'in_progress', 'completed', 'waived'].map(s => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`).join('')}
      </select>
      <button onclick="openEditReq('${r.id}')" title="Edit" style="background:transparent;border:none;color:var(--accent);cursor:pointer;font-size:13px;padding:2px 4px">✏️</button>
      <button onclick="deleteRequirement('${r.id}')" title="Delete" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:2px 4px">🗑</button>
    </div>`;
  }).join('');
}
function updateReqStatus(id, status) {
  const reqs = getRequirements(); const r = reqs.find(x => x.id === id); if (!r) return;
  r.status = status; saveRequirementsForDegree(reqs);
  if (status === 'completed') addXP(10, 'Course requirement completed');
  renderRequirements(); checkBadges();
}
function deleteRequirement(id) {
  saveRequirementsForDegree(getRequirements().filter(r => r.id !== id));
  renderRequirements();
}

function importDegreePdfCourses(courses, degreeName, totalCredits) {
  const reqs = getRequirements();
  let added = 0;
  courses.forEach(function(c) {
    if (!reqs.some(r => r.name.toLowerCase() === (c.name || '').toLowerCase())) {
      reqs.push({ id: 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2), name: c.name || 'Unnamed', credits: parseFloat(c.credits) || 3, category: c.category || 'General', status: 'pending' });
      added++;
    }
  });
  saveRequirementsForDegree(reqs);
  // Update active degree name/credits if not already set
  const degrees = getDegrees();
  const deg = degrees.find(d => d.id === activeDegreeId) || degrees[0];
  if (deg) {
    if (degreeName && (!deg.name || deg.name === 'New Degree' || deg.name === 'My Degree')) deg.name = degreeName;
    if (totalCredits && deg.totalCredits === 120) deg.totalCredits = totalCredits;
    saveDegrees(degrees);
  }
  renderDegree();
  document.getElementById('pdf-ai-preview').style.display = 'none';
  document.getElementById('pdf-ai-status').style.display = 'none';
  showToast('🎓 Imported ' + added + ' course requirements into "' + (deg?.name || 'degree') + '"!');
  checkBadges();
}

// Legacy compatibility shims
function getDegree() { return getActiveDegree() || { name: '', totalCredits: 120, targetGpa: 3.5 }; }

// ── PDF DEGREE AUTO-FILL ──────────────────────────────────────
function handleDegreePdfDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') handleDegreePdfFile(file);
  else showToast('Please drop a PDF file!');
}

async function handleDegreePdfFile(file) {
  if (!file) return;
  const statusEl = document.getElementById('pdf-ai-status');
  const msgEl    = document.getElementById('pdf-ai-msg');
  const previewEl= document.getElementById('pdf-ai-preview');
  const spinEl   = document.getElementById('pdf-ai-spinner');
  // Check if AI is connected (Pollinations BYOP or own key)
  const _pollKey = localStorage.getItem('gradintel_poll_user_key') || '';
  const _ownProv = localStorage.getItem('gradintel_ai_prov') || '';
  const _ownKey  = _ownProv ? (localStorage.getItem('gradintel_ai_key_' + _ownProv) || '') : '';
  const _connectPrompt = document.getElementById('pdf-ai-connect-prompt');

  if (!_pollKey && !_ownKey) {
    if (_connectPrompt) _connectPrompt.style.display = 'block';
    return;
  }
  if (_connectPrompt) _connectPrompt.style.display = 'none';

  statusEl.style.display = 'block';
  previewEl.style.display = 'none';
  if (spinEl) spinEl.style.display = '';
  msgEl.textContent = 'Reading PDF…';

  const prov = _ownProv;
  const key  = _ownKey;

  const prompt = `You are reading a university degree requirements PDF. Extract ALL course requirements listed. For each course/requirement output a JSON array. Each item should have: "name" (course name), "credits" (number, default 3 if not specified), "category" (e.g. Core, Elective, Lab, Gen Ed, Major, Minor — infer from context), "status" (always "pending"). Also extract the degree name if visible as "degreeName" and total credits required as "totalCredits" (number). Return ONLY valid JSON, no markdown, no explanation. Format: { "degreeName": "...", "totalCredits": 120, "courses": [{...}, ...] }`;

  try {
    let jsonText = '';

    // Step 1: Try to extract text from PDF with PDF.js
    msgEl.textContent = '📄 Extracting text from PDF…';
    let pdfText = '';
    try {
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      const arrayBuf = await file.arrayBuffer();
      const doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
      for (let i = 1; i <= Math.min(doc.numPages, 15); i++) {
        const page = await doc.getPage(i);
        const tc = await page.getTextContent();
        pdfText += tc.items.map(t => t.str).join(' ') + '\n';
      }
    } catch(pe) { pdfText = ''; }

    if (pdfText && pdfText.trim().length > 80) {
      // Has text — send to free AI
      msgEl.textContent = '🤖 Asking AI to extract requirements…';
      const textPrompt = 'Here is text from a degree requirements PDF:\n\n' + pdfText.slice(0, 10000) + '\n\n' + prompt;

      if (prov === 'gemini' && key) {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: textPrompt }] }], generationConfig: { maxOutputTokens: 2000 } })
        });
        const d = await res.json();
        jsonText = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (prov === 'claude' && key) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: textPrompt }] })
        });
        const d = await res.json(); jsonText = d?.content?.[0]?.text || '';
      } else if ((prov === 'groq' || prov === 'openai') && key) {
        const urls = { groq: 'https://api.groq.com/openai/v1/chat/completions', openai: 'https://api.openai.com/v1/chat/completions' };
        const models = { groq: 'llama3-8b-8192', openai: 'gpt-4o-mini' };
        const res = await fetch(urls[prov], {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({ model: models[prov], max_tokens: 2000, messages: [{ role: 'user', content: textPrompt }] })
        });
        const d = await res.json(); jsonText = d?.choices?.[0]?.message?.content || '';
      } else {
        // No key — use free AI
        jsonText = await callFreeAI('You are a university degree requirements extractor. Return ONLY valid JSON, no markdown.', textPrompt);
      }

    } else {
      // Scanned/image PDF — render pages and use free vision AI
      msgEl.textContent = '🖼️ Scanned PDF detected — using AI vision…';
      try {
        const images = await scannedPdfToImages(file, 5);
        if (!images.length) throw new Error('No pages rendered');
        if (prov === 'gemini' && key) {
          // Gemini can read PDFs natively
          const reader2 = new FileReader();
          const base64 = await new Promise(res => { reader2.onload = e => res(e.target.result.split(',')[1]); reader2.readAsDataURL(file); });
          const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'application/pdf', data: base64 } }, { text: prompt }] }], generationConfig: { maxOutputTokens: 2000 } })
          });
          const d = await r.json(); jsonText = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          jsonText = await callFreeVisionAI('You are a degree requirements extractor. Return ONLY valid JSON.', prompt, images);
        }
      } catch(visErr) {
        throw new Error('Could not read scanned PDF: ' + visErr.message);
      }
    }

    if (!jsonText) throw new Error('No response from AI. Please try again.');

    // Parse JSON
    const clean = jsonText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const courses = parsed.courses || parsed;

    if (spinEl) spinEl.style.display = 'none';
    msgEl.textContent = '✅ Found ' + courses.length + ' course requirements!';
    previewEl.style.display = 'block';
    // Build preview safely
    const degTitle = parsed.degreeName ? '🎓 ' + parsed.degreeName : '🎓 Degree Requirements';
    const credLine = parsed.totalCredits ? '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Total Credits: ' + parsed.totalCredits + '</div>' : '';
    const courseRows = courses.slice(0, 50).map(function(c) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">' +
        '<div><span style="font-size:12px;font-weight:600">' + (c.name || 'Untitled') + '</span>' +
        '<span style="font-size:10px;color:var(--muted);margin-left:6px">' + (c.category || 'General') + '</span></div>' +
        '<span style="font-size:11px;color:var(--accent)">' + (c.credits || 3) + ' cr</span></div>';
    }).join('');
    const moreRow = courses.length > 50 ? '<div style="font-size:11px;color:var(--muted);padding-top:6px">...and ' + (courses.length - 50) + ' more</div>' : '';
    previewEl.innerHTML = '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:16px">' +
      '<div style="font-family:Clash Display,sans-serif;font-weight:700;font-size:14px;margin-bottom:4px">' + degTitle + '</div>' +
      credLine +
      '<div style="max-height:220px;overflow-y:auto;margin-bottom:14px">' + courseRows + moreRow + '</div>' +
      '<div style="display:flex;gap:10px">' +
        '<button class="btn btn-primary" id="deg-pdf-import-btn">✅ Import All ' + courses.length + ' Requirements</button>' +
        '<button class="btn btn-secondary" onclick="document.getElementById(&quot;pdf-ai-preview&quot;).style.display=&quot;none&quot;">Discard</button>' +
      '</div></div>';
    // Wire up import button
    const _importCourses = courses;
    const _importName = parsed.degreeName || '';
    const _importCredits = parsed.totalCredits || 0;
    document.getElementById('deg-pdf-import-btn').onclick = function() {
      importDegreePdfCourses(_importCourses, _importName, _importCredits);
    }
  } catch(err) {
    if (spinEl) spinEl.style.display = 'none';
    if (err.message === '__NEEDS_CONNECT__') {
      statusEl.style.display = 'none';
      if (_connectPrompt) _connectPrompt.style.display = 'block';
    } else {
      msgEl.textContent = '❌ Error: ' + (err.message || 'Could not parse response. Try a text-based PDF.');
    }
  }
}


// Prof Notes
function getProfNotes(){ return getNS(userKey('gradintel_prof_notes'),[]); }
function openAddProfNoteModal(){
  document.getElementById('pn-course').value='';
  document.getElementById('pn-notes').value='';
  document.getElementById('pn-sem').value='';
  currentPnRating=3; setPnRating(3);
  document.getElementById('profnote-modal').classList.add('show');
}
function setPnRating(val){
  currentPnRating=val;
  document.querySelectorAll('.pn-star').forEach(s=>{ s.style.opacity=parseInt(s.dataset.v)<=val?'1':'0.3'; });
}
function saveProfNote(){
  const course=document.getElementById('pn-course')?.value.trim();
  if(!course){ showToast('Add a course/professor name!'); return; }
  const notes=getProfNotes();
  notes.unshift({ id:'pn_'+Date.now(), course,
    rating:currentPnRating,
    notes:document.getElementById('pn-notes')?.value.trim()||'',
    sem:document.getElementById('pn-sem')?.value.trim()||'' });
  setNS(userKey('gradintel_prof_notes'),notes);
  document.getElementById('profnote-modal').classList.remove('show');
  renderProfNotes(); showToast('📝 Note saved!');
}
function renderProfNotes(){
  const notes=getProfNotes();
  const el=document.getElementById('prof-notes-list'); if(!el) return;
  if(!notes.length){ el.innerHTML='<div style="color:var(--muted);font-size:13px">No notes yet.</div>'; return; }
  el.innerHTML=notes.map(n=>`<div class="profnote-item">
    <div class="profnote-header">
      <div class="profnote-course">${n.course}</div>
      <div class="profnote-stars">${'⭐'.repeat(n.rating)}${'☆'.repeat(5-n.rating)}</div>
    </div>
    ${n.notes?`<div class="profnote-notes">${n.notes}</div>`:''}
    <div class="profnote-meta">${n.sem?'📅 '+n.sem:''} &nbsp;
      <button onclick="deleteProfNote('${n.id}')" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-size:11px">🗑 Delete</button>
    </div>
  </div>`).join('');
}
function deleteProfNote(id){ const notes=getProfNotes().filter(n=>n.id!==id); setNS(userKey('gradintel_prof_notes'),notes); renderProfNotes(); }

// ─── INIT NEW FEATURES ON AUTH SUCCESS ─────────────────────
// Hook into existing onAuthSuccess by patching the activity log
const _origOnAuthSuccess = typeof onAuthSuccess === 'function' ? onAuthSuccess : null;
// Patch logActivity into the boot
document.addEventListener('DOMContentLoaded', ()=>{
  logActivity();
});
// Patch addXP into grade saving — hook checkBadges into existing save flow
const origSaveEditModal = typeof saveEditModal === 'function' ? saveEditModal : null;

// ══════════════════════════════════════════════════════════════
// CANVAS IMPORT — CSV + BOOKMARKLET
// ══════════════════════════════════════════════════════════════

let ciCsvRows = [];    // parsed CSV preview rows
let ciBmRows  = [];    // bookmarklet-received rows

// ── BOOKMARKLET CODE ─────────────────────────────────────────
// This is the actual JS that gets encoded into the bookmarklet href.
// It runs on the Canvas page, extracts grades from the DOM / API,
// and posts them back to the Gradintel origin via postMessage.
function ciGetBookmarkletCode() {
  // Bake the Supabase URL + anon key directly into the bookmarklet at generation time.
  // The anon key is safe to expose — it's a public key with RLS protecting data.
  const sbUrl  = SUPABASE_URL;
  const sbAnon = SUPABASE_ANON;
  const userId = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'anonymous';

  const fn = `(function(){
  var SBURL  = ${JSON.stringify(sbUrl)};
  var SBANON = ${JSON.stringify(sbAnon)};
  var UID    = ${JSON.stringify(userId)};

  function send(data) {
    // PRIMARY: POST directly to Supabase REST API — works from ANY domain, no CORS issues
    fetch(SBURL + '/rest/v1/canvas_sync', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SBANON,
        'Authorization': 'Bearer ' + SBANON,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({ user_id: UID, payload: data, created_at: new Date().toISOString() })
    }).catch(function(){});

    // FALLBACK: BroadcastChannel (works if same browser, same origin)
    try {
      var bc = new BroadcastChannel('gradintel_canvas');
      bc.postMessage({type:'GRADINTEL_CANVAS',data:data});
      bc.close();
    } catch(e){}

    // FALLBACK: postMessage to opener
    try { window.opener && window.opener.postMessage({type:'GRADINTEL_CANVAS',data:data},'*'); } catch(e){}
  }
  function toast(msg) {
    var d=document.createElement('div');
    d.style.cssText='position:fixed;bottom:24px;right:24px;background:#818cf8;color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:700;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.4)';
    d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),3500);
  }
  toast('📊 Gradintel: reading grades…');

  // --- Attempt 1: Canvas Grades API (works on grades pages) ---
  var m = location.href.match(/courses\\/([0-9]+)/);
  var courseId = m ? m[1] : null;
  var canvasBase = location.origin;

  function extractFromDOM() {
    // Parse the grades table in the DOM
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

  // Try to get course name from page
  var courseNameEl = document.querySelector('h1.course-title,.context_module_sub_header,.course-name,title');
  var courseName = courseNameEl ? courseNameEl.textContent.trim().replace(' Grades','') : (document.title||'Canvas Course');

  if (courseId) {
    fetch(canvasBase+'/api/v1/courses/'+courseId+'/assignment_groups?include[]=assignments&include[]=submission&per_page=100', {credentials:'include'})
      .then(r=>r.json()).then(function(groups){
        var rows = [];
        groups.forEach(function(g){
          var gw = g.group_weight||0;
          var scored=0,possible=0,hasScore=false;
          (g.assignments||[]).forEach(function(a){
            var sub=a.submission||{};
            if(sub.score!=null&&a.points_possible>0){
              scored+=sub.score; possible+=a.points_possible; hasScore=true;
            }
          });
          var pct=hasScore&&possible>0?(scored/possible*100):null;
          rows.push({
            name: g.name,
            group: g.name,
            weight: gw,
            score: hasScore?scored:null,
            possible: hasScore?possible:null,
            pct: pct!=null?parseFloat(pct.toFixed(2)):null,
            isGroupSummary: true
          });
        });
        send({source:'api', courseName:courseName, courseId:courseId, rows:rows});
        toast('✅ Gradintel: '+rows.length+' groups found! Switch back to Gradintel.');
      }).catch(function(){
        var domRows = extractFromDOM();
        if (domRows.length) { send({source:'dom', courseName:courseName, courseId:courseId, rows:domRows}); toast('✅ Gradintel: '+domRows.length+' grades found!'); }
        else toast('⚠️ Gradintel: no grades found on this page. Go to a course Grades page first.');
      });
  } else {
    var domRows = extractFromDOM();
    if (domRows.length) { send({source:'dom', courseName:courseName, courseId:null, rows:domRows}); toast('✅ Gradintel: '+domRows.length+' grades found! Switch back.'); }
    else toast('⚠️ Gradintel: navigate to a Canvas Grades page first, then click again.');
  }
})();`;
  return 'javascript:' + encodeURIComponent(fn);
}

// ── ALL-COURSES BOOKMARKLET ───────────────────────────────────
function ciGetAllCoursesBookmarkletCode() {
  const sbUrl  = SUPABASE_URL;
  const sbAnon = SUPABASE_ANON;
  const userId = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'anonymous';
  const fn = `(function(){
  var SBURL=${JSON.stringify(sbUrl)};var SBANON=${JSON.stringify(sbAnon)};var UID=${JSON.stringify(userId)};
  function send(data){
    fetch(SBURL+'/rest/v1/canvas_sync',{method:'POST',headers:{'Content-Type':'application/json','apikey':SBANON,'Authorization':'Bearer '+SBANON,'Prefer':'return=minimal'},body:JSON.stringify({user_id:UID,payload:data,created_at:new Date().toISOString()})}).catch(function(){});
    try{var bc=new BroadcastChannel('gradintel_canvas');bc.postMessage({type:'GRADINTEL_ALL_COURSES',data:data});bc.close();}catch(e){}
    try{window.opener&&window.opener.postMessage({type:'GRADINTEL_ALL_COURSES',data:data},'*');}catch(e){}
  }
  function toast(msg,dur){var d=document.createElement('div');d.style.cssText='position:fixed;bottom:24px;right:24px;background:#818cf8;color:#fff;padding:12px 20px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:700;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.4);max-width:320px';d.textContent=msg;document.body.appendChild(d);setTimeout(function(){d.remove();},dur||4000);}
  var canvasBase=location.origin;
  toast('Gradintel: fetching all courses...');
  fetch(canvasBase+'/api/v1/courses?enrollment_state=active&per_page=100',{credentials:'include',headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'}})
  .then(function(r){return r.json();})
  .then(function(courses){
    if(!courses||!Array.isArray(courses)||!courses.length){toast('No active courses found. Make sure you are logged into Canvas.');return;}
    var active=courses.filter(function(c){return c.id&&c.name&&!c.access_restricted_by_date;});
    toast('Found '+active.length+' courses - loading grades...',10000);
    var allRows=[],done=0,total=active.length;
    if(!total){toast('No accessible courses found.');return;}
    active.forEach(function(course){
      fetch(canvasBase+'/api/v1/courses/'+course.id+'/assignment_groups?include[]=assignments&include[]=submission&per_page=100',{credentials:'include',headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'}})
      .then(function(r){return r.json();})
      .then(function(groups){
        if(!Array.isArray(groups))return;
        groups.forEach(function(g){
          var gw=g.group_weight||0;
          // Send one summary row per group (not per assignment)
          // scored/possible = sum across all graded assignments in group
          var scored=0,possible=0,hasScore=false;
          (g.assignments||[]).forEach(function(a){
            var sub=a.submission||{};
            if(sub.score!=null&&a.points_possible>0){
              scored+=sub.score;
              possible+=a.points_possible;
              hasScore=true;
            }
          });
          var pct=hasScore&&possible>0?(scored/possible*100):null;
          allRows.push({
            courseName:course.name,
            courseId:course.id,
            name:g.name,           // group name, not assignment name
            group:g.name,
            weight:gw,
            score:hasScore?scored:null,
            possible:hasScore?possible:null,
            pct:pct!=null?parseFloat(pct.toFixed(2)):null,
            isGroupSummary:true
          });
        });
      })
      .catch(function(){})
      .finally(function(){
        done++;
        if(done===total){
          if(!allRows.length){toast('No assignment data found across your courses.');return;}
          var scored=allRows.filter(function(r){return r.pct!==null;});
          send({type:'GRADINTEL_ALL_COURSES',rows:allRows,totalCourses:total});
          toast('Synced '+scored.length+' graded assignments from '+total+' courses! Switch back to Gradintel.',5000);
        }
      });
    });
  })
  .catch(function(err){toast('Error: '+err.message);});
})();`;
  return 'javascript:' + encodeURIComponent(fn);
}

function ciCopyAllBm() {
  const code = ciGetAllCoursesBookmarkletCode();
  navigator.clipboard.writeText(code)
    .then(function(){ showToast('📋 "Sync All Courses" bookmarklet copied! Create a bookmark and paste it as the URL.'); })
    .catch(function(){ prompt('Copy this bookmarklet URL:', code); });
}

async function ciReceiveAllCoursesData(data) {
  if (!data || !data.rows) return;
  const rows = data.rows.filter(function(r){ return r.name && r.courseName; });
  if (!rows.length) { showToast('⚠️ No grade data received.'); return; }
  ciBmRows = rows.map(function(r){
    return {
      courseName: r.courseName,
      name: r.name,
      group: r.group || null,
      weight: r.weight || null,
      score: (r.score !== null && r.score !== undefined) ? parseFloat(r.score) : null,
      possible: (r.possible !== null && r.possible !== undefined) ? parseFloat(r.possible) : null,
      pct: (r.pct !== null && r.pct !== undefined) ? parseFloat(r.pct) : null,
      source: 'bookmarklet-all'
    };
  });
  const totalCourses = data.totalCourses || '?';
  const scored = ciBmRows.filter(function(r){ return r.pct !== null; }).length;
  showToast('📡 All-courses sync received — ' + scored + ' graded assignments from ' + totalCourses + ' courses. Syncing now…');
  // ciAutoImport handles multi-course rows by grouping on courseName
  await ciAutoImport(ciBmRows, null);
}

// ── INIT ─────────────────────────────────────────────────────
function ciInitTab() {
  // Set bookmarklet hrefs
  const link = document.getElementById('ci-bm-link');
  if (link) link.href = ciGetBookmarkletCode();
  const allLink = document.getElementById('ci-bm-all-link');
  if (allLink) allLink.href = ciGetAllCoursesBookmarkletCode();
  // Restore last used method
  const savedMethod = localStorage.getItem('gradintel_canvas_method') || 'csv';
  ciSwitchMethod(savedMethod);
  // Populate semester dropdowns
  ciPopulateSemSelects();
  // Start listening for bookmarklet postMessages / BroadcastChannel
  ciStartListener();
}

function ciPopulateSemSelects() {
  ['ci-sem-select', 'ci-bm-sem-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    // Keep the first "new" option, rebuild the rest
    while (sel.options.length > 1) sel.remove(1);
    (semesters || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name || s.id;
      sel.appendChild(opt);
    });
  });
  // Show/hide new-name inputs
  ['ci-sem-select','ci-bm-sem-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const wrap = document.getElementById(id === 'ci-sem-select' ? 'ci-sem-name-wrap' : 'ci-bm-sem-name-wrap');
    sel.onchange = () => { if(wrap) wrap.style.display = sel.value === '__new__' ? '' : 'none'; };
    if (wrap) wrap.style.display = sel.value === '__new__' ? '' : 'none';
  });
}

// ── METHOD TOGGLE ─────────────────────────────────────────────
function ciSwitchMethod(m) {
  document.getElementById('ci-m-csv').classList.toggle('active', m === 'csv');
  document.getElementById('ci-m-bm').classList.toggle('active', m === 'bm');
  document.getElementById('ci-csv-panel').style.display = m === 'csv' ? '' : 'none';
  document.getElementById('ci-bm-panel').style.display  = m === 'bm'  ? '' : 'none';
  localStorage.setItem('gradintel_canvas_method', m);
}

// ── COPY BOOKMARKLET ──────────────────────────────────────────
function ciCopyBm() {
  const code = ciGetBookmarkletCode();
  navigator.clipboard.writeText(code)
    .then(() => showToast('📋 Bookmarklet code copied! Create a new bookmark and paste as the URL.'))
    .catch(() => {
      prompt('Copy this bookmarklet URL and save as a new bookmark:', code);
    });
}

// ── SUPABASE REALTIME LISTENER ────────────────────────────────
let ciBcListening = false;
let _ciRealtimeChannel = null;
function ciStartListener() {
  if (ciBcListening) return;
  ciBcListening = true;

  // 1) Supabase Realtime — listens for INSERT on canvas_sync table for this user.
  //    Fires the instant the bookmarklet POSTs from ANY domain. This is the primary path.
  if (sb && typeof currentUser !== 'undefined' && currentUser) {
    try {
      if (_ciRealtimeChannel) sb.removeChannel(_ciRealtimeChannel);
      _ciRealtimeChannel = sb
        .channel('canvas-sync-' + currentUser.id)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'canvas_sync',
          filter: 'user_id=eq.' + currentUser.id
        }, function(payload) {
          if (payload.new && payload.new.payload) {
            const p = payload.new.payload;
            if (p.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(p);
            else ciReceiveBmData(p);
            // Clean up the row immediately after receiving
            sb.from('canvas_sync').delete().eq('id', payload.new.id).then(function(){});
          }
        })
        .subscribe();
    } catch(e) { console.warn('Supabase realtime failed:', e); }
  }

  // 2) BroadcastChannel fallback (same-origin tabs)
  try {
    const bc = new BroadcastChannel('gradintel_canvas');
    bc.onmessage = e => {
      if (e.data && e.data.type === 'GRADINTEL_CANVAS') ciReceiveBmData(e.data.data);
      if (e.data && e.data.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(e.data.data);
    };
  } catch(e) {}

  // 3) postMessage fallback
  window.addEventListener('message', e => {
    if (e.data && e.data.type === 'GRADINTEL_CANVAS') ciReceiveBmData(e.data.data);
    if (e.data && e.data.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(e.data.data);
  });
}

// ── CSV DROP ZONE ─────────────────────────────────────────────
function ciHandleDrop(ev) {
  ev.preventDefault();
  document.getElementById('ci-dropzone').classList.remove('drag');
  ciHandleFiles(ev.dataTransfer.files);
}

async function ciHandleFiles(files) {
  if (!files || !files.length) return;
  const statusEl = document.getElementById('ci-parse-status');
  statusEl.style.display = '';
  statusEl.innerHTML = `<div class="infobox">⏳ Parsing ${files.length} file(s)…</div>`;

  ciCsvRows = [];
  const errors = [];

  for (const file of files) {
    try {
      const text = await file.text();
      const parsed = ciParseCanvasCsv(text, file.name);
      ciCsvRows.push(...parsed);
    } catch(e) {
      errors.push(file.name + ': ' + e.message);
    }
  }

  if (errors.length) {
    statusEl.innerHTML = `<div class="infobox yellow">⚠️ ${errors.join('<br>')}</div>`;
  }
  if (!ciCsvRows.length) {
    statusEl.innerHTML = `<div class="infobox yellow">⚠️ No grade data found in the uploaded file(s). Make sure you're uploading a Canvas Grades CSV export.</div>`;
    return;
  }
  statusEl.style.display = 'none';
  ciShowPreview(ciCsvRows, 'csv');
}

// ── CSV PARSER ────────────────────────────────────────────────
// Canvas CSV format: rows of student assignments with columns like
// "Student","ID","SIS User ID","SIS Login ID","Section","Assignment Name","Assignment ID","Submission Type","Score","Possible",...
// OR the simpler "Grades" export: student row with all assignments as columns.
// We handle both formats.
function ciParseCanvasCsv(text, filename) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('File appears empty');

  const headers = ciCsvSplit(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9 _]/g,''));

  // Detect format
  // Format A: individual assignment rows — has "title" or "name" and "score" columns
  const titleIdx   = headers.findIndex(h => h === 'title' || h === 'assignment name' || h === 'name');
  const scoreIdx   = headers.findIndex(h => h === 'score' || h === 'final score' || h === 'current score');
  const possIdx    = headers.findIndex(h => h === 'possible' || h === 'points possible' || h === 'max score');
  const groupIdx   = headers.findIndex(h => h === 'group' || h === 'assignment group' || h === 'category');
  const weightIdx  = headers.findIndex(h => h === 'weight' || h === 'group weight');

  // Guess course name from filename
  const courseName = filename.replace(/\.csv$/i,'').replace(/_/g,' ').replace(/-/g,' ').trim() || 'Imported Course';

  const rows = [];

  if (titleIdx >= 0 && scoreIdx >= 0) {
    // Format A: one assignment per row
    for (let i = 1; i < lines.length; i++) {
      const cols = ciCsvSplit(lines[i]);
      if (cols.length < 2) continue;
      const name   = (cols[titleIdx]  || '').trim();
      const score  = (cols[scoreIdx]  || '').trim();
      const poss   = possIdx >= 0 ? (cols[possIdx] || '').trim() : null;
      const group  = groupIdx >= 0 ? (cols[groupIdx] || '').trim() : null;
      const weight = weightIdx >= 0 ? parseFloat(cols[weightIdx]) : null;
      if (!name || name === 'Points Possible') continue;
      const scoreNum = parseFloat(score);
      const possNum  = parseFloat(poss);
      const pct = (!isNaN(scoreNum) && !isNaN(possNum) && possNum > 0) ? (scoreNum / possNum * 100) : (!isNaN(scoreNum) && scoreNum <= 100 ? scoreNum : null);
      rows.push({ courseName, name, group, weight, score: isNaN(scoreNum) ? null : scoreNum, possible: isNaN(possNum) ? null : possNum, pct: pct != null ? parseFloat(pct.toFixed(1)) : null, source: 'csv' });
    }
  } else {
    // Format B: wide/pivot format — first row has assignment names as headers
    // Row 2 is "Points Possible", remaining rows are students
    // For a single-student export, row index 2 (or 1 if no points row) is the data row
    // We look for a "current user" row or just take the first data row
    const pointsRow = lines.findIndex((l,i) => i > 0 && l.toLowerCase().includes('points possible'));
    const studentRows = lines.slice(Math.max(2, pointsRow + 1)).filter(l => !l.toLowerCase().startsWith('points'));
    if (!studentRows.length) throw new Error('Could not detect grade rows');

    // Take first student row (the logged-in user's row)
    const dataRow = ciCsvSplit(studentRows[0]);
    const headerRow = ciCsvSplit(lines[0]);
    const possRowParsed = pointsRow >= 0 ? ciCsvSplit(lines[pointsRow]) : null;

    // Skip non-assignment columns: Student,ID,SIS User ID,SIS Login ID,Section,<assignments...>,Current Score,Final Score,...
    const skipCols = new Set(['student','id','sis user id','sis login id','section','integration id','current score','final score','current grade','final grade','unposted current score','unposted final score','unposted current grade','unposted final grade']);
    for (let ci = 0; ci < headerRow.length; ci++) {
      const h = headerRow[ci].trim();
      if (skipCols.has(h.toLowerCase())) continue;
      if (!h || ci >= dataRow.length) continue;
      const score = dataRow[ci].trim();
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum)) continue;
      const poss = possRowParsed ? parseFloat(possRowParsed[ci]) : null;
      const pct = (!isNaN(poss) && poss > 0) ? scoreNum / poss * 100 : (scoreNum <= 100 ? scoreNum : null);
      rows.push({ courseName, name: h, group: null, weight: null, score: scoreNum, possible: isNaN(poss) ? null : poss, pct: pct != null ? parseFloat(pct.toFixed(1)) : null, source: 'csv' });
    }
  }

  if (!rows.length) throw new Error('No scoreable rows found — check this is a Canvas Grades CSV');
  return rows;
}

function ciCsvSplit(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  result.push(cur);
  return result;
}

// ── PREVIEW RENDERER ─────────────────────────────────────────
function ciShowPreview(rows, mode) {
  const isCSV = mode === 'csv';
  const cardId    = isCSV ? 'ci-preview-card'   : 'ci-bm-preview';
  const waitId    = isCSV ? null                 : 'ci-bm-waiting';
  const tableId   = isCSV ? 'ci-preview-table'  : 'ci-bm-preview-table';
  const summaryId = isCSV ? 'ci-preview-summary': 'ci-bm-preview-summary';
  const warnId    = isCSV ? 'ci-preview-warn'   : null;

  const card = document.getElementById(cardId);
  const table = document.getElementById(tableId);
  const summary = document.getElementById(summaryId);
  if (!card || !table) return;

  // Hide waiting state, show card
  if (waitId) document.getElementById(waitId).style.display = 'none';
  card.style.display = '';
  // Update sync badge timestamp for bookmarklet
  if (!isCSV) {
    const timeEl = document.getElementById('ci-bm-sync-time');
    if (timeEl) timeEl.textContent = 'Last synced: ' + new Date().toLocaleTimeString();
  }

  // Group by course name
  const byCourse = {};
  rows.forEach(r => {
    if (!byCourse[r.courseName]) byCourse[r.courseName] = [];
    byCourse[r.courseName].push(r);
  });

  const courseNames = Object.keys(byCourse);
  const scoredCount = rows.filter(r => r.pct !== null && r.pct !== undefined).length;
  const skippedCount = rows.filter(r => r.pct === null || r.pct === undefined).length;

  summary.innerHTML = `Found <strong>${rows.length}</strong> assignments across <strong>${courseNames.length}</strong> course(s) — <span style="color:var(--green)">${scoredCount} with scores</span>${skippedCount ? `, <span style="color:var(--muted)">${skippedCount} unscored (skipped)</span>` : ''}.`;

  if (warnId && skippedCount > 0) {
    const w = document.getElementById(warnId);
    w.style.display = '';
    w.textContent = `⚠️ ${skippedCount} assignment(s) have no score and will be skipped.`;
  }

  let html = '<table class="ci-preview-tbl"><thead><tr><th>Course</th><th>Assignment</th><th>Group</th><th>Score</th><th>%</th><th>Status</th></tr></thead><tbody>';
  courseNames.forEach(cn => {
    byCourse[cn].forEach((r, i) => {
      const hasScore = r.pct !== null && r.pct !== undefined;
      const pill = hasScore ? '<span class="ci-pill-new">New</span>' : '<span class="ci-pill-skip">No score</span>';
      const pctDisplay = r.pct !== null ? r.pct.toFixed(1) + '%' : '—';
      const scoreDisplay = r.score !== null ? (r.possible !== null ? `${r.score}/${r.possible}` : r.score) : '—';
      html += `<tr class="${hasScore ? '' : 'ci-skip'}">
        <td>${i === 0 ? `<strong>${cn}</strong>` : ''}</td>
        <td>${r.name}</td>
        <td style="color:var(--muted2)">${r.group || '—'}</td>
        <td>${scoreDisplay}</td>
        <td style="font-weight:700;color:${r.pct >= 90 ? 'var(--green)' : r.pct >= 70 ? 'var(--yellow)' : 'var(--red)'}">${pctDisplay}</td>
        <td>${pill}</td>
      </tr>`;
    });
  });
  html += '</tbody></table>';
  table.innerHTML = html;

  // Refresh semester dropdowns
  ciPopulateSemSelects();
}

// ── MANUAL PASTE FALLBACK ─────────────────────────────────────
function ciCheckManualPaste(val) {
  const el = document.getElementById('ci-bm-paste-status');
  if (!el) return;
  if (!val.trim()) { el.textContent = ''; return; }
  try {
    const p = JSON.parse(val.trim());
    const rows = (p.data && p.data.rows) ? p.data.rows.filter(r => r.name && r.pct !== null) : [];
    el.style.color = rows.length ? 'var(--green)' : 'var(--yellow)';
    el.textContent = rows.length
      ? `✅ Found ${rows.length} scored assignment(s) — click Import`
      : '⚠️ JSON parsed but no scored assignments found.';
  } catch(e) {
    el.style.color = 'var(--red)';
    el.textContent = '❌ Not valid JSON — make sure you copied the full output.';
  }
}
function ciDoManualPasteImport() {
  const ta = document.getElementById('ci-bm-manual-paste');
  if (!ta || !ta.value.trim()) { showToast('⚠️ Paste the JSON first.'); return; }
  try {
    const p = JSON.parse(ta.value.trim());
    if (!p || !p.data || !p.data.rows) throw new Error('Missing rows');
    ciReceiveBmData(p.data);
    ta.value = '';
    document.getElementById('ci-bm-paste-status').textContent = '';
  } catch(e) {
    showToast('❌ Invalid JSON: ' + e.message);
  }
}

// ── BOOKMARKLET RECEIVER ─────────────────────────────────────
async function ciReceiveBmData(data) {
  if (!data || !data.rows) return;
  ciBmRows = data.rows.filter(r => r.name).map(r => ({
    courseName: data.courseName || 'Canvas Import',
    name: r.name,
    group: r.group || null,
    weight: r.weight || null,
    score: (r.score !== null && r.score !== undefined) ? parseFloat(r.score) : null,
    possible: (r.possible !== null && r.possible !== undefined) ? parseFloat(r.possible) : null,
    pct: (r.pct !== null && r.pct !== undefined) ? parseFloat(r.pct) : null,
    source: 'bookmarklet'
  }));
  if (!ciBmRows.length) { showToast('\u26a0\ufe0f Bookmarklet sent no grade data.'); return; }
  showToast('\ud83d\udce1 Canvas grades received — syncing ' + ciBmRows.length + ' assignments\u2026');
  await ciAutoImport(ciBmRows, data.courseName || 'Canvas Import');
}

// ── EXAM GROUP DETECTION ──────────────────────────────────────
function ciIsExamGroup(groupName) {
  if (!groupName) return false;
  const g = groupName.toLowerCase().trim();
  // Match exam/exams, test/tests, quiz/quizzes, final/finals, midterm/midterms
  const isExamLike = /\bexams?\b|\bmidterms?\b|\bfinals?\b|\btests?\b|\bquizzes\b|\bquiz\b/.test(g);
  if (!isExamLike) return false;
  // Exception: "hw quizzes", "homework quiz", "practice quiz", "worksheet" — those are regular work
  const isRegularWork = /\bhw\b|\bhomework\b|\bpractice\b|\bworksheet\b/.test(g);
  return !isRegularWork;
}

// ── COURSE-MATCH PICKER ───────────────────────────────────────
// Shows a modal asking user which existing course to map the Canvas course to.
// Resolves with the chosen {sem, subject} or null to skip.
function ciPickCourseMatch(canvasCourseName) {
  return new Promise(function(resolve) {
    // Build list of all subjects across all semesters
    const options = [];
    semesters.forEach(function(sem) {
      (sem.subjects || []).forEach(function(s) {
        options.push({ sem, subject: s, label: s.name + ' — ' + (sem.name || sem.id) });
      });
    });

    // Build semester options for the "create new subject" form
    const semOpts = semesters.map(function(sem) {
      return '<option value="' + sem.id + '">' + (sem.name || sem.id) + '</option>';
    }).join('');
    const hasSems = semesters.length > 0;

    // Build modal HTML
    const modalId = 'ci-match-modal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
      position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.7);backdrop-filter:blur(8px);padding:20px;
    `;

    const existingListHtml = options.length ? options.map(function(o, i) {
      return '<div class="ci-match-opt" data-idx="' + i + '" onclick="ciPickOpt(' + i + ')"' +
        ' style="padding:12px 16px;border-radius:10px;border:1px solid var(--border2);' +
        'background:var(--surface2);cursor:pointer;transition:all .15s;font-size:14px;font-weight:600">' +
        o.label + '</div>';
    }).join('') : '<div style="font-size:13px;color:var(--muted);text-align:center;padding:14px 0">No existing subjects yet.</div>';

    modal.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border2);border-radius:20px;
                  padding:32px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6)">
        <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:18px;margin-bottom:8px">
          📡 Match Canvas Course
        </div>
        <div style="font-size:13px;color:var(--muted2);margin-bottom:20px;line-height:1.6">
          Canvas sent grades for <strong style="color:var(--accent)">${canvasCourseName}</strong>.<br>
          Pick an existing subject or create a new one below.
        </div>

        <!-- CREATE NEW SUBJECT — always at top -->
        <div id="ci-new-subj-toggle" onclick="ciToggleNewSubj()"
          style="padding:12px 16px;border-radius:10px;border:2px dashed rgba(129,140,248,.45);
                 background:rgba(129,140,248,.06);cursor:pointer;transition:all .15s;
                 font-size:14px;font-weight:700;color:var(--accent);margin-bottom:12px;
                 display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">➕</span> Create new subject for this course
        </div>
        <div id="ci-new-subj-form" style="display:none;margin-bottom:16px;
          background:var(--surface2);border:1px solid rgba(129,140,248,.3);
          border-radius:12px;padding:16px">
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Subject name</div>
          <input id="ci-new-subj-name" type="text" value="${canvasCourseName}"
            style="width:100%;padding:9px 12px;background:var(--surface3);border:1px solid var(--border2);
                   border-radius:8px;color:var(--text);font-family:'Cabinet Grotesk',sans-serif;
                   font-size:14px;outline:none;margin-bottom:10px"/>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Add to semester</div>
          ${hasSems
            ? '<select id="ci-new-subj-sem" style="width:100%;padding:9px 12px;background:var(--surface3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:\'Cabinet Grotesk\',sans-serif;font-size:14px;outline:none;margin-bottom:10px">' + semOpts + '</select>'
            : '<input id="ci-new-subj-sem-name" type="text" placeholder="New semester name (e.g. Fall 2025)" style="width:100%;padding:9px 12px;background:var(--surface3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:\'Cabinet Grotesk\',sans-serif;font-size:14px;outline:none;margin-bottom:10px"/>'
          }
          <button onclick="ciCreateAndPick()" style="width:100%;padding:10px;border-radius:8px;border:none;
            background:var(--accent);color:#fff;font-family:'Clash Display',sans-serif;
            font-weight:700;font-size:14px;cursor:pointer">
            ✅ Create &amp; Sync Here
          </button>
        </div>

        <!-- EXISTING SUBJECTS LIST -->
        ${options.length ? '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Or pick an existing subject</div>' : ''}
        <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;margin-bottom:20px" id="ci-match-list">
          ${existingListHtml}
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="ciPickOpt(-1)" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--border2);
            background:transparent;color:var(--muted);cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;font-size:13px">
            Skip this course
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    window.ciToggleNewSubj = function() {
      const form = document.getElementById('ci-new-subj-form');
      const toggle = document.getElementById('ci-new-subj-toggle');
      const open = form.style.display === 'none';
      form.style.display = open ? 'block' : 'none';
      toggle.style.background = open ? 'rgba(129,140,248,.12)' : 'rgba(129,140,248,.06)';
      toggle.style.borderColor = open ? 'var(--accent)' : 'rgba(129,140,248,.45)';
    };

    window.ciCreateAndPick = async function() {
      const nameEl = document.getElementById('ci-new-subj-name');
      const semSelEl = document.getElementById('ci-new-subj-sem');
      const semNameEl = document.getElementById('ci-new-subj-sem-name');
      const subjectName = (nameEl && nameEl.value.trim()) || canvasCourseName;

      let targetSem;
      if (semSelEl) {
        targetSem = semesters.find(function(s) { return s.id === semSelEl.value; });
      } else if (semNameEl) {
        const newSemName = (semNameEl.value.trim()) || ('Semester ' + (semesters.length + 1));
        targetSem = { id: (typeof uid === 'function' ? uid() : ('sem_' + Date.now())), name: newSemName, subjects: [], user_id: currentUser.id, _gpa: 0 };
        semesters.push(targetSem);
      }
      if (!targetSem) { showToast('⚠️ Please select a semester.'); return; }

      const newSubject = {
        id: (typeof uid === 'function' ? uid() : ('subj_' + Date.now())),
        name: subjectName,
        credits: 3,
        status: 'normal',
        other_pct: 100,
        exam_pct: 0,
        other_score: 0,
        exams: []
      };
      targetSem.subjects.push(newSubject);
      await saveSemesterToDB(targetSem);
      updateStats(); renderDashboard(); renderCourses();
      modal.remove();
      delete window.ciPickOpt;
      delete window.ciToggleNewSubj;
      delete window.ciCreateAndPick;
      resolve({ sem: targetSem, subject: newSubject });
    };

    window.ciPickOpt = function(idx) {
      modal.remove();
      delete window.ciPickOpt;
      delete window.ciToggleNewSubj;
      delete window.ciCreateAndPick;
      if (idx < 0) { resolve(null); return; }
      resolve(options[idx]);
    };

    // Style hover via JS since we can't add CSS dynamically easily
    modal.querySelectorAll('.ci-match-opt').forEach(function(el) {
      el.addEventListener('mouseenter', function() {
        el.style.borderColor = 'var(--accent)';
        el.style.background  = 'rgba(129,140,248,.1)';
      });
      el.addEventListener('mouseleave', function() {
        el.style.borderColor = 'var(--border2)';
        el.style.background  = 'var(--surface2)';
      });
    });
  });
}


// ── IMPORT ENGINE ─────────────────────────────────────────────
// ── BULK COURSE MAPPER ────────────────────────────────────────
// Shows one modal listing ALL unmatched Canvas courses at once.
// User maps each to an existing subject or picks "Create new".
// Returns a Map: canvasCourseName → { sem, subject } or null (skip).
function ciBulkMapCourses(unmatchedNames) {
  return new Promise(function(resolve) {
    const modalId = 'ci-bulk-map-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    // Build flat options list for dropdowns
    const subjOptions = [];
    semesters.forEach(function(sem) {
      (sem.subjects || []).forEach(function(s) {
        subjOptions.push({ sem, subject: s, label: s.name + ' (' + (sem.name || sem.id) + ')' });
      });
    });

    const semOpts = semesters.map(function(sem) {
      return '<option value="' + sem.id + '">' + (sem.name || sem.id) + '</option>';
    }).join('');
    const hasSems = semesters.length > 0;

    const rowsHtml = unmatchedNames.map(function(cn, i) {
      const optionsHtml = subjOptions.map(function(o, j) {
        // Auto-select if fuzzy match
        const autoSel = o.subject.name.toLowerCase().includes(cn.toLowerCase().slice(0,6)) ||
                        cn.toLowerCase().includes(o.subject.name.toLowerCase().slice(0,6));
        return '<option value="subj__' + j + '"' + (autoSel ? ' selected' : '') + '>' + o.label + '</option>';
      }).join('');
      return `
        <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:12px;padding:14px 16px;margin-bottom:10px" id="bulk-row-${i}">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:14px;flex:1;min-width:160px;color:var(--accent)">${cn}</div>
            <select id="bulk-sel-${i}" onchange="ciBulkSelChange(${i})"
              style="flex:2;min-width:200px;padding:8px 10px;background:var(--surface3);border:1px solid var(--border2);
                     border-radius:8px;color:var(--text);font-family:'Cabinet Grotesk',sans-serif;font-size:13px;outline:none">
              <option value="skip">— Skip this course —</option>
              <option value="new">➕ Create new subject</option>
              ${optionsHtml}
            </select>
          </div>
          <div id="bulk-new-${i}" style="display:none;margin-top:10px;display:none;gap:8px;flex-wrap:wrap;align-items:center">
            <input id="bulk-newname-${i}" type="text" value="${cn}" placeholder="Subject name"
              style="flex:2;min-width:160px;padding:7px 10px;background:var(--surface3);border:1px solid var(--border2);
                     border-radius:8px;color:var(--text);font-family:'Cabinet Grotesk',sans-serif;font-size:13px;outline:none"/>
            ${hasSems
              ? '<select id="bulk-newsem-' + i + '" style="flex:1;min-width:140px;padding:7px 10px;background:var(--surface3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:\'Cabinet Grotesk\',sans-serif;font-size:13px;outline:none">' + semOpts + '</select>'
              : '<input id="bulk-newsem-' + i + '" type="text" placeholder="New semester name" style="flex:1;min-width:140px;padding:7px 10px;background:var(--surface3);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:\'Cabinet Grotesk\',sans-serif;font-size:13px;outline:none"/>'
            }
          </div>
        </div>`;
    }).join('');

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border2);border-radius:20px;
                  padding:30px;max-width:600px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.6);
                  max-height:88vh;display:flex;flex-direction:column">
        <div style="font-family:'Clash Display',sans-serif;font-weight:700;font-size:20px;margin-bottom:6px">
          📡 Map Canvas Courses to Subjects
        </div>
        <div style="font-size:13px;color:var(--muted2);margin-bottom:20px;line-height:1.6">
          Gradintel found <strong style="color:var(--accent)">${unmatchedNames.length}</strong> Canvas course(s) that need mapping.
          Match each one to an existing subject, create a new one, or skip it.
        </div>
        <div style="overflow-y:auto;flex:1;padding-right:4px;margin-bottom:16px">
          ${rowsHtml}
        </div>
        <div style="display:flex;gap:10px;flex-shrink:0">
          <button onclick="ciBulkConfirm()" style="flex:1;padding:12px;border-radius:10px;border:none;
            background:var(--accent);color:#fff;font-family:'Clash Display',sans-serif;font-weight:700;font-size:15px;cursor:pointer">
            ✅ Confirm &amp; Sync All
          </button>
          <button onclick="ciBulkCancel()" style="padding:12px 20px;border-radius:10px;border:1px solid var(--border2);
            background:transparent;color:var(--muted);cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;font-size:13px">
            Cancel
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    window.ciBulkSelChange = function(i) {
      const sel = document.getElementById('bulk-sel-' + i);
      const newRow = document.getElementById('bulk-new-' + i);
      if (!sel || !newRow) return;
      newRow.style.display = sel.value === 'new' ? 'flex' : 'none';
    };

    window.ciBulkConfirm = async function() {
      const result = new Map();
      for (let i = 0; i < unmatchedNames.length; i++) {
        const cn = unmatchedNames[i];
        const sel = document.getElementById('bulk-sel-' + i);
        if (!sel) { result.set(cn, null); continue; }
        const val = sel.value;
        if (val === 'skip') { result.set(cn, null); continue; }
        if (val === 'new') {
          const nameEl = document.getElementById('bulk-newname-' + i);
          const semEl  = document.getElementById('bulk-newsem-' + i);
          const subjectName = (nameEl && nameEl.value.trim()) || cn;
          let targetSem;
          if (hasSems) {
            targetSem = semesters.find(function(s) { return s.id === semEl.value; });
          } else {
            const newSemName = (semEl && semEl.value.trim()) || ('Semester ' + (semesters.length + 1));
            targetSem = { id: uid(), name: newSemName, subjects: [], user_id: currentUser.id, _gpa: 0 };
            semesters.push(targetSem);
          }
          if (!targetSem) { result.set(cn, null); continue; }
          const newSubject = { id: uid(), name: subjectName, credits: 3, status: 'normal', other_pct: 100, exam_pct: 0, other_score: 0, exams: [] };
          targetSem.subjects.push(newSubject);
          await saveSemesterToDB(targetSem);
          result.set(cn, { sem: targetSem, subject: newSubject });
        } else if (val.startsWith('subj__')) {
          const idx = parseInt(val.replace('subj__', ''));
          result.set(cn, subjOptions[idx]);
        } else {
          result.set(cn, null);
        }
      }
      modal.remove();
      delete window.ciBulkSelChange;
      delete window.ciBulkConfirm;
      delete window.ciBulkCancel;
      updateStats(); renderDashboard(); renderCourses();
      resolve(result);
    };

    window.ciBulkCancel = function() {
      modal.remove();
      delete window.ciBulkSelChange;
      delete window.ciBulkConfirm;
      delete window.ciBulkCancel;
      resolve(null);
    };
  });
}

// ciAutoImport: called automatically when bookmarklet fires.
// - Filters out exam groups (user enters those manually)
// - Computes weighted other_score from points scored / points possible
// - Matches to existing course by name; if no match, asks user to pick
// - Updates other_score on the existing subject — never touches exams[]
// - Keeps the user's existing credits, never overwrites them
async function ciAutoImport(rows, courseNameHint) {
  // We work with ALL rows — filtering happens per-group inside the loop.
  const allValidRows = rows.filter(function(r) { return r.courseName; });
  if (!allValidRows.length) { showToast('⚠️ No grade rows received from Canvas.'); return; }

  // Group rows by Canvas course name
  const byCourse = {};
  allValidRows.forEach(function(r) {
    if (!byCourse[r.courseName]) byCourse[r.courseName] = [];
    byCourse[r.courseName].push(r);
  });

  // Build flat list of all subjects for the picker
  const allSubjects = [];
  semesters.forEach(function(sem) {
    (sem.subjects || []).forEach(function(s) {
      allSubjects.push({ sem, subject: s });
    });
  });

  let updatedCourses = 0;

  for (const [canvasCourseName, courseRows] of Object.entries(byCourse)) {

    // ── Step 1: Aggregate all rows into ONE entry per group ──────
    // Rows may be individual assignments (old bookmarklet) or group summaries (new).
    // Either way: sum scored/possible per group, use the group's weight (same for all rows in group).
    const groupMap = {};
    courseRows.forEach(function(r) {
      const gName = r.group || r.name || '?';
      if (!groupMap[gName]) {
        groupMap[gName] = { name: gName, weight: null, scored: 0, possible: 0, hasScore: false };
      }
      const g = groupMap[gName];
      // Take weight from any row that has it
      if (r.weight !== null && r.weight !== undefined && parseFloat(r.weight) > 0) {
        g.weight = parseFloat(r.weight);
      }
      // Accumulate raw points
      if (r.score !== null && r.score !== undefined && r.possible !== null && r.possible !== undefined && parseFloat(r.possible) > 0) {
        g.scored   += parseFloat(r.score);
        g.possible += parseFloat(r.possible);
        g.hasScore  = true;
      } else if (r.pct !== null && r.pct !== undefined && !r.isGroupSummary) {
        // individual assignment with only pct — treat as 1 point each
        g.scored   += parseFloat(r.pct) / 100;
        g.possible += 1;
        g.hasScore  = true;
      }
    });

    // Compute groupPct for each group
    const allGroups = Object.values(groupMap).map(function(g) {
      const groupPct = g.possible > 0 ? (g.scored / g.possible * 100) : null;
      return { name: g.name, groupPct, weight: g.weight, isExam: ciIsExamGroup(g.name) };
    });

    const eligibleGroups = allGroups.filter(function(g) {
      return !g.isExam && g.groupPct !== null;
    });

    // ── DEBUG popup removed ──

    if (eligibleGroups.length === 0) {
      showToast('⚠️ ' + canvasCourseName + ': no scored non-exam groups — skipping.');
      continue;
    }

    // Weighted average: sum(groupPct × weight) / sum(weights)
    let computedOtherScore;
    const totalWeight = eligibleGroups.reduce(function(a, g) { return a + (g.weight || 0); }, 0);
    if (totalWeight > 0) {
      const weightedSum = eligibleGroups.reduce(function(a, g) { return a + g.groupPct * g.weight; }, 0);
      computedOtherScore = parseFloat((weightedSum / totalWeight).toFixed(2));
    } else {
      const sum = eligibleGroups.reduce(function(a, g) { return a + g.groupPct; }, 0);
      computedOtherScore = parseFloat((sum / eligibleGroups.length).toFixed(2));
    }

    // ── Step 2: Show subject picker — auto-preselect best name match ────────
    // Find best match by name similarity
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cn = normalize(canvasCourseName);
    let bestIdx = -1, bestScore = 0;
    allSubjects.forEach(function(item, idx) {
      const sn = normalize(item.subject.name);
      // Score: exact contains > word overlap
      let sc = 0;
      if (cn.includes(sn) || sn.includes(cn)) sc = 2;
      else {
        const cnWords = cn.split('');
        let common = 0;
        sn.split('').forEach(c => { if (cn.includes(c)) common++; });
        sc = common / Math.max(cn.length, sn.length);
      }
      if (sc > bestScore) { bestScore = sc; bestIdx = idx; }
    });

    const groupSummary = eligibleGroups.map(function(g) {
      return '<span style="display:inline-block;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.25);border-radius:6px;padding:2px 8px;margin:2px;font-size:11px">' + g.name + ': ' + g.groupPct.toFixed(1) + '%</span>';
    }).join('');

    const chosen = await new Promise(function(resolve) {
      let selectedIdx = bestIdx;

      function buildModal() {
        const existing = document.getElementById('_ci_sync_modal');
        if (existing) existing.remove();

        const optionsHtml = allSubjects.map(function(item, idx) {
          const isSel = idx === selectedIdx;
          return '<button id="_ciopt_' + idx + '" onclick="window._ciPick(' + idx + ')" style="width:100%;text-align:left;padding:10px 14px;margin-bottom:5px;background:' + (isSel ? 'rgba(129,140,248,.15)' : 'var(--surface2)') + ';border:' + (isSel ? '1.5px solid var(--accent)' : '1px solid var(--border2)') + ';border-radius:9px;cursor:pointer;font-family:\'Cabinet Grotesk\',sans-serif;font-size:13px;color:var(--text);display:flex;align-items:center;gap:8px;transition:border .15s,background .15s">' +
            (isSel ? '<span style="color:var(--accent);font-size:16px">●</span>' : '<span style="color:var(--muted);font-size:16px">○</span>') +
            '<span><strong>' + item.subject.name + '</strong> <span style="font-size:11px;color:var(--muted)">(' + (item.sem.name || 'Semester') + ')</span></span>' +
            (isSel ? '<span style="margin-left:auto;font-size:10px;color:var(--accent);font-weight:700">AUTO-MATCHED</span>' : '') +
            '</button>';
        }).join('');

        const modal = document.createElement('div');
        modal.id = '_ci_sync_modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
        // Stop clicks inside modal from falling through
        modal.addEventListener('mousedown', e => e.stopPropagation());
        modal.innerHTML =
          '<div style="background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:28px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.7);position:relative">' +
            '<div style="font-family:\'Clash Display\',sans-serif;font-weight:700;font-size:19px;margin-bottom:4px">📡 Canvas Sync</div>' +
            '<div style="font-size:12px;color:var(--muted2);margin-bottom:10px">From Canvas: <strong style="color:var(--text)">' + canvasCourseName + '</strong></div>' +
            '<div style="margin-bottom:12px">' + groupSummary + '</div>' +
            '<div style="background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between">' +
              '<span style="font-size:13px;color:var(--muted2)">Calculated Other Stuff Score</span>' +
              '<strong style="font-family:\'Clash Display\',sans-serif;font-size:20px;color:var(--green)">' + computedOtherScore + '%</strong>' +
            '</div>' +
            '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:10px">Update which subject?</div>' +
            '<div id="_ci_opts">' + optionsHtml + '</div>' +
            '<button onclick="window._ciPick(\'new\')" style="width:100%;padding:11px;margin-top:4px;background:transparent;border:1.5px dashed var(--accent);border-radius:9px;color:var(--accent);cursor:pointer;font-family:\'Cabinet Grotesk\',sans-serif;font-size:13px;font-weight:600;transition:background .15s" onmouseover="this.style.background=\'rgba(129,140,248,.08)\'" onmouseout="this.style.background=\'transparent\'">+ Create new subject from this data</button>' +
            '<button onclick="window._ciPick(null)" style="width:100%;padding:9px;margin-top:6px;background:transparent;border:1px solid var(--border2);border-radius:9px;color:var(--muted);cursor:pointer;font-family:\'Cabinet Grotesk\',sans-serif;font-size:12px;transition:border .15s" onmouseover="this.style.borderColor=\'var(--muted)\'" onmouseout="this.style.borderColor=\'var(--border2)\'">Skip this course</button>' +
          '</div>';
        document.body.appendChild(modal);
      }

      buildModal();

      window._ciPick = function(idx) {
        const modal = document.getElementById('_ci_sync_modal');
        if (modal) modal.remove();
        delete window._ciPick;
        resolve(idx);
      };
    });

    if (chosen === null) continue; // skipped

    // ── Step 3: Apply or create ──────────────────────────────────
    if (chosen === 'new') {
      // Create a new subject in the most recent semester
      const targetSem = semesters[semesters.length - 1];
      if (!targetSem) { showToast('⚠️ No semester found — add a semester first.'); continue; }
      const newSubject = {
        id: uid(), name: canvasCourseName, credits: 3, status: 'normal',
        other_pct: 100, exam_pct: 0, other_score: computedOtherScore, exams: []
      };
      targetSem.subjects.push(newSubject);
      await saveSemesterToDB(targetSem);
      updatedCourses++;
      showToast('✅ Created "' + canvasCourseName + '" with score ' + computedOtherScore + '%');
    } else {
      const { sem: targetSem, subject } = allSubjects[chosen];
      subject.other_score = computedOtherScore;
      const cp = targetSem.subjects.reduce(function(a, s) { return a + s.credits * computeSubject(s).curG.p; }, 0);
      const cr = targetSem.subjects.reduce(function(a, s) { return a + s.credits; }, 0);
      targetSem._gpa = cr ? cp / cr : 0;
      await saveSemesterToDB(targetSem);
      updatedCourses++;
      // Remember mapping
      try {
        const memKey = 'gradintel_canvas_map_' + (currentUser?.id || '');
        const mem = JSON.parse(localStorage.getItem(memKey) || '{}');
        mem[canvasCourseName.trim().toLowerCase()] = subject.id;
        localStorage.setItem(memKey, JSON.stringify(mem));
      } catch(e) {}
    }
  }

  updateStats(); renderDashboard(); renderCourses(); renderHistory(); renderWIFull();
  const msg = '✅ Canvas synced! Updated other score for ' + updatedCourses + ' course' + (updatedCourses !== 1 ? 's' : '') + '.';
  showToast(msg);
  if (updatedCourses > 0) fireConfetti();
  const syncMsg = document.getElementById('ci-bm-sync-msg');
  if (syncMsg) syncMsg.textContent = msg.replace('✅ ', '');
  ciShowPreview(ciBmRows, 'bm');
}

// ciDoImport: used by CSV manual import button
async function ciDoImport(mode) {
  const rows = mode === 'csv' ? ciCsvRows : ciBmRows;
  const semSelId  = mode === 'csv' ? 'ci-sem-select'  : 'ci-bm-sem-select';
  const semNameId = mode === 'csv' ? 'ci-sem-name'    : 'ci-bm-sem-name';
  const btnId     = mode === 'csv' ? 'ci-import-btn'  : null;

  const scoredRows = rows.filter(r => r.pct !== null && r.pct !== undefined);
  if (!scoredRows.length) { showToast('\u26a0\ufe0f No scored assignments to import.'); return; }

  const semSel  = document.getElementById(semSelId);
  const semName = document.getElementById(semNameId);
  if (!semSel) return;

  if (btnId) { const b = document.getElementById(btnId); if (b) { b.disabled = true; b.textContent = 'Importing\u2026'; } }

  try {
    const byCourse = {};
    scoredRows.forEach(r => {
      if (!byCourse[r.courseName]) byCourse[r.courseName] = [];
      byCourse[r.courseName].push(r);
    });

    let targetSem;
    if (semSel.value === '__new__') {
      const name = (semName && semName.value.trim()) || ('Canvas Import ' + new Date().toLocaleDateString());
      targetSem = { id: uid(), name, subjects: [], user_id: currentUser.id, _gpa: 0 };
      semesters.push(targetSem);
    } else {
      targetSem = semesters.find(s => s.id === semSel.value);
      if (!targetSem) { showToast('\u274c Semester not found.'); return; }
    }

    let importedCourses = 0, importedExams = 0;

    for (const [courseName, courseRows] of Object.entries(byCourse)) {
      let subject = targetSem.subjects.find(s => s.name.toLowerCase() === courseName.toLowerCase());
      if (!subject) {
        const totalPossible = courseRows.reduce((a, r) => a + (r.possible || 1), 0);
        const exams = courseRows.map(r => ({
          id: uid(),
          name: r.name.length > 40 ? r.name.slice(0,40) + '\u2026' : r.name,
          weight: totalPossible > 0 ? ((r.possible || 1) / totalPossible * 100) : (100 / courseRows.length),
          taken: r.pct !== null,
          score: r.pct !== null ? parseFloat(r.pct.toFixed(1)) : null
        }));
        const wSum = exams.reduce((a, e) => a + e.weight, 0);
        if (wSum > 0) exams.forEach(e => e.weight = e.weight / wSum * 100);
        subject = { id: uid(), name: courseName, credits: 3, status: 'normal', exams };
        targetSem.subjects.push(subject);
        importedCourses++;
        importedExams += exams.filter(e => e.taken).length;
      } else {
        // Upsert into existing course
        courseRows.forEach(r => {
          if (r.pct === null) return;
          const existingIdx = subject.exams.findIndex(e => e.name.toLowerCase() === r.name.toLowerCase().slice(0,40));
          if (existingIdx >= 0) {
            subject.exams[existingIdx].score = parseFloat(r.pct.toFixed(1));
            subject.exams[existingIdx].taken = true;
          } else {
            subject.exams.push({ id: uid(), name: r.name.slice(0,40), weight: 100 / (subject.exams.length + 1), taken: true, score: parseFloat(r.pct.toFixed(1)) });
            importedExams++;
          }
        });
        const wS = subject.exams.reduce((a,e)=>a+e.weight,0);
        if (wS>0) subject.exams.forEach(e=>e.weight=e.weight/wS*100);
      }
    }

    const cp = targetSem.subjects.reduce((a, s) => a + s.credits * computeSubject(s).curG.p, 0);
    const cr = targetSem.subjects.reduce((a, s) => a + s.credits, 0);
    targetSem._gpa = cr ? cp / cr : 0;
    await saveSemesterToDB(targetSem);

    updateStats(); renderDashboard(); renderCourses(); renderHistory(); renderWIFull();
    showToast('\u2705 Imported ' + importedCourses + ' course(s) \u00b7 ' + importedExams + ' assignment(s) into "' + targetSem.name + '"!');
    fireConfetti();
    if (mode === 'csv') ciClearPreview();
    else ciClearBmPreview();

  } catch(e) {
    showToast('\u274c Import failed: ' + e.message);
    console.error(e);
  } finally {
    if (btnId) { const b = document.getElementById(btnId); if (b) { b.disabled = false; b.textContent = 'Import into Gradintel'; } }
  }
}

// ── CLEAR HELPERS ─────────────────────────────────────────────
function ciClearPreview() {
  ciCsvRows = [];
  document.getElementById('ci-preview-card').style.display = 'none';
  document.getElementById('ci-parse-status').style.display = 'none';
  const fi = document.getElementById('ci-csv-file'); if (fi) fi.value = '';
}
function ciClearBmPreview() {
  ciBmRows = [];
  const prev = document.getElementById('ci-bm-preview');
  const wait = document.getElementById('ci-bm-waiting');
  if (prev) prev.style.display = 'none';
  if (wait) wait.style.display = '';
}

// Start listeners immediately on page load
// so bookmarklet data is captured even if user isn't on canvas tab
(function() {
  // BroadcastChannel fallback (same-origin)
  try {
    const bc = new BroadcastChannel('gradintel_canvas');
    bc.onmessage = e => {
      if (e.data && e.data.type === 'GRADINTEL_CANVAS') ciReceiveBmData(e.data.data);
      if (e.data && e.data.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(e.data.data);
    };
  } catch(e) {}
  // postMessage fallback (any origin)
  window.addEventListener('message', e => {
    if (e.data && e.data.type === 'GRADINTEL_CANVAS') ciReceiveBmData(e.data.data);
    if (e.data && e.data.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(e.data.data);
  });
  // Supabase realtime + catch-up poll is handled in ciStartListener() when Canvas tab opens.
  // Also do a one-time catch-up poll after auth, in case bookmarklet fired before page load.
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      try {
        if (sb && typeof currentUser !== 'undefined' && currentUser) {
          sb.from('canvas_sync')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(function(res) {
              if (res.data && res.data.length > 0) {
                var row = res.data[0];
                var age = Date.now() - new Date(row.created_at).getTime();
                if (age < 120000) {
                  if (row.payload && row.payload.type === 'GRADINTEL_ALL_COURSES') ciReceiveAllCoursesData(row.payload);
                  else ciReceiveBmData(row.payload);
                  sb.from('canvas_sync').delete().eq('id', row.id).then(function(){});
                }
              }
            });
        }
      } catch(e) {}
    }, 2500);
  });
})();
