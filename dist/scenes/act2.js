/* Act II (1959): scene rendering only. Puzzle decisions remain in state/puzzles. */
(function (global) {
  'use strict';

  const scenes = global.PineScenes = global.PineScenes || {};
  const U = global.PineSceneUtil;

  function flag(state, names) {
    return U.flag(state, names);
  }

  function paper(id, x, y, w, h, lines, options) {
    options = options || {};
    const lineHeight = options.lineHeight || 23;
    const text = lines.map((line, index) => U.caption(
      line,
      x + (options.align === 'left' ? 16 : w / 2),
      y + 37 + index * lineHeight,
      {
        size: options.size || 16,
        anchor: options.align === 'left' ? 'start' : 'middle',
        fill: options.faded ? '#746853' : '#493d30',
        extra: options.handwritten ? 'font-style="italic"' : ''
      }
    )).join('');
    return `<g id="${id}" transform="rotate(${options.rotate || 0} ${x + w / 2} ${y + h / 2})">
      <path d="M${x + 3} ${y + 5}H${x + w + 4}V${y + h + 5}H${x + 3}Z" fill="#625443" opacity=".16"/>
      <path d="M${x} ${y}H${x + w}V${y + h}H${x}Z" fill="${options.fill || '#d9cba9'}" stroke="#76634a" stroke-width="3"/>
      ${options.fold ? `<path d="M${x} ${y + h / 2}H${x + w}" stroke="#9d8966" stroke-width="2" stroke-dasharray="6 6"/>` : ''}
      ${text}
    </g>`;
  }

  function back(scene) {
    return U.hotspot('backMap', '返回校园地图', 30, 598, 150, 78, 'ENTER_SCENE', { scene: scene || 'map' });
  }

  function model(x, y, bladeInstalled) {
    return `<g id="teaching-model" transform="translate(${x} ${y})">
      <path d="M-130 108H142L125 139H-116Z" fill="#61503e" stroke="#352c24" stroke-width="6"/>
      <path d="M-104 105V48H-40V105M-25 105V24H31V105M48 105V55H108V105" fill="#7d827c" stroke="#3b3830" stroke-width="5"/>
      <circle cx="-67" cy="65" r="39" fill="#596a6c" stroke="#342f28" stroke-width="7"/>
      <circle cx="-67" cy="65" r="12" fill="#b1a78d" stroke="#41372b" stroke-width="5"/>
      <path d="M-67 26V104M-106 65H-28M-94 38L-40 92M-40 38L-94 92" stroke="#b0a58c" stroke-width="5"/>
      <circle cx="4" cy="62" r="27" fill="#8a7660" stroke="#393128" stroke-width="6"/>
      <path d="M-28 65H-23M31 62H48" stroke="#392f27" stroke-width="8"/>
      <path d="M59 78V27M82 78V13M105 78V39" stroke="#4b5150" stroke-width="10" stroke-linecap="round"/>
      <path d="M-120 110H130" stroke="#baaa89" stroke-width="3"/>
      ${bladeInstalled ? `<g id="indicator-blade-installed">
        <path d="M-67 65L-31-38Q-8-56 11-43L-46 72Z" fill="#a18b61" stroke="#3c3329" stroke-width="6"/>
        <path d="M-53 47L-21-34" stroke="#d0bd92" stroke-width="4"/>
      </g>` : `<g id="missing-blade">
        <path d="M-67 65L-42-10" stroke="#3d342a" stroke-width="8"/>
        <path d="M-58-17L-25-55L5-43L-30 2Z" fill="none" stroke="#887557" stroke-width="4" stroke-dasharray="7 7"/>
        <circle cx="-67" cy="65" r="7" fill="#342d26"/>
      </g>`}
    </g>`;
  }

  function studentMemory(x, y, smiling) {
    return `<g id="student-memory" class="memory-figure" transform="translate(${x} ${y})" opacity=".66">
      <path d="M-58 132Q-50 70-22 55L-17 25H20L24 57Q58 73 68 132Z" fill="#536063" stroke="#3c4140" stroke-width="5"/>
      <path d="M-23 21Q-28-27 5-37Q39-29 31 10L20 34H-12Z" fill="#8c8676" stroke="#41413b" stroke-width="5"/>
      <path d="M-27-4Q-23-40 8-42Q35-36 37-10Q10-23-27-4Z" fill="#3f4442"/>
      <path d="M-19 53L1 75L24 54M1 75V126" fill="none" stroke="#b1aa94" stroke-width="4"/>
      ${smiling ? `<path d="M-4 12Q6 20 16 11" fill="none" stroke="#504b40" stroke-width="3"/>
        <path d="M-40 81L-75 112M45 83L79 110" stroke="#536063" stroke-width="17" stroke-linecap="round"/>` : `<path d="M-34 75L-75 121M39 77L77 118" stroke="#536063" stroke-width="18" stroke-linecap="round"/>
        <path d="M-18 7L-4 11M13 10L26 6" stroke="#4e4a40" stroke-width="3"/>`}
    </g>`;
  }

  function map(state, runtime) {
    return U.map(state, runtime, [
      { id: 'bldg54', art: 'bldg54', name: '五四楼', scene: 'bldg54', x: 250, y: 210, scale: .68 },
      { id: 'power', art: 'power', name: '动力楼', scene: 'power', x: 1000, y: 205, scale: .68 },
      { id: 'bldg55', art: 'bldg55', name: '五五楼', scene: 'bldg55', x: 1010, y: 515, scale: .62 }
    ]);
  }

  function bldg54(state) {
    const phase = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    const departed = /depart|luggage|after|second|empty|note|leave|memory2/.test(phase) ||
      flag(state, ['bladeInstalled', 'bldg54Complete', 'act2Bldg54Complete', 'indicatorBladeInstalled']);
    const bladeInstalled = departed || flag(state, ['bladeInstalled', 'indicatorBladeInstalled']);
    const materialsTaken = flag(state, ['indicatorMaterialsTaken', 'materialsTaken']) ||
      (state.inventory || []).some(item => ['indicatorMaterials', 'indicatorBlade'].includes(item));
    const student = departed ? '' : studentMemory(890, 278, bladeInstalled);

    const furniture = `
      <rect x="62" y="90" width="1156" height="474" fill="#b7b7aa" stroke="#4c4438" stroke-width="7"/>
      <path d="M64 420H1216M640 92V420" stroke="#8d8f83" stroke-width="3"/>
      <g id="classroom-windows">
        <path d="M100 125H365V341H100Z" fill="#889b9d" stroke="#453f35" stroke-width="9"/>
        <path d="M188 125V341M277 125V341M100 233H365" stroke="#555b56" stroke-width="7"/>
        <path d="M112 137H353V329H112Z" fill="none" stroke="#c2c4b4" stroke-width="3" opacity=".55"/>
        <path d="M101 342L31 480H407L365 342Z" fill="#d3c9aa" opacity=".24"/>
      </g>
      <g id="blackboard">
        <rect x="739" y="112" width="405" height="172" fill="#4e5b58" stroke="#463c31" stroke-width="10"/>
        <path d="M779 237Q846 145 921 215T1096 172M797 159H915M996 244H1100" fill="none" stroke="#b6b8a5" stroke-width="4" opacity=".7"/>
        <path d="M764 294H1118" stroke="#392f27" stroke-width="7"/>
      </g>
      <g id="rear-desks" fill="#7b6a55" stroke="#4b3d30" stroke-width="5">
        <path d="M111 410H326L350 463H87Z"/><path d="M131 461L116 548M311 461L328 548"/>
        <path d="M929 392H1132L1154 446H908Z"/><path d="M944 444L930 532M1118 444L1135 532"/>
      </g>
      <g id="main-desk">
        <path d="M278 447H930L984 524H234Z" fill="#826b50" stroke="#40342a" stroke-width="8"/>
        <path d="M276 521L254 666M922 521L949 666" stroke="#4b3b2e" stroke-width="17"/>
        <path d="M254 540H949" stroke="#b09874" stroke-width="3" opacity=".5"/>
      </g>
      ${model(586, 356, bladeInstalled)}
      <g id="material-shelf">
        <path d="M1013 489H1173V609H1013Z" fill="#6f6251" stroke="#40372d" stroke-width="7"/>
        <path d="M1013 548H1173" stroke="#40372d" stroke-width="6"/>
        ${materialsTaken ? '' : `<path d="M1033 519L1090 471L1102 483L1047 534Z" fill="#b4a27b" stroke="#514432" stroke-width="4"/>
          <path d="M1090 527Q1126 474 1152 509L1112 542Z" fill="#7f9292" stroke="#455150" stroke-width="4"/>
          <circle cx="1053" cy="579" r="16" fill="none" stroke="#b4a27b" stroke-width="5"/>`}
      </g>`;

    let documents;
    let hotspots;
    let overlay = '';
    if (departed) {
      documents = `<g id="departure-memory">
        ${paper('luggage-tag', 440, 442, 155, 82, ['刘长睿'], { size: 24, fill: '#b7a17b', rotate: -7 })}
        <path d="M440 461Q408 438 398 470" fill="none" stroke="#6f5a40" stroke-width="4"/>
        ${paper('departure-note', 677, 442, 239, 82, ['最后一处，回来再调。'], { size: 18, handwritten: true, rotate: 3 })}
      </g>`;
      hotspots = U.hotspot('luggageTag', '行李标签：刘长睿', 420, 425, 183, 108, 'SHOW_DOCUMENT', { id: 'luggageTag' }) +
        U.hotspot('departureNote', '离校字条', 666, 427, 260, 108, 'TAKE', { item: 'departureNote' });
      overlay = `<path d="M64 90H1216V564H64Z" fill="#657577" opacity=".09"/>
        ${U.caption('同一张桌子 · 另一段记忆', 1014, 336, { size: 18, fill: '#554c3e' })}`;
    } else {
      documents = `
        ${paper('model-pattern-copy', 319, 444, 192, 101, ['图样抄本', ' modified  /  擦痕'], { size: 16, rotate: -4 })}
        <g transform="translate(329 473) rotate(-4)" fill="none" stroke="#667574" stroke-width="2">
          <path d="M8 45L51 2L108 48L152 9M12 14H160M45 0V55M118 0V55"/>
          <path d="M24 50L162 2M31 3L160 50" stroke="#826854" opacity=".55"/>
        </g>
        ${paper('student-record', 746, 408, 184, 106, ['转得起来，', '后面的人看不清。'], { size: 16, handwritten: true, rotate: 4 })}
        ${paper('teacher-blade-note', 957, 301, 186, 141, ['先让人看见，', '再让人听见。'], { size: 17, handwritten: true, rotate: -3 })}
        <path d="M992 423L1016 362L1062 337L1047 402Z" fill="none" stroke="#71624c" stroke-width="4"/>
        <path d="M1004 400L1039 355" stroke="#71624c" stroke-width="3"/>`;
      hotspots = U.hotspot('modelPatternCopy', '查看图样抄本', 304, 426, 219, 128, 'SHOW_DOCUMENT', { id: 'modelPatternCopy' }) +
        U.hotspot('studentRecord', '查看学生记录', 738, 396, 204, 124, 'SHOW_DOCUMENT', { id: 'studentRecord' }) +
        U.hotspot('teacherBladeNote', '查看老师画下的指示叶片', 948, 291, 204, 159, 'SHOW_DOCUMENT', { id: 'teacherBladeNote' }) +
        (materialsTaken ? '' : U.hotspot('indicatorMaterials', '收集指示叶片材料', 1008, 460, 177, 158, 'TAKE', { item: 'indicatorMaterials' })) +
        U.hotspot('missingBlade', '制作并安装指示叶片', 499, 280, 151, 160, bladeInstalled ? 'SHOW_DOCUMENT' : 'OPEN_BLADE', bladeInstalled ? { id: 'teachingModel' } : {});
      if (bladeInstalled) {
        hotspots += U.hotspot('indicatorLeafGear', '取下指示叶片纹齿轮', 654, 376, 94, 100, 'TAKE', { item: 'indicatorLeafGear' });
        overlay += `<g transform="translate(699 411)" fill="none" stroke="#806b48" stroke-width="5">
          <circle r="30"/><circle r="12"/><path d="M0-39V-27M28-28L19-19M39 0H27M28 28L19 19M0 39V27M-28 28L-19 19M-39 0H-27M-28-28L-19-19"/>
          <path d="M0 8L16-24L30-19L9 13Z" fill="#9c865c"/>
        </g>`;
      }
    }

    hotspots += back('map');
    return U.room('act2-bldg54', state, {
      midground: furniture + documents,
      interactable: hotspots,
      overlay: overlay + (departed ? '' : `<path d="M93 348L11 552H433L365 348Z" fill="#d5caaa" opacity=".12"/>`),
      character: student
    });
  }

  function power(state) {
    const adjusted = flag(state, ['transmissionAdjusted', 'transmissionFixed', 'powerComplete', 'act2PowerComplete']);
    const teacherMemory = adjusted || /teacher|after|memory|complete/.test(`${state.scene || ''} ${state.phase || ''}`.toLowerCase());
    const record = paper('experiment-record', 91, 125, 309, 225,
      ['实验记录', '① 主动轮带从动轮', '② 交叉带反转', '③ 三片依次接触', '低  —  高  —  中  —  低'],
      { size: 17, align: 'left', lineHeight: 31, fill: '#cec3a5' });
    const transmission = `<g id="transmission-model" transform="translate(653 379)">
      <path d="M-291 134H301L274 178H-275Z" fill="#625443" stroke="#372f27" stroke-width="8"/>
      <path d="M-254 130V-62M245 130V-67" stroke="#49483f" stroke-width="13"/>
      <g fill="#68797a" stroke="#363730" stroke-width="8">
        <circle cx="-166" cy="3" r="88"/><circle cx="13" cy="-31" r="65"/><circle cx="159" cy="22" r="78"/>
      </g>
      <g fill="none" stroke="#b0a58a" stroke-width="6">
        <circle cx="-166" cy="3" r="54"/><circle cx="13" cy="-31" r="38"/><circle cx="159" cy="22" r="47"/>
        <path d="M-166-85V91M-254 3H-78M13-96V34M-52-31H78M159-56V100M81 22H237"/>
      </g>
      <g id="transmission-belts" fill="none" stroke="#493c2e" stroke-width="13" stroke-linecap="round">
        <path d="M-185-84L-8-94M-143 89L33 31"/>
        ${adjusted ? '<path d="M37-90L179-52M-9 30L138 96"/>' : '<path d="M35-89L137 96M-9 30L181-53" stroke="#705146"/>'}
      </g>
      <g id="power-sound-plates" stroke="#3d4240" stroke-width="5">
        <path d="M-229-134H-179V-101H-229Z" fill="#718587"/>
        <path d="M-15-161H35V-101H-15Z" fill="#879694"/>
        <path d="M133-137H183V-101H133Z" fill="#61777a"/>
      </g>
      <g fill="#4a4135" font-family="SimSun,serif" font-size="17" text-anchor="middle">
        <text x="-204" y="-173">低</text><text x="10" y="-188">高</text><text x="158" y="-164">中</text>
      </g>
      ${adjusted ? `<g id="small-patch">
        <path d="M66 73L101 57L119 82L84 99Z" fill="#a08a63" stroke="#3e3429" stroke-width="5"/>
        <circle cx="92" cy="78" r="6" fill="#4a3d2e"/>
      </g>` : `<path d="M67 82L118 54" stroke="#9b7659" stroke-width="5" stroke-dasharray="7 6"/>`}
      <path d="M-251 133H271" stroke="#baa683" stroke-width="3"/>
    </g>`;
    const teacher = teacherMemory ? `<g id="teacher-memory" class="memory-figure" opacity=".57">
      <path d="M983 476Q988 362 1031 343Q1076 363 1092 476Z" fill="#4d5756" stroke="#393f3c" stroke-width="6"/>
      <path d="M1013 328Q1007 280 1038 269Q1071 281 1062 323L1046 343H1024Z" fill="#8a8371" stroke="#45443b" stroke-width="5"/>
      <path d="M1009 294Q1017 259 1044 263Q1068 270 1070 294" fill="#454842"/>
      <path d="M1006 374L929 429L840 440" fill="none" stroke="#4d5756" stroke-width="20" stroke-linecap="round"/>
      <path d="M829 430L858 423L870 444L839 453Z" fill="#9b8969" stroke="#4c4032" stroke-width="4"/>
      <path d="M1070 388L1127 449" stroke="#4d5756" stroke-width="18" stroke-linecap="round"/>
    </g>` : '';
    const foldedPaper = teacherMemory ? `<g id="paper-in-model-base">
      <path d="M869 523L936 507L974 528L906 545Z" fill="#d0c09d" stroke="#66533d" stroke-width="3"/>
      <path d="M869 523L922 527L936 507M922 527L906 545" fill="none" stroke="#958064" stroke-width="2"/>
    </g>` : '';
    const hotspots = U.hotspot('experimentRecord', '阅读墙上的实验记录', 78, 108, 335, 256, 'SHOW_DOCUMENT', { id: 'experimentRecord' }) +
      U.hotspot('transmission', '调整传动连接', 350, 175, 600, 370, 'OPEN_TRANSMISSION') +
      U.hotspot('notesMemory', '重现低—高—中—低', 1000, 112, 188, 140, 'PLAY_NOTES') +
      (adjusted ? U.hotspot('transmissionGear', '取下传动三轮纹齿轮', 1024, 468, 110, 110, 'TAKE', { item: 'transmissionGear' }) : '') +
      back('map');
    return U.room('act2-power', state, {
      midground: `<rect x="47" y="78" width="1186" height="488" fill="#aeb4aa" stroke="#4b4439" stroke-width="8"/>
        <path d="M48 385H1232M432 80V385M962 80V385" stroke="#878e83" stroke-width="3"/>
        <path d="M448 104H932V144H448Z" fill="#727d79" stroke="#47473e" stroke-width="5"/>
        <path d="M474 123H906" stroke="#bec0ac" stroke-width="3" stroke-dasharray="20 12"/>
        ${record}${transmission}
        <g id="note-memory-panel">
          <rect x="1010" y="122" width="168" height="116" fill="#777f73" stroke="#453e33" stroke-width="6"/>
          <path d="M1034 198V165M1084 198V145M1134 198V174" stroke="#c1b795" stroke-width="9"/>
          <circle cx="1034" cy="213" r="7" fill="#b29a6d"/><circle cx="1084" cy="213" r="7" fill="#b29a6d"/><circle cx="1134" cy="213" r="7" fill="#b29a6d"/>
          ${U.caption('低  高  中  低', 1094, 270, { size: 17 })}
        </g>
        <path d="M77 585H1203" stroke="#4b4135" stroke-width="9"/>
        ${foldedPaper}
        ${adjusted ? `<g transform="translate(1078 521)" fill="none" stroke="#7d6948" stroke-width="5">
          <circle r="35"/><circle r="15"/><circle r="7"/>
          <path d="M0-45V-34M32-32L24-24M45 0H34M32 32L24 24M0 45V34M-32 32L-24 24M-45 0H-34M-32-32L-24-24"/>
        </g>` : ''}`,
      interactable: hotspots,
      overlay: adjusted ? `<g class="sound-wave" fill="none" stroke="#b5a67e" stroke-width="4" opacity=".55">
        <path d="M466 160Q650 72 839 160M424 142Q651 27 884 142"/>
      </g>` : `<path d="M402 562Q616 584 842 557" fill="none" stroke="#6c5744" stroke-width="4" stroke-dasharray="8 12"/>
        ${U.caption('声音总在同一处停下', 637, 626, { size: 18, fill: '#54493c' })}`,
      character: teacher
    });
  }

  function fragmentFigure(kind) {
    if (kind === 'departing') {
      return `<g id="young-student-leaving" class="memory-figure" opacity=".58" transform="translate(545 280)">
        <path d="M-39 155Q-43 60-13 43H22Q49 73 51 155Z" fill="#526164" stroke="#3b4443" stroke-width="5"/>
        <path d="M-18 35Q-27-7 3-19Q34-10 29 28L15 45H-8Z" fill="#888374" stroke="#43433c" stroke-width="5"/>
        <path d="M-21 3Q-14-26 11-23Q33-16 34 5" fill="#414743"/>
        <path d="M-25 154L-49 232M31 154L61 224" stroke="#485758" stroke-width="18" stroke-linecap="round"/>
        <path d="M-33 76L-85 139M40 75L84 128" stroke="#526164" stroke-width="16" stroke-linecap="round"/>
        <path d="M65 117H127V190H65Z" fill="#725d46" stroke="#3e3329" stroke-width="6"/>
        <path d="M79 117Q79 91 96 91Q113 91 113 117" fill="none" stroke="#44382c" stroke-width="6"/>
        <path d="M-110 231H-45M45 224H112" stroke="#485758" stroke-width="12" stroke-linecap="round"/>
      </g>`;
    }
    return `<g id="returned-student" class="memory-figure" opacity=".63" transform="translate(547 278)">
      <path d="M-42 157Q-43 63-14 43H22Q49 71 48 157Z" fill="#586364" stroke="#3b4240" stroke-width="5"/>
      <path d="M-19 35Q-26-7 3-18Q34-9 29 28L15 44H-8Z" fill="#898374" stroke="#43433c" stroke-width="5"/>
      <path d="M-22 3Q-14-25 11-22Q33-15 34 6" fill="#424743"/>
      <path d="M-24 156L-38 231M29 156L38 231" stroke="#4a5757" stroke-width="17" stroke-linecap="round"/>
      <path d="M-33 77L-67 151M37 77L70 145" stroke="#586364" stroke-width="16" stroke-linecap="round"/>
      <path d="M64 135Q78 126 88 141L79 160L65 154Z" fill="#8c8371" stroke="#49453b" stroke-width="3"/>
      <path d="M-52 231H-20M23 231H57" stroke="#485353" stroke-width="11" stroke-linecap="round"/>
    </g>`;
  }

  function device(state) {
    const fixed = flag(state, ['deviceTransmissionFixed', 'corridorDeviceFixed', 'act2DeviceFixed', 'deviceFixed']);
    return `<g id="corridor-device" transform="translate(1020 397)">
      <path d="M-130 165H139L119 203H-114Z" fill="#65513e" stroke="#382e25" stroke-width="7"/>
      <path d="M-107 162V-115H108V162" fill="#707971" stroke="#3d3c33" stroke-width="8"/>
      <path d="M-85-92H84V114H-85Z" fill="#a69d84" stroke="#4d493c" stroke-width="5"/>
      <g fill="none" stroke="#5b5f55" stroke-width="8">
        <circle cx="-43" cy="-20" r="37"/><circle cx="51" cy="-20" r="37"/>
      </g>
      <g fill="none" stroke="#85734f" stroke-width="4" stroke-dasharray="6 5">
        <circle cx="-43" cy="-20" r="25"/><circle cx="51" cy="-20" r="25"/>
      </g>
      <path d="M-43-58L51 17M-43 17L51-58" fill="none" stroke="${fixed ? '#574b38' : '#835d4b'}" stroke-width="7"/>
      ${fixed ? '<circle cx="4" cy="-20" r="9" fill="#9b865d" stroke="#45392b" stroke-width="4"/>' : '<path d="M-8-35L16-5M-8-5L16-35" stroke="#68483c" stroke-width="5"/>'}
      <circle cx="4" cy="72" r="29" fill="#61523e" stroke="#382f26" stroke-width="6"/>
      <circle cx="4" cy="72" r="17" fill="none" stroke="#b09a70" stroke-width="3"/>
      <path d="M101 58H145V112M145 112L169 96" fill="none" stroke="#453b30" stroke-width="10" stroke-linecap="round"/>
      <path d="M-4 113L4 94L12 113" fill="#9a835c" stroke="#47392b" stroke-width="3"/>
    </g>`;
  }

  function bldg55(state) {
    const phase = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    const converged = flag(state, ['convergenceComplete', 'bldg55Converged', 'act2ConvergenceComplete']);
    const later = /later|second|return|fragment2|memory2/.test(phase) && !/depart/.test(phase);
    const early = /first|depart|fragment1|memory1/.test(phase);
    const showBoth = converged || /converg/.test(phase);
    const fragments = showBoth ? `${fragmentFigure('departing')}${fragmentFigure('returned')}` :
      later ? fragmentFigure('returned') : early ? fragmentFigure('departing') : '';
    const returnedPart = converged ? `<g id="returned-part" transform="translate(626 421) rotate(-17)">
      <path d="M-18-8L6-19L24-1L14 23L-12 19Z" fill="#a18a60" stroke="#45382a" stroke-width="4"/>
      <circle cx="3" cy="2" r="6" fill="#514330"/>
    </g>` : '';
    const conclusion = converged ? U.caption('他并不是没有回来。只是回来得太晚了。', 489, 594, { size: 19, fill: '#4c4134' }) : '';
    const hotspots = U.hotspot('firstFragment', '时间片段：提行李经过', 281, 202, 179, 250, 'SHOW_DOCUMENT', { id: 'timeFragmentDeparture' }) +
      U.hotspot('laterFragment', '时间片段：多年后归来', 693, 202, 176, 250, 'SHOW_DOCUMENT', { id: 'timeFragmentReturn' }) +
      U.hotspot('convergence', '对照离校字条与修补痕迹', 431, 480, 285, 93, 'OPEN_CONVERGENCE') +
      U.hotspot('corridorDevice', '修复传动并刻第二圈', 879, 264, 293, 325, 'OPEN_DEVICE') +
      back('map');
    return U.room('act2-bldg55', state, {
      midground: `<rect x="48" y="72" width="1184" height="507" fill="#b4b3a4" stroke="#4b4237" stroke-width="8"/>
        <path d="M48 480L640 296L1232 480M48 579H1232M640 296V579" fill="none" stroke="#8b8c7e" stroke-width="3"/>
        <path d="M70 90L425 244V505L70 566ZM1210 90L855 244V505L1210 566Z" fill="#a4a799" stroke="#67695e" stroke-width="4"/>
        <g id="closed-door">
          <path d="M480 115H798V524H480Z" fill="#5c5041" stroke="#3d332a" stroke-width="10"/>
          <path d="M504 139H774V506H504Z" fill="#756652" stroke="#46392d" stroke-width="5"/>
          <path d="M530 166H748V319H530ZM530 346H748V476H530Z" fill="#6a5d4d" stroke="#4b3e32" stroke-width="4"/>
          <circle cx="735" cy="340" r="9" fill="#ac9366" stroke="#483a2c" stroke-width="3"/>
          <path d="M472 524H806" stroke="#342c25" stroke-width="11"/>
        </g>
        <g id="time-fragment-frames">
          <path d="M292 176H443V454H292Z" fill="#7f8d89" opacity=".22" stroke="#6e796f" stroke-width="4" stroke-dasharray="8 7"/>
          <path d="M702 176H853V454H702Z" fill="#7f8d89" opacity=".22" stroke="#6e796f" stroke-width="4" stroke-dasharray="8 7"/>
          <path d="M318 209H417M728 209H827" stroke="#b9b096" stroke-width="3"/>
        </g>
        <g id="convergence-clues">
          <path d="M457 493L548 478L574 535L480 548Z" fill="#cebd99" stroke="#716049" stroke-width="3"/>
          <path d="M476 510L541 498M482 523L532 513" stroke="#76644d" stroke-width="2"/>
          <path d="M601 491L679 505L663 550L587 535Z" fill="#9c8c6c" stroke="#66543f" stroke-width="3"/>
          <path d="M612 511L637 498L655 521L630 535Z" fill="none" stroke="#4d5b58" stroke-width="4"/>
        </g>
        ${device(state)}
        ${returnedPart}`,
      interactable: hotspots,
      overlay: `<g id="memory-projections">${fragments}</g>
        <g>${U.caption('离校时', 367, 475, { size: 18, fill: '#d2c7a9' })}
          <rect x="700" y="128" width="155" height="42" fill="#4b4539" opacity=".9"/>
          ${U.caption('多年后', 777, 157, { size: 23, fill: '#ddd0af' })}
          ${U.caption('归来时', 777, 475, { size: 18, fill: '#d2c7a9' })}</g>
        ${conclusion}`,
      character: ''
    });
  }

  function tree(state) {
    const phase = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    const grafting = /graft|identity|return|refus|after/.test(phase) || flag(state, ['secondRingCut', 'act2RingCut', 'treeReturn']);
    const grafted = flag(state, ['act2Grafted', 'secondRingGrafted']) || (state.amber && state.amber.grafted >= 2);
    const keeperX = grafted ? 855 : grafting ? 825 : 925;
    const keeperPose = grafting ? 'reach' : 'lowered';
    const keeper = PineArt.keeper({ x: keeperX, y: 405, scale: 1.06, pose: keeperPose, className: grafting ? 'ink-shiver' : 'quiet-pulse' });
    const identityShadow = grafting ? `<g id="young-student-in-trunk" class="memory-figure" transform="translate(619 350)" opacity=".46">
      <path d="M-45 161Q-48 57-15 36H18Q48 65 47 161Z" fill="#687370" stroke="#3e4845" stroke-width="5"/>
      <path d="M-19 28Q-24-15 4-24Q32-14 28 23L14 40H-8Z" fill="#8e8876" stroke="#47473e" stroke-width="4"/>
      <path d="M-22-1Q-15-28 9-27Q30-20 33-1" fill="#434a45"/>
      <path d="M-30 70L-95 16M35 72L91 18" stroke="#687370" stroke-width="17" stroke-linecap="round"/>
      <path d="M-23 158L-38 234M27 158L42 234" stroke="#606d69" stroke-width="18"/>
    </g>` : '';
    const treeArt = PineArt.pine(state.amber || {}, {
      x: 600, y: 365, scale: 1.55, era: 'act2', broken: false,
      vivid: false,
      rings: grafted ? 2 : 1
    });
    const hotspots = grafting && !grafted ?
      U.hotspot('graft', '接合第二圈年轮', 505, 230, 208, 276, 'OPEN_GRAFT', { act: 'act2' }) + back('map') :
      back('map');
    return U.room('act2-tree', state, {
      midground: `<rect width="1280" height="560" fill="#b9bdaf"/>
        <path d="M0 463Q305 422 635 462T1280 445V720H0Z" fill="#8e9683"/>
        <path d="M0 541Q310 510 644 542T1280 521" fill="none" stroke="#6f7868" stroke-width="5"/>
        <g opacity=".42" fill="#6c7774" stroke="#4f5b58" stroke-width="5">
          <path d="M63 382V202L177 147L288 202V382Z"/><path d="M989 386V218L1091 164L1194 218V386Z"/>
        </g>
        <g fill="#b8b9a6" opacity=".52"><path d="M103 225H143V278H103ZM188 225H228V278H188ZM1034 241H1071V291H1034ZM1112 241H1149V291H1112Z"/></g>
        ${treeArt}
        <path id="deepened-crack" d="M599 173Q563 287 596 364T581 529" fill="none" stroke="#28251f" stroke-width="${grafting ? 17 : 11}" stroke-linecap="round"/>
        <g id="new-act2-branches" fill="none" stroke="#5b634f" stroke-width="12" stroke-linecap="round">
          <path d="M573 225Q462 161 387 114M642 205Q733 139 809 98"/>
        </g>
        <g fill="#737c60" opacity=".8"><path d="M378 115l-42-31l19 48l-44 4l49 20Z"/><path d="M810 99l38-34l-13 47l43 1l-46 25Z"/></g>`,
      interactable: hotspots,
      overlay: identityShadow + (grafting ? `<path d="M505 192Q611 133 710 201" fill="none" stroke="#9b865e" stroke-width="4" stroke-dasharray="7 9" opacity=".7"/>` :
        `<path d="M828 407L1053 327" stroke="#4a4a3e" stroke-width="9" stroke-linecap="round" opacity=".7"/>`),
      character: keeper
    });
  }

  scenes.act2 = function (state, runtime) {
    const key = `${state.scene || ''} ${state.phase || ''}`.toLowerCase();
    if (/bldg54|building54|five.?four|54/.test(key)) return bldg54(state);
    if (/bldg55|building55|five.?five|55/.test(key)) return bldg55(state);
    if (/power|dynamo|transmission/.test(key)) return power(state);
    if (/tree|pine|graft|identity|refusal/.test(key)) return tree(state);
    return map(state, runtime);
  };

  scenes.act2_map = map;
  scenes.act2_bldg54 = bldg54;
  scenes.act2_power = power;
  scenes.act2_bldg55 = bldg55;
  scenes.act2_tree = tree;
})(window);
