/* Local effects only. Ambient tracks are intentionally excluded from the catalog. */
class SoundEngine {
  constructor(catalog) {
    this.catalog = catalog;
    this.disabled = new Set(); this.buffers = new Map(); this.voices = new Set();
    this.loops = new Map(); this.lastPlayed = new Map(); this.menuOpen = false;
    this.context = null; this.epoch = 0; this.groupEpoch = new Map();
    this.ready = this.loadSettings();
  }
  async loadSettings() {
    try {
      const saved = localStorage.getItem('phage-sound-settings');
      const config = saved ? JSON.parse(saved) : await (await fetch('audio/settings.json')).json();
      this.apply(config);
    } catch { /* Storage or config unavailable: all effects enabled. */ }
  }
  apply(config) {
    const known = new Set(this.catalog.map(s => s.id));
    this.disabled = new Set(Array.isArray(config?.disabled) ? config.disabled.filter(id => known.has(id)) : []);
    for (const v of [...this.voices]) if (this.disabled.has(v.id)) this.stopVoice(v);
  }
  unlock() {
    try {
      if (!this.context) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.context = new Context(); this.master = this.context.createGain();
        this.master.gain.value = 0.55; this.master.connect(this.context.destination);
      }
      this.context.resume().catch(() => {});
    } catch { /* Silent fallback when audio is unsupported. */ }
  }
  async buffer(sound) {
    if (!this.buffers.has(sound.id)) {
      const pending = (async () => {
        const probe = document.createElement('audio');
        for (const file of sound.files) {
          if (!probe.canPlayType(file.endsWith('.ogg') ? 'audio/ogg; codecs="vorbis"' : 'audio/mpeg')) continue;
          try {
            const response = await fetch(file + (sound.revision ? '?v='+encodeURIComponent(sound.revision) : ''));
            if (!response.ok) continue;
            return await this.context.decodeAudioData(await response.arrayBuffer());
          } catch { /* Try the next compressed format if decoding fails. */ }
        }
        throw new Error('No supported audio for '+sound.id);
      })();
      this.buffers.set(sound.id,pending);
      pending.catch(() => this.buffers.delete(sound.id));
    }
    return this.buffers.get(sound.id);
  }
  async play(group, {loop=false, volume=0.65, rate=1, preview=false, offset=0, duration=0, fade=0.02, maxDelay=Infinity} = {}) {
    if (!this.context || this.context.state !== 'running' || document.hidden || (this.menuOpen && !preview)) return;
    const choices = this.catalog.filter(s => (s.group===group || s.id===group) && (preview || !this.disabled.has(s.id)));
    if (!choices.length || (loop && this.loops.has(group))) return;
    const now = performance.now();
    if (!loop && !preview && now-(this.lastPlayed.get(group) ?? -Infinity)<75) return;
    this.lastPlayed.set(group,now);
    const sound = choices[Math.floor(Math.random()*choices.length)];
    const voice = {id:sound.id,group,loop,source:null,cancelled:false};
    const epoch=this.epoch, groupEpoch=this.groupEpoch.get(group);
    if (loop) this.loops.set(group,voice);
    try {
      await this.ready;
      const buffer=await this.buffer(sound);
      if (performance.now()-now>maxDelay || groupEpoch!==this.groupEpoch.get(group) || voice.cancelled || epoch!==this.epoch || document.hidden || (!preview && (this.disabled.has(sound.id) || this.menuOpen))) return;
      if (this.voices.size>=14) this.stopVoice([...this.voices].find(v=>!v.loop) || [...this.voices][0]);
      const source=this.context.createBufferSource(), gain=this.context.createGain();
      source.buffer=buffer; source.loop=loop; source.playbackRate.value=rate;
      gain.gain.value=volume; source.connect(gain); gain.connect(this.master);
      voice.source=source; voice.gain=gain; this.voices.add(voice);
      source.onended=()=>{this.voices.delete(voice); gain.disconnect(); source.disconnect();};
      if (duration > 0 && !preview) {
        const start=this.context.currentTime;
        const length=Math.max(0.01,Math.min(duration,buffer.duration-offset));
        const edge=Math.min(fade,length/2);
        gain.gain.setValueAtTime(0,start);
        gain.gain.linearRampToValueAtTime(volume,start+edge);
        gain.gain.setValueAtTime(volume,start+length-edge);
        gain.gain.linearRampToValueAtTime(0,start+length);
        source.start(start,offset,length);
      } else source.start();
      // Auditioning sustained effects is deliberately limited to two seconds.
      if (preview) source.stop(this.context.currentTime+Math.min(2,buffer.duration));
    } catch { /* A missing effect never interrupts gameplay. */ }
    finally { if (loop && !voice.source && this.loops.get(group)===voice) this.loops.delete(group); }
  }
  stopVoice(voice) {
    if (!voice) return;
    voice.cancelled=true;
    if (voice.source) { try {voice.source.stop();} catch {} }
    this.voices.delete(voice);
    if(this.loops.get(voice.group)===voice) this.loops.delete(voice.group);
  }
  loop(group, active, options={}) {
    if(active) void this.play(group,{...options,loop:true});
    else this.stopVoice(this.loops.get(group));
  }
  stop(group) {
    this.groupEpoch.set(group,(this.groupEpoch.get(group)||0)+1);
    for(const voice of [...this.voices,...this.loops.values()]) if(voice.group===group) this.stopVoice(voice);
  }
  stopAll() { this.epoch++; for(const v of [...this.voices,...this.loops.values()]) this.stopVoice(v); }
  config() { return {version:1,disabled:[...this.disabled].sort()}; }
  save() {
    const config=this.config();
    let persisted=true;
    try {localStorage.setItem('phage-sound-settings',JSON.stringify(config));} catch {persisted=false;}
    const url=URL.createObjectURL(new Blob([JSON.stringify(config,null,2)+'\n'],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download='phage-sound-settings.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    return persisted;
  }
}
window.SFX = new SoundEngine(window.SOUND_CATALOG || []);
const soundPanel=document.getElementById('soundPanel');
const soundList=document.getElementById('soundList');
const soundStatus=document.getElementById('soundStatus');
function renderSoundSettings() {
  soundList.replaceChildren();
  for(const category of new Set(SFX.catalog.map(s=>s.category))) {
    const field=document.createElement('fieldset'), legend=document.createElement('legend');
    legend.textContent=category; field.append(legend);
    const all=document.createElement('input'); all.type='checkbox';
    const entries=SFX.catalog.filter(s=>s.category===category);
    const enabled=entries.filter(s=>!SFX.disabled.has(s.id)).length;
    all.checked=enabled===entries.length; all.indeterminate=enabled>0 && enabled<entries.length;
    const label=document.createElement('label'); label.className='sound-category'; label.append(all,document.createTextNode(' Activar categoría')); field.append(label);
    all.addEventListener('change',()=>{for(const s of entries) all.checked?SFX.disabled.delete(s.id):SFX.disabled.add(s.id); SFX.apply(SFX.config()); renderSoundSettings();});
    for(const sound of entries) {
      const row=document.createElement('div'); row.className='sound-row';
      const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=!SFX.disabled.has(sound.id);
      const label=document.createElement('label'); label.append(checkbox,document.createTextNode(' '+sound.label));
      checkbox.addEventListener('change',()=>{checkbox.checked?SFX.disabled.delete(sound.id):SFX.disabled.add(sound.id); SFX.apply(SFX.config()); renderSoundSettings();});
      const play=document.createElement('button'); play.type='button'; play.textContent='▶ Escuchar'; play.setAttribute('aria-label','Escuchar '+sound.label);
      play.addEventListener('click',()=>{SFX.unlock(); SFX.stopAll(); void SFX.play(sound.id,{preview:true});});
      row.append(label,play); field.append(row);
    }
    soundList.append(field);
  }
}
document.getElementById('soundButton')?.addEventListener('click',async()=>{
  SFX.unlock(); SFX.stopAll(); SFX.menuOpen=true;
  if(typeof clearHeldInputs==='function') clearHeldInputs();
  await SFX.ready; renderSoundSettings(); soundStatus.textContent=''; soundPanel.showModal();
});
soundPanel.addEventListener('close',()=>{SFX.stopAll();SFX.menuOpen=false;});
document.getElementById('soundClose').addEventListener('click',()=>soundPanel.close());
document.getElementById('soundSave').addEventListener('click',()=>{
  const saved=SFX.save(); soundStatus.textContent=saved?'Selección guardada en este navegador. JSON exportado.':'JSON exportado. El navegador no permite guardar preferencias locales.';
});
document.addEventListener('pointerdown',()=>SFX.unlock(),{capture:true});
document.addEventListener('keydown',()=>SFX.unlock(),{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden) SFX.stopAll();});

document.addEventListener('click',event=>{
  if(event.target.closest?.('button') && !soundPanel.contains(event.target)) void SFX.play('ui_pulsar',{volume:0.3});
},{capture:true});
