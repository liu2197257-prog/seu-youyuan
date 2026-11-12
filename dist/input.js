/* Unified keyboard, pointer, drag and virtual joystick input. */
(function (global) {
  'use strict';
  const handlers = {};
  const keys = new Set();
  let joystickPointer = null;
  let drag = null;
  let suppressClickUntil = 0;
  let movementEnabled = false;
  let vector = { x: 0, y: 0 };
  let stage, knob, joystick;

  function emitMove() {
    let x = 0, y = 0;
    if (movementEnabled) {
      if (keys.has('arrowleft') || keys.has('a')) x -= 1;
      if (keys.has('arrowright') || keys.has('d')) x += 1;
      if (keys.has('arrowup') || keys.has('w')) y -= 1;
      if (keys.has('arrowdown') || keys.has('s')) y += 1;
      x += vector.x; y += vector.y;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
    }
    if (handlers.move) handlers.move({ x, y });
  }

  function reset() {
    keys.clear();
    vector = { x: 0, y: 0 };
    joystickPointer = null;
    if (knob) knob.style.transform = 'translate(0px, 0px)';
    if (drag) {
      try { drag.target.releasePointerCapture(drag.pointerId); } catch (_) { /* already released */ }
      if (handlers.drag) handlers.drag(Object.assign({}, drag.data, { phase: 'cancel', dx: 0, dy: 0 }));
      drag = null;
    }
    emitMove();
  }

  function svgPoint(target, event) {
    const svg = target.ownerSVGElement || target;
    if (svg && svg.createSVGPoint && svg.getScreenCTM()) {
      const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
      const local = point.matrixTransform(svg.getScreenCTM().inverse());
      return { x: local.x, y: local.y };
    }
    const rect = (svg || stage).getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1280 / rect.width, y: (event.clientY - rect.top) * 720 / rect.height };
  }

  function onPointerDown(event) {
    const target = event.target.closest('[data-drag]');
    if (!target || !stage.contains(target) || event.button > 0) return;
    const point = svgPoint(target, event);
    drag = {
      target, pointerId: event.pointerId,
      data: { id: target.dataset.drag, x: point.x, y: point.y, startX: point.x, startY: point.y, dx: 0, dy: 0, target }
    };
    try { target.setPointerCapture(event.pointerId); } catch (_) { /* 指针已失效时退化为普通拖动 */ }
    if (handlers.drag) handlers.drag(Object.assign({}, drag.data, { phase: 'start' }));
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = svgPoint(drag.target, event);
    Object.assign(drag.data, {
      x: point.x, y: point.y,
      dx: point.x - drag.data.startX,
      dy: point.y - drag.data.startY
    });
    if (Math.hypot(drag.data.dx, drag.data.dy) > 5) suppressClickUntil = performance.now() + 350;
    if (handlers.drag) handlers.drag(Object.assign({}, drag.data, { phase: 'move' }));
    event.preventDefault();
  }

  function endDrag(event, cancelled) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!cancelled) onPointerMove(event);
    const data = Object.assign({}, drag.data, { phase: cancelled ? 'cancel' : 'end' });
    try { drag.target.releasePointerCapture(event.pointerId); } catch (_) { /* harmless */ }
    drag = null;
    suppressClickUntil = performance.now() + 250;
    if (handlers.drag) handlers.drag(data);
  }

  function updateJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx, dy = event.clientY - cy;
    const radius = rect.width * .32;
    const length = Math.hypot(dx, dy);
    if (length > radius) { dx = dx / length * radius; dy = dy / length * radius; }
    vector = { x: dx / radius, y: dy / radius };
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    emitMove();
  }

  function init(options) {
    Object.assign(handlers, options);
    stage = document.getElementById('stage');
    joystick = document.getElementById('joystick');
    knob = document.getElementById('joystick-knob');
    stage.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) { event.preventDefault(); return; }
      const target = event.target.closest('[data-action]');
      if (!target || !stage.contains(target) || target.disabled) return;
      if (handlers.action) handlers.action(Object.assign({}, target.dataset), event);
    });
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', event => endDrag(event, false));
    stage.addEventListener('pointercancel', event => endDrag(event, true));

    joystick.addEventListener('pointerdown', event => {
      if (!movementEnabled || joystickPointer !== null) return;
      joystickPointer = event.pointerId;
      try { joystick.setPointerCapture(event.pointerId); } catch (_) { /* 不支持捕获时仍可拖动 */ }
      updateJoystick(event); event.preventDefault();
    });
    joystick.addEventListener('pointermove', event => {
      if (event.pointerId === joystickPointer) updateJoystick(event);
    });
    const releaseJoystick = event => {
      if (event.pointerId !== joystickPointer) return;
      joystickPointer = null; vector = { x: 0, y: 0 };
      knob.style.transform = 'translate(0px, 0px)'; emitMove();
    };
    joystick.addEventListener('pointerup', releaseJoystick);
    joystick.addEventListener('pointercancel', releaseJoystick);
    joystick.addEventListener('lostpointercapture', releaseJoystick);

    window.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)) {
        if (movementEnabled) { keys.add(key); emitMove(); event.preventDefault(); }
      } else if (key === 'e' && !event.repeat) {
        if (handlers.interact) handlers.interact(); event.preventDefault();
      } else if (key === 'escape') {
        if (handlers.escape) handlers.escape();
      }
    });
    window.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); emitMove(); });
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    return api;
  }

  const api = {
    init, reset,
    setMovementEnabled(value) { movementEnabled = !!value; if (!value) reset(); },
    get movementEnabled() { return movementEnabled; }
  };
  global.PineInput = api;
})(window);
