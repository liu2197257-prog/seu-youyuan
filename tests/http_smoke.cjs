/* Quick smoke test against the local HTTP URL (not file://). */
'use strict';
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL_TO_TEST = process.argv[2] || 'http://127.0.0.1:8090/index.html';

(async () => {
  const port = 9700 + Math.floor(Math.random() * 100);
  const profile = path.join(os.tmpdir(), 'pine-http-' + Date.now());
  const child = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--disable-gpu', '--no-first-run', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
  try {
    let list;
    for (let i = 0; i < 100; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch (_) { await sleep(150); } }
    const page = list.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    const events = [];
    let id = 0; const pending = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
      else if (m.method) events.push(m);
    };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true })).result.value;
    await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
    await send('Page.navigate', { url: URL_TO_TEST });
    await sleep(1600);
    const info = await ev(`(() => {
      const fatal = document.getElementById('fatal-error');
      return { url: location.href, title: document.title, hasGame: !!window.PineGame,
        fatal: fatal && !fatal.hidden ? fatal.textContent : null,
        svg: !!document.querySelector('#scene svg'),
        hotspots: document.querySelectorAll('#scene [data-action]').length,
        scene: window.PineGame ? PineGame.state.scene : null,
        external: performance.getEntriesByType('resource').filter(e => /^https?:/.test(e.name) && !e.name.startsWith(location.origin)).map(e => e.name) };
    })()`);
    const errs = events.filter(e => e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')).map(e => JSON.stringify(e.params).slice(0, 200));
    console.log(JSON.stringify({ ...info, errors: errs }, null, 2));
    const ok = info.hasGame && info.svg && info.hotspots > 0 && !info.fatal && errs.length === 0 && info.external.length === 0;
    console.log(ok ? 'HTTP SMOKE PASS' : 'HTTP SMOKE FAIL');
    process.exitCode = ok ? 0 : 1;
    ws.close();
  } finally {
    try { child.kill(); } catch (_) {}
    await sleep(200); try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  }
})();
