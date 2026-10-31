const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const helpers=source.slice(source.indexOf('function commitRecordState('),source.indexOf('function isEn('));
const backupHelpers=source.slice(source.indexOf('function validateBackup('),source.indexOf('function compressAvatar('));
function setup(){
  let stored,fail=false;
  const state={goal:300,language:'en',theme:'classic-dark',seedDataRemoved:true,active:null,categories:[{id:'math',name:'Math',color:'#4F7CFF',archived:true}],sessions:[],deletedSessions:[]};
  const alerts=[];
  const ctx={state,console:{error(){}},Date,Math,Set,Map,Number,JSON,Array,defaultCategories:[],tx:(zh,en)=>en,alert:message=>alerts.push(message),confirm:()=>true,render(){},localStorage:{setItem(key,value){assert.equal(key,'zhishi-state');if(fail)throw Error('Quota');stored=value}}};
  vm.createContext(ctx);vm.runInContext(helpers+backupHelpers,ctx);
  return {ctx,state,alerts,stored:()=>JSON.parse(stored),fail:value=>fail=value};
}
const record=(id=1)=>({id,title:'Private deleted title',note:'Private deleted note',subject:'math',date:'2026-10-30',start:'10:00',minutes:30});
let s=setup();s.state.sessions=[record()];
assert.equal(s.ctx.moveSessionToTrash(s.state.sessions[0]),true);
assert.equal(s.state.sessions.length,0);
let entry=s.state.deletedSessions[0];
assert.equal(entry.expiresAt-entry.deletedAt,7*86400000);
assert.equal(s.stored().deletedSessions.length,1);
let exported=JSON.stringify(s.ctx.exportableState());
assert.ok(!exported.includes('deletedSessions'));
assert.ok(!exported.includes('Private deleted'));
assert.ok(!exported.includes('deletedAt'));
assert.equal(s.ctx.validateBackup(JSON.parse(exported)).sessions.length,0);
s.ctx.restoreDeletedSession(entry.id);
assert.equal(s.state.sessions.length,1);
assert.equal(s.state.sessions[0].subject,'math'); // Archived category is retained.
assert.equal(s.state.deletedSessions.length,0);
assert.ok(JSON.stringify(s.ctx.exportableState()).includes('Private deleted title'));
s.ctx.moveSessionToTrash(s.state.sessions[0]);entry=s.state.deletedSessions[0];
s.state.categories=[];s.ctx.restoreDeletedSession(entry.id);
assert.equal(s.state.sessions[0].subject,null);

s=setup();s.state.sessions=[record()];s.fail(true);
assert.equal(s.ctx.moveSessionToTrash(s.state.sessions[0]),false);
assert.equal(s.state.sessions.length,1);assert.equal(s.state.deletedSessions.length,0);
s.fail(false);s.ctx.moveSessionToTrash(s.state.sessions[0]);entry=s.state.deletedSessions[0];s.fail(true);
s.ctx.restoreDeletedSession(entry.id);assert.equal(s.state.sessions.length,0);assert.equal(s.state.deletedSessions.length,1);
s.ctx.permanentlyDeleteSession(entry.id);assert.equal(s.state.deletedSessions.length,1);
s.fail(false);s.ctx.confirm=()=>false;s.ctx.permanentlyDeleteSession(entry.id);assert.equal(s.state.deletedSessions.length,1);
s.ctx.confirm=()=>true;s.ctx.permanentlyDeleteSession(entry.id);assert.equal(s.state.deletedSessions.length,0);

s=setup();s.state.sessions=[record()];s.ctx.moveSessionToTrash(s.state.sessions[0]);entry=s.state.deletedSessions[0];
s.state.sessions=[record(2)];s.ctx.restoreDeletedSession(entry.id);
assert.equal(s.state.sessions.length,1);assert.equal(s.state.deletedSessions.length,0);
assert.ok(s.alerts.some(message=>message.includes('already exists')));
s.ctx.moveSessionToTrash(s.state.sessions[0]);entry=s.state.deletedSessions[0];
s.state.sessions=[{...record(2),title:'Different record'}];s.ctx.restoreDeletedSession(entry.id);
assert.equal(new Set(s.state.sessions.map(item=>item.id)).size,2);

s=setup();s.state.sessions=[record()];s.ctx.moveSessionToTrash(s.state.sessions[0]);entry=s.state.deletedSessions[0];
assert.equal(s.ctx.liveDeletedSessions([entry],entry.expiresAt).length,0);
assert.equal(s.ctx.liveDeletedSessions([entry],entry.expiresAt-1).length,1);
assert.equal(s.ctx.liveDeletedSessions(undefined).length,0);
assert.equal(s.ctx.liveDeletedSessions([null,{}]).length,0);
assert.equal(s.ctx.trashAfterImport([],s.state.categories,false).length,1);
assert.equal(s.ctx.trashAfterImport([record()],s.state.categories,false).length,0);
assert.equal(s.ctx.trashAfterImport([{...record(),subject:null}],[],false).length,0);
assert.equal(s.ctx.trashAfterImport([],s.state.categories,true).length,0);
entry.expiresAt=Date.now()-1;s.ctx.restoreDeletedSession(entry.id);assert.equal(s.state.sessions.length,0);

const oldBackup={goal:300,sessions:[record()],categories:[{id:'math',name:'Math',color:'#4F7CFF'}]};
assert.equal(s.ctx.validateBackup(oldBackup).sessions.length,1);
assert.equal(s.ctx.validateBackup({...oldBackup,deletedSessions:[entry]}).deletedSessions,undefined);
assert.match(source,/data-page="recently-deleted"/);
assert.match(source,/const data=JSON.stringify\(exportableState\(\)/);
assert.match(source,/deletedSessions=trashAfterImport/);
console.log('PASS: deletion, restore, persistence failures, expiry, category changes, duplicate/ID handling, permanent deletion, export exclusion, import compatibility and reconciliation');
