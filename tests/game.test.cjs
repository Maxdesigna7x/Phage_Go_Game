const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game(effects, storage) {
  const listeners = {};
  const nodes = {};
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, { get: (o, k) => o[k] ?? (k.startsWith('create') ? () => gradient : k === 'getTransform' ? () => ({a:1,b:0,c:0,d:1,e:0,f:0}) : k === 'measureText' ? text => ({ width: text.length * 12 }) : () => {}), set: (o,k,v) => (o[k] = v, true) });
  function node(id) {
    return nodes[id] ||= { style: { setProperty(name,value) { this[name]=value; } }, dataset: {}, children: [], append(child) { this.children.push(child); child.parent=this; }, remove() { if(this.parent) this.parent.children=this.parent.children.filter(n=>n!==this); }, setAttribute(name,value) { this[name]=value; }, classList: { add() {}, remove() {}, toggle() {} }, addEventListener(event, handler) { listeners[id + ':' + event] = handler; }, getContext: () => context, getBoundingClientRect() { const field = nodes.playfield.style; return { left: parseFloat(field.left) || 0, top: parseFloat(field.top) || 0, width: parseFloat(this.style.width) || 1600, height: parseFloat(this.style.height) || 900 }; }, setPointerCapture() {} };
  }
  const sandbox = { console, performance: { now: () => sandbox.now }, now: 1000, document: { hidden: false, getElementById: node, createElement: () => node('cache' + Math.random()), addEventListener(event, handler) { listeners['document:' + event] = handler; } }, window: { innerWidth: 1280, innerHeight: 720, matchMedia: () => ({ matches: false }), addEventListener(event, handler) { listeners['window:' + event] = handler; } }, navigator: { maxTouchPoints: 0, userAgent: '' }, requestAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {} };
  if (effects) sandbox.window.SFX=effects;
  if (storage) sandbox.window.localStorage=storage;
  // Keep gameplay fixtures reproducible; seed tests override this explicitly.
  sandbox.Math=Object.create(Math);
  sandbox.Math.random=()=>.25;
  sandbox.atob=atob;
  vm.createContext(sandbox);
  for (const file of ["world-shapes.js","world.js","enemies.js","controls.js"]) vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"..",file),"utf8"),sandbox);
  let source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8');
  source = source.slice(0, source.lastIndexOf('\nresizeCanvasToViewport();'));
  vm.runInContext(source, sandbox);
  const run = code => vm.runInContext(code, sandbox);
  run('for (const key of Object.keys(ASSETS)) img[key] = {width:512, height:512}; resizeCanvasToViewport(); init(); startGame=mode=>{if(gameReady && !isDisplayBlocked()) launchGame(mode);};');
  return { run, nodes, listeners, sandbox };
}

test('proximity accepts every phage orientation; docking lands feet on rotated ellipse', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    const b = makeBacteria(800,450,0.9,0.63,1);
    for(let i=0;i<24;i++) {
      const a = i*Math.PI/12;
      const surface = localToWorld(b.x,b.y,b.rotation,b.rx*Math.cos(a),b.ry*Math.sin(a));
      const n = normalize(rotatePoint(Math.cos(a)/b.rx,Math.sin(a)/b.ry,b.rotation));
      const p = {x:surface.x+n.x*100,y:surface.y+n.y*100,scale:0.24,rotation:a};
      if(!canAttachToBacteria(p,b).valid) return false;
      const pose = getDockPose(p,b), feet = getPhageFeetPoint({...p,...pose});
      const local = worldToLocal(b.x,b.y,b.rotation,feet.x,feet.y);
      if(Math.abs((local.x/b.rx)**2+(local.y/b.ry)**2-1)>1e-6) return false;
      if((pose.x-feet.x)*n.x+(pose.y-feet.y)*n.y <= 0) return false;
    }
    return !canAttachToBacteria({x:2000,y:2000},b).valid;
  })()`), true);
});

test('docking interpolates without early injection, then reaches exact pose', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    targetBacteria=makeBacteria(800,450,0.9,0.2,1);
    player.x=400; player.y=350;
    attachPose=getDockPose(player,targetBacteria);
    attachPose.start={x:player.x,y:player.y,rotation:player.rotation};
    setState(State.ADSORPTION);
    updateAdsorption(0.2,true);
    if(state!==State.ADSORPTION || player.x===400 || player.x===attachPose.x) return false;
    for(let i=0;i<60;i++) updateAdsorption(1/60,false);
    if(Math.hypot(player.x-attachPose.x,player.y-attachPose.y)>1e-6) return false;
    updateAdsorption(1/60,true);
    return state===State.INJECTION;
  })()`), true);
});

test('lysis never decays, holding does not add taps, ten taps release a swarm of phages', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    setState(State.LYSIS); updateLysis(1/60,1);
    const saved=lysis.pressure;
    for(let i=0;i<7200;i++) updateLysis(1/60,0);
    if(lysis.pressure!==saved || lysis.burst) return false;
    updateLysis(1/60,9);
    for(let i=0;i<80 && !lysis.burst;i++) updateLysis(1/60,0);
    return lysis.burst && lysis.released.length===18;
  })()`), true);
});

test('rapid touch taps between animation frames all count, keyboard repeat is ignored', () => {
  const { run, listeners } = game();
  run('startGame(GameMode.NORMAL); setState(State.LYSIS); mobileControls=true; render(0);');
  assert.equal(run('uiButtons.some(b=>b.id==="action")'), false);
  for(let i=0;i<4;i++) {
    listeners['game:pointerdown']({clientX:100+i*100,clientY:200,pointerId:7,preventDefault(){}});
    listeners['game:pointerup']({clientX:0,clientY:0,pointerId:7});
  }
  run('loop(17);');
  assert.equal(run('lysis.pressure'), 0.42);
  const key = {key:' ',repeat:false,preventDefault(){}};
  listeners['window:keydown'](key);
  for(let i=0;i<5;i++) listeners['window:keydown']({...key,repeat:true});
  run('loop(34);');
  assert.equal(run('lysis.pressure'), 0.525);
});

test('original letters and DNA packaging complete the cycle and return to the same escaped phage', () => {
  for(const mode of ['normal','hard']) {
    const { run } = game();
    assert.equal(run(`(() => {
      startGame('${mode}');
      targetBacteria=bacteriaField.find(isBacteriaInteractable);
      targetBacteria.rotation=0;
      camera.zoom=INTERIOR_SCALE/targetBacteria.scale;
      camera.x=targetBacteria.x-W*0.5/camera.zoom;
      camera.y=targetBacteria.y-H*0.52/camera.zoom;
      createInitialDnaFromInjection();
      while(replication.dnaPieces.length<TARGET_DNA) {
        const dna=replication.dnaPieces.find(d=>!d.duplicated); spawnDnaCopy(dna); dna.duplicated=true;
      }
      for(const dna of replication.dnaPieces) {
        nucleotideGame=createNucleotideGame(dna); setState(State.NUCLEOTIDE_MINIGAME); render(0);
        if(nucleotideGame.slots.some((slot,i)=>slot.code!==nucleotideGame.sequence[i])) return false;
        for(const slot of nucleotideGame.slots.slice()) dropNucleotideOnSlot({code:slot.code,x:slot.x,y:slot.y});
        if(state!==State.BIOSYNTHESIS) return false;
        render(0); stateTime=3.1; update(1/60,false,0);
        const head=assembly.activeParts.find(p=>p.kind==='head');
        const genome=assembly.activeParts.find(p=>p.kind==='genome');
        genome.x=head.x; genome.y=head.y; trySnapParts();
        if(!assembly.packed) return false;
        render(0);
        const body=assembly.activeParts.find(p=>p.kind==='body'), legs=assembly.activeParts.find(p=>p.kind==='legs');
        head.x=body.x; head.y=body.y; trySnapParts();
        legs.x=body.x; legs.y=body.y; trySnapParts();
      }
      updatePartAssembly(1/60); updateLysis(1/60,10); render(0);
      for(let i=0;i<120;i++) if(state===State.LYSIS) updateLysis(1/60,0);
      if(state!==State.ESCAPE) return false;
      render(0);
      const hero=escape.hero;
      for(let i=0;i<150;i++) if(state===State.ESCAPE) updateEscape(1/60);
      return state===State.SEARCH && kills===1 && Math.hypot(player.x-hero.x,player.y-hero.y)<1e-8 && camera.zoom===1;
    })()`), true, mode);
  }
});

test('wrong original letter preserves progress and matching letters succeed', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    createInitialDnaFromInjection(); nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);
    const slot=nucleotideGame.slots[0];
    dropNucleotideOnSlot({code:slot.code==='A'?'T':'A',x:slot.x,y:slot.y});
    if(slot.filled) return false;
    dropNucleotideOnSlot({code:slot.code,x:slot.x,y:slot.y});
    return slot.filled;
  })()`),true);
});

test('viewport fills the screen; portrait pauses hard-mode clock without losing the phase', () => {
  const { run, sandbox } = game();
  assert.equal(run('canvas.getBoundingClientRect().width/canvas.getBoundingClientRect().height'), 16/9);
  run('startGame(GameMode.HARD); setState(State.DNA_REPLICATION);');
  sandbox.window.innerWidth=390; sandbox.window.innerHeight=844;
  run('resizeCanvasToViewport(); loop(16);');
  sandbox.now+=120000;
  run('loop(32);');
  assert.equal(run('state'), 'dna_replication');
  sandbox.window.innerWidth=844; sandbox.window.innerHeight=390;
  run('resizeCanvasToViewport(); loop(48);');
  assert.equal(run('hardModeElapsed'),0);
  assert.equal(run('landscapeReady'),true);
  assert.ok(run('canvas.getBoundingClientRect().width <= window.innerWidth'));
  assert.ok(run('canvas.getBoundingClientRect().height <= window.innerHeight'));
});

test('fullscreen enters/exits and tolerates unsupported orientation lock', async () => {
  const { run, sandbox } = game();
  sandbox.document.documentElement = { async requestFullscreen() { sandbox.document.fullscreenElement = {}; } };
  sandbox.document.exitFullscreen = async () => { sandbox.document.fullscreenElement = null; };
  sandbox.screen = { orientation: { async lock(mode) { assert.equal(mode,'landscape'); throw new Error('unsupported'); } } };
  await run('toggleFullscreen()');
  assert.ok(sandbox.document.fullscreenElement);
  await run('toggleFullscreen()');
  assert.equal(sandbox.document.fullscreenElement, null);
});

test('fullscreen rejection is handled and explains how to keep playing', async () => {
  const { run, sandbox, nodes } = game();
  sandbox.document.documentElement = { async requestFullscreen() { throw new Error('denied'); } };
  await run('toggleFullscreen()');
  assert.match(nodes.displayNotice.textContent, /Puedes seguir jugando en horizontal/);
  assert.equal(nodes.rotateStatus.textContent, nodes.displayNotice.textContent);
});

test('hidden-tab pause is recorded even if no animation frames run in background', () => {
  const { run, sandbox, listeners } = game();
  run('startGame(GameMode.HARD);');
  sandbox.document.hidden=true;
  listeners['document:visibilitychange']();
  sandbox.now+=180000;
  sandbox.document.hidden=false;
  listeners['document:visibilitychange']();
  run('loop(180016);');
  assert.equal(run('hardModeElapsed'),0);
  assert.equal(run('state'), 'search');
});

test('mobile movement starts anywhere, uses the initial touch delta and stops thrust on release', () => {
  const { run, listeners } = game();
  run('startGame(GameMode.NORMAL); mobileControls=true;');
  for(const point of [{x:40,y:200},{x:800,y:450},{x:1500,y:800}]) {
    assert.equal(run(`handleMobileControlPointerDown(${JSON.stringify(point)},1)`),true);
    assert.equal(run('getMovementInput().mobileActive'),false);
    run(`updateJoystickFromPoint({x:${point.x+38},y:${point.y}});`);
    assert.equal(run('getMovementInput().x'),0.5);
    assert.equal(run('getMovementInput().y'),0);
    run(`updateJoystickFromPoint({x:${point.x},y:${point.y-200}});`);
    assert.equal(run('getMovementInput().y'),-1);
    listeners['game:pointerup']({pointerId:1});
    assert.equal(run('getMovementInput().mobileActive'),false);
  }
});

test('movement finger and action finger are independent; a second free touch cannot move the origin', () => {
  const { run, listeners } = game();
  run(`startGame(GameMode.NORMAL); mobileControls=true;
    handleMobileControlPointerDown({x:500,y:500},1);
    updateJoystickFromPoint({x:576,y:500});
    handleMobileControlPointerDown({x:1200,y:200},2);
    registerUiButton('action',0,0,100,100,()=>{});
    handleUiPointerDown({x:50,y:50},3);
  `);
  assert.equal(run('touchControls.joystick.cx'),500);
  assert.equal(run('touchControls.joystick.pointerId'),1);
  listeners['game:pointercancel']({pointerId:2});
  assert.equal(run('getMovementInput().x'),1);
  assert.equal(run('touchControls.actionDown'),true);
  listeners['game:pointerup']({pointerId:3});
  assert.equal(run('touchControls.actionDown'),false);
  assert.equal(run('getMovementInput().x'),1);
  listeners['game:lostpointercapture']({pointerId:1});
  assert.equal(run('getMovementInput().mobileActive'),false);
});

test('mobile movement does not intercept DNA dragging and resets when infection starts', () => {
  const { run } = game();
  run('startGame(GameMode.NORMAL); mobileControls=true; handleMobileControlPointerDown({x:500,y:500},1); setState(State.ADSORPTION);');
  assert.equal(run('touchControls.joystick.active'),false);
  run('setState(State.NUCLEOTIDE_MINIGAME);');
  assert.equal(run('handleMobileControlPointerDown({x:500,y:500},2)'),false);
});

test('entry starts at the current world pose and ends at the exact interior pose', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);
    targetBacteria=bacteriaField.find(isBacteriaInteractable);
    targetBacteria.rotation=0.42;
    attachPose=getDockPose(player,targetBacteria);
    const before=worldToScreen(targetBacteria.x,targetBacteria.y), scale=targetBacteria.scale;
    setState(State.INJECTION); updateInjection(0,false);
    const first=getInfectionPose();
    if(Math.hypot(first.x-before.x,first.y-before.y)>1e-8 || first.scale!==scale || first.rotation!==0.42) return false;
    stateTime=0.5; updateInjection(0,false);
    const mid=getInfectionPose();
    if(mid.rotation<=0 || mid.rotation>=0.42 || mid.scale<=scale || mid.scale>=INTERIOR_SCALE) return false;
    stateTime=1; updateInjection(0,false);
    const end=getInfectionPose();
    if(Math.hypot(end.x-W/2,end.y-H*0.52)>1e-8 || Math.abs(end.scale-INTERIOR_SCALE)>1e-8 || Math.abs(end.rotation)>1e-8) return false;
    injectionProgress=1; updateInjection(0,false);
    return state===State.DNA_REPLICATION && targetBacteria.rotation===0;
  })()`),true);
});

test('escape preserves every released phage screen position and camera follows the hero continuously', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);
    targetBacteria=bacteriaField.find(isBacteriaInteractable); targetBacteria.rotation=0;
    camera={zoom:INTERIOR_SCALE/targetBacteria.scale,x:0,y:0};
    camera.x=targetBacteria.x-W/2/camera.zoom; camera.y=targetBacteria.y-H*0.52/camera.zoom;
    setState(State.LYSIS); updateLysis(0,10);
    for(let i=0;i<80 && !lysis.burst;i++) updateLysis(1/60,0);
    const positions=lysis.released.map(p=>({x:p.x,y:p.y}));
    beginEscape();
    for(let i=0;i<positions.length;i++) {
      const p=worldToScreen(lysis.released[i].x,lysis.released[i].y);
      if(Math.hypot(p.x-positions[i].x,p.y-positions[i].y)>1e-8) return false;
    }
    const first=escape.hero;
    const hspeed=Math.hypot(first.vx,first.vy);
    if(lysis.released.slice(1).some(p=>Math.hypot(p.vx,p.vy)>=hspeed)) return false;
    updateEscape(ESCAPE_SECONDS/2);
    if(camera.zoom<=1 || camera.zoom>=escape.camera.zoom) return false;
    const id=targetBacteria.id;
    updateEscape(ESCAPE_SECONDS/2);
    const screen=worldToScreen(player.x,player.y);
    return state===State.SEARCH && Math.hypot(screen.x-W/2,screen.y-H/2)<1e-8 && infectedBacteriaIds.has(id) && !bacteriaField.find(b=>b.id===id)?.infectable;
  })()`),true);
});

test('background infections recycle a fixed pool without touching playable bacteria or sprite caches', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);
    const sprites=depthSprites[0], field=JSON.stringify(bacteriaField), phases=new Set();
    for(let i=0;i<3000;i++) {
      updateAmbientLife(0.1);
      for(const scene of ambientLife) phases.add(scene.phase);
      if(ambientLife.length!==AMBIENT_COUNT || ambientLife.some(s=>s.released.length>0)) return false;
    }
    for(let i=0;i<300;i++) { camera.x+=1000; camera.y-=1000; updateAmbientLife(0.1); }
    return ambientLife.length===6 && depthSprites[0]===sprites && JSON.stringify(bacteriaField)===field && ['swim','dock','infected','burst','rest'].every(p=>phases.has(p));
  })()`),true);
});

test('infection uses a motionless phage frame and menu is available from every gameplay phase', () => {
  const { run, listeners } = game();
  run('startGame(GameMode.NORMAL); setState(State.ADSORPTION); player.animTime=10;');
  assert.equal(run('getPlayerFrameIndex()'),0);
  run('player.animTime=11;');
  assert.equal(run('getPlayerFrameIndex()'),0);
  for(const phase of ['search','injection','nucleotide_minigame','lysis','escape']) {
    run(`setState('${phase}');`);
    listeners['menuButton:click']();
    assert.equal(run('state'),'intro');
  }
});

test('background scenery and infection cells have matching sizes, unique slots and no overlaps within each plane', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    for(const pos of [{x:0,y:0},{x:2300,y:-1700},{x:-4200,y:9100},{x:180000,y:-84000}]) {
      camera.x=pos.x; camera.y=pos.y; updateAmbientLife(0);
      if(new Set(ambientLife.map(s=>s.cellId)).size!==AMBIENT_COUNT) return false;
      for(let layer=0;layer<3;layer++) {
        const cells=getBackgroundCells(layer), config=PARALLAX_LAYERS[layer];
        for(const cell of cells) if(cell.diameter<config.diameter*0.93 || cell.diameter>config.diameter*1.07) return false;
        for(let i=0;i<cells.length;i++) for(let j=i+1;j<cells.length;j++) {
          if(Math.hypot(cells[i].x-cells[j].x,cells[i].y-cells[j].y)<(cells[i].diameter+cells[j].diameter)/2+47) return false;
        }
        for(const scene of ambientLife.filter(s=>s.layer===layer)) {
          const cell=cells.find(c=>c.id===scene.cellId);
          if(!cell || cell.x!==scene.x || cell.y!==scene.y || cell.diameter!==scene.diameter || cell.alpha!==scene.alpha) return false;
        }
      }
    }
    return true;
  })()`),true);
});

test('original colours and all eight background variants are preserved, with increasing atmospheric depth', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    const variants=new Set();
    for(let i=0;i<30;i++) {
      camera.x=i*977; camera.y=-i*647;
      for(let layer=0;layer<3;layer++) for(const cell of getBackgroundCells(layer)) variants.add(cell.key);
    }
    for(let i=1;i<=8;i++) if(!variants.has('bg'+i) || depthSprites[0]['bg'+i].image!==img['bg'+i]) return false;
    return PARALLAX_LAYERS[0].maxAlpha<PARALLAX_LAYERS[1].minAlpha && PARALLAX_LAYERS[1].maxAlpha<PARALLAX_LAYERS[2].minAlpha && Object.keys(depthSprites[0]).filter(k=>k.startsWith('phage')).length===3;
  })()`),true);
});

test('background swimmers face the actual path tangent and rotate smoothly into a stationary dock', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    for(const scene of ambientLife) {
      for(let t=0.1;t<4.9;t+=0.3) {
        const p=getAmbientPhagePose(scene,t), next=getAmbientPhagePose(scene,t+0.001), forward=getForward(p.rotation);
        const motion=normalize({x:next.x-p.x,y:next.y-p.y});
        if(forward.x*motion.x+forward.y*motion.y<0.999) return false;
      }
      const end=getAmbientPhagePose(scene,7), still=getAmbientPhagePose(scene,12);
      if(Math.hypot(end.x-scene.dock.x,end.y-scene.dock.y)>1e-8 || Math.hypot(end.x-still.x,end.y-still.y)>1e-8) return false;
      if(Math.abs(end.rotation-scene.dock.rotation)>1e-8) return false;
    }
    return true;
  })()`),true);
});

test('camera-neighbourhood caches stay bounded and stable cell placement survives revisiting an area', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    camera.x=0; camera.y=0;
    const original=JSON.stringify(getBackgroundCells(0));
    for(let i=0;i<300;i++) {
      camera.x=i*2000; camera.y=i*-1700; updateAmbientLife(0.1);
      if(backgroundFields.length>3 || backgroundFields.some(f=>f.cells.length>100)) return false;
    }
    camera.x=0; camera.y=0;
    return JSON.stringify(getBackgroundCells(0))===original;
  })()`),true);
});

test('different source dimensions produce the same apparent diameter per background slot', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    const original=drawDepthImage;
    let seenScale;
    drawDepthImage=(key,x,y,scale)=>{ seenScale=scale; };
    const cell={layer:1,x:700,y:400,diameter:106,rotation:0.7,alpha:0.22};
    const sizes=[[367,209],[261,170],[257,173],[238,285],[237,285],[235,285],[232,284],[268,291]];
    for(let i=0;i<sizes.length;i++) {
      const key='bg'+(i+1); img[key]={width:sizes[i][0],height:sizes[i][1]};
      drawBackgroundSlot(key,cell);
      if(Math.abs(Math.max(...sizes[i])*seenScale-106)>1e-8) return false;
    }
    drawDepthImage=original;
    return true;
  })()`),true);
});

test('background swimming uses all three animation frames while attached fibres stay still', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    const original=drawDepthImage, calls=[];
    drawDepthImage=(key)=>{if(key.startsWith('phage')) calls.push(key);};
    for(const scene of ambientLife) scene.time=3;
    for(let i=0;i<3;i++) {worldTime=i/10;drawAmbientLife(0);}
    if(new Set(calls).size!==3) return false;
    calls.length=0;
    for(const scene of ambientLife) scene.time=12;
    for(let i=0;i<3;i++) {worldTime=i/10;drawAmbientLife(0);}
    drawDepthImage=original;
    return new Set(calls).size===1 && calls[0]==='phage0';
  })()`),true);
});

test('bubble combo expires, locks at ten during boost and preserves the floating total', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);
    for(let i=0;i<9;i++) { registerBubblePop(); updateBubbleEnergy(0.2); }
    if(bubbleStats.energy!==0 || bubbleStats.combo!==9) return false;
    updateBubbleEnergy(4);
    if(bubbleStats.combo!==0) return false;
    for(let i=0;i<10;i++) registerBubblePop();
    if(bubbleStats.total!==19 || bubbleStats.energy!==ENERGY_SECONDS) return false;
    updateBubbleEnergy(6); registerBubblePop();
    if(bubbleStats.energy!==ENERGY_SECONDS-6 || bubbleStats.total!==20 || bubbleStats.combo!==10) return false;
    clearBubbleEnergy();
    if(bubbleStats.energy!==0 || bubbleStats.total!==20) return false;
    for(let i=0;i<10;i++) registerBubblePop(); updateBubbleEnergy(9);
    return bubbleStats.combo===0 && bubbleStats.energy===0;
  })()`),true);
});

test('superenergy raises movement speed and is consumed as soon as infection starts', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL); bacteriaField=[]; player.vx=1000; player.vy=0;
    bubbleStats.energy=8; updateSearch(1/60);
    if(Math.hypot(player.vx,player.vy)<=MAX_SPEED || Math.hypot(player.vx,player.vy)>MAX_SPEED*ENERGY_SPEED_MULTIPLIER+1e-8) return false;
    const b=makeBacteria(player.x+100,player.y,0.8,0,1);
    bacteriaField=[b]; keys.add(' '); updateSearch(0);
    return state===State.ADSORPTION && bubbleStats.energy===0;
  })()`),true);
});

test('rapid lysis still renders every destruction asset before the final burst', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    setState(State.LYSIS); const seen=new Set();
    updateLysis(0,10);
    if(lysis.burst) return false;
    for(let i=0;i<100 && !lysis.burst;i++) {
      seen.add(getLysisAppearance().stage); updateLysis(1/60,0); render(0);
    }
    return lysis.burst && [1,2,3,4,5].every(n=>seen.has(n)) && lysis.released.length===18;
  })()`),true);
});

test('assembly hints glow only the movable source, then its destination during dragging', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    createInitialDnaFromInjection(); createPhagePartsFromDna(replication.dnaPieces[0]);
    const original=drawSilhouetteGlow, glows=[];
    drawSilhouetteGlow=(key)=>glows.push(key);
    for(const p of assembly.activeParts) drawPart(p);
    if(glows.join()!=='dnaComplete') return false;
    glows.length=0; dragItem=assembly.activeParts.find(p=>p.kind==='genome');
    for(const p of assembly.activeParts) drawPart(p);
    if(glows.join()!=='head') return false;
    dragItem=null; assembly.packed=true; glows.length=0;
    for(const p of assembly.activeParts) drawPart(p);
    if(glows.join()!=='phagePhase1') return false;
    assembly.joining.headBody=true; glows.length=0;
    for(const p of assembly.activeParts) drawPart(p);
    drawSilhouetteGlow=original;
    return glows.join()==='phagePhase2';
  })()`),true);
});

test('constructed phages swim inside the cell and separate after spawning at one point', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    for(let i=0;i<5;i++) assembly.completePhages.push({x:W/2,y:H*0.52,vx:0,vy:0,rotation:0});
    for(let i=0;i<300;i++) {worldTime+=1/60;updateConstructedPhages(1/60);}
    const p=assembly.completePhages;
    for(let i=0;i<p.length;i++) {
      if(Math.hypot((p[i].x-W/2)/410,(p[i].y-H*0.52)/155)>1.000001) return false;
      for(let j=i+1;j<p.length;j++) if(Math.hypot(p[i].x-p[j].x,p[i].y-p[j].y)<80) return false;
    }
    return p.some(f=>Math.hypot(f.x-W/2,f.y-H*0.52)>100);
  })()`),true);
});

test('all horizontal aspect ratios fill the viewport without bands, and internal contents remain centred', () => {
  const { run, sandbox } = game();
  run('createInitialDnaFromInjection(); setState(State.DNA_REPLICATION);');
  const offset=run('replication.dnaPieces[0].x-W/2');
  for(const [width,height] of [[1024,768],[844,390],[1920,1080],[1280,800]]) {
    sandbox.window.innerWidth=width;sandbox.window.innerHeight=height;
    run('resizeCanvasToViewport(); render(0);');
    assert.equal(run('canvas.getBoundingClientRect().width'),width);
    assert.equal(run('canvas.getBoundingClientRect().height'),height);
    assert.equal(run('canvas.getBoundingClientRect().left'),0);
    assert.ok(Math.abs(run('replication.dnaPieces[0].x-W/2')-offset)<1e-8);
  }
});

test('mobile browsers supporting fullscreen pause until fullscreen is entered', () => {
  const { run, sandbox } = game();
  sandbox.navigator.maxTouchPoints=1;
  sandbox.document.documentElement={requestFullscreen(){}};
  run('resizeCanvasToViewport();');
  assert.equal(run('isDisplayBlocked()'),true);
  sandbox.document.fullscreenElement={};run('resizeCanvasToViewport();');
  assert.equal(run('isDisplayBlocked()'),false);
});


test('infection uses the bacterium silhouette, retains keyboard access and has no action button', () => {
  const { run, listeners } = game();
  for (const mobile of [false, true]) {
    run(`mobileControls=${mobile}; startGame(GameMode.NORMAL);
      targetBacteria=makeBacteria(800,450,.9,.2,1); attachCandidate=targetBacteria;
      attachPose=getDockPose(player,targetBacteria); attachPose.start={...player};`);
    for (const phase of ['SEARCH', 'ADSORPTION', 'INJECTION']) {
      run(`setState(State.${phase}); beginUiFrame(); drawHud();`);
      assert.equal(run('uiButtons.some(b=>b.id==="action")'), false);
      assert.equal(run('semanticFrame.some(b=>b.id==="action")'), true);
    }
    run(`{ const p=infectionScreenEntity(targetBacteria); handleInfectionPointerDown(p,7); }
      injectionProgress=0; updateInjection(.5,isActionHeld());`);
    const progress=run('injectionProgress');
    assert.ok(progress>0);
    listeners['game:pointerup']({pointerId:7});
    assert.equal(run('infectionPointer'), null);
    run('updateInjection(.5,isActionHeld());');
    assert.equal(run('injectionProgress'), progress);
  }
});

test('fullscreen button hides while fullscreen is active and returns after leaving on desktop and mobile', () => {
  const { run, nodes, sandbox, listeners } = game();
  let hidden=false;
  nodes.fullscreenButton.classList.toggle=(name,value)=>{ if(name==='hidden') hidden=value; };
  for(const mobile of [0,1]) {
    sandbox.navigator.maxTouchPoints=mobile;
    for(const property of ['fullscreenElement','webkitFullscreenElement']) {
      sandbox.document[property]={};
      listeners['document:'+ (property==='fullscreenElement'?'fullscreenchange':'webkitfullscreenchange')]();
      assert.equal(hidden,true);
      sandbox.document[property]=null;
      run('resizeCanvasToViewport();');
      assert.equal(hidden,false);
    }
  }
});

test('silhouette halos use fixed screen blur and reuse bounded per-asset rasters', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    const glow=silhouetteGlows.head;
    const small=getScreenGlow(glow,40,60);
    const again=getScreenGlow(glow,40,60);
    const large=getScreenGlow(glow,400,600);
    return small===again && small.image.width-40===large.image.width-400
      && small.image.height-60===large.image.height-600 && glow.cached===large;
  })()`), true);
});

test('combo popup grows to ten, fades in half a second and stays faded during boost', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL); registerBubblePop();
    const first=getBubbleMultiplierVisual(); updateBubbleEnergy(0.25);
    if(Math.abs(getBubbleMultiplierVisual().alpha-0.5)>1e-8) return false;
    updateBubbleEnergy(0.25); if(getBubbleMultiplierVisual().alpha!==0) return false;
    for(let i=0;i<12;i++) registerBubblePop();
    const max=getBubbleMultiplierVisual();
    if(max.count!==10 || max.size<=first.size || max.alpha!==1) return false;
    updateBubbleEnergy(4); registerBubblePop();
    if(getBubbleMultiplierVisual().count!==10 || getBubbleMultiplierVisual().alpha!==0 || bubbleStats.energy!==ENERGY_SECONDS-4) return false;
    updateBubbleEnergy(ENERGY_SECONDS);registerBubblePop();
    return bubbleStats.combo===1 && getBubbleMultiplierVisual().alpha===1;
  })()`),true);
});

test('nucleotide caption is outside tray and feedback uses title rather than play area', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    for(const width of [1200,1600,2077]) {
      W=width; updateViewportSafeArea();
      const l=getNucleotideLayout();
      if(l.trayTitleY>=l.trayY || l.nucY<=l.trayY || l.nucY>=l.trayY+l.trayH) return false;
      if(l.trayTitleY-l.trayTitleSize<l.slotsY+l.slotH/2) return false;
    }
    return true;
  })()`),true);
});


test('assembly uses aligned phase sprites and renders a joined phage only once', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    createPhagePartsFromDna({id:1});
    const head=assembly.activeParts.find(p=>p.kind==='head');
    const body=assembly.activeParts.find(p=>p.kind==='body');
    const genome=assembly.activeParts.find(p=>p.kind==='genome');
    const legs=assembly.activeParts.find(p=>p.kind==='legs');
    genome.x=head.x; genome.y=head.y; trySnapParts();
    const first=getPartAppearance(head);
    if(!assembly.packed || first.key!=='phagePhase1' || assembly.activeParts.includes(genome)) return false;
    head.x=body.x; head.y=body.y; trySnapParts();
    const second=getPartAppearance(body);
    if(!assembly.joining.headBody || getPartAppearance(head)!==null || second.key!=='phagePhase2') return false;
    // Both phases use the same full-canvas origin relative to the visible head.
    if(Math.abs(second.y-(head.y+(234.5-103)*ASSEMBLY_PHASE_SCALE))>1e-8) return false;
    legs.x=body.x; legs.y=body.y; trySnapParts();
    const complete=assembly.completePhages[0];
    if(assembly.completed!==1 || assembly.activeParts.length || complete.x!==second.x || complete.y!==second.y) return false;
    const original=drawImageCenter, keys=[];
    drawImageCenter=(image)=>keys.push(image);
    drawConstructedPhages(); drawImageCenter=original;
    return keys.length===1 && keys[0]===img.phagePhase3;
  })()`),true);
});


test('bubble debris stays in world space and renders bubble sprites through camera zoom', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL); particles=[];
    spawnBubblePop(700,450,60);
    if(!particles.length || particles.some(p=>p.kind!=='bubble' || p.space!=='world')) return false;
    const p=particles[0], worldX=p.x, worldY=p.y;
    const draws=[], original=ctx.drawImage;
    ctx.drawImage=(...args)=>draws.push(args);
    camera={x:100,y:50,zoom:1}; drawParticles();
    const first=draws[0]; draws.length=0;
    camera={x:200,y:80,zoom:2}; drawParticles();
    const next=draws[0]; ctx.drawImage=original;
    if(p.x!==worldX || p.y!==worldY || first[0]!==glowSprites.bubble || next[0]!==glowSprites.bubble) return false;
    if(Math.abs(next[1]-(first[1]-100)*2)>1e-8 || Math.abs(next[2]-(first[2]-30)*2)>1e-8 || next[3]!==first[3]*2) return false;
    for(let i=0;i<100;i++) spawnBubblePop(700,450,80);
    if(particles.length>QUALITY.particlesMax) return false;
    updateParticles(1); return particles.length===0;
  })()`),true);
});


test('constructed swimmers animate all three leg frames while preserving position and rotation', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    assembly.completePhages=[{x:700,y:400,rotation:0.7,swimAge:1}];
    const original=drawPhageFrame, frames=[];
    drawPhageFrame=(x,y,scale,rotation,frame)=>frames.push({x,y,scale,rotation,frame});
    for(const t of [0,0.09,0.18]) {worldTime=t;drawConstructedPhages();}
    drawPhageFrame=original;
    return frames.map(f=>f.frame).join()==='0,1,2' && frames.every(f=>f.x===700 && f.y===400 && f.rotation===0.7 && f.scale===ASSEMBLY_PHASE_SCALE);
  })()`),true);
});

test('player swim sound shares the leg cycle clock, includes inertia and stops on docking', () => {
  const sounds=[], stops=[];
  const { run } = game({play:(name,options)=>sounds.push({name,options}),stop:name=>stops.push(name),loop(){},stopAll(){},menuOpen:false});
  run('startGame(GameMode.NORMAL); player.vx=100; player.vy=0; player.collisionTimer=0;');sounds.length=0;
  run('player.animTime=0;updateSoundEffects(false);player.animTime=0.09;updateSoundEffects(false);player.animTime=0.18;updateSoundEffects(false);');
  assert.equal(sounds.filter(s=>s.name==='fago_nadar').length,1);
  run('player.animTime=0.251;updateSoundEffects(false);');
  const swim=sounds.filter(s=>s.name==='fago_nadar');assert.equal(swim.length,2);
  assert.equal(swim[0].options.duration,0.16);
  run('state=State.ADSORPTION;updateSoundEffects(false);');
  assert.deepEqual(stops.filter(name=>name==='fago_nadar'),['fago_nadar']);
  run('state=State.SEARCH;player.vx=0;player.vy=0;player.animTime=1;updateSoundEffects(false);');
  assert.equal(sounds.filter(s=>s.name==='fago_nadar').length,2);
});

test('all infection skins share one full-canvas transform including interior and final fragments', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    const keys=['bacteriaInside',...Array.from({length:6},(_,i)=>'bacteriaOutside'+(i+1))];
    const original=drawImageCenter, draws=[];
    drawImageCenter=(image,x,y,scale,rotation)=>draws.push({x,y,scale,rotation});
    for(const key of keys) {
      if(!ASSETS[key].includes('/new_size/')) return false;
      img[key]={width:1001,height:535};
      drawBacteriaSkin(key,700,450,1.45,0.6);
    }
    drawImageCenter=original;
    return draws.length===7 && draws.every(d=>d.x===700 && d.y===450 && d.scale===1.45 && d.rotation===0.6);
  })()`),true);
});

test('background infection phases preserve their shared scale instead of fitting each damaged silhouette', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    const original=drawDepthImage, draws=[];
    drawDepthImage=(key,x,y,scale,rotation)=>draws.push({x,y,scale,rotation});
    const cell={layer:1,x:700,y:400,diameter:106,rotation:0.7,alpha:0.22};
    for(let i=1;i<=6;i++) {
      img['bacteriaOutside'+i]={width:1001,height:535};
      drawBackgroundSlot('bacteriaOutside'+i,cell);
    }
    drawDepthImage=original;
    return draws.every(d=>d.x===draws[0].x && d.y===draws[0].y && d.scale===106/805 && d.rotation===0.7);
  })()`),true);
});


test('every assembly stage highlights its movable source then only its destination while held', () => {
  const { run } = game();
  assert.equal(run(`(() => {
    createPhagePartsFromDna({id:1});
    const original=drawSilhouetteGlow;
    const glows=[]; drawSilhouetteGlow=key=>glows.push(key);
    const stages=[
      {packed:false,joined:false,source:'genome',idle:'dnaComplete',target:'head'},
      {packed:true,joined:false,source:'head',idle:'phagePhase1',target:'body'},
      {packed:true,joined:true,source:'body',idle:'phagePhase2',target:'legs'},
    ];
    for(const stage of stages) {
      assembly.packed=stage.packed; assembly.joining.headBody=stage.joined;
      dragItem=null; glows.length=0;
      for(const p of assembly.activeParts) drawPart(p);
      if(glows.join()!==stage.idle) return false;
      dragItem=assembly.activeParts.find(p=>p.kind===stage.source);glows.length=0;
      for(const p of assembly.activeParts) drawPart(p);
      if(glows.join()!==stage.target) return false;
      dragItem=null;glows.length=0;
      for(const p of assembly.activeParts) drawPart(p);
      if(glows.join()!==stage.idle) return false;
    }
    drawSilhouetteGlow=original;return true;
  })()`),true);
});

test('joined phage can be picked by its head without jumping and dragged onto fibres to complete', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    setState(State.PART_ASSEMBLY);createPhagePartsFromDna({id:1});
    const head=assembly.activeParts.find(p=>p.kind==='head');
    const body=assembly.activeParts.find(p=>p.kind==='body');
    const genome=assembly.activeParts.find(p=>p.kind==='genome');
    const legs=assembly.activeParts.find(p=>p.kind==='legs');
    genome.x=head.x;genome.y=head.y;trySnapParts();
    head.x=body.x;head.y=body.y;trySnapParts();
    const x=body.x,y=body.y;
    mouse.x=head.x;mouse.y=head.y-20;mouse.justDown=true;mouse.down=true;
    updatePartAssembly(0);
    if(dragItem!==body || body.x!==x || body.y!==y) return false;
    mouse.justDown=false;
    mouse.x=legs.x-body.grabOffsetX;mouse.y=legs.y-body.grabOffsetY;
    updatePartAssembly(0);
    mouse.down=false;mouse.justUp=true;updatePartAssembly(0);
    return assembly.completed===1 && assembly.activeParts.length===0 && dragItem===null;
  })()`),true);
});


test('all loaded sprites are WebP, including both nucleotide slots and draggable pieces', () => {
  const {run}=game();
  assert.equal(run(`Object.values(ASSETS).every(path=>path.startsWith('assets_webp/') && path.endsWith('.webp'))`),true);
  assert.equal(run(`['A','T','C','G'].every(code=>getNucleotideImage(code)===img['nuc'+code] && ASSETS['nuc'+code].endsWith('.webp'))`),true);
  assert.equal(run(`ASSETS.bg7==='assets_webp/Bacteria_Background_7.webp'&&ASSETS.clock==='assets_webp/clock.webp'`),true);
  assert.ok(fs.existsSync(require('node:path').join(__dirname, '../assets_webp/clock.webp')));
});

test('hard-mode score uses large bacteria and clock icons without a background card', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    img.bg7={width:232,height:284};img.clock={width:512,height:512};
    const images=[],labels=[];let panels=0;
    ctx.drawImage=image=>images.push(image);
    drawText=(text)=>labels.push(text);
    drawPanel=()=>panels++;
    score=123;hardModeElapsed=9000;drawHardModeHud();
    return images[0]===img.bg7&&images[1]===img.clock&&labels[0]==='123'&&labels[1]==='9:51'&&panels===0;
  })()`),true);
});

test('biosynthesis progress is below the cell and above the footer explanation', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    const original=drawProgress, bars=[];
    drawProgress=(x,y,w,h)=>bars.push({x,y,w,h});
    drawBiosynthesis();drawProgress=original;
    return bars.length===1 && bars[0].y>750 && bars[0].y+bars[0].h<safeBottom(0,48)-25;
  })()`),true);
});

test('new games reseed every world layer; revisits and cycle resets keep the same world', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    Math.random=()=>.25;
    startGame(GameMode.NORMAL);
    const firstSeed=worldSeed;
    const snapshot=()=>JSON.stringify([...bacteriaField,...cellField].map(b=>[b.id,b.x,b.y,b.seed,b.variant,b.sprite]).sort());
    const first=snapshot();
    const background=JSON.stringify(PARALLAX_LAYERS.map((_,i)=>getBackgroundCells(i)));
    player.x=100000;player.y=-100000;updateProceduralBacteriaIfNeeded(true);
    resetCycleState(50,50,.65);cellField=[];updateProceduralBacteriaIfNeeded(true);
    if(worldSeed!==firstSeed || snapshot()!==first) return false;
    resetGame();
    Math.random=()=>.75;
    startGame(GameMode.HARD);
    if(worldSeed===firstSeed || snapshot()===first) return false;
    if(JSON.stringify(PARALLAX_LAYERS.map((_,i)=>getBackgroundCells(i)))===background) return false;
    if(ambientLife.some(scene=>scene && scene.seed!==makeBackgroundCell(scene.layer,...scene.cellId.split(':').slice(1).map(Number)).seed)) return false;
    const secondSeed=worldSeed;
    resetGame();startGame(GameMode.NORMAL);
    return worldSeed!==secondSeed;
  })()`),true);
});

test('world blocks contain exactly half cells, one quarter healthy and one quarter damaged bacteria', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    for(let gx=-80;gx<80;gx+=2) for(let gy=-80;gy<80;gy+=2) {
      const kinds=[worldSlotKind(gx,gy),worldSlotKind(gx+1,gy),worldSlotKind(gx,gy+1),worldSlotKind(gx+1,gy+1)];
      if(kinds.filter(k=>k==='cell').length!==2 || kinds.filter(k=>k==='healthy').length!==1 || kinds.filter(k=>k==='broken').length!==1) return false;
    }
    let cells=0,healthy=0,broken=0;
    for(let i=0;i<100;i++) {
      player.x=i*7911;player.y=-i*6177;updateProceduralBacteriaIfNeeded(true);
      cells+=cellField.length;healthy+=bacteriaField.filter(isBacteriaInteractable).length;broken+=bacteriaField.filter(b=>!isBacteriaInteractable(b)).length;
      if(cellField.length+bacteriaField.length>49) return false;
    }
    const total=cells+healthy+broken;
    return Math.abs(cells/total-.5)<.04 && Math.abs(healthy/total-.25)<.04 && Math.abs(broken/total-.25)<.04;
  })()`),true);
});

test('cell types have information, controlled sizes, three WebP variants and cannot be infected', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    for(const type of FOREGROUND_CELL_TYPES) for(let variant=0;variant<3;variant++) {
      const cell=makeWorldCell(type,800,450,variant);
      if(isBacteriaInteractable(cell) || cell.diameter<90 || cell.diameter>670) return false;
      if(!cellEncounterText(cell).includes(WORLD_CELL_TYPES[type].name) || !cellEncounterText(cell).includes('No puedes infectar')) return false;
      if(!ASSETS[cell.sprite].endsWith('.webp') || !collisionShape(cell.sprite)) return false;
      if(cell.movable!==(type==='plaqueta')) return false;
    }
    return !FOREGROUND_CELL_TYPES.includes('bacilo') && !FOREGROUND_CELL_TYPES.includes('espirilo') && WORLD_SPRITES.length===30;
  })()`),true);
});

test('alpha contacts preserve a platelet concavity even after rotating the sprite', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    const shape=collisionShape('cell_plaqueta_01');
    if(shape.width!==512 || signedSpriteDistance(shape,335,47)<70 || signedSpriteDistance(shape,268,257)>-20) return false;
    const entity={sprite:'cell_plaqueta_01',x:800,y:450,rotation:1.17,scale:1};
    const point=localToWorld(entity.x,entity.y,entity.rotation,335-256,47-256);
    const contact=spriteSurface(entity,point);
    return Math.abs(contact.distance-signedSpriteDistance(shape,335,47))<1e-6 && Math.abs(Math.hypot(contact.normal.x,contact.normal.y)-1)<1e-6;
  })()`),true);
});

test('platelets receive player impulse, drift with drag, and persist only in the active neighbourhood', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);bacteriaField=[];
    const cell=makeWorldCell('plaqueta',800,450,0);cellField=[cell];
    player.x=760;player.y=450;player.rotation=Math.PI/2;player.vx=200;player.vy=0;
    const oldX=cell.x;resolveBacteriaPhysics();
    if(cell.vx<=0 || cell.x<=oldX || player.vx>=200 || !toastMessage.includes('Plaqueta')) return false;
    const vx=cell.vx,x=cell.x;updateWorldCells(.1);
    if(cell.vx>=vx || cell.x<=x) return false;
    player.x=330;player.y=470;updateProceduralBacteriaIfNeeded(true);
    const retained=cellField[0];if(!retained) return false;
    retained.x+=5;updateProceduralBacteriaIfNeeded(true);
    if(!cellField.includes(retained)) return false;
    player.x=90000;player.y=90000;updateProceduralBacteriaIfNeeded(true);
    return !cellField.includes(retained) && cellField.length+bacteriaField.length<=49;
  })()`),true);
});

test('background retains old diversity, adds every new family and keeps ambient infections off human cells', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    const seen=new Set();
    for(let i=0;i<50;i++) {
      camera.x=i*1937;camera.y=-i*647;
      for(let layer=0;layer<3;layer++) for(const cell of getBackgroundCells(layer)) seen.add(cell.key);
      updateAmbientLife(0);
      for(const scene of ambientLife) if(scene && (scene.kind==='cell' || scene.key.startsWith('cell_'))) return false;
    }
    for(let i=1;i<=8;i++) if(!seen.has('bg'+i)) return false;
    for(const type of Object.keys(WORLD_CELL_TYPES)) if(![...seen].some(key=>key.startsWith('cell_'+type+'_'))) return false;
    return true;
  })()`),true);
});

test('incompatible world objects use red silhouette glow, and the active stage is more than twice the others', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    if(silhouetteGlows.cell_plaqueta_01.color!=='#ff3535' || silhouetteGlows.bacteriaOutside6.color!=='#ff3535') return false;
    const original=drawImageCenter,scales=[];
    drawImageCenter=(image,x,y,scale)=>{if([img.stage0,img.stage1,img.stage2,img.stage3,img.stage4,img.stage5].includes(image))scales.push(scale);};
    drawStageIcons(3,'Replicación');drawImageCenter=original;
    return scales.length===6 && scales[2]>scales[0]*2 && scales.filter(s=>s===scales[2]).length===1;
  })()`),true);
});

test('compass renders a bacterium icon and points only toward a compatible target', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);attachCandidate=null;
    bacteriaField=[makeBacteria(player.x+800,player.y+600,.8,0,1),makeBacteria(player.x-100,player.y,.8,0,6)];
    const originalImage=drawImageCenter,originalSkin=drawBacteriaSkin,originalText=drawTextCentered;
    const icons=[],arrows=[],texts=[];
    drawImageCenter=(image,x,y,scale,rotation)=>{if(image===img.arrow)arrows.push(rotation);};
    drawBacteriaSkin=(key)=>icons.push(key);drawTextCentered=text=>texts.push(text);
    drawHud();drawImageCenter=originalImage;drawBacteriaSkin=originalSkin;drawTextCentered=originalText;
    return icons.includes('bacteriaOutside1') && arrows.some(a=>Math.abs(a-Math.atan2(600,800))<1e-8) && !texts.includes('Bacteria compatible');
  })()`),true);
});

test('world sprites spawn without overlapping and the player begins in clear water', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL);
    for(const object of [...bacteriaField,...cellField]) for(const probe of getPlayerCollisionProbes()) if(spriteSurface(object,probe).distance<probe.r) return false;
    for(let i=0;i<50;i++) {
      player.x=i*5917;player.y=-i*6177;updateProceduralBacteriaIfNeeded(true);
      const objects=[...bacteriaField,...cellField];
      for(let j=0;j<objects.length;j++) for(let k=j+1;k<objects.length;k++) {
        const a=objects[j],b=objects[k];
        const ra=collisionShape(a.sprite || 'bacteriaOutside'+a.variant).radius*a.scale;
        const rb=collisionShape(b.sprite || 'bacteriaOutside'+b.variant).radius*b.scale;
        if(Math.hypot(a.x-b.x,a.y-b.y)<ra+rb+5) return false;
      }
    }
    return true;
  })()`),true);
});

test('pushing a platelet keeps leg frames and swim audio running without repeating the collision sound', () => {
  const sounds=[];
  const {run}=game({play:name=>sounds.push(name),loop(){},stop(){},stopAll(){},menuOpen:false});
  run(`startGame(GameMode.NORMAL);bacteriaField=[];
    cellField=[makeWorldCell('plaqueta',800,450,0)];
    player.x=760;player.y=450;player.rotation=Math.PI/2;player.vx=200;player.vy=0;
    keys.add('ArrowRight');resolveBacteriaPhysics();`);
  assert.equal(run('player.collisionTimer'),0);
  assert.ok(run('cellField[0].vx')>0);
  sounds.length=0;
  const frames=[];
  for(const time of [0,0.09,0.18,0.251]) {
    run(`player.animTime=${time};registerWorldContact(cellField[0]);updateSoundEffects(false);`);
    frames.push(run('getPlayerFrameIndex()'));
  }
  assert.deepEqual(frames,[0,1,2,0]);
  assert.equal(sounds.filter(s=>s==='fago_nadar').length,2);
  assert.equal(sounds.filter(s=>s==='choque_suave').length,0);
  run(`registerWorldContact(makeWorldCell('eritrocito',800,450,0));`);
  assert.equal(run('getPlayerFrameIndex()'),3);
  const before=sounds.filter(s=>s==='fago_nadar').length;
  run('updateSoundEffects(false);');
  assert.equal(sounds.filter(s=>s==='fago_nadar').length,before);
});

test('macrophages never spawn, draw or capture in easy mode and reset between runs', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL); macrophageGrace=0;
    for(let i=0;i<600;i++) updateMacrophages(1/60);
    if(macrophages.length || spawnMacrophage()) return false;
    captureByMacrophage(makeMacrophage(player.x,player.y));
    if(state!==State.SEARCH) return false;
    startGame(GameMode.HARD);macrophages=[makeMacrophage(800,0)];
    startGame(GameMode.NORMAL);
    return macrophages.length===0 && macrophageGameOver===null;
  })()`),true);
});

test('hard mode spawns at most one macrophage in clear space away from the player', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);
    for(let i=0;i<300;i++) updateMacrophages(1/60);
    if(macrophages.length!==1) return false;
    const e=macrophages[0];
    return Math.hypot(e.x-player.x,e.y-player.y)>600 && macrophageClearance(e)>=40 && !spawnMacrophage() && !isBacteriaInteractable(e);
  })()`),true);
});

test('macrophage chases nearby players, uses hysteresis and abandons a distant target', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(0,0);macrophages=[e];player.x=600;player.y=0;
    updateMacrophages(.02);if(e.mode!=='chase') return false;
    for(let i=0;i<60;i++){player.x=e.x+900;updateMacrophages(1/60);}
    if(e.mode!=='chase' || e.lost!==0 || e.x===0) return false;
    for(let i=0;i<150;i++){player.x=e.x+1250;updateMacrophages(1/60);}
    return e.mode==='return' && e.cooldown>0 && Math.hypot(e.vx,e.vy)<MAX_SPEED;
  })()`),true);
});

test('a stationary fago in the cup receives warning before sustained capture and game over', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(0,0);macrophages=[e];
    const mouth=macrophageMouth(e);player.x=mouth.x;player.y=mouth.y;player.rotation=0;
    let warned=false,warningFrames=0;
    for(let i=0;i<240 && state===State.SEARCH;i++) {
      updateMacrophages(1/60);
      if(e.mode==='windup') {warned=true;warningFrames++;}
    }
    return warned && warningFrames>=55 && state===State.GAME_OVER && macrophageGameOver.enemy===e;
  })()`),true);
});

test('escaping sideways during the warning avoids capture and the attacker recovers', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(0,0);macrophages=[e];changeMacrophageMode(e,'windup');
    const rotation=e.rotation;player.x=150;player.y=400;
    for(let i=0;i<120;i++) updateMacrophages(1/60);
    return state===State.SEARCH && e.mode==='recover' && Math.abs(e.rotation-rotation)<=MACROPHAGE.turnSpeed*0.35*MACROPHAGE.windupSeconds+1e-6 && e.capture===0;
  })()`),true);
});

test('brief cup contact and membrane contact do not count as sustained capture', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(0,0);macrophages=[e];changeMacrophageMode(e,'close');
    const mouth=macrophageMouth(e);player.x=mouth.x;player.y=mouth.y;
    updateMacrophages(.08);if(state!==State.SEARCH) return false;
    player.x=mouth.x;player.y=400;updateMacrophages(.2);
    if(e.capture!==0) return false;
    player.x=mouth.x;player.y=mouth.y;updateMacrophages(.08);
    if(state!==State.SEARCH) return false;
    changeMacrophageMode(e,'close');player.x=-160;player.y=0;
    for(let i=0;i<45;i++) updateMacrophages(1/60);
    return state===State.SEARCH && e.mode==='recover';
  })()`),true);
});

test('infection, all minigames and escape freeze enemies and grant flight protection', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];
    const e=makeMacrophage(0,0);macrophages=[e];
    for(const phase of [State.ADSORPTION,State.INJECTION,State.DNA_REPLICATION,State.NUCLEOTIDE_MINIGAME,State.BIOSYNTHESIS,State.PART_ASSEMBLY,State.LYSIS,State.ESCAPE]) {
      state=phase;changeMacrophageMode(e,'close');e.capture=.23;
      updateMacrophages(.1);
      if(state!==phase || e.capture!==0 || e.x!==0 || e.y!==0 || macrophageGrace!==MACROPHAGE.graceSeconds) return false;
    }
    setState(State.SEARCH);changeMacrophageMode(e,'close');
    const mouth=macrophageMouth(e);player.x=mouth.x;player.y=mouth.y;
    for(let i=0;i<120;i++) updateMacrophages(1/60);
    return state===State.SEARCH && macrophageGrace>0;
  })()`),true);
});

test('macrophages navigate around the protected bacterium without passing through its silhouette', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);cellField=[];
    bacteriaField=[makeBacteria(700,0,.7,0,1)];targetBacteria=bacteriaField[0];
    const e=makeMacrophage(0,0);
    for(let i=0;i<1800;i++) {
      moveMacrophage(e,Math.atan2(-e.y,1600-e.x),MACROPHAGE.chaseSpeed,1/60);
      if(macrophageClearance(e,true)<0) return false;
    }
    return e.x>1100;
  })()`),true);
});

test('pause freezes warning and closure rather than advancing to a surprise capture', () => {
  const {run,sandbox}=game();
  run(`startGame(GameMode.HARD);macrophageGrace=0;macrophages=[makeMacrophage(0,0)];changeMacrophageMode(macrophages[0],'windup');macrophages[0].elapsed=.5;`);
  sandbox.document.hidden=true;
  run('loop(16);');sandbox.now+=120000;run('loop(32);');
  assert.equal(run('macrophages[0].elapsed'),.5);
  assert.equal(run('state'), 'search');
});

test('game over freezes gameplay, supports touch return and automatically returns to the menu', () => {
  for(const mobile of [false,true]) {
    const {run}=game();
    assert.equal(run(`(() => {
      startGame(GameMode.HARD);mobileControls=${mobile};macrophageGrace=0;
      const e=makeMacrophage(player.x-150,player.y);macrophages=[e];score=225;kills=2;
      captureByMacrophage(e);stateTime=1;render(0);
      const button=uiButtons.find(b=>b.id==='game-over-menu');
      if(state!==State.GAME_OVER || !button || touchControls.actionDown) return false;
      const x=player.x;update(.033,true,20);
      if(player.x!==x || score!==225 || kills!==2) return false;
      handleUiPointerDown({x:button.x+20,y:button.y+20},10);
      if(state!==State.INTRO || macrophages.length || macrophageGameOver) return false;
      startGame(GameMode.HARD);macrophageGrace=0;captureByMacrophage(makeMacrophage(0,0));
      stateTime=MACROPHAGE.menuSeconds;update(.016,false,0);
      return state===State.INTRO && gameMode===GameMode.NORMAL && macrophages.length===0;
    })()`),true);
  }
});

test('macrophage frames share an untrimmed canvas and have precomputed alpha collision fields', () => {
  const {run}=game();
  assert.equal(run(`['idle','reach','closed'].every(phase=>{
    const key='macrofago_'+phase, shape=collisionShape(key);
    return ASSETS[key].endsWith('.webp') && shape && shape.width===1254 && shape.height===1254 && shape.points.length>0;
  })`),true);
});

test('patrolling and chasing macrophages push cells and healthy or broken bacteria with bounded speed', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    for(const speed of [MACROPHAGE.patrolSpeed,MACROPHAGE.chaseSpeed]) for(const kind of ['healthy','broken','plaqueta','celula_animal']) {
      startGame(GameMode.HARD);bacteriaField=[];cellField=[];targetBacteria=null;
      const body=kind==='healthy'||kind==='broken'?makeBacteria(550,0,.7,0,kind==='healthy'?1:3,kind,100):makeWorldCell(kind,550,0,100);
      body.rotation=0;
      if(body.kind==='cell') cellField=[body];else bacteriaField=[body];
      const start=body.x,e=makeMacrophage(150,0);
      for(let i=0;i<420;i++){moveMacrophage(e,0,speed,1/60);updateWorldCells(1/60);}
      if(!body.enemyMovable || body.x<start+35 || e.x<40 || Math.hypot(body.vx,body.vy)>(body.movable?240:90) || macrophageClearance(e)<-22) return false;
    }
    return true;
  })()`),true);
});

test('the infection target is anchored even when the macrophage pushes or another body hits it', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);cellField=[];
    const target=makeBacteria(550,0,.7,0,1),pusher=makeBacteria(0,0,.7,0,1);
    bacteriaField=[target,pusher];targetBacteria=target;
    pusher.enemyMovable=true;pusher.vx=90;pusher.vy=0;pusher.spin=0;
    const e=makeMacrophage(0,0);
    for(let i=0;i<240;i++){pushMacrophageObjects(e,0,1/60);updateWorldCells(1/60);}
    return target.x===550 && target.y===0 && !target.enemyMovable && !target.vx;
  })()`),true);
});

test('pushing transfers motion through neighbouring bodies and their positions survive world refresh', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);cellField=[];targetBacteria=null;
    const first=makeBacteria(550,0,.7,0,1),second=makeBacteria(1150,0,.7,0,3,'broken');
    bacteriaField=[first,second];const e=makeMacrophage(0,0);
    for(let i=0;i<900;i++){moveMacrophage(e,0,MACROPHAGE.chaseSpeed,1/60);updateWorldCells(1/60);}
    if(first.x<=650 || second.x<=1170 || !second.enemyMovable) return false;
    startGame(GameMode.HARD);
    const b=bacteriaField.find(body=>Math.hypot(body.x-player.x,body.y-player.y)<ACTIVE_RADIUS);
    b.x+=120;b.rotation+=.2;const x=b.x,rotation=b.rotation;
    updateProceduralBacteriaIfNeeded(true);
    const kept=bacteriaField.find(body=>body.seed===b.seed);
    return kept===b && kept.x===x && kept.rotation===rotation;
  })()`),true);
});

test('finishing a cycle keeps the pushed bacterium remains at their actual world position', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.HARD);targetBacteria=bacteriaField.find(isBacteriaInteractable);
    targetBacteria.x+=130;targetBacteria.y+=50;
    const b=targetBacteria,x=b.x,y=b.y;
    b.variant=6;b.healthy=false;b.infectable=false;b.health='broken';infectedBacteriaIds.add(b.id);
    escape={hero:{x:x+300,y,vx:50,vy:0,rotation:0}};
    returnToFlightAfterKill();
    const kept=bacteriaField.find(body=>body.seed===b.seed);
    return kept===b && kept.x===x && kept.y===y && !isBacteriaInteractable(kept);
  })()`),true);
});

test('simulation, movement and hard clock agree at 20, 30, 60 and 120 FPS', () => {
  const snapshots=[];
  for(const fps of [20,30,60,120]) {
    const {run}=game();
    run('startGame(GameMode.HARD); keys.add("w"); worldTime=0;');
    for(let i=1;i<=fps;i++) run(`loop(${i*1000/fps})`);
    snapshots.push(JSON.parse(run('JSON.stringify({time:worldTime,clock:hardModeElapsed,x:player.x,y:player.y})')));
  }
  for(const value of snapshots) {
    assert.ok(Math.abs(value.time-1)<1e-9);
    assert.ok(Math.abs(value.clock-1000)<1e-6);
    assert.deepEqual(value,snapshots[0]);
  }
});

test('long stalls cap both clocks and returning from a 30 second pause does not catch up', () => {
  const {run,sandbox,listeners}=game();
  run('startGame(GameMode.HARD);worldTime=0;loop(500);');
  assert.ok(Math.abs(run('worldTime')-.25)<1e-9);
  assert.ok(Math.abs(run('hardModeElapsed')-250)<1e-6);
  sandbox.document.hidden=true;listeners['document:visibilitychange']();
  sandbox.now+=30000;sandbox.document.hidden=false;listeners['document:visibilitychange']();
  run('loop(30500);');
  assert.ok(Math.abs(run('worldTime')-.25)<1e-9);
  run('loop(30517);');
  assert.ok(Math.abs(run('worldTime')-(.25+1/60))<1e-9);
});

test('camera smoothing and velocity damping use elapsed time in direct updates', () => {
  const values=[];
  for(const fps of [30,60,120]) {
    const {run}=game();
    values.push(run(`(()=>{startGame(GameMode.NORMAL);bacteriaField=[];cellField=[];currentProcCell={x:0,y:0};
      camera.x=-1000;particles=[{life:2,x:0,y:0,vx:100,vy:100}];
      for(let i=0;i<${fps};i++){updateSearch(1/${fps});updateParticles(1/${fps});}
      return [camera.x,particles[0].vx];})()`));
  }
  for(const v of values) for(let i=0;i<2;i++) assert.ok(Math.abs(v[i]-values[0][i])<1e-8);
});

function dragFixture() {
  const instance=game();
  instance.run('setState(State.PART_ASSEMBLY);const item=makePart("genome",W/2,450);let drops=0;');
  const event=(pointerId,x=800,y=450)=>({pointerId,clientX:x*.8,clientY:y*.8,preventDefault(){}});
  instance.listeners['game:pointerdown'](event(1));
  instance.run('handleDrag([item],()=>drops++);mouse.justDown=false;');
  return {...instance,event};
}

test('catch minigame moves the basket by pointer delta from anywhere in the playfield', () => {
  const {run,listeners,nodes}=game();
  const captured=[];
  nodes.game.setPointerCapture=pointerId=>captured.push(pointerId);
  run('nucleotideGame=createNucleotideGame({minigameType:"catch"});state=State.NUCLEOTIDE_MINIGAME;');
  const initial=run('nucleotideGame.basketX');
  const event=(pointerId,x,y,pointerType)=>({pointerId,pointerType,clientX:x*.8,clientY:y*.8,preventDefault(){}});

  listeners['game:pointerdown'](event(7,180,820,'touch'));
  assert.deepEqual(captured,[7]);
  assert.equal(run('nucleotideGame.basketX'),initial,'starting a drag far from the basket must not teleport it');
  listeners['game:pointermove'](event(7,230,40,'touch'));
  assert.equal(run('nucleotideGame.basketX'),initial+50,'vertical movement does not affect the horizontal delta');

  listeners['game:pointerdown'](event(8,1420,500,'touch'));
  listeners['game:pointermove'](event(8,1500,500,'touch'));
  assert.equal(run('nucleotideGame.basketX'),initial+50,'a second pointer cannot take over the drag');
  listeners['game:pointermove'](event(7,210,870,'touch'));
  assert.equal(run('nucleotideGame.basketX'),initial+30);
  listeners['game:pointerup'](event(7,210,870,'touch'));
  assert.equal(run('nucleotideGame.catchPointerId'),null);

  listeners['game:pointerdown'](event(9,1320,450,'mouse'));
  assert.deepEqual(captured,[7,9]);
  listeners['game:pointermove'](event(9,1260,450,'mouse'));
  assert.equal(run('nucleotideGame.basketX'),initial-30,'mouse dragging also moves relative to its starting point');
  listeners['game:pointercancel'](event(9,1260,450,'mouse'));
  assert.equal(run('nucleotideGame.catchPointerLastX'),null);
});

test('a second finger cannot replace, move, drop or cancel the owner drag', () => {
  const {run,listeners,event}=dragFixture();
  listeners['game:pointerdown'](event(2,200,200));
  listeners['game:pointermove'](event(2,300,300));
  listeners['game:pointerup'](event(2,300,300));
  listeners['game:lostpointercapture'](event(2));
  run('handleDrag([item],()=>drops++);');
  assert.equal(run('mouse.pointerId'),1);assert.equal(run('mouse.down'),true);
  assert.equal(run('item.x'),800);assert.equal(run('drops'),0);
  listeners['game:pointermove'](event(1,850,450));
  run('handleDrag([item],()=>drops++);');
  listeners['game:pointerup'](event(1,850,450));
  listeners['game:lostpointercapture'](event(1));
  run('handleDrag([item],()=>drops++);mouse.justUp=false;handleDrag([item],()=>drops++);');
  assert.equal(run('drops'),1);assert.equal(run('dragItem'),null);
});

test('capture loss, cancellation, pause and transitions cancel a drag without placing it', () => {
  for(const reason of ['lostpointercapture','pointercancel','pause','transition']) {
    const {run,listeners,event}=dragFixture();
    listeners['game:pointermove'](event(1,850,450));run('handleDrag([item],()=>drops++);');
    if(reason==='pause') run('clearHeldInputs();');
    else if(reason==='transition') run('setState(State.LYSIS);');
    else listeners[`game:${reason}`](event(1));
    assert.equal(run('item.x'),800,reason);assert.equal(run('item.dragging'),false,reason);
    assert.equal(run('mouse.down'),false);assert.equal(run('mouse.pointerId'),null);assert.equal(run('drops'),0);
  }
});

test('coordinate IDs separate bacteria and cells even when every random seed collides', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    hash2=()=>42;startGame(GameMode.NORMAL);
    const first=bacteriaField.filter(isBacteriaInteractable)[0],second=bacteriaField.filter(isBacteriaInteractable)[1];
    if(first.seed!==second.seed || first.id===second.id) return false;
    infectedBacteriaIds.add(first.id);
    const firstId=first.id,secondId=second.id;
    bacteriaField=[];cellField=[];updateProceduralBacteriaIfNeeded(true);
    return !bacteriaField.find(b=>b.id===firstId).infectable && bacteriaField.find(b=>b.id===secondId).infectable &&
      new Set([...bacteriaField,...cellField].map(b=>b.id)).size===bacteriaField.length+cellField.length;
  })()`),true);
});

test('displaced bacteria, remains, cells and platelets survive by actual position and eventually unload', () => {
  for(const kind of ['healthy','remains','cell','platelet']) {
    const {run}=game();
    assert.equal(run(`(()=>{
      startGame(GameMode.HARD);
      let body=${kind==='healthy'||kind==='remains'?'bacteriaField.find(isBacteriaInteractable)':'cellField[0]'};
      ${kind==='platelet'?"const replacement=makeWorldCell('plaqueta',body.x,body.y,body.seed,body.id);cellField[cellField.indexOf(body)]=replacement;body=replacement;":''}
      const original={x:body.x,y:body.y},id=body.id;
      ${kind==='remains'?"body.variant=6;body.healthy=body.infectable=false;infectedBacteriaIds.add(id);":''}
      body.x=4000;body.y=500;player.x=4000;player.y=500;updateProceduralBacteriaIfNeeded(true);
      if(![...bacteriaField,...cellField].includes(body)) return false;
      player.x=original.x;player.y=original.y;updateProceduralBacteriaIfNeeded(true);
      if([...bacteriaField,...cellField].filter(b=>b.id===id).length!==1) return false;
      player.x=20000;updateProceduralBacteriaIfNeeded(true);
      return ![...bacteriaField,...cellField].includes(body);
    })()`),true,kind);
  }
});

test('fullscreen denial permits landscape play and can be retried successfully', async () => {
  const {run,sandbox}=game();
  sandbox.document.documentElement={requestFullscreen:async()=>{throw Error('denied');}};
  run('mobileControls=true;landscapeReady=true;');
  assert.equal(run('isDisplayBlocked()'),true);
  await run('toggleFullscreen()');
  run('mobileControls=true;');
  assert.equal(run('isDisplayBlocked()'),false);
  sandbox.document.documentElement.requestFullscreen=async()=>{sandbox.document.fullscreenElement={};};
  await run('toggleFullscreen()');
  assert.equal(run('fullscreenDeclined'),false);
  sandbox.document.fullscreenElement=null;
  run('mobileControls=true;');assert.equal(run('requiresFullscreen()'),true);
});

test('loading rejects early starts, retries essential images and tolerates decorative and font errors', async () => {
  const {run,sandbox,nodes}=game();
  run('gameReady=false;for(const key of Object.keys(img)) delete img[key];');
  run('startGame(GameMode.HARD);');assert.equal(run('state'),'intro');
  const requests=[];let failEssential=true;
  sandbox.Image=class {
    constructor(){this.width=this.height=512;}
    set src(url){requests.push(url);queueMicrotask(()=>{
      if(url.includes('Intro_back_V2') || (failEssential && url.includes('DNA_broken'))) this.onerror?.();else this.onload?.();
    });}
  };
  sandbox.document.fonts={load:async()=>{throw Error('font offline');}};
  let frames=0;sandbox.requestAnimationFrame=()=>frames++;
  await run('bootstrapGame()');
  assert.equal(run('gameReady'),false);assert.equal(nodes.normalButton.disabled,true);
  assert.match(nodes.loadingStatus.textContent,/DNA_broken/);assert.equal(frames,0);
  failEssential=false;await run('bootstrapGame()');
  assert.equal(run('gameReady'),true);assert.equal(nodes.normalButton.disabled,false);
  assert.equal(run('img.introBack.fallback'),true);assert.equal(frames,1);
  await run('bootstrapGame()');assert.equal(frames,1);
  assert.ok(requests.every(url=>url.includes('?v='+run('BUILD_VERSION'))));
  run('startGame(GameMode.HARD);');assert.equal(run('state'),'search');
});

test('the enemy collider follows dominant poses and capture waits for a visibly closed cup', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(0,0);macrophages=[e];changeMacrophageMode(e,'close');
    const mouth=macrophageMouth(e);player.x=mouth.x;player.y=mouth.y;
    for(let i=0;i<20;i++) updateMacrophages(1/60);
    if(state!==State.SEARCH || e.sprite!=='macrofago_closed') return false;
    for(let i=0;i<14 && state===State.SEARCH;i++) updateMacrophages(1/60);
    if(state!==State.GAME_OVER || !macrophagePose(e).captureReady) return false;
    changeMacrophageMode(e,'recover');if(e.sprite!=='macrofago_closed') return false;
    state=State.SEARCH;player.y=800;e.elapsed=1.5;updateMacrophages(0);
    return e.sprite==='macrofago_idle';
  })()`),true);
});

test('all macrophage glows are built once with explicit threat color', () => {
  const {run}=game();
  assert.equal(run(`['macrofago_idle','macrofago_reach','macrofago_closed'].every(key=>silhouetteGlows[key]?.color==='#ff3535')`),true);
});

test('bubble regeneration freezes during tab, orientation and sound-panel pauses', () => {
  for(const reason of ['tab','orientation','sound']) {
    const {run,sandbox}=game();
    run('startGame(GameMode.NORMAL);worldTime=0;poppedBubbles.set("test",12);');
    if(reason==='tab') sandbox.document.hidden=true;
    else if(reason==='orientation') run('landscapeReady=false;');
    else run('soundEffects.menuOpen=true;');
    run('loop(16);');sandbox.now+=30000;
    sandbox.document.hidden=false;run('landscapeReady=true;soundEffects.menuOpen=false;loop(30016);');
    assert.equal(run('poppedBubbles.has("test")'),true,reason);
    run('worldTime=12;expirePoppedBubbles();');assert.equal(run('poppedBubbles.has("test")'),false);
  }
});

test('state changes and resets invalidate old pointer and semantic UI before the next render', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);render(0);const stale=semanticNodes.get('movement-mode');
    macrophageGrace=0;captureByMacrophage(makeMacrophage(0,0));
    if(uiButtons.length || semanticNodes.size) return false;
    const mode=desktopMovementMode;
    if(handleUiPointerDown({x:stale.control.x+2,y:stale.control.y+2},1)) return false;
    resetGame();return uiButtons.length===0 && desktopMovementMode===mode;
  })()`),true);
});

test('semantic minigame controls select DNA, match letters and assemble parts with click activation', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.NORMAL);createInitialDnaFromInjection();setState(State.DNA_REPLICATION);render(0);
    for(let i=0;i<4;i++){semanticNodes.get('dna-'+replication.dnaPieces.find(d=>!d.duplicated).id).control.onClick();render(0);}
    for(const dna of replication.dnaPieces) dna.minigameType='drag';
    semanticNodes.get('dna-1').control.onClick();render(0);
    if(state!==State.NUCLEOTIDE_MINIGAME) return false;
    while(state===State.NUCLEOTIDE_MINIGAME) {
      const slot=nucleotideGame.slots.find(s=>!s.filled),si=nucleotideGame.slots.indexOf(slot);
      const ni=nucleotideGame.nucleotides.findIndex(n=>n.code===slot.code);
      semanticNodes.get('nucleotide-'+ni).control.onClick();
      semanticNodes.get('slot-'+si).control.onClick();render(0);
    }
    if(state!==State.BIOSYNTHESIS) return false;
    stateTime=3.1;update(1/60,false,0);render(0);
    for(const [source,destination] of [['genome','head'],['head','body'],['body','legs']]) {
      semanticNodes.get('part-'+source).control.onClick();render(0);
      semanticNodes.get('part-'+destination).control.onClick();render(0);
    }
    return assembly.completed===1 && assembly.activeParts.length===0;
  })()`),true);
});

test('device safe insets translate into canvas coordinates without resetting equal backbuffers', () => {
  const {run,sandbox}=game();
  sandbox.window.getComputedStyle=()=>({paddingLeft:'32px',paddingRight:'20px',paddingTop:'8px',paddingBottom:'12px'});
  run('resizeCanvasToViewport();');
  assert.equal(run('viewportSafe.left'),40);assert.equal(run('viewportSafe.right'),1575);
  assert.equal(run('viewportSafe.top'),10);assert.equal(run('viewportSafe.bottom'),885);
  let resets=0;
  Object.defineProperty(sandbox.document.getElementById('game'),'width',{get:()=>1600,set:()=>resets++});
  run('resizeCanvasToViewport();');assert.equal(resets,0);
});

test('an image timeout ends the attempt and a late load cannot overwrite its result', async () => {
  const {run,sandbox}=game();
  let timeout,image;
  sandbox.setTimeout=callback=>{timeout=callback;return 9;};
  sandbox.Image=class { constructor(){image=this;} set src(value){this.url=value;} };
  const attempt=run('loadImage("assets_webp/Phage_Sprite.webp")');
  const settled=assert.rejects(attempt,/Tiempo de espera agotado/);
  timeout();await settled;
  assert.equal(image.onload,null);assert.equal(image.onerror,null);
});

test('a pointer menu transition does not capture a pointer on the new screen', () => {
  const {run,listeners,nodes}=game();let captures=0;
  nodes.game.setPointerCapture=()=>captures++;
  run('startGame(GameMode.HARD);macrophageGrace=0;captureByMacrophage(makeMacrophage(0,0));stateTime=1;render(0);');
  const button=run('uiButtons.find(b=>b.id==="game-over-menu")');
  listeners['game:pointerdown']({pointerId:1,clientX:(button.x+3)*.8,clientY:(button.y+3)*.8,preventDefault(){}});
  assert.equal(run('state'),'intro');assert.equal(captures,0);
});

test('phase prompts describe adhesion and DNA injection rather than infestation', () => {
  const {run}=game();
  assert.match(run('state=State.SEARCH;actionPromptText()'),/Adherirse/);
  assert.match(run('state=State.ADSORPTION;attachTimer=0;actionPromptText()'),/Adhiriéndose/);
  assert.match(run('attachTimer=DOCK_SECONDS;actionPromptText()'),/iniciar la inyección/);
  assert.match(run('state=State.INJECTION;actionPromptText()'),/inyectar ADN/);
});

test('spawn visibility includes the full rotated image even when its centre is outside', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);camera={x:0,y:0,zoom:1};
    const e=makeMacrophage(W+100,H/2);
    if(isMacrophageOutsideView(e)) return false;
    e.x=W+MACROPHAGE.spawnPadding+280;
    if(!isMacrophageOutsideView(e)) return false;
    e.rotation=Math.PI/4;
    if(isMacrophageOutsideView(e)) return false;
    e.x+=100;
    if(!isMacrophageOutsideView(e)) return false;
    // The same canvas must remain offscreen throughout opening and closing.
    return ['patrol','windup','close','recover'].every(mode=>{
      changeMacrophageMode(e,mode);return isMacrophageOutsideView(e);
    });
  })()`),true);
});

test('every spawn stays outside the camera on tablet, phone and wide screens at different zooms', () => {
  for(const [width,height] of [[1280,720],[1024,768],[844,390],[2560,720]]) {
    const {run,sandbox}=game();
    sandbox.window.innerWidth=width;sandbox.window.innerHeight=height;
    run('resizeCanvasToViewport();startGame(GameMode.HARD);bacteriaField=[];cellField=[];');
    for(const zoom of [.65,1,1.6]) {
      assert.equal(run(`(()=>{
        for(let i=0;i<24;i++) {
          macrophages=[];player.x=i*137-1700;player.y=i*83-900;
          camera={x:player.x-W*(i%2?.35:.7)/${zoom},y:player.y-H*.65/${zoom},zoom:${zoom}};
          if(!spawnMacrophage()) return false;
          const e=macrophages[0],bounds=macrophageScreenBounds(e);
          if(!(bounds.right<=-MACROPHAGE.spawnPadding || bounds.left>=W+MACROPHAGE.spawnPadding || bounds.bottom<=-MACROPHAGE.spawnPadding || bounds.top>=H+MACROPHAGE.spawnPadding)) return false;
          if(Math.hypot(e.x-player.x,e.y-player.y)>=ACTIVE_RADIUS) return false;
        }
        return true;
      })()`),true,`${width}x${height}, zoom ${zoom}`);
    }
  }
});


test('spawn retries instead of placing an enemy inside the view or on an obstacle', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);bacteriaField=[];cellField=[];macrophages=[];
    camera={x:player.x-W/.2,y:player.y-H/.2,zoom:.1};
    if(spawnMacrophage() || macrophages.length) return false;
    camera={x:player.x-W/2,y:player.y-H/2,zoom:1};
    macrophageClearance=()=>-1;
    return !spawnMacrophage() && macrophages.length===0;
  })()`),true);
});

test('the edge warning points at the enemy from the actual player position', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);macrophageGrace=0;
    camera={x:player.x-W*.7,y:player.y-H*.35,zoom:1};
    for(const [dx,dy,edge] of [[650,0,'right'],[-650,0,'left'],[0,650,'bottom'],[0,-650,'top'],[650,-650,'corner']]) {
      macrophages=[makeMacrophage(player.x+dx,player.y+dy)];
      const warning=macrophageEdgeWarning();
      if(!warning || warning.strength<=0 || warning.strength>1) return false;
      if(edge==='right' && (warning.x!==W || Math.abs(warning.y-H*.35)>1e-8)) return false;
      if(edge==='left' && (warning.x!==0 || Math.abs(warning.y-H*.35)>1e-8)) return false;
      if(edge==='bottom' && (warning.y!==H || Math.abs(warning.x-W*.7)>1e-8)) return false;
      if(edge==='top' && (warning.y!==0 || Math.abs(warning.x-W*.7)>1e-8)) return false;
      if(edge==='corner' && !(warning.y===0 && warning.x>W*.7)) return false;
    }
    return true;
  })()`),true);
});

test('the warning strengthens nearby and disappears when far, protected or outside hard-mode flight', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.HARD);macrophageGrace=0;
    const e=makeMacrophage(player.x+1200,player.y);macrophages=[e];
    const far=macrophageEdgeWarning();e.x=player.x+600;const near=macrophageEdgeWarning();
    if(!far || !near || near.strength<=far.strength) return false;
    e.x=player.x+2000;if(macrophageEdgeWarning()) return false;
    e.x=player.x+600;macrophageGrace=1;if(macrophageEdgeWarning()) return false;
    macrophageGrace=0;
    for(const mode of [GameMode.NORMAL,GameMode.HARD]) for(const phase of Object.values(State)) {
      gameMode=mode;state=phase;
      if(mode===GameMode.HARD && phase===State.SEARCH) continue;
      if(macrophageEdgeWarning()) return false;
    }
    return true;
  })()`),true);
});


function infectionFixture() {
  const instance = game();
  instance.run(`startGame(GameMode.NORMAL); mobileControls=true;
    const host=makeBacteria(player.x+320,player.y,.9,0,1);
    bacteriaField=[host]; cellField=[]; attachCandidate=host;
    updateProceduralBacteriaIfNeeded=()=>{}; updateWorldCells=()=>{};
    resolveBacteriaPhysics=()=>{}; resolveBubbleCollisions=()=>{}; updateMacrophages=()=>{};
    const contact=worldToScreen(host.x,host.y);`);
  return instance;
}

test('infection requires uninterrupted holding on a nearby compatible silhouette', () => {
  const {run}=infectionFixture();
  assert.equal(run('canAttachToBacteria(player,host).valid'),true);
  assert.equal(run('handleInfectionPointerDown({x:contact.x,y:contact.y-300},1)'),false);
  run('host.infectable=false;');
  assert.equal(run('handleInfectionPointerDown(contact,1)'),false);
  run('host.infectable=true;host.x+=2000;');
  assert.equal(run('handleInfectionPointerDown(worldToScreen(host.x,host.y),1)'),false);
  run('host.x-=2000;handleInfectionPointerDown(contact,1);updateSearch(.2);');
  assert.equal(run('state'), 'search');
  run('infectionPointer.x=-1000;updateSearch(.5);');
  assert.equal(run('infectionPointer.elapsed'),0);
  run('Object.assign(infectionPointer,worldToScreen(host.x,host.y));updateSearch(.2);');
  assert.equal(run('state'), 'search');
  run('updateSearch(.5);');
  assert.equal(run('state'), 'adsorption');
  assert.equal(run('infectionPointer.id'),1);
  assert.equal(run('visualTutorial.learned.infection'),true);
});

test('infection pointer cannot transfer ownership and cancellation, blur and menu release it', () => {
  const {run,listeners}=infectionFixture();
  run('handleInfectionPointerDown(contact,11);handleInfectionPointerDown(contact,22);');
  assert.equal(run('infectionPointer.id'),11);
  listeners['game:pointercancel']({pointerId:22});
  assert.equal(run('infectionPointer.id'),11);
  listeners['game:lostpointercapture']({pointerId:11});
  assert.equal(run('infectionPointer'),null);
  for(const action of [()=>listeners['window:blur'](),()=>run('resetGame()')]) {
    run('state=State.SEARCH;handleInfectionPointerDown(contact,11);');
    action();
    assert.equal(run('infectionPointer'),null);
  }
});

test('tutorial progress belongs to each run and ignores old or unavailable storage', () => {
  const saved=new Map();
  const storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
  const first=game(null,storage);
  first.run(`startGame(GameMode.NORMAL);learnTutorial('movement');learnTutorial('nucleotide');resetGame();`);
  const second=game(null,storage);
  assert.equal(second.run('visualTutorial.learned.movement'),undefined);
  assert.equal(second.run('visualTutorial.learned.nucleotide'),undefined);
  assert.equal(second.run('visualTutorial.learned.lysis'),undefined);
  const denied=game(null,{getItem(){throw Error('denied')},setItem(){throw Error('denied')}});
  denied.run("learnTutorial('movement');resetGame();");
  assert.equal(denied.run('visualTutorial.learned.movement'),true);
});

test('a new game restarts all lessons and unfinished tutorial timing', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    visualTutorial.learned={nucleotide:true};visualTutorial.key='movement-v2';visualTutorial.age=5.9;visualTutorial.movementInputSeen=true;
    launchGame(GameMode.NORMAL);
    return visualTutorial.key===null&&visualTutorial.age===0&&!visualTutorial.movementInputSeen&&visualTutorial.learned.nucleotide===undefined;
  })()`),true);
});

test('tutorial drawing never moves letters or assembly pieces or generates inputs', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.NORMAL);createInitialDnaFromInjection();
    nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);setState(State.NUCLEOTIDE_MINIGAME);
    const before=JSON.stringify(nucleotideGame);
    for(let i=0;i<240;i++){updateVisualTutorial(1/60);drawVisualTutorial();}
    if(before!==JSON.stringify(nucleotideGame)||pendingActionTaps||mouse.down) return false;
    createPhagePartsFromDna(replication.dnaPieces[0]);setState(State.PART_ASSEMBLY);
    const parts=JSON.stringify(assembly);
    for(let i=0;i<240;i++){updateVisualTutorial(1/60);drawVisualTutorial();}
    return parts===JSON.stringify(assembly)&&!visualTutorial.learned.nucleotide&&!visualTutorial.learned['assembly-genome'];
  })()`),true);
});

test('one success hides each repeated-element lesson and assembly advances to the next gesture', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.NORMAL);createInitialDnaFromInjection();replication.dnaPieces[0].minigameType='drag';setState(State.DNA_REPLICATION);
    if(getTutorialCue().key!=='dna-copy')return false;
    activateDna(replication.dnaPieces[0]);
    if(getTutorialCue())return false;
    while(replication.dnaPieces.length<TARGET_DNA)activateDna(replication.dnaPieces.find(d=>!d.duplicated));
    if(getTutorialCue().key!=='dna-process')return false;
    activateDna(replication.dnaPieces[0]);
    const item=nucleotideGame.nucleotides[0],slot=nucleotideGame.slots[0];
    item.x=slot.x;item.y=slot.y;dropNucleotideOnSlot(item);
    if(getTutorialCue())return false;
    createPhagePartsFromDna(replication.dnaPieces[0]);setState(State.PART_ASSEMBLY);
    if(getTutorialCue().key!=='assembly-genome')return false;
    const genome=assembly.activeParts.find(p=>p.kind==='genome'),head=assembly.activeParts.find(p=>p.kind==='head');
    genome.x=head.x;genome.y=head.y;trySnapParts();
    return getTutorialCue().key==='assembly-head'&&visualTutorial.learned['assembly-genome'];
  })()`),true);
});

test('sorting tutorial pointer disappears after the first letter swap', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    startGame(GameMode.NORMAL);createInitialDnaFromInjection();
    replication.dnaPieces[0].minigameType='sort';
    nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);setState(State.NUCLEOTIDE_MINIGAME);
    if(getTutorialCue()?.key!=='nucleotide-sort')return false;
    selectSortNucleotide(0);
    if(getTutorialCue()?.key!=='nucleotide-sort')return false;
    selectSortNucleotide(1);
    return visualTutorial.learned['nucleotide-sort']===true && getTutorialCue()===null;
  })()`),true);
});


test('mobile always sees the first movement demonstration before a nearby infection cue', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    mobileControls=true;launchGame(GameMode.NORMAL);
    attachCandidate=makeBacteria(player.x+80,player.y,1,0,1);
    visualTutorial.learned.movement=true; // Simulate the old mobile save that hid the unseen lesson.
    visualTutorial.learned['movement-v2']=undefined;
    touchControls.joystick.active=true;touchControls.joystick.dx=38;touchControls.joystick.dy=0;
    const cue=getTutorialCue();let drawn=0;ctx.drawImage=()=>drawn++;
    if(cue?.key!=='movement-v2')return false;
    for(let i=0;i<390;i++){updateVisualTutorial(1/60);drawVisualTutorial();}
    if(drawn===0||!visualTutorial.learned['movement-v2'])return false;
    return getTutorialCue()?.key==='infection';
  })()`),true);
});

test('every tutorial gesture stays visible on desktop and mobile, including during active input', () => {
  const {run}=game();
  const results=JSON.parse(run(`(()=>{
    const output=[];
    const lessons=['movement-v2','infection','injection','dna-copy','dna-process','nucleotide','assembly-genome','assembly-head','assembly-body','lysis'];
    for(const mobile of [false,true]) {
      mobileControls=mobile;launchGame(GameMode.NORMAL);
      for(const lesson of lessons) {
        visualTutorial.learned=lesson==='movement-v2'?{}:{'movement-v2':true};visualTutorial.key=null;visualTutorial.age=0;visualTutorial.movementInputSeen=false;
        nucleotideGame=null;replication.dnaPieces=[];assembly.activeParts=[];assembly.packed=false;assembly.joining={headBody:false,bodyLegs:false};
        targetBacteria=null;attachCandidate=null;infectionPointer=null;lysis.burst=false;
        if(lesson==='movement-v2') state=State.SEARCH;
        if(lesson==='infection') { state=State.SEARCH;attachCandidate=makeBacteria(player.x+220,player.y,1,0,1); }
        if(lesson==='injection') { state=State.ADSORPTION;targetBacteria=makeBacteria(player.x,player.y,1,0,1); }
        if(lesson==='dna-copy') { createInitialDnaFromInjection();state=State.DNA_REPLICATION; }
        if(lesson==='dna-process') { replication.dnaPieces=Array.from({length:TARGET_DNA},(_,i)=>({id:i+1,x:500+i*20,y:450,duplicated:true,processed:false}));state=State.DNA_REPLICATION; }
        if(lesson==='nucleotide') { createInitialDnaFromInjection();replication.dnaPieces[0].minigameType='drag';nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);state=State.NUCLEOTIDE_MINIGAME; }
        if(lesson.startsWith('assembly-')) {
          createPhagePartsFromDna({id:1});state=State.PART_ASSEMBLY;
          if(lesson==='assembly-head') assembly.packed=true;
          if(lesson==='assembly-body') { assembly.packed=true;assembly.joining.headBody=true; }
        }
        if(lesson==='lysis') state=State.LYSIS;
        mouse.down=true;dragItem={kind:'nucleotide'};
        updateVisualTutorial(1/60);
        const cue=getTutorialCue();let draws=0;ctx.drawImage=()=>draws++;
        drawVisualTutorial();
        output.push({mobile,lesson,cue:cue?.key,draws});
        mouse.down=false;dragItem=null;infectionPointer=null;
      }
    }
    return JSON.stringify(output);
  })()`));
  assert.equal(results.length,20);
  for(const result of results) {
    assert.equal(result.cue,result.lesson,`${result.mobile?'mobile':'desktop'} ${result.lesson} cue`);
    assert.ok(result.draws>0,`${result.mobile?'mobile':'desktop'} ${result.lesson} hand was not drawn`);
  }
});

test('repeating movement and drag demonstrations never fade completely between gestures', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    let minimumAlpha=1;
    visualTutorial.learned={};visualTutorial.key='movement-v2';state=State.SEARCH;
    for(let i=0;i<=384;i++) {visualTutorial.age=i/60;drawVisualTutorial();minimumAlpha=Math.min(minimumAlpha,ctx.globalAlpha);}
    if(minimumAlpha<0.71)return false;
    visualTutorial.learned={'movement-v2':true};visualTutorial.key='nucleotide';visualTutorial.age=0;
    createInitialDnaFromInjection();replication.dnaPieces[0].minigameType='drag';nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);state=State.NUCLEOTIDE_MINIGAME;
    minimumAlpha=1;
    for(let i=0;i<=192;i++) {visualTutorial.age=i/60;drawVisualTutorial();minimumAlpha=Math.min(minimumAlpha,ctx.globalAlpha);}
    return minimumAlpha>=0.71;
  })()`),true);
});

test('the final story image fades over a rendered first gameplay frame', () => {
  const {run}=game();
  assert.equal(run(`(()=>{
    const events=[];
    storyIntroActive=true;storyIntroTransitioning=false;storyIntroIndex=STORY_INTRO_ASSETS.length-1;
    activeStoryIntroAssets=STORY_INTRO_ASSETS;pendingGameMode=GameMode.NORMAL;
    storyIntro.classList={add(...xs){events.push(...xs.map(x=>'add:'+x));},remove(...xs){events.push(...xs.map(x=>'remove:'+x));}};
    setTimeout=callback=>{events.push('timer');callback();return 1;};
    render=()=>events.push('render-game');launchGame=()=>{state=State.SEARCH;events.push('launch-game');};
    advanceStoryIntro();
    const renderIndex=events.indexOf('render-game'), leavingIndex=events.indexOf('add:is-leaving'), hiddenIndex=events.indexOf('add:hidden');
    return renderIndex>=0&&renderIndex<leavingIndex&&leavingIndex<hiddenIndex&&!storyIntroActive;
  })()`),true);
});


test('presentation input cannot advance or dismiss the first movement tutorial on desktop or mobile', () => {
  for (const mobile of [false, true]) {
    const {run,listeners}=game();
    run(`launchGame(GameMode.NORMAL);mobileControls=${mobile};storyIntroActive=true;visualTutorial.age=0;lastTime=0;`);
    listeners['window:keydown']({key:'ArrowRight',preventDefault(){}});
    listeners['game:pointerdown']({clientX:900,clientY:450,pointerId:1,preventDefault(){}});
    for(let i=1;i<=500;i++) run(`loop(${i*17});`);
    assert.equal(run('visualTutorial.age'),0);
    assert.equal(run('keys.size'),0);
    assert.equal(run('mouse.down'),false);
    run('storyIntroActive=false;loop(8517);');
    assert.equal(run('getTutorialCue().key'),'movement-v2');
    assert.equal(run('visualTutorial.learned["movement-v2"]'),undefined);
  }
});

test('image loading paints the menu first and bounds simultaneous downloads', async () => {
  const {run,sandbox}=game();
  run('for(const key of Object.keys(img))delete img[key];');
  const paints=[];
  sandbox.recordMenuPaint=()=>paints.push(Array.from(run('Object.keys(img)')));
  run('drawIntro=recordMenuPaint;');
  const requests=[];let active=0,peak=0;
  sandbox.Image=class {
    constructor(){this.width=this.height=512;}
    set src(url){requests.push(url);active++;peak=Math.max(peak,active);queueMicrotask(()=>{active--;this.onload();});}
  };
  await run('loadImages()');
  assert.equal(peak,4);
  assert.ok(paints[0].includes('introBack'));
  assert.equal(paints[0].includes('title'),false, 'background paints before the title finishes');
  assert.deepEqual(requests.slice(0,4).map(url=>url.split('?')[0]), Array.from(run('MENU_ASSETS.map(key=>ASSETS[key])')));
  assert.ok(requests.findIndex(url=>url.includes('pointing_pulse_on'))<requests.findIndex(url=>url.includes('DNA_broken')));
});

test('portrait entry loads its orientation background before menu assets', async () => {
  const {run,sandbox}=game();
  run('for(const key of Object.keys(img))delete img[key]; window.innerWidth=390; window.innerHeight=844;');
  const requests=[];
  sandbox.Image=class {
    constructor(){this.width=this.height=512;}
    set src(url){requests.push(url.split('?')[0]);queueMicrotask(()=>this.onload());}
  };
  await run('loadImages()');
  assert.equal(requests[0],run('ASSETS.story'));
  assert.equal(requests.filter(url=>url===run('ASSETS.story')).length,1);
  assert.ok(requests.indexOf(run('ASSETS.introBack'))>0);
});


test('lysis celebration fires once, stays bounded and expires during escape', () => {
  const {run}=game();
  assert.equal(run(`(() => {
    startGame(GameMode.NORMAL); state=State.LYSIS; lysis.pressure=1; lysis.damageProgress=1;
    updateLysis(.01,0);
    const initial=particles.filter(p=>p.kind==='victorySpark');
    if(initial.length!==36 || !particles.some(p=>p.kind==='victoryRing') || particles.length>QUALITY.particlesMax) return false;
    updateLysis(.01,0);
    if(particles.filter(p=>p.kind==='victorySpark').length!==36) return false;
    beginEscape(); for(let i=0;i<120;i++) updateParticles(1/60);
    if(particles.some(p=>p.kind?.startsWith('victory'))) return false;
    spawnLysisCelebration(); resetGame();
    return particles.length===0;
  })()`),true);
});

test('macrophage sound cues follow transitions, cancel on infection and distinguish capture', () => {
  const sounds=[],stops=[];
  const {run}=game({play:name=>sounds.push(name),stop:name=>stops.push(name),loop(){},stopAll(){},menuOpen:false});
  run('startGame(GameMode.HARD); macrophageGrace=0; const audioEnemy=makeMacrophage(0,0);');
  sounds.length=0;stops.length=0;
  run("changeMacrophageMode(audioEnemy,'chase'); changeMacrophageMode(audioEnemy,'chase'); changeMacrophageMode(audioEnemy,'windup'); changeMacrophageMode(audioEnemy,'close');");
  assert.deepEqual(sounds,['macrofago_alerta','macrofago_abrir','macrofago_cerrar']);
  assert.ok(stops.includes('macrofago_abrir'));
  run("changeMacrophageMode(audioEnemy,'chase'); changeMacrophageMode(audioEnemy,'return');");
  assert.equal(sounds.at(-1),'macrofago_evitar');
  run('setState(State.ADSORPTION);');
  assert.ok(stops.includes('macrofago_cerrar'));
  sounds.length=0;
  run("changeMacrophageMode(audioEnemy,'windup');");
  assert.equal(sounds.length,0);
  run('setState(State.SEARCH); macrophageGrace=0; captureByMacrophage(audioEnemy);');
  assert.equal(sounds.at(-1),'macrofago_captura');
  assert.ok(!sounds.includes('partida_tiempo_agotado'));
});


test('sorted letters remain solved and input-locked for half a simulation second', () => {
  const sounds=[];
  const {run}=game({play:name=>sounds.push(name),loop(){},stop(){},stopAll(){},menuOpen:false});
  run(`startGame(GameMode.NORMAL); createInitialDnaFromInjection();
    nucleotideGame=createNucleotideGame(replication.dnaPieces[0]);nucleotideGame.type='sort';
    nucleotideGame.sequence=['A','T','C','G'];
    nucleotideGame.nucleotides.forEach((item,i)=>item.code=['T','A','C','G'][i]);
    setState(State.NUCLEOTIDE_MINIGAME);selectSortNucleotide(0);selectSortNucleotide(1);`);
  assert.equal(run('state'), 'nucleotide_minigame');
  assert.equal(run('nucleotideGame.sortSuccessRemaining'), .5);
  assert.equal(run('nucleotideGame.slots.every(slot=>slot.filled)'), true);
  run('selectSortNucleotide(0);selectSortNucleotide(1);swapSortItems(0,1);checkSortedNucleotides();');
  assert.equal(run("nucleotideGame.nucleotides.map(n=>n.code).join('')"),'ATCG');
  assert.equal(sounds.filter(name=>name==='nucleotido_encajar').length,1);
  run('updateNucleotideMinigame(.49);render(0);');
  assert.equal(run('state'), 'nucleotide_minigame');
  assert.equal(run('nucleotideGame.dna.processed'),false);
  run('updateNucleotideMinigame(.01);');
  assert.equal(run('state'), 'biosynthesis');
  assert.equal(run('assembly.pendingDna.processed'),true);
});

test('mode buttons stay hidden until all assets finish loading and lock screen uses versioned backgrounds', async () => {
  const {run,nodes,sandbox}=game();
  const classes=new Set(['menu-buttons','hidden']);
  nodes.menuButtons.classList={
    add:c=>classes.add(c),
    remove:c=>classes.delete(c),
    toggle:(c,force)=>force===undefined?(classes.has(c)?classes.delete(c):classes.add(c)):(force?classes.add(c):classes.delete(c)),
    contains:c=>classes.has(c),
  };
  run('gameReady=false; loadingInProgress=false; for(const key of Object.keys(img)) delete img[key];');
  let releaseLastAsset;
  const gate=new Promise(resolve=>{releaseLastAsset=resolve;});
  sandbox.Image=class {
    constructor(){this.width=this.height=512;}
    set src(url){
      if(url.includes('DNA_broken')) gate.then(()=>this.onload());
      else queueMicrotask(()=>this.onload());
    }
  };
  const booting=run('bootstrapGame()');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(run('Boolean(img.introBack && img.title)'),true);
  assert.equal(run('gameReady'),false);
  assert.equal(classes.has('hidden'),true);
  assert.equal(nodes.normalButton.disabled,true);
  assert.equal(nodes.hardButton.disabled,true);
  releaseLastAsset();
  await booting;
  assert.equal(run('gameReady'),true);
  assert.equal(classes.has('hidden'),false);
  assert.equal(nodes.normalButton.disabled,false);
  assert.equal(nodes.hardButton.disabled,false);

  const version=run('BUILD_VERSION');
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const css=fs.readFileSync(require('node:path').join(__dirname,'../style.css'),'utf8');
  assert.match(html,/<div id="menuButtons" class="menu-buttons hidden">/);
  assert.ok(css.includes(`url("assets_webp/Intro_back_V2.webp?v=${version}")`));
  assert.ok(css.includes(`url("assets_webp/Story.webp?v=${version}")`));
});
