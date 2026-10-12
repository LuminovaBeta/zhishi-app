const defaultCategories = [
  {id:'math',name:'数学',color:'#d8ed62'},
  {id:'english',name:'英语',color:'#9ccde8'},
  {id:'major',name:'专业课',color:'#efad7f'},
  {id:'training',name:'政治',color:'#c7afd9'}
];
const legacyCategoryIcons={math:'∑',english:'Aa',major:'◇',training:'政'};
const categoryPresetColors=[
  ['蓝色','Blue','#4F7CFF'],['青色','Teal','#2BB8A9'],['绿色','Green','#43A047'],['黄色','Yellow','#F2B84B'],['橙色','Orange','#F28C45'],
  ['红色','Red','#E85D5D'],['粉色','Pink','#E46FA3'],['紫色','Purple','#8B6FD6'],['靛蓝','Indigo','#5C6BC0'],['灰色','Gray','#8A8F98']
];
const $app = document.querySelector('#app');
const state = JSON.parse(localStorage.getItem('zhishi-state') || 'null') || seed();
let localProfile = JSON.parse(localStorage.getItem('zhishi-profile') || 'null') || {name:'',avatar:''};
if(!state.seedDataRemoved){
  const seedIds=new Set([1,2,3,4,5]);
  state.sessions=(state.sessions||[]).filter(session=>!seedIds.has(session.id));
  state.seedDataRemoved=true;
  localStorage.setItem('zhishi-state',JSON.stringify(state));
}
if(!Array.isArray(state.categories))state.categories=defaultCategories.map(category=>({...category}));
state.sessions=(state.sessions||[]).map(session=>({...session,subject:state.categories.some(category=>category.id===session.subject)?session.subject:null}));
if(state.active&&!state.categories.some(category=>category.id===state.active.subject))state.active.subject=null;
localStorage.setItem('zhishi-state',JSON.stringify(state));
let page = 'today';
let timerTick;
let installPrompt = null;
window.addEventListener('beforeinstallprompt', event=>{event.preventDefault();installPrompt=event});

if(state.active){
  state.active.status=state.active.status==='paused'?'paused':'running';
  state.active.accumulatedMs=Math.max(0,Number(state.active.accumulatedMs)||0);
  state.active.segmentStartedAt=state.active.status==='running'?(Number(state.active.segmentStartedAt)||Number(state.active.startedAt)||Date.now()):null;
  state.active.pausedAt=state.active.status==='paused'?(Number(state.active.pausedAt)||Date.now()):null;
}

function seed() {
  return {
    goal: 300, language: 'zh', theme: 'green', seedDataRemoved: true,
    active: null, categories: defaultCategories.map(category=>({...category})),
    sessions: []
  };
}
function save() { localStorage.setItem('zhishi-state', JSON.stringify(state)); }
function isEn(){return state.language==='en'}
function tx(zh,en){return isEn()?en:zh}
function categoryById(id){return state.categories.find(category=>category.id===id)}
function subjectName(id){return categoryById(id)?.name||tx('未分类','Uncategorized')}
function categoryColor(id){return categoryById(id)?.color||'#d9ddd8'}
function categoryIcon(id){const category=categoryById(id);return legacyCategoryIcons[id]||category?.name.trim().slice(0,1).toUpperCase()||'—'}
function applyTheme(){document.documentElement.dataset.theme=state.theme||'green'}
function profileName(){return localProfile.name||tx('学习者','Learner')}
function avatarMarkup(className=''){return localProfile.avatar?`<img class="${className}" src="${localProfile.avatar}" alt="${tx('本地头像','Local avatar')}">`:`<span class="${className}">${escapeHtml((localProfile.name||'竹').trim().slice(0,1).toUpperCase())}</span>`}
function localDay(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(date); }
function minsText(m) { return isEn()?(m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m} min`):(m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`); }
function todaySessions() { return state.sessions.filter(s => s.date === localDay()); }
function todayMinutes() { return todaySessions().reduce((sum, s) => sum + s.minutes, 0); }
function escapeHtml(s='') { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function activeElapsedMs(now=Date.now()){
  if(!state.active)return 0;
  const current=state.active.status==='running'?Math.max(0,now-state.active.segmentStartedAt):0;
  return Math.max(0,state.active.accumulatedMs+current);
}
function activeElapsedMinutes(){return Math.max(1,Math.round(activeElapsedMs()/60000))}
async function exportData(button){
  const data=JSON.stringify(state,null,2),native=window.Capacitor?.isNativePlatform?.();
  button.disabled=true;button.setAttribute('aria-busy','true');
  try{
    if(native){
      const {Filesystem,Share}=window.Capacitor.Plugins||{};
      if(!Filesystem||!Share)throw new Error('Native export plugins are unavailable');
      const file=await Filesystem.writeFile({path:'zhishi-study-records.json',directory:'CACHE',encoding:'utf8',data});
      await Share.share({title:tx('导出学习记录','Export study records'),text:tx('知时学习记录备份','ZHI SHI study records backup'),files:[file.uri],dialogTitle:tx('保存或分享备份','Save or share backup')});
      return;
    }
    const url=URL.createObjectURL(new Blob([data],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download=isEn()?'zhishi-study-records.json':'知时学习记录.json';
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){
    console.error('Export failed',error);
    alert(tx('导出失败，请稍后重试。','Export failed. Please try again.'));
  }finally{
    button.disabled=false;button.removeAttribute('aria-busy');
  }
}

function shell(content) {
  return `<div class="phone-shell">
    <header class="topbar"><div class="wordmark"><span>${tx('知时','ZHI SHI')}</span><small>LEARNING LOG</small></div><button class="avatar" data-edit-profile aria-label="${tx('编辑本地资料','Edit local profile')}">${avatarMarkup()}</button></header>
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
  const paused=state.active.status==='paused';
  return `<section class="active-card ${paused?'is-paused':''}"><div><p class="eyebrow">${paused?tx('已暂停','PAUSED'):tx('正在学习','STUDYING')} · ${escapeHtml(subjectName(state.active.subject))}</p><h2 id="timer">${paused?tx('休息一下，再继续','Take a breath'):tx('专注进行中','Focus in progress')}</h2><small>${paused?tx('暂停时间不会计入学习时长','Paused time is not counted'):tx('计时已隐藏，结束后才会显示时长','Duration stays hidden until you finish')}</small></div><div class="active-actions"><button id="toggle-pause" class="pause-button">${paused?tx('继续','Resume'):tx('暂停','Pause')}</button><button id="finish">${tx('完成','Finish')}</button></div></section>`;
}
function addView() {
  if (state.active) return `<section class="page-title"><p class="eyebrow">FOCUS MODE</p><h1>${tx('保持专注','Stay focused')}</h1><p>${tx('时间正在安静地积累。','Your focused time is quietly adding up.')}</p></section>${activeCard()}<button class="danger-link" id="discard">${tx('放弃本次记录','Discard session')}</button>`;
  return `<section class="page-title"><p class="eyebrow">NEW SESSION</p><h1>${tx('现在学什么？','What will you study?')}</h1><p>${tx('选择一个方向，计时会立即开始。','Choose a subject to start timing.')}</p></section>
  <div class="subject-grid"><button class="subject-card" data-subject="" style="--tone:#d9ddd8"><i>—</i><b>${tx('未分类','Uncategorized')}</b><small>${tx('开始专注','Start focus')} →</small></button>${state.categories.map(category=>`<button class="subject-card" data-subject="${category.id}" style="--tone:${category.color}"><i>${escapeHtml(categoryIcon(category.id))}</i><b>${escapeHtml(category.name)}</b><small>${tx('开始专注','Start focus')} →</small></button>`).join('')}</div>
  <aside class="soft-note"><i>◎</i><p><b>${tx('专注计时','Focus timer')}</b><br>${tx('进行中不会展示时长，帮你把注意力留在学习本身。','The timer stays hidden so your attention remains on learning.')}</p></aside>`;
}
function historyView() {
  const groups = Object.groupBy ? Object.groupBy(state.sessions, s=>s.date) : state.sessions.reduce((a,s)=>((a[s.date]??=[]).push(s),a),{});
  return `<section class="page-title compact"><p class="eyebrow">ARCHIVE</p><h1>${tx('学习记录','Study records')}</h1><p>${tx('共','Total')} ${state.sessions.length} ${tx('次专注','sessions')} · ${minsText(state.sessions.reduce((a,s)=>a+s.minutes,0))}</p></section>
  <label class="search"><span>⌕</span><input id="search" placeholder="${tx('搜索标题或笔记','Search titles or notes')}" /></label>
  <div id="history-results">${Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).map(([date,items])=>`<section class="date-group"><header><b>${date===localDay()?tx('今天','Today'):date}</b><span>${minsText(items.reduce((a,s)=>a+s.minutes,0))}</span></header>${items.map(sessionCard).join('')}</section>`).join('')}</div>`;
}
function sessionCard(s) { return `<article class="session" data-id="${s.id}" tabindex="0" aria-label="${tx('查看记录','View record')}：${escapeHtml(s.title)}"><i style="--tone:${categoryColor(s.subject)}">${escapeHtml(categoryIcon(s.subject))}</i><div><b>${escapeHtml(s.title)}</b><small>${s.start} · ${escapeHtml(subjectName(s.subject))}</small></div><span class="session-actions"><strong>${minsText(s.minutes)}</strong><button class="view-session" data-view-id="${s.id}">${tx('查看','View')}</button><button class="edit-session" data-edit-id="${s.id}">${tx('编辑','Edit')}</button><button class="delete-session" data-delete-id="${s.id}" aria-label="${tx('删除记录','Delete record')}">×</button></span></article>`; }
function insightsView() {
  const last7 = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=localDay(d);return {key,label:(isEn()?['S','M','T','W','T','F','S']:'日一二三四五六')[d.getDay()],m:state.sessions.filter(s=>s.date===key).reduce((a,s)=>a+s.minutes,0)}});
  const max=Math.max(60,...last7.map(x=>x.m));
  const totals=[...state.categories.map(category=>({id:category.id,name:category.name,color:category.color})),{id:null,name:tx('未分类','Uncategorized'),color:'#d9ddd8'}].map(category=>({...category,m:state.sessions.filter(s=>s.subject===category.id).reduce((a,s)=>a+s.minutes,0)}));
  return `<section class="page-title compact"><p class="eyebrow">INSIGHTS</p><h1>${tx('学习趋势','Study trends')}</h1><p>${tx('理解时间如何被使用。','See how your time is being used.')}</p></section>
  <section class="stat-row"><div><small>${tx('本周学习','This week')}</small><b>${minsText(last7.reduce((a,x)=>a+x.m,0))}</b></div><div><small>${tx('连续学习','Study streak')}</small><b>${streak()} ${tx('天','days')}</b></div></section>
  <section class="chart-card"><div class="section-head"><div><p class="eyebrow">LAST 7 DAYS</p><h2>${tx('一周节奏','Weekly rhythm')}</h2></div></div><div class="bars">${last7.map(x=>`<div><span>${x.m?Math.round(x.m/60*10)/10:''}</span><i style="height:${Math.max(6,x.m/max*140)}px"></i><small>${x.label}</small></div>`).join('')}</div></section>
  <section class="chart-card"><p class="eyebrow">SUBJECTS</p><h2>${tx('分类分布','Category breakdown')}</h2><div class="subject-totals">${totals.map(x=>`<div><span><i style="background:${x.color}"></i>${escapeHtml(x.name)}</span><b>${minsText(x.m)}</b></div>`).join('')}</div></section>
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
function profileView(){return `<section class="profile-hero"><div class="big-avatar">${avatarMarkup()}</div><h1>${escapeHtml(profileName())}</h1><p>${tx('在自己的节奏里，持续生长。','Keep growing at your own pace.')}</p></section>
  <section class="settings"><button id="language"><span><b>${tx('切换为英文版','Switch to Chinese')}</b><small>${tx('一键将全部界面修改为英文','Change the entire interface to Chinese')}</small></span><i>文</i></button><button id="manage-categories"><span><b>${tx('分类管理','Category management')}</b><small>${tx(`新增、编辑或删除分类 · 当前 ${state.categories.length} 个`,`Add, edit, or delete · ${state.categories.length} total`)}</small></span><i>›</i></button><label><span><b>${tx('主题配色','Theme color')}</b><small>${tx('选择你喜欢的界面颜色','Choose your interface color')}</small></span><select id="theme"><option value="green" ${state.theme==='green'||!state.theme?'selected':''}>${tx('默认绿','Default Green')}</option><option value="bili-pink" ${state.theme==='bili-pink'?'selected':''}>${tx('哔站粉','Bilibili Pink')}</option><option value="youtube-red" ${state.theme==='youtube-red'?'selected':''}>${tx('油管红','YouTube Red')}</option><option value="bili-blue" ${state.theme==='bili-blue'?'selected':''}>${tx('哔站蓝','Bilibili Blue')}</option><option value="warm-orange" ${state.theme==='warm-orange'?'selected':''}>${tx('暖橙','Warm Orange')}</option><option value="apple-white" ${state.theme==='apple-white'?'selected':''}>${tx('苹果白','Apple White')}</option></select></label><label><span><b>${tx('每日目标','Daily goal')}</b><small>${tx('当前','Current')} ${minsText(state.goal)}</small></span><select id="goal">${[120,180,240,300,360].map(n=>`<option value="${n}" ${state.goal===n?'selected':''}>${isEn()?n/60+' hours':n/60+' 小时'}</option>`).join('')}</select></label><button id="export"><span><b>${tx('导出数据','Export data')}</b><small>${tx('保存为 JSON 文件','Save as a JSON file')}</small></span><i>↓</i></button><button id="import"><span><b>${tx('导入备份','Import backup')}</b><small>${tx('检查格式后恢复 JSON 数据','Validate and restore JSON data')}</small></span><i>↑</i></button><input id="import-file" type="file" accept="application/json,.json" hidden><button id="install"><span><b>${tx('安装到手机','Install on phone')}</b><small>${tx('添加到主屏幕，像 App 一样使用','Add to your home screen')}</small></span><i>＋</i></button></section><p class="version">${tx('知时','ZHI SHI')} 1.0 · ${tx('数据仅保存在本机','Data is stored only on this device')}</p>`}
function validateBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error(tx('备份内容必须是 JSON 对象。','The backup must be a JSON object.'));
  if(!Array.isArray(data.sessions))throw new Error(tx('缺少有效的 sessions 学习记录列表。','A valid sessions list is required.'));
  if(!Number.isInteger(data.goal)||data.goal<25||data.goal>1440)throw new Error(tx('每日目标 goal 必须是 25–1440 之间的整数。','The daily goal must be an integer between 25 and 1440.'));
  if(data.language!==undefined&&!['zh','en'].includes(data.language))throw new Error(tx('language 只能是 zh 或 en。','Language must be zh or en.'));
  if(data.theme!==undefined&&!['green','bili-pink','youtube-red','bili-blue','warm-orange','apple-white'].includes(data.theme))throw new Error(tx('备份中的主题配色无效。','The backup contains an invalid theme.'));
  const categoryRows=data.categories===undefined?defaultCategories:data.categories;
  if(!Array.isArray(categoryRows))throw new Error(tx('categories 必须是有效的分类列表。','Categories must be a valid list.'));
  const categoryIds=new Set();
  const categories=categoryRows.map((category,index)=>{
    if(!category||typeof category!=='object'||Array.isArray(category))throw new Error(tx(`第 ${index+1} 个分类无效。`,`Category ${index+1} is invalid.`));
    const id=String(category.id||''),name=String(category.name||'').trim(),color=String(category.color||'');
    if(!/^[a-z0-9_-]{1,64}$/i.test(id)||categoryIds.has(id)||!name||name.length>24||!/^#[0-9a-f]{6}$/i.test(color))throw new Error(tx(`第 ${index+1} 个分类的名称或颜色无效。`,`Category ${index+1} has an invalid name or color.`));
    categoryIds.add(id);return {id,name,color};
  });
  const datePattern=/^\d{4}-\d{2}-\d{2}$/, timePattern=/^\d{2}:\d{2}$/;
  const sessions=data.sessions.map((s,index)=>{
    const row=index+1;
    if(!s||typeof s!=='object'||Array.isArray(s))throw new Error(tx(`第 ${row} 条记录不是有效对象。`,`Session ${row} is not a valid object.`));
    if(typeof s.title!=='string'||!s.title.trim())throw new Error(tx(`第 ${row} 条记录缺少标题。`,`Session ${row} has no title.`));
    if(s.note!==undefined&&typeof s.note!=='string')throw new Error(tx(`第 ${row} 条记录的笔记格式无效。`,`Session ${row} has an invalid note.`));
    if(!Number.isInteger(s.minutes)||s.minutes<1||s.minutes>720)throw new Error(tx(`第 ${row} 条记录的时长必须为 1–720 分钟。`,`Session ${row} duration must be 1–720 minutes.`));
    if(typeof s.date!=='string'||!datePattern.test(s.date)||Number.isNaN(Date.parse(`${s.date}T00:00:00`)))throw new Error(tx(`第 ${row} 条记录的日期无效。`,`Session ${row} has an invalid date.`));
    if(typeof s.start!=='string'||!timePattern.test(s.start))throw new Error(tx(`第 ${row} 条记录的开始时间无效。`,`Session ${row} has an invalid start time.`));
    return {id:Number.isFinite(Number(s.id))?Number(s.id):Date.now()+index,subject:categoryIds.has(s.subject)?s.subject:null,title:s.title.trim(),note:s.note||'',minutes:s.minutes,date:s.date,start:s.start,...(Number.isFinite(Number(s.createdAt))?{createdAt:Number(s.createdAt)}:{}),...(Number.isFinite(Number(s.updatedAt))?{updatedAt:Number(s.updatedAt)}:{})};
  });
  return {goal:data.goal,language:data.language||'zh',theme:data.theme||'green',seedDataRemoved:true,active:null,categories,sessions};
}
function sessionKey(s){return [s.date,s.start,s.subject,s.minutes,s.title.trim(),(s.note||'').trim()].join('\u001f')}
function mergeSessions(current,incoming){
  const unique=new Map();
  [...current,...incoming].forEach(s=>unique.set(sessionKey(s),s));
  return [...unique.values()].sort((a,b)=>`${b.date} ${b.start}`.localeCompare(`${a.date} ${a.start}`));
}
function mergeCategories(current,incoming){
  const merged=new Map(current.map(category=>[category.id,category]));
  incoming.forEach(category=>{if(!merged.has(category.id))merged.set(category.id,category)});
  return [...merged.values()];
}
function compressAvatar(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/'))return reject(new Error(tx('请选择图片文件。','Please select an image file.')));
    if(file.size>8*1024*1024)return reject(new Error(tx('头像图片不能超过 8 MB。','The avatar image cannot exceed 8 MB.')));
    const image=new Image(),url=URL.createObjectURL(file);
    image.onload=()=>{const size=256,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');const side=Math.min(image.width,image.height),sx=(image.width-side)/2,sy=(image.height-side)/2;ctx.drawImage(image,sx,sy,side,side,0,0,size,size);URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/jpeg',.82))};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error(tx('无法读取这张图片。','Unable to read this image.')))};image.src=url;
  });
}
function openProfileEditor(){
  const overlay=document.createElement('div');overlay.className='confirm-overlay profile-editor';
  overlay.innerHTML=`<section class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="profile-title"><p class="eyebrow">LOCAL PROFILE</p><h2 id="profile-title">${tx('编辑用户名和头像','Edit name and avatar')}</h2><div class="profile-preview">${avatarMarkup()}</div><label><span>${tx('用户名','Display name')}</span><input id="profile-name" maxlength="24" value="${escapeHtml(localProfile.name)}" placeholder="${tx('学习者','Learner')}"></label><label class="avatar-file"><span>${tx('选择头像','Choose avatar')}</span><input id="profile-avatar" type="file" accept="image/*"></label><button class="remove-avatar" type="button">${tx('移除头像','Remove avatar')}</button><small>${tx('资料仅保存在本机，不会包含在备份中。','Profile stays on this device and is excluded from backups.')}</small><div class="profile-buttons"><button class="profile-cancel">${tx('取消','Cancel')}</button><button class="profile-save">${tx('保存','Save')}</button></div></section>`;
  let pendingAvatar=localProfile.avatar;
  const close=()=>overlay.remove();
  overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  overlay.querySelector('.profile-cancel').onclick=close;
  overlay.querySelector('.remove-avatar').onclick=()=>{pendingAvatar='';overlay.querySelector('.profile-preview').innerHTML='<span>竹</span>'};
  overlay.querySelector('#profile-avatar').onchange=async event=>{try{const file=event.target.files?.[0];if(!file)return;pendingAvatar=await compressAvatar(file);overlay.querySelector('.profile-preview').innerHTML=`<img src="${pendingAvatar}" alt="">`}catch(error){alert(error.message)}};
  overlay.querySelector('.profile-save').onclick=()=>{const name=overlay.querySelector('#profile-name').value.trim();localProfile={name,avatar:pendingAvatar};localStorage.setItem('zhishi-profile',JSON.stringify(localProfile));close();render()};
  document.body.appendChild(overlay);overlay.querySelector('#profile-name').focus();
}
function openCategoryManager(){
  const overlay=document.createElement('div');overlay.className='confirm-overlay category-manager-overlay';
  const rows=state.categories.map(category=>`<div class="category-row"><i style="--category-color:${category.color}"></i><b>${escapeHtml(category.name)}</b><button type="button" data-category-edit="${category.id}">${tx('编辑','Edit')}</button><button class="category-delete" type="button" data-category-delete="${category.id}" aria-label="${tx('删除分类','Delete category')}">×</button></div>`).join('');
  overlay.innerHTML=`<section class="confirm-box category-manager" role="dialog" aria-modal="true" aria-labelledby="category-manager-title"><p class="eyebrow">${tx('设置','SETTINGS')}</p><h2 id="category-manager-title">${tx('分类管理','Category management')}</h2><p>${tx('分类只包含名称和颜色，删除后历史记录会保留为“未分类”。','Categories have a name and color. Deleted categories become uncategorized in past records.')}</p><div class="category-list">${rows||`<p>${tx('还没有分类','No categories yet')}</p>`}</div><button class="category-add" type="button">＋ ${tx('新增分类','Add category')}</button><button class="category-close" type="button">${tx('关闭','Close')}</button></section>`;
  const close=()=>overlay.remove();overlay.addEventListener('click',event=>{if(event.target===overlay)close()});overlay.querySelector('.category-close').onclick=close;
  overlay.querySelector('.category-add').onclick=()=>{close();openCategoryEditor()};
  overlay.querySelectorAll('[data-category-edit]').forEach(button=>button.onclick=()=>{const category=categoryById(button.dataset.categoryEdit);close();if(category)openCategoryEditor(category)});
  overlay.querySelectorAll('[data-category-delete]').forEach(button=>button.onclick=()=>{
    const category=categoryById(button.dataset.categoryDelete);if(!category)return;
    if(!confirm(tx(`确定删除分类“${category.name}”吗？历史记录将保留并改为“未分类”。`,`Delete “${category.name}”? Past records will be kept as uncategorized.`)))return;
    state.categories=state.categories.filter(item=>item.id!==category.id);state.sessions.forEach(session=>{if(session.subject===category.id)session.subject=null});if(state.active?.subject===category.id)state.active.subject=null;save();close();render();openCategoryManager();
  });
  document.body.appendChild(overlay);overlay.querySelector('.category-add').focus();
}
function openCategoryEditor(category=null){
  const overlay=document.createElement('div');overlay.className='confirm-overlay category-editor-overlay';
  const selectedColor=(category?.color||'#4F7CFF').toUpperCase();
  const presets=categoryPresetColors.map(([zh,en,color])=>`<button class="color-preset ${selectedColor===color?'selected':''}" type="button" data-color="${color}" title="${tx(zh,en)} ${color}" aria-label="${tx(zh,en)} ${color}" style="--preset-color:${color}"></button>`).join('');
  overlay.innerHTML=`<section class="confirm-box category-editor" role="dialog" aria-modal="true" aria-labelledby="category-editor-title"><p class="eyebrow">${category?tx('编辑分类','EDIT CATEGORY'):tx('新增分类','NEW CATEGORY')}</p><h2 id="category-editor-title">${category?tx('修改分类','Update category'):tx('创建分类','Create category')}</h2><form><label><span>${tx('名称','Name')}</span><input name="name" maxlength="24" required value="${escapeHtml(category?.name||'')}" placeholder="${tx('例如：物理','For example: Physics')}"></label><fieldset><legend>${tx('预设颜色','Preset colors')}</legend><div class="color-presets">${presets}</div></fieldset><label><span>${tx('自定义颜色','Custom color')}</span><input name="color" type="color" value="${selectedColor}"></label><p class="form-error" aria-live="polite"></p><div class="category-form-buttons"><button class="category-cancel" type="button">${tx('取消','Cancel')}</button><button class="category-save" type="submit">${tx('保存','Save')}</button></div></form></section>`;
  const close=()=>overlay.remove();overlay.addEventListener('click',event=>{if(event.target===overlay)close()});overlay.querySelector('.category-cancel').onclick=()=>{close();openCategoryManager()};
  const colorInput=overlay.querySelector('[name="color"]'),syncPreset=()=>{overlay.querySelectorAll('.color-preset').forEach(button=>button.classList.toggle('selected',button.dataset.color.toLowerCase()===colorInput.value.toLowerCase()))};
  overlay.querySelectorAll('.color-preset').forEach(button=>button.onclick=()=>{colorInput.value=button.dataset.color;syncPreset()});colorInput.oninput=syncPreset;
  overlay.querySelector('form').onsubmit=event=>{event.preventDefault();const form=new FormData(event.currentTarget),name=String(form.get('name')||'').trim(),color=String(form.get('color')||''),error=overlay.querySelector('.form-error');if(!name){error.textContent=tx('请输入分类名称。','Enter a category name.');return}if(state.categories.some(item=>item.id!==category?.id&&item.name.toLowerCase()===name.toLowerCase())){error.textContent=tx('分类名称不能重复。','Category names must be unique.');return}if(category){category.name=name;category.color=color}else{state.categories.push({id:`category-${Date.now().toString(36)}`,name,color})}save();close();render();openCategoryManager()};
  document.body.appendChild(overlay);overlay.querySelector('[name="name"]').focus();
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
  document.querySelectorAll('[data-edit-profile]').forEach(el=>el.onclick=openProfileEditor);
  document.querySelectorAll('[data-subject]').forEach(el=>el.onclick=()=>{const now=Date.now(),subject=el.dataset.subject||null;state.active={subject,startedAt:now,status:'running',segmentStartedAt:now,accumulatedMs:0,pausedAt:null};save();page='today';render()});
  document.querySelector('#toggle-pause')?.addEventListener('click',togglePause);
  document.querySelector('#finish')?.addEventListener('click',finishSession);
  document.querySelector('#discard')?.addEventListener('click',()=>{if(confirm(tx('确定放弃本次记录吗？','Discard this session?'))){state.active=null;save();page='today';render()}});
  bindSessionDeletion();
  document.querySelector('#search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelector('#history-results').innerHTML=state.sessions.filter(s=>(s.title+s.note).toLowerCase().includes(q)).map(sessionCard).join('')||empty(tx('没有找到记录','No records found'),tx('换个关键词试试。','Try another keyword.'))});
  document.querySelector('#goal')?.addEventListener('change',e=>{state.goal=Number(e.target.value);save()});
  document.querySelector('#theme')?.addEventListener('change',e=>{state.theme=e.target.value;applyTheme();save()});
  document.querySelector('#language')?.addEventListener('click',()=>{state.language=isEn()?'zh':'en';save();document.documentElement.lang=isEn()?'en':'zh-CN';render()});
  document.querySelector('#manage-categories')?.addEventListener('click',openCategoryManager);
  document.querySelector('#export')?.addEventListener('click',event=>exportData(event.currentTarget));
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
      const categories=choice==='1'?mergeCategories(state.categories,backup.categories):backup.categories;
      sessions.forEach(session=>{if(!categories.some(category=>category.id===session.subject))session.subject=null});
      Object.assign(state,{goal:backup.goal,language:backup.language,theme:backup.theme,active:null,categories,sessions});
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
    document.querySelector('#day-detail').innerHTML=`<span><b>${el.dataset.day}</b><strong>${minsText(total)}</strong></span>${list.length?`<div>${list.map(s=>`<small>${escapeHtml(subjectName(s.subject))} · ${escapeHtml(s.title)} · ${minsText(s.minutes)}</small>`).join('')}</div>`:`<small>${tx('这一天还没有学习记录','No study records on this day')}</small>`}`;
  }));
}
function bindSessionDeletion(){
  let press=null,ignoreNextClick=false;
  const cancelPress=()=>{if(press?.timer)clearTimeout(press.timer);press=null};
  const reveal=session=>{
    document.querySelectorAll('.session.delete-enabled').forEach(item=>item.classList.remove('delete-enabled'));
    session.classList.add('delete-enabled');
    session.querySelector('.view-session')?.focus({preventScroll:true});
  };
  $app.onpointerdown=event=>{
    const session=event.target.closest('.session');
    if(!session||event.target.closest('.view-session, .edit-session, .delete-session')||event.button!==0)return;
    cancelPress();
    press={x:event.clientX,y:event.clientY,timer:setTimeout(()=>{reveal(session);ignoreNextClick=true;press=null},550)};
  };
  $app.onpointermove=event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)cancelPress()};
  $app.onpointerup=cancelPress;
  $app.onpointercancel=cancelPress;
  $app.oncontextmenu=event=>{
    const session=event.target.closest('.session');
    if(!session)return;
    event.preventDefault();cancelPress();reveal(session);ignoreNextClick=true;
  };
  $app.onclick=event=>{
    const viewButton=event.target.closest('.view-session');
    if(viewButton){
      event.stopPropagation();
      const session=state.sessions.find(item=>item.id===Number(viewButton.dataset.viewId));
      if(session)openSessionDetail(session);
      return;
    }
    const editButton=event.target.closest('.edit-session');
    if(editButton){
      event.stopPropagation();
      const session=state.sessions.find(item=>item.id===Number(editButton.dataset.editId));
      if(session)openSessionEditor(session);
      return;
    }
    const button=event.target.closest('.delete-session');
    if(button){
      event.stopPropagation();
      const id=Number(button.dataset.deleteId),session=state.sessions.find(item=>item.id===id); if(!session)return;
      if(!confirm(tx(`确定删除“${session.title}”（${minsText(session.minutes)}）吗？此操作无法撤销。`,`Delete “${session.title}” (${minsText(session.minutes)})? This cannot be undone.`)))return;
      state.sessions=state.sessions.filter(item=>item.id!==id);save();render();return;
    }
    if(ignoreNextClick){ignoreNextClick=false;return}
    const sessionEl=event.target.closest('.session');
    if(sessionEl){const session=state.sessions.find(item=>item.id===Number(sessionEl.dataset.id));if(session)openSessionDetail(session);return}
    document.querySelectorAll('.session.delete-enabled').forEach(item=>item.classList.remove('delete-enabled'));
  };
  $app.onkeydown=event=>{
    const sessionEl=event.target.closest('.session');
    if(sessionEl&&(event.key==='Enter'||event.key===' ')){event.preventDefault();const session=state.sessions.find(item=>item.id===Number(sessionEl.dataset.id));if(session)openSessionDetail(session)}
  };
}
function openSessionDetail(session){
  const overlay=document.createElement('div'); overlay.className='confirm-overlay session-detail-overlay';
  const note=session.note?.trim();
  overlay.innerHTML=`<section class="confirm-box session-detail" role="dialog" aria-modal="true" aria-labelledby="session-detail-title"><p class="eyebrow">${tx('学习详情','SESSION DETAIL')}</p><h2 id="session-detail-title">${escapeHtml(session.title)}</h2><dl><div><dt>${tx('分类','Category')}</dt><dd>${escapeHtml(subjectName(session.subject))}</dd></div><div><dt>${tx('日期','Date')}</dt><dd>${escapeHtml(session.date)}</dd></div><div><dt>${tx('开始时间','Start time')}</dt><dd>${escapeHtml(session.start)}</dd></div><div><dt>${tx('学习时长','Duration')}</dt><dd>${minsText(session.minutes)}</dd></div></dl><div class="session-detail-note"><b>${tx('学习笔记','Study note')}</b><p>${note?escapeHtml(note):tx('未填写笔记','No note added')}</p></div><button class="session-detail-close" type="button">${tx('关闭','Close')}</button></section>`;
  const close=()=>{document.removeEventListener('keydown',onKey);overlay.remove()};
  const onKey=event=>{if(event.key==='Escape')close()};
  overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  overlay.querySelector('.session-detail-close').onclick=close;
  document.addEventListener('keydown',onKey);document.body.appendChild(overlay);overlay.querySelector('.session-detail-close').focus();
}
function sessionFormMarkup(session,mode){
  const options=`<option value="" ${session.subject?'' :'selected'}>${tx('未分类','Uncategorized')}</option>`+state.categories.map(category=>`<option value="${category.id}" ${session.subject===category.id?'selected':''}>${escapeHtml(category.name)}</option>`).join('');
  return `<section class="confirm-box record-form" role="dialog" aria-modal="true" aria-labelledby="record-form-title"><p class="eyebrow">${mode==='edit'?tx('编辑记录','EDIT RECORD'):tx('完成学习','FINISH SESSION')}</p><h2 id="record-form-title">${mode==='edit'?tx('修改这次学习','Update this session'):tx('记录这次收获','Record your progress')}</h2>${mode==='finish'?`<p>${tx('有效学习','Focused time')}：<b>${minsText(session.minutes)}</b></p>`:''}<form><label><span>${tx('分类（可选）','Category (optional)')}</span><select name="subject">${options}</select></label><label><span>${tx('学习标题','Title')}</span><input name="title" maxlength="80" required value="${escapeHtml(session.title||'')}" placeholder="${tx('这次学了什么？','What did you study?')}"></label><div class="form-row"><label><span>${tx('日期','Date')}</span><input name="date" type="date" required value="${escapeHtml(session.date)}"></label><label><span>${tx('开始时间','Start time')}</span><input name="start" type="time" required value="${escapeHtml(session.start)}"></label></div><label><span>${tx('学习时长（分钟）','Duration (minutes)')}</span><input name="minutes" type="number" min="1" max="720" required value="${session.minutes}"></label><label><span>${tx('学习笔记','Study note')}</span><textarea name="note" maxlength="2000" rows="4" placeholder="${tx('写下一点收获（可选）','Add a takeaway (optional)')}">${escapeHtml(session.note||'')}</textarea></label><p class="form-error" aria-live="polite"></p><div class="form-buttons"><button class="form-cancel" type="button">${mode==='finish'?tx('返回学习','Back to session'):tx('取消','Cancel')}</button><button class="form-save" type="submit">${mode==='finish'?tx('保存记录','Save record'):tx('保存修改','Save changes')}</button></div></form></section>`;
}
function openSessionEditor(session){openRecordForm({...session},'edit')}
function openRecordForm(draft,mode){
  const overlay=document.createElement('div');overlay.className='confirm-overlay record-form-overlay';overlay.innerHTML=sessionFormMarkup(draft,mode);
  const close=()=>{document.removeEventListener('keydown',onKey);overlay.remove()};
  const onKey=event=>{if(event.key==='Escape')close()};
  overlay.addEventListener('click',event=>{if(event.target===overlay)close()});overlay.querySelector('.form-cancel').onclick=close;
  overlay.querySelector('form').onsubmit=event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);const title=String(form.get('title')||'').trim();const minutes=Number(form.get('minutes'));const error=overlay.querySelector('.form-error');
    if(!title){error.textContent=tx('请填写学习标题。','Please enter a title.');return}
    if(!Number.isInteger(minutes)||minutes<1||minutes>720){error.textContent=tx('学习时长必须是 1–720 分钟。','Duration must be 1–720 minutes.');return}
    const selectedSubject=String(form.get('subject')||'');
    const updated={...draft,subject:state.categories.some(category=>category.id===selectedSubject)?selectedSubject:null,title,note:String(form.get('note')||'').trim(),date:String(form.get('date')),start:String(form.get('start')),minutes,updatedAt:Date.now()};
    if(mode==='edit'){const index=state.sessions.findIndex(item=>item.id===draft.id);if(index<0)return;state.sessions[index]=updated}
    else{state.sessions.unshift({...updated,id:Date.now(),createdAt:Date.now()});state.active=null;page='today'}
    save();close();render();
  };
  document.addEventListener('keydown',onKey);document.body.appendChild(overlay);overlay.querySelector('[name="title"]').focus();
}
function togglePause(){
  if(!state.active)return;const now=Date.now();
  if(state.active.status==='paused'){state.active.status='running';state.active.segmentStartedAt=now;state.active.pausedAt=null}
  else{state.active.accumulatedMs=activeElapsedMs(now);state.active.status='paused';state.active.segmentStartedAt=null;state.active.pausedAt=now}
  save();render();
}
function confirmShortSession(elapsed){
  return new Promise(resolve=>{
    const overlay=document.createElement('div'); overlay.className='confirm-overlay';
    overlay.innerHTML=`<section class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="short-title"><p class="eyebrow">${tx('时长不足 25 分钟','UNDER 25 MINUTES')}</p><h2 id="short-title">${tx('确定要结束吗？','Finish this session?')}</h2><p>${tx(`目前只学习了 ${elapsed} 分钟，结束后不会保存这次记录。`,`You have studied for ${elapsed} minutes. This session will not be recorded if you finish now.`)}</p><div class="short-confirm-buttons"><button class="confirm-yes">Yes</button><button class="confirm-no">No</button></div></section>`;
    const close=result=>{document.removeEventListener('keydown',onKey);overlay.remove();resolve(result)};
    const onKey=event=>{if(event.key==='Escape'||event.key==='Backspace')close(false)};
    overlay.addEventListener('click',event=>{if(event.target===overlay)close(false)});
    overlay.querySelector('.confirm-no').onclick=()=>close(false);
    overlay.querySelector('.confirm-yes').onclick=()=>close(true);
    document.addEventListener('keydown',onKey); document.body.appendChild(overlay); overlay.querySelector('.confirm-no').focus();
  });
}
async function finishSession(){
  const elapsed=activeElapsedMinutes();
  if(elapsed < 25){
    if(!await confirmShortSession(elapsed))return;
    state.active=null;
    save();
    page='today';
    render();
    return;
  }
  const d=new Date(state.active.startedAt);
  openRecordForm({subject:state.active.subject,title:'',note:'',minutes:elapsed,date:localDay(d),start:d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})},'finish');
}
applyTheme(); render();
document.documentElement.lang=isEn()?'en':'zh-CN';
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
