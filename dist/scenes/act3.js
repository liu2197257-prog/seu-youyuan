/* Act III (1988): scene rendering only. Puzzle decisions remain in state/puzzles. */
(function (global) {
  'use strict';

  const scenes = global.PineScenes = global.PineScenes || {};
  const U = global.PineSceneUtil;

  function flag(state, names) {
    return U.flag(state, names);
  }

  function back(scene) {
    return U.hotspot('backMap', '返回校园地图', 30, 598, 150, 78, 'ENTER_SCENE', { scene: scene || 'map' });
  }

  function documentSheet(id, x, y, w, h, title, rows, options) {
    options = options || {};
    const titleSvg = U.caption(title, x + w / 2, y + 31, { size: options.titleSize || 18, fill: '#4c4032' });
    const rowSvg = rows.map((row, index) => {
      const yy = y + 62 + index * (options.rowHeight || 25);
      return `<path d="M${x + 13} ${yy + 7}H${x + w - 13}" stroke="#aa9979" stroke-width="1"/>
        ${U.caption(row, x + (options.center ? w / 2 : 20), yy, { size: options.size || 14, anchor: options.center ? 'middle' : 'start', fill: '#594a39' })}`;
    }).join('');
    return `<g id="${id}" transform="rotate(${options.rotate || 0} ${x + w / 2} ${y + h / 2})">
      <path d="M${x + 4} ${y + 5}H${x + w + 4}V${y + h + 5}H${x + 4}Z" fill="#584b3b" opacity=".15"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${options.fill || '#d8cba9'}" stroke="#79674d" stroke-width="3"/>
      ${titleSvg}${rowSvg}${options.extra || ''}
    </g>`;
  }

  function nestedWindowGear(x, y) {
    return `<g id="nested-window-gear" transform="translate(${x} ${y})">
      <path d="M0-47L9-39L21-42L27-31L39-27L39-14L48-4L43 8L47 21L36 28L31 41L18 40L7 48L-4 43L-17 47L-25 36L-39 32L-39 18L-48 7L-43-5L-47-18L-36-26L-31-39L-18-39L-7-48Z" fill="#8a7955" stroke="#40372b" stroke-width="4"/>
      <circle r="34" fill="#b4a580" stroke="#4d4537" stroke-width="4"/>
      <path d="M-25-25H25V25H-25ZM0-25V25M-25 0H25" fill="none" stroke="#59675b" stroke-width="5"/>
      <path d="M-13-13H13V13H-13ZM0-13V13M-13 0H13" fill="none" stroke="#746448" stroke-width="3"/>
    </g>`;
  }

  function signatureGear(x, y) {
    const cuts = Array.from({ length: 18 }, (_, index) => {
      if (index === 2 || index === 3) return '';
      const angle = index * 20;
      return `<path d="M0-36V-24" transform="rotate(${angle})" stroke="#4f4434" stroke-width="4"/>`;
    }).join('');
    return `<g id="signature-gear" transform="translate(${x} ${y})">
      <circle r="45" fill="#a18d65" stroke="#40372b" stroke-width="5"/>
      <circle r="37" fill="#c0af86" stroke="#65563f" stroke-width="3"/>
      <circle r="18" fill="none" stroke="#766244" stroke-width="3" stroke-dasharray="3 5"/>
      <circle r="7" fill="#5c4e39"/>
      ${cuts}
      <path d="M28-31Q38-22 42-10" fill="none" stroke="#d5c49a" stroke-width="8"/>
    </g>`;
  }

  function map(state, runtime) {
    return U.map(state, runtime, [
      { id: 'frontyard', art: 'frontyard', name: '前工院', scene: 'frontyard', x: 270, y: 215, scale: .7 },
      { id: 'alumni', art: 'alumni', name: '校友会堂', scene: 'alumni', x: 1000, y: 215, scale: .68 }
    ]);
  }

  function frontyard(state) {
    const aligned = flag(state, ['projectionAligned', 'frontyardComplete', 'act3FrontyardComplete', 'oldWindowAligned']);
    const projectionStarted = aligned || flag(state, ['projectionStarted', 'frontyardProjectionStarted']) ||
      /projection|align|complete|after/.test(`${state.scene || ''} ${state.phase || ''}`.toLowerCase());
    const newWindow = `<g id="new-1987-window">
      <rect x="92" y="105" width="342" height="300" fill="#89988a" stroke="#443d32" stroke-width="10"/>
      <rect x="111" y="124" width="304" height="262" fill="#b8bda8" stroke="#5c6458" stroke-width="5"/>
      <path d="M187 124V386M263 124V386M339 124V386M111 255H415" stroke="#59665c" stroke-width="9"/>
      <path d="M126 140H400V371H126Z" fill="none" stroke="#d0c9aa" stroke-width="3" opacity=".55"/>
      <g id="motionless-curtains">
        <path d="M69 91H129V429H69Q89 336 75 253Q91 174 69 91Z" fill="#7e8270" stroke="#4c4d41" stroke-width="5"/>
        <path d="M398 91H458V429H398Q417 337 405 254Q418 173 398 91Z" fill="#7e8270" stroke="#4c4d41" stroke-width="5"/>
        <path d="M88 107V411M82 259H118M439 107V411M409 259H447" stroke="#a5a48b" stroke-width="3"/>
      </g>
      <path d="M55 86H471" stroke="#463e33" stroke-width="11"/>
    </g>`;
    const oldShadow = `<g id="old-window-shadow" class="shadow-drift" transform="translate(720 154) skewY(-5)" opacity="${aligned ? '.64' : '.39'}">
      <path d="M0 0H325V271H0Z" fill="#4e5b50"/>
      <path d="M18 17H307V254H18Z" fill="#b4b59d"/>
      <path d="M18 17H307V254H18Z" fill="none" stroke="#4c584d" stroke-width="13"/>
      <path d="M114 17V254M211 17V254M18 98H307M18 178H307" stroke="#4c584d" stroke-width="11"/>
      <path d="M114 17L153 58L211 17M18 178L65 135L114 178M211 98L259 139L307 98" fill="none" stroke="#4c584d" stroke-width="8"/>
    </g>`;
    const projectedPattern = projectionStarted ? `<g id="projected-pattern" transform="translate(${aligned ? 734 : 677} ${aligned ? 159 : 195}) rotate(${aligned ? -5 : 9} 157 127)">
      <path d="M0 0H314V254H0Z" fill="#a99468" opacity=".13"/>
      <g fill="none" stroke="#a28a59" stroke-width="5" opacity=".84">
        <path d="M0 0H314V254H0ZM104 0V254M209 0V254M0 92H314M0 172H314"/>
        <path d="M104 0L148 43L209 0M0 172L53 127L104 172M209 92L259 134L314 92"/>
      </g>
      <path id="familiar-handwriting" d="M209 92L259 134L314 92" fill="none" stroke="${aligned ? '#71523d' : '#9a845b'}" stroke-width="${aligned ? 11 : 5}"/>
    </g>` : '';
    const amber = `<g id="projection-amber" class="draggable" data-drag="projectionAmber" transform="translate(492 495)">
      <path d="M-38 3Q-43-29-12-42Q25-49 43-17Q51 18 20 38Q-15 49-38 3Z" fill="#765b3b" stroke="#3e3328" stroke-width="5"/>
      <ellipse cx="2" cy="-2" rx="27" ry="29" fill="none" stroke="#a88b56" stroke-width="3"/>
      <ellipse cx="2" cy="-2" rx="18" ry="20" fill="none" stroke="#a88b56" stroke-width="2"/>
      <path d="M-4 15Q-14-3 1-22Q14-4 9 15Z" fill="#342e26"/>
      <path d="M27-35L43-17L31-12" fill="#b4b59d"/>
    </g>`;
    const lessonMemory = aligned ? `<g id="lesson-margin-memory" class="memory-figure" opacity=".66">
      <path d="M1021 350L1164 326L1192 482L1048 507Z" fill="#d2c4a1" stroke="#6e5d46" stroke-width="4"/>
      <path d="M1044 377L1142 359M1048 399L1154 380M1054 424L1130 409M1058 448L1160 429" stroke="#74634c" stroke-width="3"/>
      <path d="M1077 465L1106 435L1136 455L1160 417" fill="none" stroke="#5d6c5e" stroke-width="4"/>
    </g>` : '';
    const hotspots = U.hotspot('projection', '投射图样并对齐旧窗影', 645, 116, 431, 354, 'OPEN_PROJECTION') +
      U.hotspot('oldWindowShadow', '查看新旧窗影', 76, 84, 403, 367, 'SHOW_DOCUMENT', { id: 'oldWindowShadow' }) +
      (aligned ? U.hotspot('nestedWindowGear', '取下新旧窗格嵌套纹齿轮', 1041, 492, 112, 112, 'TAKE', { item: 'nestedWindowGear' }) : '') +
      back('tree');
    return U.room('act3-frontyard', state, {
      midground: `<rect x="47" y="69" width="1186" height="504" fill="#bfc1a9" stroke="#494237" stroke-width="8"/>
        <path d="M48 468H1232M541 70V468M1184 70V468" stroke="#969b84" stroke-width="3"/>
        ${newWindow}
        <path d="M111 407L529 569H1088L415 407Z" fill="#d8cba6" opacity=".18"/>
        <g id="frontyard-desk">
          <path d="M406 489H821L851 543H375Z" fill="#817154" stroke="#483b2e" stroke-width="7"/>
          <path d="M406 541L394 637M811 541L826 637" stroke="#4d4031" stroke-width="15"/>
          <path d="M454 473L589 460L632 492L495 509Z" fill="#d0c19e" stroke="#78664d" stroke-width="3"/>
          <path d="M477 482L586 473M495 494L605 483" stroke="#7b6a50" stroke-width="2"/>
        </g>
        ${amber}
        ${aligned ? nestedWindowGear(1097, 548) : ''}
        <g id="rear-room-details" opacity=".6">
          <path d="M1113 102H1182V287H1113Z" fill="#78816d" stroke="#4d5143" stroke-width="5"/>
          <path d="M1127 126H1168M1127 153H1168M1127 180H1168M1127 207H1168" stroke="#b0af92" stroke-width="3"/>
        </g>`,
      interactable: hotspots,
      overlay: `<path d="M111 386L563 558H1135L415 386Z" fill="#d9cda9" opacity=".13"/>
        ${oldShadow}${projectedPattern}${lessonMemory}
        ${projectionStarted ? '' : U.caption('窗帘没有动', 264, 464, { size: 17, fill: '#5c5a49' })}
        ${aligned ? U.caption('图样边缘的改法，也抄在教案上', 907, 594, { size: 17, fill: '#514839' }) : ''}`,
      character: ''
    });
  }

  function memorialWall() {
    const names = [
      ['一九三六 · 王', '一九四一 · 陈', '一九四七 · 赵'],
      ['一九五二 · 周', '一九五六 · 吴', '一九五九 · ——'],
      ['一九六三 · 郑', '一九六八 · 林', '一九七二 · 许'],
      ['一九七七 · 唐', '一九八二 · 何', '一九八六 · 返校纪念']
    ];
    return `<g id="returning-alumni-wall">
      <path d="M65 91H651V457H65Z" fill="#847c66" stroke="#443b30" stroke-width="9"/>
      <path d="M87 115H629V430H87Z" fill="#a79d81" stroke="#665b47" stroke-width="4"/>
      ${U.caption('返 校 纪 念', 358, 153, { size: 25, fill: '#514839' })}
      <path d="M117 174H599" stroke="#6e634f" stroke-width="3"/>
      ${names.map((row, rowIndex) => row.map((name, columnIndex) => U.caption(name, 150 + columnIndex * 169, 215 + rowIndex * 51, { size: 14, fill: '#5b5141' })).join('')).join('')}
      <path d="M107 193V405M274 193V405M442 193V405M609 193V405" stroke="#8e8269" stroke-width="1" opacity=".55"/>
      <path d="M104 402H611" stroke="#6e624d" stroke-width="3"/>
    </g>`;
  }

  function alumni(state) {
    const phase = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    const wallSeen = flag(state, ['alumniWallSeen', 'memorialWallSeen']) || /roster|lesson|projection|letter|complete/.test(phase);
    const rosterFound = flag(state, ['rosterFound', 'roster1959Found', 'alumniRosterComplete']) || /lesson|projection|letter|complete/.test(phase);
    const lessonFound = flag(state, ['lessonFound', 'lessonPlanFound', 'alumniLessonComplete']) || /projection|letter|complete/.test(phase);
    const projected = flag(state, ['alumniProjectionComplete', 'lessonProjectionComplete']) || /letter|complete/.test(phase);
    const letterOpen = flag(state, ['letterOpened', 'act3LetterOpened', 'alumniComplete', 'act3AlumniComplete']) || /letter|complete/.test(phase);
    const roster = documentSheet('roster-1959', 714, 107, 218, 248, '1959 年课堂／实验记录', [
      '姓名        记录', '周  □  □', '刘长睿     留校待调', '陈  □  □', '赵  □  □'
    ], {
      size: 13,
      rowHeight: 29,
      rotate: -2,
      extra: '<path d="M800 225V242" stroke="#705a42" stroke-width="2"/><path d="M729 321H916" stroke="#8c795a" stroke-width="2" stroke-dasharray="4 4"/>'
    });
    const lesson = documentSheet('lesson-plan', 956, 102, 242, 262, '周老师的教案', [
      '指示叶片再薄一分', '后排就看得见了', '传动：低—高—中—低', '补件不拆原有结构', '1987 重建参考'
    ], {
      size: 14,
      rowHeight: 31,
      rotate: 2,
      fill: '#d5c8a5',
      extra: '<path d="M986 294L1031 259L1084 287L1144 232" fill="none" stroke="#637060" stroke-width="3"/>'
    });
    const projection = projected ? `<g id="model-memory-on-lesson" class="memory-figure" opacity=".53">
      <path d="M976 392H1167V499H976Z" fill="#829080" opacity=".35"/>
      <circle cx="1032" cy="437" r="34" fill="none" stroke="#4e6258" stroke-width="7"/>
      <circle cx="1110" cy="447" r="27" fill="none" stroke="#4e6258" stroke-width="6"/>
      <path d="M1007 414L1127 470M1007 464L1127 419M1032 403V471M1110 420V474" stroke="#4e6258" stroke-width="5"/>
      <path d="M1019 432L1035 377L1062 369L1045 438Z" fill="#8d805f" stroke="#4e5a4d" stroke-width="4"/>
      <path d="M985 496H1157" stroke="#4e6258" stroke-width="6"/>
    </g>` : '';
    const foldedLetter = `<g id="fully-open-letter">
      <path d="M708 432L927 410L947 578L728 599Z" fill="#d8c8a3" stroke="#776047" stroke-width="4"/>
      <path d="M718 513L937 491" stroke="#9a8462" stroke-width="2" stroke-dasharray="7 6"/>
      ${letterOpen ? `${U.caption('三片音：低、高、中。', 824, 463, { size: 15, fill: '#594938' })}
        ${U.caption('指示叶片再薄一分，后排就看得见了。', 824, 491, { size: 13, fill: '#594938' })}
        ${U.caption('这最后一步，我替你走了一半。', 830, 544, { size: 14, fill: '#594938' })}
        ${U.caption('剩下的不是你没做完，是老师没等到。', 832, 572, { size: 13, fill: '#594938' })}` : `<path d="M708 432L927 410L937 491L718 513Z" fill="#c7b894" stroke="#776047" stroke-width="3"/>
        ${U.caption('折信 · 内侧仍折着', 823, 474, { size: 16, fill: '#66543e' })}`}
    </g>`;
    const displayFurniture = `<g id="archive-display">
      <path d="M687 78H1210V379H687Z" fill="#aaa68b" stroke="#504638" stroke-width="7"/>
      <path d="M946 80V378M687 379H1210" stroke="#5c503e" stroke-width="6"/>
      <path d="M674 377H1220V397H674Z" fill="#6e5d46" stroke="#45382b" stroke-width="5"/>
      <path d="M680 594H1230V618H680Z" fill="#786448" stroke="#47392b" stroke-width="6"/>
      <path d="M704 617V660M1205 617V660" stroke="#4c3d2e" stroke-width="13"/>
      <path d="M674 398H1220V594H674Z" fill="#b9b091" opacity=".32"/>
    </g>`;
    const hotspots = U.hotspot('memorialWall', '查看返校纪念墙', 55, 80, 608, 389, 'OPEN_ALUMNI_STEP', { step: 'wall' }) +
      U.hotspot('roster1959', '查看 1959 年学生名册', 698, 91, 247, 278, 'OPEN_ALUMNI_STEP', { step: 'roster' }) +
      U.hotspot('lessonPlan', '查看周老师的教案', 946, 87, 268, 292, 'OPEN_ALUMNI_STEP', { step: 'lesson' }) +
      U.hotspot('projection', '把 1959 年记忆投到教案上', 965, 380, 241, 138, 'OPEN_ALUMNI_STEP', { step: 'projection' }) +
      U.hotspot('letter', '完全展开随身携带的折信', 689, 405, 270, 204, 'OPEN_ALUMNI_STEP', { step: 'letter' }) +
      (letterOpen ? U.hotspot('signatureGear', '取下签名刻痕纹齿轮', 1081, 522, 105, 105, 'TAKE', { item: 'signatureGear' }) : '') +
      back('tree');

    // Step visibility is presentation only; PineState remains the sole gatekeeper.
    const stepRoster = rosterFound || !wallSeen;
    const stepLesson = lessonFound || rosterFound;
    const stepProjection = projected || lessonFound;
    const stepLetter = letterOpen || projected;
    return U.room('act3-alumni', state, {
      midground: `<rect x="40" y="65" width="1200" height="512" fill="#bebba0" stroke="#4b4235" stroke-width="8"/>
        <path d="M41 478H1239M666 66V577" stroke="#99947a" stroke-width="3"/>
        ${memorialWall()}${displayFurniture}
        ${stepRoster ? roster : ''}${stepLesson ? lesson : ''}
        <g id="archive-labels">
          ${wallSeen && !rosterFound ? U.caption('名册在墙外的展柜里', 824, 405, { size: 15, fill: '#5d503d' }) : ''}
        </g>
        ${stepLetter ? foldedLetter : `<g id="letter-in-pocket">
          <path d="M723 485L886 470L895 568L733 583Z" fill="#a18f6d" stroke="#62513d" stroke-width="4"/>
          <path d="M723 485L806 535L886 470" fill="none" stroke="#6c5b43" stroke-width="3"/>
          ${U.caption('随身携带的折信', 809, 610, { size: 16, fill: '#554938' })}
        </g>`}
        ${letterOpen ? signatureGear(1133, 574) : ''}`,
      interactable: hotspots,
      overlay: `${stepProjection ? projection : ''}
        ${!wallSeen ? '<path d="M87 115H629V430H87Z" fill="#6c725f" opacity=".05"/>' : ''}
        ${projected && !letterOpen ? U.caption('教案上的改法，与旧窗影相同', 1026, 535, { size: 15, fill: '#504637' }) : ''}`,
      character: ''
    });
  }

  function rootDevice(state) {
    const windowAligned = flag(state, ['windowMemoryAligned', 'oldWindowMemoryFitted', 'rootWindowAligned']);
    const rosterAligned = flag(state, ['rosterMemoryAligned', 'rosterMemoryFitted', 'rootRosterAligned']);
    return `<g id="root-grown-device" transform="translate(830 426)">
      <g id="device-roots" fill="none" stroke="#514633" stroke-linecap="round">
        <path d="M-241 160Q-143 63-99-79M-217 189Q-76 114 0 133M239 179Q133 96 101-72M191 205Q72 138 0 133" stroke-width="25"/>
        <path d="M-192 150Q-134 14-157-106M190 162Q124 30 153-112" stroke-width="13"/>
      </g>
      <path d="M-168-120Q0-184 171-117L153 140Q0 183-154 139Z" fill="#73775d" stroke="#3d3c2e" stroke-width="8"/>
      <path d="M-144-100Q0-145 146-97L130 118Q0 149-130 116Z" fill="#a29a77" stroke="#514b38" stroke-width="5"/>
      <g id="root-device-slots">
        <circle cx="-75" cy="-12" r="57" fill="#5f6652" stroke="#393c30" stroke-width="7"/>
        <circle cx="76" cy="-12" r="57" fill="#5f6652" stroke="#393c30" stroke-width="7"/>
        <circle cx="-75" cy="-12" r="43" fill="none" stroke="#b1a078" stroke-width="4" stroke-dasharray="7 6"/>
        <circle cx="76" cy="-12" r="43" fill="none" stroke="#b1a078" stroke-width="4" stroke-dasharray="7 6"/>
        <g transform="translate(-75 -12)" fill="none" stroke="${windowAligned ? '#c0ae7e' : '#7d846a'}" stroke-width="4">
          <path d="M-25-25H25V25H-25ZM0-25V25M-25 0H25M-25-25L0 0L25-25"/>
        </g>
        <g transform="translate(76 -12)" fill="none" stroke="${rosterAligned ? '#c0ae7e' : '#7d846a'}" stroke-width="3">
          <circle r="27" stroke-dasharray="3 5"/><circle r="17" stroke-dasharray="3 4"/>
          <path d="M-22-15H19M-26-5H23M-22 6H17M-16 16H22"/>
        </g>
      </g>
      <path d="M-16-86L0-122L17-86M-19 83L0 117L19 83" fill="#86734f" stroke="#433a2c" stroke-width="4"/>
      <ellipse cx="0" cy="82" rx="34" ry="27" fill="#594c37" stroke="#382f25" stroke-width="6"/>
      <ellipse cx="0" cy="82" rx="23" ry="17" fill="none" stroke="#b09a67" stroke-width="3"/>
      <path id="root-cutting-needle" d="M0-120V-63L-8-46H8L0-63" fill="#9b875d" stroke="#41372a" stroke-width="3"/>
      <path d="M145 45H195V109M195 109L220 91" fill="none" stroke="#493d2e" stroke-width="11" stroke-linecap="round"/>
      <path d="M-139 135Q-65 100 0 133Q75 102 141 133" fill="none" stroke="#4f4633" stroke-width="14"/>
    </g>`;
  }

  function selfAccountMemory(state, phase) {
    let kind = 0;
    if (/door|return|account2|memory2/.test(phase)) kind = 2;
    else if (/teach|class|account3|memory3/.test(phase)) kind = 3;
    else if (/student|leave|account4|memory4/.test(phase)) kind = 4;
    else if (/lesson|dark|account5|memory5|wait/.test(phase)) kind = 5;
    else if (/note|write|account1|memory1/.test(phase)) kind = 1;
    if (!kind) return '';
    const memories = {
      1: `<path d="M334 155H941V557H334Z" fill="#b7ac8e"/>
        <path d="M433 196H823V497H433Z" fill="#d4c5a0" stroke="#756249" stroke-width="5"/>
        <path d="M474 260H766M474 301H746M474 342H778M474 383H694" stroke="#6b5b45" stroke-width="4"/>
        <path d="M927 571Q819 458 741 414" fill="none" stroke="#655f4e" stroke-width="31" stroke-linecap="round"/>
        <path d="M740 413L689 373" stroke="#958b71" stroke-width="23" stroke-linecap="round"/>
        <path d="M698 381L651 319" stroke="#433c30" stroke-width="7"/>
        <path d="M489 428H727" stroke="#554937" stroke-width="5"/>`,
      2: `<path d="M346 120H936V577H346Z" fill="#a6a58e"/>
        <path d="M439 113L782 170V566L439 514Z" fill="#6b604d" stroke="#3f372d" stroke-width="9"/>
        <path d="M782 170H935V566H782Z" fill="#c0b99b"/>
        <path d="M818 398H906V439H818Z" fill="#7a6c53"/><path d="M824 439L817 523M898 439L906 523" stroke="#534737" stroke-width="10"/>
        <path d="M841 308H905V376H841Z" fill="none" stroke="#6e624d" stroke-width="8"/>
        <path d="M970 581Q875 439 778 364" fill="none" stroke="#65604f" stroke-width="32" stroke-linecap="round"/>
        <circle cx="781" cy="363" r="17" fill="#948a70"/>`,
      3: `<path d="M284 96H1000V567H284Z" fill="#b8b598"/>
        <path d="M371 124H916V276H371Z" fill="#66705d" stroke="#484b3e" stroke-width="8"/>
        <path d="M299 553H989V598H299Z" fill="#695a43"/>
        <g fill="#575d50" stroke="#3f443a" stroke-width="4">
          <circle cx="425" cy="393" r="37"/><path d="M366 515Q374 432 425 429Q477 435 486 515Z"/>
          <circle cx="641" cy="367" r="39"/><path d="M577 515Q584 410 641 406Q700 414 708 515Z"/>
          <circle cx="850" cy="398" r="36"/><path d="M794 515Q799 435 850 433Q901 438 910 515Z"/>
        </g>
        <path d="M391 377Q425 340 457 377M605 349Q641 312 677 351M820 382Q850 347 881 383" fill="#3e453c"/>`,
      4: `<path d="M312 100H969V579H312Z" fill="#b4b294"/>
        <path d="M741 129H925V536H741Z" fill="#686c58" stroke="#484a3d" stroke-width="8"/>
        <path d="M765 155H900V510H765Z" fill="#c2b99a"/>
        <g fill="#596253" stroke="#3f483e" stroke-width="5">
          <circle cx="676" cy="261" r="29"/><path d="M625 439Q628 307 676 298Q726 310 733 439Z"/>
          <path d="M647 438L628 538M706 438L731 538" stroke-width="18"/>
          <circle cx="806" cy="330" r="25"/><path d="M764 489Q767 368 806 360Q849 370 852 489Z"/>
        </g>
        <path d="M362 557H935" stroke="#76674d" stroke-width="10"/>`,
      5: `<path d="M303 89H976V583H303Z" fill="#777b65"/>
        <path d="M457 371L799 338L849 504L504 541Z" fill="#b5a888" stroke="#5f513e" stroke-width="7"/>
        <path d="M633 357L681 521" stroke="#766249" stroke-width="5"/>
        <path d="M941 581Q817 473 701 435" fill="none" stroke="#55594a" stroke-width="34" stroke-linecap="round"/>
        <path d="M696 432L637 419" stroke="#8d846b" stroke-width="24" stroke-linecap="round"/>
        <path d="M342 107H937V352H342Z" fill="#606552" opacity=".66"/>
        <path d="M348 107L287 39M932 107L992 39" stroke="#4a4e40" stroke-width="13"/>`
    };
    return `<g id="keeper-first-person-memory" class="memory-figure">${memories[kind]}</g>`;
  }

  function tree(state) {
    const phase = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    const bothComplete = flag(state, ['frontyardComplete', 'act3FrontyardComplete']) &&
      flag(state, ['alumniComplete', 'act3AlumniComplete']);
    const account = /account|self|memory[1-5]|request|confession/.test(phase) || (bothComplete && /tree|return/.test(phase) && !/device|graft/.test(phase));
    const device = /device|root|engrave|carve/.test(phase);
    const graft = /graft|third|align/.test(phase) || flag(state, ['thirdRingCut', 'act3RingCut']);
    const grafted = flag(state, ['act3Grafted', 'thirdRingGrafted']) || (state.amber && state.amber.grafted >= 3);
    const showDevice = device || graft;
    const keeper = showDevice ? '' : PineArt.keeper({
      x: account ? 810 : 1080,
      y: account ? 405 : 383,
      scale: account ? 1.08 : .82,
      pose: account ? 'reach' : 'lowered',
      className: account ? 'quiet-pulse' : ''
    });
    const pine = PineArt.pine(state.amber || {}, {
      x: showDevice ? 383 : 553,
      y: 360,
      scale: showDevice ? 1.38 : 1.5,
      era: 'act3',
      broken: false,
      vivid: false,
      rings: grafted ? 3 : 2
    });
    const memory = account ? selfAccountMemory(state, phase) : '';
    const hotspots = showDevice ?
      U.hotspot('rootDevice', '对入两段记忆并刻第三圈', 633, 241, 421, 353, 'OPEN_DEVICE') +
        U.hotspot('graft', '接合第三圈年轮', 287, 209, 202, 291, 'OPEN_GRAFT', { act: 'act3' }) +
        U.hotspot('backTree', '返回树前', 30, 598, 150, 78, 'ENTER_SCENE', { scene: 'tree' }) :
      U.hotspot('enterDevice', '查看树根间长出的装置', 685, 414, 307, 187, 'ENTER_SCENE', { scene: 'act3_device' }) +
        (graft ? U.hotspot('graft', '接合第三圈年轮', 442, 211, 213, 286, 'OPEN_GRAFT', { act: 'act3' }) : '') +
        back('map');
    return U.room('act3-tree', state, {
      midground: `<rect width="1280" height="560" fill="#bdc0a3"/>
        <path d="M0 450Q323 417 640 457T1280 439V720H0Z" fill="#899273"/>
        <path d="M0 552Q310 506 637 548T1280 518" fill="none" stroke="#687357" stroke-width="5"/>
        <g opacity=".36" fill="#78836d" stroke="#515e50" stroke-width="5">
          <path d="M52 376V189L161 137L270 189V376Z"/><path d="M1032 378V186L1134 131L1234 186V378Z"/>
          <path d="M87 230H235M1066 224H1202" stroke="#b6b99b" stroke-width="5"/>
        </g>
        ${pine}
        <path id="remaining-crack" d="M551 169Q517 284 550 365T536 528" fill="none" stroke="#28271f" stroke-width="15" stroke-linecap="round"/>
        <g id="act3-new-branches" fill="none" stroke="#5a654b" stroke-width="13" stroke-linecap="round">
          <path d="M514 214Q392 154 305 84M587 188Q709 120 805 63M542 146Q515 88 496 39"/>
        </g>
        <g fill="#77825e" opacity=".88">
          <path d="M304 85l-45-28l19 45l-42 7l48 18Z"/><path d="M807 64l36-37l-9 48l45-3l-43 29Z"/><path d="M496 41l-20-42l40 26l17-42l8 52Z"/>
        </g>
        ${showDevice ? rootDevice(state) : `<g id="device-between-roots" opacity=".8">
          <path d="M694 582Q748 486 825 501Q910 472 987 579" fill="none" stroke="#514a36" stroke-width="21"/>
          <circle cx="790" cy="528" r="43" fill="#747b5e" stroke="#424936" stroke-width="7"/>
          <circle cx="895" cy="526" r="43" fill="#747b5e" stroke="#424936" stroke-width="7"/>
          <path d="M763 528H817M790 501V555M868 526H922M895 499V553" stroke="#b0a078" stroke-width="5"/>
          <path d="M837 495V448L829 432H845L837 448" fill="#968359" stroke="#493d2d" stroke-width="3"/>
        </g>`}`,
      interactable: hotspots,
      overlay: memory || (account ? '<path d="M1078 387Q963 353 851 398" fill="none" stroke="#5c6450" stroke-width="4" stroke-dasharray="8 10" opacity=".5"/>' : ''),
      character: keeper
    });
  }

  scenes.act3 = function (state, runtime) {
    const key = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    if (/frontyard|engineering|projection/.test(key) && !/alumni/.test(key)) return frontyard(state);
    if (/alumni|roster|lesson|letter/.test(key)) return alumni(state);
    if (/tree|pine|graft|device|root|account|memory[1-5]|request/.test(key)) return tree(state);
    return map(state, runtime);
  };

  scenes.act3_map = map;
  scenes.act3_frontyard = frontyard;
  scenes.act3_alumni = alumni;
  scenes.act3_tree = tree;
  scenes.act3_device = tree;
  scenes.act3_graft = tree;
})(window);
