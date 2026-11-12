/* 六朝松：纯谜题判定。经典 script / CommonJS 双导出，无 DOM、网络或计时器。 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.PinePuzzles = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TOLERANCES = Object.freeze({ dragPx: 24, rotationDeg: 8 });
  var NOTES = ['low', 'high', 'medium', 'low'];
  var EVIDENCE = ['ceremonyRecord', 'rosterContinuation', 'repairPlaque'];

  var HINTS = {
    P0: [
      '看看三脚架脚边的相机包。',
      '特殊镜片的缺口与空滤镜框相合。',
      '取得 lens，把它用于 filterFrame。'
    ],
    P1: [
      '幼苗需要水，也需要支撑。',
      '水罐浇土，Y 形支撑木扶稳幼苗。',
      '先用水罐浇灌，再将支撑木用于幼苗；随后接合脚边印记。'
    ],
    A1_LOCK: [
      '抽屉旁的三格图案与借阅卡有关。',
      '按借阅卡的书名顺序读对应书脊。',
      '依次输入 circle、triangle、square。'
    ],
    A2: [
      '两片图纸的撕口能拼在一起。',
      '同时看撕口与穿过撕口的线条。',
      '把活动碎片移到 x=160、y=96，角度调到 90°；靠近后会吸附。'
    ],
    A3: [
      '描图架上的三处标记还没有重合。',
      '切换倾斜角度，观察三处标记是否同时重合。',
      '选择 30° 那一档。'
    ],
    A4: [
      '最后一排的排练记录标出了高度顺序。',
      '木槌归位后，按低、高、中、低敲响发声片；亮光也显示同一顺序。',
      '依次输入 low、high、medium、low。'
    ],
    A5: [
      '舞台边的木槌不属于地面。',
      '发声片旁的空支架与木槌形状相合。',
      '取得 mallet，把它用于 stand。'
    ],
    A6: [
      '展示台上两个槽分别对应窗格纹与声波纹。',
      '两只齿轮都入槽后，年轮珀才能嵌入中央凹槽。',
      '安装 windowGear 与 soundGear，再嵌入年轮珀并转动手柄。'
    ],
    A7: [
      '新刻的一圈与树干残留痕迹还未对应。',
      '只旋转第一圈，靠近对应位置会自然吸附。',
      '带着第一圈回 act1_tree，执行 GRAFT。'
    ],
    B1_ASSEMBLE: [
      '教室里的两种材料能组成指示叶片。',
      '叶片边框与薄片需要组合。',
      '组合 leafFrame 和 leafFilm，得到 indicatorLeaf。'
    ],
    B1: [
      '模型上仍空着一个指示位置。',
      '组合好的指示叶片与缺件位相合。',
      '把 indicatorLeaf 用于 modelSocket。'
    ],
    B2: [
      '实验记录与年轮珀保存的四音要一起看。',
      '传动需依次接通输入、中间、输出，音序仍是低、高、中、低。',
      '连接 input-middle、middle-output，并输入 low、high、medium、low。'
    ],
    B3: [
      '走廊里的两段痕迹还缺彼此。',
      '把五四楼的离校字条与动力楼的修补痕迹放在一起。',
      '两栋核心完成后，用 departureNote 对照 repairTrace。'
    ],
    B4_REPAIR: [
      '刻轮装置的一处传动仍然错位。',
      '先汇合线索，再把错位连接拨回对齐位置。',
      '完成 B3 后，将 B4_REPAIR 设为 aligned。'
    ],
    B4: [
      '传动、两只齿轮和中央凹槽需要依次处理。',
      '先修复传动，再安装指示叶片纹与传动三轮纹齿轮。',
      '安装 indicatorGear、transmissionGear，嵌入年轮珀并转动手柄。'
    ],
    B5: [
      '第二圈要带回六朝松前。',
      '旋转新刻的第二圈，让它与树干痕迹吸附。',
      '回 act2_tree 执行 GRAFT。'
    ],
    C1: [
      '墙上的旧窗影与新窗格并不一致。',
      '年轮珀保存的图样需要同时平移与旋转。',
      '把投影移到 x=220、y=140，角度调到 45°；容差内会吸附。'
    ],
    C2_ROSTER: [
      '纪念墙上找不到的名字，也许在旧名册里。',
      '先完成前工院，再查 1959 年学生名册。',
      '选择 1959 年名册中的刘长睿。'
    ],
    C2_LESSON: [
      '名册的记录指向另一份档案。',
      '沿名册索引找到周老师的教案。',
      '打开 lessonPlan。'
    ],
    C2_PROJECT: [
      '教案上的改法与一段旧记忆相合。',
      '把 1959 年调试模型的记忆投到教案上。',
      '将 modelTuning1959 投射到 lessonPlan。'
    ],
    C2_LETTER: [
      '折叠信只露出了正面。',
      '名册与教案已经显形，现在可以把信完全展开。',
      '在 C2 投射完成后执行 unfold；信只向玩家展开。'
    ],
    C3_MEMORY: [
      '树根装置先需要记忆，不是齿轮。',
      '旧窗影对应嵌套窗格槽，名册对应签名刻痕槽。',
      '把 oldWindowShadow 对入 nestedWindowSlot，把 roster1959 对入 signatureSlot，再装对应齿轮。'
    ],
    C3: [
      '两段记忆与两只齿轮都要各就各位。',
      '记忆对位后才能装齿轮，最后嵌入年轮珀。',
      '完成两个 C3_MEMORY，安装 nestedWindowGear、signatureGear，再嵌珀刻轮。'
    ],
    C4: [
      '第三圈仍要回树接合。',
      '只旋转第三圈，并与前两圈保持同轴。',
      '第三圈刻好后，在 act3_tree 执行 GRAFT。'
    ],
    D1: [
      '最后一排摆着不同年份的典礼册。',
      '让年轮珀显影到 2002 年，再翻找沈立。',
      '选择 year=2002 与 name=沈立。'
    ],
    D2: [
      '旧名册后面还有续页。',
      '沿刘长睿名字所在页往后翻，沈立就在下面几行。',
      '翻到 continuation，找到沈立。'
    ],
    D3: [
      '前工院的新修缮痕迹旁有一块小铭牌。',
      '用年轮珀照亮施工铭牌，而不是旧窗影。',
      '照亮 repairPlaque，辨认沈立。'
    ],
    D4: [
      '三件物证收齐后再回六朝松。',
      '年轮珀每次只投射一件已经收集的物证。',
      '收齐 ceremonyRecord、rosterContinuation、repairPlaque 后，在树前逐件投射三次。'
    ]
  };

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function sameArray(actual, expected) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    for (var i = 0; i < expected.length; i += 1) {
      if (actual[i] !== expected[i]) return false;
    }
    return true;
  }

  function sameMembers(actual, expected) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    var left = actual.slice().sort();
    var right = expected.slice().sort();
    return sameArray(left, right);
  }

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function angleDistance(a, b) {
    if (!finite(a) || !finite(b)) return Infinity;
    var distance = Math.abs((a - b) % 360);
    return Math.min(distance, 360 - distance);
  }

  function alignment(value, target) {
    if (!isObject(value) || !finite(value.x) || !finite(value.y)) return false;
    var distance = Math.hypot(value.x - target.x, value.y - target.y);
    return distance <= TOLERANCES.dragPx &&
      angleDistance(value.angle, target.angle) <= TOLERANCES.rotationDeg;
  }

  function check(id, value) {
    switch (id) {
      case 'P1_SUPPORT': return value === 'steady';
      case 'A1_LOCK': return sameArray(value, ['circle', 'triangle', 'square']);
      case 'A2': return alignment(value, { x: 160, y: 96, angle: 90 });
      case 'A3': return value === 30;
      case 'A4': return sameArray(value, NOTES);
      case 'A5': return value === 'stand';
      case 'B1_ASSEMBLE': return isObject(value) && sameMembers(value.items, ['leafFrame', 'leafFilm']);
      case 'B1': return value === 'modelSocket';
      case 'B2':
        return isObject(value) && sameArray(value.links, ['input-middle', 'middle-output']) &&
          sameArray(value.notes, NOTES);
      case 'B3':
        return isObject(value) && value.note === 'departureNote' && value.trace === 'repairTrace';
      case 'B4_REPAIR': return value === 'aligned';
      case 'C1': return alignment(value, { x: 220, y: 140, angle: 45 });
      case 'C2_ROSTER': return isObject(value) && value.year === 1959 && value.name === '刘长睿';
      case 'C2_LESSON': return value === 'lessonPlan';
      case 'C2_PROJECT':
        return isObject(value) && value.memory === 'modelTuning1959' && value.target === 'lessonPlan';
      case 'C2_LETTER': return value === 'unfold';
      case 'C3_MEMORY':
        return isObject(value) && (
          (value.memory === 'oldWindowShadow' && value.slot === 'nestedWindowSlot') ||
          (value.memory === 'roster1959' && value.slot === 'signatureSlot')
        );
      case 'D1': return isObject(value) && value.year === 2002 && value.name === '沈立';
      case 'D2': return isObject(value) && value.page === 'continuation' && value.name === '沈立';
      case 'D3': return isObject(value) && value.target === 'repairPlaque' && value.name === '沈立';
      case 'D4': return EVIDENCE.indexOf(value) !== -1;
      default: return false;
    }
  }

  function getHint(id, level) {
    if (!Number.isInteger(level) || level < 1 || level > 3) return null;
    if (!Object.prototype.hasOwnProperty.call(HINTS, id)) return null;
    return HINTS[id][level - 1];
  }

  return Object.freeze({
    check: check,
    getHint: getHint,
    TOLERANCES: TOLERANCES
  });
}));
