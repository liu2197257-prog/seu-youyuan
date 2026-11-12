'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const State = require('../dist/state.js');

function apply(state, action) {
  const result = State.transition(state, action);
  assert.ok(!result.effects.some((effect) => effect.type === 'REJECTED'),
    `${action.type}:${action.id || action.item || action.scene || ''} should be accepted: ${JSON.stringify(result.effects)}`);
  assert.notStrictEqual(result.state, state, 'accepted actions return a new state');
  return result.state;
}

function reject(state, action, reason) {
  const snapshot = JSON.parse(JSON.stringify(state));
  const result = State.transition(state, action);
  assert.strictEqual(result.state, state, 'rejected actions preserve object identity');
  assert.deepEqual(result.state, snapshot, 'rejected actions never mutate state');
  assert.ok(result.effects.some((effect) => effect.type === 'REJECTED'));
  if (reason) assert.ok(result.effects.some((effect) => effect.reason === reason), JSON.stringify(result.effects));
  return result;
}

function run(state, actions) {
  return actions.reduce(apply, state);
}

function toAct1() {
  return run(State.createInitialState(), [
    { type: 'ENTER', scene: 'prologue_pine' },
    { type: 'TAKE', item: 'lens' },
    { type: 'USE', item: 'lens', target: 'filterFrame' },
    { type: 'TOUCH', target: 'treeCrack' },
    { type: 'TAKE', item: 'amber' },
    { type: 'USE', item: 'amber', target: 'treeCrack' },
    { type: 'TAKE', item: 'waterCan' },
    { type: 'USE', item: 'waterCan', target: 'seedling' },
    { type: 'USE', item: 'supportWood', target: 'seedling' },
    { type: 'GRAFT' }
  ]);
}

function finishLibrary(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act1_library' },
    { type: 'TAKE', item: 'drawingFragment1' },
    { type: 'PUZZLE', id: 'A1_LOCK', value: ['circle', 'triangle', 'square'] },
    { type: 'TAKE', item: 'drawingFragment2' },
    { type: 'PUZZLE', id: 'A2', value: { x: 160, y: 96, angle: 90 } },
    { type: 'PUZZLE', id: 'A3', value: 30 }
  ]);
}

function finishHall(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act1_hall' },
    { type: 'TAKE', item: 'mallet' },
    { type: 'USE', item: 'mallet', target: 'stand' },
    { type: 'PUZZLE', id: 'A4', value: ['low', 'high', 'medium', 'low'] }
  ]);
}

function engraveAct1(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act1_gym' },
    { type: 'USE', item: 'windowGear', target: 'windowSlot' },
    { type: 'USE', item: 'soundGear', target: 'soundSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' },
    { type: 'TURN_HANDLE' }
  ]);
}

function to1959(order = ['library', 'hall']) {
  let state = toAct1();
  for (const building of order) state = building === 'library' ? finishLibrary(state) : finishHall(state);
  state = engraveAct1(state);
  return run(state, [{ type: 'ENTER', scene: 'act1_tree' }, { type: 'GRAFT' }]);
}

function finish54(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act2_bldg54' },
    { type: 'TAKE', item: 'leafFrame' },
    { type: 'TAKE', item: 'leafFilm' },
    { type: 'COMBINE', items: ['leafFrame', 'leafFilm'], result: 'indicatorLeaf' },
    { type: 'USE', item: 'indicatorLeaf', target: 'modelSocket' }
  ]);
}

function finishPower(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act2_power' },
    { type: 'PUZZLE', id: 'B2', value: {
      links: ['input-middle', 'middle-output'],
      notes: ['low', 'high', 'medium', 'low']
    } }
  ]);
}

function engraveAct2(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act2_bldg55' },
    { type: 'PUZZLE', id: 'B3', value: { note: 'departureNote', trace: 'repairTrace' } },
    { type: 'PUZZLE', id: 'B4_REPAIR', value: 'aligned' },
    { type: 'USE', item: 'indicatorGear', target: 'indicatorSlot' },
    { type: 'USE', item: 'transmissionGear', target: 'transmissionSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' },
    { type: 'TURN_HANDLE' }
  ]);
}

function to1988(order = ['54', 'power']) {
  let state = to1959();
  for (const building of order) state = building === '54' ? finish54(state) : finishPower(state);
  state = engraveAct2(state);
  return run(state, [{ type: 'ENTER', scene: 'act2_tree' }, { type: 'GRAFT' }]);
}

function finishFrontyard(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act3_frontyard' },
    { type: 'PUZZLE', id: 'C1', value: { x: 220, y: 140, angle: 45 } }
  ]);
}

function finishAlumni(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act3_alumni' },
    { type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } },
    { type: 'PUZZLE', id: 'C2_LESSON', value: 'lessonPlan' },
    { type: 'PUZZLE', id: 'C2_PROJECT', value: { memory: 'modelTuning1959', target: 'lessonPlan' } },
    { type: 'PUZZLE', id: 'C2_LETTER', value: 'unfold' }
  ]);
}

function engraveAct3(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act3_tree' },
    { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'oldWindowShadow', slot: 'nestedWindowSlot' } },
    { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'roster1959', slot: 'signatureSlot' } },
    { type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' },
    { type: 'USE', item: 'signatureGear', target: 'signatureSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' },
    { type: 'TURN_HANDLE' }
  ]);
}

function to2002() {
  let state = to1988();
  state = finishFrontyard(state);
  state = finishAlumni(state);
  state = engraveAct3(state);
  return apply(state, { type: 'GRAFT' });
}

function collectEvidence(state) {
  return run(state, [
    { type: 'ENTER', scene: 'act4_hall' },
    { type: 'PUZZLE', id: 'D1', value: { year: 2002, name: '沈立' } },
    { type: 'ENTER', scene: 'act4_alumni' },
    { type: 'PUZZLE', id: 'D2', value: { page: 'continuation', name: '沈立' } },
    { type: 'ENTER', scene: 'act4_frontyard' },
    { type: 'PUZZLE', id: 'D3', value: { target: 'repairPlaque', name: '沈立' } }
  ]);
}

test('门槛 1/2：无镜片不见守忆者，未触碰裂口不能进入记忆', () => {
  let state = State.createInitialState();
  reject(state, { type: 'USE', item: 'lens', target: 'filterFrame' });
  assert.equal(state.prologue.guardianSeen, false);
  assert.equal(state.prologue.treeBroken, false);
  state = apply(state, { type: 'ENTER', scene: 'prologue_pine' });
  reject(state, { type: 'USE', item: 'lens', target: 'filterFrame' }, 'MISSING_ITEM');
  reject(state, { type: 'TOUCH', target: 'treeCrack' }, 'TREE_NOT_BROKEN');
  state = apply(state, { type: 'TAKE', item: 'lens' });
  state = apply(state, { type: 'USE', item: 'lens', target: 'filterFrame' });
  assert.equal(state.prologue.guardianSeen, true);
  assert.equal(state.prologue.treeBroken, true);
  assert.equal(state.letter.found, true, '搜索必经相机包时同时收起折叠信，避免跨幕软锁');
  reject(state, { type: 'USE', item: 'amber', target: 'treeCrack' }, 'CRACK_NOT_TOUCHED');
  state = apply(state, { type: 'TOUCH', target: 'treeCrack' });
  reject(state, { type: 'USE', item: 'amber', target: 'treeCrack' }, 'AMBER_NOT_OWNED');
  state = apply(state, { type: 'TAKE', item: 'amber' });
  reject(state, { type: 'TAKE', item: 'amber' }, 'AMBER_ALREADY_OWNED');
  state = apply(state, { type: 'USE', item: 'amber', target: 'treeCrack' });
  assert.equal(state.scene, 'prologue_sprout');
  assert.equal(state.ringAmber.owned, true);
});

test('序章幼苗需浇灌和扶稳，极简接合后清理普通道具', () => {
  let state = toAct1();
  assert.equal(state.era, '1933');
  assert.equal(state.phase, 'act1_tree');
  assert.equal(state.ringAmber.rings, 0);
  assert.deepEqual(state.inventory, []);
  assert.equal(state.letter.location, 'player');

  state = State.createInitialState();
  state = run(state, [
    { type: 'ENTER', scene: 'prologue_pine' },
    { type: 'TAKE', item: 'lens' },
    { type: 'USE', item: 'lens', target: 'filterFrame' },
    { type: 'TOUCH', target: 'treeCrack' },
    { type: 'TAKE', item: 'amber' },
    { type: 'USE', item: 'amber', target: 'treeCrack' }
  ]);
  reject(state, { type: 'GRAFT' }, 'SPROUT_NOT_READY');
});

test('门槛 3：缺任一齿轮不能嵌珀或刻轮，已装单齿轮离房保留', () => {
  let state = finishLibrary(toAct1());
  state = run(state, [
    { type: 'ENTER', scene: 'act1_gym' },
    { type: 'USE', item: 'windowGear', target: 'windowSlot' },
    { type: 'ENTER', scene: 'act1_map' },
    { type: 'ENTER', scene: 'act1_gym' }
  ]);
  assert.equal(state.act.device.slots.windowSlot, 'windowGear');
  reject(state, { type: 'USE', item: 'amber', target: 'amberSocket' }, 'MISSING_GEARS');
  reject(state, { type: 'TURN_HANDLE' }, 'AMBER_NOT_INSERTED');
  assert.equal(state.ringAmber.rings, 0);
});

test('门槛 4：刻好未接合不能跳幕，接合才单向进入 1959', () => {
  let state = toAct1();
  state = finishHall(state);
  state = finishLibrary(state);
  state = engraveAct1(state);
  assert.equal(state.ringAmber.rings, 1);
  assert.equal(state.ringAmber.grafted, 0);
  assert.deepEqual(state.inventory, []);
  assert.equal(State.canEnter(state, 'act2_tree'), false);
  reject(state, { type: 'ENTER', scene: 'act2_tree' }, 'SCENE_LOCKED');
  state = apply(state, { type: 'ENTER', scene: 'act1_tree' });
  state = apply(state, { type: 'GRAFT' });
  assert.equal(state.era, '1959');
  assert.equal(state.ringAmber.grafted, 1);
  assert.equal(State.canEnter(state, 'act1_library'), false);
  reject(state, { type: 'ENTER', scene: 'act1_library' }, 'SCENE_LOCKED');
});

test('第一、二章核心建筑均支持两种完成顺序', () => {
  for (const order of [['library', 'hall'], ['hall', 'library']]) {
    const state = to1959(order);
    assert.equal(state.era, '1959');
    assert.equal(state.ringAmber.rings, 1);
  }
  for (const order of [['54', 'power'], ['power', '54']]) {
    const state = to1988(order);
    assert.equal(state.era, '1988');
    assert.equal(state.ringAmber.rings, 2);
  }
});

test('门槛 5：1988 可进会堂但前工院未完成时必要线索不出现', () => {
  let state = to1988();
  assert.equal(State.canEnter(state, 'act3_alumni'), true);
  state = apply(state, { type: 'ENTER', scene: 'act3_alumni' });
  reject(state, { type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } }, 'C1_REQUIRED');
  assert.equal(state.act.gears.includes('signatureGear'), false);
  state = finishFrontyard(state);
  state = apply(state, { type: 'ENTER', scene: 'act3_alumni' });
  state = apply(state, { type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } });
  assert.equal(state.act.steps.roster, true);
});

test('第三章必须先将两段记忆对入齿轮槽，再装齿轮', () => {
  let state = finishAlumni(finishFrontyard(to1988()));
  state = apply(state, { type: 'ENTER', scene: 'act3_tree' });
  assert.equal(state.act.storySeen, true);
  reject(state, { type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' }, 'MEMORY_ALIGNMENT_REQUIRED');
  reject(state, { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'roster1959', slot: 'nestedWindowSlot' } }, 'WRONG_PUZZLE_ANSWER');
  state = apply(state, { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'oldWindowShadow', slot: 'nestedWindowSlot' } });
  state = apply(state, { type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' });
  reject(state, { type: 'USE', item: 'signatureGear', target: 'signatureSlot' }, 'MEMORY_ALIGNMENT_REQUIRED');
  state = apply(state, { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'roster1959', slot: 'signatureSlot' } });
  state = apply(state, { type: 'USE', item: 'signatureGear', target: 'signatureSlot' });
  state = apply(state, { type: 'USE', item: 'amber', target: 'amberSocket' });
  state = apply(state, { type: 'TURN_HANDLE' });
  assert.equal(state.ringAmber.rings, 3);
  assert.equal(state.ringAmber.grafted, 2);
});

test('门槛 6：三物证未集齐不能逐件投射，集齐后每件仅投一次', () => {
  let state = to2002();
  reject(state, { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' }, 'EVIDENCE_INCOMPLETE');
  state = run(state, [
    { type: 'ENTER', scene: 'act4_hall' },
    { type: 'PUZZLE', id: 'D1', value: { year: 2002, name: '沈立' } },
    { type: 'ENTER', scene: 'act4_alumni' },
    { type: 'PUZZLE', id: 'D2', value: { page: 'continuation', name: '沈立' } },
    { type: 'ENTER', scene: 'act4_tree' }
  ]);
  reject(state, { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' }, 'EVIDENCE_INCOMPLETE');
  state = run(state, [
    { type: 'ENTER', scene: 'act4_frontyard' },
    { type: 'PUZZLE', id: 'D3', value: { target: 'repairPlaque', name: '沈立' } }
  ]);
  state = apply(state, { type: 'ENTER', scene: 'act4_tree' });
  state = apply(state, { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' });
  reject(state, { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' }, 'ALREADY_PROJECTED');
  state = apply(state, { type: 'PUZZLE', id: 'D4', value: 'rosterContinuation' });
  state = apply(state, { type: 'PUZZLE', id: 'D4', value: 'repairPlaque' });
  assert.equal(state.phase, 'act4_ending');
  assert.equal(state.ringAmber.rings, 3);
  state = apply(state, { type: 'USE', item: 'letter', target: 'cameraBag' });
  assert.equal(state.era, 'epilogue');
  assert.equal(state.epilogue.crackPreserved, true);
  assert.equal(state.epilogue.newSprout, true);
  assert.equal(state.letter.returned, true);
});

test('门槛 7：纪念馆仅 2002 可自由进出，所有谜题与拾取均拒绝', () => {
  let state = to1988();
  assert.equal(State.canEnter(state, 'act4_memorial'), false);
  state = to2002();
  state = apply(state, { type: 'ENTER', scene: 'act4_memorial' });
  for (const action of [
    { type: 'PUZZLE', id: 'D1', value: { year: 2002, name: '沈立' } },
    { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' },
    { type: 'TAKE', item: 'ceremonyRecord' },
    { type: 'USE', item: 'amber', target: 'memorialExhibit' }
  ]) reject(state, action, 'MEMORIAL_REAL_LAYER_ONLY');
  assert.deepEqual(state.act.evidence, []);
  assert.equal(State.canEnter(state, 'act4_memorial'), true);
});

test('未知动作、错误答案和错误目标均保持状态完全不变', () => {
  const state = toAct1();
  for (const action of [
    null,
    { type: 'UNKNOWN' },
    { type: 'PUZZLE', id: 'UNKNOWN', value: true },
    { type: 'TAKE', item: 'unknown' },
    { type: 'USE', item: 'amber', target: 'unknown' },
    { type: 'PUZZLE', id: 'A1_LOCK', value: ['wrong'] }
  ]) reject(state, action);
  assert.equal(State.getHint(state, 'UNKNOWN', 1), null);
  assert.equal(State.getHint(state, 'A1_LOCK', 9), null);
});

test('三级提示由调用者主动读取，读取不改变状态', () => {
  const state = toAct1();
  const snapshot = JSON.stringify(state);
  for (let level = 1; level <= 3; level += 1) {
    assert.equal(typeof State.getHint(state, 'A1_LOCK', level), 'string');
  }
  assert.equal(JSON.stringify(state), snapshot);
});

test('state.js 与 puzzles.js 可按 file:// 经典脚本顺序加载', () => {
  const context = vm.createContext({ console });
  for (const name of ['puzzles.js', 'state.js']) {
    const filename = path.join(__dirname, '../dist', name);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  assert.equal(typeof context.PineState.createInitialState, 'function');
  assert.equal(context.PineState.createInitialState().era, 'prologue');
  assert.equal(context.PineState.canEnter(context.PineState.createInitialState(), 'prologue_pine'), true);
});

test('集成 action 别名与 specialLens 输入可直接使用', () => {
  let state = State.createInitialState();
  state = apply(state, { type: 'ENTER_SCENE', scene: 'prologue_pine' });
  state = apply(state, { type: 'TAKE', item: 'specialLens' });
  state = apply(state, { type: 'USE_ON_TARGET', item: 'specialLens', target: 'filterFrame' });
  assert.equal(state.prologue.guardianSeen, true);
  assert.ok(!state.inventory.includes('lens'), '装到相机上的镜片不应再占用物品栏');

  state = finishHall(finishLibrary(toAct1()));
  state = apply(state, { type: 'ENTER_SCENE', scene: 'act1_gym' });
  state = apply(state, { type: 'INSTALL_GEAR', item: 'windowGear', slot: 'windowSlot' });
  state = apply(state, { type: 'INSTALL_GEAR', item: 'soundGear', target: 'soundSlot' });
  state = apply(state, { type: 'USE_ON_TARGET', item: 'amber', target: 'amberSocket' });
  state = apply(state, { type: 'ENGRAVE' });
  assert.equal(state.ringAmber.rings, 1);

  state = collectEvidence(to2002());
  state = apply(state, { type: 'ENTER_SCENE', scene: 'act4_tree' });
  assert.equal(state.phase, 'act4_project');
  state = apply(state, { type: 'PROJECT_EVIDENCE', evidence: 'ceremonyRecord' });
  state = apply(state, { type: 'PROJECT_EVIDENCE', evidenceId: 'rosterContinuation' });
  state = apply(state, { type: 'PROJECT_EVIDENCE', item: 'repairPlaque' });
  state = apply(state, { type: 'RETURN_LETTER' });
  assert.equal(state.era, 'epilogue');
});
