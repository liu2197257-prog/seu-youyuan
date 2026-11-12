/* Offline procedural audio. Nothing is created before the player enables sound. */
(function (global) {
  'use strict';
  let context = null, master = null, ambient = null;
  let enabled = false;
  const timers = new Set();

  function ensure() {
    if (context) return true;
    const AudioContext = global.AudioContext || global.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    master = context.createGain(); master.gain.value = .16; master.connect(context.destination);
    return true;
  }
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); if (enabled) fn(); }, ms);
    timers.add(id); return id;
  }
  function tone(freq, duration, options) {
    if (!enabled || !ensure()) return;
    options = options || {};
    const now = context.currentTime + (options.delay || 0);
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = options.type || 'sine'; osc.frequency.setValueAtTime(freq, now);
    if (options.endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFreq), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.volume || .28, now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + duration + .04);
  }
  function noise(duration, volume, lowpass) {
    if (!enabled || !ensure()) return;
    const length = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) { last = last * .84 + (Math.random() * 2 - 1) * .16; data[i] = last; }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = lowpass || 900;
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume || .14, context.currentTime + .05);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    source.connect(filter); filter.connect(gain); gain.connect(master); source.start(); source.stop(context.currentTime + duration + .02);
  }
  const notes = [196, 392, 293.65, 196];
  function fourNotes(onVisual) {
    notes.forEach((frequency, index) => {
      later(() => { tone(frequency, .48, { type: 'triangle', volume: .32 }); if (onVisual) onVisual(index); }, index * 560);
    });
  }
  function play(id, options) {
    if (!enabled) return;
    switch (id) {
      case 'pickup': tone(330, .16, { type: 'triangle', volume: .15, endFreq: 390 }); break;
      case 'paper': noise(.25, .12, 1400); break;
      case 'click': tone(140, .09, { type: 'square', volume: .08 }); break;
      case 'error': tone(105, .24, { type: 'sawtooth', volume: .11, endFreq: 80 }); break;
      case 'gear': noise(.6, .13, 500); tone(88, .55, { type: 'triangle', volume: .14 }); break;
      case 'engrave': noise(2.5, .16, 1100); tone(72, 2.6, { type: 'sine', volume: .12, endFreq: 108 }); break;
      case 'graft': tone(110, 2.8, { volume: .18, endFreq: 165 }); later(() => tone(220, 2.3, { volume: .1 }), 650); break;
      case 'break': noise(.85, .5, 260); tone(67, .9, { type: 'sawtooth', volume: .3, endFreq: 28 }); break;
      case 'step': noise(.09, .05, 380); break;
      case 'sprout': tone(262, 1.5, { volume: .10 }); later(() => tone(330, 1.4, { volume: .09 }), 260); later(() => tone(392, 1.7, { volume: .08 }), 520); break;
      case 'low': tone(notes[0], .5, { type: 'triangle', volume: .3 }); break;
      case 'high': tone(notes[1], .5, { type: 'triangle', volume: .3 }); break;
      case 'mid': tone(notes[2], .5, { type: 'triangle', volume: .3 }); break;
      case 'four': fourNotes(options && options.onVisual); break;
      case 'wind': startAmbient(); break;
      default: tone(180, .15, { volume: .08 });
    }
  }
  function startAmbient() {
    if (!enabled || ambient || !ensure()) return;
    const seconds = 3, length = context.sampleRate * seconds;
    const buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < length; i++) { value = .96 * value + .04 * (Math.random() * 2 - 1); data[i] = value; }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; source.loop = true; filter.type = 'lowpass'; filter.frequency.value = 520;
    gain.gain.value = .065; source.connect(filter); filter.connect(gain); gain.connect(master); source.start();
    ambient = { source, gain };
  }
  function stopAmbient() { if (!ambient) return; try { ambient.source.stop(); } catch (_) {} ambient = null; }
  function stopAll() { timers.forEach(clearTimeout); timers.clear(); stopAmbient(); }
  async function toggle() {
    if (!enabled) {
      if (!ensure()) return false;
      try { await context.resume(); } catch (_) { return false; }
      enabled = true; master.gain.value = .16;
    } else {
      enabled = false; stopAll();
      if (context) { try { await context.suspend(); } catch (_) {} }
    }
    return enabled;
  }
  global.PineAudio = {
    toggle, play, stopAll, stopAmbient, fourNotes,
    get enabled() { return enabled; },
    notes: notes.slice()
  };
})(window);
