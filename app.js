const subjects = {
  math: { name: '数学', en: 'Mathematics', icon: '∑', color: '#d8ed62' },
  english: { name: '英语', en: 'English', icon: 'Aa', color: '#9ccde8' },
  major: { name: '专业课', en: 'Major', icon: '◇', color: '#efad7f' },
  training: { name: '政治', en: 'Politics', icon: '政', color: '#c7afd9' }
};
const $app = document.querySelector('#app');
const state = JSON.parse(localStorage.getItem('zhishi-state') || 'null') || seed();
if(!state.seedDataRemoved){
  const seedIds=new Set([1,2,3,4,5]);
  state.sessions=(state.sessions||[]).filter(session=>!seedIds.has(session.id));
  state.seedDataRemoved=true;
  localStorage.setItem('zhishi-state',JSON.stringify(state));
}
let page = 'today';
let timerTick;
let installPrompt = null;
window.addEventListener('beforeinstallprompt', event=>{event.preventDefault();installPrompt=event});

function seed() {
  return {
    goal: 300, language: 'zh', theme: 'green', seedDataRemoved: true,
    active: null,
    sessions: []
  };
}
function save() { localStorage.setItem('zhishi-state', JSON.stringify(state)); }
function isEn(){return state.language==='en'}
function tx(zh,en){return isEn()?en:zh}
function subjectName(id){return isEn()?subjects[id].en:subjects[id].name}
function applyTheme(){document.documentElement.dataset.theme=state.theme||'green'}
function localDay(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(date); }
function minsText(m) { return isEn()?(m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m} min`):(m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`); }
function todaySessions() { return state.sessions.filter(s => s.date === localDay()); }
function todayMinutes() { return todaySessions().reduce((sum, s) => sum + s.minutes, 0); }
function escapeHtml(s='') { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function shell(content) {
  return `<div class="phone-shell">
    <header class="topbar"><div class="wordmark"><span>${tx('知时','ZHI SHI')}</span><small>LEARNING LOG</small></div><button class="avatar" data-page="profile">竹</button></header>
    <main>${content}</main>
    <nav class="bottom-nav">
      ${[['today','⌂',tx('今日','Today')],['history','◫',tx('记录','Records')],['add','＋',tx('开始','Start')],['insights','⌁',tx('趋势','Trends')],['profile','○',tx('我的','Me')]].map(([id,icon,label]) =>
        `<button class="${page===id?'active':''} ${id==='add'?'add-button':''}" data-page="${id}"><i>${icon}</i><span>${label}</span></button>`).join('')}
    </nav>
  </div>`;
}

function todayView() {
  const now = new Date();
  const date = new Intl.DateTimeFormat(isEn()?'en-US':'zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(now);
  const total = todayMinutes(), percent = Math.min(100, Math.round(total/state.goal*100));
  const recent = todaySessions();
  return `<section class="hero"><p class="eyebrow">${date}</p><h1>${tx('今天，也在<br><em>成为更好的自己。</em>','Today, become<br><em>a better version of yourself.</em>')}</h1><p class="quote">${tx('把时间放在重要的事情上，答案会慢慢出现。','Give time to what matters. The answers will follow.')}</p></section>
  ${state.active ? activeCard() : `<button class="start-card" data-page="add"><span><b>${tx('开始一次专注学习','Start a focus session')}</b><small>${tx('选择科目，记录这段时间','Choose a subject and track your time')}</small></span><i>→</i></button>`}
  <section class="progress-card">
    <div class="ring" style="--p:${percent*3.6}deg"><div><b>${percent}</b><small>%</small></div></div>
    <div class="progress-copy"><p class="eyebrow">${tx('今日进度','TODAY')}</p><h2>${minsText(total)}</h2><p>${tx('目标','Goal')} ${minsText(state.goal)} · ${percent>=100?tx('今日目标已达成','Goal achieved'):tx('还差 ','Remaining ')+minsText(Math.max(0,state.goal-total))}</p></div>
  </section>
  <section class="section-head"><div><p class="eyebrow">TODAY</p><h2>${tx('今日记录','Today’s records')}</h2></div><button data-page="history">${tx('查看全部','View all')}</button></section>
  <div class="session-list">${recent.length ? recent.map(sessionCard).join('') : empty(tx('今天还没有完成记录','No records yet today'),tx('开始一次专注，让今天留下痕迹。','Start a session and make today count.'))}</div>`;
}
function activeCard() {
  const sub=subjects[state.active.subject];
  return `<section class="active-card"><div><p class="eyebrow">${tx('正在学习','STUDYING')} · ${subjectName(state.active.subject)}</p><h2 id="timer">${tx('专注进行中','Focus in progress')}</h2><small>${tx('计时已隐藏，结束后才会显示时长','Duration stays hidden until you finish')}</small></div><button id="finish">${tx('完成','Finish')}</button></section>`;
}
function addView() {
  if (state.active) return `<section class="page-title"><p class="eyebrow">FOCUS MODE</p><h1>${tx('保持专注','Stay focused')}</h1><p>${tx('时间正在安静地积累。','Your focused time is quietly adding up.')}</p></section>${activeCard()}<button class="danger-link" id="discard">${tx('放弃本次记录','Discard session')}</button>`;
  return `<section class="page-title"><p class="eyebrow">NEW SESSION</p><h1>${tx('现在学什么？','What will you study?')}</h1><p>${tx('选择一个方向，计时会立即开始。','Choose a subject to start timing.')}</p></section>
  <div class="subject-grid">${Object.entries(subjects).map(([id,s])=>`<button class="subject-card" data-subject="${id}" style="--tone:${s.color}"><i>${s.icon}</i><b>${subjectName(id)}</b><small>${tx('开始专注','Start focus')} →</small></button>`).join('')}</div>
  <aside class="soft-note"><i>◎</i><p><b>${tx('专注计时','Focus timer')}</b><br>${tx('进行中不会展示时长，帮你把注意力留在学习本身。','The timer stays hidden so your attention remains on learning.')}</p></aside>`;
}
function historyView() {
  const groups = Object.groupBy ? Object.groupBy(state.sessions, s=>s.date) : state.sessions.reduce((a,s)=>((a[s.date]??=[]).push(s),a),{});
  return `<section class="page-title compact"><p class="eyebrow">ARCHIVE</p><h1>${tx('学习记录','Study records')}</h1><p>${tx('共','Total')} ${state.sessions.length} ${tx('次专注','sessions')} · ${minsText(state.sessions.reduce((a,s)=>a+s.minutes,0))}</p></section>
  <label class="search"><span>⌕</span><input id="search" placeholder="${tx('搜索标题或笔记','Search titles or notes')}" /></label>
  <div id="history-results">${Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).map(([date,items])=>`<section class="date-group"><header><b>${date===localDay()?tx('今天','Today'):date}</b><span>${minsText(items.reduce((a,s)=>a+s.minutes,0))}</span></header>${items.map(sessionCard).join('')}</section>`).join('')}</div>`;
}
function sessionCard(s) { const sub=subjects[s.subject]; return `<article class="session" data-id="${s.id}"><i style="--tone:${sub.color}">${sub.icon}</i><div><b>${escapeHtml(s.title)}</b><small>${s.start} · ${subjectName(s.subject)}</small></div><span class="session-actions"><strong>${minsText(s.minutes)}</strong><button class="delete-session" data-delete-id="${s.id}" aria-label="${tx('删除记录','Delete record')}">×</button></span></article>`; }
function insightsView() {
  const last7 = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=localDay(d);return {key,label:(isEn()?['S','M','T','W','T','F','S']:'日一二三四五六')[d.getDay()],m:state.sessions.filter(s=>s.date===key).reduce((a,s)=>a+s.minutes,0)}});
  const max=Math.max(60,...last7.map(x=>x.m));
  const totals=Object.keys(subjects).map(id=>({id,m:state.sessions.filter(s=>s.subject===id).reduce((a,s)=>a+s.minutes,0)}));
  return `<section class="page-title compact"><p class="eyebrow">INSIGHTS</p><h1>${tx('学习趋势','Study trends')}</h1><p>${tx('理解时间如何被使用。','See how your time is being used.')}</p></section>
  <section class="stat-row"><div><small>${tx('本周学习','This week')}</small><b>${minsText(last7.reduce((a,x)=>a+x.m,0))}</b></div><div><small>${tx('连续学习','Study streak')}</small><b>${streak()} ${tx('天','days')}</b></div></section>
  <section class="chart-card"><div class="section-head"><div><p class="eyebrow">LAST 7 DAYS</p><h2>${tx('一周节奏','Weekly rhythm')}</h2></div></div><div class="bars">${last7.map(x=>`<div><span>${x.m?Math.round(x.m/60*10)/10:''}</span><i style="height:${Math.max(6,x.m/max*140)}px"></i><small>${x.label}</small></div>`).join('')}</div></section>
  <section class="chart-card"><p class="eyebrow">SUBJECTS</p><h2>${tx('科目分布','Subject breakdown')}</h2><div class="subject-totals">${totals.map(x=>`<div><span><i style="background:${subjects[x.id].color}"></i>${subjectName(x.id)}</span><b>${minsText(x.m)}</b></div>`).join('')}</div></section>
  ${heatmapView()}`;
}
function heatmapView(){
  const end=new Date(); end.setDate(end.getDate()+(6-end.getDay()));
  const start=new Date(end); start.setDate(start.getDate()-90);
  const days=[];
  for(let i=0;i<91;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=localDay(d), list=state.sessions.filter(s=>s.date===key);
    days.push({key,m:list.reduce((a,s)=>a+s.minutes,0),list,day:d.getDate(),month:d.getMonth()+1});
  }
  const months=[];
  days.forEach((d,i)=>{if(d.day<=7&&!months.some(x=>x.month===d.month))months.push({month:d.month,col:Math.floor(i/7)+1})});
  return `<section class="heatmap-card"><div class="heatmap-head"><div><p class="eyebrow">ACTIVITY / 13 WEEKS</p><h2>${tx('学习活跃度','Study activity')}</h2><p>${tx(`近 13 周共学习 ${days.filter(d=>d.m>0).length} 天，点击日期查看记录。`,`${days.filter(d=>d.m>0).length} active days in the last 13 weeks. Select a day for details.`)}</p></div><div class="heatmap-legend"><span>${tx('少','Less')}</span>${[0,1,2,3,4].map(n=>`<i class="level-${n}"></i>`).join('')}<span>≥ 5h</span></div></div><div class="month-row">${months.map(x=>`<span style="grid-column:${x.col}">${isEn()?['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.month]:x.month+'月'}</span>`).join('')}</div><div class="heatmap-wrap"><div class="weekday-labels"><span>${tx('日','S')}</span><span></span><span>${tx('二','T')}</span><span></span><span>${tx('四','T')}</span><span></span><span>${tx('六','S')}</span></div><div class="heatmap" role="grid" aria-label="${tx('近十三周每日学习时长','Daily study time in the last 13 weeks')}">${days.map(d=>`<button class="heat-cell level-${heatLevel(d.m)}" data-day="${d.key}" aria-label="${d.key}，${minsText(d.m)}"></button>`).join('')}</div></div><div id="day-detail" class="day-detail"><span>${tx('选择一个日期','Select a day')}</span><small>${tx('查看当天的学习时长与记录','View study time and sessions')}</small></div></section>`;
}
function heatLevel(m){return m===0?0:m<60?1:m<180?2:m<300?3:4}
function profileView(){return `<section class="profile-hero"><div class="big-avatar">竹</div><h1>${tx('学习者','Learner')}</h1><p>${tx('在自己的节奏里，持续生长。','Keep growing at your own pace.')}</p></section>
  <section class="settings"><button id="language"><span><b>${tx('切换为英文版','Switch to Chinese')}</b><small>${tx('一键将全部界面修改为英文','Change the entire interface to Chinese')}</small></span><i>文</i></button><label><span><b>${tx('主题配色','Theme color')}</b><small>${tx('选择你喜欢的界面颜色','Choose your interface color')}</small></span><select id="theme"><option value="green" ${state.theme==='green'||!state.theme?'selected':''}>${tx('默认绿','Default Green')}</option><option value="bili-pink" ${state.theme==='bili-pink'?'selected':''}>${tx('哔站粉','Bilibili Pink')}</option><option value="youtube-red" ${state.theme==='youtube-red'?'selected':''}>${tx('油管红','YouTube Red')}</option><option value="bili-blue" ${state.theme==='bili-blue'?'selected':''}>${tx('哔站蓝','Bilibili Blue')}</option><option value="apple-white" ${state.theme==='apple-white'?'selected':''}>${tx('苹果白','Apple White')}</option></select></label><label><span><b>${tx('每日目标','Daily goal')}</b><small>${tx('当前','Current')} ${minsText(state.goal)}</small></span><select id="goal">${[120,180,240,300,360].map(n=>`<option value="${n}" ${state.goal===n?'selected':''}>${isEn()?n/60+' hours':n/60+' 小时'}</option>`).join('')}</select></label><button id="export"><span><b>${tx('导出数据','Export data')}</b><small>${tx('保存为 JSON 文件','Save as a JSON file')}</small></span><i>↓</i></button><button id="import"><span><b>${tx('导入备份','Import backup')}</b><small>${tx('检查格式后恢复 JSON 数据','Validate and restore JSON data')}</small></span><i>↑</i></button><input id="import-file" type="file" accept="application/json,.json" hidden><button id="install"><span><b>${tx('安装到手机','Install on phone')}</b><small>${tx('添加到主屏幕，像 App 一样使用','Add to your home screen')}</small></span><i>＋</i></button></section><p class="version">${tx('知时','ZHI SHI')} 1.0 · ${tx('数据仅保存在本机','Data is stored only on this device')}</p>`}
function validateBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error(tx('备份内容必须是 JSON 对象。','The backup must be a JSON object.'));
  if(!Array.isArray(data.sessions))throw new Error(tx('缺少有效的 sessions 学习记录列表。','A valid sessions list is required.'));
  if(!Number.isInteger(data.goal)||data.goal<25||data.goal>1440)throw new Error(tx('每日目标 goal 必须是 25–1440 之间的整数。','The daily goal must be an integer between 25 and 1440.'));
  if(data.language!==undefined&&!['zh','en'].includes(data.language))throw new Error(tx('language 只能是 zh 或 en。','Language must be zh or en.'));
  if(data.theme!==undefined&&!['green','bili-pink','youtube-red','bili-blue','apple-white'].includes(data.theme))throw new Error(tx('备份中的主题配色无效。','The backup contains an invalid theme.'));
  const allowed=Object.keys(subjects), datePattern=/^\d{4}-\d{2}-\d{2}$/, timePattern=/^\d{2}:\d{2}$/;
  const sessions=data.sessions.map((s,index)=>{
    const row=index+1;
    if(!s||typeof s!=='object'||Array.isArray(s))throw new Error(tx(`第 ${row} 条记录不是有效对象。`,`Session ${row} is not a valid object.`));
    if(!allowed.includes(s.subject))throw new Error(tx(`第 ${row} 条记录的科目无效。`,`Session ${row} has an invalid subject.`));
    if(typeof s.title!=='string'||!s.title.trim())throw new Error(tx(`第 ${row} 条记录缺少标题。`,`Session ${row} has no title.`));
    if(s.note!==undefined&&typeof s.note!=='string')throw new Error(tx(`第 ${row} 条记录的笔记格式无效。`,`Session ${row} has an invalid note.`));
    if(!Number.isInteger(s.minutes)||s.minutes<25||s.minutes>720)throw new Error(tx(`第 ${row} 条记录的时长必须为 25–720 分钟。`,`Session ${row} duration must be 25–720 minutes.`));
    if(typeof s.date!=='string'||!datePattern.test(s.date)||Number.isNaN(Date.parse(`${s.date}T00:00:00`)))throw new Error(tx(`第 ${row} 条记录的日期无效。`,`Session ${row} has an invalid date.`));
    if(typeof s.start!=='string'||!timePattern.test(s.start))throw new Error(tx(`第 ${row} 条记录的开始时间无效。`,`Session ${row} has an invalid start time.`));
    return {id:Number.isFinite(Number(s.id))?Number(s.id):Date.now()+index,subject:s.subject,title:s.title.trim(),note:s.note||'',minutes:s.minutes,date:s.date,start:s.start};
  });
  return {goal:data.goal,language:data.language||'zh',theme:data.theme||'green',seedDataRemoved:true,active:null,sessions};
}
function sessionKey(s){return [s.date,s.start,s.subject,s.minutes,s.title.trim(),(s.note||'').trim()].join('\u001f')}
function mergeSessions(current,incoming){
  const unique=new Map();
  [...current,...incoming].forEach(s=>unique.set(sessionKey(s),s));
  return [...unique.values()].sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
}
function empty(a,b){return `<div class="empty"><i>○</i><b>${a}</b><p>${b}</p></div>`}
function streak(){const days=new Set(state.sessions.map(s=>s.date));let n=0,d=new Date();while(days.has(localDay(d))){n++;d.setDate(d.getDate()-1)}return n}

function render(){
  clearInterval(timerTick);
  const views={today:todayView,add:addView,history:historyView,insights:insightsView,profile:profileView};
  $app.innerHTML=shell((views[page]||todayView)()); bind();
}
function bind(){
  document.querySelectorAll('[data-page]').forEach(el=>el.onclick=()=>{page=el.dataset.page;render();scrollTo(0,0)});
  document.querySelectorAll('[data-subject]').forEach(el=>el.onclick=()=>{state.active={subject:el.dataset.subject,startedAt:Date.now()};save();page='today';render()});
  document.querySelector('#finish')?.addEventListener('click',finishSession);
  document.querySelector('#discard')?.addEventListener('click',()=>{if(confirm(tx('确定放弃本次记录吗？','Discard this session?'))){state.active=null;save();page='today';render()}});
  document.querySelectorAll('[data-delete-id]').forEach(button=>button.addEventListener('click',event=>{
    event.stopPropagation();
    const id=Number(button.dataset.deleteId),session=state.sessions.find(item=>item.id===id); if(!session)return;
    if(!confirm(tx(`确定删除“${session.title}”（${minsText(session.minutes)}）吗？此操作无法撤销。`,`Delete “${session.title}” (${minsText(session.minutes)})? This cannot be undone.`)))return;
    state.sessions=state.sessions.filter(item=>item.id!==id); save(); render();
  }));
  document.querySelector('#search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelector('#history-results').innerHTML=state.sessions.filter(s=>(s.title+s.note).toLowerCase().includes(q)).map(sessionCard).join('')||empty(tx('没有找到记录','No records found'),tx('换个关键词试试。','Try another keyword.'))});
  document.querySelector('#goal')?.addEventListener('change',e=>{state.goal=Number(e.target.value);save()});
  document.querySelector('#theme')?.addEventListener('change',e=>{state.theme=e.target.value;applyTheme();save()});
  document.querySelector('#language')?.addEventListener('click',()=>{state.language=isEn()?'zh':'en';save();document.documentElement.lang=isEn()?'en':'zh-CN';render()});
  document.querySelector('#export')?.addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download=isEn()?'zhishi-study-records.json':'知时学习记录.json';a.click()});
  document.querySelector('#import')?.addEventListener('click',()=>document.querySelector('#import-file').click());
  document.querySelector('#import-file')?.addEventListener('change',async event=>{
    const input=event.target,file=input.files?.[0]; if(!file)return;
    try{
      if(file.size>10*1024*1024)throw new Error(tx('备份文件不能超过 10 MB。','The backup file cannot exceed 10 MB.'));
      let raw;
      try{raw=JSON.parse(await file.text())}catch{throw new Error(tx('文件不是有效的 JSON 格式。','The file is not valid JSON.'))}
      const backup=validateBackup(raw);
      const choice=prompt(tx(`格式检查通过，共 ${backup.sessions.length} 条记录。\n输入 1：合并并自动去重\n输入 2：覆盖现有数据\n其他内容：取消`,`Validation passed: ${backup.sessions.length} sessions.\nEnter 1: Merge and remove duplicates\nEnter 2: Replace existing data\nAnything else: Cancel`));
      if(choice!=='1'&&choice!=='2')return;
      if(choice==='2'&&!confirm(tx('覆盖后当前数据将被替换，确定继续吗？','Your current data will be replaced. Continue?')))return;
      const sessions=choice==='1'?mergeSessions(state.sessions,backup.sessions):mergeSessions([],backup.sessions);
      const removed=choice==='1'?state.sessions.length+backup.sessions.length-sessions.length:backup.sessions.length-sessions.length;
      Object.assign(state,{goal:backup.goal,language:backup.language,theme:backup.theme,active:null,sessions});
      save(); document.documentElement.lang=isEn()?'en':'zh-CN'; applyTheme(); render();
      alert(tx(`导入完成，共保留 ${sessions.length} 条记录，排除 ${removed} 条重复记录。`,`Import complete. ${sessions.length} sessions kept and ${removed} duplicates removed.`));
    }catch(error){alert(tx('无法导入：','Import failed: ')+error.message)}finally{input.value=''}
  });
  document.querySelector('#install')?.addEventListener('click',async()=>{
    if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return}
    alert(tx('请确认正在使用 HTTPS 地址。Android Chrome：点右上角 ⋮ → 添加到主屏幕 → 安装。','Make sure this page uses HTTPS. In Android Chrome, tap ⋮ → Add to Home screen → Install.'));
  });
  document.querySelectorAll('[data-day]').forEach(el=>el.addEventListener('click',()=>{
    document.querySelectorAll('[data-day]').forEach(cell=>cell.classList.remove('selected'));
    el.classList.add('selected');
    const list=state.sessions.filter(s=>s.date===el.dataset.day), total=list.reduce((a,s)=>a+s.minutes,0);
    document.querySelector('#day-detail').innerHTML=`<span><b>${el.dataset.day}</b><strong>${minsText(total)}</strong></span>${list.length?`<div>${list.map(s=>`<small>${subjectName(s.subject)} · ${escapeHtml(s.title)} · ${minsText(s.minutes)}</small>`).join('')}</div>`:`<small>${tx('这一天还没有学习记录','No study records on this day')}</small>`}`;
  }));
}
function confirmShortSession(elapsed){
  return new Promise(resolve=>{
    const overlay=document.createElement('div'); overlay.className='confirm-overlay';
    overlay.innerHTML=`<section class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="short-title"><p class="eyebrow">${tx('时长不足 25 分钟','UNDER 25 MINUTES')}</p><h2 id="short-title">${tx('确定要结束吗？','Finish this session?')}</h2><p>${tx(`目前只学习了 ${elapsed} 分钟，结束后不会保存这次记录。`,`You have studied for ${elapsed} minutes. This session will not be recorded if you finish now.`)}</p><div><button class="confirm-no">No</button><button class="confirm-yes">Yes</button></div></section>`;
    const close=result=>{document.removeEventListener('keydown',onKey);overlay.remove();resolve(result)};
    const onKey=event=>{if(event.key==='Escape'||event.key==='Backspace')close(false)};
    overlay.addEventListener('click',event=>{if(event.target===overlay)close(false)});
    overlay.querySelector('.confirm-no').onclick=()=>close(false);
    overlay.querySelector('.confirm-yes').onclick=()=>close(true);
    document.addEventListener('keydown',onKey); document.body.appendChild(overlay); overlay.querySelector('.confirm-no').focus();
  });
}
async function finishSession(){
  const elapsed=Math.max(1,Math.round((Date.now()-state.active.startedAt)/60000));
  if(elapsed < 25){
    if(!await confirmShortSession(elapsed))return;
    state.active=null;
    save();
    page='today';
    render();
    return;
  }
  const title=prompt(tx('这次学了什么？请输入记录标题：','What did you study? Enter a title:')); if(!title)return;
  const note=prompt(tx('写下一点收获（可选）：','Add a note or takeaway (optional):'))||'';
  const d=new Date(state.active.startedAt);
  state.sessions.unshift({id:Date.now(),subject:state.active.subject,title,note,minutes:elapsed,date:localDay(d),start:d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})});
  state.active=null;save();page='today';render();
}
applyTheme(); render();
document.documentElement.lang=isEn()?'en':'zh-CN';
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
