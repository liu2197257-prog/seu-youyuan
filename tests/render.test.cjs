/* Loads every classic script in the same order as index.html and renders all scenes.
 * This catches parse/runtime errors that a per-file syntax check cannot see. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DIST = path.resolve(__dirname, '..', 'dist');
const ORDER = [
  'content.js', 'puzzles.js', 'state.js', 'art.js',
  'scenes/prologue.js', 'scenes/act1.js', 'scenes/act2.js',
  'scenes/act3.js', 'scenes/act4.js', 'scenes/epilogue.js'
];

function loadRuntime() {
  const context = vm.createContext({
    console, setTimeout, clearTimeout, performance,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } }
  });
  context.window = context;
  context.globalThis = context;
  for (const file of ORDER) {
    const code = fs.readFileSync(path.join(DIST, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }
  return context;
}

const S = loadRuntime();

test('全部经典脚本按序加载且暴露全局', () => {
  for (const name of ['PineContent', 'PinePuzzles', 'PineState', 'PineArt', 'PineScenes', 'PineSceneUtil']) {
    assert.ok(S[name], `missing global ${name}`);
  }
});

test('场景渲染器覆盖全部 25 个场景', () => {
  const scenes = ['prologue_campus', 'prologue_pine', 'prologue_sprout',
    'act1_map', 'act1_tree', 'act1_library', 'act1_hall', 'act1_gym',
    'act2_map', 'act2_tree', 'act2_bldg54', 'act2_power', 'act2_bldg55',
    'act3_map', 'act3_tree', 'act3_frontyard', 'act3_alumni',
    'act4_map', 'act4_tree', 'act4_hall', 'act4_alumni', 'act4_frontyard', 'act4_memorial', 'act4_ending',
    'epilogue'];
  assert.equal(scenes.length, 25);
  for (const scene of scenes) assert.equal(typeof S.PineScenes[scene], 'function', `no renderer for ${scene}`);
});

test('每个场景都能渲染出合法 SVG 且包含五层结构', () => {
  const eraOf = scene => scene === 'epilogue' ? 'epilogue'
    : scene.startsWith('act4') ? '2002'
      : scene.startsWith('act3') ? '1988'
        : scene.startsWith('act2') ? '1959'
          : scene.startsWith('act1') ? '1933' : 'prologue';
  const state = S.PineState.createInitialState();
  state.era = '2002';
  state.act = { id: 'act4', gears: [], completed: {}, steps: {}, evidence: [], projected: [],
    device: { slots: {}, memories: {}, repaired: true, amberInserted: false },
    engraved: false, grafted: false, storySeen: false, ending: true };
  state.ringAmber = { owned: true, rings: 3, grafted: 3, memories: [] };
  const scenes = Object.keys(S.PineScenes).filter(k => /^(prologue_|act[1-4]_map|act[1-4]_tree|act[1-4]_library|act[1-4]_hall|act[1-4]_gym|act[1-4]_bldg|act[1-4]_power|act[1-4]_frontyard|act[1-4]_alumni|act[1-4]_museum|act[1-4]_memorial|act[1-4]_ending|epilogue)/.test(k));
  assert.ok(scenes.length >= 25, `expected >=25 scenes, got ${scenes.length}`);
  for (const scene of scenes) {
    const base = JSON.parse(JSON.stringify(state));
    base.era = eraOf(scene);
    base.scene = scene;
    base.phase = scene;
    if (base.era === 'prologue') base.prologue = Object.assign({}, base.prologue, { enteredMemory: scene === 'prologue_sprout', treeBroken: scene === 'prologue_pine' });
    const view = S.PineSceneUtil.adapt(base, { player: { x: 640, y: 620 }, selectedItem: null, prologueMode: 'pine', letterCamera: false });
    const svg = S.PineScenes[scene](view, { player: { x: 640, y: 620 } });
    assert.match(svg, /^<svg[^>]+viewBox="0 0 1280 720"/, `${scene} is not a full scene svg`);
    assert.ok(svg.length > 2000, `${scene} content too small (${svg.length})`);
    for (const layer of ['background', 'midground', 'interactable', 'overlay', 'character']) {
      assert.ok(svg.includes(`data-layer="${layer}"`), `${scene} missing layer ${layer}`);
    }
    assert.ok(!/undefined|NaN/.test(svg), `${scene} contains undefined/NaN`);
  }
});

test('渲染适配层把状态翻译成场景所需 flags 与别名', () => {
  const state = S.PineState.createInitialState();
  state.era = '1933';
  state.act = { id: 'act1', gears: ['windowGear'], completed: { library: true }, steps: { drawerOpen: true },
    evidence: [], projected: [], device: { slots: { windowSlot: 'windowGear' }, memories: {}, repaired: false, amberInserted: true },
    engraved: true, grafted: false, storySeen: false, ending: false };
  state.prologue = Object.assign({}, state.prologue, { treeBroken: true, lensInstalled: true });
  state.inventory = ['drawingPattern', 'lens'];
  const view = S.PineSceneUtil.adapt(state, {});
  assert.equal(view.chapter, 'act1');
  assert.equal(view.flags.libraryComplete, true);
  assert.equal(view.flags.drawerOpen, true);
  assert.equal(view.flags.windowSlotFilled, true);
  assert.equal(view.flags.amberInstalled, true);
  assert.equal(view.flags.ringCarved, true);
  assert.ok(view.inventory.includes('completePattern'), 'aliases should expose completePattern');
  assert.ok(view.inventory.includes('specialLens'), 'aliases should expose specialLens');
});
