/* 六朝松：全篇纯状态机。经典 script / CommonJS 双导出，无 DOM、网络、存档或计时器。 */
(function (root, factory) {
  'use strict';
  var puzzles = root && root.PinePuzzles;
  if (!puzzles && typeof module === 'object' && module && module.exports && typeof module['require'] === 'function') {
    puzzles = module['require']('./puzzles.js');
  }
  var api = factory(puzzles || null);
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.PineState = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Puzzles) {
  'use strict';

  var SCENES = {
    prologue: ['prologue_campus', 'prologue_pine', 'prologue_sprout'],
    '1933': ['act1_map', 'act1_tree', 'act1_library', 'act1_hall', 'act1_gym'],
    '1959': ['act2_map', 'act2_tree', 'act2_bldg54', 'act2_power', 'act2_bldg55'],
    '1988': ['act3_map', 'act3_tree', 'act3_frontyard', 'act3_alumni'],
    '2002': ['act4_map', 'act4_tree', 'act4_hall', 'act4_alumni', 'act4_frontyard', 'act4_memorial', 'act4_ending'],
    epilogue: ['epilogue']
  };

  var ACTS = {
    '1933': {
      id: 'act1', ring: 1, tree: 'act1_tree', deviceScene: 'act1_gym',
      nextEra: '1959', nextScene: 'act2_tree', nextAct: 'act2',
      engravePuzzle: 'A6', graftPuzzle: 'A7',
      gearSlots: { windowGear: 'windowSlot', soundGear: 'soundSlot' }
    },
    '1959': {
      id: 'act2', ring: 2, tree: 'act2_tree', deviceScene: 'act2_bldg55',
      nextEra: '1988', nextScene: 'act3_tree', nextAct: 'act3',
      engravePuzzle: 'B4', graftPuzzle: 'B5',
      gearSlots: { indicatorGear: 'indicatorSlot', transmissionGear: 'transmissionSlot' }
    },
    '1988': {
      id: 'act3', ring: 3, tree: 'act3_tree', deviceScene: 'act3_tree',
      nextEra: '2002', nextScene: 'act4_tree', nextAct: 'act4',
      engravePuzzle: 'C3', graftPuzzle: 'C4',
      gearSlots: { nestedWindowGear: 'nestedWindowSlot', signatureGear: 'signatureSlot' }
    }
  };

  var MEMORY_FOR_SLOT = {
    nestedWindowSlot: 'oldWindowShadow',
    signatureSlot: 'roster1959'
  };

  var EVIDENCE = ['ceremonyRecord', 'rosterContinuation', 'repairPlaque'];

  function createAct(id) {
    return {
      id: id,
      gears: [],
      completed: {},
      steps: {},
      evidence: [],
      projected: [],
      device: {
        slots: {},
        memories: {},
        repaired: false,
        amberInserted: false
      },
      engraved: false,
      grafted: false,
      storySeen: false,
      ending: false
    };
  }

  function createInitialState() {
    return {
      version: 1,
      era: 'prologue',
      phase: 'prologue_camera',
      scene: 'prologue_campus',
      inventory: [],
      ringAmber: {
        owned: false,
        rings: 0,
        grafted: 0,
        memories: []
      },
      prologue: {
        cameraBagOpened: false,
        lensInstalled: false,
        guardianSeen: false,
        treeBroken: false,
        crackTouched: false,
        amberTaken: false,
        enteredMemory: false,
        watered: false,
        supported: false,
        grafted: false
      },
      letter: {
        found: false,
        unfolded: false,
        returned: false,
        location: 'cameraBag'
      },
      act: null,
      history: [],
      solved: [],
      epilogue: null
    };
  }

  function clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function rejected(state, action, reason) {
    return {
      state: state,
      effects: [{
        type: 'REJECTED',
        action: action && typeof action.type === 'string' ? action.type : null,
        reason: reason
      }]
    };
  }

  function accepted(state, effects, change) {
    var next = clone(state);
    change(next);
    return { state: next, effects: effects || [] };
  }

  function hasItem(state, item) {
    return state.inventory.indexOf(item) !== -1;
  }

  function addItem(state, item) {
    if (!hasItem(state, item)) state.inventory.push(item);
  }

  function removeItem(state, item) {
    var index = state.inventory.indexOf(item);
    if (index !== -1) state.inventory.splice(index, 1);
  }

  function addGear(state, gear) {
    if (state.act.gears.indexOf(gear) === -1) state.act.gears.push(gear);
    addItem(state, gear);
  }

  function addMemory(state, id, scene, kind, extra) {
    for (var i = 0; i < state.ringAmber.memories.length; i += 1) {
      if (state.ringAmber.memories[i].id === id) return;
    }
    var memory = { id: id, scene: scene, kind: kind };
    if (extra) {
      Object.keys(extra).forEach(function (key) { memory[key] = extra[key]; });
    }
    state.ringAmber.memories.push(memory);
  }

  function hasMemory(state, id) {
    return state.ringAmber.memories.some(function (memory) { return memory.id === id; });
  }

  function markSolved(state, id) {
    if (state.solved && state.solved.indexOf(id) !== -1) return;
    if (!state.solved) state.solved = [];
    state.solved.push(id);
  }

  function normalizeAction(action) {
    if (!action || typeof action.type !== 'string') return action;
    var copy;
    switch (action.type) {
      case 'ENTER_SCENE':
        copy = Object.assign({}, action, { type: 'ENTER' });
        break;
      case 'USE_ON_TARGET':
        copy = Object.assign({}, action, { type: 'USE' });
        break;
      case 'INSTALL_GEAR':
        copy = Object.assign({}, action, { type: 'USE', target: action.target || action.slot });
        break;
      case 'ENGRAVE':
        copy = Object.assign({}, action, { type: 'TURN_HANDLE' });
        break;
      case 'PROJECT_EVIDENCE':
        copy = Object.assign({}, action, {
          type: 'PUZZLE',
          id: 'D4',
          value: action.value || action.evidence || action.evidenceId || action.item
        });
        break;
      case 'RETURN_LETTER':
        copy = Object.assign({}, action, { type: 'USE', item: 'letter', target: 'cameraBag' });
        break;
      default:
        return action;
    }
    return copy;
  }

  function canEnter(state, sceneId) {
    if (!state || typeof state !== 'object' || typeof sceneId !== 'string') return false;
    if (!SCENES[state.era] || SCENES[state.era].indexOf(sceneId) === -1) return false;
    if (state.era === 'prologue') {
      if (sceneId === 'prologue_sprout') return Boolean(state.prologue && state.prologue.enteredMemory);
      return !state.prologue || !state.prologue.enteredMemory;
    }
    if (state.era === '2002' && sceneId === 'act4_ending') {
      return Boolean(state.act && state.act.ending);
    }
    return true;
  }

  function phaseForScene(state, sceneId) {
    if (sceneId === 'prologue_campus') return 'prologue_camera';
    if (sceneId === 'prologue_pine') return 'prologue_pine';
    if (sceneId === 'prologue_sprout') {
      return state.prologue.watered && state.prologue.supported ? 'prologue_graft' : 'prologue_sprout';
    }
    if (state.era === '1933') {
      if (sceneId === 'act1_tree') return state.ringAmber.rings === 1 ? 'act1_graft' : 'act1_tree';
      if (sceneId === 'act1_map') return 'act1_tree';
      return sceneId;
    }
    if (state.era === '1959') {
      if (sceneId === 'act2_tree') return state.ringAmber.rings === 2 ? 'act2_graft' : 'act2_tree';
      if (sceneId === 'act2_map') return 'act2_tree';
      return sceneId;
    }
    if (state.era === '1988') {
      if (sceneId === 'act3_tree') return state.ringAmber.rings === 3 ? 'act3_graft' : 'act3_tree';
      if (sceneId === 'act3_map') return 'act3_tree';
      return sceneId;
    }
    if (state.era === '2002') {
      if (sceneId === 'act4_tree') {
        return state.act && EVIDENCE.every(function (item) {
          return state.act.evidence.indexOf(item) !== -1;
        }) ? 'act4_project' : 'act4_tree';
      }
      if (sceneId === 'act4_ending') return 'act4_ending';
      return 'act4_evidence';
    }
    return 'epilogue';
  }

  function enterScene(state, action) {
    if (!canEnter(state, action.scene)) return rejected(state, action, 'SCENE_LOCKED');
    if (state.scene === action.scene) return rejected(state, action, 'ALREADY_IN_SCENE');
    var effects = [{ type: 'SCENE_ENTERED', scene: action.scene }];
    return accepted(state, effects, function (next) {
      next.scene = action.scene;
      next.phase = phaseForScene(next, action.scene);
      if (action.scene === 'act3_tree' && next.act &&
          next.act.completed.frontyard && next.act.completed.alumni && !next.act.storySeen) {
        next.act.storySeen = true;
        effects.push({ type: 'SELF_STORY' }, { type: 'GUARDIAN_REQUEST' });
      }
    });
  }

  function takeItem(state, action) {
    var item = action.item === 'specialLens' ? 'lens' : action.item;
    if (state.era === 'prologue' && state.scene === 'prologue_pine') {
      if (item === 'lens') {
        if (hasItem(state, 'lens') || state.prologue.lensInstalled) return rejected(state, action, 'ALREADY_TAKEN');
        return accepted(state, [{ type: 'ITEM_TAKEN', item: 'lens' }, { type: 'LETTER_FOUND' }], function (next) {
          next.prologue.cameraBagOpened = true;
          addItem(next, 'lens');
          if (!next.letter.found) {
            next.letter.found = true;
            next.letter.location = 'player';
          }
        });
      }
      if (item === 'letter') {
        if (state.letter.found) return rejected(state, action, 'ALREADY_TAKEN');
        return accepted(state, [{ type: 'LETTER_FOUND' }], function (next) {
          next.prologue.cameraBagOpened = true;
          next.letter.found = true;
          next.letter.location = 'player';
        });
      }
      if (item === 'amber' || item === 'resin') {
        if (state.ringAmber.owned) return rejected(state, action, 'AMBER_ALREADY_OWNED');
        if (!state.prologue.treeBroken) return rejected(state, action, 'TREE_NOT_BROKEN');
        if (!state.prologue.crackTouched) return rejected(state, action, 'CRACK_NOT_TOUCHED');
        return accepted(state, [{ type: 'AMBER_ACQUIRED' }], function (next) {
          next.ringAmber.owned = true;
          next.prologue.amberTaken = true;
        });
      }
    }
    if (state.era === 'prologue' && state.scene === 'prologue_sprout' && item === 'waterCan') {
      if (hasItem(state, 'waterCan') || state.prologue.watered) return rejected(state, action, 'ALREADY_TAKEN');
      return accepted(state, [{ type: 'ITEM_TAKEN', item: 'waterCan' }], function (next) {
        addItem(next, 'waterCan');
      });
    }
    if (state.era === '1933' && state.scene === 'act1_library') {
      if (item === 'drawingFragment1') {
        if (state.act.steps.fragment1) return rejected(state, action, 'ALREADY_TAKEN');
        return accepted(state, [{ type: 'ITEM_TAKEN', item: item }], function (next) {
          next.act.steps.fragment1 = true;
          addItem(next, item);
        });
      }
      if (item === 'drawingFragment2') {
        if (!state.act.steps.drawerOpen) return rejected(state, action, 'DRAWER_LOCKED');
        if (hasItem(state, item) || state.act.steps.joined) return rejected(state, action, 'ALREADY_TAKEN');
        return accepted(state, [{ type: 'ITEM_TAKEN', item: item }], function (next) {
          addItem(next, item);
        });
      }
    }
    if (state.era === '1933' && state.scene === 'act1_hall' && item === 'mallet') {
      if (hasItem(state, item) || state.act.steps.malletInstalled) return rejected(state, action, 'ALREADY_TAKEN');
      return accepted(state, [{ type: 'ITEM_TAKEN', item: item }], function (next) { addItem(next, item); });
    }
    if (state.era === '1959' && state.scene === 'act2_bldg54' && (item === 'leafFrame' || item === 'leafFilm')) {
      if (hasItem(state, item) || state.act.steps.leafAssembled || state.act.completed.bldg54) {
        return rejected(state, action, 'ALREADY_TAKEN');
      }
      return accepted(state, [{ type: 'ITEM_TAKEN', item: item }], function (next) { addItem(next, item); });
    }
    return rejected(state, action, 'ITEM_NOT_HERE');
  }

  function touch(state, action) {
    if (state.era !== 'prologue' || state.scene !== 'prologue_pine' || action.target !== 'treeCrack') {
      return rejected(state, action, 'TARGET_NOT_HERE');
    }
    if (!state.prologue.treeBroken) return rejected(state, action, 'TREE_NOT_BROKEN');
    if (state.prologue.crackTouched) return rejected(state, action, 'ALREADY_TOUCHED');
    return accepted(state, [{ type: 'CRACK_TOUCHED' }], function (next) {
      next.prologue.crackTouched = true;
    });
  }

  function updateSproutPhase(next) {
    if (next.prologue.watered && next.prologue.supported) next.phase = 'prologue_graft';
  }

  function installGear(state, action, item) {
    var config = ACTS[state.era];
    if (!config || !config.gearSlots[item]) return rejected(state, action, 'NOT_A_GEAR');
    if (state.scene !== config.deviceScene) return rejected(state, action, 'WRONG_SCENE');
    var slot = config.gearSlots[item];
    if (action.target !== slot) return rejected(state, action, 'WRONG_SLOT');
    if (!hasItem(state, item)) return rejected(state, action, 'MISSING_ITEM');
    if (state.act.device.slots[slot]) return rejected(state, action, 'SLOT_OCCUPIED');
    if (state.era === '1959') {
      if (!state.act.steps.b3) return rejected(state, action, 'B3_REQUIRED');
      if (!state.act.device.repaired) return rejected(state, action, 'TRANSMISSION_NOT_REPAIRED');
    }
    if (state.era === '1988' && state.act.device.memories[slot] !== MEMORY_FOR_SLOT[slot]) {
      return rejected(state, action, 'MEMORY_ALIGNMENT_REQUIRED');
    }
    return accepted(state, [{ type: 'GEAR_INSTALLED', item: item, slot: slot }], function (next) {
      next.act.device.slots[slot] = item;
      removeItem(next, item);
    });
  }

  function insertAmber(state, action) {
    var config = ACTS[state.era];
    if (!config) return rejected(state, action, 'WRONG_SCENE');
    if (!state.ringAmber.owned) return rejected(state, action, 'AMBER_NOT_OWNED');
    if (state.scene !== config.deviceScene) return rejected(state, action, 'WRONG_SCENE');
    if (state.act.device.amberInserted) return rejected(state, action, 'AMBER_ALREADY_INSERTED');
    var slotIds = Object.keys(config.gearSlots).map(function (gear) { return config.gearSlots[gear]; });
    var ready = slotIds.every(function (slot) { return Boolean(state.act.device.slots[slot]); });
    if (!ready) return rejected(state, action, 'MISSING_GEARS');
    if (state.era === '1959' && (!state.act.steps.b3 || !state.act.device.repaired)) {
      return rejected(state, action, 'DEVICE_NOT_READY');
    }
    if (state.era === '1988') {
      if (!state.act.storySeen) return rejected(state, action, 'STORY_REQUIRED');
      var memoriesReady = Object.keys(MEMORY_FOR_SLOT).every(function (slot) {
        return state.act.device.memories[slot] === MEMORY_FOR_SLOT[slot];
      });
      if (!memoriesReady) return rejected(state, action, 'MEMORY_ALIGNMENT_REQUIRED');
    }
    return accepted(state, [{ type: 'AMBER_INSERTED' }], function (next) {
      next.act.device.amberInserted = true;
    });
  }

  function useItem(state, action) {
    var item = action.item === 'specialLens' ? 'lens' : action.item;
    if (item === 'lens') {
      if (state.era !== 'prologue' || state.scene !== 'prologue_pine') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'lens')) return rejected(state, action, 'MISSING_ITEM');
      if (action.target !== 'filterFrame') return rejected(state, action, 'WRONG_TARGET');
      if (state.prologue.lensInstalled) return rejected(state, action, 'ALREADY_USED');
      return accepted(state, [
        { type: 'LENS_INSTALLED' },
        { type: 'GUARDIAN_VISIBLE' },
        { type: 'GUARDIAN_TURNS' },
        { type: 'GUARDIAN_REACHES' },
        { type: 'TREE_BREAKS_BEFORE_TOUCH' },
        { type: 'GUARDIAN_RECOILS' },
        { type: 'CRACK_VISIBLE' }
      ], function (next) {
        next.prologue.lensInstalled = true;
        next.prologue.guardianSeen = true;
        next.prologue.treeBroken = true;
      });
    }
    if (item === 'amber') {
      if (action.target === 'treeCrack') {
        if (state.era !== 'prologue' || state.scene !== 'prologue_pine') return rejected(state, action, 'WRONG_SCENE');
        if (!state.prologue.treeBroken) return rejected(state, action, 'TREE_NOT_BROKEN');
        if (!state.prologue.crackTouched) return rejected(state, action, 'CRACK_NOT_TOUCHED');
        if (!state.ringAmber.owned) return rejected(state, action, 'AMBER_NOT_OWNED');
        if (state.prologue.enteredMemory) return rejected(state, action, 'ALREADY_USED');
        return accepted(state, [{ type: 'MEMORY_ENTERED', scene: 'prologue_sprout' }], function (next) {
          next.prologue.enteredMemory = true;
          next.scene = 'prologue_sprout';
          next.phase = 'prologue_sprout';
        });
      }
      if (action.target === 'amberSocket' || action.target === 'device') return insertAmber(state, action);
      return rejected(state, action, 'WRONG_TARGET');
    }
    if (item === 'waterCan') {
      if (state.era !== 'prologue' || state.scene !== 'prologue_sprout') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'waterCan')) return rejected(state, action, 'MISSING_ITEM');
      if (action.target !== 'seedling') return rejected(state, action, 'WRONG_TARGET');
      if (state.prologue.watered) return rejected(state, action, 'ALREADY_USED');
      return accepted(state, [{ type: 'SPROUT_WATERED' }], function (next) {
        next.prologue.watered = true;
        updateSproutPhase(next);
      });
    }
    if (item === 'supportWood') {
      if (state.era !== 'prologue' || state.scene !== 'prologue_sprout') return rejected(state, action, 'WRONG_SCENE');
      if (action.target !== 'seedling') return rejected(state, action, 'WRONG_TARGET');
      if (state.prologue.supported) return rejected(state, action, 'ALREADY_USED');
      return accepted(state, [{ type: 'SPROUT_SUPPORTED' }, { type: 'VOICEOVER', id: 'standFirm' }], function (next) {
        next.prologue.supported = true;
        updateSproutPhase(next);
      });
    }
    if (item === 'mallet') {
      if (state.era !== '1933' || state.scene !== 'act1_hall') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'mallet')) return rejected(state, action, 'MISSING_ITEM');
      if (action.target !== 'stand') return rejected(state, action, 'WRONG_TARGET');
      if (state.act.steps.malletInstalled) return rejected(state, action, 'ALREADY_USED');
      return accepted(state, [{ type: 'MALLET_INSTALLED' }], function (next) {
        next.act.steps.malletInstalled = true;
        removeItem(next, 'mallet');
        markSolved(next, 'A5');
      });
    }
    if (item === 'indicatorLeaf') {
      if (state.era !== '1959' || state.scene !== 'act2_bldg54') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'indicatorLeaf')) return rejected(state, action, 'MISSING_ITEM');
      if (action.target !== 'modelSocket') return rejected(state, action, 'WRONG_TARGET');
      if (state.act.completed.bldg54) return rejected(state, action, 'ALREADY_COMPLETED');
      return accepted(state, [{ type: 'MODEL_REPAIRED' }, { type: 'GEAR_ACQUIRED', item: 'indicatorGear' }], function (next) {
        removeItem(next, 'indicatorLeaf');
        addItem(next, 'departureNote');
        addGear(next, 'indicatorGear');
        next.act.completed.bldg54 = true;
        addMemory(next, 'modelTuning1959', 'act2_bldg54', 'memory');
        markSolved(next, 'B1');
      });
    }
    if (item === 'letter') {
      if (state.era !== '2002' || state.scene !== 'act4_ending' || !state.act || !state.act.ending) {
        return rejected(state, action, 'ENDING_NOT_READY');
      }
      if (action.target !== 'cameraBag') return rejected(state, action, 'WRONG_TARGET');
      if (!state.letter.found || state.letter.location !== 'player') return rejected(state, action, 'MISSING_ITEM');
      if (state.letter.returned) return rejected(state, action, 'ALREADY_USED');
      return accepted(state, [
        { type: 'LETTER_RETURNED' },
        { type: 'ERA_CHANGED', era: 'epilogue' },
        { type: 'EPILOGUE' }
      ], function (next) {
        var projected = next.act.projected.slice();
        var evidence = next.act.evidence.slice();
        next.letter.returned = true;
        next.letter.location = 'cameraBag';
        next.history.push('2002');
        next.epilogue = {
          newSprout: true,
          crackPreserved: true,
          projected: projected,
          evidence: evidence
        };
        next.era = 'epilogue';
        next.phase = 'epilogue';
        next.scene = 'epilogue';
        next.act = null;
        next.inventory = [];
      });
    }
    if (ACTS[state.era] && ACTS[state.era].gearSlots[item]) return installGear(state, action, item);
    return rejected(state, action, 'UNKNOWN_ITEM');
  }

  function combine(state, action) {
    if (state.era !== '1959' || state.scene !== 'act2_bldg54' || action.result !== 'indicatorLeaf') {
      return rejected(state, action, 'WRONG_SCENE');
    }
    if (state.act.steps.leafAssembled || state.act.completed.bldg54) return rejected(state, action, 'ALREADY_USED');
    if (!hasItem(state, 'leafFrame') || !hasItem(state, 'leafFilm')) return rejected(state, action, 'MISSING_ITEM');
    if (!Puzzles || !Puzzles.check('B1_ASSEMBLE', { items: action.items })) {
      return rejected(state, action, 'WRONG_PUZZLE_ANSWER');
    }
    return accepted(state, [{ type: 'ITEM_COMBINED', result: 'indicatorLeaf' }], function (next) {
      removeItem(next, 'leafFrame');
      removeItem(next, 'leafFilm');
      addItem(next, 'indicatorLeaf');
      next.act.steps.leafAssembled = true;
      markSolved(next, 'B1_ASSEMBLE');
    });
  }

  function wrongAnswer(state, action) {
    return rejected(state, action, 'WRONG_PUZZLE_ANSWER');
  }

  function puzzle(state, action) {
    var id = action.id;
    var value = action.value;
    if (!Puzzles) return rejected(state, action, 'PUZZLE_MODULE_UNAVAILABLE');

    if (id === 'A1_LOCK') {
      if (state.era !== '1933' || state.scene !== 'act1_library') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.steps.fragment1) return rejected(state, action, 'FRAGMENT_ONE_REQUIRED');
      if (state.act.steps.drawerOpen) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'DRAWER_OPENED' }], function (next) {
        next.act.steps.drawerOpen = true;
        markSolved(next, id);
      });
    }
    if (id === 'A2') {
      if (state.era !== '1933' || state.scene !== 'act1_library') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'drawingFragment1') || !hasItem(state, 'drawingFragment2')) {
        return rejected(state, action, 'MISSING_ITEM');
      }
      if (state.act.steps.joined) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'DRAWING_JOINED' }], function (next) {
        removeItem(next, 'drawingFragment1');
        removeItem(next, 'drawingFragment2');
        addItem(next, 'drawingPattern');
        next.act.steps.joined = true;
        markSolved(next, id);
      });
    }
    if (id === 'A3') {
      if (state.era !== '1933' || state.scene !== 'act1_library') return rejected(state, action, 'WRONG_SCENE');
      if (!hasItem(state, 'drawingPattern')) return rejected(state, action, 'MISSING_ITEM');
      if (state.act.completed.library) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'SUNLIGHT_RESTORED' }, { type: 'GEAR_ACQUIRED', item: 'windowGear' }], function (next) {
        removeItem(next, 'drawingPattern');
        addGear(next, 'windowGear');
        next.act.completed.library = true;
        addMemory(next, 'drawingPattern', 'act1_library', 'pattern');
        markSolved(next, id);
      });
    }
    if (id === 'A4') {
      if (state.era !== '1933' || state.scene !== 'act1_hall') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.steps.malletInstalled) return rejected(state, action, 'MALLET_REQUIRED');
      if (state.act.completed.hall) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'GEAR_ACQUIRED', item: 'soundGear' }], function (next) {
        addGear(next, 'soundGear');
        next.act.completed.hall = true;
        addMemory(next, 'soundSequence', 'act1_hall', 'sound', { notes: ['low', 'high', 'medium', 'low'], visual: true });
        markSolved(next, id);
      });
    }
    if (id === 'B2') {
      if (state.era !== '1959' || state.scene !== 'act2_power') return rejected(state, action, 'WRONG_SCENE');
      if (!hasMemory(state, 'soundSequence')) return rejected(state, action, 'SOUND_MEMORY_REQUIRED');
      if (state.act.completed.power) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'FULL_SEQUENCE_PLAYED' }, { type: 'GEAR_ACQUIRED', item: 'transmissionGear' }], function (next) {
        addGear(next, 'transmissionGear');
        next.act.completed.power = true;
        addMemory(next, 'repairTrace', 'act2_power', 'trace');
        markSolved(next, id);
      });
    }
    if (id === 'B3') {
      if (state.era !== '1959' || state.scene !== 'act2_bldg55') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.completed.bldg54 || !state.act.completed.power || !hasItem(state, 'departureNote') || !hasMemory(state, 'repairTrace')) {
        return rejected(state, action, 'CORE_BUILDINGS_INCOMPLETE');
      }
      if (state.act.steps.b3) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'MEMORIES_JOINED' }, { type: 'TIME_LABEL', text: '多年后' }], function (next) {
        next.act.steps.b3 = true;
        addMemory(next, 'returnedPart', 'act2_bldg55', 'memory');
        markSolved(next, id);
      });
    }
    if (id === 'B4_REPAIR') {
      if (state.era !== '1959' || state.scene !== 'act2_bldg55') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.steps.b3) return rejected(state, action, 'B3_REQUIRED');
      if (state.act.device.repaired) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'TRANSMISSION_REPAIRED' }], function (next) {
        next.act.device.repaired = true;
        markSolved(next, id);
      });
    }
    if (id === 'C1') {
      if (state.era !== '1988' || state.scene !== 'act3_frontyard') return rejected(state, action, 'WRONG_SCENE');
      if (!hasMemory(state, 'drawingPattern')) return rejected(state, action, 'DRAWING_MEMORY_REQUIRED');
      if (state.act.completed.frontyard) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'OLD_WINDOW_REVEALED' }, { type: 'GEAR_ACQUIRED', item: 'nestedWindowGear' }], function (next) {
        addGear(next, 'nestedWindowGear');
        next.act.completed.frontyard = true;
        addMemory(next, 'oldWindowShadow', 'act3_frontyard', 'memory');
        markSolved(next, id);
      });
    }
    if (id === 'C2_ROSTER' || id === 'C2_LESSON' || id === 'C2_PROJECT' || id === 'C2_LETTER') {
      if (state.era !== '1988' || state.scene !== 'act3_alumni') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.completed.frontyard) return rejected(state, action, 'C1_REQUIRED');
      if (id === 'C2_ROSTER') {
        if (state.act.steps.roster) return rejected(state, action, 'ALREADY_COMPLETED');
        if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
        return accepted(state, [{ type: 'ROSTER_FOUND', name: '刘长睿' }], function (next) {
          next.act.steps.roster = true;
          addMemory(next, 'roster1959', 'act3_alumni', 'document');
          markSolved(next, id);
        });
      }
      if (id === 'C2_LESSON') {
        if (!state.act.steps.roster) return rejected(state, action, 'ROSTER_REQUIRED');
        if (state.act.steps.lesson) return rejected(state, action, 'ALREADY_COMPLETED');
        if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
        return accepted(state, [{ type: 'LESSON_PLAN_FOUND' }], function (next) {
          next.act.steps.lesson = true;
          addMemory(next, 'lessonPlan', 'act3_alumni', 'document');
          markSolved(next, id);
        });
      }
      if (id === 'C2_PROJECT') {
        if (!state.act.steps.lesson) return rejected(state, action, 'LESSON_PLAN_REQUIRED');
        if (!hasMemory(state, 'modelTuning1959')) return rejected(state, action, 'MODEL_MEMORY_REQUIRED');
        if (state.act.completed.alumni) return rejected(state, action, 'ALREADY_COMPLETED');
        if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
        return accepted(state, [
          { type: 'SOLUTION_RECOGNIZED' },
          { type: 'OBSESSION_ONE_RESOLVED' },
          { type: 'GEAR_ACQUIRED', item: 'signatureGear' }
        ], function (next) {
          next.act.completed.alumni = true;
          addGear(next, 'signatureGear');
          addMemory(next, 'nameInAmber', 'act3_alumni', 'memory');
          markSolved(next, id);
        });
      }
      if (!state.act.completed.alumni) return rejected(state, action, 'C2_PROJECTION_REQUIRED');
      if (!state.letter.found) return rejected(state, action, 'MISSING_ITEM');
      if (state.letter.unfolded) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'LETTER_INNER_REVEALED', audience: 'playerOnly' }], function (next) {
        next.letter.unfolded = true;
        markSolved(next, id);
      });
    }
    if (id === 'C3_MEMORY') {
      if (state.era !== '1988' || state.scene !== 'act3_tree') return rejected(state, action, 'WRONG_SCENE');
      if (!state.act.storySeen) return rejected(state, action, 'STORY_REQUIRED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      if (!hasMemory(state, value.memory)) return rejected(state, action, 'MISSING_MEMORY');
      if (state.act.device.memories[value.slot]) return rejected(state, action, 'SLOT_OCCUPIED');
      return accepted(state, [{ type: 'MEMORY_ALIGNED', memory: value.memory, slot: value.slot }], function (next) {
        next.act.device.memories[value.slot] = value.memory;
      });
    }
    if (id === 'D1' || id === 'D2' || id === 'D3') {
      var expectedScene = id === 'D1' ? 'act4_hall' : (id === 'D2' ? 'act4_alumni' : 'act4_frontyard');
      var evidenceId = id === 'D1' ? 'ceremonyRecord' : (id === 'D2' ? 'rosterContinuation' : 'repairPlaque');
      if (state.era !== '2002' || state.scene !== expectedScene) return rejected(state, action, 'WRONG_SCENE');
      if (state.act.evidence.indexOf(evidenceId) !== -1) return rejected(state, action, 'ALREADY_COLLECTED');
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      return accepted(state, [{ type: 'EVIDENCE_COLLECTED', evidence: evidenceId }], function (next) {
        next.act.evidence.push(evidenceId);
        next.phase = 'act4_evidence';
        markSolved(next, id);
      });
    }
    if (id === 'D4') {
      if (state.era !== '2002' || state.scene !== 'act4_tree') return rejected(state, action, 'WRONG_SCENE');
      if (state.act.ending) return rejected(state, action, 'ALREADY_COMPLETED');
      if (!EVIDENCE.every(function (item) { return state.act.evidence.indexOf(item) !== -1; })) {
        return rejected(state, action, 'EVIDENCE_INCOMPLETE');
      }
      if (!Puzzles.check(id, value)) return wrongAnswer(state, action);
      if (state.act.evidence.indexOf(value) === -1) return rejected(state, action, 'EVIDENCE_NOT_COLLECTED');
      if (state.act.projected.indexOf(value) !== -1) return rejected(state, action, 'ALREADY_PROJECTED');
      var projectionEffects = [
        { type: 'EVIDENCE_PROJECTED', evidence: value },
        { type: 'GUARDIAN_REACTION', index: state.act.projected.length }
      ];
      return accepted(state, projectionEffects, function (next) {
        next.act.projected.push(value);
        markSolved(next, 'D4');
        if (next.act.projected.length === 3) {
          next.act.ending = true;
          next.scene = 'act4_ending';
          next.phase = 'act4_ending';
          projectionEffects.push(
            { type: 'LAST_LINE' },
            { type: 'GUARDIAN_DISSOLVES' },
            { type: 'NEW_SPROUT', saturatedGreen: true },
            { type: 'CRACK_PRESERVED' }
          );
        }
      });
    }
    return rejected(state, action, 'UNKNOWN_PUZZLE');
  }

  function turnHandle(state, action) {
    var config = ACTS[state.era];
    if (!config || state.scene !== config.deviceScene) return rejected(state, action, 'WRONG_SCENE');
    if (!state.act.device.amberInserted) return rejected(state, action, 'AMBER_NOT_INSERTED');
    var gearsReady = Object.keys(config.gearSlots).every(function (gear) {
      return state.act.device.slots[config.gearSlots[gear]] === gear;
    });
    if (!gearsReady) return rejected(state, action, 'MISSING_GEARS');
    if (state.era === '1959' && (!state.act.steps.b3 || !state.act.device.repaired)) {
      return rejected(state, action, 'DEVICE_NOT_READY');
    }
    if (state.era === '1988') {
      var memoriesReady = Object.keys(MEMORY_FOR_SLOT).every(function (slot) {
        return state.act.device.memories[slot] === MEMORY_FOR_SLOT[slot];
      });
      if (!memoriesReady) return rejected(state, action, 'MEMORY_ALIGNMENT_REQUIRED');
    }
    if (state.act.engraved || state.ringAmber.rings !== config.ring - 1 || state.ringAmber.grafted !== config.ring - 1) {
      return rejected(state, action, 'ALREADY_ENGRAVED');
    }
    return accepted(state, [
      { type: 'RING_ENGRAVED', ring: config.ring },
      { type: 'GEARS_LEFT_IN_DEVICE' },
      { type: 'INVENTORY_CLEARED' },
      { type: 'RETURN_TO_PINE' }
    ], function (next) {
      next.ringAmber.rings = config.ring;
      next.act.engraved = true;
      next.act.device.amberInserted = false;
      next.phase = config.id + '_graft';
      next.inventory = [];
      markSolved(next, config.engravePuzzle);
    });
  }

  function graft(state, action) {
    if (state.era === 'prologue') {
      if (state.scene !== 'prologue_sprout') return rejected(state, action, 'WRONG_SCENE');
      if (!state.ringAmber.owned) return rejected(state, action, 'AMBER_NOT_OWNED');
      if (!state.prologue.watered || !state.prologue.supported) return rejected(state, action, 'SPROUT_NOT_READY');
      if (state.prologue.grafted) return rejected(state, action, 'ALREADY_GRAFTED');
      return accepted(state, [
        { type: 'PROLOGUE_GRAFTED' },
        { type: 'INVENTORY_CLEARED' },
        { type: 'ERA_CHANGED', era: '1933' }
      ], function (next) {
        next.prologue.grafted = true;
        next.history.push('prologue');
        next.era = '1933';
        next.phase = 'act1_tree';
        next.scene = 'act1_tree';
        next.act = createAct('act1');
        next.inventory = [];
      });
    }
    var config = ACTS[state.era];
    if (!config) return rejected(state, action, 'NOTHING_TO_GRAFT');
    if (state.scene !== config.tree) return rejected(state, action, 'WRONG_SCENE');
    if (!state.act.engraved || state.ringAmber.rings !== config.ring || state.ringAmber.grafted !== config.ring - 1) {
      return rejected(state, action, 'RING_NOT_READY');
    }
    if (state.act.grafted) return rejected(state, action, 'ALREADY_GRAFTED');
    return accepted(state, [
      { type: 'RING_GRAFTED', ring: config.ring },
      { type: 'TREE_RESTORED_PARTIAL', crackPreserved: true },
      { type: 'INVENTORY_CLEARED' },
      { type: 'ERA_CHANGED', era: config.nextEra }
    ], function (next) {
      next.ringAmber.grafted = config.ring;
      next.act.grafted = true;
      markSolved(next, config.graftPuzzle);
      next.history.push(next.era);
      next.era = config.nextEra;
      next.phase = config.nextScene;
      next.scene = config.nextScene;
      next.act = createAct(config.nextAct);
      next.inventory = [];
    });
  }

  function transition(originalState, originalAction) {
    if (!originalState || typeof originalState !== 'object') return rejected(originalState, originalAction, 'INVALID_STATE');
    var action = normalizeAction(originalAction);
    if (!action || typeof action.type !== 'string') return rejected(originalState, originalAction, 'INVALID_ACTION');

    if (originalState.scene === 'act4_memorial' &&
        ['TAKE', 'USE', 'PUZZLE', 'COMBINE', 'TURN_HANDLE', 'GRAFT', 'TOUCH'].indexOf(action.type) !== -1) {
      return rejected(originalState, originalAction, 'MEMORIAL_REAL_LAYER_ONLY');
    }

    switch (action.type) {
      case 'ENTER': return enterScene(originalState, action);
      case 'TAKE': return takeItem(originalState, action);
      case 'USE': return useItem(originalState, action);
      case 'TOUCH': return touch(originalState, action);
      case 'COMBINE': return combine(originalState, action);
      case 'PUZZLE': return puzzle(originalState, action);
      case 'TURN_HANDLE': return turnHandle(originalState, action);
      case 'GRAFT': return graft(originalState, action);
      default: return rejected(originalState, originalAction, 'UNKNOWN_ACTION');
    }
  }

  function getHint(state, puzzleId, level) {
    if (!Puzzles || !state || typeof state !== 'object') return null;
    return Puzzles.getHint(puzzleId, level);
  }

  return Object.freeze({
    createInitialState: createInitialState,
    transition: transition,
    canEnter: canEnter,
    getHint: getHint
  });
}));
