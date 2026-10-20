// Browser regressions for the audit. Start a static server on port 8765.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.PHAGE_TEST_URL || 'http://127.0.0.1:8765/';
const output=process.env.PHAGE_TEST_OUTPUT || 'tmp/browser-audit';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PHAGE_CHROME_PATH,args:['--no-sandbox']});
 const results=[];
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>window.requestAnimationFrame=()=>1);
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>gameReady);
  await page.click('#normalButton');
  await page.evaluate(()=>{
    const body=bacteriaField.find(isBacteriaInteractable);
    const surface=localToWorld(body.x,body.y,body.rotation,-body.rx,0),n=rotatePoint(-1,0,body.rotation);
    player.x=surface.x+n.x*110;player.y=surface.y+n.y*110;player.vx=player.vy=0;
    updateSearch(0);render(0);
  });
  assert.equal(await page.evaluate(()=>Boolean(attachCandidate)),true);
  await page.locator('[data-control="action"]').focus();await page.keyboard.down('Enter');
  await page.evaluate(()=>{for(let i=0;i<70;i++)loop(lastTime+17);});
  assert.equal(await page.evaluate(()=>state),'injection');
  await page.keyboard.up('Enter');
  assert.equal(await page.evaluate(()=>semanticActionKey),null);
  const progress=await page.evaluate(()=>injectionProgress);
  await page.evaluate(()=>{for(let i=0;i<10;i++)loop(lastTime+17);});
  assert.equal(await page.evaluate(()=>injectionProgress),progress);
  await page.locator('[data-control="action"]').focus();await page.keyboard.down('Enter');
  await page.evaluate(()=>{for(let i=0;i<200;i++)loop(lastTime+17);});
  await page.keyboard.up('Enter');
  assert.equal(await page.evaluate(()=>state),'dna_replication');
  const activate=async id=>{
    const button=page.locator(`[data-control="${id}"]`);
    await button.focus();await page.keyboard.press('Enter');
    await page.evaluate(()=>render(0));
  };
  for(let i=0;i<4;i++) {
    const id=await page.evaluate(()=>replication.dnaPieces.find(d=>!d.duplicated).id);
    await activate(`dna-${id}`);
  }
  // Exercise every minigame through native keyboard activation for a full cycle.
  for(let cycle=0;cycle<5;cycle++) {
    const id=await page.evaluate(()=>replication.dnaPieces.find(d=>!d.processed).id);
    await activate(`dna-${id}`);
    assert.equal(await page.evaluate(()=>state),'nucleotide_minigame');
    while(await page.evaluate(()=>state===State.NUCLEOTIDE_MINIGAME)) {
      const {si,ni}=await page.evaluate(()=>{
        const si=nucleotideGame.slots.findIndex(s=>!s.filled);
        return {si,ni:nucleotideGame.nucleotides.findIndex(n=>n.code===nucleotideGame.slots[si].code)};
      });
      await activate(`nucleotide-${ni}`);await activate(`slot-${si}`);
    }
    assert.equal(await page.evaluate(()=>state),'biosynthesis');
    await page.evaluate(()=>{stateTime=3.1;update(1/60,false,0);render(0);});
    for(const [from,to] of [['genome','head'],['head','body'],['body','legs']]) {await activate(`part-${from}`);await activate(`part-${to}`);}
    await page.evaluate(()=>{for(let i=0;i<50;i++){stateTime+=1/60;update(1/60,false,0);}render(0);});
  }
  assert.equal(await page.evaluate(()=>state),'lysis');
  await page.locator('[data-control="lysis-tap"]').focus();
  for(let i=0;i<10;i++) await page.keyboard.press('Enter');
  await page.evaluate(()=>{
    loop(lastTime+17);
    for(let i=0;i<300;i++){stateTime+=1/60;update(1/60,false,0);}render(0);
  });
  assert.equal(await page.evaluate(()=>state),'search');
  assert.equal(await page.evaluate(()=>kills),1);
  // Tab reaches the movement control and Enter toggles it without a global action.
  await page.locator('#game').focus();await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.control),'movement-mode');
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>desktopMovementMode),'simple');
  assert.equal(await page.evaluate(()=>pendingActionTaps),0);
  await page.evaluate(()=>render(0));
  await page.screenshot({path:`${output}/keyboard-flight.png`});
  await page.evaluate(()=>{
    startGame(GameMode.HARD);macrophageGrace=0;captureByMacrophage(makeMacrophage(0,0));stateTime=1;render(0);
  });
  await page.locator('[data-control="game-over-menu"]').focus();
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>state),'intro');
  assert.deepEqual(errors,[]);results.push({keyboard:'full cycle, movement selector and game over',errors});
  await page.close();

  // Controlled network failures cover readiness, bounded retry, optional fallback,
  // essential recovery, and startup without duplicate animation loops.
  const loadingPage=await browser.newPage();let fail=true;
  await loadingPage.addInitScript(()=>{window.frameRequests=0;window.requestAnimationFrame=()=>{window.frameRequests++;};});
  let release;const gate=new Promise(resolve=>release=resolve);
  await loadingPage.route('**/assets_webp/new_size/Bacteria_Inside.webp*',async route=>{await gate;await route.continue();});
  await loadingPage.route('**/assets_webp/Intro_back_V2.webp*',route=>route.abort());
  await loadingPage.route('**/assets_webp/DNA_broken.webp*',route=>fail?route.abort():route.continue());
  await loadingPage.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(await loadingPage.locator('#normalButton').isDisabled(),true);
  await loadingPage.evaluate(()=>startGame(GameMode.NORMAL));assert.equal(await loadingPage.evaluate(()=>state),'intro');
  release();
  await loadingPage.waitForFunction(()=>!loadingInProgress,null,{polling:100});
  assert.equal(await loadingPage.locator('#retryLoadingButton').isVisible(),true);
  fail=false;await loadingPage.click('#retryLoadingButton');
  await loadingPage.waitForFunction(()=>gameReady,null,{polling:100});
  assert.equal(await loadingPage.evaluate(()=>img.introBack.fallback),true);
  assert.equal(await loadingPage.evaluate(()=>frameRequests),1);
  await loadingPage.click('#normalButton');assert.equal(await loadingPage.evaluate(()=>state),'search');
  results.push({loading:'early start blocked, optional fallback, essential retry, one loop'});
  await loadingPage.close();

  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const touchPage=await mobile.newPage();
  await touchPage.addInitScript(()=>{
    window.requestAnimationFrame=()=>1;
    document.documentElement.requestFullscreen=async()=>{throw Error('denied');};
  });
  await touchPage.goto(url,{waitUntil:'networkidle'});await touchPage.waitForFunction(()=>gameReady);
  await touchPage.click('#rotateFullscreenButton');
  assert.equal(await touchPage.evaluate(()=>isDisplayBlocked()),false);
  await touchPage.click('#normalButton');
  await touchPage.evaluate(()=>{
    createPhagePartsFromDna(null);setState(State.PART_ASSEMBLY);render(0);
  });
  const point=await touchPage.evaluate(()=>{
    const p=assembly.activeParts.find(p=>p.kind==='genome'),r=canvas.getBoundingClientRect();
    return {x:p.x/W*r.width,y:p.y/H*r.height};
  });
  await touchPage.evaluate(()=>{window.touchLog=[];for(const type of ['pointerdown','pointerup','pointermove','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>touchLog.push({type,id:e.pointerId,x:e.clientX,y:e.clientY,owner:mouse.pointerId,down:mouse.down}));});
  const cdp=await mobile.newCDPSession(touchPage);
  const a={...point,id:1},b={x:point.x+100,y:point.y-40,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});
  await touchPage.evaluate(()=>{updatePartAssembly(1/60);mouse.justDown=false;});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a,{...b,x:b.x+35}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...b,x:b.x+35}]});
  assert.equal(await touchPage.evaluate(()=>Boolean(dragItem?.dragging && mouse.down && !mouse.justUp)),true,JSON.stringify(await touchPage.evaluate(()=>({mouse,drag:dragItem?{kind:dragItem.kind,dragging:dragItem.dragging}:null,state,log:touchLog}))));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touchPage.evaluate(()=>updatePartAssembly(1/60));
  assert.equal(await touchPage.evaluate(()=>dragItem),null);
  await touchPage.screenshot({path:`${output}/mobile-assembly.png`});
  results.push({mobile:'fullscreen rejection and genuine two-touch drag events'});
  await mobile.close();
  console.log(JSON.stringify(results,null,2));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
