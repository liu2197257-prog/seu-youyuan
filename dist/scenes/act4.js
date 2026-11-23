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
    const years = [1999, 2000, 2001, 2002];
    const books = [215, 338, 458, 582].map((x, i) =>
      U.caption(String(years[i]), x, 501, { size: 20, fill: '#e0d3b7' }) +
      U.caption('典礼册', x, 529, { size: 16, fill: '#e0d3b7' })
    ).join('');
    return U.room('act4-hall', state, {
      backdrop: 'hall-archive',
      interactable: U.hotspot('ceremony', '查看最后一排不同年份的典礼册', 162, 371, 969, 229, 'OPEN_EVIDENCE', { id: 'ceremony' }) + backToMap(),
      overlay: `<g pointer-events="none">${books}
        ${found ? U.caption('沈立', 988, 549, { size: 22 }) : ''}
      </g>`
    });
  }

  function alumni(state) {
    const found = collected(state, 'roster');
    return U.room('act4-alumni', state, {
      backdrop: 'alumni-roster',
      midground: `
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
      backdrop: 'frontyard-wall',
      midground: `<g transform="translate(1087 303)">
        ${U.caption('修缮施工铭牌', 0, -5, { size: 17, fill: '#ded0aa' })}
        <g opacity="${found ? 1 : 0}">${U.caption('沈立', 0, 22, { size: 24, fill: '#e0cda7' })}</g>
      </g>`,
      interactable: U.hotspot('plaque', '用年轮珀照亮新修缮痕迹旁的铭牌', 990, 229, 194, 149, 'OPEN_EVIDENCE', { id: 'plaque' }) + backToMap(),
      overlay: found ? '<ellipse cx="1087" cy="303" rx="89" ry="58" fill="#c5a66b" opacity=".14" pointer-events="none"/>' : '',
      character: ''
    });
  }

  function museum(state) {
    // 真实层自由展陈：没有守忆者、虚构师生、物证、谜题或任务入口。
    return U.room('act4-museum', state, {
      backdrop: 'memorial-exhibit',
      interactable: U.hotspot('manuscript', '查看吴健雄手稿', 28, 125, 353, 424, 'SHOW_DOCUMENT', { id: 'manuscript' }) +
        U.hotspot('biography', '查看吴健雄生平展陈', 385, 125, 559, 424, 'SHOW_DOCUMENT', { id: 'biography' }) +
        U.hotspot('apparatus', '查看吴健雄实验器具', 948, 125, 304, 424, 'SHOW_DOCUMENT', { id: 'apparatus' }) + backToMap(),
      overlay: `<g pointer-events="none">
        ${U.caption('手稿', 204, 585, { size: 21, fill: '#e4d7b8' })}
        ${U.caption('吴健雄生平', 665, 585, { size: 21, fill: '#e4d7b8' })}
        ${U.caption('实验器具', 1096, 585, { size: 21, fill: '#e4d7b8' })}
        ${U.caption('2002 年 5 月 31 日建成开放', 640, 685, { size: 18, fill: '#e4d7b8' })}</g>`,
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
      backdrop: 'pine-court-4',
      midground: `${PineArt.pine({ status: 'restoring', grafted: 3 }, { x: 610, y: 336, scale: 1.44, era: 'act4' })}
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
      x: 992, y: 455, scale: 1.12, era: 'act4', pose: 'dissolve', dissolve: .86, fading: true, flip: true
    })}</g>`;
    return U.room('act4-ending', state, {
      backdrop: 'pine-court-4',
      midground: `<g class="act4-ending-visual">${PineArt.pine({ status: 'sprout', grafted: 3 }, { x: 610, y: 335, scale: 1.46, era: 'act4', vivid: true })}</g>
        ${PineArt.camera({ x: 1081, y: 560, scale: .64, bag: false })}`,
      interactable: U.hotspot('endingCamera', '走到六朝松前的相机旁', 990, 500, 220, 170, 'ENTER_SCENE', { scene: 'camera' }),
      overlay: `<style>
        .act4-keeper-dissolve .keeper-ink-silhouette{animation:act4-ink-leave 6s ease-in 1 both}
        .act4-keeper-dissolve .keeper-dissolve-particles{animation:act4-ink-return 5.6s ease-in 1 both}
        .act4-ending-visual .pine-wound-sprout .sprout-illustration{transform-box:fill-box;transform-origin:center bottom;animation:act4-shoot-grow 2.8s 2.4s ease-out both}
        @keyframes act4-ink-leave{0%,18%{opacity:1}100%{opacity:0}}
        @keyframes act4-ink-return{0%{opacity:.2;transform:translate(0,0)}35%{opacity:1}100%{opacity:0;transform:translate(-180px,-30px)}}
        @keyframes act4-shoot-grow{0%{opacity:0;transform:scale(.1)}100%{opacity:1;transform:scale(1)}}
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
    const subtitle = global.PineContent && PineContent.dialogues && PineContent.dialogues.epilogue ?
      PineContent.dialogues.epilogue.subtitle : '六朝松下见证的下一个故事，就由我们这一代SEUer书写';
    return U.room(epilogue ? 'epilogue-camera' : 'act4-camera', state, {
      midground: U.cameraView({ status: 'sprout', grafted: 3 }, true, returned),
      interactable: epilogue || returned ? '' : U.hotspot('returnLetter', '把信放回相机包后侧夹层', 930, 450, 200, 190, 'RETURN_LETTER'),
      overlay: `${U.viewfinder()}
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
