/* 第四章：2002 年成果物证、真实层纪念馆与六朝松结局。仅渲染，不推进状态。 */
(function (global) {
  'use strict';

  const scenes = global.PineScenes = global.PineScenes || {};
  const U = global.PineSceneUtil;
  const ORDER = ['ceremony', 'roster', 'plaque'];
  const EVIDENCE_IDS = {
    ceremony: 'ceremonyRecord',
    roster: 'rosterContinuation',
    plaque: 'repairPlaque'
  };
  const ALIASES = {
    ceremony: ['ceremony', 'ceremonyRecord', 'evidenceCeremony'],
    roster: ['roster', 'rosterContinuation', 'evidenceRoster'],
    plaque: ['plaque', 'repair', 'repairPlaque', 'evidenceRepair']
  };

  function contains(source, aliases) {
    if (!source) return false;
    if (typeof source === 'string') return aliases.includes(source);
    if (Array.isArray(source)) {
      return source.some(value => {
        if (typeof value === 'string') return aliases.includes(value);
        return value && aliases.includes(value.id || value.item || value.evidence);
      });
    }
    if (typeof source === 'object') {
      return aliases.some(id => source[id] === true || (source[id] && source[id].collected === true));
    }
    return false;
  }

  function collected(state, id) {
    const aliases = ALIASES[id];
    const act = state.act4 || {};
    if (contains(state.inventory, aliases) || contains(state.evidence, aliases) ||
        contains(state.evidences, aliases) || contains(state.collectedEvidence, aliases) ||
        contains(act.evidence, aliases) || contains(act.evidences, aliases) || contains(act.collected, aliases)) return true;
    return U.flag(state, [
      id + 'Collected', 'collected' + id[0].toUpperCase() + id.slice(1),
      EVIDENCE_IDS[id], EVIDENCE_IDS[id] + 'Collected'
    ]);
  }

  function projected(state, id) {
    const aliases = ALIASES[id];
    const act = state.act4 || {};
    const number = typeof state.projected === 'number' ? state.projected :
      (typeof act.projected === 'number' ? act.projected : null);
    if (number !== null) return ORDER.indexOf(id) < number;
    if (contains(state.projected, aliases) || contains(state.projections, aliases) ||
        contains(state.projectedEvidence, aliases) || contains(act.projected, aliases) ||
        contains(act.projections, aliases) || contains(act.projectedEvidence, aliases)) return true;
    const cap = id[0].toUpperCase() + id.slice(1);
    return U.flag(state, [id + 'Projected', 'projected' + cap, EVIDENCE_IDS[id] + 'Projected']);
  }

  function keeperGone(state) {
    return U.flag(state, ['keeperGone', 'keeperVanished', 'keeperDissolved', 'dissolveComplete', 'endingComplete']) ||
      state.keeper === 'gone' || (state.keeper && state.keeper.gone === true);
  }

  function backToMap() {
    return U.hotspot('backMap', '返回校园', 30, 590, 180, 86, 'ENTER_SCENE', { scene: 'map' });
  }

  function map(state, runtime) {
    // U.map 的松树读取 amber 槽；只给视觉补上第三章后的裂痕/接合状态。
    const mapState = Object.assign({}, state, {
      amber: Object.assign({}, state.amber || {}, { status: 'restoring', broken: true, grafted: 3 })
    });
    return U.map(mapState, runtime, [
      { id: 'hall', name: '大礼堂', x: 245, y: 205, scale: .64 },
      { id: 'alumni', name: '校友会堂', x: 1000, y: 195, scale: .62 },
      { id: 'frontyard', name: '前工院', x: 250, y: 490, scale: .62 },
      { id: 'museum', art: 'memorial', name: '吴健雄纪念馆', scene: 'museum', x: 1000, y: 480, scale: .62 }
    ]);
  }

  function hall(state) {
    const found = collected(state, 'ceremony');
    const books = [1999, 2000, 2001, 2002].map((year, i) => {
      const x = 410 + i * 128;
      const current = year === 2002;
      return `<g transform="translate(${x} ${405 - (i % 2) * 7}) rotate(${i % 2 ? 3 : -3})">
        <rect width="104" height="128" rx="3" fill="${current ? '#a58c63' : '#81725d'}" stroke="#40352b" stroke-width="5"/>
        <path d="M15 0V128" stroke="#c0ad88" stroke-width="3" opacity=".55"/>
        ${U.caption(String(year), 61, 48, { size: 18, fill: '#e0d3b7' })}
        ${U.caption('典礼册', 61, 84, { size: 17, fill: '#e0d3b7' })}
      </g>`;
    }).join('');
    return U.room('act4-hall', state, {
      midground: `<path d="M95 105H1185V355H95Z" fill="#6f5c48" stroke="#3d3128" stroke-width="8"/>
        <path d="M160 340V185Q640 65 1120 185V340" fill="#9b886b" stroke="#483a2d" stroke-width="7"/>
        <path d="M490 315V205Q640 155 790 205V315" fill="#4c4135" stroke="#382e26" stroke-width="6"/>
        <path d="M160 355H1120M200 390H1080" stroke="#4c3d30" stroke-width="12"/>
        <g fill="#75624e" stroke="#40342a" stroke-width="5">
          <path d="M180 435V390H1100V435Z"/><path d="M145 510V455H1135V510Z"/>
          <path d="M110 600V535H1170V600Z"/>
        </g>
        <g stroke="#44372c" stroke-width="8"><path d="M210 510V565M1070 510V565M180 600V655M1100 600V655"/></g>
        <path d="M325 535H950V609H325Z" fill="#857056" stroke="#40342a" stroke-width="6"/>
        ${books}
        <g transform="translate(895 408)">
          <path d="M0 15Q60-5 120 15V125Q60 105 0 125Z" fill="#d8c9aa" stroke="#493b2e" stroke-width="5"/>
          <path d="M120 15Q180-5 240 15V125Q180 105 120 125Z" fill="#d8c9aa" stroke="#493b2e" stroke-width="5"/>
          <path d="M120 15V125M22 48H94M22 67H94M144 48H216M144 67H216" stroke="#8f7c60" stroke-width="3"/>
          <g opacity="${found ? 1 : .16}">${U.caption('沈立', 178, 103, { size: 22 })}</g>
        </g>`,
      interactable: U.hotspot('ceremony', '查看最后一排不同年份的典礼册', 385, 375, 755, 190, 'OPEN_EVIDENCE', { id: 'ceremony' }) + backToMap(),
      overlay: `<g pointer-events="none">
        <path d="M1080 70L770 565H1140Z" fill="#d7bd83" opacity=".12"/>
        ${U.caption('最后一排', 1050, 555, { size: 19, fill: '#e0d2b5' })}
      </g>`,
      character: ''
    });
  }

  function alumni(state) {
    const found = collected(state, 'roster');
    const lines = [0, 1, 2, 3, 4, 5].map(i => `<path d="M405 ${275 + i * 43}H875" stroke="#aa9674" stroke-width="2"/>`).join('');
    return U.room('act4-alumni', state, {
      midground: `<rect x="82" y="88" width="245" height="330" fill="#76624d" stroke="#41342a" stroke-width="7"/>
        <g stroke="#b4a081" stroke-width="3" opacity=".55">${[0,1,2,3,4,5,6].map(i => `<path d="M110 ${130 + i * 37}H295"/>`).join('')}</g>
        <path d="M245 545L315 265H990L1060 545Z" fill="#6b553e" stroke="#3e3127" stroke-width="9"/>
        <path d="M350 205Q505 160 640 210V495Q500 450 350 490Z" fill="#d9c9a8" stroke="#4b3b2d" stroke-width="6"/>
        <path d="M640 210Q775 160 930 205V490Q780 450 640 495Z" fill="#d9c9a8" stroke="#4b3b2d" stroke-width="6"/>
        <path d="M640 210V495" stroke="#7b654b" stroke-width="5"/>
        ${lines}
        ${U.caption('名册续页', 760, 245, { size: 21 })}
        ${U.caption('刘长睿', 530, 313, { size: 23 })}
        ${U.caption('……', 530, 399, { size: 18, fill: '#8a765a' })}
        <g opacity="${found ? 1 : .72}">${U.caption('沈立', 530, 442, { size: 25 })}</g>
        <path d="M455 325Q525 337 590 323M455 454Q520 466 585 452" fill="none" stroke="#5e4c3a" stroke-width="2" opacity=".55"/>`,
      interactable: U.hotspot('roster', '向后翻阅名册续页', 330, 175, 620, 345, 'OPEN_EVIDENCE', { id: 'roster' }) + backToMap(),
      overlay: `<g pointer-events="none"><path d="M335 520Q640 475 950 520" fill="none" stroke="#c5a870" stroke-width="4" opacity=".45"/></g>`,
      character: ''
    });
  }

  function frontyard(state) {
    const found = collected(state, 'plaque');
    return U.room('act4-frontyard', state, {
      midground: `<path d="M95 85H1185V575H95Z" fill="#b39d7e" stroke="#48382b" stroke-width="8"/>
        <g fill="#879087" stroke="#473a2f" stroke-width="6">
          <path d="M160 150H360V310H160Z"/><path d="M440 150H640V310H440Z"/><path d="M160 365H360V510H160Z"/>
        </g>
        <g stroke="#51463a" stroke-width="4"><path d="M260 150V310M160 230H360M540 150V310M440 230H640M260 365V510M160 438H360"/></g>
        <path d="M710 115L736 195L715 252L754 325L725 390L750 470L720 555" fill="none" stroke="#796650" stroke-width="18" opacity=".45"/>
        <path d="M705 120L730 196L710 250L748 326L720 391L744 469L715 550" fill="none" stroke="#c4b092" stroke-width="9"/>
        <path d="M745 330L810 305M738 405L805 438M728 485L790 520" stroke="#c4b092" stroke-width="8"/>
        <g transform="translate(825 365)">
          <rect width="245" height="142" rx="5" fill="#73664f" stroke="#3e342a" stroke-width="7"/>
          <rect x="13" y="13" width="219" height="116" fill="#8c7c60" stroke="#b29b70" stroke-width="2"/>
          <circle cx="28" cy="28" r="5" fill="#4b4134"/><circle cx="217" cy="28" r="5" fill="#4b4134"/>
          ${U.caption('修缮施工铭牌', 123, 55, { size: 18, fill: '#d0bea0' })}
          <g opacity="${found ? 1 : .15}">${U.caption('沈立', 123, 104, { size: 29, fill: '#e0cda7' })}</g>
        </g>
        <path d="M80 575H1200V720H80Z" fill="#9d8b6e"/>`,
      interactable: U.hotspot('plaque', '用年轮珀照亮新修缮痕迹旁的铭牌', 780, 325, 330, 220, 'OPEN_EVIDENCE', { id: 'plaque' }) + backToMap(),
      overlay: `<g pointer-events="none" opacity="${found ? .8 : .28}">
        <ellipse cx="945" cy="438" rx="185" ry="125" fill="#c5a66b" opacity=".18"/>
        <path d="M805 355L1085 525M1085 355L805 525" stroke="#c5a66b" stroke-width="3" opacity=".35"/>
      </g>`,
      character: ''
    });
  }

  function museum(state) {
    // 真实层自由展陈：没有守忆者、虚构师生、物证、谜题或任务入口。
    return U.room('act4-museum', state, {
      midground: `<path d="M65 95H1215V585H65Z" fill="#c6b89c" stroke="#4b3d30" stroke-width="8"/>
        <path d="M95 125H1185" stroke="#8c795d" stroke-width="3"/>
        <g transform="translate(110 175)">
          <rect width="270" height="300" fill="#a89372" stroke="#47382c" stroke-width="6"/>
          <path d="M35 55Q90 35 135 55V210Q85 190 35 210Z" fill="#ddd0b2" stroke="#554535" stroke-width="4"/>
          <path d="M135 55Q185 35 235 55V210Q185 190 135 210Z" fill="#ddd0b2" stroke="#554535" stroke-width="4"/>
          <path d="M135 55V210M55 90H115M55 115H115M155 90H215M155 115H215M55 145H115M155 145H215" stroke="#8e7b5f" stroke-width="2"/>
          ${U.caption('手稿', 135, 265, { size: 24 })}
        </g>
        <g transform="translate(465 145)">
          <rect width="350" height="355" fill="#b4a183" stroke="#47382c" stroke-width="6"/>
          <path d="M40 55H310M40 115H310M40 175H310M40 235H310" stroke="#8d795c" stroke-width="3"/>
          <path d="M65 295H285" stroke="#66513d" stroke-width="7"/>
          ${U.caption('吴健雄', 175, 42, { size: 27 })}
          ${U.caption('生平与展陈', 175, 330, { size: 22 })}
        </g>
        <g transform="translate(900 180)">
          <rect width="270" height="295" fill="#a89372" stroke="#47382c" stroke-width="6"/>
          <path d="M45 210H225M70 205V115H200V205" fill="none" stroke="#493e33" stroke-width="8"/>
          <circle cx="135" cy="105" r="58" fill="#777a70" stroke="#41372e" stroke-width="7"/>
          <circle cx="135" cy="105" r="30" fill="#b8aa8e" stroke="#494036" stroke-width="5"/>
          <path d="M135 47V163M77 105H193M95 65L175 145M175 65L95 145" stroke="#4c463c" stroke-width="4"/>
          ${U.caption('实验器具', 135, 260, { size: 23 })}
        </g>`,
      interactable: U.hotspot('manuscript', '查看吴健雄手稿', 90, 155, 310, 355, 'SHOW_DOCUMENT', { id: 'manuscript' }) +
        U.hotspot('biography', '查看吴健雄生平展陈', 445, 125, 390, 400, 'SHOW_DOCUMENT', { id: 'biography' }) +
        U.hotspot('apparatus', '查看吴健雄实验器具', 880, 155, 310, 355, 'SHOW_DOCUMENT', { id: 'apparatus' }) + backToMap(),
      overlay: `<g pointer-events="none">${U.caption('2002 年 5 月 31 日建成开放', 640, 565, { size: 18, fill: '#5c4b39' })}</g>`,
      character: ''
    });
  }

  function evidenceCard(state, id, x, y) {
    const found = collected(state, id);
    const shown = projected(state, id);
    let drawing = '';
    if (id === 'ceremony') {
      drawing = `<path d="M-52-38Q-22-48 0-34V45Q-25 32-52 42ZM0-34Q25-48 52-38V42Q25 32 0 45Z" fill="#d7c6a3" stroke="#4a3b2e" stroke-width="4"/>
        ${U.caption('2002', 27, 2, { size: 17 })}${U.caption('沈立', -27, 25, { size: 16 })}`;
    } else if (id === 'roster') {
      drawing = `<rect x="-52" y="-47" width="104" height="94" fill="#d7c6a3" stroke="#4a3b2e" stroke-width="4"/>
        <path d="M-38-20H38M-38 2H38M-38 25H38" stroke="#9b8565" stroke-width="2"/>
        ${U.caption('刘长睿', 0, -7, { size: 14 })}${U.caption('沈立', 0, 34, { size: 16 })}`;
    } else {
      drawing = `<rect x="-55" y="-38" width="110" height="76" rx="4" fill="#857456" stroke="#42362b" stroke-width="5"/>
        <circle cx="-42" cy="-25" r="3" fill="#c0aa80"/><circle cx="42" cy="-25" r="3" fill="#c0aa80"/>
        ${U.caption('沈立', 0, 11, { size: 21, fill: '#ddcaa5' })}`;
    }
    return `<g class="act4-evidence-card ${shown ? 'is-projected' : ''}" transform="translate(${x} ${y})" opacity="${found || shown ? 1 : .38}">
      <rect x="-82" y="-72" width="164" height="150" rx="6" fill="${shown ? '#b89c6c' : '#6e5d48'}" fill-opacity="${shown ? .32 : .2}" stroke="${shown ? '#c1a16a' : '#77654e'}" stroke-width="${shown ? 4 : 2}"/>
      ${drawing}${U.caption(id === 'ceremony' ? '典礼记录' : (id === 'roster' ? '名册续页' : '修缮铭牌'), 0, 68, { size: 16, fill: '#dfcfaf' })}
    </g>`;
  }

  function tree(state) {
    const cards = ORDER.map((id, i) => evidenceCard(state, id, 390 + i * 250, 535)).join('');
    const rays = ORDER.map((id, i) => {
      const x = 390 + i * 250;
      return `<path d="M610 410Q${610 + (x - 610) / 2} 455 ${x} 475" fill="none" stroke="#c5a269" stroke-width="3" stroke-dasharray="7 9" opacity="${projected(state, id) ? .8 : .08}"/>`;
    }).join('');
    const hotspots = ORDER.map((id, i) => U.hotspot(
      'project-' + id,
      '投射' + (id === 'ceremony' ? '典礼记录' : (id === 'roster' ? '名册续页' : '修缮铭牌')),
      300 + i * 250, 450, 180, 170, 'PROJECT_EVIDENCE', { id: EVIDENCE_IDS[id] }
    )).join('');
    return U.room('act4-tree', state, {
      midground: `<path d="M0 560Q300 520 620 565T1280 540V720H0Z" fill="#a99a7d"/>
        ${PineArt.pine({ status: 'restoring', grafted: 3 }, { x: 610, y: 320, scale: 1.35, era: 'act4', vivid: false })}
        ${PineArt.amber(state.amber || { rings: 3, grafted: 3 }, { x: 610, y: 420, scale: .32, era: 'act4', selected: true })}
        ${cards}`,
      interactable: hotspots + backToMap(),
      overlay: `<g pointer-events="none">${rays}
        <path d="M930 160Q1080 260 1040 465" fill="none" stroke="#6f6250" stroke-width="2" stroke-dasharray="2 13" opacity=".45"/>
      </g>`,
      character: `<g opacity=".64">${PineArt.keeper({ x: 1030, y: 350, scale: 1.08, era: 'act4', fading: true, pose: 'stand' })}</g>`
    });
  }

  function ending(state) {
    const gone = keeperGone(state);
    const keeper = gone ? '' : `<g class="act4-keeper-dissolve">${PineArt.keeper({
      x: 970, y: 355, scale: 1.12, era: 'act4', pose: 'dissolve', dissolve: .86, fading: true, flip: true
    })}</g>`;
    return U.room('act4-ending', state, {
      midground: `<path d="M0 560Q300 520 620 565T1280 540V720H0Z" fill="#a99a7d"/>
        <g class="act4-ending-visual">${PineArt.pine({ status: 'sprout', grafted: 3 }, { x: 610, y: 330, scale: 1.45, era: 'act4', vivid: true })}</g>
        <g transform="translate(1085 555)" opacity=".7"><path d="M-45 35L-65 105M45 35L65 105M0 35V110" stroke="#40372d" stroke-width="9"/><path d="M-62 0H62V48H-62Z" fill="#5c5547" stroke="#352e27" stroke-width="6"/><circle r="25" fill="#393c36" stroke="#8b7959" stroke-width="5"/></g>`,
      interactable: U.hotspot('endingCamera', '走到六朝松前的相机旁', 990, 500, 220, 170, 'ENTER_SCENE', { scene: 'camera' }),
      overlay: `<style>
        .act4-keeper-dissolve .keeper-ink-silhouette{animation:act4-ink-leave 6s ease-in 1 both}
        .act4-keeper-dissolve .keeper-dissolve-particles{animation:act4-ink-return 5.6s ease-in 1 both}
        .act4-ending-visual .pine-wound-sprout .sprout-stem,.act4-ending-visual .pine-wound-sprout .sprout-stem-outline{stroke-dasharray:140;stroke-dashoffset:140;animation:act4-stem-grow 2.8s 2.4s ease-out both}
        .act4-ending-visual .pine-wound-sprout .sprout-leaf{transform-box:fill-box;transform-origin:center bottom;animation:act4-leaf-grow 2.6s 4s ease-out both}
        @keyframes act4-ink-leave{0%,18%{opacity:1}100%{opacity:0}}
        @keyframes act4-ink-return{0%{opacity:.2;transform:translate(0,0)}35%{opacity:1}100%{opacity:0;transform:translate(-180px,-30px)}}
        @keyframes act4-stem-grow{to{stroke-dashoffset:0}}
        @keyframes act4-leaf-grow{0%{opacity:0;transform:scale(.15)}100%{opacity:1;transform:scale(1)}}
      </style><g pointer-events="none">
        <path d="M870 250Q720 280 610 375" fill="none" stroke="#5b5142" stroke-width="3" stroke-dasharray="2 15" opacity=".4"/>
      </g>`,
      character: keeper
    });
  }

  // 与 prologue.js 的相机场景共用同一 1280×720 正面构图、树坐标与边框。
  function fixedCamera(state, runtime, mode) {
    const epilogue = !!(mode && mode.epilogue);
    const returned = epilogue || U.flag(state, ['letterReturned', 'returnedLetter', 'letterInBag']);
    const pine = PineArt.pine({ status: 'sprout', grafted: 3 }, {
      x: 655, y: 355, scale: 1.15, era: 'prologue', vivid: true
    });
    const subtitle = global.PineContent && PineContent.dialogues && PineContent.dialogues.epilogue ?
      PineContent.dialogues.epilogue.subtitle : '六朝松下见证的下一个故事，就由我们这一代SEUer书写';
    return U.room(epilogue ? 'epilogue-camera' : 'act4-camera', state, {
      midground: `<rect x="135" y="65" width="1010" height="570" rx="8" fill="#cfc5ac" stroke="#392f26" stroke-width="18"/>
        <path d="M165 95H1115V575H165Z" fill="#d9d0b9" stroke="#857558" stroke-width="4"/>${pine}
        <path d="M140 630L90 710M1140 630L1190 710M640 630V720" stroke="#3e362c" stroke-width="12"/>
        <g transform="translate(195 475)"><path d="M0 0h105l20 35v80H0Z" fill="#4c4437" stroke="#2f2922" stroke-width="6"/><circle cx="65" cy="57" r="30" fill="#292d27" stroke="#8a795a" stroke-width="6"/><path d="M105 12l35-15v35l-35 5" fill="#665b48"/></g>
        <g transform="translate(980 480)"><path d="M0 30Q60-10 120 30L110 135H10Z" fill="#645844" stroke="#352e25" stroke-width="6"/><path d="M30 30Q30-15 60-15T90 30" fill="none" stroke="#3d3429" stroke-width="8"/>
          ${returned ? '<path d="M77 18L108 23L102 70L72 64Z" fill="#c7b795" stroke="#40352a" stroke-width="3"/><path d="M79 35L101 39" stroke="#76634b" stroke-width="2"/>' : ''}
        </g>
        <g transform="translate(350 110)"><rect width="180" height="125" fill="#b8a989" stroke="#584a38" stroke-width="5"/><path d="M20 105V35h100v70" fill="#7a705b" opacity=".55"/><circle cx="130" cy="85" r="16" fill="#484239"/></g>`,
      interactable: epilogue || returned ? '' : U.hotspot('returnLetter', '把信放回相机包后侧夹层', 930, 450, 200, 190, 'RETURN_LETTER'),
      overlay: `<g pointer-events="none"><rect x="165" y="95" width="950" height="480" fill="none" stroke="#eee3c7" stroke-width="3" opacity=".45"/><path d="M640 90v22M640 558v22M160 335h22M1100 335h22" stroke="#eee3c7" stroke-width="3"/>
        <circle cx="255" cy="530" r="24" fill="#4e553b" stroke="#2f3427" stroke-width="5"/><path d="M266 508l12 9-9 7" fill="#d0c5aa"/></g>
        ${epilogue ? `<g class="epilogue-subtitle" pointer-events="none"><rect x="90" y="612" width="1100" height="72" fill="#29271f" opacity=".88"/>
          ${U.caption(subtitle, 640, 657, { size: 26, fill: '#e8dfc9', extra: 'letter-spacing="1"' })}
          <animate attributeName="opacity" from="0" to="1" dur="3s" fill="freeze"/></g>` : ''}`,
      character: ''
    });
  }

  scenes.act4 = function (state, runtime) {
    const key = ((state.scene || '') + ' ' + (state.phase || '')).toLowerCase();
    if (/museum|memorial/.test(key)) return museum(state);
    if (/camera|letter/.test(key)) return fixedCamera(state, runtime);
    if (/ending|dissolve|newshoot|new-shoot/.test(key)) return ending(state);
    if (/hall|ceremony/.test(key)) return hall(state);
    if (/alumni|roster/.test(key)) return alumni(state);
    if (/frontyard|plaque|repair/.test(key)) return frontyard(state);
    if (/tree|pine|project/.test(key) && !/map|campus/.test(key)) return tree(state);
    return map(state, runtime);
  };

  scenes.act4_map = map;
  scenes.act4_tree = tree;
  scenes.act4_project = tree;
  scenes.act4_hall = hall;
  scenes.act4_alumni = alumni;
  scenes.act4_frontyard = frontyard;
  scenes.act4_museum = museum;
  scenes.act4_memorial = museum;
  scenes.act4_ending = ending;
  scenes.act4_camera = fixedCamera;
})(window);
