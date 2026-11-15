'use strict';
/* 玩家“好奇点击”回归：档案、年轮珀三级提示、声音开关、重开、错误答案反馈。
 * 这些不影响主线门槛，但真实玩家一定会点。 */
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
const INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : ' — ' + JSON.stringify(detail).slice(0, 260)}`);
};

(async () => {
  const port = 9950 + Math.floor(Math.random() * 40);
  const profile = path.join(os.tmpdir(), 'pine-extra-' + Date.now());
  const child = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
  try {
    let list;
    for (let i = 0; i < 120; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch (_) { await sleep(150); } }
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

    const idle = async () => {
      for (let i = 0; i < 120; i++) {
        const st = await ev(`({d:!document.getElementById('dialogue').hidden, c:!document.getElementById('cinematic').hidden})`);
        if (st.d) { await ev(`document.getElementById('dialogue-next').click()`); await sleep(40); continue; }
        if (!st.c) return;
        await sleep(60);
      }
    };
    const modal = () => ev(`!document.getElementById('modal-backdrop').hidden`);
    const modalTitle = () => ev(`document.getElementById('modal-title').textContent`);
    const modalText = () => ev(`document.getElementById('modal-body').textContent`);
    const closeModal = async () => { await ev(`document.getElementById('modal-close').click()`); await sleep(150); };
    const btn = async t => {
      const r = await ev(`(()=>{const b=[...document.querySelectorAll('#modal-body button')].find(b=>b.textContent.trim().includes(${JSON.stringify(t)})); if(!b) return {ok:false, buttons:[...document.querySelectorAll('#modal-body button')].map(b=>b.textContent.trim())}; if(b.disabled) return {ok:false,disabled:true}; b.click(); return {ok:true};})()`);
      await sleep(160); return r;
    };
    const clickHot = async name => {
      await idle();
      const r = await ev(`(()=>{const l=[...document.querySelectorAll('#scene [data-action]')]; const el=l.find(e=>(e.getAttribute('aria-label')||'')===${JSON.stringify(name)})||l.find(e=>(e.getAttribute('aria-label')||'').includes(${JSON.stringify(name)})); if(!el) return {ok:false,labels:l.map(e=>e.getAttribute('aria-label'))}; (el.querySelector('.hit-area')||el).dispatchEvent(new MouseEvent('click',{bubbles:true})); return {ok:true};})()`);
      await sleep(200); return r;
    };

    // 序章起步：档案在没看过任何场景前应有空态提示，而不是报错
    await ev(`document.getElementById('archive-button').click()`);
    await sleep(200);
    check('一开始点档案能打开且不报错', await modal(), await modalTitle());
    await closeModal();

    // 推进到 1933 图书馆（用内部快捷路径仅用于到达场景，之后全用点击）
    await ev(`
      PineGame.dispatch({type:'ENTER',scene:'prologue_pine'});
      PineGame.dispatch({type:'TAKE',item:'lens'});
      PineGame.dispatch({type:'USE',item:'lens',target:'filterFrame'});
      PineGame.dispatch({type:'TOUCH',target:'treeCrack'});
      PineGame.dispatch({type:'TAKE',item:'amber'});
      PineGame.dispatch({type:'USE',item:'amber',target:'treeCrack'});
      PineGame.dispatch({type:'TAKE',item:'waterCan'});
      PineGame.dispatch({type:'USE',item:'waterCan',target:'seedling'});
      PineGame.dispatch({type:'USE',item:'supportWood',target:'seedling'});
      PineGame.dispatch({type:'GRAFT'});
      true;
    `);
    await idle(); await sleep(400);
    await ev(`PineGame.dispatch({type:'ENTER',scene:'act1_library'})`);
    await idle(); await sleep(400);
    check('已进入图书馆（前置快捷到位）', (await ev('PineGame.state.scene')) === 'act1_library');

    // 年轮珀：三级提示逐级展开，且只在主动点击后出现
    await ev(`document.getElementById('amber-button').click()`);
    await sleep(250);
    check('点年轮珀打开提示面板', await modal(), await modalTitle());
    const t0 = await modalText();
    check('初始只显示第 1 级提示或未展开', !t0.includes('具体操作'), t0.slice(0, 60));
    await btn('听它怎么说');
    const t1 = await modalText();
    check('展开到第 1 级提示', t1.includes('关注哪里'), t1.slice(0, 80));
    await btn('再看一层');
    await btn('再看一层');
    const t3 = await modalText();
    check('可展开到第 3 级具体操作', t3.includes('具体操作'), t3.slice(0, 120));
    check('提示不会自动弹出（仍需手动关闭）', await modal());
    await closeModal();

    // 档案：看过的建筑应留下记录
    await ev(`document.getElementById('archive-button').click()`);
    await sleep(250);
    const arch = await modalText();
    check('档案记录了看过的建筑', arch.includes('孟芳图书馆'), arch.slice(0, 100));
    await closeModal();

    // 声音开关不应抛错
    await ev(`document.getElementById('audio-button').click()`);
    await sleep(250);
    check('声音开关可切换', (await ev(`document.getElementById('audio-button').textContent`)).includes('声'));
    await ev(`document.getElementById('audio-button').click()`);
    await sleep(200);

    // 错误答案反馈：抽屉错序
    await clickHot('检查抽屉的三个图案转盘');
    check('可打开抽屉转盘', await modal());
    await btn('打开抽屉');
    const st = await ev(`(document.getElementById('puzzle-status')||{}).textContent||''`);
    check('错误顺序给出可读反馈', st.length > 0, st);
    await closeModal();

    // 重开：确认框可取消，取消后仍在原场景
    await ev(`document.getElementById('restart-button').click()`);
    await sleep(250);
    check('重开先给确认', await modal(), await modalTitle());
    await btn('留在这里');
    await sleep(200);
    check('取消重开后仍在图书馆', (await ev('PineGame.state.scene')) === 'act1_library');

    // 确认重开 → 回到序章
    await ev(`document.getElementById('restart-button').click()`);
    await sleep(250);
    await btn('从头开始');
    await sleep(400); await idle();
    check('确认重开回到序章', (await ev('PineGame.state.era')) === 'prologue' && (await ev('PineGame.state.scene')) === 'prologue_campus');

    const errs = events.filter(e => e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
      .map(e => JSON.stringify(e.params).slice(0, 200));
    check('好奇点击全程无控制台错误', errs.length === 0, errs.slice(0, 3));
    ws.close();
  } finally {
    try { child.kill(); } catch (_) {}
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map(f => ' - ' + f.name + (f.detail !== undefined ? ' :: ' + JSON.stringify(f.detail).slice(0, 240) : '')).join('\n'));
    process.exitCode = 1;
  }
})().catch(e => { console.error('EXTRA ERROR:', e.message); process.exitCode = 1; });
