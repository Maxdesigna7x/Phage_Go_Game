const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function engine() {
  const storage=new Map(), sources=[], downloads=[];
  class Context {
    constructor(){this.state='running';this.currentTime=0;}
    createGain(){return {gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
    resume(){return Promise.resolve();}
    decodeAudioData(){return Promise.resolve({duration:1});}
    createBufferSource(){const source={playbackRate:{value:1},connect(){},disconnect(){},start(...args){this.started=true;this.startArgs=args;},stop(){this.stopped=true;this.onended?.();}};sources.push(source);return source;}
  }
  const sandbox={window:{AudioContext:Context},document:{hidden:false,createElement(tag){return tag==='audio'?{canPlayType:()=> 'probably'}:{click(){downloads.push(this);}};}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async()=>({ok:true,json:async()=>({disabled:[]}),arrayBuffer:async()=>new ArrayBuffer(8)}),performance:{now:()=>1000},Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'audio/catalog.js'),'utf8'),sandbox);
  let code=fs.readFileSync(path.join(root,'audio/sound.js'),'utf8');
  code=code.slice(0,code.indexOf('window.SFX ='));
  vm.runInContext(code+'\nwindow.engine=new SoundEngine(window.SOUND_CATALOG);',sandbox);
  sandbox.window.engine.unlock();
  return {sound:sandbox.window.engine,sandbox,storage,sources,downloads};
}
test('all catalog entries are effects and prefer the smallest existing compressed format',()=>{
  const {sound}=engine();assert.equal(sound.catalog.length,58);
  assert.equal(new Set(sound.catalog.map(s=>s.id)).size,sound.catalog.length);
  for(const entry of sound.catalog){
    assert.ok(!entry.id.startsWith('ambiente_'));
    const bytes=entry.files.map(file=>fs.statSync(path.join(root,file)).size);
    assert.equal(bytes[0],Math.min(...bytes));
    assert.ok(entry.files.every(f=>/\.(mp3|ogg)$/.test(f)));
  }
});
test('disabled effects do not play; previews may audition them and saved JSON persists',async()=>{
  const {sound,storage,downloads,sources}=engine();await sound.ready;
  sound.apply({disabled:['ui_pulsar','unknown']});
  await sound.play('ui_pulsar');assert.equal(sources.length,0);
  sound.menuOpen=true;
  await sound.play('ui_pulsar',{preview:true});assert.equal(sources.length,1);assert.equal(sources[0].started,true);
  assert.equal(sound.save(),true);
  assert.deepEqual(JSON.parse(storage.get('phage-sound-settings')),{version:1,disabled:['ui_pulsar']});
  assert.equal(downloads[0].download,'phage-sound-settings.json');
});
test('pending loops cancel before decode, repeated starts share one voice, disabling stops playback',async()=>{
  const {sound,sources}=engine();await sound.ready;
  let resolve;const pending=new Promise(r=>resolve=r);
  sound.buffer=()=>pending;
  const playing=sound.play('adn_inyectar',{loop:true});
  await Promise.resolve();sound.loop('adn_inyectar',false);resolve({duration:1});await playing;
  assert.equal(sources.length,0);assert.equal(sound.loops.size,0);
  sound.buffer=async()=>({duration:1});
  await sound.play('adn_inyectar',{loop:true});await sound.play('adn_inyectar',{loop:true});
  assert.equal(sources.length,1);
  sound.apply({disabled:['adn_inyectar']});assert.equal(sources[0].stopped,true);assert.equal(sound.loops.size,0);
});
test('hidden documents and sound settings block gameplay effects; voices are bounded',async()=>{
  const {sound,sources,sandbox}=engine();await sound.ready;
  sound.menuOpen=true;await sound.play('bacteria_explotar');assert.equal(sources.length,0);
  sound.menuOpen=false;sandbox.document.hidden=true;await sound.play('bacteria_explotar');assert.equal(sources.length,0);
  sandbox.document.hidden=false;
  for(const s of sound.catalog.slice(0,20)) await sound.play(s.id,{preview:true});
  assert.ok(sound.voices.size<=14);
  sound.stopAll();assert.equal(sound.voices.size,0);assert.ok(sources.every(s=>s.stopped));
});

test('decoder falls back to the next compressed format if the smallest file fails',async()=>{
  const {sound,sandbox,sources}=engine();await sound.ready;
  const entry=sound.catalog.find(s=>s.id==='biosintesis_proceso');
  const requested=[];
  sandbox.fetch=async file=>{requested.push(file);if(requested.length===1) throw Error('unsupported decoder');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  await sound.play('biosintesis_proceso');
  assert.deepEqual(requested,[...entry.files]);assert.equal(sources.length,1);assert.equal(sources[0].started,true);
});


test('swim pulses use a short enveloped sample and pending strokes cancel on stop',async()=>{
  const {sound,sources}=engine();await sound.ready;
  sound.buffer=async()=>({duration:2.4});
  await sound.play('fago_nadar',{duration:0.16,fade:0.015});
  assert.deepEqual(sources[0].startArgs,[0,0,0.16]);
  sound.stop('fago_nadar');assert.equal(sources[0].stopped,true);
  let finish; sound.buffer=()=>new Promise(r=>finish=r);
  const pending=sound.play('fago_nadar',{preview:true});await Promise.resolve();
  sound.stop('fago_nadar');finish({duration:2.4});await pending;
  assert.equal(sources.length,1);
});

test('all bubble pops use the same imported recording and retain their preference IDs',()=>{
  const {sound}=engine();
  const pops=sound.catalog.filter(s=>s.group==='burbuja_explotar');
  assert.equal(pops.length,5);
  const first=fs.readFileSync(path.join(root,pops[0].files[0]));
  for(const pop of pops){
    assert.equal(pop.revision,'20261019-20');
    assert.deepEqual(fs.readFileSync(path.join(root,pop.files[0])),first);
  }
  assert.ok(fs.existsSync(path.join(root,'audio/sonidos/fuentes/el_boss_669918_bubble_pop.mp3')));
});
