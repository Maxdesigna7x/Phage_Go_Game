// Hard-mode macrophage. Animation and AI use simulation time, so pause freezes both.
const MACROPHAGE = Object.freeze({
  scale: 0.4, radius: 255, patrolSpeed: 48, chaseSpeed: 155,
  detection: 760, abandon: 1100, lostSeconds: 2.4, turnSpeed: 1.8,
  windupSeconds: 1.15, closeSeconds: 0.65, captureSeconds: 0.24,
  captureRadius: 88, recoverySeconds: 2, graceSeconds: 3,
  menuSeconds: 6, maxActive: 1,
  spawnPadding: 96, warningNear: 180, warningFar: 1050,
});
let macrophages = [];
let macrophageSpawnTimer = 4;
let macrophageGrace = MACROPHAGE.graceSeconds;
let macrophageSerial = 0;
let macrophageGameOver = null;
let macrophageBlendLayer = null;

function resetMacrophages() {
  macrophages = [];
  macrophageSpawnTimer = 4;
  macrophageGrace = MACROPHAGE.graceSeconds;
  macrophageSerial = 0;
  macrophageGameOver = null;
}

function protectFromMacrophages() {
  macrophageGrace = MACROPHAGE.graceSeconds;
  for (const enemy of macrophages) {
    enemy.mode = 'patrol'; enemy.elapsed = 0; enemy.capture = 0;
    enemy.lost = 0; enemy.cooldown = 3; enemy.sprite = 'macrofago_idle';
  }
}

function makeMacrophage(x, y, rotation = 0) {
  return {kind:'enemy', infectable:false, x, y, rotation, scale:MACROPHAGE.scale,
    sprite:'macrofago_idle', mode:'patrol', elapsed:0, age:0, capture:0,
    lost:0, cooldown:0, home:{x,y}, turn:1, vx:0, vy:0};
}

function macrophageObstacles() { return [...bacteriaField, ...cellField]; }

function canMacrophagePush(entity) { return entity!==targetBacteria; }

function macrophageClearance(point, onlyAnchored = false) {
  let clearance = Infinity;
  for (const obstacle of onlyAnchored ? (targetBacteria ? [targetBacteria] : []) : macrophageObstacles()) {
    const shape = collisionShape(obstacle.sprite || `bacteriaOutside${obstacle.variant}`);
    if (!shape) continue;
    const distance = Math.hypot(point.x-obstacle.x, point.y-obstacle.y);
    if (distance > shape.radius*obstacle.scale + MACROPHAGE.radius + 200) continue;
    clearance = Math.min(clearance, spriteSurface(obstacle, point).distance);
  }
  return clearance;
}

function pushMacrophageObjects(enemy, angle, dt) {
  const direction={x:Math.cos(angle),y:Math.sin(angle)};
  for(const body of macrophageObstacles()) {
    if(!canMacrophagePush(body)) continue;
    const shape=collisionShape(body.sprite || `bacteriaOutside${body.variant}`);
    if(!shape || Math.hypot(body.x-enemy.x,body.y-enemy.y)>shape.radius*body.scale+MACROPHAGE.radius+45) continue;
    const surface=spriteSurface(body,enemy);
    const alignment=-(surface.normal.x*direction.x+surface.normal.y*direction.y);
    if(surface.distance>MACROPHAGE.radius+32 || alignment<.15) continue;
    const force=420/worldBodyMass(body)*dt;
    body.enemyMovable=true;
    body.vx=(body.vx||0)-surface.normal.x*force;
    body.vy=(body.vy||0)-surface.normal.y*force;
    body.spin=clamp((body.spin||0)+(direction.y*surface.normal.x-direction.x*surface.normal.y)*dt*.12,-.4,.4);
  }
}

function spawnMacrophage() {
  if (gameMode !== GameMode.HARD || state !== State.SEARCH || macrophages.length >= MACROPHAGE.maxActive) return false;
  // Safe placement is independent of the world's fixed healthy/broken/cell proportions.
  const offset = seeded(hash2(Math.floor(player.x/600), Math.floor(player.y/600), ++macrophageSerial))*Math.PI*2;
  for (let radius=780; radius<ACTIVE_RADIUS-MACROPHAGE.spawnPadding; radius+=180) for (let i=0; i<24; i++) {
    const angle = offset+i*Math.PI/12;
    const point = {x:player.x+Math.cos(angle)*radius, y:player.y+Math.sin(angle)*radius};
    const enemy = makeMacrophage(point.x, point.y, angle+Math.PI);
    if (!isMacrophageOutsideView(enemy) || macrophageClearance(point) < MACROPHAGE.radius+45) continue;
    enemy.turn = macrophageSerial%2 ? 1 : -1;
    macrophages.push(enemy);
    return true;
  }
  return false;
}

function macrophageScreenBounds(enemy) {
  // Include the entire shared image canvas, even its transparent margins and
  // the larger extents reached after rotation. Never test just the centre.
  let width=0,height=0;
  for(const key of ['macrofago_idle','macrofago_reach','macrofago_closed']) {
    const shape=collisionShape(key),image=img[key];
    width=Math.max(width,shape?.width||0,image?.width||0);
    height=Math.max(height,shape?.height||0,image?.height||0);
  }
  const c=Math.abs(Math.cos(enemy.rotation)),s=Math.abs(Math.sin(enemy.rotation));
  const zoom=camera.zoom||1,center=worldToScreen(enemy.x,enemy.y);
  const halfWidth=(c*width+s*height)*enemy.scale*zoom/2;
  const halfHeight=(s*width+c*height)*enemy.scale*zoom/2;
  return {left:center.x-halfWidth,right:center.x+halfWidth,top:center.y-halfHeight,bottom:center.y+halfHeight};
}

function isMacrophageOutsideView(enemy) {
  const bounds=macrophageScreenBounds(enemy),padding=MACROPHAGE.spawnPadding;
  return bounds.right<=-padding || bounds.left>=W+padding || bounds.bottom<=-padding || bounds.top>=H+padding;
}

function macrophageEdgeWarning() {
  if(gameMode!==GameMode.HARD || state!==State.SEARCH || macrophageGrace>0) return null;
  let nearest=null;
  for(const enemy of macrophages) {
    const surface=spriteSurface(enemy,player);
    if(!surface) continue;
    const distance=Math.max(0,surface.distance);
    if(distance>=MACROPHAGE.warningFar || (nearest && distance>=nearest.distance)) continue;
    nearest={enemy,distance};
  }
  if(!nearest) return null;
  const dx=nearest.enemy.x-player.x,dy=nearest.enemy.y-player.y;
  if(Math.hypot(dx,dy)<1e-6) return null;
  const origin=worldToScreen(player.x,player.y);
  origin.x=clamp(origin.x,1,W-1);origin.y=clamp(origin.y,1,H-1);
  const tx=dx>0?(W-origin.x)/dx:dx<0?-origin.x/dx:Infinity;
  const ty=dy>0?(H-origin.y)/dy:dy<0?-origin.y/dy:Infinity;
  const travel=Math.min(tx,ty);
  return {x:clamp(origin.x+dx*travel,0,W),y:clamp(origin.y+dy*travel,0,H),vertical:tx<=ty,
    strength:1-smoothstep(MACROPHAGE.warningNear,MACROPHAGE.warningFar,nearest.distance)};
}

function drawMacrophageEdgeWarning() {
  const warning=macrophageEdgeWarning();
  if(!warning) return;
  const depth=120,spread=Math.min(W,H)*.48;
  ctx.save();ctx.translate(warning.x,warning.y);
  ctx.scale(warning.vertical?depth:spread,warning.vertical?spread:depth);
  const glow=ctx.createRadialGradient(0,0,0,0,0,1);
  glow.addColorStop(0,'rgba(255,45,55,.72)');
  glow.addColorStop(.35,'rgba(245,25,40,.38)');
  glow.addColorStop(1,'rgba(230,15,30,0)');
  ctx.globalAlpha=warning.strength*(.9+.1*Math.sin(worldTime*3));
  ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);ctx.restore();
}

function macrophageMouth(enemy) {
  // Shared-canvas landmark: centre of the right-hand phagocytic cup.
  const shape = collisionShape('macrofago_reach');
  const width = shape ? shape.width : img.macrofago_reach.width;
  return localToWorld(enemy.x, enemy.y, enemy.rotation, width*0.305*enemy.scale, 0);
}

function changeMacrophageMode(enemy, mode) {
  enemy.mode = mode; enemy.elapsed = 0; enemy.capture = 0;
  enemy.sprite = macrophagePose(enemy).body;
}

function moveMacrophage(enemy, targetAngle, speed, dt) {
  // Sample headings ahead and beside obstacles. No pathfinding grid or pixel reads.
  const lookahead = 95 + speed*0.35;
  let best = null;
  for (const offset of [0,.4,-.4,.85,-.85,1.35,-1.35,1.9,-1.9,Math.PI]) {
    const angle = targetAngle+offset;
    const point = {x:enemy.x+Math.cos(angle)*lookahead, y:enemy.y+Math.sin(angle)*lookahead};
    // Movable objects are pushed; only the protected infection target is routed around.
    const clearance = macrophageClearance(point,true);
    const score = Math.cos(offset)*2 + Math.min(160,clearance-MACROPHAGE.radius)/90
      - (clearance<MACROPHAGE.radius+12 ? 20 : 0);
    if (!best || score>best.score) best = {angle,score,clearance};
  }
  if (!best || best.clearance<MACROPHAGE.radius+8) { enemy.vx=0; enemy.vy=0; return; }
  const delta = Math.atan2(Math.sin(best.angle-enemy.rotation),Math.cos(best.angle-enemy.rotation));
  enemy.rotation += clamp(delta,-MACROPHAGE.turnSpeed*dt,MACROPHAGE.turnSpeed*dt);
  pushMacrophageObjects(enemy,best.angle,dt);
  // Translation follows the selected heading, allowing a broad cell to slide past obstacles.
  enemy.vx = Math.cos(best.angle)*speed; enemy.vy = Math.sin(best.angle)*speed;
  const point = {x:enemy.x+enemy.vx*dt,y:enemy.y+enemy.vy*dt};
  if (macrophageClearance(point)>=MACROPHAGE.radius+3) {enemy.x=point.x;enemy.y=point.y;}
  else {enemy.vx=0;enemy.vy=0;}
}

function resolveMacrophageContact(enemy) {
  if (macrophageGrace>0) return;
  // Only the membrane pushes. The open cup remains enterable during capture.
  for (let i=0;i<3;i++) {
    let contact = null;
    for (const probe of getPlayerCollisionProbes()) {
      const surface = spriteSurface(enemy,probe);
      if (!surface) continue;
      const penetration = probe.r-surface.distance;
      if (penetration>0 && (!contact || penetration>contact.penetration)) contact={...surface,penetration};
    }
    if (!contact) break;
    player.x+=contact.normal.x*Math.min(contact.penetration+.5,28);
    player.y+=contact.normal.y*Math.min(contact.penetration+.5,28);
    const vn=player.vx*contact.normal.x+player.vy*contact.normal.y;
    if(vn<0) {player.vx-=vn*contact.normal.x;player.vy-=vn*contact.normal.y;}
    player.collisionTimer=.15;
  }
}

function updateMacrophages(dt) {
  if (gameMode !== GameMode.HARD) {macrophages=[];return;}
  if (state !== State.SEARCH) {protectFromMacrophages();return;}
  macrophageGrace = Math.max(0,macrophageGrace-dt);
  macrophages = macrophages.filter(e=>Math.hypot(e.x-player.x,e.y-player.y)<ACTIVE_RADIUS);
  macrophageSpawnTimer -= dt;
  if (!macrophages.length && macrophageSpawnTimer<=0) {
    spawnMacrophage(); macrophageSpawnTimer=1.5;
  }
  for (const enemy of macrophages) {
    enemy.age+=dt;enemy.elapsed+=dt;enemy.cooldown=Math.max(0,enemy.cooldown-dt);
    const distance=Math.hypot(player.x-enemy.x,player.y-enemy.y);
    const angle=Math.atan2(player.y-enemy.y,player.x-enemy.x);
    if (macrophageGrace>0) {
      if(enemy.mode!=='patrol') changeMacrophageMode(enemy,'patrol');
      enemy.capture=0;continue;
    }
    if (enemy.mode==='patrol') {
      if (distance<MACROPHAGE.detection && enemy.cooldown===0) {
        changeMacrophageMode(enemy,'chase');
        toastMessage='¡Macrófago cerca! Aléjate de sus prolongaciones.';toastTimer=3;
      } else {
        const homeDistance=Math.hypot(enemy.x-enemy.home.x,enemy.y-enemy.home.y);
        const patrolAngle=homeDistance>260?Math.atan2(enemy.home.y-enemy.y,enemy.home.x-enemy.x):enemy.rotation+enemy.turn*.45;
        moveMacrophage(enemy,patrolAngle,MACROPHAGE.patrolSpeed,dt);
      }
    } else if (enemy.mode==='chase') {
      enemy.lost=distance>MACROPHAGE.abandon?enemy.lost+dt:0;
      if(enemy.lost>=MACROPHAGE.lostSeconds || Math.hypot(enemy.x-enemy.home.x,enemy.y-enemy.home.y)>1500) {
        changeMacrophageMode(enemy,'return');enemy.cooldown=5;
      } else {
        moveMacrophage(enemy,angle,MACROPHAGE.chaseSpeed,dt);
        const mouth=macrophageMouth(enemy);
        if(Math.hypot(player.x-mouth.x,player.y-mouth.y)<100) {
          changeMacrophageMode(enemy,'windup');
          toastMessage='¡Va a cerrar! Escapa por un costado.';toastTimer=MACROPHAGE.windupSeconds;
        }
      }
    } else if (enemy.mode==='windup') {
      // Lock the attack direction: the warning describes exactly where closure happens.
      if(enemy.elapsed>=MACROPHAGE.windupSeconds) changeMacrophageMode(enemy,'close');
    } else if (enemy.mode==='close') {
      const mouth=macrophageMouth(enemy);
      enemy.capture=Math.hypot(player.x-mouth.x,player.y-mouth.y)<MACROPHAGE.captureRadius?enemy.capture+dt:0;
      if(macrophagePose(enemy).captureReady && enemy.capture>=MACROPHAGE.captureSeconds) {captureByMacrophage(enemy);return;}
      if(enemy.elapsed>=MACROPHAGE.closeSeconds) changeMacrophageMode(enemy,'recover');
    } else if (enemy.mode==='recover') {
      if(enemy.elapsed>=MACROPHAGE.recoverySeconds) {changeMacrophageMode(enemy,'chase');enemy.lost=0;}
    } else if (enemy.mode==='return') {
      const homeDistance=Math.hypot(enemy.x-enemy.home.x,enemy.y-enemy.home.y);
      if(homeDistance<90) {changeMacrophageMode(enemy,'patrol');enemy.lost=0;}
      else moveMacrophage(enemy,Math.atan2(enemy.home.y-enemy.y,enemy.home.x-enemy.x),MACROPHAGE.patrolSpeed*1.4,dt);
    }
    enemy.sprite=macrophagePose(enemy).body;
    // The cup sensor owns containment while closing. The solid closed membrane
    // must not push its occupant out before the sustained-capture check finishes.
    const mouth=macrophageMouth(enemy);
    if(enemy.mode!=='close' || Math.hypot(player.x-mouth.x,player.y-mouth.y)>=MACROPHAGE.captureRadius) resolveMacrophageContact(enemy);
  }
}

function captureByMacrophage(enemy) {
  if(gameMode!==GameMode.HARD || state!==State.SEARCH || macrophageGrace>0) return;
  macrophageGameOver={enemy,player:{...player},mouth:macrophageMouth(enemy)};
  player.vx=0;player.vy=0;clearBubbleEnergy();clearHeldInputs();
  soundEffects.stopAll();playSound('partida_tiempo_agotado',{volume:.65});
  setState(State.GAME_OVER);
  menuButton.classList.add('hidden');
}

function macrophageFrames(enemy) {
  if(enemy.mode==='windup') return ['macrofago_idle','macrofago_reach',smoothstep(0,.4,enemy.elapsed)];
  if(enemy.mode==='close') return ['macrofago_reach','macrofago_closed',smoothstep(0,MACROPHAGE.closeSeconds,enemy.elapsed)];
  if(enemy.mode==='recover') return ['macrofago_closed','macrofago_idle',smoothstep(.3,MACROPHAGE.recoverySeconds,enemy.elapsed)];
  return ['macrofago_idle','macrofago_reach',.1+.08*Math.sin(enemy.age*2.5)];
}

function macrophagePose(enemy) {
  const [from,to,mix]=macrophageFrames(enemy);
  return {from,to,mix,body:mix<.5?from:to,captureReady:enemy.mode==='close' && mix>=.85};
}

let debugMacrophageCollision = false;
function drawMacrophageCollision(enemy) {
  const shape=collisionShape(enemy.sprite),mouth=macrophageMouth(enemy);
  ctx.save();ctx.fillStyle='#63ffb3';ctx.lineWidth=2;
  for(const [x,y] of shape.points) {
    const p=localToWorld(enemy.x,enemy.y,enemy.rotation,x*enemy.scale,y*enemy.scale);
    ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#ff7863';ctx.beginPath();
  ctx.arc(mouth.x,mouth.y,MACROPHAGE.captureRadius,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#8edaff';
  for(const probe of getPlayerCollisionProbes()) {ctx.beginPath();ctx.arc(probe.x,probe.y,probe.r,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}

function drawMacrophages() {
  if(gameMode!==GameMode.HARD) return;
  for(const enemy of macrophages) {
    if(!isVisibleWorld(enemy.x,enemy.y,600)) continue;
    const {from,to,mix,body}=macrophagePose(enemy);
    if(state===State.SEARCH && macrophageGrace===0 && isNearWorldElement(enemy)) {
      drawSilhouetteGlow(body,enemy.x,enemy.y,enemy.scale,enemy.rotation);
    }
    // One reusable raster, with additive premultiplied alpha, makes the old cup
    // disappear correctly without dimming shared body pixels or retaining ghost lobes.
    if(!macrophageBlendLayer) macrophageBlendLayer=createLayer(512,512);
    const blend=macrophageBlendLayer.getContext('2d');
    blend.clearRect(0,0,512,512);blend.save();
    blend.globalAlpha=1-mix;
    blend.drawImage(img[from],0,0,512,512);
    blend.globalCompositeOperation='lighter';blend.globalAlpha=mix;
    blend.drawImage(img[to],0,0,512,512);blend.restore();
    drawImageCenter(macrophageBlendLayer,enemy.x,enemy.y,enemy.scale*img[from].width/512,enemy.rotation);
    if(debugMacrophageCollision) drawMacrophageCollision(enemy);
    if(state===State.SEARCH && enemy.mode==='windup') {
      const mouth=macrophageMouth(enemy);
      ctx.save();ctx.strokeStyle='#ffbe79';ctx.lineWidth=4;
      ctx.setLineDash([9,7]);ctx.beginPath();ctx.arc(mouth.x,mouth.y,MACROPHAGE.captureRadius,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle='rgba(255,112,81,.12)';ctx.fill();
      ctx.restore();
    }
  }
}

function drawMacrophageGameOver() {
  drawWorldBacteria();
  ctx.save();ctx.scale(camera.zoom||1,camera.zoom||1);ctx.translate(-camera.x,-camera.y);
  const captured=macrophageGameOver;
  if(captured) {
    drawImageCenter(img.macrofago_closed,captured.enemy.x,captured.enemy.y,captured.enemy.scale,captured.enemy.rotation);
    const t=smoothstep(0,.55,stateTime);
    ctx.globalAlpha=1-t;
    drawPhageFrame(lerp(captured.player.x,captured.mouth.x,t),lerp(captured.player.y,captured.mouth.y,t),captured.player.scale*(1-t*.85),captured.player.rotation,0);
  }
  ctx.restore();
  if(stateTime<.55) return;
  ctx.save();ctx.fillStyle='rgba(3,18,29,.75)';ctx.fillRect(0,0,W,H);ctx.restore();
  const width=Math.min(820,W-60),height=430,x=safeCenterX()-width/2,y=safeY((H-height)/2);
  drawPanel(x,y,width,height,.85);
  drawTextCentered('GAME OVER',safeCenterX(),y+85,58,'#ffae93','900');
  drawTextCentered('El macrófago capturó tu fago.',safeCenterX(),y+150,30,'#fff','800');
  drawTextCentered(`Puntos: ${score}  ·  Bacterias: ${kills}`,safeCenterX(),y+205,27,'#d7f5ff','800');
  const buttonY=y+250;
  drawPanel(safeCenterX()-155,buttonY,310,64,.9);
  drawTextCentered('Volver al menú',safeCenterX(),buttonY+42,29,'#ffdd69','900');
  registerUiButton('game-over-menu',safeCenterX()-155,buttonY,310,64,resetGame);
  drawTextCentered(`Volviendo al menú en ${Math.max(1,Math.ceil(MACROPHAGE.menuSeconds-stateTime))}…`,safeCenterX(),y+370,23,'#b8d9e3');
}
