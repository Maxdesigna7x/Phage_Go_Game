// Optional real-browser smoke test. Start `python -m http.server 8765` first.
// Requires Playwright with Chromium; PHAGE_TEST_URL can select another server.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const output=process.env.PHAGE_TEST_OUTPUT || 'tmp/browser-enemies';
const url=process.env.PHAGE_TEST_URL || 'http://127.0.0.1:8765/';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try {
  for(const mobile of [false,true]) {
   const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
   // Deterministic animation stepping preserves real input, image decode and canvas rendering.
   await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
   await page.goto(url,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.getElementById('loading').classList.contains('hidden'));
   if(mobile) {
    await page.click('#rotateFullscreenButton');
    await page.waitForFunction(()=>!isDisplayBlocked(),null,{polling:100});
   }
   assert.equal(await page.evaluate(()=>Object.values(img).every(im=>im.complete && im.naturalWidth>0)),true);
   await page.click('#normalButton');
   await page.evaluate(()=>{for(let i=0;i<600;i++)update(1/60,false,0);render(0);});
   assert.equal(await page.evaluate(()=>macrophages.length),0);
   assert.equal(await page.evaluate(()=>state),'search');
   await page.click('#menuButton');await page.click('#hardButton');
   await page.evaluate(()=>{for(let i=0;i<310;i++)update(1/60,false,0);render(0);});
   assert.equal(await page.evaluate(()=>macrophages.length),1);
   // Controlled open-water encounter exercises the live state machine and actual alpha fields.
   await page.evaluate(()=>{
    bacteriaField=[];cellField=[];macrophageGrace=0;
    const e=makeMacrophage(1000,500);macrophages=[e];
    const mouth=macrophageMouth(e);player.x=mouth.x;player.y=mouth.y;player.vx=0;player.vy=0;player.rotation=0;
    camera.x=player.x-W/2;camera.y=player.y-H/2;camera.zoom=1;
    currentProcCell={x:Math.floor(player.x/BACTERIA_CELL),y:Math.floor(player.y/BACTERIA_CELL)};
    for(let i=0;i<12;i++){stateTime+=1/60;update(1/60,false,0);render(0);}
   });
   assert.equal(await page.evaluate(()=>macrophages[0].mode),'windup');
   await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-warning.png`});
   // Real pointer input in mobile mode makes it possible to escape the announced zone.
   if(mobile) {
    const start=await page.evaluate(()=>({x:player.x,y:player.y}));
    const touch=await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:600,y:260,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:760,y:330,id:1}]});
    await page.evaluate(()=>{for(let i=0;i<45;i++){stateTime+=1/60;update(1/60,false,0);}});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const moved=await page.evaluate(()=>({x:player.x,y:player.y}));
    assert.ok(Math.hypot(moved.x-start.x,moved.y-start.y)>80,JSON.stringify({start,moved,controls:await page.evaluate(()=>({joystick:touchControls.joystick,blocked:isDisplayBlocked(),mobileControls,state,player:{...player}}))}));
    assert.equal(await page.evaluate(()=>state),'search');
    // A second encounter validates capture without movement input.
    await page.evaluate(()=>{
     player.vx=0;player.vy=0;const e=macrophages[0];e.x=player.x-1254*.305*.4;e.y=player.y;e.rotation=0;
     changeMacrophageMode(e,'windup');
    });
   }
   await page.evaluate(()=>{for(let i=0;i<150 && state!==State.GAME_OVER;i++){stateTime+=1/60;update(1/60,false,0);render(0);}});
   assert.equal(await page.evaluate(()=>state),'game_over');
   await page.evaluate(()=>{for(let i=0;i<60;i++){stateTime+=1/60;update(1/60,false,0);render(0);}});
   await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-game-over.png`});
   const button=await page.evaluate(()=>{
    const b=uiButtons.find(b=>b.id==='game-over-menu'),r=canvas.getBoundingClientRect();
    return {x:r.left+(b.x+b.w/2)*r.width/W,y:r.top+(b.y+b.h/2)*r.height/H};
   });
   if(mobile)await page.touchscreen.tap(button.x,button.y);else await page.mouse.click(button.x,button.y);
   assert.equal(await page.evaluate(()=>state),'intro');
   await page.evaluate(()=>{render(0);});
   assert.equal(await page.locator('#menuButtons').isVisible(),true);
   await page.click('#hardButton');
   await page.evaluate(()=>{
    macrophageGrace=0;captureByMacrophage(makeMacrophage(player.x-150,player.y));
    for(let i=0;i<380;i++){stateTime+=1/60;update(1/60,false,0);}render(0);
   });
   assert.equal(await page.evaluate(()=>state),'intro');
   assert.equal(await page.evaluate(()=>macrophages.length),0);
   const pushing=await page.evaluate(()=>{
    startGame(GameMode.HARD);macrophageGrace=0;player.x=1000;player.y=0;player.vx=0;player.vy=0;
    currentProcCell={x:1,y:0};
    const body=makeBacteria(550,0,.7,0,1,'healthy',12345);bacteriaField=[body];cellField=[];
    const enemy=makeMacrophage(0,0);changeMacrophageMode(enemy,'chase');macrophages=[enemy];
    for(let i=0;i<300;i++){stateTime+=1/60;update(1/60,false,0);}
    camera.x=500-W/2;camera.y=-H/2;render(0);
    return {bacteriumX:body.x,enemyX:enemy.x,finite:[body.x,body.y,enemy.x,enemy.y].every(Number.isFinite)};
   });
   assert.ok(pushing.finite && pushing.bacteriumX>580 && pushing.enemyX>20,JSON.stringify(pushing));
   await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}-pushing.png`});
   assert.deepEqual(errors,[]);
   results.push({device:mobile?'mobile':'desktop',easy:'no enemies',hard:'spawned',capture:'game over',menu:'pointer and automatic return',pushing,errors});
   await context.close();
  }
  console.log(JSON.stringify(results,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
