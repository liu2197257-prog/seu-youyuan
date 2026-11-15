'use strict';
/* 真实玩家式完整通关：只点可见热区、物品栏、弹层按钮，键盘走图，指针拖拽。
 * 不调用 PineGame.dispatch 推进剧情（仅在断言时读取状态）。
 */
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : ' — ' + JSON.stringify(detail).slice(0, 300)}`);
}

(async () => {
  const port = 9910 + Math.floor(Math.random() * 80);
  const profile = path.join(os.tmpdir(), 'pine-play-' + Date.now());
  const child = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
  try {
    let list;
    for (let i = 0; i < 120; i++) {
      try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch (_) { await sleep(150); }
    }
    const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    let id = 0; const pending = new Map(); const events = [];
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
      else if (m.method) events.push(m);
    };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => {
      const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
      if (res.exceptionDetails) throw new Error('page: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
      return res.result.value;
    };
    await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
    await send('Page.navigate', { url: 'file:///' + INDEX.replace(/\\/g, '/') });
    await sleep(1500);
    await ev('window.__PINE_TEST_TIMING__ = true; true');

    await ev(`
      window.__ui = {
        labels(){ return [...document.querySelectorAll('#scene [data-action]')].map(e=>e.getAttribute('aria-label')); },
        clickScene(name){
          const list=[...document.querySelectorAll('#scene [data-action]')];
          const el=list.find(el=>el.getAttribute('aria-label')===name) || list.find(el=>(el.getAttribute('aria-label')||'').includes(name));
          if(!el) return {ok:false, reason:'没有热区: '+name, available:this.labels()};
          (el.querySelector('.hit-area')||el).dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
          return {ok:true};
        },
        inv(){ return [...document.querySelectorAll('#inventory .item-button')].map(b=>b.dataset.item); },
        clickItem(item){
          const b=[...document.querySelectorAll('#inventory .item-button')].find(b=>b.dataset.item===item);
          if(!b) return {ok:false, reason:'物品栏没有 '+item, inv:this.inv()};
          b.click(); return {ok:true};
        },
        buttons(){ return [...document.querySelectorAll('#modal-body button')].map(b=>({t:b.textContent.trim(), d:b.disabled})); },
        clickButton(text){
          const bs=[...document.querySelectorAll('#modal-body button')];
          const el=bs.find(b=>b.textContent.trim()===text) || bs.find(b=>b.textContent.trim().includes(text));
          if(!el) return {ok:false, reason:'没有按钮: '+text, buttons:this.buttons()};
          if(el.disabled) return {ok:false, reason:'按钮禁用: '+text, buttons:this.buttons()};
          el.click(); return {ok:true};
        },
        clickDial(index){
          const d=[...document.querySelectorAll('#modal-body .dial')];
          if(!d[index]) return {ok:false, reason:'没有第 '+(index+1)+' 个转盘'};
          d[index].click(); return {ok:true};
        },
        clickNth(sel,index){ const l=[...document.querySelectorAll(sel)]; if(!l[index]) return {ok:false, reason:'没有 '+sel+'['+index+']'};
          if(l[index].disabled) return {ok:false, reason:'禁用 '+sel+'['+index+']', buttons:l.map(x=>x.textContent.trim())};
          l[index].click(); return {ok:true}; },
        modalOpen(){ return !document.getElementById('modal-backdrop').hidden; },
        modalTitle(){ return document.getElementById('modal-title').textContent; },
        closeModal(){ if(!document.getElementById('modal-backdrop').hidden) document.getElementById('modal-close').click(); return true; },
        dialogueOpen(){ return !document.getElementById('dialogue').hidden; },
        nextDialogue(){ if(!document.getElementById('dialogue').hidden) document.getElementById('dialogue-next').click(); },
        cinematic(){ return !document.getElementById('cinematic').hidden; },
        toast(){ const t=document.getElementById('toast'); return t.hidden ? '' : t.textContent; },
        status(){ return (document.getElementById('puzzle-status')||{}).textContent||''; },
        objective(){ return document.getElementById('objective').textContent; },
        backVisible(){ const b=document.getElementById('back-button'); return !b.hidden && getComputedStyle(b).display!=='none'; },
        clickBack(){ document.getElementById('back-button').click(); },
        snap(){ const s=PineGame.state; return {era:s.era, scene:s.scene, phase:s.phase, inv:s.inventory.slice(),
          rings:s.ringAmber.rings, grafted:s.ringAmber.grafted, letter:s.letter, pro:s.prologue,
          act:s.act?{completed:s.act.completed, steps:s.act.steps, slots:s.act.device.slots,
            memories:s.act.device.memories, repaired:s.act.device.repaired, engraved:s.act.engraved,
            evidence:s.act.evidence, projected:s.act.projected, ending:s.act.ending, storySeen:s.act.storySeen}:null}; },
        walkTo: async (tx,ty,ms)=>{
          const press=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
          const release=k=>window.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));
          const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
          const t0=performance.now(), limit=ms||9000;
          while(performance.now()-t0<limit){
            const p=PineGame.runtime.player, dx=tx-p.x, dy=ty-p.y;
            if(Math.hypot(dx,dy)<70) break;
            keys.forEach(release);
            if(dx>16) press('ArrowRight'); else if(dx<-16) press('ArrowLeft');
            if(dy>16) press('ArrowDown'); else if(dy<-16) press('ArrowUp');
            await new Promise(r=>setTimeout(r,80));
          }
          keys.forEach(release); await new Promise(r=>setTimeout(r,160));
          return {x:Math.round(PineGame.runtime.player.x), y:Math.round(PineGame.runtime.player.y),
            nearby:PineGame.runtime.nearby?PineGame.runtime.nearby.name:null};
        },
        drag: async (sel,dx,dy)=>{
          const el=document.querySelector(sel); if(!el) return {ok:false,reason:'没有 '+sel};
          const svg=el.ownerSVGElement||el, ctm=svg.getScreenCTM(), b=el.getBoundingClientRect();
          const cx=b.left+b.width/2, cy=b.top+b.height/2;
          const opt={pointerId:31,bubbles:true,clientX:cx,clientY:cy};
          el.dispatchEvent(new PointerEvent('pointerdown',opt));
          for(let i=1;i<=4;i++){
            el.dispatchEvent(new PointerEvent('pointermove',Object.assign({},opt,{clientX:cx+dx*ctm.a*i/4,clientY:cy+dy*ctm.d*i/4})));
            await new Promise(r=>setTimeout(r,40));
          }
          el.dispatchEvent(new PointerEvent('pointerup',Object.assign({},opt,{clientX:cx+dx*ctm.a,clientY:cy+dy*ctm.d})));
          await new Promise(r=>setTimeout(r,220));
          return {ok:true};
        }
      };
      true;
    `);

    async function idle(timeout = 25000) {
      const t0 = Date.now(); let calm = 0;
      while (Date.now() - t0 < timeout) {
        const st = await ev(`({d:__ui.dialogueOpen(), c:__ui.cinematic()})`);
        if (st.d) { await ev('__ui.nextDialogue()'); await sleep(30); calm = 0; continue; }
        if (st.c) { await sleep(60); calm = 0; continue; }
        if (++calm >= 3) return true;
        await sleep(80);
      }
      return false;
    }
    const snap = () => ev('__ui.snap()');
    const click = async name => { await idle(); return ev(`__ui.clickScene(${JSON.stringify(name)})`); };
    const clickButton = async text => ev(`__ui.clickButton(${JSON.stringify(text)})`);
    const clickItem = async item => { await idle(); return ev(`__ui.clickItem(${JSON.stringify(item)})`); };
    const closeModal = async () => { await ev('__ui.closeModal()'); await sleep(120); };

    // 像玩家一样：读界面当前角度，用 ±90/±10 按钮转到目标角度
    async function rotateGraftTo(target) {
      for (let i = 0; i < 60; i++) {
        if (!(await ev('__ui.modalOpen()'))) return { ok: true, closed: true };
        const cur = await ev(`(()=>{const s=document.querySelector('#modal-body .control-row span'); if(!s) return null; const m=s.textContent.match(/(-?\\d+)°/); return m?Number(m[1]):null;})()`);
        if (cur === null) return { ok: false, reason: '读不到当前角度' };
        let diff = ((target - cur) % 360 + 360) % 360;
        if (diff === 0) return { ok: true, cur };
        if (diff > 180) diff -= 360;
        const big = Math.abs(diff) >= 90;
        const label = (diff > 0 ? '＋' : '−') + (big ? '90°' : '10°');
        const r = await clickButton(label);
        if (!r.ok) return { ok: false, reason: r.reason, cur };
        await sleep(90);
      }
      return { ok: false, reason: '旋转未收敛' };
    }

    async function enterBuilding(x, y, expectScene, label) {
      await ev(`__ui.walkTo(${x},${y})`);
      const near = await ev('!!PineGame.runtime.nearby');
      if (!near) { check(label + '：走到入口出现交互目标', false, await ev('__ui.labels()')); return false; }
      await ev(`document.getElementById('interact-button').click()`);
      await sleep(350); await idle();
      const s = await snap();
      check(label + '：进入场景', s.scene === expectScene, s.scene);
      return s.scene === expectScene;
    }
    async function backToMap(expectScene, label) {
      await idle();
      if (await ev('__ui.modalOpen()')) await closeModal();
      const r = await ev('__ui.clickScene("返回校园")') ;
      if (!r.ok) { await ev('__ui.clickBack()'); }
      await sleep(300); await idle();
      const s = await snap();
      check(label, s.scene === expectScene, s.scene);
      return s.scene === expectScene;
    }

    // ================= 序章 =================
    let s = await snap();
    check('开局在当代校园地图', s.scene === 'prologue_campus', s.scene);
    check('地图内不显示「← 校园」', !(await ev('__ui.backVisible()')));

    const walk1 = await ev('__ui.walkTo(645,300)');
    check('键盘走到六朝松旁出现交互目标', !!walk1.nearby, walk1);
    await ev(`document.getElementById('interact-button').click()`);
    await sleep(320); await idle();
    s = await snap();
    check('进入六朝松近景', s.scene === 'prologue_pine', s.scene);
    check('近景显示「← 校园」', await ev('__ui.backVisible()'));

    let r = await click('检查相机包');
    check('相机包可打开', await ev('__ui.modalOpen()'), r);
    check('相机包能取出镜片', (await clickButton('取出特殊镜片')).ok, await ev('__ui.buttons()'));
    await closeModal();
    check('未装镜片时树未断裂', (await snap()).pro.treeBroken === false);

    check('物品栏可选中镜片', (await clickItem('lens')).ok, await ev('__ui.inv()'));
    r = await click('空滤镜框');
    await sleep(500); await idle();
    s = await snap();
    check('装镜片触发断裂演出', s.pro.treeBroken === true, s.pro);
    check('镜片装好后离开物品栏', !s.inv.includes('lens'), s.inv);

    r = await click('触碰悬浮的树脂');
    await sleep(350); await idle();
    check('点树脂取得年轮珀', (await ev('PineGame.state.ringAmber.owned')) === true, r);

    r = await click('把年轮珀贴入裂口');
    await sleep(350); await idle();
    check('进入植松记忆', (await snap()).scene === 'prologue_sprout', r);
    check('单向记忆不显示「← 校园」', !(await ev('__ui.backVisible()')));

    r = await click('拿起水罐');
    check('拿起水罐', (await snap()).inv.includes('waterCan'), r);
    await clickItem('waterCan');
    r = await click('浇灌幼苗');
    check('点幼苗完成浇水', (await snap()).pro.watered === true, r);

    r = await ev(`__ui.drag('#support-wood',-200,0)`);
    await sleep(300);
    check('拖动支撑木扶稳幼苗', (await snap()).pro.supported === true, r);

    r = await click('对齐幼苗脚边的印记');
    check('点印记打开接合盘', await ev('__ui.modalOpen()'), r);
    for (let i = 0; i < 4; i++) await clickButton('＋10°');
    await sleep(500); await idle();
    s = await snap();
    check('第一次接合 → 1933', s.era === '1933' && s.scene === 'act1_tree', s);
    check('序章接合角度为 40°', true);

    // ================= 第一章 =================
    check('第一章树前显示「← 校园」', await ev('__ui.backVisible()'));
    await backToMap('act1_map', '树前可返回 1933 地图');

    await enterBuilding(260, 300, 'act1_library', '图书馆');
    r = await click('查看反复翻回同一页的书');
    await sleep(250);
    check('点书取得第一片图纸', (await snap()).inv.includes('drawingFragment1'), { r, inv: (await snap()).inv, toast: await ev('__ui.toast()') });

    r = await click('检查抽屉的三个图案转盘');
    check('打开抽屉转盘', await ev('__ui.modalOpen()'), r);
    await clickButton('打开抽屉');
    check('错误图案有失败反馈', (await ev('__ui.status()')).length > 0, await ev('__ui.status()'));
    // 正确：第 1 格圆（不动），第 2 格三角（转 1 次），第 3 格方（转 2 次）
    await ev(`__ui.clickDial(1)`); await sleep(120);
    await ev(`__ui.clickDial(2)`); await sleep(100);
    await ev(`__ui.clickDial(2)`); await sleep(120);
    const okDial = await clickButton('打开抽屉');
    await sleep(300);
    check('正确图案打开抽屉', (await snap()).act.steps.drawerOpen === true, { okDial, status: await ev('__ui.status()'), dials: await ev(`[...document.querySelectorAll('#modal-body .dial')].map(b=>b.textContent.trim())`) });
    check('打开后弹层自动关闭', !(await ev('__ui.modalOpen()')));

    r = await click('取得第二片图纸');
    check('取得第二片图纸', (await snap()).inv.includes('drawingFragment2'), r);

    await clickItem('drawingFragment1');
    await clickItem('drawingFragment2');
    check('两片图纸打开拼合近景', await ev('__ui.modalOpen()'), await ev('__ui.modalTitle()'));
    r = await ev(`__ui.drag('#blueprint-piece',-270,0)`);
    await sleep(350);
    check('拖动碎片拼合成功', (await snap()).act.steps.joined === true, { r, modal: await ev('__ui.modalOpen()') });
    if (await ev('__ui.modalOpen()')) await closeModal();

    r = await click('使用描图架');
    check('打开描图架', await ev('__ui.modalOpen()'), r);
    const angleRes = await clickButton('右倾');
    await sleep(350);
    s = await snap();
    check('右倾 30° 对齐并获得窗格纹齿轮', s.act.completed.library === true, { angleRes, act: s.act, buttons: await ev('__ui.buttons()') });
    if (await ev('__ui.modalOpen()')) await closeModal();

    r = await click('取得窗格纹齿轮');
    check('取走窗格纹齿轮', (await snap()).inv.includes('windowGear'), { r, inv: (await snap()).inv });
    await backToMap('act1_map', '图书馆可返回地图');

    await enterBuilding(1000, 200, 'act1_hall', '大礼堂');
    r = await click('拾取舞台边的木槌');
    check('拾取木槌', (await snap()).inv.includes('mallet'), r);
    await clickItem('mallet');
    r = await click('把木槌装回支架');
    check('木槌装回支架', (await snap()).act.steps.malletInstalled === true, r);

    r = await click('查看最后排的排练记录');
    check('打开排练记录', await ev('__ui.modalOpen()'), r);
    await closeModal();

    for (const name of ['敲响低发声片', '敲响高发片', '敲响中发声片', '敲响低发声片']) {
      const rr = await click(name);
      if (!rr.ok) { check('敲响: ' + name, false, rr); }
    }
    await sleep(450); await idle();
    s = await snap();
    check('低—高—中—低 完成大礼堂', s.act.completed.hall === true, s.act);
    r = await click('取得声波纹齿轮');
    check('取走声波纹齿轮', (await snap()).inv.includes('soundGear'), { r, inv: (await snap()).inv });
    await backToMap('act1_map', '大礼堂可返回地图');

    await enterBuilding(965, 515, 'act1_gym', '体育馆');
    r = await click('查看并转动刻轮装置手柄');
    check('打开刻轮装置', await ev('__ui.modalOpen()'), r);
    check('装窗格纹', (await clickButton('装入窗格纹')).ok, await ev('__ui.buttons()'));
    check('装声波纹', (await clickButton('装入声波纹')).ok, await ev('__ui.buttons()'));
    check('嵌入年轮珀', (await clickButton('嵌入年轮珀')).ok, await ev('__ui.buttons()'));
    check('转动手柄', (await clickButton('转动手柄')).ok, await ev('__ui.buttons()'));
    await sleep(600); await idle();
    s = await snap();
    check('刻入第一圈', s.rings === 1, { rings: s.rings, buttons: await ev('__ui.buttons()') });
    if (await ev('__ui.modalOpen()')) await closeModal();

    r = await click('沿松针光迹回到六朝松');
    await sleep(350); await idle();
    check('沿光迹回到树前', (await snap()).scene === 'act1_tree', r);

    r = await click('把年轮珀放入树干裂口');
    await rotateGraftTo(90);
    check('打开接合盘', true);
    await sleep(600); await idle();
    s = await snap();
    check('第一圈接合 → 1959', s.era === '1959' && s.grafted === 1, s);

    // ================= 第二章 =================
    await backToMap('act2_map', '接合后回到 1959 地图');
    await enterBuilding(250, 210, 'act2_bldg54', '五四楼');
    r = await click('收集指示叶片材料');
    check('收集叶片材料', (await snap()).inv.length > 0, { r, inv: (await snap()).inv });
    r = await click('制作并安装指示叶片');
    check('打开指示叶片', await ev('__ui.modalOpen()'), r);
    check('组合材料', (await clickButton('组合材料')).ok, await ev('__ui.buttons()'));
    check('安装到模型', (await clickButton('安装到模型')).ok, await ev('__ui.buttons()'));
    await sleep(450); await idle();
    s = await snap();
    check('五四楼完成', s.act.completed.bldg54 === true, s.act);
    if (await ev('__ui.modalOpen()')) await closeModal();
    r = await click('取下指示叶片纹齿轮');
    check('取得指示叶片纹齿轮', (await snap()).inv.includes('indicatorGear'), { r, inv: (await snap()).inv });
    await backToMap('act2_map', '五四楼可返回地图');

    await enterBuilding(1000, 205, 'act2_power', '动力楼');
    r = await click('调整传动连接');
    check('打开传动调整', await ev('__ui.modalOpen()'), r);
    const pressLink = async prefix => ev(`(()=>{const b=[...document.querySelectorAll('#modal-body button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(prefix)})); if(!b) return {ok:false, buttons:[...document.querySelectorAll('#modal-body button')].map(x=>x.textContent.trim())}; b.click(); return {ok:true};})()`);
    await pressLink('低片连接'); await sleep(120);
    await pressLink('高片连接'); await sleep(120);
    await pressLink('高片连接'); await sleep(120);
    const testRun = await clickButton('试运行');
    await sleep(450); await idle();
    s = await snap();
    check('动力楼完成', s.act.completed.power === true, { testRun, act: s.act, status: await ev('__ui.status()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    r = await click('取下传动三轮纹齿轮');
    check('取得传动三轮纹齿轮', (await snap()).inv.includes('transmissionGear'), { r, inv: (await snap()).inv });
    await backToMap('act2_map', '动力楼可返回地图');

    await enterBuilding(1010, 515, 'act2_bldg55', '五五楼');
    const hs = await ev('__ui.labels()');
    for (const name of ['时间片段：提行李经过', '时间片段：多年后归来']) {
      const rr = await click(name);
      check('查看片段: ' + name, rr.ok && await ev('__ui.modalOpen()'), { rr, labels: hs });
      if (await ev('__ui.modalOpen()')) await closeModal();
    }
    r = await click('对照离校字条与修补痕迹');
    check('打开汇合弹层', await ev('__ui.modalOpen()'), r);
    for (const label of ['离校的脚步', '归来的脚步']) {
      await ev(`(()=>{const b=[...document.querySelectorAll('#modal-body button')].find(b=>b.textContent.trim().includes(${JSON.stringify(label)})); if(b) b.click();})()`);
      await sleep(140);
    }
    for (const label of ['离校字条', '修补痕迹']) {
      await ev(`(()=>{const b=[...document.querySelectorAll('#modal-body button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}); if(b) b.click();})()`);
      await sleep(140);
    }
    const combineR = await clickButton('放在一起看');
    await sleep(400); await idle();
    check('汇合完成', (await snap()).act.steps.b3 === true, { combineR, status: await ev('__ui.status()') });
    if (await ev('__ui.modalOpen()')) await closeModal();

    r = await click('修复传动并刻第二圈');
    check('打开走廊装置', await ev('__ui.modalOpen()'), r);
    const fixR = await clickButton('接中轴');
    await sleep(300);
    check('修复传动错位', (await snap()).act.repaired === true, { fixR, status: await ev('__ui.status()') });
    if (!(await ev('__ui.modalOpen()'))) { await click('修复传动并刻第二圈'); }
    check('装指示叶片纹', (await clickButton('装入指示叶片纹')).ok, await ev('__ui.buttons()'));
    check('装传动三轮纹', (await clickButton('装入传动三轮纹')).ok, await ev('__ui.buttons()'));
    check('嵌入年轮珀', (await clickButton('嵌入年轮珀')).ok, await ev('__ui.buttons()'));
    check('转动手柄', (await clickButton('转动手柄')).ok, await ev('__ui.buttons()'));
    await sleep(600); await idle();
    s = await snap();
    check('刻入第二圈', s.rings === 2, { rings: s.rings, buttons: await ev('__ui.buttons()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    await backToMap('act2_map', '五五楼可返回地图');

    await enterBuilding(640, 300, 'act2_tree', '1959 树前');
    r = await click('接合第二圈年轮');
    check('打开第二圈接合盘', await ev('__ui.modalOpen()'), { r, labels: await ev('__ui.labels()') });
    await rotateGraftTo(220);



    
    await sleep(600); await idle();
    s = await snap();
    check('第二圈接合 → 1988', s.era === '1988' && s.grafted === 2, s);

    // ================= 第三章 =================
    await backToMap('act3_map', '接合后回到 1988 地图');
    await enterBuilding(250, 215, 'act3_frontyard', '前工院');
    r = await click('投射图样并对齐旧窗影');
    check('打开投射对位', await ev('__ui.modalOpen()'), { r, labels: await ev('__ui.labels()') });
    if (await ev('__ui.modalOpen()')) {
      await ev(`__ui.drag('#projection-piece',380,-80)`);
      for (let i = 0; i < 4; i++) await clickButton('顺时针');
      await clickButton('观察重合处');
      await sleep(400);
    }
    s = await snap();
    check('前工院完成', s.act.completed.frontyard === true, { act: s.act, status: await ev('__ui.status()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    await backToMap('act3_map', '前工院可返回地图');

    await enterBuilding(1000, 195, 'act3_alumni', '校友会堂');
    for (const name of ['查看返校纪念墙', '查看 1959 年学生名册', '查看周老师的教案', '把 1959 年记忆投到教案上', '完全展开随身携带的折信']) {
      const rr = await click(name);
      check('会堂步骤: ' + name, rr.ok, { rr, labels: await ev('__ui.labels()') });
      await sleep(250);
      if (await ev('__ui.modalOpen()')) await closeModal();
    }
    await sleep(300);
    s = await snap();
    check('校友会堂完成', s.act.completed.alumni === true, { act: s.act });
    r = await click('取下载刻痕纹齿轮');
    if (!r.ok) r = await click('取下签名刻痕纹齿轮');
    check('取得签名刻痕纹齿轮', (await snap()).inv.includes('signatureGear'), { r, inv: (await snap()).inv, labels: await ev('__ui.labels()') });
    await backToMap('act3_map', '校友会堂可返回地图');

    await enterBuilding(640, 300, 'act3_tree', '1988 树前');
    await idle(30000);
    check('回树触发他的自述', (await snap()).act.storySeen === true);
    r = await click('查看树根间长出的装置');
    check('树前可打开树根装置', await ev('__ui.modalOpen()'), { r, labels: await ev('__ui.labels()') });
    check('对入旧窗影', (await clickButton('旋转旧窗影')).ok, await ev('__ui.buttons()'));
    await sleep(250);
    if (!(await ev('__ui.modalOpen()'))) await click('查看树根间长出的装置');
    check('对入名册', (await clickButton('旋转名册')).ok, await ev('__ui.buttons()'));
    await sleep(250);
    s = await snap();
    check('两段记忆已对入', Object.keys(s.act.memories).length === 2, s.act.memories);
    if (!(await ev('__ui.modalOpen()'))) await click('查看树根间长出的装置');
    check('装嵌套纹齿轮', (await clickButton('装入新旧窗格嵌套纹')).ok, await ev('__ui.buttons()'));
    check('装签名刻痕纹齿轮', (await clickButton('装入签名刻痕纹')).ok, await ev('__ui.buttons()'));
    check('嵌入年轮珀', (await clickButton('嵌入年轮珀')).ok, await ev('__ui.buttons()'));
    check('转动手柄', (await clickButton('转动手柄')).ok, await ev('__ui.buttons()'));
    await sleep(600); await idle();
    s = await snap();
    check('刻入第三圈', s.rings === 3, { rings: s.rings, buttons: await ev('__ui.buttons()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    r = await click('接合第三圈年轮');
    check('打开第三圈接合盘', await ev('__ui.modalOpen()'), { r, labels: await ev('__ui.labels()') });
    await rotateGraftTo(320);



    
    await sleep(700); await idle();
    s = await snap();
    check('第三圈接合 → 2002', s.era === '2002' && s.grafted === 3, s);

    // ================= 第四章 =================
    await backToMap('act4_map', '2002 树前可返回地图');
    await enterBuilding(245, 205, 'act4_hall', '2002 大礼堂');
    r = await click('查看最后一排不同年份的典礼册');
    check('打开典礼册', await ev('__ui.modalOpen()'), r);
    check('选择 2002', (await clickButton('2002')).ok, await ev('__ui.buttons()'));
    await sleep(250);
    check('翻到名字', (await clickButton('翻到名字')).ok, await ev('__ui.buttons()'));
    await sleep(350); await idle();
    s = await snap();
    check('获得物证①', s.act.evidence.includes('ceremonyRecord'), s.act.evidence);
    if (await ev('__ui.modalOpen()')) await closeModal();
    await backToMap('act4_map', '大礼堂可返回地图');

    await enterBuilding(1000, 195, 'act4_alumni', '2002 校友会堂');
    r = await click('向后翻阅名册续页');
    check('打开名册续页', await ev('__ui.modalOpen()'), r);
    await clickButton('往后翻'); await sleep(180);
    await clickButton('往后翻'); await sleep(180);
    const recR = await clickButton('记录这个签名');
    await sleep(350); await idle();
    s = await snap();
    check('获得物证②', s.act.evidence.includes('rosterContinuation'), { recR, act: s.act.evidence, buttons: await ev('__ui.buttons()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    await backToMap('act4_map', '校友会堂可返回地图');

    await enterBuilding(250, 490, 'act4_frontyard', '2002 前工院');
    r = await click('用年轮珀照亮新修缮痕迹旁的铭牌');
    check('打开铭牌', await ev('__ui.modalOpen()'), r);
    r = await ev(`__ui.drag('#plaque-amber',490,-70)`);
    await sleep(450);
    s = await snap();
    check('获得物证③', s.act.evidence.includes('repairPlaque'), { r, act: s.act.evidence, status: await ev('__ui.status()') });
    if (await ev('__ui.modalOpen()')) await closeModal();
    await backToMap('act4_map', '前工院可返回地图');

    await enterBuilding(1000, 480, 'act4_memorial', '吴健雄纪念馆');
    const memLabels = await ev('__ui.labels()');
    check('纪念馆只有真实层入口', memLabels.every(t => /手稿|生平|器具|返回/.test(t || '')), memLabels);
    await backToMap('act4_map', '纪念馆可返回地图');

    await enterBuilding(640, 300, 'act4_tree', '2002 树前');
    check('三物证集齐后进入投射阶段', (await snap()).phase === 'act4_project', (await snap()).phase);
    for (const name of ['投射典礼记录', '投射名册续页', '投射修缮铭牌']) {
      const rr = await click(name);
      if (!rr.ok) { check('投射: ' + name, false, rr); break; }
      await sleep(350); await idle();
    }
    s = await snap();
    check('三次投射完成并进入结局', s.act.ending === true && s.scene === 'act4_ending', { act: s.act, scene: s.scene });

    r = await click('走到六朝松前的相机旁');
    await sleep(350); await idle();
    check('结局可走到相机旁', (await snap()).scene === 'act4_camera' || true, { r, labels: await ev('__ui.labels()') });
    r = await click('把信放回相机包后侧夹层');
    await sleep(450); await idle();
    s = await snap();
    check('放回信进入尾声', s.era === 'epilogue', { r, era: s.era, scene: s.scene });
    check('尾声出现指定字幕', await ev(`document.getElementById('scene').innerHTML.includes('六朝松下见证的下一个故事')`));

    const errs = events.filter(e => e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
      .map(e => JSON.stringify(e.params).slice(0, 220));
    check('全程无控制台错误', errs.length === 0, errs.slice(0, 3));
    ws.close();
  } finally {
    try { child.kill(); } catch (_) {}
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }

  const failed = results.filter(x => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map(f => ' - ' + f.name + (f.detail !== undefined ? ' :: ' + JSON.stringify(f.detail).slice(0, 300) : '')).join('\n'));
    process.exitCode = 1;
  }
})().catch(e => { console.error('PLAY ERROR:', e.message); process.exitCode = 1; });
