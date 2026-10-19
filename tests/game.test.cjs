const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function game() {
  const listeners = {};
  const nodes = {};
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, { get: (o, k) => o[k] ?? (k.startsWith('create') ? () => gradient : k === 'measureText' ? text => ({ width: text.length * 12 }) : () => {}), set: (o,k,v) => (o[k] = v, true) });
  function node(id) {
    return nodes[id] ||= { style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener(event, handler) { listeners[id + ':' + event] = handler; }, getContext: () => context, getBoundingClientRect() { const field = nodes.playfield.style; return { left: parseFloat(field.left) || 0, top: parseFloat(field.top) || 0, width: parseFloat(this.style.width) || 1600, height: parseFloat(this.style.height) || 900 }; }, setPointerCapture() {} };
  }
  const sandbox = { console, performance: { now: () => sandbox.now }, now: 1000, document: { hidden: false, getElementById: node, createElement: () => node('cache' + Math.random()), addEventListener(event, handler) { listeners['document:' + event] = handler; } }, window: { innerWidth: 1280, innerHeight: 720, matchMedia: () => ({ matches: false }), addEventListener(event, handler) { listeners['window:' + event] = handler; } }, navigator: { maxTouchPoints: 0, userAgent: '' }, requestAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {} };
  vm.createContext(sandbox);
  let source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8');
  source = source.slice(0, source.lastIndexOf('\nresizeCanvasToViewport();'));
  vm.runInContext(source, sandbox);
  const run = code => vm.runInContext(code, sandbox);
  run('for (const key of Object.keys(ASSETS)) img[key] = {width:512, height:512}; resizeCanvasToViewport(); init();');
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
  const point = run('({x:uiButtons.find(b=>b.id==="action").x+20,y:uiButtons.find(b=>b.id==="action").y+20})');
  for(let i=0;i<4;i++) {
    run(`handleUiPointerDown({x:${point.x},y:${point.y}},7)`);
    listeners['game:pointerup']({clientX:0,clientY:0,pointerId:7});
  }
  run('loop(16);');
  assert.equal(run('lysis.pressure'), 0.42);
  const key = {key:' ',repeat:false,preventDefault(){}};
  listeners['window:keydown'](key);
  for(let i=0;i<5;i++) listeners['window:keydown']({...key,repeat:true});
  run('loop(32);');
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
  assert.equal(run('hardModeStartedAt'),121000);
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
  assert.match(nodes.displayNotice.textContent, /Gira el dispositivo/);
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
  assert.equal(run('hardModeStartedAt'),181000);
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
    const seed=targetBacteria.seed;
    updateEscape(ESCAPE_SECONDS/2);
    const screen=worldToScreen(player.x,player.y);
    return state===State.SEARCH && Math.hypot(screen.x-W/2,screen.y-H/2)<1e-8 && infectedBacteriaSeeds.has(seed) && !bacteriaField.find(b=>b.seed===seed)?.infectable;
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

test('bubble combo expires, activates at ten, refreshes energy and preserves the floating total', () => {
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
    if(bubbleStats.energy!==ENERGY_SECONDS || bubbleStats.total!==20) return false;
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
    if(glows.join()!=='head') return false;
    assembly.joining.headBody=true; glows.length=0;
    for(const p of assembly.activeParts) drawPart(p);
    drawSilhouetteGlow=original;
    return glows.join()==='legs';
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
