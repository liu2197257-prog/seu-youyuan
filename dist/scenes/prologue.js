/* Prologue scenes and shared scene utilities. */
(function (global) {
  'use strict';
  const scenes = global.PineScenes = global.PineScenes || {};
  const U = global.PineSceneUtil = {
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
    room(id, state, content) {
      return PineArt.scene(id, {
        background: `<rect width="1280" height="720" fill="#d8ceb6"/><path d="M0 560H1280V720H0Z" fill="#b8aa8d"/><path d="M0 560H1280" stroke="#4c3e30" stroke-width="7"/>`,
        midground: content.midground || '', interactable: content.interactable || '', overlay: content.overlay || '', character: content.character || ''
      }, { era: state.chapter });
    },
    map(state, runtime, buildings) {
      const era = state.chapter;
      const palettes = { prologue: ['#d8cfb8','#a89e82','#756f5a'], act1: ['#ddd5c1','#b5ad99','#676257'], act2: ['#cbc5b3','#8f9995','#776654'], act3: ['#cbc7ad','#899173','#75654d'], act4: ['#d3c8ab','#959774','#806c50'] };
      const p = palettes[era] || palettes.prologue;
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
        background: `<rect width="1280" height="720" fill="${p[0]}"/><path d="M0 570Q300 490 620 560T1280 520V720H0Z" fill="${p[1]}" opacity=".5"/>
          <path d="M80 620Q360 510 620 390T1190 180M250 0Q380 210 620 390T1000 720" fill="none" stroke="#e5dcc5" stroke-width="82" opacity=".72"/>
          <path d="M80 620Q360 510 620 390T1190 180M250 0Q380 210 620 390T1000 720" fill="none" stroke="#776c55" stroke-width="3" stroke-dasharray="7 14" opacity=".5"/>
          <g fill="${p[2]}" opacity=".4">${Array.from({length:16},(_,i)=>`<circle cx="${45+(i*173)%1200}" cy="${80+(i*97)%580}" r="${14+(i%4)*4}"/>`).join('')}</g>`,
        midground: PineArt.pine(state.amber || {}, { x: 640, y: 340, scale: .66, era, broken: era === 'prologue' && U.flag(state,['treeBroken','pineBroken']), vivid: false }) + buildingSvg,
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
    const distance = Math.hypot(player.x - 640, player.y - 300);
    return PineArt.scene('prologue-campus', {
      background: `<rect width="1280" height="720" fill="#d8cfb8"/>
        <path d="M0 570Q300 490 620 560T1280 520V720H0Z" fill="#a89e82" opacity=".5"/>
        <path d="M80 640Q360 520 620 400T1190 190M250 0Q380 210 620 400T1000 720" fill="none" stroke="#e5dcc5" stroke-width="86" opacity=".7"/>
        <path d="M80 640Q360 520 620 400T1190 190M250 0Q380 210 620 400T1000 720" fill="none" stroke="#776c55" stroke-width="3" stroke-dasharray="7 14" opacity=".45"/>
        <g fill="#756f5a" opacity=".38">${Array.from({ length: 14 }, (_, i) => `<circle cx="${60 + (i * 181) % 1180}" cy="${70 + (i * 103) % 580}" r="${13 + (i % 4) * 4}"/>`).join('')}</g>`,
      midground: PineArt.pine(state.amber || {}, { x: 640, y: 300, scale: .8, era: 'prologue', broken }) +
        PineArt.camera({ x: 880, y: 470, scale: .5, bag: true, photo: true }) +
        `<path d="M300 660q120-26 240 0M780 660q120-26 240 0" fill="none" stroke="#8b7f66" stroke-width="4" opacity=".5"/>`,
      interactable: U.hotspot('pine', '六朝松', 540, 150, 210, 300, 'MAP_TARGET', { target: 'pine', scene: 'tree' }) +
        U.hotspot('nearbyCamera', '树旁的相机', 800, 400, 190, 190, 'MAP_TARGET', { target: 'camera', scene: 'camera' }),
      overlay: `<g pointer-events="none">${U.caption('六朝松', 640, 480, { size: 19 })}${U.caption('树旁架着一台相机', 935, 655, { size: 16 })}</g>`,
      character: `<g id="map-player" class="map-player" transform="translate(${player.x} ${player.y})"><ellipse cx="0" cy="12" rx="21" ry="8" fill="#3b3429" opacity=".2"/><circle cx="0" cy="-25" r="12" fill="#51483b"/><path d="M-16 12L-11-15Q0-23 11-15L17 12Z" fill="#665d4e" stroke="#3b3228" stroke-width="3"/></g>`
    }, { era: 'prologue' });
  }
  function camera(state) {
    const lens = U.flag(state,['lensInstalled','filterInstalled']);
    const broken = U.flag(state,['treeBroken','pineBroken']);
    const pine = PineArt.pine(state.amber || {}, { x: 655, y: 355, scale: 1.15, broken, era: 'prologue' });
    const keeper = lens ? PineArt.keeper({ x: 840, y: 370, scale: 1.15, pose: broken ? 'lowered' : 'reach', className: broken ? '' : 'quiet-pulse' }) : '';
    return U.room('prologue-camera', state, {
      midground: `<rect x="135" y="65" width="1010" height="570" rx="8" fill="#cfc5ac" stroke="#392f26" stroke-width="18"/>
        <path d="M165 95H1115V575H165Z" fill="#d9d0b9" stroke="#857558" stroke-width="4"/>${pine}
        <path d="M140 630L90 710M1140 630L1190 710M640 630V720" stroke="#3e362c" stroke-width="12"/>
        <g transform="translate(195 475)"><path d="M0 0h105l20 35v80H0Z" fill="#4c4437" stroke="#2f2922" stroke-width="6"/><circle cx="65" cy="57" r="30" fill="#292d27" stroke="#8a795a" stroke-width="6"/><path d="M105 12l35-15v35l-35 5" fill="#665b48"/></g>
        <g transform="translate(980 480)"><path d="M0 30Q60-10 120 30L110 135H10Z" fill="#645844" stroke="#352e25" stroke-width="6"/><path d="M30 30Q30-15 60-15T90 30" fill="none" stroke="#3d3429" stroke-width="8"/></g>
        <g transform="translate(350 110)"><rect width="180" height="125" fill="#b8a989" stroke="#584a38" stroke-width="5"/><path d="M20 105V35h100v70" fill="#7a705b" opacity=".55"/><circle cx="130" cy="85" r="16" fill="#484239"/></g>`,
      interactable: U.hotspot('cameraBag','检查相机包',930,450,190,190,'OPEN_BAG') +
        U.hotspot('oldPhoto','查看旧照片',320,85,230,180,'SHOW_PHOTO') +
        U.hotspot('filterFrame','空滤镜框',210,490,150,150,'USE_ON_TARGET',{ target:'filterFrame' }),
      overlay: `<rect x="165" y="95" width="950" height="480" fill="none" stroke="#eee3c7" stroke-width="3" opacity=".45"/><path d="M640 90v22M640 558v22M160 335h22M1100 335h22" stroke="#eee3c7" stroke-width="3"/>
        ${lens ? '<circle cx="255" cy="530" r="24" fill="#4e553b" stroke="#2f3427" stroke-width="5"/><path d="M266 508l12 9-9 7" fill="#d0c5aa"/>' : '<circle cx="255" cy="530" r="25" fill="none" stroke="#9b8d70" stroke-width="5" stroke-dasharray="5 5"/>'}`,
      character: keeper
    });
  }
  function pine(state) {
    const hasAmber = U.flag(state,['amberObtained','hasAmber']) || (state.amber && state.amber.obtained) || (state.inventory||[]).includes('amber');
    return U.room('prologue-pine', state, {
      midground: PineArt.pine(state.amber || {}, { x: 610, y: 365, scale: 1.7, broken: true, era: 'prologue' }) +
        `<path d="M590 180Q550 310 600 490" fill="none" stroke="#251f19" stroke-width="17"/>`,
      interactable: (!hasAmber ? `<g class="resin-rise"><path d="M615 355Q580 400 615 435Q650 400 615 355Z" fill="#80603b" stroke="#4a3928" stroke-width="5"/></g>` + U.hotspot('resin','触碰悬浮的树脂',555,330,125,135,'TAKE',{ item:'amber' }) : U.hotspot('crack','把年轮珀贴入裂口',530,225,150,280,'USE_ON_TARGET',{ target:'crack' })) +
        U.hotspot('backCamera','返回相机',40,570,160,100,'ENTER_SCENE',{ scene:'camera' }),
      overlay: !hasAmber ? U.caption('树脂正逆着重力上升', 810, 390, { size: 18 }) : '',
      character: ''
    });
  }
  function sprout(state) {
    const watered = U.flag(state,['sproutWatered','watered']);
    const supported = U.flag(state,['sproutSupported','supported']);
    return U.room('prologue-sprout', state, {
      midground: `<rect width="1280" height="720" fill="#cfc4a9"/><path d="M0 390Q300 350 600 410T1280 370V720H0Z" fill="#9e8a68"/>
        <path d="M0 455Q290 410 520 470M760 450Q1000 390 1280 450" stroke="#715e45" stroke-width="5" fill="none"/>
        <g transform="translate(655 360)"><path d="M0 210Q${supported?0:-45} 100 0 0" fill="none" stroke="#504531" stroke-width="12"/><path d="M0 45Q-80 0-95 55Q-45 90 0 65M0 80Q70 30 90 90Q45 120 0 100" fill="#73765a" stroke="#414532" stroke-width="5"/></g>
        <g transform="translate(330 440)"><path d="M0 40Q0 0 55 0H105V125H10Z" fill="#6e6c58" stroke="#3e3b30" stroke-width="6"/><path d="M105 25Q165 20 150 75T105 90M20 15L-40-20" fill="none" stroke="#454336" stroke-width="10"/></g>
        <g id="support-wood" data-drag="support" class="draggable" transform="translate(900 380)"><path d="M0 170V65M0 80L-65 10M0 80L65 10" fill="none" stroke="#5d4932" stroke-width="18" stroke-linecap="round"/></g>
        <path d="M210 530l-60 65m80-40 40 55M1040 520l70 70" stroke="#5a4936" stroke-width="10"/>`,
      interactable: U.hotspot('wateringCan','拿起水罐',260,400,190,200,'TAKE',{ item:'wateringCan' }) +
        U.hotspot('sprout','浇灌幼苗',550,290,210,260,'USE_ON_TARGET',{ target:'sprout' }) +
        (watered && supported ? U.hotspot('sproutMark','对齐幼苗脚边的印记',560,510,210,140,'OPEN_GRAFT',{ act:'prologue' }) : ''),
      overlay: `${watered ? '<ellipse cx="650" cy="585" rx="140" ry="35" fill="#675c48" opacity=".45"/>' : ''}${supported ? '' : U.caption('拖动 Y 形支撑木，扶稳幼苗',900,610,{size:17})}`,
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
