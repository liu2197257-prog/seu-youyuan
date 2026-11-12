/* Main composition root: input -> pure state transition -> renderer/audio effects. */
(function (global) {
  'use strict';
  let state, runtime = { player: { x: 640, y: 620 }, move: { x: 0, y: 0 }, nearby: null, selectedItem: null, prologueMode: 'camera', letterCamera: false };
  let lastFrame = 0, lastNearCheck = 0, lastStep = 0, noteAttempt = [], hintLevels = {};
  let started = false;
  let orientationLocked = false, forceLandscape = false, forceRequested = false;

  const $ = id => document.getElementById(id);
  function chapter() { return PineSceneUtil.chapter(state); }
  function viewState() { return PineSceneUtil.adapt(state, runtime); }
  function hasFlag(names) { const adapted = viewState(); return names.some(name => adapted.flags && adapted.flags[name]); }
  function fullScene(short) {
    if (!short) return short;
    if (/^(prologue|act[1-4])_/.test(short) || short === 'epilogue') return short === 'act4_museum' ? 'act4_memorial' : short;
    const c = chapter();
    if (c === 'prologue') {
      if (short === 'sprout') return 'prologue_sprout';
      if (short === 'camera' || short === 'pine' || short === 'tree') return 'prologue_pine';
      return 'prologue_campus';
    }
    if (c === 'epilogue') return 'epilogue';
    const prefix = c + '_';
    if (short === 'museum') return 'act4_memorial';
    if (short === 'camera') return 'act4_ending';
    return prefix + short;
  }
  function sceneIsMap() { return !!(state && /^(map|campus|prologue_campus|act[1-4]_map)$/.test(state.scene || '')); }
  function normalizeResult(result) {
    if (!result) return { state, effects: [], accepted: false };
    if (result.state) return { state: result.state, effects: result.effects || [], accepted: result.accepted !== false };
    return { state: result, effects: [], accepted: true };
  }
  function dispatch(action) {
    const previous = state;
    let result;
    try { result = normalizeResult(PineState.transition(state, action)); }
    catch (error) { console.error(error); PineRenderer.toast('这个操作现在无法完成。'); return { state, effects: [], accepted: false, error }; }
    state = result.state || previous;
    const changedScene = previous.scene !== state.scene || previous.era !== state.era;
    if (changedScene) {
      PineRenderer.beginScene(); runtime.nearby = null; noteAttempt = []; runtime.selectedItem = null; runtime.letterCamera = false;
      if (state.scene === 'prologue_pine' && previous.scene !== 'prologue_pine') runtime.prologueMode = 'camera';
      if (sceneIsMap()) runtime.player = { x: 640, y: 620 };
    }
    if (runtime.selectedItem && !(state.inventory || []).includes(runtime.selectedItem)) runtime.selectedItem = null;
    PineRenderer.render(state, runtime);
    updateBackButton();
    processEffects(result.effects || [], action, previous).catch(error => { console.error(error); PineRenderer.toast('演出已安全停止，可以继续操作。'); });
    return Object.assign({}, result, { state, changed: previous !== state });
  }
  function contentLines(path) {
    return path.split('.').reduce((value,key) => value && value[key], PineContent);
  }
  async function processEffects(effects, action, previous) {
    if (effects.some(effect => effect.type === 'TREE_BREAKS_BEFORE_TOUCH')) {
      await playPrologueBreak();
      effects = effects.filter(effect => !/^(GUARDIAN_|TREE_BREAKS|CRACK_VISIBLE|LENS_INSTALLED)/.test(effect.type));
    }
    let lastEvidence = null;
    for (const effect of effects) {
      if (!effect) continue;
      if (typeof effect === 'string') effect = { type: effect };
      const type = effect.type || effect.kind;
      if (type === 'REJECTED') {
        PineAudio.play('error'); PineRenderer.toast(rejectionText(effect.reason)); return;
      }
      if (type === 'toast' || type === 'message') PineRenderer.toast(effect.text || effect.message);
      else if (type === 'sound') PineAudio.play(effect.id || effect.name, effect);
      else if (type === 'dialogue') await PineRenderer.showDialogue(effect.lines || (effect.content ? contentLines(effect.content) : null) || effect.text, effect.speaker || '守忆者');
      else if (type === 'ITEM_TAKEN' || type === 'AMBER_ACQUIRED') PineAudio.play('pickup');
      else if (type === 'GEAR_ACQUIRED') { PineAudio.play('pickup'); PineRenderer.toast('一枚齿轮显露出来，已收进物品栏。'); }
      else if (type === 'DRAWER_OPENED') PineRenderer.toast('抽屉开了。里面还有一片图纸。');
      else if (type === 'SUNLIGHT_RESTORED') await PineRenderer.showDialogue(PineContent.dialogues.act1.library.memoryVoice,'记忆里的声音');
      else if (type === 'FULL_SEQUENCE_PLAYED') visualFourNotes();
      else if (type === 'TIME_LABEL') PineRenderer.toast('多年后',2600);
      else if (type === 'VOICEOVER' || (type === 'SPROUT_WATERED' && state.prologue.supported)) {
        const lines = state.prologue.watered && state.prologue.supported ? [PineContent.dialogues.prologue.sprout.afterSupport,PineContent.dialogues.prologue.sprout.afterCare] : [PineContent.dialogues.prologue.sprout.afterSupport];
        await PineRenderer.showDialogue(lines,'画面之外');
      }
      else if (type === 'RING_ENGRAVED') {
        PineAudio.play('engrave');
        // 刻针经过窗格纹 → 台面掠过窗影；经过声波纹 → 响起大礼堂的四个音。
        if (state.era === '1933') {
          await PineRenderer.wait(700);
          document.querySelectorAll('.scene-layer-overlay').forEach(g => { g.classList.add('shadow-drift'); });
          visualFourNotes();
        }
        PineRenderer.toast(`第${['一','二','三'][effect.ring-1]}圈年轮已经刻入。`,2800);
      }
      else if (type === 'RETURN_TO_PINE') {
        PineRenderer.toast('年轮珀的纹路亮了。回六朝松去。',3000);
      }
      else if (type === 'PROLOGUE_GRAFTED') { PineAudio.play('graft'); await PineRenderer.wait(1800); }
      else if (type === 'RING_GRAFTED') {
        await PineRenderer.graft('act' + effect.ring);
        if (effect.ring === 1) { visualFourNotes(); await PineRenderer.showDialogue(PineContent.dialogues.act1.treeHook,'守忆者'); }
        if (effect.ring === 2) await PineRenderer.showDialogue(PineContent.dialogues.act2.treeAfterIdentity,'守忆者');
      }
      else if (type === 'ERA_CHANGED') {
        if (effect.era === 'epilogue') { runtime.letterCamera = false; PineAudio.play('wind'); continue; }
        const chapterName = ({'1933':'act1','1959':'act2','1988':'act3','2002':'act4'})[effect.era];
        await PineRenderer.transition(PineContent.eras[chapterName].label,chapterName);
        processIntro();
      }
      else if (type === 'SCENE_ENTERED') {
        if (effect.scene === 'prologue_pine' && state.era === 'prologue' && !state.prologue.treeBroken) PineAudio.play('wind');
        if (state.act && state.act.engraved && /act[12]_tree/.test(effect.scene)) {
          const lines = state.era === '1933' ? PineContent.dialogues.act1.treeReturn : [PineContent.dialogues.act2.treeRefusal];
          await PineRenderer.showDialogue(lines,'守忆者');
        }
      }
      else if (type === 'SELF_STORY') await playSelfStory();
      else if (type === 'GUARDIAN_REQUEST') await PineRenderer.showDialogue(PineContent.dialogues.act3.request,'守忆者');
      else if (type === 'EVIDENCE_PROJECTED') { lastEvidence = effect.evidence; PineAudio.play('graft'); }
      else if (type === 'GUARDIAN_REACTION') {
        const key = ({ceremonyRecord:'ceremony',rosterContinuation:'roster',repairPlaque:'repair'})[lastEvidence];
        if (key) await PineRenderer.showDialogue(PineContent.dialogues.act4.evidenceReactions[key],'守忆者');
      }
      else if (type === 'LAST_LINE') { await PineRenderer.wait(1200); await PineRenderer.showDialogue(PineContent.dialogues.act4.final,'守忆者'); }
      else if (type === 'GUARDIAN_DISSOLVES') await playEnding();
      else if (type === 'NEW_SPROUT') PineAudio.play('sprout');
    }
  }
  function rejectionText(reason) {
    const messages = { MISSING_ITEM:'先在物品栏选中能用于这里的东西。',WRONG_TARGET:'这里装不上。',WRONG_SCENE:'这里用不上这件东西。',ALREADY_USED:'这一步已经做过了。',TARGET_NOT_HERE:'这里没有这个目标。',WRONG_PUZZLE_ANSWER:'机关轻轻回弹，顺序还不对。',MISSING_GEARS:'齿轮还没有装齐，手柄只能空转。',AMBER_NOT_INSERTED:'先把年轮珀嵌入中央凹槽。',DEVICE_NOT_READY:'装置还有一处没有准备好。',C1_REQUIRED:'还缺些什么。先去看看前工院。',CORE_BUILDINGS_INCOMPLETE:'还缺些什么。两栋核心建筑的记忆还没有汇合。',EVIDENCE_INCOMPLETE:'三件成果物证还没有集齐。',MALLET_REQUIRED:'先把木槌装回支架。',DRAWER_LOCKED:'抽屉还锁着。',FRAGMENT_ONE_REQUIRED:'先看看反复翻动的那本书。',MEMORY_ALIGNMENT_REQUIRED:'要先把对应记忆对入槽位。',STORY_REQUIRED:'先听完树前的那段回忆。',B3_REQUIRED:'先汇合门旁的两段线索。',CRACK_NOT_TOUCHED:'先触碰树干上的裂口。',ALREADY_IN_SCENE:'已经在这里了。',ALREADY_PROJECTED:'这件物证已经投射过了。',ALREADY_COLLECTED:'这件物证已经记录过了。',SCENE_LOCKED:'这里现在还没有回应。' };
    return messages[reason] || '这个操作现在无法完成。';
  }
  async function playPrologueBreak() {
    PineAudio.stopAmbient();
    const normal = PineArt.pine({status:'normal'},{x:590,y:355,scale:1.2});
    const broken = PineArt.pine({status:'broken'},{x:590,y:355,scale:1.2});
    const stand = PineArt.keeper({x:820,y:380,scale:1.2,pose:'stand'});
    const reach = PineArt.keeper({x:820,y:380,scale:1.2,pose:'turn-reach',headTurn:true});
    const lowered = PineArt.keeper({x:820,y:380,scale:1.2,pose:'lowered',className:'ink-shiver'});
    const html = `<svg viewBox="0 0 1280 720" width="100%" height="100%"><rect width="1280" height="720" fill="#d5ccb5"/><style>
      .p0{animation:p0 6.4s both}.p1{opacity:0;animation:p1 6.4s both}.p2{opacity:0;animation:p2 6.4s both}.tb{opacity:0;animation:tb 6.4s both}
      @keyframes p0{0%,12%{opacity:1}20%,100%{opacity:0}}@keyframes p1{0%,12%{opacity:0}20%,52%{opacity:1}62%,100%{opacity:0}}@keyframes p2{0%,55%{opacity:0}65%,78%{opacity:1}100%{opacity:.9}}@keyframes tb{0%,43%{opacity:0}47%,100%{opacity:1}}
    </style><g class="p0">${normal}${stand}</g><g class="p1">${normal}${reach}</g><g class="tb">${broken}</g><g class="p2">${lowered}</g><rect x="150" y="70" width="980" height="560" fill="none" stroke="#493d30" stroke-width="15"/></svg>`;
    const token = PineRenderer.generation;
    const playing = PineRenderer.cinematic(html,6500);
    await PineRenderer.wait(2950); if (token === PineRenderer.generation) PineAudio.play('break');
    await playing;
    runtime.prologueMode = 'pine'; PineRenderer.render(state,runtime); updateBackButton();
  }
  async function playSelfStory() {
    const lines = PineContent.dialogues.act3.selfAccount;
    const drawings = [
      '<path d="M380 400h520v190H380z" fill="#d4c5a5"/><path d="M520 430l110 20 80-35M690 380l-55 135" stroke="#66513c" stroke-width="13"/><path d="M710 350l55 120" stroke="#3e3329" stroke-width="9"/>',
      '<path d="M430 90h420v500H430z" fill="#665744" stroke="#322a22" stroke-width="12"/><path d="M470 130h340v420H470z" fill="#c2b69c"/><path d="M520 500h240v45H520z" fill="#7d6c52"/><path d="M270 570l240-120" stroke="#494036" stroke-width="28"/>',
      '<path d="M220 520h840" stroke="#716148" stroke-width="18"/><g fill="#5d5b50">' + [0,1,2,3,4,5].map(i=>`<circle cx="${330+i*125}" cy="390" r="45"/><path d="M${285+i*125} 520v-80h90v80"/>`).join('') + '</g>',
      '<path d="M380 540V210q100-90 200 0v330M700 540V210q100-90 200 0v330" fill="#66675a"/><path d="M500 330l-130 170M820 330l130 170" stroke="#4a4a40" stroke-width="30"/>',
      '<path d="M350 170h580v370H350z" fill="#d0c09e" stroke="#514332" stroke-width="8"/><path d="M420 250h400M420 310h360M420 370h390" stroke="#8d795b" stroke-width="5"/><path d="M260 550l250-100" stroke="#453a2e" stroke-width="30"/><rect width="1280" height="720" fill="#24251f" opacity=".55"/>'
    ];
    for (let i=0;i<lines.length;i++) {
      await PineRenderer.cinematic(`<svg viewBox="0 0 1280 720" width="100%" height="100%"><rect width="1280" height="720" fill="#c9bda2"/>${drawings[i]}<div class="cinematic-caption">${lines[i]}</div></svg>`,2500);
    }
  }
  function mapTargets() {
    if (!sceneIsMap()) return [];
    return Array.from(document.querySelectorAll('#scene [data-action="MAP_TARGET"]')).map(element => {
      const hit = element.querySelector('.hit-area');
      if (!hit) return null;
      const x = Number(hit.getAttribute('x')), y = Number(hit.getAttribute('y'));
      const w = Number(hit.getAttribute('width')), h = Number(hit.getAttribute('height'));
      return { target: element.dataset.target, scene: element.dataset.scene || element.dataset.target,
        name: element.getAttribute('aria-label') || element.dataset.target,
        x: x + w / 2, y: y + h / 2, radius: Math.max(125, Math.min(180, Math.max(w,h) * .7)) };
    }).filter(Boolean);
  }
  function updateNearby() {
    const targets = mapTargets();
    let nearest = null, distance = Infinity;
    for (const target of targets) {
      const d = Math.hypot(runtime.player.x - target.x, runtime.player.y - target.y);
      if (d < target.radius && d < distance) { nearest = target; distance = d; }
    }
    runtime.nearby = nearest;
    PineRenderer.updatePlayer(runtime);
  }
  function enterTarget(target) {
    if (!target) return;
    if (chapter() === 'act4' && target.scene === 'camera' && state.scene === 'act4_ending') {
      runtime.letterCamera = true; PineRenderer.render(state,runtime); updateBackButton(); return;
    }
    const scene = fullScene(target.scene || target.target);
    if (!scene || !PineState.canEnter(state,scene)) { PineRenderer.toast('这里现在还没有回应。'); return; }
    if (scene === state.scene) {
      if (state.era === 'prologue' && scene === 'prologue_pine') { runtime.prologueMode = 'camera'; PineRenderer.render(state,runtime); updateBackButton(); }
      return;
    }
    dispatch({ type: 'ENTER', scene });
  }
  function frame(time) {
    const dt = Math.min(.04, (time - (lastFrame || time)) / 1000); lastFrame = time;
    if (started && sceneIsMap() && PineInput.movementEnabled) {
      const moving = runtime.move.x || runtime.move.y;
      if (moving) {
        runtime.player.x = Math.max(35, Math.min(1245, runtime.player.x + runtime.move.x * 250 * dt));
        runtime.player.y = Math.max(85, Math.min(680, runtime.player.y + runtime.move.y * 250 * dt));
        if (time - lastStep > 430) { PineAudio.play('step'); lastStep = time; }
      }
      // 静止时也定期刷新附近目标，确保进入/离开交互半径立刻有反馈。
      if (time - lastNearCheck > 90) { updateNearby(); lastNearCheck = time; }
      else if (moving) PineRenderer.updatePlayer(runtime);
    }
    requestAnimationFrame(frame);
  }
  async function visualFourNotes() {
    const token = PineRenderer.generation;
    const sequence = ['low','high','mid','low'];
    for (let index = 0; index < sequence.length; index++) {
      if (token !== PineRenderer.generation) return;
      const note = sequence[index];
      PineAudio.play(note);
      document.querySelectorAll('.note-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.note === note && Number(dot.dataset.index) === index));
      const plate = document.querySelector(`[data-note="${note}"]`);
      if (plate) { plate.classList.remove('sound-wave'); void plate.getBoundingClientRect(); plate.classList.add('sound-wave'); }
      await PineRenderer.wait(560);
    }
  }
  function currentPuzzle() {
    const scene = state.scene || '', currentChapter = chapter();
    if (currentChapter === 'prologue') return /sprout|graft/.test(scene) ? 'P-1' : sceneIsMap() ? 'P-2' : 'P-0';
    if (currentChapter === 'act1') {
      if (/library/.test(scene)) return hasFlag(['librarySolved','windowGear']) ? 'A3' : hasFlag(['blueprintComplete']) ? 'A3' : hasFlag(['drawerOpen']) ? 'A2' : 'A1';
      if (/hall/.test(scene)) return hasFlag(['malletInstalled']) ? 'A4' : 'A5';
      if (/gym/.test(scene)) return 'A6';
      return 'A7';
    }
    if (currentChapter === 'act2') {
      if (/bldg54/.test(scene)) return 'B1'; if (/power/.test(scene)) return 'B2';
      if (/bldg55/.test(scene)) return hasFlag(['convergenceComplete','b55United']) ? 'B4' : 'B3';
      return 'B5';
    }
    if (currentChapter === 'act3') {
      if (/frontyard/.test(scene)) return 'C1'; if (/alumni/.test(scene)) return 'C2';
      return state.ringAmber.rings >= 3 ? 'C4' : 'C3';
    }
    if (currentChapter === 'act4') {
      if (/hall/.test(scene)) return 'D1'; if (/alumni/.test(scene)) return 'D2';
      if (/frontyard/.test(scene)) return 'D3'; return 'D4';
    }
    return 'P-2';
  }
  function openAmber() {
    if ($('amber-button').hidden) return;
    const puzzle = currentPuzzle(), hint = PineContent.hints[puzzle];
    const level = hintLevels[puzzle] || 0;
    const amber = PineArt.amber(state.ringAmber || {}, { x: 0, y: 0, scale: 1.3 });
    const hints = hint ? hint.levels.slice(0,level).map((text,i) => `<div class="hint-level"><strong>${i+1}. ${PineContent.hintLevelLabels[i]}</strong><br>${PineSceneUtil.esc(text)}</div>`).join('') : '';
    PineRenderer.openModal('年轮珀', `<div style="display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:center">
      <svg viewBox="-100 -100 200 200" width="180" height="180" aria-label="已刻入 ${state.ringAmber.rings||0} 圈，已接合 ${state.ringAmber.grafted||0} 圈">${amber}</svg>
      <div><p>结构环：三　·　已刻入：${state.ringAmber.rings||0}　·　已接合：${state.ringAmber.grafted||0}</p>
      <p>${hint ? PineSceneUtil.esc(hint.name) : '纹路安静地进行着。'}</p></div></div>
      <div class="hint-list">${hints}</div>
      ${hint && level < 3 ? `<div class="hint-actions"><button class="paper-button" data-action="REVEAL_HINT" data-id="${puzzle}" data-level="${level+1}">${level ? '再看一层' : '听它怎么说'}</button></div>` : ''}`);
  }
  function openArchives() {
    const visited = state.visitedScenes || state.visited || [];
    const entries = Object.entries(PineContent.archives).filter(([,entry]) => visited.includes(entry.unlock) || entry.unlock === state.scene || entry.unlock === state.phase);
    const html = entries.length ? `<div class="archive-list">${entries.map(([id,a]) => `<article class="archive-entry"><h3>${PineSceneUtil.esc(a.title)}</h3>${a.sections.map(s => `<p><strong>${PineSceneUtil.esc(s.title)}</strong><br>${s.lines.map(PineSceneUtil.esc).join('<br>')}</p>`).join('')}</article>`).join('')}</div>` : '<p>读过的纸页与看过的建筑，会在这里留下记录。</p>';
    PineRenderer.openModal('档案 · 可选查看', html);
  }
  function showDocument(id) {
    const docs = {
      oldPhoto: ['旧照片','照片里的树旁站着一个小人影。相纸背面没有名字。'],
      photo: ['旧照片','照片里的树旁站着一个小人影。相纸背面没有名字。'],
      rehearsal: ['排练记录','<span style="font-size:28px">低 — 高 — 中 — 低</span><br>三个不同高度的图形，依次对应三片发声片。'],
      experiment: ['实验记录','左轮带动中轮，中轮带动右轮。<br>连接顺序：左 → 右 → 中。<br>发声顺序：低 — 高 — 中 — 低。'],
      letterFront: ['夹层里的折信', `${PineContent.dialogues.act3.letter.front.join('<br>')}<div class="fold"></div><small>纸还折着，内侧抽不出来。</small>`],
      studentRecord: ['学生记录', PineContent.dialogues.act2.building54.studentRecord],
      teacherNote: ['老师批注', PineContent.dialogues.act2.building54.teacherNote],
      departureNote: ['桌上字条', `${PineContent.dialogues.act2.building54.deskNote}<br><br>行李标签：刘长睿`],
      blueprintNote: ['图纸批注', PineContent.dialogues.act1.library.blueprintNote],
      bookAcoustics: ['《声学札记》','书脊上是一枚<strong>圆形</strong>图案。'],
      bookWindows: ['《窗格集》','书脊上是一枚<strong>三角形</strong>图案。'],
      bookMechanics: ['《机械图册》','书脊上是一枚<strong>方形</strong>图案。'],
      loanCard: ['借阅卡','1 《声学札记》<br>2 《窗格集》<br>3 《机械图册》'],
      rehearsalRecord: ['排练记录','<span style="font-size:28px">低 — 高 — 中 — 低</span><br>三个不同高度的图形，依次对应三片发声片。'],
      experimentRecord: ['实验记录','左轮带动中轮，中轮带动右轮。<br>连接顺序：左 → 右 → 中。<br>发声顺序：低 — 高 — 中 — 低。'],
      modelPatternCopy: ['图样抄本','第一张图样多了修改、擦痕与学生自己的笔记。'],
      teacherBladeNote: ['老师批注',PineContent.dialogues.act2.building54.teacherNote],
      luggageTag: ['行李标签','<strong>刘长睿</strong>'],
      timeFragmentDeparture: ['时间片段','年轻学生提着行李经过，脚步很快，没有停下。'],
      timeFragmentReturn: ['时间片段 · 多年后','<strong>多年后</strong><br>脚步慢了下来。门前站着归来的学生，门内已经空了。'],
      teachingModel: ['机械教学模型','更大的指示叶片已经装进原有结构。']
    };
    let doc = docs[id];
    if (!doc && PineContent.archives[id]) {
      const a = PineContent.archives[id]; doc = [a.title, a.sections.map(s => `<strong>${s.title}</strong><br>${s.lines.join('<br>')}`).join('<br><br>')];
    }
    if (!doc && /manuscript|instrument|biography|exhibit/.test(id)) {
      const titles = { manuscript:'手稿', instrument:'实验器具', biography:'生平', exhibit:'展陈' };
      doc = [titles[id] || '展陈', PineContent.archives.memorial.sections[0].lines[1]];
    }
    if (!doc) doc = ['纸页','纸页上的痕迹还留着。'];
    PineRenderer.openModal(doc[0], `<div class="document-paper">${doc[1]}</div>`);
  }
  function openBag() {
    const hasLens = (state.inventory||[]).includes('specialLens') || (state.inventory||[]).includes('lens') || hasFlag(['lensTaken','lensInstalled']);
    PineRenderer.openModal('相机包', `<div class="archive-list">
      ${hasLens ? '' : '<button class="paper-button" data-action="TAKE" data-item="specialLens">取出特殊镜片</button>'}
      <button class="paper-button secondary" data-action="SHOW_DOCUMENT" data-id="letterFront">抽出夹层里的半张折信</button>
      <p>镜头布是干净的。包的主人没有留下名字。</p></div>`);
  }
  function restartConfirm() {
    PineRenderer.openModal('从头开始？','<p>这次走过的路不会留下存档。</p><div class="control-row"><button class="paper-button" data-action="CONFIRM_RESTART">从头开始</button><button class="paper-button secondary" data-action="CLOSE_MODAL">留在这里</button></div>');
  }
  function restart() {
    PineRenderer.beginScene(); PineAudio.stopAll();
    state = PineState.createInitialState(); runtime = { player:{x:640,y:620}, move:{x:0,y:0}, nearby:null, selectedItem:null, prologueMode:'camera', letterCamera:false };
    noteAttempt = []; hintLevels = {}; PineRenderer.render(state,runtime); updateBackButton(); processIntro();
  }
  function processIntro() {
    const chapter = state.chapter;
    if (chapter === 'act1' && !hasFlag(['act1IntroSeen'])) PineRenderer.showDialogue(PineContent.dialogues.act1.treeIntro,'守忆者');
    if (chapter === 'act2' && !hasFlag(['act2IntroSeen'])) PineRenderer.showDialogue(PineContent.dialogues.act2.treeIntro,'守忆者');
    if (chapter === 'act3' && !hasFlag(['act3IntroSeen'])) PineRenderer.showDialogue(PineContent.dialogues.act3.treeIntro,'守忆者');
    if (chapter === 'act4' && !hasFlag(['act4IntroSeen'])) PineRenderer.showDialogue(PineContent.dialogues.act4.treeIntro,'守忆者');
  }
  async function playEnding() {
    // 他散成墨粒归树 → 裂口里长出新芽；裂痕保留。
    const ink = Array.from({ length: 34 }, (_, i) =>
      `<circle class="falling-ink" cx="${780 + (i % 7) * 13}" cy="${250 + (i % 9) * 24}" r="${3 + i % 4}" style="animation-delay:${(i % 8) * .18}s"/>`).join('');
    const html = `<svg viewBox="0 0 1280 720" width="100%" height="100%">
      <rect width="1280" height="720" fill="#cfc4a8"/>
      ${PineArt.pine({ status: 'sprout', grafted: 3 }, { x: 640, y: 360, scale: 1.5, broken: true, vivid: true })}
      ${PineArt.sprout({ x: 664, y: 404, scale: 2.6, vivid: true })}
      <g fill="#34332a">${ink}</g>
    </svg>`;
    await PineRenderer.cinematic(html, 6500, { sound: 'sprout' });
  }
  function onAction(data, event) {
    const action = data.action;
    if (!action || PineRenderer.busy || PineRenderer.dialogueOpen) return;
    if (action === 'MAP_TARGET') {
      const target = mapTargets().find(t => t.target === data.target);
      if (!target || Math.hypot(runtime.player.x-target.x,runtime.player.y-target.y)>target.radius) PineRenderer.toast('再走近一些。');
      else enterTarget(target); return;
    }
    switch (action) {
      case 'TAKE': {
        if (data.item === 'amber' && state.era === 'prologue' && !state.prologue.crackTouched) {
          // 点击悬浮树脂：先触碰裂口，再由树脂凝成年轮珀。
          const touch = dispatch({type:'TOUCH',target:'treeCrack'});
          if (touch.changed) dispatch({type:'TAKE',item:'amber'});
          return;
        }
        if (data.item === 'indicatorMaterials') {
          if (!state.inventory.includes('leafFrame')) dispatch({type:'TAKE',item:'leafFrame'});
          if (state.scene === 'act2_bldg54' && !state.inventory.includes('leafFilm')) dispatch({type:'TAKE',item:'leafFilm'});
          PineRenderer.toast('收齐了叶片木框与薄片。'); return;
        }
        const aliases = {blueprintFragment1:'drawingFragment1',blueprintFragment2:'drawingFragment2',indicatorLeafGear:'indicatorGear',wateringCan:'waterCan'};
        const taken = dispatch({type:'TAKE',item:aliases[data.item]||data.item});
        if (data.item === 'specialLens' && taken.changed) { PineRenderer.closeModal(true); PineRenderer.toast('特殊镜片已放入物品栏。'); }
        break;
      }
      case 'SELECT_ITEM': {
        const selected = runtime.selectedItem;
        if (/drawingFragment/.test(data.item) && selected && /drawingFragment/.test(selected) && selected !== data.item) openPuzzle('OPEN_BLUEPRINT',{});
        else { runtime.selectedItem = selected === data.item ? null : data.item; PineRenderer.render(state,runtime); updateBackButton(); }
        break;
      }
      case 'USE_ON_TARGET': {
        const target = ({malletStand:'stand',sprout:'seedling',model:'modelSocket',amberSlot:'amberSocket',crack:'treeCrack'})[data.target] || data.target;
        let item = runtime.selectedItem || data.item;
        if (!item && /treeCrack|amberSocket/.test(target)) item = 'amber';
        if (!item) { PineRenderer.toast('先在物品栏选中要用的东西。'); return; }
        if (target === 'seedling' && !['waterCan', 'supportWood'].includes(item)) {
          PineRenderer.toast(item === 'lens' ? '这枚镜片要装到相机的滤镜框上。' : '这件东西不能用在幼苗上。');
          return;
        }
        if (target === 'seedling' && item === 'waterCan' && state.prologue.watered) { PineRenderer.toast('幼苗已经浇过水了。'); return; }
        if (target === 'filterFrame' && item !== 'lens') { PineRenderer.toast('滤镜框要装的是特殊镜片。'); return; }
        dispatch({ type:'USE', item, target }); break;
      }
      case 'OPEN_BAG': openBag(); break;
      case 'SHOW_DOCUMENT': case 'SHOW_PHOTO': showDocument(data.id || (action === 'SHOW_PHOTO' ? 'oldPhoto' : data.target)); break;
      case 'OPEN_AMBER': openAmber(); break;
      case 'REVEAL_HINT': hintLevels[data.id] = Number(data.level); openAmber(); break;
      case 'CLOSE_MODAL': PineRenderer.closeModal(); break;
      case 'CONFIRM_RESTART': restart(); break;
      case 'PLAY_NOTES': visualFourNotes(); break;
      case 'STRIKE': {
        if (!state.act || !state.act.steps.malletInstalled) { PineRenderer.toast('先把木槌装回支架。'); return; }
        noteAttempt.push(data.note === 'mid' ? 'medium' : data.note); PineAudio.play(data.note);
        if (noteAttempt.length === 4) { const value = noteAttempt.slice(); noteAttempt = []; dispatch({type:'PUZZLE',id:'A4',value}); }
        break;
      }
      case 'OPEN_LIBRARY_LOCK': case 'OPEN_BLUEPRINT': case 'OPEN_DRAFT': case 'OPEN_DEVICE':
      case 'OPEN_BLADE': case 'OPEN_TRANSMISSION': case 'OPEN_CONVERGENCE': case 'OPEN_PROJECTION':
      case 'OPEN_ALUMNI_STEP': case 'OPEN_GRAFT': case 'OPEN_EVIDENCE':
        openPuzzle(action,data); break;
      case 'PROJECT_EVIDENCE': {
        const evidence = ({ceremony:'ceremonyRecord',roster:'rosterContinuation',plaque:'repairPlaque',repair:'repairPlaque'})[data.id] || data.id;
        dispatch({type:'PROJECT_EVIDENCE',value:evidence,evidence}); break;
      }
      case 'RETURN_LETTER': dispatch({type:'RETURN_LETTER'}); break;
      case 'ENTER_SCENE': enterTarget({target:data.target||data.scene,scene:data.scene}); break;
      case 'OPEN_MUSEUM': enterTarget({target:'museum',scene:'museum'}); break;
      default: dispatch(Object.assign({},data,{type:action}));
    }
  }
  function openPuzzle(action,data) {
    data = data || {};
    if (action === 'OPEN_BLUEPRINT') {
      if (!state.act || !state.act.steps.fragment1) { dispatch({type:'TAKE',item:'drawingFragment1'}); return; }
      if (!state.inventory.includes('drawingFragment1') || !state.inventory.includes('drawingFragment2')) { PineRenderer.toast('还缺一片图纸。抽屉里也许有。'); return; }
    }
    if (action === 'OPEN_ALUMNI_STEP' && data.step && data.step !== 'wall' && state.act && !state.act.completed.frontyard) {
      PineRenderer.toast('还缺些什么。先去看看前工院。'); return;
    }
    if (global.PinePuzzleUI) PinePuzzleUI.open(action, Object.assign({},data,{state:viewState(),runtime,dispatch,showDocument,visualFourNotes}));
    else PineRenderer.toast('这里的机关还没有响应。');
  }
  function updateBackButton() {
    const button = $('back-button');
    if (!button) return;
    const mapScene = fullScene('map');
    // 地图内、尾声、以及不可返回的单向记忆里不显示。
    const canBack = !sceneIsMap() && state.era !== 'epilogue' && !!mapScene && PineState.canEnter(state, mapScene);
    button.hidden = !canBack;
  }
  function goBackToCampus() {
    const mapScene = fullScene('map');
    if (!mapScene || !PineState.canEnter(state, mapScene)) { PineRenderer.toast('现在还不能离开这里。'); return; }
    dispatch({ type: 'ENTER', scene: mapScene });
  }
  function onDrag(data) { if (global.PinePuzzleUI) PinePuzzleUI.drag(data,{state:viewState(),runtime,dispatch,showDocument,visualFourNotes}); }
  /* 横屏：先尝试全屏 + 方向锁定；手机禁用旋转或不支持时，整体旋转画布兜底。 */
  function isPortrait() {
    if (window.matchMedia) return window.matchMedia('(orientation: portrait)').matches;
    return window.innerHeight > window.innerWidth;
  }
  function applyLandscape() {
    const portrait = isPortrait();
    // 只在玩家主动点过按钮后才旋转兜底，避免一进入就出现歪着的画面。
    const shouldForce = portrait && !orientationLocked && forceRequested;
    if (shouldForce !== forceLandscape) {
      forceLandscape = shouldForce;
      document.body.classList.toggle('force-landscape', shouldForce);
    }
    const button = $('rotate-button');
    button.hidden = !portrait || orientationLocked || forceRequested;
  }
  async function requestLandscape() {
    const targets = [$('stage'), document.documentElement].filter(el => el && el.requestFullscreen);
    for (const element of targets) {
      try { await element.requestFullscreen({ navigationUI: 'hide' }); break; } catch (_) { /* 继续尝试下一个 */ }
    }
    try {
      if (window.screen && screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('landscape');
        orientationLocked = true;
      }
    } catch (_) {
      orientationLocked = false; // iOS 或旋转锁定：走画布旋转兜底
    }
    applyLandscape();
    return orientationLocked;
  }
  function setupOrientation() {
    const onChange = () => {
      if (!isPortrait()) { orientationLocked = false; forceRequested = false; }
      applyLandscape();
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', () => setTimeout(onChange, 120));
    document.addEventListener('fullscreenchange', () => {
      // 退出全屏后方向锁定随之失效，需要回到可再次触发的状态。
      if (!document.fullscreenElement) { orientationLocked = false; forceRequested = false; }
      applyLandscape();
    });
    if (window.screen && screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', onChange);
    }
    $('rotate-button').addEventListener('click', async () => {
      forceRequested = true;
      await requestLandscape();
      if (!orientationLocked) {
        forceRequested = true;
        applyLandscape();
        PineRenderer.toast('把手机横过来，画面已转正。', 3200);
      }
    });
    applyLandscape();
  }

  function init() {
    if (started) return; started = true;
    try {
      PineRenderer.init();
      PineInput.init({ action:onAction, drag:onDrag, move:vector => { runtime.move = vector; }, interact:() => enterTarget(runtime.nearby), escape:() => PineRenderer.escape() });
      $('interact-button').addEventListener('click',() => enterTarget(runtime.nearby));
      $('amber-button').addEventListener('click',openAmber);
      $('back-button').addEventListener('click',goBackToCampus);
      $('archive-button').addEventListener('click',openArchives);
      $('restart-button').addEventListener('click',restartConfirm);
      $('audio-button').addEventListener('click',async () => { const enabled = await PineAudio.toggle(); $('audio-button').textContent = enabled ? '声' : '静'; $('audio-button').setAttribute('aria-pressed',String(enabled)); $('audio-button').setAttribute('aria-label',enabled?'关闭声音':'开启声音'); if(enabled) PineAudio.play('wind'); });
      state = PineState.createInitialState(); PineRenderer.render(state,runtime); updateBackButton(); processIntro();
      setupOrientation();
      requestAnimationFrame(frame);
      global.PineGame = { dispatch, get state(){return state;}, get runtime(){return runtime;}, openAmber, restart, onAction, visualFourNotes,
        requestLandscape, get landscapeLocked(){return orientationLocked;}, get landscapeForced(){return forceLandscape;} };
    } catch (error) {
      console.error(error); $('fatal-error').hidden = false;
      $('fatal-error').textContent = '游戏启动时出现问题。\n' + (error && error.message ? error.message : String(error));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init); else init();
})(window);
