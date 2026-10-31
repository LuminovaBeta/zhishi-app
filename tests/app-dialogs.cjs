const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const nodes=[],listeners=new Map(),timers=new Map();
let tick=0;
const document={activeElement:null,querySelectorAll:()=>nodes.filter(n=>n.className?.includes('confirm-overlay')),querySelector:()=>nodes.find(n=>n.className==='app-toast'),addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:(type,fn)=>{assert.equal(listeners.get(type),fn);listeners.delete(type)}};
function node(){return {inert:false,isConnected:true,className:'',buttons:[],focus(){document.activeElement=this},setAttribute(k,v){this[k]=v},addEventListener(type,fn){this[type]=fn},remove(){nodes.splice(nodes.indexOf(this),1);this.isConnected=false},set innerHTML(html){this.html=html;this.buttons=[...html.matchAll(/data-dialog-choice="(\d+)"/g)].map(()=>node())},querySelectorAll(){return this.buttons}}}
document.createElement=node;document.body={appendChild:n=>nodes.push(n)};
const root=node(),trigger=node(),parent=node();parent.className='confirm-overlay category-manager-overlay';nodes.push(parent);trigger.focus();
const ctx={document,$app:root,Promise,tx:(zh,en)=>en,clearTimeout:id=>timers.delete(id),setTimeout:fn=>{timers.set(++tick,fn);return tick}};
vm.createContext(ctx);
vm.runInContext('let appDialogQueue=Promise.resolve(),toastTimer;'+source.slice(source.indexOf('function escapeHtml('),source.indexOf('function activeElapsedMs(')),ctx);
const next=async()=>{await Promise.resolve();await Promise.resolve()};
const current=()=>nodes.find(n=>n.className==='confirm-overlay app-dialog-overlay');
const key=(name,shiftKey=false)=>listeners.get('keydown')({key:name,shiftKey,preventDefault(){},stopImmediatePropagation(){}});
(async()=>{
  let result=ctx.confirmAction('<unsafe>');await next();let dialog=current();
  assert.ok(dialog.html.includes('&lt;unsafe&gt;'));assert.ok(root.inert);assert.ok(parent.inert);
  assert.equal(document.activeElement,dialog.buttons[0]);
  key('Tab');assert.equal(document.activeElement,dialog.buttons[1]);key('Tab');assert.equal(document.activeElement,dialog.buttons[0]);
  key('Tab',true);assert.equal(document.activeElement,dialog.buttons[1]);
  key('Escape');assert.equal(await result,false);assert.ok(!root.inert);assert.ok(!parent.inert);assert.equal(document.activeElement,trigger);assert.equal(listeners.size,0);
  result=ctx.confirmAction('Delete?');await next();dialog=current();dialog.buttons[1].onclick();dialog.buttons[1].onclick();assert.equal(await result,true);
  result=ctx.confirmAction('Delete?');await next();dialog=current();dialog.click({target:dialog});assert.equal(await result,false);
  for(const [index,value] of [[0,'1'],[1,'2'],[2,null]]){result=ctx.chooseImportMode(7);await next();dialog=current();assert.ok(dialog.html.includes('7 sessions'));assert.equal(document.activeElement,dialog.buttons[2]);dialog.buttons[index].onclick();assert.equal(await result,value)}
  parent.inert=true;
  const first=ctx.appAlert('First'),second=ctx.appAlert('Second');await next();assert.ok(current().html.includes('First'));current().buttons[0].onclick();await first;await next();assert.ok(current().html.includes('Second'));key('Escape');await second;assert.ok(parent.inert);assert.ok(!root.inert);
  ctx.showToast('Saved');assert.equal(nodes.filter(n=>n.className==='app-toast').length,1);assert.equal(nodes.find(n=>n.className==='app-toast').role,'status');
  ctx.showToast('Imported');assert.equal(nodes.filter(n=>n.className==='app-toast').length,1);assert.equal(timers.size,1);[...timers.values()][0]();assert.ok(!nodes.some(n=>n.className==='app-toast'));
  assert.ok(!/(?<![\w.])(?:alert|confirm|prompt)\s*\(/.test(source));
  assert.ok(source.includes('installPrompt.prompt()'));assert.ok(source.includes('Share.share('));
  console.log('PASS: confirmation/cancellation, backdrop, focus trap/restore, nested inert state, import choices, escaped text, dialog queue, toast lifecycle, no browser dialogs, native flows retained');
})().catch(error=>{console.error(error);process.exitCode=1});
