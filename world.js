// Biological families and normalized alpha silhouettes. No per-frame pixel reads.
const WORLD_CELL_TYPES = {
  eritrocito: {name:'Eritrocito', diameter:420, info:'Transporta oxígeno. Es una célula humana, no una bacteria.'},
  neutrofilo: {name:'Neutrófilo', diameter:540, info:'Es un glóbulo blanco de las defensas, no una bacteria.'},
  plaqueta: {name:'Plaqueta', diameter:112, movable:true, info:'Es un fragmento celular que ayuda a cerrar heridas, no una bacteria.'},
  linfocito: {name:'Linfocito', diameter:500, info:'Es un glóbulo blanco de las defensas, no una bacteria.'},
  monocito: {name:'Monocito', diameter:580, info:'Es un glóbulo blanco de las defensas, no una bacteria.'},
  eosinofilo: {name:'Eosinófilo', diameter:530, info:'Es un glóbulo blanco de las defensas, no una bacteria.'},
  basofilo: {name:'Basófilo', diameter:520, info:'Es un glóbulo blanco de las defensas, no una bacteria.'},
  celula_animal: {name:'Célula animal', diameter:620, info:'Tiene núcleo y orgánulos. Este fago infecta bacterias, no células animales.'},
  bacilo: {name:'Bacilo', diameter:450, backgroundOnly:true, info:'Es una bacteria alargada de otro tipo de huésped.'},
  espirilo: {name:'Espirilo', diameter:470, backgroundOnly:true, info:'Es una bacteria de forma espiral de otro tipo de huésped.'},
};
const FOREGROUND_CELL_TYPES = Object.keys(WORLD_CELL_TYPES).filter(k=>!WORLD_CELL_TYPES[k].backgroundOnly);
const WORLD_SPRITES = Object.keys(WORLD_CELL_TYPES).flatMap(type=>[1,2,3].map(i=>`cell_${type}_0${i}`));
const collisionShapes = new Map();
function shapeName(key) {
  if(key.startsWith('cell_')) return key.slice(5);
  if(key.startsWith('bacteriaOutside')) return 'Bacteria_Outside_'+key.slice('bacteriaOutside'.length);
  if(key==='bacteriaInside') return 'Bacteria_Inside';
  return key;
}
function collisionShape(key) {
  const name=shapeName(key);
  if(collisionShapes.has(name)) return collisionShapes.get(name);
  const data=SPRITE_SHAPE_DATA[name];
  if(!data) return null;
  const bytes=atob(data.data), values=new Int8Array(bytes.length);
  for(let i=0;i<bytes.length;i++) values[i]=(bytes.charCodeAt(i)<<24)>>24;
  const shape={...data,values}; collisionShapes.set(name,shape);return shape;
}
function signedSpriteDistance(shape,x,y) {
  const gx=x/shape.width*shape.w-.5, gy=y/shape.height*shape.h-.5;
  const cx=Math.max(0,Math.min(shape.w-1,gx)), cy=Math.max(0,Math.min(shape.h-1,gy));
  const ix=Math.floor(cx), iy=Math.floor(cy), jx=Math.min(ix+1,shape.w-1), jy=Math.min(iy+1,shape.h-1);
  const tx=cx-ix,ty=cy-iy;
  const v=(xx,yy)=>shape.values[yy*shape.w+xx]/2;
  const top=v(ix,iy)*(1-tx)+v(jx,iy)*tx, bottom=v(ix,jy)*(1-tx)+v(jx,jy)*tx;
  return ((top*(1-ty)+bottom*ty)+Math.hypot(gx-cx,gy-cy))*shape.width/shape.w;
}
function spriteSurface(entity,point) {
  const key=entity.sprite || `bacteriaOutside${entity.variant}`;
  const shape=collisionShape(key);
  if(!shape) return null;
  const c=Math.cos(entity.rotation),s=Math.sin(entity.rotation),scale=entity.scale;
  const dx=point.x-entity.x,dy=point.y-entity.y;
  const x=(c*dx+s*dy)/scale+shape.width/2, y=(-s*dx+c*dy)/scale+shape.height/2;
  const distance=signedSpriteDistance(shape,x,y)*scale;
  const step=shape.width/shape.w;
  let nx=signedSpriteDistance(shape,x+step,y)-signedSpriteDistance(shape,x-step,y);
  let ny=signedSpriteDistance(shape,x,y+step)-signedSpriteDistance(shape,x,y-step);
  let length=Math.hypot(nx,ny);
  if(length<1e-5) {nx=x-shape.width/2;ny=y-shape.height/2;length=Math.hypot(nx,ny)||1; if(nx===0 && ny===0) nx=1;}
  nx/=length;ny/=length;
  return {distance,normal:{x:c*nx-s*ny,y:s*nx+c*ny}};
}
// One healthy bacterium, one damaged bacterium and two cells per 2x2 block.
function worldSlotKind(gx,gy,salt=0) {
  const offset=hash2(Math.floor(gx/2),Math.floor(gy/2),salt)%4;
  const slot=((gx&1)+2*(gy&1)+offset)%4;
  return slot===0?'healthy':slot===1?'broken':'cell';
}
function cellSprite(type,seed) {return `cell_${type}_0${1+(seed%3)}`;}
function makeWorldCell(type,x,y,seed,id=null) {
  const info=WORLD_CELL_TYPES[type],sprite=cellSprite(type,seed),shape=collisionShape(sprite);
  const bounds=shape.bounds;
  const diameter=info.diameter*(.93+seeded(seed+3)*.14);
  const scale=Math.min(diameter/Math.max(bounds[2]-bounds[0],bounds[3]-bounds[1]),460/shape.radius);
  return {kind:'cell',type,sprite,x,y,seed,id,diameter,scale,rotation:(seeded(seed+5)-.5)*1.2,
    movable:Boolean(info.movable),vx:0,vy:0,spin:0,infoCooldown:0,infectable:false};
}
function cellEncounterText(cell) {
  const info=WORLD_CELL_TYPES[cell.type];
  return `${info.name}: ${info.info} No puedes infectar aquí.`;
}

function worldBodyMass(entity) {
  if(entity.kind!=='cell') return 2.4;
  if(entity.type==='plaqueta') return .35;
  return Math.max(.8,Math.min(2.8,(entity.diameter/420)**2));
}
