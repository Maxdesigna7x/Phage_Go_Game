// Hard-mode macrophage. Animation and AI use simulation time, so pause freezes both.
const MACROPHAGE = Object.freeze({
  scale: 0.4, radius: 255, patrolSpeed: 48, chaseSpeed: 155,
  detection: 760, abandon: 1100, lostSeconds: 2.4, turnSpeed: 2.4,
  windupSeconds: 0.95, closeSeconds: 0.6, captureSeconds: 0.16,
  windupRadius: 88, captureRadius: 96, suctionRadius: 165,
  recoverySeconds: 1.75, graceSeconds: 3,
  menuSeconds: 6, maxActive: 1,
  spawnPadding: 96, warningNear: 180, warningFar: 1050,
});
let macrophages = [];
let macrophageSpawnTimer = 4;
let macrophageGrace = MACROPHAGE.graceSeconds;
let macrophageSerial = 0;
let macrophageGameOver = null;

function stopMacrophageSounds() {
  for (const name of ['macrofago_alerta','macrofago_abrir','macrofago_cerrar','macrofago_evitar']) soundEffects.stop?.(name);
}

function resetMacrophages() {
  stopMacrophageSounds();
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

function macrophageBodyContact(enemy, body) {
  const ownKey = enemy.sprite || 'macrofago_idle';
  const otherKey = body.sprite || `bacteriaOutside${body.variant}`;
  const ownShape = collisionShape(ownKey), otherShape = collisionShape(otherKey);
  if (!ownShape || !otherShape) return null;
  const scale = enemy.scale || MACROPHAGE.scale, rotation = enemy.rotation || 0;
  if (Math.hypot(body.x - enemy.x, body.y - enemy.y) > ownShape.radius * scale + otherShape.radius * body.scale + 24) return null;
  let best = null;
  for (const [px, py] of ownShape.points) {
    const point = localToWorld(enemy.x, enemy.y, rotation, px * scale, py * scale);
    const contact = spriteSurface(body, point);
    if (contact && (!best || contact.distance < best.distance)) best = contact;
  }
  for (const [px, py] of otherShape.points) {
    const point = localToWorld(body.x, body.y, body.rotation, px * body.scale, py * body.scale);
    const contact = spriteSurface({ x: enemy.x, y: enemy.y, rotation, scale, sprite: ownKey }, point);
    if (contact && (!best || contact.distance < best.distance)) {
      best = { distance: contact.distance, normal: { x: -contact.normal.x, y: -contact.normal.y } };
    }
  }
  return best;
}

function macrophageClearance(pose, onlyAnchored = false) {
  let clearance = Infinity;
  for (const obstacle of onlyAnchored ? (targetBacteria ? [targetBacteria] : []) : macrophageObstacles()) {
    const contact = macrophageBodyContact(pose, obstacle);
    if (contact) clearance = Math.min(clearance, contact.distance);
  }
  return clearance;
}

function pushMacrophageObjects(enemy, angle, dt) {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  for (const body of macrophageObstacles()) {
    if (!canMacrophagePush(body)) continue;
    const contact = macrophageBodyContact(enemy, body);
    if (!contact || contact.distance > 2) continue;
    const normal = contact.normal;
    const alignment = -(normal.x * direction.x + normal.y * direction.y);
    const penetration = Math.max(0, -contact.distance);
    if (penetration <= 0 && alignment < 0.15) continue;
    const mass = worldBodyMass(body);
    body.enemyMovable = true;
    if (penetration > 0) {
      const push = Math.min(penetration + 0.5, 22);
      body.x -= normal.x * push;
      body.y -= normal.y * push;
    }
    const force = (340 + Math.min(180, penetration * 10)) / mass * dt;
    body.vx = (body.vx || 0) - normal.x * force;
    body.vy = (body.vy || 0) - normal.y * force;
    body.spin = clamp((body.spin || 0) + (direction.y * normal.x - direction.x * normal.y) * dt * 0.12, -0.4, 0.4);
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
    if (!isMacrophageOutsideView(enemy) || macrophageClearance(enemy) < 40) continue;
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
  const previous = enemy.mode;
  enemy.mode = mode; enemy.elapsed = 0; enemy.capture = 0;
  if (previous !== mode && gameMode === GameMode.HARD && state === State.SEARCH && macrophageGrace <= 0) {
    if (mode === 'chase' && previous === 'patrol') playSound('macrofago_alerta', {volume:.42, maxDelay:180});
    if (mode === 'windup') playSound('macrofago_abrir', {volume:.5, maxDelay:120});
    if (mode === 'close') { soundEffects.stop?.('macrofago_abrir'); playSound('macrofago_cerrar', {volume:.42, maxDelay:120}); }
    if (mode === 'return' && previous === 'chase') playSound('macrofago_evitar', {volume:.25, maxDelay:180});
  }
  enemy.sprite = macrophagePose(enemy).body;
}

function startMacrophageWindup(enemy) {
  changeMacrophageMode(enemy,'windup');
  toastMessage='¡Va a cerrar! Escapa por un costado.';toastTimer=MACROPHAGE.windupSeconds;
}

function moveMacrophage(enemy, targetAngle, speed, dt, turnTarget = targetAngle, turnRate = MACROPHAGE.turnSpeed) {
  // Sample headings ahead and beside obstacles. No pathfinding grid or pixel reads.
  const lookahead = 95 + speed*0.35;
  let best = null;
  for (const offset of [0,.4,-.4,.85,-.85,1.35,-1.35,1.9,-1.9,Math.PI]) {
    const angle = targetAngle+offset;
    const probePose = {...enemy, x:enemy.x+Math.cos(angle)*lookahead, y:enemy.y+Math.sin(angle)*lookahead};
    // Movable objects are pushed; only the protected infection target is routed around.
    const clearance = macrophageClearance(probePose,true);
    const score = Math.cos(offset)*2 + Math.min(160,clearance)/90
      - (clearance<12 ? 20 : 0);
    if (!best || score>best.score) best = {angle,score,clearance,offset};
  }
  if (!best || best.clearance<4) { enemy.vx=0; enemy.vy=0; return; }
  const desiredHeading = best.offset === 0 ? turnTarget : best.angle;
  const delta = Math.atan2(Math.sin(desiredHeading-enemy.rotation),Math.cos(desiredHeading-enemy.rotation));
  enemy.rotation += clamp(delta,-turnRate*dt,turnRate*dt);
  // Translation follows the selected heading, allowing a broad cell to slide past obstacles.
  enemy.vx = Math.cos(best.angle)*speed; enemy.vy = Math.sin(best.angle)*speed;
  const nextPose = {...enemy, x:enemy.x+enemy.vx*dt, y:enemy.y+enemy.vy*dt};
  if (macrophageClearance(nextPose,true)>=0) {enemy.x=nextPose.x;enemy.y=nextPose.y;}
  else {enemy.vx=0;enemy.vy=0;}
  pushMacrophageObjects(enemy,best.angle,dt);
}

function macrophageProbeSurface(enemy, probe) {
  const surface = spriteSurface(enemy, probe);
  if (!surface) return null;
  // Carve an open funnel through the upper/lower jaw lobes so the 102px-tall phage
  // can enter the phagocytic cup without bouncing off the jaw tips, while keeping
  // an inner back wall in front of the nucleus.
  const s = enemy.scale / MACROPHAGE.scale;
  const local = worldToLocal(enemy.x, enemy.y, enemy.rotation, probe.x, probe.y);
  const lx = local.x / s, ly = local.y / s;
  const cx = clamp(lx, 150, 280);
  const dx = (lx - cx) * 1.1;
  const distAxis = Math.hypot(dx, ly);
  const funnelRadius = 94 + Math.max(0, lx - 150) * 0.45;
  const dCorridor = (funnelRadius - distAxis) * s;
  const dBack = (lx - 116) * s;
  const dCavity = Math.min(dCorridor, dBack);
  if (dCavity <= surface.distance) return surface;
  let cnx = 1, cny = 0;
  if (dCorridor < dBack) {
    if (distAxis > 1e-5) { cnx = -dx / distAxis; cny = -ly / distAxis; }
    else { cnx = 0; cny = ly >= 0 ? -1 : 1; }
  }
  return { distance: dCavity, normal: rotatePoint(cnx, cny, enemy.rotation) };
}

function applyMacrophageMouthPull(enemy, dt) {
  if (macrophageGrace > 0) return;
  const mouth = macrophageMouth(enemy);
  const dx = mouth.x - player.x, dy = mouth.y - player.y;
  const mouthDistance = Math.hypot(dx, dy);
  if (mouthDistance >= MACROPHAGE.suctionRadius) return;
  const s = enemy.scale / MACROPHAGE.scale;
  const local = worldToLocal(enemy.x, enemy.y, enemy.rotation, player.x, player.y);
  if (local.x <= 65 * s) return;
  const falloff = 1 - smoothstep(0, MACROPHAGE.suctionRadius, mouthDistance);
  const accel = (enemy.mode === 'close' ? 260 : enemy.mode === 'windup' ? 185 : 140) * falloff;
  const drift = (enemy.mode === 'close' ? 55 : enemy.mode === 'windup' ? 36 : 26) * falloff;
  const ux = dx / (mouthDistance || 1), uy = dy / (mouthDistance || 1);
  player.vx += ux * accel * dt;
  player.vy += uy * accel * dt;
  player.x += ux * drift * dt;
  player.y += uy * drift * dt;
  if (enemy.mode === 'close' && mouthDistance < MACROPHAGE.captureRadius * 0.75) {
    const damp = Math.exp(-2.8 * dt);
    player.vx *= damp;
    player.vy *= damp;
  }
}

function resolveMacrophageContact(enemy) {
  if (macrophageGrace>0) return;
  // Only the outer membrane and the inner cup back-wall push; the open mouth funnel remains enterable.
  for (let i=0;i<3;i++) {
    let contact = null;
    for (const probe of getPlayerCollisionProbes()) {
      const surface = macrophageProbeSurface(enemy,probe);
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
    const delta=Math.atan2(Math.sin(angle-enemy.rotation),Math.cos(angle-enemy.rotation));
    if (macrophageGrace>0) {
      if(enemy.mode!=='patrol') changeMacrophageMode(enemy,'patrol');
      enemy.capture=0;continue;
    }
    const initialMouth=macrophageMouth(enemy);
    const initialMouthDist=Math.hypot(player.x-initialMouth.x,player.y-initialMouth.y);
    if (enemy.mode==='patrol') {
      if (initialMouthDist<MACROPHAGE.windupRadius) {
        startMacrophageWindup(enemy);
      } else if (distance<MACROPHAGE.detection && enemy.cooldown===0) {
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
        const turnRate = MACROPHAGE.turnSpeed * (distance < 340 && Math.abs(delta) > 0.5 ? 1.3 : 1);
        let moveAngle = angle, speed = MACROPHAGE.chaseSpeed;
        if (distance < 340 && Math.abs(delta) < 1.05) {
          // Guide the phagocytic cup itself onto the phage rather than the cell's centre.
          moveAngle = Math.atan2(player.y - initialMouth.y, player.x - initialMouth.x);
          speed = Math.min(MACROPHAGE.chaseSpeed, Math.max(45, initialMouthDist * 2.2));
        } else if (distance < 320) {
          // Pivot the mouth toward a nearby phage instead of body-ramming with the back or side.
          speed = MACROPHAGE.chaseSpeed * Math.max(0.12, (Math.cos(delta) + 1) * 0.35);
        }
        moveMacrophage(enemy, moveAngle, speed, dt, angle, turnRate);
        const mouth=macrophageMouth(enemy);
        if(Math.hypot(player.x-mouth.x,player.y-mouth.y)<MACROPHAGE.windupRadius) {
          startMacrophageWindup(enemy);
        }
      }
    } else if (enemy.mode==='windup') {
      // Gently track and advance the open cup while warning where closure happens.
      if (initialMouthDist > 18 && Math.abs(delta) < 1.2) {
        const moveAngle = Math.atan2(player.y - initialMouth.y, player.x - initialMouth.x);
        const lungeSpeed = Math.min(MACROPHAGE.chaseSpeed * 0.36, initialMouthDist * 1.6);
        moveMacrophage(enemy, moveAngle, lungeSpeed, dt, angle, MACROPHAGE.turnSpeed * 0.35);
      } else {
        enemy.rotation += clamp(delta, -MACROPHAGE.turnSpeed * 0.35 * dt, MACROPHAGE.turnSpeed * 0.35 * dt);
        enemy.vx = 0; enemy.vy = 0;
      }
      if(enemy.elapsed>=MACROPHAGE.windupSeconds) {
        const mouth=macrophageMouth(enemy);
        const inside=Math.hypot(player.x-mouth.x,player.y-mouth.y)<MACROPHAGE.captureRadius*0.85;
        changeMacrophageMode(enemy,'close');
        if(inside) enemy.capture=0.06;
      }
    } else if (enemy.mode==='close') {
      const mouth=macrophageMouth(enemy);
      const mouthDistance=Math.hypot(player.x-mouth.x,player.y-mouth.y);
      enemy.capture=mouthDistance<MACROPHAGE.captureRadius?enemy.capture+dt:Math.max(0,enemy.capture-dt*0.5);
      if(mouthDistance<MACROPHAGE.captureRadius && ((macrophagePose(enemy).captureReady && enemy.capture>=MACROPHAGE.captureSeconds) || (enemy.elapsed>=MACROPHAGE.closeSeconds && mouthDistance<MACROPHAGE.captureRadius*0.85))) {
        captureByMacrophage(enemy);return;
      }
      if(enemy.elapsed>=MACROPHAGE.closeSeconds) changeMacrophageMode(enemy,'recover');
    } else if (enemy.mode==='recover') {
      if(enemy.elapsed>=0.75 && initialMouthDist<MACROPHAGE.windupRadius) startMacrophageWindup(enemy);
      else if(enemy.elapsed>=MACROPHAGE.recoverySeconds) {changeMacrophageMode(enemy,'chase');enemy.lost=0;}
    } else if (enemy.mode==='return') {
      if(initialMouthDist<MACROPHAGE.windupRadius) startMacrophageWindup(enemy);
      else {
        const homeDistance=Math.hypot(enemy.x-enemy.home.x,enemy.y-enemy.home.y);
        if(homeDistance<90) {changeMacrophageMode(enemy,'patrol');enemy.lost=0;}
        else moveMacrophage(enemy,Math.atan2(enemy.home.y-enemy.y,enemy.home.x-enemy.x),MACROPHAGE.patrolSpeed*1.4,dt);
      }
    }
    applyMacrophageMouthPull(enemy, dt);
    enemy.sprite=macrophagePose(enemy).body;
    resolveMacrophageContact(enemy);
  }
}

function captureByMacrophage(enemy) {
  if(gameMode!==GameMode.HARD || state!==State.SEARCH || macrophageGrace>0) return;
  macrophageGameOver={enemy,player:{...player},mouth:macrophageMouth(enemy)};
  player.vx=0;player.vy=0;clearBubbleEnergy();clearHeldInputs();
  soundEffects.stopAll();playSound('macrofago_captura',{volume:.6, maxDelay:1000});
  setState(State.GAME_OVER);
  menuButton.classList.add('hidden');
}

function macrophagePose(enemy) {
  let body = 'macrofago_idle';
  if (enemy.mode === 'windup') body = enemy.elapsed < 0.12 ? 'macrofago_idle' : 'macrofago_reach';
  else if (enemy.mode === 'close') body = enemy.elapsed < 0.16 ? 'macrofago_reach' : 'macrofago_closed';
  else if (enemy.mode === 'recover') body = enemy.elapsed < 0.45 ? 'macrofago_closed' : 'macrofago_idle';
  const mix = enemy.mode === 'close' ? smoothstep(0, MACROPHAGE.closeSeconds, enemy.elapsed) : 0;
  return { body, mix, captureReady: enemy.mode === 'close' && mix >= 0.65 };
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
    const {body}=macrophagePose(enemy);
    if(state===State.SEARCH && macrophageGrace===0 && isNearWorldElement(enemy)) {
      drawSilhouetteGlow(body,enemy.x,enemy.y,enemy.scale,enemy.rotation);
    }
    drawImageCenter(img[body],enemy.x,enemy.y,enemy.scale,enemy.rotation);
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
