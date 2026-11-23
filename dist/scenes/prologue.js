/* Prologue scenes and shared scene utilities. */
(function (global) {
  'use strict';
  const scenes = global.PineScenes = global.PineScenes || {};
  const CAMPUS_BACKDROPS = { act1: 'campus-1', act2: 'campus-2', act3: 'campus-3', act4: 'campus-4' };
  const U = global.PineSceneUtil = {
    supportRest: { x: 900, y: 573 },
    chapter(state) {
      if (state.chapter) return state.chapter;
      return ({ prologue:'prologue', '1933':'act1', '1959':'act2', '1988':'act3', '2002':'act4', epilogue:'epilogue' })[state.era] || state.era;
    },
    adapt(state, runtime) {
      if (!state) return state;
      runtime = runtime || {};
      const chapter = U.chapter(state), act = state.act || null, prologue = state.prologue || {};
      const flags = {};
      const enable = names => names.forEach(name => { flags[name] = true; });
      Object.keys(prologue).forEach(key => { if (prologue[key]) flags[key] = true; });
      if (prologue.lensInstalled) enable(['filterInstalled']);
      if (prologue.treeBroken) enable(['pineBroken']);
      if (prologue.watered) enable(['sproutWatered']);
      if (prologue.supported) enable(['sproutSupported']);
      if (state.ringAmber && state.ringAmber.owned) enable(['amberObtained','hasAmber']);
      if (state.letter && state.letter.returned) enable(['letterReturned','returnedLetter','letterInBag']);
      if (act) {
        Object.keys(act.completed || {}).forEach(key => { if (act.completed[key]) {
          flags[key + 'Complete'] = true; flags[key + 'Solved'] = true;
          enable({library:['libraryComplete','draftSolved','draftAligned','windowGearReady'],hall:['hallComplete','notesSolved','soundGearReady'],bldg54:['bladeInstalled','act2Bldg54Complete','indicatorBladeInstalled'],power:['transmissionAdjusted','transmissionFixed','act2PowerComplete'],frontyard:['projectionAligned'],alumni:['alumniComplete']}[key] || []);
        }});
        Object.keys(act.steps || {}).forEach(key => { if (act.steps[key]) flags[key] = true; });
        if (act.steps.fragment1) enable(['bookOpened','libraryBookOpened','blueprint1Revealed','fragment1Revealed']);
        if (act.steps.drawerOpen) enable(['libraryDrawerOpen','libraryLockSolved']);
        if (act.steps.joined) enable(['blueprintComplete']);
        if (act.steps.malletInstalled) enable(['malletReturned','malletPlaced']);
        if (act.steps.leafAssembled) enable(['indicatorBladeAssembled']);
        if (act.steps.b3) enable(['convergenceComplete','bldg55Converged','act2ConvergenceComplete','b55United']);
        if (act.device && act.device.repaired) enable(['deviceRepaired','b55DeviceRepaired','deviceTransmissionFixed','corridorDeviceFixed','act2DeviceFixed','deviceFixed']);
        if (act.device && act.device.amberInserted) enable(['amberInstalled','deviceAmberInstalled']);
        if (act.engraved) enable(['act' + chapter.slice(-1) + 'Carved','ringCarved','deviceComplete']);
        if (act.grafted) enable(['act' + chapter.slice(-1) + 'Grafted']);
        const slots = act.device ? act.device.slots : {};
        Object.keys(slots || {}).forEach(slot => { const gear = slots[slot]; flags[slot + 'Filled'] = true; flags[gear + 'Installed'] = true; });
        const memories = act.device ? act.device.memories : {};
        if (memories && memories.nestedWindowSlot && memories.signatureSlot) enable(['memoriesAligned','rootMemoriesAligned']);
      }
      const inventory = new Set(state.inventory || []);
      if (inventory.has('drawingFragment1')) { inventory.add('blueprintFragment1'); inventory.add('fragment1'); }
      if (inventory.has('drawingFragment2')) { inventory.add('blueprintFragment2'); inventory.add('fragment2'); }
      if (inventory.has('drawingPattern')) inventory.add('completePattern');
      if (inventory.has('indicatorGear')) inventory.add('indicatorLeafGear');
      if (inventory.has('indicatorLeaf')) inventory.add('indicatorBlade');
      if (inventory.has('leafFrame') && inventory.has('leafFilm')) inventory.add('indicatorMaterials');
      if (inventory.has('lens')) inventory.add('specialLens');
      const device = act ? act.device : {};
      const adapted = Object.assign({}, state, {
        chapter, flags, amber: state.ringAmber || {rings:0,grafted:0}, inventory:Array.from(inventory),
        device, act1Device:device, act4:act || {}, selectedItem:runtime.selectedItem || null,
        acts: chapter && act ? {[chapter]:act} : {}
      });
      if (runtime.prologueMode && state.era === 'prologue' && state.scene === 'prologue_pine') adapted.scene = runtime.prologueMode;
      if (runtime.letterCamera && state.era === '2002' && state.scene === 'act4_ending') adapted.scene = 'act4_camera';
      return adapted;
    },
    esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); },
    flag(state, names) { return names.some(name => state.flags && state.flags[name]); },
    hotspot(id, label, x, y, w, h, action, data) {
      const attrs = Object.assign({ action: action || 'INSPECT', target: id }, data || {});
      const dataset = Object.entries(attrs).map(([key,value]) => `data-${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${U.esc(value)}"`).join(' ');
      return `<g class="hotspot" tabindex="0" role="button" aria-label="${U.esc(label)}" ${dataset}>
        <rect class="hit-area" x="${x}" y="${y}" width="${Math.max(72,w)}" height="${Math.max(72,h)}" rx="8"/>
        <rect class="focus-ring" x="${x}" y="${y}" width="${Math.max(72,w)}" height="${Math.max(72,h)}" rx="8"/>
      </g>`;
    },
    caption(text, x, y, options) {
      options = options || {};
      return `<text x="${x}" y="${y}" fill="${options.fill || '#493c2f'}" font-size="${options.size || 20}" text-anchor="${options.anchor || 'middle'}" font-family="SimSun, serif" ${options.extra || ''}>${U.esc(text)}</text>`;
    },
    backdrop(name) {
      return PineArt.sprite(name, 0, 0, 1280, 720, { 'class': 'scene-illustration', preserveAspectRatio: 'none' });
    },
    room(id, state, content) {
      return PineArt.scene(id, {
        background: content.backdrop ? U.backdrop(content.backdrop) :
          `<rect width="1280" height="720" fill="#d8ceb6"/><path d="M0 560H1280V720H0Z" fill="#b8aa8d"/><path d="M0 560H1280" stroke="#4c3e30" stroke-width="7"/>`,
        midground: content.midground || '', interactable: content.interactable || '', overlay: content.overlay || '', character: content.character || ''
      }, { era: state.chapter });
    },
    cameraView(tree, lens, letter) {
      return `<rect x="135" y="65" width="1010" height="570" rx="8" fill="#b8a98d" stroke="#392f26" stroke-width="18"/>
        <svg x="165" y="95" width="950" height="480" viewBox="0 0 950 480" overflow="hidden">
          ${PineArt.sprite('courtyard', 0, 0, 950, 480, { preserveAspectRatio: 'xMidYMax slice' })}
          ${PineArt.pine(tree, { x: 490, y: 244, scale: 1.06, era: 'prologue', vivid: tree.status === 'sprout' })}
        </svg>
        <path d="M140 630L90 710M1140 630L1190 710M640 630V720" stroke="#3e362c" stroke-width="12"/>
        ${PineArt.camera({ x: 267, y: 626, scale: .76, bag: false, filterInstalled: lens })}
        ${PineArt.cameraBag({ x: 950, y: 466, scale: 1.1, open: letter, letter })}
        ${PineArt.oldPhoto({ x: 435, y: 165, scale: 1.32, rotate: -5, pinned: true })}
        ${lens ? '' :
          '<circle cx="258" cy="555" r="28" fill="none" stroke="#b2a184" stroke-width="4" stroke-dasharray="5 5"/>'}`;
    },
    viewfinder() {
      return `<g pointer-events="none"><rect x="165" y="95" width="950" height="480" fill="none" stroke="#eee3c7" stroke-width="3" opacity=".45"/>
        <path d="M640 90v22M640 558v22M160 335h22M1100 335h22" stroke="#eee3c7" stroke-width="3"/></g>`;
    },
    map(state, runtime, buildings) {
      const era = state.chapter;
      const buildingSvg = buildings.map(b => {
        const rawScene = b.scene || b.id;
        const fullScene = era === 'prologue' ? (rawScene === 'sprout' ? 'prologue_sprout' : /camera|pine|tree/.test(rawScene) ? 'prologue_pine' : null) : (rawScene === 'museum' ? 'act4_memorial' : era + '_' + rawScene);
        const available = !global.PineState || !PineState.canEnter || PineState.canEnter(state, fullScene);
        return `<g class="map-building ${available ? 'available' : 'locked'}">${PineArt.building(b.art || b.id, { x: b.x, y: b.y, scale: b.scale || .72, era }) || ''}
          ${U.caption(b.name, b.x, b.y + 75, { size: 19 })}
          <circle class="building-marker" cx="${b.x}" cy="${b.y - 83}" r="6" fill="#8b744a" opacity=".65"/>
          ${U.hotspot(b.id, b.name, b.x - 85, b.y - 90, 170, 170, 'MAP_TARGET', { target: b.id, scene: b.scene || b.id })}</g>`;
      }).join('');
      return PineArt.scene(`${era}-map`, {
        background: U.backdrop(CAMPUS_BACKDROPS[era] || 'courtyard'),
        midground: PineArt.pine(Object.assign({ status: 'restoring' }, state.amber), { x: 640, y: 340, scale: .66, era }) + buildingSvg,
        interactable: U.hotspot('pine', '六朝松', 540, 200, 200, 230, 'MAP_TARGET', { target: 'pine', scene: 'tree' }),
        overlay: `<g id="map-player" class="map-player" transform="translate(${(runtime.player||{}).x||640} ${(runtime.player||{}).y||620})"><ellipse cx="0" cy="12" rx="21" ry="8" fill="#3b3429" opacity=".2"/><circle cx="0" cy="-25" r="12" fill="#51483b"/><path d="M-16 12L-11-15Q0-23 11-15L17 12Z" fill="#665d4e" stroke="#3b3228" stroke-width="3"/></g>`,
        character: ''
      }, { era });
    }
  };

  /* 序章的当代校园：只有六朝松一处目标，相机与相机包留在树前近景里。 */
  function map(state, runtime) {
    runtime = runtime || {};
    const broken = U.flag(state, ['treeBroken', 'pineBroken']);
    const player = runtime.player || { x: 640, y: 620 };
    return PineArt.scene('prologue-campus', {
      background: U.backdrop('courtyard'),
      midground: PineArt.pine(state.amber || {}, { x: 640, y: 446, scale: .8, era: 'prologue', broken }) +
        PineArt.camera({ x: 880, y: 505, scale: .61, bag: true, photo: true }),
      interactable: U.hotspot('pine', '六朝松', 530, 234, 220, 359, 'MAP_TARGET', { target: 'pine', scene: 'tree' }) +
        U.hotspot('nearbyCamera', '树旁的相机', 800, 400, 190, 190, 'MAP_TARGET', { target: 'camera', scene: 'camera' }),
      overlay: `<g pointer-events="none">${U.caption('六朝松', 640, 653, { size: 19 })}${U.caption('树旁架着一台相机', 935, 655, { size: 16 })}</g>`,
      character: `<g id="map-player" class="map-player" transform="translate(${player.x} ${player.y})"><ellipse cx="0" cy="12" rx="21" ry="8" fill="#3b3429" opacity=".2"/><circle cx="0" cy="-25" r="12" fill="#51483b"/><path d="M-16 12L-11-15Q0-23 11-15L17 12Z" fill="#665d4e" stroke="#3b3228" stroke-width="3"/></g>`
    }, { era: 'prologue' });
  }
  function camera(state) {
    const lens = U.flag(state,['lensInstalled','filterInstalled']);
    const broken = U.flag(state,['treeBroken','pineBroken']);
    const keeper = lens ? PineArt.keeper({ x: 847, y: 408, scale: .86, pose: broken ? 'lowered' : 'reach', className: broken ? '' : 'quiet-pulse' }) : '';
    return U.room('prologue-camera', state, {
      midground: U.cameraView({ status: broken ? 'broken' : 'normal' }, lens, false),
      interactable: U.hotspot('cameraBag','检查相机包',930,450,190,190,'OPEN_BAG') +
        U.hotspot('oldPhoto','查看旧照片',320,85,230,180,'SHOW_PHOTO') +
        U.hotspot('filterFrame','空滤镜框',210,490,150,150,'USE_ON_TARGET',{ target:'filterFrame' }) +
        U.hotspot('backCampus','返回校园',30,606,170,86,'ENTER_SCENE',{ scene:'campus' }),
      overlay: `${U.viewfinder()}
        ${!lens && (state.inventory || []).includes('lens') ? '<rect class="quiet-pulse" x="200" y="480" width="170" height="170" rx="10" fill="none" stroke="#c8ab6d" stroke-width="4"/>' : ''}`,
      character: keeper
    });
  }
  function pine(state) {
    const hasAmber = U.flag(state,['amberObtained','hasAmber']) || (state.amber && state.amber.obtained) || (state.inventory||[]).includes('amber');
    return U.room('prologue-pine', state, {
      backdrop: 'courtyard-close',
      midground: PineArt.pine(state.amber || {}, { x: 610, y: 336, scale: 1.52, broken: true, era: 'prologue' }),
      interactable: (!hasAmber ? `<g class="resin-rise"><path d="M607 352C599 374 582 391 585 407C589 432 623 433 629 407C632 391 615 371 607 352Z" fill="#947044" stroke="#4d3928" stroke-width="4"/><path d="M602 374Q587 398 597 408" fill="none" stroke="#bb9765" stroke-width="3" stroke-linecap="round"/></g>` + U.hotspot('resin','触碰悬浮的树脂',555,330,125,135,'TAKE',{ item:'amber' }) : U.hotspot('crack','把年轮珀贴入裂口',530,225,150,280,'USE_ON_TARGET',{ target:'crack' })) +
        U.hotspot('backCamera','回到取景框',40,600,160,86,'ENTER_SCENE',{ scene:'camera' }) +
        U.hotspot('backCampus','返回校园',220,600,160,86,'ENTER_SCENE',{ scene:'campus' }),
      overlay: '',
      character: ''
    });
  }
  function sprout(state) {
    const watered = U.flag(state,['sproutWatered','watered']);
    const supported = U.flag(state,['sproutSupported','supported']);
    const plant = PineArt.sprout({ x: 655, y: 597, rotate: supported ? 0 : -9, seedling: true });
    const rest = U.supportRest;
    const stake = supported ? PineArt.supportWood({ x: 672, y: 531, rotate: -9, className: 'is-planted' }) :
      `<g id="support-wood" data-drag="support" class="draggable" transform="translate(${rest.x} ${rest.y})">
      <ellipse cx="8" cy="14" rx="72" ry="13" fill="#443931" opacity=".22"/>
      ${PineArt.supportWood({ rotate: 78 })}
      ${PineArt.hitArea(-88, -38, 176, 76, { hitId: 'support' })}
    </g>`;
    return U.room('prologue-sprout', state, {
      backdrop: 'courtyard-close',
      midground: `<path d="M536 602Q561 584 598 590Q624 566 676 576Q725 580 768 598Q741 617 689 609Q624 624 536 602Z" fill="#62513c" opacity="${watered ? '.7' : '.38'}"/>
        <ellipse cx="356" cy="560" rx="55" ry="9" fill="#443931" opacity=".25"/>
        ${plant}${stake}${PineArt.wateringCan({ x: 284, y: 435 })}`,
      interactable: (!watered ? U.hotspot('wateringCan','拿起水罐',260,400,190,200,'TAKE',{ item:'wateringCan' }) : '') +
        (!watered ? U.hotspot('sprout','浇灌幼苗',550,290,210,260,'USE_ON_TARGET',{ target:'sprout' }) : '') +
        (watered && supported ? U.hotspot('sproutMark','对齐幼苗脚边的印记',560,510,210,140,'OPEN_GRAFT',{ act:'prologue' }) : ''),
      overlay: supported ? '' : U.caption('拖动 Y 形支撑木，扶稳幼苗',900,610,{size:17}),
      character: ''
    });
  }
  scenes.prologue = function (state, runtime) {
    const scene = state.scene || state.phase || '';
    if (/sprout|plant|graft/.test(scene)) return sprout(state);
    if (/pine|tree|crack/.test(scene) && !/camera/.test(scene)) return pine(state);
    if (/camera/.test(scene)) return camera(state);
    return map(state, runtime);
  };
  scenes.prologue_map = map; scenes.prologue_campus = map; scenes.prologue_camera = camera; scenes.prologue_pine = pine; scenes.prologue_sprout = sprout; scenes.prologue_graft = sprout;
})(window);
