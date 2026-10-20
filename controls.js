// Semantic equivalents of canvas controls. Keep nodes stable across renders so
// Tab focus survives animation; pointer input continues to use the canvas.
const semanticFrame = [];
const semanticNodes = new Map();
let keyboardSelection = null;
let semanticActionKey = null;

function registerSemanticControl(id, x, y, w, h, label, onClick) {
  semanticFrame.push({id,x,y,w,h,label,onClick,state});
}

function invalidateUi() {
  uiButtons.length = 0;
  semanticFrame.length = 0;
  keyboardSelection = null;
  for (const node of semanticNodes.values()) node.remove();
  semanticNodes.clear();
}

function announceGameState(message) {
  const endings = {[State.INTRO]:'Elige un modo de juego.', [State.GAME_OVER]:'El macrófago capturó tu fago. Fin de la partida.', [State.COMPLETE]:'Tiempo terminado.'};
  const stage = getStageInfo(state);
  document.getElementById('gameStatus').textContent = message || endings[state] || (stage ? `${stage[0]}. ${stage[2]}` : '');
}

function syncSemanticControls() {
  const active = new Set();
  for (const descriptor of semanticFrame) {
    active.add(descriptor.id);
    let node = semanticNodes.get(descriptor.id);
    if (!node) {
      node = document.createElement('button');
      node.type = 'button';
      node.className = 'canvas-control';
      node.dataset.control = descriptor.id;
      node.addEventListener('click', () => {
        const control = node.control;
        if (control.state !== state || isDisplayBlocked() || soundEffects.menuOpen) return;
        if (control.id === 'action') pendingActionTaps++;
        else control.onClick();
      });
      if (descriptor.id === 'action') {
        node.addEventListener('keydown', ev => {
          if (!['Enter',' ','Spacebar'].includes(ev.key) || isDisplayBlocked() || soundEffects.menuOpen) return;
          ev.preventDefault();
          if (!ev.repeat && semanticActionKey === null) pendingActionTaps++;
          semanticActionKey = ev.key;
        });
        node.addEventListener('keyup', ev => {
          if (['Enter',' ','Spacebar'].includes(ev.key)) { ev.preventDefault(); semanticActionKey = null; }
        });
      }
      semanticNodes.set(descriptor.id,node);
      document.getElementById('canvasControls').append(node);
    }
    node.control = descriptor;
    if (node.semanticLabel !== descriptor.label) {
      node.semanticLabel = descriptor.label;
      node.textContent = descriptor.label;
      node.setAttribute('aria-label',descriptor.label);
    }
    const position={left:`${descriptor.x/W*100}%`,top:`${descriptor.y/H*100}%`,width:`${descriptor.w/W*100}%`,height:`${descriptor.h/H*100}%`};
    for(const [key,value] of Object.entries(position)) if(node.style[key]!==value) node.style[key]=value;
  }
  for (const [id,node] of semanticNodes) if (!active.has(id)) { node.remove(); semanticNodes.delete(id); }
}

function registerMinigameControls() {
  if (state === State.DNA_REPLICATION) {
    for (const dna of replication.dnaPieces) {
      if (dna.processed) continue;
      const action = replication.dnaPieces.length<TARGET_DNA ? 'Duplicar' : 'Procesar';
      registerSemanticControl(`dna-${dna.id}`,dna.x-70,dna.y-55,140,110,`${action} ADN ${dna.id}`,()=>activateDna(dna));
    }
  }
  if (state === State.NUCLEOTIDE_MINIGAME) {
    for (const [i,item] of nucleotideGame.nucleotides.entries()) {
      registerSemanticControl(`nucleotide-${i}`,item.x-55,item.y-55,110,110,`Seleccionar nucleótido ${item.code}`,()=>{
        keyboardSelection = item;
        announceGameState(mobileControls
          ? `Nucleótido ${item.code} seleccionado. Toca la casilla con la misma letra.`
          : `Nucleótido ${item.code} seleccionado. Elige su destino con Tab y pulsa Enter.`);
      });
    }
    for (const [i,slot] of nucleotideGame.slots.entries()) if (!slot.filled) {
      registerSemanticControl(`slot-${i}`,slot.x-55,slot.y-55,110,110,`Colocar en destino ${slot.code}`,()=>{
        if (!keyboardSelection) { announceGameState('Selecciona primero un nucleótido.'); return; }
        const item = keyboardSelection;
        item.x=slot.x; item.y=slot.y;
        dropNucleotideOnSlot(item);
        item.x=item.ox; item.y=item.oy;
        keyboardSelection=null;
        if(state===State.NUCLEOTIDE_MINIGAME) announceGameState(slot.filled?'Nucleótido colocado. Selecciona el siguiente.':'Las letras no coinciden. Selecciona otro nucleótido.');
      });
    }
  }
  if (state === State.PART_ASSEMBLY) {
    const names = {genome:'ADN',head:'cabeza',body:'cuerpo',legs:'patas'};
    for (const part of assembly.activeParts) {
      if (assembly.joining.headBody && part.kind==='head') continue;
      const label = keyboardSelection && keyboardSelection !== part ? `Unir ${names[keyboardSelection.kind]} con ${names[part.kind]}` : `Seleccionar ${names[part.kind]}`;
      const y = assembly.joining.headBody && part.kind==='body' ? part.y+(160.5-280)*ASSEMBLY_PHASE_SCALE : part.y;
      registerSemanticControl(`part-${part.kind}`,part.x-60,y-55,120,110,label,()=>{
        if (!keyboardSelection || keyboardSelection===part) {
          keyboardSelection=part;
          announceGameState(mobileControls
            ? `${names[part.kind]} seleccionado. Toca la pieza que debe unirse.`
            : `${names[part.kind]} seleccionado. Elige la pieza de destino con Tab y pulsa Enter.`);
          return;
        }
        const item=keyboardSelection,dx=part.x-item.x,dy=part.y-item.y;
        item.x=part.x;item.y=part.y;
        if (assembly.joining.headBody && item.kind==='body') {
          const head=assembly.activeParts.find(p=>p.kind==='head');
          if(head) {head.x+=dx;head.y+=dy;}
        }
        keyboardSelection=null;
        trySnapParts();
        announceGameState(assembly.activeParts.length ? assembly.message : 'Fago ensamblado.');
      });
    }
  }
  if (state === State.LYSIS && !lysis.burst) {
    registerSemanticControl('lysis-tap',safeCenterX()-180,safeBottom(70,40),360,70,
      mobileControls ? 'Liberar fagos: toca varias veces' : 'Liberar fagos: pulsa varias veces',()=>pendingActionTaps++);
  }
}
