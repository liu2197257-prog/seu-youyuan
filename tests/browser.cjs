/* Browser regression over the Chrome DevTools Protocol: no npm dependencies.
 * Launch: node tests/browser.cjs [--keep]
 * Verifies: console cleanliness, full playthrough, all scene renderers, layout,
 * joystick release, modal/animation return protection, and saves screenshots.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'dist', 'index.html');
const SHOTS = path.join(__dirname, 'screenshots');
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
].find(p => fs.existsSync(p));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ' — ' + detail : ''}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function httpJson(url, tries = 120) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) { /* browser still starting */ }
    await sleep(150);
  }
  throw new Error('DevTools endpoint unavailable: ' + url);
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = e => reject(new Error('ws error')); });
    const cdp = new CDP(ws);
    ws.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) cdp.events.push(msg);
    };
    return cdp;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); } }, 30000);
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true, userGesture: true
    });
    if (res.exceptionDetails) throw new Error('page exception: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
    return res.result.value;
  }
}

async function main() {
  if (!EDGE) throw new Error('No Edge/Chrome found');
  fs.mkdirSync(SHOTS, { recursive: true });
  const port = 9333 + Math.floor(Math.random() * 200);
  const profile = path.join(os.tmpdir(), 'pine-cdp-' + Date.now());
  const child = spawn(EDGE, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--window-size=1280,720',
    '--autoplay-policy=no-user-gesture-required', 'about:blank'
  ], { stdio: 'ignore', detached: false });

  let cdp;
  try {
    const list = await httpJson(`http://127.0.0.1:${port}/json/list`);
    const page = list.find(t => t.type === 'page');
    cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Log.enable');
    const url = 'file:///' + INDEX.replace(/\\/g, '/');
    await cdp.send('Page.navigate', { url });
    await sleep(1200);

    const errors = () => cdp.events.filter(e =>
      e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
    ).map(e => JSON.stringify(e.params).slice(0, 300));

    // ---------- boot ----------
    const boot = await cdp.eval(`(() => {
      const fatal = document.getElementById('fatal-error');
      return {
        hasGame: !!window.PineGame,
        fatal: fatal && !fatal.hidden ? fatal.textContent : null,
        era: document.getElementById('era-label').textContent,
        svg: !!document.querySelector('#scene svg'),
        hotspots: document.querySelectorAll('#scene [data-action]').length,
        amberHidden: document.getElementById('amber-button').hidden,
        objective: document.getElementById('objective').textContent
      };
    })()`);
    record('启动无致命错误', !boot.fatal, boot.fatal);
    record('游戏内核已初始化', boot.hasGame);
    record('首屏渲染出 SVG 场景', boot.svg);
    record('首屏存在可交互热区', boot.hotspots > 0, `hotspots=${boot.hotspots}`);
    record('未取得年轮珀时隐藏年轮珀按钮', boot.amberHidden);
    record('首屏给出目标提示', !!boot.objective);

    await cdp.eval(`window.__PINE_TEST_TIMING__ = true; true`);

    // ---------- helpers in page ----------
    await cdp.eval(`
      window.__t = {
        idle() {
          return !PineRenderer.busy && !PineRenderer.dialogueOpen &&
            document.getElementById('cinematic').hidden;
        },
        click(id) {
          const el = document.getElementById(id);
          if (!el) return false;
          el.click(); return true;
        },
        summary() {
          const s = PineGame.state;
          return { era: s.era, scene: s.scene, phase: s.phase,
            rings: s.ringAmber.rings, grafted: s.ringAmber.grafted,
            inv: s.inventory.slice(), solved: s.solved.length,
            act: s.act ? { completed: s.act.completed, steps: s.act.steps,
              slots: s.act.device.slots, memories: s.act.device.memories,
              repaired: s.act.device.repaired, engraved: s.act.engraved,
              evidence: s.act.evidence, projected: s.act.projected,
              ending: s.act.ending } : null,
            letter: s.letter, epilogue: s.epilogue ? true : false };
        }
      };
      true;
    `);

    async function settle(maxRounds = 320) {
      // 需要连续多轮稳定空闲，避免把「演出尚未启动」误判为结束。
      let idleStreak = 0;
      for (let i = 0; i < maxRounds; i++) {
        const st = await cdp.eval(`(() => ({
          idle: __t.idle(),
          dialogue: !document.getElementById('dialogue').hidden,
          cinematic: !document.getElementById('cinematic').hidden
        }))()`);
        if (st.dialogue) { idleStreak = 0; await cdp.eval(`__t.click('dialogue-next')`); await sleep(25); continue; }
        if (st.cinematic || !st.idle) { idleStreak = 0; await sleep(40); continue; }
        idleStreak++;
        if (idleStreak >= 3) return true;
        await sleep(75);
      }
      return false;
    }
    async function act(action) {
      const json = JSON.stringify(action);
      const out = await cdp.eval(`(() => {
        const before = PineGame.state;
        const r = PineGame.dispatch(${json});
        const after = PineGame.state;
        return { changed: r.changed === true, accepted: r.accepted !== false,
          rejected: (r.effects || []).some(e => e.type === 'REJECTED'),
          same: before === after,
          era: after.era, scene: after.scene };
      })()`);
      await settle();
      return out;
    }
    const stateOf = () => cdp.eval(`__t.summary()`);
    async function shot(name) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64'));
    }

    // ---------- prologue ----------
    await shot('00-prologue-campus');
    // 真实 UI 点击路径：地图热区 → 走近 → 交互按钮
    const uiPath = await cdp.eval(`(async () => {
      const target = [...document.querySelectorAll('#scene [data-action="MAP_TARGET"]')]
        .find(el => el.dataset.target === 'pine');
      if (!target) return { step: 'no map target' };
      const hit = target.querySelector('.hit-area');
      const b = hit.getBoundingClientRect();
      const stage = document.getElementById('stage').getBoundingClientRect();
      const toScene = (cx, cy) => ({ x: (cx - stage.left) * 1280 / stage.width, y: (cy - stage.top) * 720 / stage.height });
      PineGame.runtime.player = toScene(b.left + b.width / 2, b.top + b.height / 2 + 40);
      await new Promise(r => setTimeout(r, 320));
      const near = !!document.getElementById('interact-button').hidden === false;
      document.getElementById('interact-button').click();
      await new Promise(r => setTimeout(r, 400));
      return { step: 'ok', near, scene: PineGame.state.scene,
        hotspots: document.querySelectorAll('#scene [data-action]').length };
    })()`);
    record('UI 路径：走近六朝松出现交互按钮并可进入', uiPath.near === true && uiPath.scene === 'prologue_pine', JSON.stringify(uiPath));

    let r = await stateOf();
    record('进入六朝松近景', r.era === 'prologue' && r.scene === 'prologue_pine', JSON.stringify(r));
    await shot('01-prologue-camera');

    // 无镜片时绝不能看到守忆者、也不能让树断裂
    let st = await stateOf();
    record('门槛1：未装镜片时树未断裂', (await cdp.eval(`PineGame.state.prologue.treeBroken`)) === false);

    r = await act({ type: 'TAKE', item: 'lens' });
    record('拾取特殊镜片', r.changed);
    r = await act({ type: 'USE', item: 'lens', target: 'filterFrame' });
    record('装入滤镜框后出现守忆者并触发断裂', r.changed);
    await settle();
    const broken = await cdp.eval(`PineGame.state.prologue`);
    record('断裂发生于触碰之前（状态由安装动作一次性驱动）', broken.treeBroken === true && broken.crackTouched === false);
    await shot('02-prologue-broken');

    r = await act({ type: 'TOUCH', target: 'treeCrack' });
    record('触碰树干裂口', r.changed);
    r = await act({ type: 'TAKE', item: 'amber' });
    record('树脂凝成唯一一枚年轮珀', r.changed && (await stateOf()).rings === 0);
    await shot('03-prologue-amber');

    r = await act({ type: 'USE', item: 'amber', target: 'treeCrack' });
    record('年轮珀贴入纹路并进入植松记忆', r.changed && r.scene === 'prologue_sprout');
    await shot('04-prologue-sprout');

    r = await act({ type: 'TAKE', item: 'waterCan' });
    record('拾取水罐', r.changed);
    r = await act({ type: 'USE', item: 'waterCan', target: 'seedling' });
    record('浇灌幼苗', r.changed);
    r = await act({ type: 'USE', item: 'supportWood', target: 'seedling' });
    record('扶稳幼苗', r.changed);
    await settle();
    const voice = await cdp.eval(`PineGame.state.prologue.watered && PineGame.state.prologue.supported`);
    record('两件事都完成后才允许接合', voice === true);
    r = await act({ type: 'GRAFT' });
    record('序章极简接合 → 进入一九三三年', r.changed && r.era === '1933' && r.scene === 'act1_tree');
    await shot('05-act1-tree');

    // ---------- act 1 ----------
    r = await act({ type: 'ENTER', scene: 'act1_library' });
    record('进入孟芳图书馆', r.changed && r.scene === 'act1_library');
    await shot('06-act1-library');
    r = await act({ type: 'TAKE', item: 'drawingFragment1' });
    record('从书页取得第一片图纸', r.changed);
    r = await act({ type: 'PUZZLE', id: 'A1_LOCK', value: ['square', 'circle', 'triangle'] });
    record('错误图案顺序被拒绝（状态不变）', r.rejected === true && r.same === true);

    // 真实 UI 路径：用弹层里的三个图案转盘解开抽屉
    const lockUI = await cdp.eval(`(async () => {
      PineGame.onAction({ action: 'OPEN_LIBRARY_LOCK' });
      await new Promise(r => setTimeout(r, 150));
      const opened = !document.getElementById('modal-backdrop').hidden;
      const dials = () => [...document.querySelectorAll('#modal-body .dial')];
      // 先故意错一次
      document.getElementById('unlock-drawer').click();
      await new Promise(r => setTimeout(r, 80));
      const rejectedOnWrong = PineGame.state.act.steps.drawerOpen !== true;
      const feedback = (document.getElementById('puzzle-status') || {}).textContent || '';
      // 正确顺序：圆、三角、方形
      for (let i = 0; i < 1; i++) { dials()[1].click(); await new Promise(r => setTimeout(r, 30)); }
      for (let i = 0; i < 2; i++) { dials()[2].click(); await new Promise(r => setTimeout(r, 30)); }
      document.getElementById('unlock-drawer').click();
      await new Promise(r => setTimeout(r, 120));
      return { opened, rejectedOnWrong, feedback, solved: PineGame.state.act.steps.drawerOpen === true,
        modalClosed: document.getElementById('modal-backdrop').hidden };
    })()`);
    record('UI 路径：三个图案转盘可操作并给出失败反馈', lockUI.opened && lockUI.rejectedOnWrong && !!lockUI.feedback, JSON.stringify(lockUI));
    record('UI 路径：正确图案顺序打开抽屉', lockUI.solved === true && lockUI.modalClosed === true, JSON.stringify(lockUI));

    r = await act({ type: 'TAKE', item: 'drawingFragment2' });
    record('取得第二片图纸', r.changed);

    // 真实指针拖动：图纸拼合吸附
    const dragUI = await cdp.eval(`(async () => {
      PineGame.onAction({ action: 'OPEN_BLUEPRINT' });
      await new Promise(r => setTimeout(r, 180));
      const piece = document.getElementById('blueprint-piece');
      if (!piece) return { error: 'no piece' };
      const ctm = piece.ownerSVGElement.getScreenCTM();
      const scale = ctm.a; // 谜题画布自身的缩放，而非舞台缩放
      const b = piece.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const opt = { pointerId: 11, bubbles: true, clientX: cx, clientY: cy };
      piece.dispatchEvent(new PointerEvent('pointerdown', opt));
      const dx = (580 - 850) * scale;
      piece.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, opt, { clientX: cx + dx })));
      await new Promise(r => setTimeout(r, 60));
      piece.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, opt, { clientX: cx + dx })));
      await new Promise(r => setTimeout(r, 200));
      return { joined: PineGame.state.act.steps.joined === true,
        modalClosed: document.getElementById('modal-backdrop').hidden,
        hasPattern: PineGame.state.inventory.includes('drawingPattern') };
    })()`);
    record('UI 路径：拖动碎片可吸附拼合出完整图样', dragUI.joined === true && dragUI.hasPattern === true, JSON.stringify(dragUI));

    r = await act({ type: 'PUZZLE', id: 'A2', value: { x: 160, y: 96, angle: 90 } });
    record('重复拼合被安全拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'A3', value: 0 });
    record('错误描图倾角被拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'A3', value: 30 });
    record('描图架对齐并获得窗格纹齿轮', r.changed && (await stateOf()).inv.includes('windowGear'));

    r = await act({ type: 'ENTER', scene: 'act1_hall' });
    record('进入大礼堂', r.changed);
    await shot('07-act1-hall');
    r = await act({ type: 'PUZZLE', id: 'A4', value: ['low', 'high', 'medium', 'low'] });
    record('未装木槌时敲击无效', r.rejected === true);
    r = await act({ type: 'TAKE', item: 'mallet' });
    record('拾取木槌', r.changed);
    r = await act({ type: 'USE', item: 'mallet', target: 'stand' });
    record('木槌装回支架', r.changed);
    r = await act({ type: 'PUZZLE', id: 'A4', value: ['low', 'high', 'medium', 'high'] });
    record('错误音序被拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'A4', value: ['low', 'high', 'medium', 'low'] });
    record('低—高—中—低 获得声波纹齿轮', r.changed && (await stateOf()).inv.includes('soundGear'));

    r = await act({ type: 'ENTER', scene: 'act1_gym' });
    record('进入体育馆', r.changed);
    await shot('08-act1-gym');
    // 门槛3：缺齿轮不能刻轮
    r = await act({ type: 'TURN_HANDLE' });
    record('门槛3：未装齿轮时手柄空转', r.rejected === true);
    r = await act({ type: 'USE', item: 'windowGear', target: 'windowSlot' });
    record('装入窗格纹齿轮', r.changed);
    r = await act({ type: 'TURN_HANDLE' });
    record('门槛3：仅一枚齿轮仍不能刻轮', r.rejected === true);
    r = await act({ type: 'USE', item: 'soundGear', target: 'soundSlot' });
    record('装入声波纹齿轮', r.changed);
    r = await act({ type: 'TURN_HANDLE' });
    record('缺年轮珀时不能刻轮', r.rejected === true);
    r = await act({ type: 'USE', item: 'amber', target: 'amberSocket' });
    record('年轮珀嵌入中央凹槽', r.changed);
    r = await act({ type: 'TURN_HANDLE' });
    st = await stateOf();
    record('刻入第一圈年轮', r.changed && st.rings === 1 && st.grafted === 0);
    await shot('09-act1-device-done');

    // 门槛4：刻好未接合不能跳幕
    r = await act({ type: 'ENTER', scene: 'act1_tree' });
    record('刻好后回到树下', r.changed && r.scene === 'act1_tree');
    st = await stateOf();
    record('门槛4：刻好但未接合时仍停留 1933', st.era === '1933');
    await shot('10-act1-graft-ready');
    r = await act({ type: 'GRAFT' });
    st = await stateOf();
    record('第一圈接合 → 进入一九五九年', r.changed && st.era === '1959' && st.grafted === 1);
    await shot('11-act2-tree');

    // ---------- act 2 ----------
    r = await act({ type: 'ENTER', scene: 'act2_bldg54' });
    record('进入五四楼', r.changed);
    await shot('12-act2-bldg54');
    r = await act({ type: 'TAKE', item: 'leafFrame' });
    record('取得叶片木框', r.changed);
    r = await act({ type: 'TAKE', item: 'leafFilm' });
    record('取得叶片薄片', r.changed);
    r = await act({ type: 'COMBINE', items: ['leafFrame', 'leafFilm'], result: 'indicatorLeaf' });
    record('组合出指示叶片', r.changed);
    r = await act({ type: 'USE', item: 'indicatorLeaf', target: 'modelSocket' });
    st = await stateOf();
    record('安装指示叶片并获得齿轮与行李标签记忆', r.changed && st.inv.includes('indicatorGear') && st.inv.includes('departureNote'));

    r = await act({ type: 'ENTER', scene: 'act2_power' });
    record('进入动力楼', r.changed);
    await shot('13-act2-power');
    r = await act({ type: 'PUZZLE', id: 'B2', value: { links: ['input-middle'], notes: ['low', 'high', 'medium', 'low'] } });
    record('错误传动连接被拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'B2', value: { links: ['input-middle', 'middle-output'], notes: ['low', 'high', 'medium', 'low'] } });
    record('传动调整后模型完整发声', r.changed && (await stateOf()).inv.includes('transmissionGear'));

    r = await act({ type: 'ENTER', scene: 'act2_bldg55' });
    record('进入五五楼', r.changed);
    await shot('14-act2-bldg55');
    r = await act({ type: 'PUZZLE', id: 'B4_REPAIR', value: 'aligned' });
    record('未汇合线索前不能修传动', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'B3', value: { note: 'departureNote', trace: 'repairTrace' } });
    record('汇合离校字条与修补痕迹', r.changed);
    r = await act({ type: 'PUZZLE', id: 'B4_REPAIR', value: 'aligned' });
    record('修复一处传动连接', r.changed);
    r = await act({ type: 'USE', item: 'indicatorGear', target: 'indicatorSlot' });
    record('装入指示叶片纹齿轮', r.changed);
    r = await act({ type: 'USE', item: 'transmissionGear', target: 'transmissionSlot' });
    record('装入传动三轮纹齿轮', r.changed);
    r = await act({ type: 'USE', item: 'amber', target: 'amberSocket' });
    record('嵌入年轮珀', r.changed);
    r = await act({ type: 'TURN_HANDLE' });
    st = await stateOf();
    record('刻入第二圈年轮', r.changed && st.rings === 2 && st.grafted === 1);
    await shot('15-act2-device-done');
    r = await act({ type: 'ENTER', scene: 'act2_tree' });
    st = await stateOf();
    record('第二幕未接合前仍停留 1959', st.era === '1959');
    r = await act({ type: 'GRAFT' });
    st = await stateOf();
    record('第二圈接合 → 进入一九八八年', r.changed && st.era === '1988' && st.grafted === 2);
    await shot('16-act3-tree');

    // ---------- act 3 ----------
    r = await act({ type: 'ENTER', scene: 'act3_alumni' });
    record('门槛5：前工院未完成时仍可进入校友会堂', r.changed && r.scene === 'act3_alumni');
    r = await act({ type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } });
    record('门槛5：必要线索在前工院完成前不出现', r.rejected === true);

    r = await act({ type: 'ENTER', scene: 'act3_frontyard' });
    record('进入前工院', r.changed);
    await shot('17-act3-frontyard');
    r = await act({ type: 'PUZZLE', id: 'C1', value: { x: 0, y: 0, angle: 0 } });
    record('错误投射位置被拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'C1', value: { x: 220, y: 140, angle: 45 } });
    record('投射对位获得新旧窗格嵌套纹齿轮', r.changed && (await stateOf()).inv.includes('nestedWindowGear'));

    r = await act({ type: 'ENTER', scene: 'act3_alumni' });
    r = await act({ type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } });
    record('找到保留的 1959 年名册', r.changed);
    r = await act({ type: 'PUZZLE', id: 'C2_LESSON', value: 'lessonPlan' });
    record('由名册找到教案', r.changed);
    r = await act({ type: 'PUZZLE', id: 'C2_PROJECT', value: { memory: 'modelTuning1959', target: 'lessonPlan' } });
    record('投射比对并解决执念一，获得签名刻痕纹齿轮', r.changed && (await stateOf()).inv.includes('signatureGear'));
    r = await act({ type: 'PUZZLE', id: 'C2_LETTER', value: 'unfold' });
    record('信件完全展开（仅玩家可见）', r.changed);
    await shot('18-act3-alumni');

    r = await act({ type: 'ENTER', scene: 'act3_tree' });
    const storySeen = await cdp.eval(`PineGame.state.act.storySeen`);
    record('两栋完成后回树触发他的自述', r.changed && storySeen === true);
    await shot('19-act3-self-story');

    // 门槛：必须先对入记忆，再装齿轮
    r = await act({ type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' });
    record('未对入记忆时齿轮无法咬合', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'oldWindowShadow', slot: 'nestedWindowSlot' } });
    record('对入旧窗影', r.changed);
    r = await act({ type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'roster1959', slot: 'signatureSlot' } });
    record('对入名册', r.changed);
    r = await act({ type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' });
    record('装入新旧窗格嵌套纹齿轮', r.changed);
    r = await act({ type: 'USE', item: 'signatureGear', target: 'signatureSlot' });
    record('装入签名刻痕纹齿轮', r.changed);
    r = await act({ type: 'USE', item: 'amber', target: 'amberSocket' });
    r = await act({ type: 'TURN_HANDLE' });
    st = await stateOf();
    record('刻入第三圈年轮', r.changed && st.rings === 3);
    await shot('20-act3-device-done');
    r = await act({ type: 'GRAFT' });
    st = await stateOf();
    record('第三圈接合 → 开启二〇〇二年', r.changed && st.era === '2002' && st.grafted === 3);
    await shot('21-act4-tree');

    // ---------- act 4 ----------
    r = await act({ type: 'ENTER', scene: 'act4_memorial' });
    record('纪念馆可自由进入', r.changed && r.scene === 'act4_memorial');
    await shot('22-act4-memorial');
    r = await act({ type: 'TAKE', item: 'anything' });
    record('门槛7：纪念馆内无任何拾取/谜题入口', r.rejected === true && r.same === true);

    // 门槛6：物证未集齐不能投射
    r = await act({ type: 'ENTER', scene: 'act4_tree' });
    r = await act({ type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' });
    record('门槛6：三物证未集齐不能投射', r.rejected === true);

    r = await act({ type: 'ENTER', scene: 'act4_hall' });
    record('进入大礼堂取物证①', r.changed);
    await shot('23-act4-hall');
    r = await act({ type: 'PUZZLE', id: 'D1', value: { year: 2001, name: '沈立' } });
    record('错误典礼年份被拒绝', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'D1', value: { year: 2002, name: '沈立' } });
    record('获得物证① 典礼记录', r.changed);

    r = await act({ type: 'ENTER', scene: 'act4_alumni' });
    r = await act({ type: 'PUZZLE', id: 'D2', value: { page: 'continuation', name: '沈立' } });
    record('获得物证② 名册续页', r.changed);
    await shot('24-act4-alumni');

    r = await act({ type: 'ENTER', scene: 'act4_frontyard' });
    r = await act({ type: 'PUZZLE', id: 'D3', value: { target: 'repairPlaque', name: '沈立' } });
    record('获得物证③ 修缮铭牌', r.changed);
    await shot('25-act4-frontyard');

    r = await act({ type: 'ENTER', scene: 'act4_tree' });
    r = await act({ type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' });
    record('逐件投射 1/3', r.changed);
    r = await act({ type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' });
    record('同一件物证不能重复投射', r.rejected === true);
    r = await act({ type: 'PUZZLE', id: 'D4', value: 'rosterContinuation' });
    record('逐件投射 2/3', r.changed);
    r = await act({ type: 'PUZZLE', id: 'D4', value: 'repairPlaque' });
    st = await stateOf();
    record('第三次投射触发结局（他散成墨粒、新芽从裂口长出）', r.changed && st.scene === 'act4_ending' && st.act.ending === true);
    await shot('26-act4-ending');

    r = await act({ type: 'USE', item: 'letter', target: 'cameraBag' });
    st = await stateOf();
    record('玩家把信放回相机包 → 尾声', r.changed && st.era === 'epilogue' && st.epilogue === true);
    await sleep(400);
    await settle();
    const subtitle = await cdp.eval(`document.querySelector('#scene').innerHTML.includes('六朝松下见证的下一个故事')`);
    record('尾声出现指定字幕', subtitle === true);
    await shot('27-epilogue');

    // ---------- all scene renderers ----------
    const sceneCheck = await cdp.eval(`(() => {
      const eras = { prologue:'prologue', '1933':'act1', '1959':'act2', '1988':'act3', '2002':'act4', epilogue:'epilogue' };
      const scenes = ['prologue_campus','prologue_pine','prologue_sprout',
        'act1_map','act1_tree','act1_library','act1_hall','act1_gym',
        'act2_map','act2_tree','act2_bldg54','act2_power','act2_bldg55',
        'act3_map','act3_tree','act3_frontyard','act3_alumni',
        'act4_map','act4_tree','act4_hall','act4_alumni','act4_frontyard','act4_memorial','act4_ending',
        'epilogue'];
      const failures = [];
      const base = PineState.createInitialState();
      base.era = '2002'; base.act = { id:'act4', gears:[], completed:{}, steps:{}, evidence:[], projected:[],
        device:{ slots:{}, memories:{}, repaired:true, amberInserted:false }, engraved:false, grafted:false, storySeen:false, ending:true };
      base.ringAmber = { owned:true, rings:3, grafted:3, memories:[] };
      for (const scene of scenes) {
        const era = Object.keys(eras).find(k => scene.startsWith(eras[k]) || (scene === 'epilogue' && k === 'epilogue'));
        const st = JSON.parse(JSON.stringify(base));
        st.era = era; st.scene = scene; st.phase = scene;
        if (era === 'prologue') { st.prologue = Object.assign({}, st.prologue, { enteredMemory: scene === 'prologue_sprout', treeBroken: scene === 'prologue_pine' }); }
        try {
          PineRenderer.render(st, { player:{x:640,y:620}, selectedItem:null, prologueMode:'pine', letterCamera:false });
          const svg = document.querySelector('#scene svg');
          if (!svg || svg.innerHTML.length < 200) failures.push(scene + ':empty');
        } catch (e) { failures.push(scene + ':' + e.message); }
      }
      return failures;
    })()`);
    record('全部 25 个场景均可渲染', sceneCheck.length === 0, sceneCheck.join(' | '));

    // ---------- layout across viewports ----------
    const viewports = [[667, 375], [740, 360], [844, 390], [915, 412], [1280, 720], [1920, 1080]];
    const layoutIssues = [];
    for (const [w, h] of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 1000 });
      await sleep(220);
      const info = await cdp.eval(`(() => {
        const doc = document.documentElement;
        const stage = document.getElementById('stage').getBoundingClientRect();
        const overflowX = doc.scrollWidth - doc.clientWidth;
        const overflowY = doc.scrollHeight - doc.clientHeight;
        const ids = ['amber-button','inventory','joystick','interact-button','audio-button'];
        const outside = ids.filter(id => {
          const el = document.getElementById(id);
          if (!el || el.hidden) return false;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          return r.left < stage.left - 1 || r.right > stage.right + 1 || r.top < stage.top - 1 || r.bottom > stage.bottom + 1;
        });
        return { overflowX, overflowY, outside, stageW: Math.round(stage.width), stageH: Math.round(stage.height), w: innerWidth, h: innerHeight };
      })()`);
      if (info.overflowX > 0 || info.overflowY > 0) layoutIssues.push(`${w}x${h} overflow ${info.overflowX}/${info.overflowY}`);
      if (info.outside.length) layoutIssues.push(`${w}x${h} outside: ${info.outside.join(',')}`);
      if (info.stageW > info.w + 1) layoutIssues.push(`${w}x${h} stage too wide`);
    }
    record('六种横屏/桌面尺寸均无溢出且控件在画布内', layoutIssues.length === 0, layoutIssues.join(' | '));
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await sleep(150);

    // ---------- 44px hit targets ----------
    const hitCheck = await cdp.eval(`(() => {
      const stage = document.getElementById('stage').getBoundingClientRect();
      const scale = stage.width / 1280;
      const svg = document.querySelector('#scene svg');
      const bad = [];
      if (!svg) return ['no svg'];
      const boxes = [];
      svg.querySelectorAll('.hit-area, .art-hit-area').forEach(el => {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const cw = b.width / scale, ch = b.height / scale;
        if (cw < 43.9 || ch < 43.9) bad.push(el.parentElement?.dataset?.action + ':' + Math.round(cw) + 'x' + Math.round(ch));
        boxes.push({ b, label: el.parentElement?.getAttribute('aria-label') || el.dataset.hit || '?' });
      });
      let overlaps = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].b, c = boxes[j].b;
          const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left);
          const oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
          if (ox > 6 && oy > 6) overlaps.push(boxes[i].label + '×' + boxes[j].label);
        }
      }
      return { bad, overlaps };
    })()`);
    record('热区不小于 44×44 CSS px', hitCheck.bad.length === 0, hitCheck.bad.join(','));
    record('当前场景热区不重叠', hitCheck.overlaps.length === 0, hitCheck.overlaps.join(','));

    // ---------- joystick release & return protection ----------
    await cdp.eval(`PineGame.restart(); __PINE_TEST_TIMING__ = true; true`);
    await sleep(200);
    const joy = await cdp.eval(`(async () => {
      const joy = document.getElementById('joystick');
      const r = joy.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const before = JSON.stringify(PineGame.runtime.move);
      joy.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: cx+30, clientY: cy, bubbles: true }));
      await new Promise(r => setTimeout(r, 60));
      const during = JSON.stringify(PineGame.runtime.move);
      joy.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: cx+30, clientY: cy, bubbles: true }));
      await new Promise(r => setTimeout(r, 60));
      const after = JSON.stringify(PineGame.runtime.move);
      window.dispatchEvent(new Event('blur'));
      await new Promise(r => setTimeout(r, 60));
      const blurred = JSON.stringify(PineGame.runtime.move);
      return { before, during, after, blurred, knob: document.getElementById('joystick-knob').style.transform };
    })()`);
    record('摇杆按下产生移动', joy.before !== joy.during, JSON.stringify(joy));
    record('摇杆释放后移动归零', joy.after === '{"x":0,"y":0}', joy.after);
    record('失焦后移动归零且摇杆复位', joy.blurred === '{"x":0,"y":0}' && (joy.knob === '' || /translate\(0px, 0px\)/.test(joy.knob)), JSON.stringify(joy));

    const ret = await cdp.eval(`(async () => {
      PineRenderer.openModal('测试弹层', '<p>x</p>', {});
      const opened = PineRenderer.modalOpen;
      PineRenderer.beginScene();
      return { opened, closedAfter: !PineRenderer.modalOpen, busy: PineRenderer.busy };
    })()`);
    record('场景切换会强制关闭弹层并解除忙碌锁', ret.opened === true && ret.closedAfter === true && ret.busy === false, JSON.stringify(ret));

    // ---------- offline & visual invariants ----------
    const offline = await cdp.eval(`(() => {
      const external = performance.getEntriesByType('resource')
        .filter(e => /^https?:/i.test(e.name)).map(e => e.name);
      return { external, inlineSvg: document.querySelectorAll('#scene svg').length };
    })()`);
    record('运行期无任何外部网络请求', offline.external.length === 0, offline.external.join(','));

    const visuals = await cdp.eval(`(() => {
      const fail = [];
      const wrap = (inner) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-240 -240 480 480">' + inner + '</svg>';
      const parse = (svg) => {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')) throw new Error('invalid svg');
        return doc;
      };

      // 1) 年轮珀：三态可区分、无白色高光
      const ambers = [0, 1, 2, 3].map(n => PineArt.amber({ rings: n, grafted: 0 }, {}));
      const states = ambers.map(svg => {
        const doc = parse(wrap(svg));
        return {
          rings: doc.querySelectorAll('.amber-ring.is-engraved').length,
          structure: doc.querySelectorAll('.amber-ring.is-blank').length,
          notch: doc.querySelectorAll('.amber-register-notch').length,
          heart: doc.querySelectorAll('.amber-tree-heart').length
        };
      });
      if (states.some((s, i) => s.rings !== i)) fail.push('amber rings mismatch: ' + JSON.stringify(states));
      if (states.some(s => s.structure !== 3 - s.rings)) fail.push('amber structure rings wrong');
      if (states.some(s => s.notch !== 1 || s.heart !== 1)) fail.push('amber notch/heart missing');
      const bright = [];
      ambers.forEach((svg, i) => {
        parse(wrap(svg)).querySelectorAll('[fill],[stroke]').forEach(el => {
          ['fill', 'stroke'].forEach(attr => {
            const value = el.getAttribute(attr);
            if (!value || !/^#/.test(value)) return;
            const hex = value.slice(1);
            if (hex.length !== 6) return;
            const [r, g, b] = [0, 2, 4].map(o => parseInt(hex.slice(o, o + 2), 16) / 255);
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (lum > 0.9) bright.push('rings' + i + ':' + attr + '=' + value);
          });
        });
      });
      if (bright.length) fail.push('amber near-white: ' + bright.slice(0, 3).join(','));

      // 2) 裂痕始终保留
      [1, 2, 3].forEach(g => {
        const doc = parse(wrap(PineArt.pine({ status: 'restoring', grafted: g }, { vivid: false })));
        if (!doc.querySelector('.pine-crack')) fail.push('crack missing at grafted=' + g);
        const wound = doc.querySelector('.pine-wound-sprout');
        if (wound) fail.push('sprout appeared too early at grafted=' + g);
      });
      const sproutDoc = parse(wrap(PineArt.pine({ status: 'sprout', grafted: 3 }, { vivid: true })));
      if (!sproutDoc.querySelector('.pine-crack')) fail.push('crack missing in sprout state');
      if (!sproutDoc.querySelector('.pine-wound-sprout')) fail.push('sprout missing in sprout state');

      // 3) 守忆者无清晰五官；仅转头时才出现眼部亮点
      const stand = parse(wrap(PineArt.keeper({ pose: 'stand' })));
      const turn = parse(wrap(PineArt.keeper({ pose: 'turn' })));
      if (stand.querySelectorAll('.keeper-turn-eye').length !== 0) fail.push('keeper has eyes while standing');
      if (turn.querySelectorAll('.keeper-turn-eye').length !== 1) fail.push('keeper turn eye missing');
      if (!stand.querySelector('.keeper-featureless-head')) fail.push('keeper head not featureless');

      // 4) 唯一真正饱和的绿只出现在新芽
      const saturated = (svg) => {
        const m = svg.match(/#(?:24b86b|19794e|[0-3][0-9a-f]b[0-9a-f]{2}[a-f0-9]{2})/gi) || [];
        return m.length;
      };
      const mutedSprout = PineArt.sprout({ vivid: false });
      const vividSprout = PineArt.sprout({ vivid: true });
      if (saturated(mutedSprout) !== 0) fail.push('muted sprout uses saturated green');
      if (saturated(vividSprout) === 0) fail.push('vivid sprout lacks saturated green');
      const actPines = ['1933', '1959', '1988'].map(era => PineArt.pine({ status: 'restoring', grafted: 1 }, { era }));
      if (actPines.some(svg => /#24b86b/i.test(svg))) fail.push('saturated green leaked into normal acts');

      // 5) 场景图层顺序固定
      const scene = PineArt.scene('t', { background: 'a', midground: 'b', interactable: 'c', overlay: 'd', character: 'e' }, {});
      const order = [...scene.matchAll(/data-layer="([a-z]+)"/g)].map(m => m[1]).join(',');
      if (order !== 'background,midground,interactable,overlay,character') fail.push('layer order: ' + order);

      return fail;
    })()`);
    record('年轮珀三态可辨且无白色高光', !visuals.some(f => /amber/.test(f)), visuals.filter(f => /amber/.test(f)).join(' | '));
    record('裂痕始终保留、新芽只在结局出现', !visuals.some(f => /crack|sprout appeared/.test(f)), visuals.filter(f => /crack|sprout appeared/.test(f)).join(' | '));
    record('守忆者无清晰五官（转身才有眼部亮点）', !visuals.some(f => /keeper/.test(f)), visuals.filter(f => /keeper/.test(f)).join(' | '));
    record('唯一饱和绿只留给新芽', !visuals.some(f => /saturat|green/.test(f)), visuals.filter(f => /saturat|green/.test(f)).join(' | '));
    record('SVG 场景五层顺序固定', !visuals.some(f => /layer order/.test(f)), visuals.find(f => /layer order/.test(f)) || '');

    // ---------- final console ----------
    const errs = errors();
    record('全流程无未捕获异常与控制台错误', errs.length === 0, errs.slice(0, 4).join(' || '));
  } finally {
    try { if (cdp) await cdp.send('Browser.close'); } catch (_) { /* ignore */ }
    try { child.kill(); } catch (_) { /* ignore */ }
    await sleep(250);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) { /* windows lock */ }
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map(f => ' - ' + f.name + (f.detail ? ' :: ' + f.detail : '')).join('\n'));
    process.exitCode = 1;
  }
}

main().catch(err => { console.error('BROWSER TEST ERROR:', err.message); process.exitCode = 1; });
