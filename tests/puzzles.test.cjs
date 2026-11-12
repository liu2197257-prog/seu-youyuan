'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Puzzles = require('../dist/puzzles.js');

test('A1/A3/A4 使用场景内答案且拒绝错误输入', () => {
  assert.equal(Puzzles.check('A1_LOCK', ['circle', 'triangle', 'square']), true);
  assert.equal(Puzzles.check('A1_LOCK', ['triangle', 'circle', 'square']), false);
  assert.equal(Puzzles.check('A1_LOCK', ['circle', 'triangle']), false);
  assert.equal(Puzzles.check('A3', 30), true);
  assert.equal(Puzzles.check('A3', 0), false);
  assert.equal(Puzzles.check('A4', ['low', 'high', 'medium', 'low']), true);
  assert.equal(Puzzles.check('A4', ['low', 'high', 'low', 'medium']), false);
});

test('图纸拼合采用至少 24px 与 ±8° 容差', () => {
  assert.deepEqual(Puzzles.TOLERANCES, { dragPx: 24, rotationDeg: 8 });
  assert.equal(Puzzles.check('A2', { x: 184, y: 96, angle: 90 }), true);
  assert.equal(Puzzles.check('A2', { x: 184.01, y: 96, angle: 90 }), false);
  assert.equal(Puzzles.check('A2', { x: 160, y: 96, angle: 98 }), true);
  assert.equal(Puzzles.check('A2', { x: 160, y: 96, angle: 98.01 }), false);
  assert.equal(Puzzles.check('A2', { x: 160, y: 96, angle: -262 }), true);
  assert.equal(Puzzles.check('A2', { x: NaN, y: 96, angle: 90 }), false);
});

test('第二章组合与传动规则包含四音视觉等效序列', () => {
  assert.equal(Puzzles.check('B1_ASSEMBLE', { items: ['leafFrame', 'leafFilm'] }), true);
  assert.equal(Puzzles.check('B1_ASSEMBLE', { items: ['leafFilm', 'leafFrame'] }), true);
  assert.equal(Puzzles.check('B1_ASSEMBLE', { items: ['leafFrame'] }), false);
  const answer = {
    links: ['input-middle', 'middle-output'],
    notes: ['low', 'high', 'medium', 'low']
  };
  assert.equal(Puzzles.check('B2', answer), true);
  assert.equal(Puzzles.check('B2', { ...answer, notes: ['low', 'medium', 'high', 'low'] }), false);
  assert.equal(Puzzles.check('B2', { ...answer, links: ['input-output'] }), false);
});

test('第三章对位、档案链与记忆槽判定', () => {
  assert.equal(Puzzles.check('C1', { x: 244, y: 140, angle: 45 }), true);
  assert.equal(Puzzles.check('C1', { x: 244.01, y: 140, angle: 45 }), false);
  assert.equal(Puzzles.check('C1', { x: 220, y: 140, angle: 53 }), true);
  assert.equal(Puzzles.check('C2_ROSTER', { year: 1959, name: '刘长睿' }), true);
  assert.equal(Puzzles.check('C2_ROSTER', { year: 1988, name: '刘长睿' }), false);
  assert.equal(Puzzles.check('C2_LESSON', 'lessonPlan'), true);
  assert.equal(Puzzles.check('C2_PROJECT', { memory: 'modelTuning1959', target: 'lessonPlan' }), true);
  assert.equal(Puzzles.check('C2_PROJECT', { memory: 'oldWindowShadow', target: 'lessonPlan' }), false);
  assert.equal(Puzzles.check('C2_LETTER', 'unfold'), true);
  assert.equal(Puzzles.check('C3_MEMORY', { memory: 'oldWindowShadow', slot: 'nestedWindowSlot' }), true);
  assert.equal(Puzzles.check('C3_MEMORY', { memory: 'roster1959', slot: 'nestedWindowSlot' }), false);
  assert.equal(Puzzles.check('C3_MEMORY', { memory: 'roster1959', slot: 'signatureSlot' }), true);
});

test('第四章只接受三件物证与逐件投射，不接受纪念馆伪造内容', () => {
  assert.equal(Puzzles.check('D1', { year: 2002, name: '沈立' }), true);
  assert.equal(Puzzles.check('D1', { year: 1959, name: '沈立' }), false);
  assert.equal(Puzzles.check('D2', { page: 'continuation', name: '沈立' }), true);
  assert.equal(Puzzles.check('D3', { target: 'repairPlaque', name: '沈立' }), true);
  for (const id of ['ceremonyRecord', 'rosterContinuation', 'repairPlaque']) {
    assert.equal(Puzzles.check('D4', id), true);
  }
  assert.equal(Puzzles.check('D4', 'fictionalMemorialEvidence'), false);
});

test('每个谜题提示分三级且仅按请求读取', () => {
  for (const id of ['A1_LOCK', 'A2', 'A3', 'A4', 'B2', 'C1', 'C2_ROSTER', 'C3_MEMORY', 'D4']) {
    for (let level = 1; level <= 3; level += 1) {
      assert.equal(typeof Puzzles.getHint(id, level), 'string', `${id} level ${level}`);
      assert.ok(Puzzles.getHint(id, level).length > 0);
    }
  }
  assert.equal(Puzzles.getHint('A1_LOCK', 0), null);
  assert.equal(Puzzles.getHint('A1_LOCK', 4), null);
  assert.equal(Puzzles.getHint('UNKNOWN', 1), null);
  assert.equal(Puzzles.check('UNKNOWN', true), false);
  assert.doesNotThrow(() => Puzzles.check('A2', null));
});

test('puzzles.js 是无 CommonJS 环境也可执行的经典脚本', () => {
  const filename = path.join(__dirname, '../dist/puzzles.js');
  const context = vm.createContext({ console });
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  assert.equal(typeof context.PinePuzzles.check, 'function');
  assert.equal(context.PinePuzzles.check('A4', ['low', 'high', 'medium', 'low']), true);
  assert.equal(context.module, undefined);
});
