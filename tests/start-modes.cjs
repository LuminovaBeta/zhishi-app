// Run with: node --experimental-vm-modules tests/start-modes.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
(async()=>{
  let buttons=[];
  const root={classList:{remove(){},add(){}},set innerHTML(html){this.html=html;buttons=[...html.matchAll(/<button\b([^>]*)>/g)].map(match=>{
    const attributes=Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    return {attributes,dataset:Object.fromEntries(Object.entries(attributes).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value])),focus(){this.focused=true}};
  })}};
  const queryAll=selector=>{const match=selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);return match?buttons.filter(button=>match[1] in button.attributes&&(match[2]===undefined||button.attributes[match[1]]===match[2])):[]};
  const ctx=vm.createContext({console,document:{querySelector:s=>s==='#app'?root:queryAll(s)[0]||null,querySelectorAll:queryAll,documentElement:{dataset:{}},addEventListener(){},removeEventListener(){}},window:{addEventListener(){}},navigator:{},localStorage:{getItem:()=>null,setItem(){}},clearInterval(){},setInterval(){},clearTimeout(){},scrollTo(){}});
  const data=new vm.SourceTextModule(read('changelog-data.js'),{context:ctx});
  const app=new vm.SourceTextModule(read('app.js')+'\nglobalThis.check={state,render,addView};',{context:ctx});
  await app.link(()=>data);await app.evaluate();
  const click=(key,value)=>{const button=buttons.find(b=>b.dataset[key]===value);assert.ok(button,`${key}: ${value}`);button.onclick()};
  for(const language of ['zh','en']){
    ctx.check.state.language=language;
    click('page','add');
    assert.equal(queryAll('[data-start-mode]').length,2);
    assert.equal(queryAll('[data-start-mode="focus"]')[0].attributes['aria-pressed'],'true');
    assert.ok(queryAll('[data-subject]').length>0);
    assert.equal(queryAll('[data-subject]').at(-1).dataset.subject,'');
    const before=JSON.stringify(ctx.check.state);
    click('startMode','timed-practice');
    assert.equal(queryAll('[data-start-mode="timed-practice"]')[0].attributes['aria-pressed'],'true');
    assert.ok(queryAll('[data-start-mode="timed-practice"]')[0].focused);
    assert.equal(queryAll('[data-subject]').length,0);
    assert.ok(root.html.includes(language==='en'?'Coming soon':'即将开放'));
    assert.equal(JSON.stringify(ctx.check.state),before);
    click('startMode','focus');assert.ok(queryAll('[data-subject]').length>0);
    click('startMode','timed-practice');click('page','today');click('page','add');
    assert.equal(queryAll('[data-start-mode="focus"]')[0].attributes['aria-pressed'],'true');
  }
  for(const status of ['running','paused']){
    ctx.check.state.active={status,startedAt:Date.now(),accumulatedMs:0,segmentStartedAt:Date.now(),subject:null};
    ctx.check.render();assert.equal(queryAll('[data-start-mode]').length,0);assert.equal(queryAll('[data-subject]').length,0);assert.ok(root.html.includes('id="toggle-pause"'));assert.ok(root.html.includes('id="finish"'));
  }
  console.log('PASS: default mode, two-way switching, Chinese/English placeholders, no state mutations, entry reset, focus restoration, running/paused session guard');
})().catch(error=>{console.error(error);process.exitCode=1});
