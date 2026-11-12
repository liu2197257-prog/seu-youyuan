'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../dist/state.js');

function playthrough(act1Order, act2Order) {
  let state = State.createInitialState();
  let transitions = 0;
  const accepted = (action) => {
    const result = State.transition(state, action);
    assert.ok(!result.effects.some((effect) => effect.type === 'REJECTED'),
      `${state.era}/${state.scene} rejected ${JSON.stringify(action)}: ${JSON.stringify(result.effects)}`);
    assert.notStrictEqual(result.state, state);
    state = result.state;
    transitions += 1;
    return result.effects;
  };
  const rejected = (action, reason) => {
    const before = state;
    const result = State.transition(state, action);
    assert.strictEqual(result.state, before);
    assert.ok(result.effects.some((effect) => effect.type === 'REJECTED' && (!reason || effect.reason === reason)));
  };
  const run = (actions) => actions.forEach(accepted);

  run([
    { type: 'ENTER', scene: 'prologue_pine' },
    { type: 'TAKE', item: 'lens' },
    { type: 'USE', item: 'lens', target: 'filterFrame' },
    { type: 'TOUCH', target: 'treeCrack' },
    { type: 'TAKE', item: 'amber' },
    { type: 'USE', item: 'amber', target: 'treeCrack' },
    { type: 'TAKE', item: 'waterCan' },
    { type: 'USE', item: 'waterCan', target: 'seedling' },
    { type: 'USE', item: 'supportWood', target: 'seedling' }
  ]);
  accepted({ type: 'GRAFT' });
  assert.equal(state.era, '1933');

  assert.equal(state.ringAmber.owned, true);
  assert.equal(state.inventory.length, 0);
  assert.equal(state.letter.found, true);

  const library = () => run([
    { type: 'ENTER', scene: 'act1_library' },
    { type: 'TAKE', item: 'drawingFragment1' },
    { type: 'PUZZLE', id: 'A1_LOCK', value: ['circle', 'triangle', 'square'] },
    { type: 'TAKE', item: 'drawingFragment2' },
    { type: 'PUZZLE', id: 'A2', value: { x: 160, y: 96, angle: 90 } },
    { type: 'PUZZLE', id: 'A3', value: 30 }
  ]);
  const hall = () => run([
    { type: 'ENTER', scene: 'act1_hall' },
    { type: 'TAKE', item: 'mallet' },
    { type: 'USE', item: 'mallet', target: 'stand' },
    { type: 'PUZZLE', id: 'A4', value: ['low', 'high', 'medium', 'low'] }
  ]);
  act1Order.forEach((building) => building === 'library' ? library() : hall());
  run([
    { type: 'ENTER', scene: 'act1_gym' },
    { type: 'USE', item: 'windowGear', target: 'windowSlot' },
    { type: 'USE', item: 'soundGear', target: 'soundSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' }
  ]);
  rejected({ type: 'ENTER', scene: 'act2_tree' }, 'SCENE_LOCKED');
  accepted({ type: 'TURN_HANDLE' });
  assert.deepEqual([state.ringAmber.rings, state.ringAmber.grafted], [1, 0]);
  assert.deepEqual(state.inventory, []);
  rejected({ type: 'ENTER', scene: 'act2_tree' }, 'SCENE_LOCKED');
  run([{ type: 'ENTER', scene: 'act1_tree' }, { type: 'GRAFT' }]);
  assert.deepEqual([state.era, state.ringAmber.rings, state.ringAmber.grafted], ['1959', 1, 1]);
  rejected({ type: 'ENTER', scene: 'act1_library' }, 'SCENE_LOCKED');

  const bldg54 = () => run([
    { type: 'ENTER', scene: 'act2_bldg54' },
    { type: 'TAKE', item: 'leafFrame' },
    { type: 'TAKE', item: 'leafFilm' },
    { type: 'COMBINE', items: ['leafFilm', 'leafFrame'], result: 'indicatorLeaf' },
    { type: 'USE', item: 'indicatorLeaf', target: 'modelSocket' }
  ]);
  const power = () => run([
    { type: 'ENTER', scene: 'act2_power' },
    { type: 'PUZZLE', id: 'B2', value: {
      links: ['input-middle', 'middle-output'],
      notes: ['low', 'high', 'medium', 'low']
    } }
  ]);
  act2Order.forEach((building) => building === '54' ? bldg54() : power());
  run([
    { type: 'ENTER', scene: 'act2_bldg55' },
    { type: 'PUZZLE', id: 'B3', value: { note: 'departureNote', trace: 'repairTrace' } },
    { type: 'PUZZLE', id: 'B4_REPAIR', value: 'aligned' },
    { type: 'USE', item: 'indicatorGear', target: 'indicatorSlot' },
    { type: 'USE', item: 'transmissionGear', target: 'transmissionSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' },
    { type: 'TURN_HANDLE' }
  ]);
  assert.deepEqual([state.ringAmber.rings, state.ringAmber.grafted], [2, 1]);
  assert.deepEqual(state.inventory, []);
  run([{ type: 'ENTER', scene: 'act2_tree' }, { type: 'GRAFT' }]);
  assert.equal(state.era, '1988');

  run([{ type: 'ENTER', scene: 'act3_alumni' }]);
  rejected({ type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } }, 'C1_REQUIRED');
  run([
    { type: 'ENTER', scene: 'act3_frontyard' },
    { type: 'PUZZLE', id: 'C1', value: { x: 220, y: 140, angle: 45 } },
    { type: 'ENTER', scene: 'act3_alumni' },
    { type: 'PUZZLE', id: 'C2_ROSTER', value: { year: 1959, name: '刘长睿' } },
    { type: 'PUZZLE', id: 'C2_LESSON', value: 'lessonPlan' },
    { type: 'PUZZLE', id: 'C2_PROJECT', value: { memory: 'modelTuning1959', target: 'lessonPlan' } },
    { type: 'PUZZLE', id: 'C2_LETTER', value: 'unfold' },
    { type: 'ENTER', scene: 'act3_tree' }
  ]);
  assert.equal(state.act.storySeen, true);
  assert.equal(state.letter.unfolded, true);
  run([
    { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'oldWindowShadow', slot: 'nestedWindowSlot' } },
    { type: 'USE', item: 'nestedWindowGear', target: 'nestedWindowSlot' },
    { type: 'PUZZLE', id: 'C3_MEMORY', value: { memory: 'roster1959', slot: 'signatureSlot' } },
    { type: 'USE', item: 'signatureGear', target: 'signatureSlot' },
    { type: 'USE', item: 'amber', target: 'amberSocket' },
    { type: 'TURN_HANDLE' }
  ]);
  assert.deepEqual([state.ringAmber.rings, state.ringAmber.grafted], [3, 2]);
  assert.deepEqual(state.inventory, []);
  accepted({ type: 'GRAFT' });
  assert.deepEqual([state.era, state.ringAmber.rings, state.ringAmber.grafted], ['2002', 3, 3]);
  rejected({ type: 'ENTER', scene: 'act3_frontyard' }, 'SCENE_LOCKED');

  run([{ type: 'ENTER', scene: 'act4_memorial' }, { type: 'ENTER', scene: 'act4_map' }]);
  rejected({ type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' }, undefined);
  run([
    { type: 'ENTER', scene: 'act4_frontyard' },
    { type: 'PUZZLE', id: 'D3', value: { target: 'repairPlaque', name: '沈立' } },
    { type: 'ENTER', scene: 'act4_hall' },
    { type: 'PUZZLE', id: 'D1', value: { year: 2002, name: '沈立' } },
    { type: 'ENTER', scene: 'act4_alumni' },
    { type: 'PUZZLE', id: 'D2', value: { page: 'continuation', name: '沈立' } },
    { type: 'ENTER', scene: 'act4_tree' }
  ]);
  assert.deepEqual([...state.act.evidence].sort(), ['ceremonyRecord', 'repairPlaque', 'rosterContinuation']);
  run([
    { type: 'PUZZLE', id: 'D4', value: 'repairPlaque' },
    { type: 'PUZZLE', id: 'D4', value: 'ceremonyRecord' },
    { type: 'PUZZLE', id: 'D4', value: 'rosterContinuation' }
  ]);
  assert.equal(state.phase, 'act4_ending');
  assert.deepEqual([state.ringAmber.rings, state.ringAmber.grafted], [3, 3]);
  accepted({ type: 'USE', item: 'letter', target: 'cameraBag' });
  assert.equal(state.era, 'epilogue');
  assert.equal(state.phase, 'epilogue');
  assert.equal(state.letter.location, 'cameraBag');
  assert.equal(state.letter.returned, true);
  assert.equal(state.epilogue.newSprout, true);
  assert.equal(state.epilogue.crackPreserved, true);
  assert.equal(state.epilogue.projected.length, 3);
  assert.deepEqual(state.history, ['prologue', '1933', '1959', '1988', '2002']);
  assert.deepEqual(state.inventory, []);
  assert.equal(new Set(state.ringAmber.memories.map((memory) => memory.id)).size, state.ringAmber.memories.length);
  rejected({ type: 'ENTER', scene: 'act4_tree' }, 'SCENE_LOCKED');
  assert.ok(transitions > 65);
  return state;
}

test('完整通关：四章核心建筑顺序组合、三轮刻入接合与尾声', () => {
  for (const act1Order of [['library', 'hall'], ['hall', 'library']]) {
    for (const act2Order of [['54', 'power'], ['power', '54']]) {
      const state = playthrough(act1Order, act2Order);
      assert.equal(state.ringAmber.rings, 3);
      assert.equal(state.ringAmber.grafted, 3);
    }
  }
});
