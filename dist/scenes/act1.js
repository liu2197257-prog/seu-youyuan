/* Act I (1933): map, mature pine, library, assembly hall and gym. Rendering only. */
(function (global) {
  'use strict';
  const scenes = global.PineScenes = global.PineScenes || {};
  const U = global.PineSceneUtil;
  const ink = '#392f26';
  const paper = '#ddd2b8';

  function flag(state, names) { return U.flag(state, names); }
  function carries(state, names) {
    const inventory = Array.isArray(state.inventory) ? state.inventory : [];
    return names.some(name => inventory.indexOf(name) !== -1);
  }
  function backToMap() {
    return U.hotspot('backMap', '返回校园地图', 35, 600, 175, 85, 'ENTER_SCENE', { scene: 'map' });
  }
  function motif(kind, x, y, size) {
    const s = size || 30;
    if (kind === 'circle') return `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="none" stroke="${ink}" stroke-width="5"/>`;
    if (kind === 'triangle') return `<path d="M${x} ${y - s / 2}L${x + s / 2} ${y + s / 2}H${x - s / 2}Z" fill="none" stroke="${ink}" stroke-width="5"/>`;
    if (kind === 'window') return `<g fill="none" stroke="${ink}" stroke-width="4"><rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}"/><path d="M${x} ${y - s / 2}V${y + s / 2}M${x - s / 2} ${y}H${x + s / 2}"/></g>`;
    if (kind === 'wave') return `<path d="M${x - s} ${y}Q${x - s * .75} ${y - s} ${x - s * .5} ${y}T${x} ${y}T${x + s * .5} ${y}T${x + s} ${y}" fill="none" stroke="${ink}" stroke-width="4"/>`;
    return `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="none" stroke="${ink}" stroke-width="5"/>`;
  }

  function map(state, runtime) {
    return U.map(state, runtime || {}, [
      { id: 'library', name: '孟芳图书馆', x: 260, y: 215, scale: .62 },
      { id: 'hall', name: '大礼堂', x: 1000, y: 200, scale: .65 },
      { id: 'gym', name: '体育馆', x: 965, y: 515, scale: .58 }
    ]);
  }

  function tree(state) {
    const amber = state.amber || {};
    const carved = flag(state, ['act1Carved', 'ringCarved', 'deviceComplete']) || (amber.rings || 0) > 0;
    const grafted = flag(state, ['act1Grafted', 'firstGrafted']) || (amber.grafted || 0) > 0;
    const pine = PineArt.pine({ status: 'restoring', grafted: grafted ? Math.max(1, amber.grafted || 0) : 0 }, {
      x: 630, y: 360, scale: 1.58, era: 'act1', vivid: false
    });
    const outlines = `<g class="memory-figure" opacity=".25" stroke-dasharray="8 7">
      ${PineArt.building('library', { x: 190, y: 230, scale: .42, era: 'act1' }) || ''}
      ${PineArt.building('hall', { x: 1080, y: 205, scale: .42, era: 'act1' }) || ''}
      ${PineArt.building('gym', { x: 1080, y: 505, scale: .38, era: 'act1' }) || ''}
    </g>`;
    const newLeaves = grafted ? `<g class="leaf-stir" fill="#73765b" stroke="${ink}" stroke-width="3">
      <path d="M480 170Q430 125 404 164Q437 196 480 170Z"/><path d="M489 165Q514 111 548 139Q535 176 489 165Z"/>
      <path d="M467 180Q418 188 431 222Q469 216 467 180Z"/></g>` : '';
    return U.room('act1-tree', state, {
      midground: outlines + pine + newLeaves +
        `<path d="M606 192Q565 320 611 510" fill="none" stroke="#251f19" stroke-width="16"/>
         ${grafted ? '<path d="M598 332Q582 364 595 391" fill="none" stroke="#80613c" stroke-width="10"/>' : ''}
         <path d="M75 555Q305 526 480 566M770 565Q990 526 1210 557" fill="none" stroke="#71644d" stroke-width="5"/>`,
      interactable:
        U.hotspot('treeLibrary', '前往孟芳图书馆', 95, 140, 190, 175, 'ENTER_SCENE', { scene: 'library' }) +
        U.hotspot('treeHall', '前往大礼堂', 985, 115, 190, 175, 'ENTER_SCENE', { scene: 'hall' }) +
        U.hotspot('treeGym', '前往体育馆', 985, 425, 190, 165, 'ENTER_SCENE', { scene: 'gym' }) +
        U.hotspot('graft', '把年轮珀放入树干裂口', 545, 260, 170, 245, 'OPEN_GRAFT', { act: 'act1' }) +
        backToMap(),
      overlay: `<g pointer-events="none">${carved ? '<g fill="none" stroke="#9a8154" stroke-width="4" opacity=".75"><path d="M560 360h38m-19-19v38"/><path d="M655 410q25-20 45 0t45 0"/></g>' : ''}
        ${U.caption('孟芳图书馆', 190, 330, { size: 17 })}${U.caption('大礼堂', 1080, 310, { size: 17 })}${U.caption('体育馆', 1080, 610, { size: 17 })}</g>`,
      character: `<g pointer-events="none">${PineArt.keeper({
        x: 865, y: 385, scale: 1.08, era: 'act1',
        pose: carved && !grafted ? 'reach' : 'stand', className: 'memory-figure quiet-pulse'
      })}</g>`
    });
  }

  function library(state) {
    const hasFirst = carries(state, ['blueprintFragment1', 'blueprint1', 'fragment1']);
    const hasSecond = carries(state, ['blueprintFragment2', 'blueprint2', 'fragment2']);
    const bookOpen = hasFirst || flag(state, ['bookOpened', 'libraryBookOpened', 'blueprint1Revealed', 'fragment1Revealed']);
    const drawerOpen = flag(state, ['drawerOpen', 'libraryDrawerOpen', 'libraryLockSolved']);
    const solved = flag(state, ['librarySolved', 'libraryComplete', 'draftSolved', 'draftAligned', 'windowGearReady']) || carries(state, ['windowGear']);
    const gearGone = carries(state, ['windowGear']) || flag(state, ['windowGearTaken', 'windowGearCollected', 'windowGearInstalled']);
    const book = `<g class="leaf-stir">
      <path d="M505 409Q552 365 626 397V465Q557 434 505 468Z" fill="#e5dbc3" stroke="${ink}" stroke-width="6"/>
      <path d="M626 397Q674 369 700 396L684 454Q655 443 626 465Z" fill="#d5c8ab" stroke="${ink}" stroke-width="6"/>
      <path d="M626 399V464M529 414Q565 393 602 407M529 431Q565 412 601 425M647 408l31-8M644 425l29-7" fill="none" stroke="#76664e" stroke-width="3"/>
      ${bookOpen ? '<path d="M653 393l54 9-18 48-46-13Z" fill="#c7b893" stroke="#584735" stroke-width="3" stroke-dasharray="8 3"/>' : ''}
    </g>`;
    const shelves = `<g stroke="${ink}" stroke-width="7">
      <path d="M65 120H430V414H65Z" fill="#82745d"/><path d="M82 153H413M82 356H413" fill="none"/>
      <path d="M100 175H178V310H100Z" fill="#afa184"/><path d="M200 175H278V310H200Z" fill="#8f8b78"/><path d="M300 175H378V310H300Z" fill="#b4a78c"/>
    </g>
    ${motif('circle', 139, 236, 39)}${motif('triangle', 239, 236, 42)}${motif('square', 339, 236, 37)}
    ${U.caption('声学札记', 139, 337, { size: 16 })}${U.caption('窗格集', 239, 337, { size: 16 })}${U.caption('机械图册', 339, 337, { size: 16 })}`;
    const loanCard = `<g transform="translate(105 378)">
      <path d="M0 0H285V105H0Z" fill="#e0d4b8" stroke="${ink}" stroke-width="5"/>
      ${U.caption('借阅卡', 142, 24, { size: 17 })}
      <text x="20" y="50" fill="${ink}" font-size="16" font-family="SimSun,serif">1  声学札记</text>
      <text x="20" y="73" fill="${ink}" font-size="16" font-family="SimSun,serif">2  窗格集</text>
      <text x="20" y="96" fill="${ink}" font-size="16" font-family="SimSun,serif">3  机械图册</text>
      <path d="M161 43H260M161 67H260M161 91H260" stroke="#9a896c" stroke-width="2"/>
    </g>`;
    const desk = `<g stroke="${ink}" stroke-width="7">
      <path d="M465 350H850V490H465Z" fill="#9b896b"/><path d="M490 490H825V590H490Z" fill="#88765c"/>
      <path d="M500 505H680V572H500Z" fill="${drawerOpen ? '#6d5d48' : '#a29173'}"/>
      <path d="M700 505H815V572H700Z" fill="${drawerOpen ? '#756149' : '#a29173'}"/>
      <path d="M475 590L460 655M835 590L850 655" fill="none"/>
    </g>
    <g transform="translate(530 518)">${[0, 1, 2].map(i => `<rect x="${i * 47}" y="0" width="38" height="38" rx="3" fill="#c1b18d" stroke="${ink}" stroke-width="4"/>`).join('')}</g>`;
    const rack = `<g stroke="${ink}" stroke-width="7" stroke-linejoin="round">
      <path d="M945 175H1150V397H945Z" fill="#c9bb9c" transform="rotate(-4 1048 286)"/>
      <path d="M970 397L920 560M1120 397L1170 560M1045 397V548" fill="none"/>
      <path d="M975 210H1118V357H975Z" fill="#d9cdb2"/>
      <circle cx="1010" cy="300" r="43" fill="none"/><path d="M1053 300h60M1053 282l25-18 25 18M1053 319l25 18 25-18" fill="none"/>
      <circle cx="980" cy="195" r="7" fill="#80613c"/><circle cx="1115" cy="195" r="7" fill="#80613c"/><circle cx="1048" cy="375" r="7" fill="#80613c"/>
    </g>${U.caption('描图架 · 三档倾角', 1045, 440, { size: 18 })}`;
    const window = `<g><path d="M850 65H1210V150H850Z" fill="#aaa893" stroke="${ink}" stroke-width="8"/>
      <path d="M970 65V150M1090 65V150M850 108H1210" stroke="${ink}" stroke-width="5"/>
      <path class="leaf-stir" d="M1135 68q-50 20-77 69m35-46q-33-5-42 18m70-32q22 16 17 42" fill="none" stroke="#615f50" stroke-width="8"/></g>`;
    const firstFragment = bookOpen && !hasFirst ? `<g transform="translate(710 375)"><path d="M0 0l92 9-12 70-18-9-15 12-17-13-18 8L0 0Z" fill="#d7c8a6" stroke="${ink}" stroke-width="4"/><path d="M15 22h52M15 39h36" stroke="#79694f" stroke-width="3"/></g>` : '';
    const secondFragment = drawerOpen && !hasSecond ? `<g transform="translate(716 510)"><path d="M0 8l80-8 12 62-17-9-16 11-14-13-18 9L0 8Z" fill="#d7c8a6" stroke="${ink}" stroke-width="4"/><path d="M18 24h48M25 40h45" stroke="#79694f" stroke-width="3"/></g>` : '';
    const gear = solved && !gearGone ? PineArt.gear('window', { x: 1030, y: 535, scale: .72, era: 'act1' }) : '';
    const hands = solved ? `<g class="memory-figure" opacity=".42" fill="#6a5a48" stroke="${ink}" stroke-width="4">
      <path d="M884 414q32-31 63-9l37 29-18 27-42-25-47 10Z"/><path d="M1172 409q-35-26-61-2l-38 28 19 26 40-26 45 6Z"/>
      <path d="M940 408l28 20m-38-8 30 20m154-29-28 20m38-7-30 20" fill="none"/></g>` : '';
    return U.room('act1-library', state, {
      midground: window + shelves + loanCard + desk + book + firstFragment + secondFragment + rack + gear,
      interactable:
        U.hotspot('bookAcoustics', '查看《声学札记》的圆形书脊图案', 100, 175, 90, 140, 'SHOW_DOCUMENT', { id: 'bookAcoustics' }) +
        U.hotspot('bookWindows', '查看《窗格集》的三角形书脊图案', 200, 175, 90, 140, 'SHOW_DOCUMENT', { id: 'bookWindows' }) +
        U.hotspot('bookMechanics', '查看《机械图册》的方形书脊图案', 300, 175, 90, 140, 'SHOW_DOCUMENT', { id: 'bookMechanics' }) +
        U.hotspot('loanCard', '查看借阅卡', 100, 375, 295, 112, 'SHOW_DOCUMENT', { id: 'loanCard' }) +
        U.hotspot('libraryBook', '查看反复翻回同一页的书', 495, 355, 180, 120, 'OPEN_BLUEPRINT') +
        (bookOpen && !hasFirst ? U.hotspot('blueprintFragment1', '取得第一片图纸', 690, 360, 130, 115, 'TAKE', { item: 'blueprintFragment1' }) : '') +
        U.hotspot('libraryLock', '检查抽屉的三个图案转盘', 500, 500, 180, 90, 'OPEN_LIBRARY_LOCK') +
        (drawerOpen && !hasSecond ? U.hotspot('blueprintFragment2', '取得第二片图纸', 700, 500, 140, 90, 'TAKE', { item: 'blueprintFragment2' }) : '') +
        U.hotspot('draftingRack', '使用描图架', 920, 155, 250, 290, 'OPEN_DRAFT') +
        (solved && !gearGone ? U.hotspot('windowGear', '取得窗格纹齿轮', 950, 480, 160, 115, 'TAKE', { item: 'windowGear' }) : '') +
        backToMap(),
      overlay: `<g pointer-events="none">${solved ? '<path d="M860 145H1200L845 590H525Z" fill="#decf9f" opacity=".31"/><path d="M625 360l55 18m-30-35 55 18" stroke="#8b744a" stroke-width="3" opacity=".65"/>' : '<path d="M850 151H1210" stroke="#6c6656" stroke-width="4" opacity=".35"/>'}</g>`,
      character: `<g pointer-events="none">${hands}</g>`
    });
  }

  function hall(state, runtime) {
    const installed = flag(state, ['malletInstalled', 'malletReturned', 'malletPlaced']);
    const malletGone = installed || carries(state, ['mallet']) || flag(state, ['malletTaken']);
    const solved = flag(state, ['hallSolved', 'hallComplete', 'notesSolved', 'soundGearReady']) || carries(state, ['soundGear']);
    const gearGone = carries(state, ['soundGear']) || flag(state, ['soundGearTaken', 'soundGearCollected', 'soundGearInstalled']);
    const active = runtime && (runtime.playingNote || runtime.note) || state.playingNote || '';
    function plate(note, x, top, height, label) {
      return `<g class="${note === 'mid' && !solved ? 'leaf-stir' : ''}">
        <path d="M${x - 52} ${top}H${x + 52}V${top + height}H${x - 52}Z" fill="#8b8777" stroke="${ink}" stroke-width="7"/>
        <path d="M${x - 38} ${top + 16}H${x + 38}" stroke="#b9b09a" stroke-width="4"/>
        <circle class="note-dot${active === note ? ' active' : ''}" cx="${x}" cy="${top - 26}" r="10" fill="#80613c"/>
        ${U.caption(label, x, top + height + 30, { size: 18 })}</g>`;
    }
    const seats = `<g fill="#776a55" stroke="${ink}" stroke-width="5">
      ${[250, 405, 560, 715, 870, 1025].map(x => `<path d="M${x} 555h105v75H${x}Z"/><path d="M${x + 10} 630v45m85-45v45" fill="none"/>`).join('')}
    </g><path d="M200 535H1190" stroke="${ink}" stroke-width="8"/>`;
    const record = `<g transform="translate(875 565)"><path d="M0 0H150V82H0Z" fill="#ddd0b2" stroke="${ink}" stroke-width="4"/>
      <path d="M20 55v-15m25 15V20m25 35V35m25 20v-15" stroke="${ink}" stroke-width="8"/>
      <text x="105" y="49" fill="${ink}" font-size="14" font-family="SimSun,serif">低高中低</text>
      <path d="M18 67H132" stroke="#8c795a" stroke-width="2"/></g>`;
    const bell = `<g transform="translate(1090 568)"><path d="M15 55Q18 5 55 5T95 55Z" fill="#9b8357" stroke="${ink}" stroke-width="6"/><path d="M5 55H105M55 5V-5" stroke="${ink}" stroke-width="6"/><circle cx="55" cy="66" r="9" fill="#665139"/></g>`;
    const looseMallet = !malletGone ? `<g transform="translate(220 465) rotate(-18)"><path d="M0 0L85 35" stroke="#5d4932" stroke-width="13"/><path d="M-15-15L15-35 42-5 12 15Z" fill="#826c4d" stroke="${ink}" stroke-width="6"/></g>` : '';
    const stand = `<g transform="translate(405 355)"><path d="M0 110V25M-35 110H35M-25 25H25" fill="none" stroke="${ink}" stroke-width="9"/>
      ${installed ? '<path d="M-28 5L38 72" stroke="#5d4932" stroke-width="12"/><path d="M-45-10L-15-35 12-5-18 20Z" fill="#826c4d" stroke="#392f26" stroke-width="6"/>' : '<path d="M-24 5H24V55H-24Z" fill="none" stroke="#806f55" stroke-width="4" stroke-dasharray="6 6"/>'}
    </g>`;
    const gear = solved && !gearGone ? PineArt.gear('sound', { x: 680, y: 596, scale: .68, era: 'act1' }) : '';
    return U.room('act1-hall', state, {
      midground: `<path d="M135 85H1145V455H135Z" fill="#aaa18c" stroke="${ink}" stroke-width="9"/>
        <path d="M155 105H1125V430H155Z" fill="#c8bda4" stroke="${ink}" stroke-width="5"/>
        <path d="M150 90Q260 210 175 438H85V90ZM1130 90Q1020 210 1105 438H1195V90Z" fill="#695c4b" stroke="${ink}" stroke-width="7"/>
        <path d="M175 430H1105V485H175Z" fill="#8d795c" stroke="${ink}" stroke-width="8"/>
        ${plate('low', 605, 245, 170, '低')}${plate('mid', 785, 285, 130, '中')}${plate('high', 965, 320, 95, '高')}
        ${looseMallet}${stand}${seats}${record}${bell}${gear}`,
      interactable:
        (!malletGone ? U.hotspot('mallet', '拾取舞台边的木槌', 190, 420, 150, 110, 'TAKE', { item: 'mallet' }) : '') +
        U.hotspot('malletStand', '把木槌装回支架', 365, 330, 140, 175, 'USE_ON_TARGET', { target: 'malletStand' }) +
        U.hotspot('plateLow', '敲响低发声片', 535, 215, 140, 235, 'STRIKE', { note: 'low' }) +
        U.hotspot('plateMid', '敲响中发声片', 715, 255, 140, 195, 'STRIKE', { note: 'mid' }) +
        U.hotspot('plateHigh', '敲响高发片', 895, 290, 140, 160, 'STRIKE', { note: 'high' }) +
        U.hotspot('rehearsalRecord', '查看最后排的排练记录', 860, 550, 180, 105, 'SHOW_DOCUMENT', { id: 'rehearsalRecord' }) +
        U.hotspot('smallBell', '播放小铃的低高中低示范', 1060, 550, 140, 105, 'PLAY_NOTES') +
        (solved && !gearGone ? U.hotspot('soundGear', '取得声波纹齿轮', 600, 550, 160, 105, 'TAKE', { item: 'soundGear' }) : '') +
        backToMap(),
      overlay: '<path d="M1110 70L1010 545H1220L1160 70Z" fill="#e2d4a9" opacity=".25"/><path d="M1075 545H1195" stroke="#d8c794" stroke-width="7" opacity=".55"/>',
      character: ''
    });
  }

  function gym(state) {
    const device = state.device || state.act1Device || {};
    const slots = device.slots || state.slots || {};
    const windowInstalled = flag(state, ['windowGearInstalled', 'windowSlotFilled']) || device.windowGear === true || slots.window === 'windowGear';
    const soundInstalled = flag(state, ['soundGearInstalled', 'soundSlotFilled']) || device.soundGear === true || slots.sound === 'soundGear';
    const amberInstalled = flag(state, ['amberInstalled', 'deviceAmberInstalled']) || device.amber === true;
    const carved = flag(state, ['act1Carved', 'ringCarved', 'deviceComplete']) || ((state.amber || {}).rings || 0) > 0;
    const mechanism = PineArt.device('act1', {
      x: 650, y: 365, scale: 1.05, era: 'act1',
      window: windowInstalled, sound: soundInstalled, amber: amberInstalled, complete: carved
    });
    return U.room('act1-gym', state, {
      midground: `<path d="M65 105H1215V555H65Z" fill="#b7ad96" stroke="${ink}" stroke-width="9"/>
        <path d="M110 150H1170M110 150V95M350 150V95M590 150V95M830 150V95M1070 150V95" stroke="${ink}" stroke-width="6"/>
        <path d="M120 555H1160M640 555V700M260 610H1020" fill="none" stroke="#81745d" stroke-width="5"/>
        <path d="M195 465H1105L1060 610H240Z" fill="#89775a" stroke="${ink}" stroke-width="9"/>
        <path d="M260 610L245 675M1040 610L1055 675" stroke="${ink}" stroke-width="10"/>
        ${mechanism || ''}
        <g>${windowInstalled ? PineArt.gear('window', { x: 325, y: 355, scale: .75, era: 'act1' }) : motif('window', 325, 355, 72)}</g>
        <g>${soundInstalled ? PineArt.gear('sound', { x: 835, y: 355, scale: .75, era: 'act1' }) : motif('wave', 835, 355, 42)}</g>
        <ellipse cx="600" cy="355" rx="68" ry="82" fill="#5e513e" stroke="${ink}" stroke-width="7"/>
        <ellipse cx="600" cy="355" rx="45" ry="58" fill="none" stroke="#9a8154" stroke-width="4"/>
        <path d="M1050 350h62v105h-62M1112 400h45" fill="none" stroke="${ink}" stroke-width="12"/>
        ${U.caption('窗格纹', 325, 470, { size: 19 })}${U.caption('年轮珀凹槽', 600, 470, { size: 18 })}${U.caption('声波纹', 835, 470, { size: 19 })}${U.caption('手柄', 1090, 490, { size: 18 })}
        ${U.caption('学生机械演示 · 旧展示台', 650, 640, { size: 18 })}`,
      interactable:
        U.hotspot('windowSlot', '把窗格纹齿轮装入对应槽位', 230, 260, 190, 190, 'USE_ON_TARGET', { target: 'windowSlot' }) +
        U.hotspot('amberSlot', '把年轮珀嵌入中央凹槽', 505, 260, 190, 190, 'USE_ON_TARGET', { target: 'amberSlot' }) +
        U.hotspot('soundSlot', '把声波纹齿轮装入对应槽位', 740, 260, 190, 190, 'USE_ON_TARGET', { target: 'soundSlot' }) +
        U.hotspot('deviceHandle', '查看并转动刻轮装置手柄', 1010, 300, 160, 190, 'OPEN_DEVICE') +
        backToMap() +
        (carved ? U.hotspot('pinePath', '沿松针光迹回到六朝松', 1030, 585, 180, 95, 'ENTER_SCENE', { scene: 'tree' }) : ''),
      overlay: carved ? '<path class="pine-path" d="M650 610Q840 665 1100 625" fill="none" stroke="#9b8150" stroke-width="7"/><path d="M1070 612l25-15m-5 35 30-16m-65 20 20-18" stroke="#9b8150" stroke-width="4"/>' : '',
      character: ''
    });
  }

  scenes.act1 = function (state, runtime) {
    const explicit = state.scene && state.scene !== 'act1' ? state.scene : '';
    const route = String(explicit || state.phase || state.scene || 'map');
    if (/library/i.test(route)) return library(state);
    if (/hall/i.test(route)) return hall(state, runtime || {});
    if (/gym/i.test(route)) return gym(state);
    if (/tree|pine|graft/i.test(route)) return tree(state);
    return map(state, runtime || {});
  };
  scenes.act1_map = map;
  scenes.act1_tree = tree;
  scenes.act1_library = library;
  scenes.act1_hall = hall;
  scenes.act1_gym = gym;
  scenes.act1_graft = tree;
})(window);
