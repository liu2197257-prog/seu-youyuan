const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const read = file => fs.readFileSync(path.join(dist, file), 'utf8');
const required = [
  'index.html', 'style.css', 'state.js', 'puzzles.js', 'content.js', 'art.js',
  'renderer.js', 'input.js', 'audio.js', 'game.js',
  'scenes/prologue.js', 'scenes/act1.js', 'scenes/act2.js',
  'scenes/act3.js', 'scenes/act4.js', 'scenes/epilogue.js'
];

test('all offline runtime files exist', () => {
  for (const file of required) assert.ok(fs.existsSync(path.join(dist, file)), `missing ${file}`);
  assert.ok(fs.existsSync(path.join(root, '启动游戏.cmd')));
});

test('HTML uses local classic scripts only', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(html, /<script[^>]+type=["']module/i);
  for (const match of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
    assert.ok(fs.existsSync(path.join(dist, match[1])), `missing script ${match[1]}`);
  }
});

test('runtime has no network, dependency, font-file or save access', () => {
  for (const file of required.filter(file => file.endsWith('.js'))) {
    const source = read(file);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i, file);
    assert.doesNotMatch(source, /\blocalStorage\b|sessionStorage|indexedDB/, file);
    assert.doesNotMatch(source, /\brequire\s*\(/, `${file} must run as a classic browser script`);
  }
  assert.doesNotMatch(read('style.css'), /@font-face|url\(["']?https?:/i);
});

test('forbidden comfort and theme-summary prose is absent', () => {
  const source = read('content.js');
  for (const phrase of ['我原谅你', '别难过', '没关系', '我错了', '我后悔', '我放不下', '这就是薪火相传']) {
    assert.ok(!source.includes(phrase), `forbidden phrase: ${phrase}`);
  }
  assert.doesNotMatch(source, /[「“'"]我等你[」”'"]/);
  assert.ok(source.includes('六朝松下见证的下一个故事，就由我们这一代SEUer书写'));
  assert.ok(source.includes('这次，换我等你们。'));
});

test('cross-era sound clue and disputed years are used correctly', () => {
  const all = required.filter(file => file.endsWith('.js')).map(read).join('\n');
  assert.ok(all.includes('低—高—中—低'));
  for (const source of [read('puzzles.js'), read('state.js')]) {
    assert.doesNotMatch(source, /1923|1924|1956|1957|1958/, 'disputed building years must not be puzzle answers');
  }
});

test('pure logic modules do not access renderer or browser timers', () => {
  for (const file of ['state.js', 'puzzles.js']) {
    const source = read(file);
    assert.doesNotMatch(source, /\bdocument\.|\bPineRenderer\b|\bPineAudio\b|setTimeout\s*\(|setInterval\s*\(/, file);
  }
});
