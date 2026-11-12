/* DOM renderer and animation lifetime manager. All narrative decisions stay in state.js. */
(function (global) {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = null, runtime = null;
  let generation = 1, toastTimer = 0, dialogueResolve = null, dialogueLines = [], dialogueIndex = 0;
  let busy = false, modalOnClose = null, lastFocus = null;
  const timers = new Set();
  const eraNames = { prologue: '当代', act1: '一九三三年末', act2: '一九五九年', act3: '一九八八年', act4: '二〇〇二年', epilogue: '当代' };

  function wait(ms) {
    const token = generation;
    // 仅供自动化回归：把演出等待压缩到极短，不改变任何状态与判定。
    if (global.__PINE_TEST_TIMING__) ms = Math.min(ms, 30);
    return new Promise(resolve => {
      const id = setTimeout(() => { timers.delete(id); resolve(token === generation); }, ms);
      timers.add(id);
    });
  }
  function cancelAsync() {
    generation++;
    timers.forEach(clearTimeout); timers.clear();
    clearTimeout(toastTimer);
    if (dialogueResolve) { const resolve = dialogueResolve; dialogueResolve = null; resolve(false); }
    dialogueLines = []; $('dialogue').hidden = true;
    busy = false;
    if (global.PineInput) PineInput.reset();
    if (global.PineAudio) PineAudio.stopAll();
  }
  function setBusy(value) {
    busy = !!value;
    $('modal-close').disabled = busy;
    $('restart-button').disabled = false;
    if (busy && global.PineInput) PineInput.reset();
    updateMovement();
  }
  function updateMovement() {
    if (!global.PineInput || !state) return;
    const map = /^(map|campus|prologue_campus|act[1-4]_map)$/.test(state.scene || '');
    PineInput.setMovementEnabled(map && !busy && $('modal-backdrop').hidden && $('dialogue').hidden && $('cinematic').hidden);
  }
  function itemName(id) {
    const aliases = { lens:'specialLens', drawingFragment1:'blueprintFragment1', drawingFragment2:'blueprintFragment2', drawingPattern:'completePattern', indicatorGear:'indicatorLeafGear', indicatorLeaf:'indicatorBlade', leafFrame:'indicatorMaterials', leafFilm:'indicatorMaterials', amber:'ringAmber' };
    const key = PineContent.items && PineContent.items[id] ? id : aliases[id];
    const names = { leafFrame:'叶片木框', leafFilm:'叶片薄片' };
    return names[id] || (key && PineContent.items && PineContent.items[key] ? (PineContent.items[key].name || PineContent.items[key]) : id.replace(/_/g, ' '));
  }
  function objectiveText(s) {
    const chapter = PineSceneUtil.chapter(s), act = s.act, p = s.prologue || {};
    if (chapter === 'prologue') {
      const hasLens = (s.inventory || []).includes('lens');
      if (!p.lensInstalled) return hasLens ? '把特殊镜片装进相机的滤镜框。' : '树旁架着一台相机。';
      if (!s.ringAmber.owned) return '裂口里有一滴逆着重力上升的树脂。';
      if (!p.enteredMemory) return '把年轮珀贴入树干的不完整纹路。';
      if (!p.watered || !p.supported) return '浇灌幼苗，再用支撑木把它扶稳。';
      return '旋转对齐幼苗脚边的印记。';
    }
    if (chapter === 'act4') {
      const count = act ? act.evidence.length : 0;
      if (count < 3) return `寻找三件成果物证（${count}/3）。纪念馆可自由参观。`;
      if (!act.ending) return '回到六朝松，逐件投射三件物证。';
      return '走到相机旁，把信放回原处。';
    }
    if (act) {
      const complete = Object.values(act.completed).filter(Boolean).length;
      if (complete < 2) return chapter === 'act3' ? '走进前工院与校友会堂。' : '找回两栋核心建筑里的记忆。';
      if (chapter === 'act2' && !act.steps.b3) return '到五五楼对照两段时间与线索。';
      if (!act.engraved) return chapter === 'act3' ? '回到树下，先对入记忆，再刻第三圈。' : '到刻轮装置处，刻入这一时代的年轮。';
      if (!act.grafted) return '回到六朝松，完成这一圈的接合。';
    }
    return '';
  }
  function render(nextState, nextRuntime) {
    state = nextState; runtime = nextRuntime || runtime || {};
    const viewState = PineSceneUtil.adapt(state, runtime);
    const renderer = global.PineScenes && (PineScenes[viewState.scene] || PineScenes[viewState.chapter]);
    if (!renderer) throw new Error(`没有场景渲染器：${viewState.chapter}/${viewState.scene}`);
    const html = typeof renderer === 'function' ? renderer(viewState, runtime) : renderer.render(viewState, runtime);
    if ($('scene').innerHTML !== html) $('scene').innerHTML = html;
    $('era-label').textContent = eraNames[viewState.chapter] || state.era || '';
    $('objective').textContent = objectiveText(state);
    $('objective').hidden = !$('objective').textContent || viewState.chapter === 'epilogue';
    renderInventory();
    updatePlayer(runtime);
    updateMovement();
  }
  function renderInventory() {
    const inventory = Array.isArray(state.inventory) ? state.inventory : [];
    $('inventory').innerHTML = inventory.filter(id => id !== 'amber').map(id => {
      const selected = runtime.selectedItem === id ? ' selected' : '';
      return `<button type="button" class="item-button${selected}" data-action="SELECT_ITEM" data-item="${id}" aria-pressed="${runtime.selectedItem === id}">${itemName(id)}</button>`;
    }).join('');
    const hasAmber = !!(state.ringAmber && state.ringAmber.owned);
    $('amber-button').hidden = !hasAmber;
    const rings = state.ringAmber ? (state.ringAmber.rings || 0) : 0;
    $('amber-button').setAttribute('aria-label', `查看年轮珀与提示，已刻入${rings}圈`);
  }
  function updatePlayer(nextRuntime) {
    runtime = nextRuntime || runtime || {};
    const player = $('map-player');
    if (player && runtime.player) player.setAttribute('transform', `translate(${runtime.player.x} ${runtime.player.y})`);
    const nearby = runtime.nearby;
    $('nearby').hidden = !nearby;
    $('interact-button').hidden = !nearby;
    if (nearby) {
      const name = typeof nearby === 'string' ? nearby : nearby.name;
      $('nearby').textContent = name;
      $('interact-button').textContent = (typeof nearby === 'object' && nearby.verb) || '查看';
      $('interact-button').setAttribute('aria-label', name);
    }
  }
  function toast(message, duration) {
    clearTimeout(toastTimer);
    if (!message) { $('toast').hidden = true; return; }
    $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, duration || 2200);
  }
  function showDialogue(lines, speaker) {
    if (!Array.isArray(lines)) lines = [lines];
    lines = lines.filter(Boolean);
    if (!lines.length) return Promise.resolve(true);
    if (dialogueResolve) dialogueResolve(false);
    dialogueLines = lines.slice(); dialogueIndex = 0;
    $('dialogue-speaker').textContent = speaker || '';
    $('dialogue-text').textContent = dialogueLines[0];
    $('dialogue-next').textContent = lines.length > 1 ? '继续' : '知道了';
    $('dialogue').hidden = false;
    updateMovement();
    const token = generation;
    return new Promise(resolve => {
      dialogueResolve = result => { if (token === generation) { $('dialogue').hidden = true; updateMovement(); } resolve(result); };
    });
  }
  function nextDialogue() {
    if ($('dialogue').hidden) return;
    dialogueIndex++;
    if (dialogueIndex < dialogueLines.length) {
      $('dialogue-text').textContent = dialogueLines[dialogueIndex];
      $('dialogue-next').textContent = dialogueIndex === dialogueLines.length - 1 ? '知道了' : '继续';
    } else if (dialogueResolve) {
      const resolve = dialogueResolve; dialogueResolve = null; dialogueLines = []; resolve(true);
    }
  }
  function openModal(title, html, options) {
    options = options || {};
    lastFocus = document.activeElement;
    $('modal-title').textContent = title || '';
    $('modal-body').innerHTML = html || '';
    $('modal-close').hidden = !!options.locked;
    $('modal-backdrop').hidden = false;
    modalOnClose = options.onClose || null;
    updateMovement();
    $('modal-close').focus({ preventScroll: true });
    return $('modal-body');
  }
  function closeModal(force) {
    if (busy && !force) return false;
    if ($('modal-backdrop').hidden) return true;
    $('modal-backdrop').hidden = true; $('modal-body').innerHTML = '';
    const callback = modalOnClose; modalOnClose = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    updateMovement();
    if (callback) callback();
    return true;
  }
  function beginScene() {
    closeModal(true); cancelAsync(); $('cinematic').hidden = true; $('cinematic').innerHTML = ''; $('toast').hidden = true;
  }
  async function cinematic(html, duration, options) {
    options = options || {};
    const token = generation;
    setBusy(true); $('cinematic').innerHTML = html; $('cinematic').hidden = false;
    if (options.sound && global.PineAudio) PineAudio.play(options.sound);
    const valid = await wait(duration);
    if (!valid || token !== generation) return false;
    if (!options.keep) { $('cinematic').hidden = true; $('cinematic').innerHTML = ''; }
    setBusy(false); return true;
  }
  async function transition(era, chapter) {
    const growth = chapter === 'act3' ? 1.45 : 1;
    const html = `<svg viewBox="0 0 1280 720" width="100%" height="100%" aria-hidden="true">
      <rect width="1280" height="720" fill="#272920"/>
      <g fill="none" stroke="#75684a" stroke-width="7" stroke-linecap="round">
        <path d="M640 570 Q510 520 330 590 M640 570 Q760 490 1010 580 M640 570 Q590 420 450 360 M640 570 Q730 400 880 330" stroke-dasharray="900" stroke-dashoffset="900"><animate attributeName="stroke-dashoffset" from="900" to="0" dur="${2.4 * growth}s" fill="freeze"/></path>
      </g>
      <g transform="translate(640 570)"><g transform="scale(1 .05)"><animateTransform attributeName="transform" type="scale" from="1 .05" to="1 1" dur="${3.6 * growth}s" fill="freeze"/>
        <path d="M-260 0V-170L-170-250-80-170V0M-45 0V-230L45-300 135-230V0M170 0V-150L245-205 320-150V0" fill="#4b4c3e" stroke="#9b8b69" stroke-width="6"/>
        <path d="M-220-150h30v45h-30zm80 0h30v45h-30zM0-210h35v55H0zm90 0h35v55H90zm120 80h30v40h-30zm70 0h30v40h-30z" fill="#c2b493" opacity=".45"/>
      </g></g><div class="era-card">${era}</div></svg>`;
    return cinematic(html, 6100, { sound: 'graft' });
  }
  async function graft(act) {
    const number = { act1: 1, act2: 2, act3: 3 }[act] || 1;
    const html = `<svg viewBox="0 0 1280 720" width="100%" height="100%" aria-hidden="true">
      <rect width="1280" height="720" fill="#292a22"/>
      <g transform="translate(640 390)">
        <path d="M-125 290 Q-70 110-90-20T-45-290L10-310Q30-140 80-40T115 290Z" fill="#554735" stroke="#261f19" stroke-width="12"/>
        <path d="M-25 220Q-70 50-10-100T-20-260" fill="none" stroke="#211e18" stroke-width="17"/>
        <g fill="none" stroke="#9b8152" stroke-width="4" opacity=".8">
          ${[82,61,39].slice(0, number).map((r,i) => `<ellipse cx="0" cy="20" rx="${r}" ry="${r*.72}" stroke-dasharray="410" stroke-dashoffset="410"><animate attributeName="stroke-dashoffset" from="410" to="0" begin="${i*3}s" dur="7s" fill="freeze"/></ellipse>`).join('')}
        </g>
        <ellipse cx="0" cy="20" rx="118" ry="94" fill="none" stroke="#ae9564" stroke-width="3" opacity=".25"><animate attributeName="opacity" values=".15;.8;.15" dur="5s" repeatCount="4"/></ellipse>
      </g>
      <div class="cinematic-caption">纹路正在与树干对齐</div></svg>`;
    return cinematic(html, 21000, { sound: 'graft' });
  }
  function closeCinematic() { $('cinematic').hidden = true; $('cinematic').innerHTML = ''; setBusy(false); }
  function escape() {
    if (!$('dialogue').hidden) { nextDialogue(); return true; }
    if (!$('modal-backdrop').hidden) return closeModal(false);
    return false;
  }
  function init() {
    $('dialogue-next').addEventListener('click', nextDialogue);
    $('modal-close').addEventListener('click', () => closeModal(false));
    $('modal-backdrop').addEventListener('click', event => { if (event.target === $('modal-backdrop')) closeModal(false); });
  }
  global.PineRenderer = {
    init, render, updatePlayer, renderInventory, toast, showDialogue, nextDialogue,
    openModal, closeModal, beginScene, cancelAsync, setBusy, wait, cinematic,
    transition, graft, closeCinematic, escape,
    get busy() { return busy; },
    get modalOpen() { return !$('modal-backdrop').hidden; },
    get dialogueOpen() { return !$('dialogue').hidden; },
    get generation() { return generation; }
  };
})(window);
