/*
 * 六朝松 · 程序化 SVG 美术组件
 * 经典脚本：window.PineArt / globalThis.PineArt
 * 所有函数均为纯字符串变换，不读取或修改 DOM。
 * scene() 返回完整 1280×720 SVG；其余组件默认返回可组合的 <g>。
 */
(function (root) {
  'use strict';

  var WIDTH = 1280;
  var HEIGHT = 720;
  var XMLNS = 'http://www.w3.org/2000/svg';
  var VIVID_SPROUT = '#24b86b';

  var PALETTES = {
    now: {
      paper: '#d8cbb3', sky: '#c7c0ac', ground: '#b4a88e',
      ink: '#332b25', outline: '#3b3028', wood: '#66533f', bark: '#4b3d31',
      wall: '#b9ad94', wallAlt: '#9d917c', roof: '#655b4d',
      foliage: '#737564', metal: '#6e6b61', brass: '#8f7950',
      amber: '#8a6b47', amberDark: '#5f4935', amberLight: '#a58b62',
      heart: '#282522', shadow: '#4b4237', paperLine: '#b8a98f',
      warm: '#b69a6c', window: '#8b9087'
    },
    '1933': {
      paper: '#ded5c1', sky: '#cec8b9', ground: '#b9b09e',
      ink: '#332e29', outline: '#3c352e', wood: '#62594c', bark: '#494239',
      wall: '#c0b8a7', wallAlt: '#a39b8c', roof: '#5c5750',
      foliage: '#77786f', metal: '#6c6a64', brass: '#897b5c',
      amber: '#826c4e', amberDark: '#5c4c39', amberLight: '#a18b68',
      heart: '#292622', shadow: '#514a40', paperLine: '#b7ad99',
      warm: '#a28e6b', window: '#999a91'
    },
    '1959': {
      paper: '#d8ceba', sky: '#b9bfba', ground: '#aaa48f',
      ink: '#342e29', outline: '#40362e', wood: '#665444', bark: '#4b4036',
      wall: '#aa9985', wallAlt: '#8d7365', roof: '#5f5c55',
      foliage: '#727765', metal: '#687475', brass: '#8c7954',
      amber: '#896b47', amberDark: '#5d4936', amberLight: '#a58a60',
      heart: '#292522', shadow: '#4d453b', paperLine: '#b5a990',
      warm: '#ac9068', window: '#7f8b8b'
    },
    '1988': {
      paper: '#ddd0b6', sky: '#c3c0a9', ground: '#ada388',
      ink: '#352e27', outline: '#40352b', wood: '#69543e', bark: '#4c3f31',
      wall: '#b6a184', wallAlt: '#927967', roof: '#62594b',
      foliage: '#707b63', metal: '#6d7168', brass: '#917a50',
      amber: '#8d6d46', amberDark: '#604935', amberLight: '#aa8c60',
      heart: '#29241f', shadow: '#514536', paperLine: '#baaa8d',
      warm: '#b79a6c', window: '#879087'
    },
    '2002': {
      paper: '#e1d3b8', sky: '#cbc3aa', ground: '#b3a68a',
      ink: '#372f27', outline: '#43372c', wood: '#6b553e', bark: '#4d4032',
      wall: '#bda88a', wallAlt: '#9a7e68', roof: '#665b4b',
      foliage: '#7b8067', metal: '#72746a', brass: '#987e52',
      amber: '#906f48', amberDark: '#624b36', amberLight: '#ad8f63',
      heart: '#2a251f', shadow: '#544737', paperLine: '#bdad8f',
      warm: '#c0a276', window: '#90968a'
    }
  };

  var BUILDING_NAMES = {
    library: '孟芳图书馆', hall: '大礼堂', gym: '体育馆',
    bldg54: '五四楼', power: '动力楼', bldg55: '五五楼',
    frontyard: '前工院', alumni: '校友会堂', memorial: '吴健雄纪念馆'
  };

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function assign(base) {
    var out = {};
    var i;
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key];
    }
    for (i = 1; i < arguments.length; i += 1) {
      if (!arguments[i]) continue;
      for (key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) out[key] = arguments[i][key];
      }
    }
    return out;
  }

  function number(value, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, number(value, min)));
  }

  function integer(value, fallback) {
    return Math.round(number(value, fallback));
  }

  function fmt(value) {
    var n = number(value, 0);
    return String(Math.round(n * 100) / 100);
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeId(value, fallback) {
    var id = String(value || fallback || 'pine-art').replace(/[^A-Za-z0-9_-]+/g, '-');
    id = id.replace(/^-+|-+$/g, '');
    return id || fallback || 'pine-art';
  }

  function attrs(values) {
    if (!values) return '';
    var out = [];
    Object.keys(values).forEach(function (key) {
      var value = values[key];
      var name = key === 'className' ? 'class' : key;
      if (value === null || value === undefined || value === false) return;
      if (/^on/i.test(name) || !/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(name)) return;
      if (value === true) value = name;
      out.push(' ' + name + '="' + esc(value) + '"');
    });
    return out.join('');
  }

  function tag(name, attributes, content) {
    return '<' + name + attrs(attributes) + '>' + (content === null || content === undefined ? '' : String(content)) + '</' + name + '>';
  }

  function emptyTag(name, attributes) {
    return '<' + name + attrs(attributes) + '/>';
  }

  function g(content, attributes) {
    return tag('g', attributes, content);
  }

  function path(d, attributes) {
    return emptyTag('path', assign({ d: d }, attributes));
  }

  function rect(x, y, width, height, attributes) {
    return emptyTag('rect', assign({ x: fmt(x), y: fmt(y), width: fmt(width), height: fmt(height) }, attributes));
  }

  function circle(cx, cy, r, attributes) {
    return emptyTag('circle', assign({ cx: fmt(cx), cy: fmt(cy), r: fmt(r) }, attributes));
  }

  function ellipse(cx, cy, rx, ry, attributes) {
    return emptyTag('ellipse', assign({ cx: fmt(cx), cy: fmt(cy), rx: fmt(rx), ry: fmt(ry) }, attributes));
  }

  function line(x1, y1, x2, y2, attributes) {
    return emptyTag('line', assign({ x1: fmt(x1), y1: fmt(y1), x2: fmt(x2), y2: fmt(y2) }, attributes));
  }

  function pointsString(points) {
    if (typeof points === 'string') return points;
    return (points || []).map(function (point) {
      return fmt(point[0]) + ',' + fmt(point[1]);
    }).join(' ');
  }

  function polygon(points, attributes) {
    return emptyTag('polygon', assign({ points: pointsString(points) }, attributes));
  }

  function polyline(points, attributes) {
    return emptyTag('polyline', assign({ points: pointsString(points) }, attributes));
  }

  function text(value, x, y, attributes) {
    return tag('text', assign({ x: fmt(x), y: fmt(y) }, attributes), esc(value));
  }

  function image(href, attributes) {
    return emptyTag('image', assign({ href: href }, attributes));
  }

  function use(href, attributes) {
    return emptyTag('use', assign({ href: href }, attributes));
  }

  function palette(era, overrides) {
    var key = String(era === undefined || era === null ? 'now' : era).toLowerCase();
    var aliases = {
      act1: '1933', ink: '1933', '1': '1933',
      act2: '1959', '2': '1959',
      act3: '1988', '3': '1988',
      act4: '2002', '4': '2002',
      prologue: 'now', current: 'now', modern: 'now', epilogue: 'now', contemporary: 'now'
    };
    key = aliases[key] || key;
    if (key === '0' || key === '2026') key = 'now';
    return assign(PALETTES[key] || PALETTES.now, overrides);
  }

  function paletteFrom(opts) {
    opts = opts || {};
    return palette(opts.era !== undefined ? opts.era : opts.year, opts.palette);
  }

  function transform(opts) {
    opts = opts || {};
    var x = number(opts.x, 0);
    var y = number(opts.y, 0);
    var sx = number(opts.scaleX, number(opts.scale, 1));
    var sy = number(opts.scaleY, number(opts.scale, 1));
    var angle = number(opts.rotate, number(opts.angle, 0));
    var out = [];
    if (x || y || opts.x !== undefined || opts.y !== undefined) out.push('translate(' + fmt(x) + ' ' + fmt(y) + ')');
    if (angle) out.push('rotate(' + fmt(angle) + ')');
    if (opts.flip) sx *= -1;
    if (sx !== 1 || sy !== 1) out.push('scale(' + fmt(sx) + ' ' + fmt(sy) + ')');
    if (opts.transform) out.push(opts.transform);
    return out.join(' ');
  }

  function component(kind, opts, content, extra) {
    opts = opts || {};
    var classes = ['pine-art', 'art-' + kind];
    if (opts.className) classes.push(opts.className);
    if (opts.class) classes.push(opts.class);
    var attributes = assign({
      id: opts.id,
      'class': classes.join(' '),
      transform: transform(opts) || null,
      opacity: opts.opacity,
      display: opts.hidden ? 'none' : null
    }, extra, opts.attrs);
    return g(content, attributes);
  }

  function localHref(value) {
    if (typeof value !== 'string') return '';
    var href = value.trim().replace(/\\/g, '/');
    if (!href || /^\/\//.test(href) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(href)) return '';
    if (/^[\s]*javascript/i.test(value)) return '';
    return href;
  }

  function backgroundSlot(value, p) {
    if (!value) return g('', { 'class': 'background-image-slot', 'data-empty': 'true', 'aria-hidden': 'true' });
    var config = typeof value === 'string' ? { href: value } : value;
    var href = localHref(config.href || config.src);
    if (!href) return g('', { 'class': 'background-image-slot', 'data-empty': 'invalid-local-path', 'aria-hidden': 'true' });
    return image(href, {
      'class': 'background-image-slot scene-background-image',
      x: fmt(number(config.x, 0)), y: fmt(number(config.y, 0)),
      width: fmt(number(config.width, WIDTH)), height: fmt(number(config.height, HEIGHT)),
      preserveAspectRatio: config.preserveAspectRatio || config.fit || 'xMidYMid slice',
      opacity: config.opacity === undefined ? 1 : clamp(config.opacity, 0, 1),
      'data-local-slot': 'backgroundImage'
    });
  }

  function paperGrain(p) {
    var marks = [];
    var i;
    for (i = 0; i < 46; i += 1) {
      var x = (i * 173 + 47) % WIDTH;
      var y = (i * 97 + 31) % HEIGHT;
      var r = 0.7 + (i % 3) * 0.45;
      marks.push(circle(x, y, r, { fill: i % 2 ? p.ink : p.paperLine, opacity: i % 2 ? 0.075 : 0.16 }));
    }
    for (i = 0; i < 12; i += 1) {
      var px = (i * 239 + 83) % WIDTH;
      var py = (i * 131 + 59) % HEIGHT;
      marks.push(path('M ' + px + ' ' + py + ' l 18 -3', {
        fill: 'none', stroke: p.ink, 'stroke-width': 0.8, opacity: 0.055
      }));
    }
    return g(marks.join(''), { 'class': 'scene-paper-grain', 'aria-hidden': 'true', 'pointer-events': 'none' });
  }

  function layerMarkup(name, value, sceneId) {
    var content = value;
    var config = {};
    if (Array.isArray(content)) content = content.join('');
    if (isObject(content)) {
      config = content;
      content = Array.isArray(content.content) ? content.content.join('') : (content.content || content.svg || '');
    }
    var classes = 'scene-layer scene-layer-' + name + (config.className ? ' ' + config.className : '');
    return g(content, assign({
      id: config.id || sceneId + '-layer-' + name,
      'class': classes,
      'data-layer': name,
      display: config.hidden ? 'none' : null
    }, config.attrs));
  }

  /**
   * 完整场景。layers 仅按 background/midground/interactable/overlay/character 顺序输出。
   * options.backgroundImage = 'assets/local.webp' 或 {href, x, y, width, height, opacity, fit}。
   * 为遵守离线约束，背景槽拒绝 URL 协议与协议相对地址。
   */
  function scene(id, layers, options) {
    layers = layers || {};
    options = options || {};
    var sceneId = safeId(id, 'scene');
    var p = paletteFrom(options);
    var base = options.base === false ? '' : rect(0, 0, WIDTH, HEIGHT, {
      'class': 'scene-paper', fill: p.paper
    });
    var slot = backgroundSlot(options.backgroundImage !== undefined ? options.backgroundImage : layers.backgroundImage, p);
    var grain = options.paper === false ? '' : paperGrain(p);
    var suppliedBackground = layers.background;
    if (Array.isArray(suppliedBackground)) suppliedBackground = suppliedBackground.join('');
    if (isObject(suppliedBackground)) {
      suppliedBackground = Array.isArray(suppliedBackground.content) ? suppliedBackground.content.join('') : (suppliedBackground.content || suppliedBackground.svg || '');
    }
    var background = base + slot + grain + (suppliedBackground || '');
    var content = layerMarkup('background', background, sceneId);
    ['midground', 'interactable', 'overlay', 'character'].forEach(function (name) {
      content += layerMarkup(name, layers[name], sceneId);
    });
    var title = options.title === false ? '' : tag('title', { id: sceneId + '-title' }, esc(options.title || id || '六朝松'));
    var description = options.description ? tag('desc', { id: sceneId + '-desc' }, esc(options.description)) : '';
    var definitions = options.defs ? tag('defs', {}, options.defs) : '';
    var attributes = assign({
      xmlns: XMLNS,
      width: WIDTH,
      height: HEIGHT,
      'class': 'pine-scene scene-' + sceneId + (options.className ? ' ' + options.className : ''),
      'data-scene': id || 'scene',
      'data-era': options.era || options.year || 'now',
      role: 'img',
      'aria-labelledby': options.title === false ? null : sceneId + '-title',
      preserveAspectRatio: options.preserveAspectRatio || 'xMidYMid meet'
    }, options.attrs, { viewBox: '0 0 ' + WIDTH + ' ' + HEIGHT });
    return tag('svg', attributes, title + description + definitions + content);
  }

  function normalizeAmber(state) {
    var source = state;
    if (typeof source === 'number') source = { rings: source };
    if (typeof source === 'string') {
      var match = source.match(/(\d)/);
      source = { rings: match ? Number(match[1]) : 0, grafted: /graft|接合/.test(source) ? (match ? Number(match[1]) : 1) : 0 };
    }
    source = isObject(source) ? source : {};
    var rings = integer(source.rings !== undefined ? source.rings : source.engraved, 0);
    rings = clamp(rings, 0, 3);
    var grafted = clamp(integer(source.grafted !== undefined ? source.grafted : source.joined, 0), 0, rings);
    return {
      rings: rings,
      grafted: grafted,
      memories: Array.isArray(source.memories) ? source.memories.slice() : [],
      aligned: source.aligned === true,
      active: source.active === true
    };
  }

  function organicRing(rx, ry, phase) {
    var points = [];
    var count = 28;
    var i;
    for (i = 0; i < count; i += 1) {
      var a = Math.PI * 2 * i / count;
      var wobble = 1 + 0.018 * Math.sin(a * 5 + phase) + 0.012 * Math.cos(a * 3 - phase);
      points.push([Math.cos(a) * rx * wobble, Math.sin(a) * ry * wobble]);
    }
    return smoothClosed(points);
  }

  function smoothClosed(points) {
    if (!points || !points.length) return '';
    var d = 'M ' + fmt(points[0][0]) + ' ' + fmt(points[0][1]);
    var n = points.length;
    var i;
    for (i = 0; i < n; i += 1) {
      var p0 = points[(i - 1 + n) % n];
      var p1 = points[i];
      var p2 = points[(i + 1) % n];
      var p3 = points[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + fmt(c1x) + ' ' + fmt(c1y) + ' ' + fmt(c2x) + ' ' + fmt(c2y) + ' ' + fmt(p2[0]) + ' ' + fmt(p2[1]);
    }
    return d + ' Z';
  }

  var AMBER_OUTLINE = 'M -91 -47 C -75 -76 -27 -91 17 -82 C 31 -80 39 -80 48 -76 L 65 -70 L 51 -54 L 72 -45 C 94 -23 101 12 86 42 C 68 76 25 88 -20 82 C -63 78 -95 58 -102 22 C -108 -3 -103 -28 -91 -47 Z';

  /** 年轮珀：三道结构环始终存在，rings 控制 0–3 道木质年轮，grafted 控制接合态。 */
  function amber(state, opts) {
    opts = opts || {};
    var data = normalizeAmber(state);
    var p = paletteFrom(opts);
    var out = [];
    out.push(path(AMBER_OUTLINE, {
      'class': 'amber-thickness', transform: 'translate(0 7)', fill: p.amberDark,
      stroke: p.outline, 'stroke-width': 6, 'stroke-linejoin': 'round'
    }));
    out.push(path(AMBER_OUTLINE, {
      'class': 'amber-shell', fill: p.amber, 'fill-opacity': 0.9,
      stroke: p.outline, 'stroke-width': 6, 'stroke-linejoin': 'round'
    }));
    out.push(path('M -79 -45 C -53 -70 -19 -75 9 -70 C -22 -59 -58 -45 -79 -16 Z', {
      'class': 'amber-smoke-patch', fill: p.amberLight, opacity: 0.2
    }));
    out.push(path('M -88 24 C -57 57 7 73 60 49 C 37 76 -18 82 -57 61 Z', {
      'class': 'amber-smoke-depth', fill: p.amberDark, opacity: 0.22
    }));
    out.push(path('M -84 -43 C -64 -69 -24 -80 11 -73', {
      fill: 'none', stroke: p.amberLight, 'stroke-width': 2, opacity: 0.5, 'stroke-linecap': 'round'
    }));

    var ringSizes = [[76, 59], [55, 42], [34, 26]];
    ringSizes.forEach(function (size, index) {
      var engraved = index < data.rings;
      var grafted = index < data.grafted;
      var ring = [];
      ring.push(ellipse(0, 0, size[0], size[1], {
        'class': 'amber-structure-ring', fill: 'none', stroke: p.brass,
        'stroke-width': 2.3, opacity: engraved ? 0.68 : 0.92
      }));
      ring.push(ellipse(0, 0, size[0] - 4, size[1] - 3, {
        'class': 'amber-structure-gap', fill: 'none', stroke: p.amberDark,
        'stroke-width': 0.9, opacity: 0.42
      }));
      if (engraved) {
        ring.push(path(organicRing(size[0] - 1, size[1] - 1, index * 1.7 + 0.4), {
          'class': 'amber-year-ring art-ring-etch', fill: 'none', stroke: p.bark,
          'stroke-width': 2.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        ring.push(path(organicRing(size[0] - 6, size[1] - 4, index * 1.3 + 1.2), {
          'class': 'amber-wood-grain', fill: 'none', stroke: p.brass,
          'stroke-width': 1.25, 'stroke-dasharray': index === 1 ? '8 5 18 4' : '15 4 5 6', opacity: 0.9
        }));
      }
      if (grafted) {
        ring.push(path('M ' + (-size[0] + 4) + ' -8 Q ' + (-size[0] - 6) + ' 0 ' + (-size[0] + 3) + ' 9', {
          'class': 'amber-graft-mark art-ring-attach', fill: 'none', stroke: p.warm,
          'stroke-width': 4, 'stroke-linecap': 'round'
        }));
      }
      out.push(g(ring.join(''), {
        'class': 'amber-ring amber-ring-' + (index + 1) + (engraved ? ' is-engraved' : ' is-blank') + (grafted ? ' is-grafted' : ''),
        'data-ring': index + 1,
        'data-state': grafted ? 'grafted' : (engraved ? 'engraved' : 'structure')
      }));
    });

    /* 短刻痕与外壳右上缺口错开约 20°。 */
    out.push(line(59, -32, 68, -38, {
      'class': 'amber-register-notch', stroke: p.heart, 'stroke-width': 4, 'stroke-linecap': 'round'
    }));
    out.push(path('M -15 -10 L -7 -19 L 7 -17 L 17 -6 L 13 10 L 2 17 L -13 11 L -19 1 Z', {
      'class': 'amber-tree-heart', fill: p.heart, stroke: p.outline, 'stroke-width': 2.5
    }));
    out.push(path('M -3 -14 L 1 -5 L -4 2 L 3 12', {
      'class': 'amber-heart-crack', fill: 'none', stroke: p.amberLight,
      'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.68
    }));
    if (opts.selected || data.active) {
      out.push(ellipse(0, 1, 111, 94, {
        'class': 'amber-selection art-breathe', fill: 'none', stroke: p.brass,
        'stroke-width': 2, 'stroke-dasharray': '5 8', opacity: 0.8
      }));
    }
    if (opts.interactive) {
      out.push(ellipse(0, 0, 112, 98, {
        'class': 'art-hit-area', fill: 'transparent', stroke: 'none',
        'pointer-events': 'all', 'data-hit': opts.hitId || 'amber'
      }));
    }
    return component('amber', opts, out.join(''), {
      'class': 'pine-art art-amber amber-rings-' + data.rings + (opts.className ? ' ' + opts.className : ''),
      'data-rings': data.rings,
      'data-grafted': data.grafted,
      'data-memories': data.memories.length,
      'data-notch': 'upper-right'
    });
  }

  function normalizePineState(state, opts) {
    var source = typeof state === 'string' ? { status: state } : (isObject(state) ? state : {});
    var inferredStatus = (source.broken === true || opts.broken === true) ? 'broken' : 'normal';
    var status = source.status || source.state || opts.state || inferredStatus;
    var aliases = { dead: 'broken', withered: 'broken', fractured: 'broken', repair: 'restoring', repairing: 'restoring', newSprout: 'sprout', 'new-sprout': 'sprout', epilogue: 'sprout' };
    status = aliases[status] || status;
    var defaultGrafted = status === 'sprout' ? 3 : (status === 'restoring' ? 1 : 0);
    var grafted = clamp(integer(source.grafted !== undefined ? source.grafted : opts.grafted, defaultGrafted), 0, 3);
    return {
      status: status,
      grafted: grafted,
      crack: status !== 'normal' || source.crack === true || opts.crack === true,
      sprout: status === 'sprout' || source.sprout === true || opts.sprout === true,
      support: source.support !== undefined ? source.support !== false : opts.support !== false,
      fence: source.fence !== undefined ? source.fence === true : opts.fence === true
    };
  }

  function pineFoliage(p) {
    var shapes = [
      'M 64 173 C 29 139 55 95 104 101 C 111 57 172 47 198 78 C 225 38 285 47 292 86 C 345 62 388 99 371 137 C 413 151 399 202 359 207 C 328 236 280 220 262 196 C 224 227 178 218 162 193 C 122 215 83 205 64 173 Z',
      'M 169 93 C 152 53 192 18 232 35 C 254 -2 312 7 321 42 C 369 25 402 59 389 95 C 422 121 393 153 357 146 C 323 170 284 148 270 127 C 228 149 187 132 169 93 Z',
      'M 24 268 C 2 234 33 199 74 208 C 95 174 139 183 151 211 C 187 198 216 223 207 253 C 228 281 194 307 164 293 C 136 318 96 299 88 277 C 61 292 35 285 24 268 Z',
      'M 300 248 C 290 211 324 188 357 202 C 382 169 430 184 433 217 C 472 221 482 260 452 279 C 425 305 389 286 375 270 C 344 292 312 278 300 248 Z',
      'M 91 342 C 72 314 96 287 128 294 C 145 266 185 274 193 301 C 225 299 240 329 219 350 C 195 373 166 355 153 344 C 131 365 103 359 91 342 Z'
    ];
    return shapes.map(function (d, index) {
      return path(d, {
        'class': 'pine-foliage pine-foliage-' + (index + 1) + ' art-sway',
        fill: index % 2 ? p.foliage : p.foliage,
        stroke: p.outline, 'stroke-width': 7, 'stroke-linejoin': 'round'
      });
    });
  }

  /** 六朝松。状态：normal / broken / restoring / sprout；修复与接合不会消除裂口。 */
  function pine(state, opts) {
    opts = opts || {};
    var data = normalizePineState(state, opts);
    var p = paletteFrom(opts);
    var back = [];
    var trunk = [];
    var front = [];

    back.push(ellipse(245, 570, 218, 27, { 'class': 'pine-ground-shadow', fill: p.shadow, opacity: 0.2 }));
    if (data.fence) {
      back.push(g(
        line(25, 492, 466, 492, { stroke: p.outline, 'stroke-width': 8 }) +
        line(25, 535, 466, 535, { stroke: p.outline, 'stroke-width': 7 }) +
        [45, 115, 185, 255, 325, 395, 455].map(function (x) {
          return line(x, 463, x, 553, { stroke: p.metal, 'stroke-width': 9, 'stroke-linecap': 'round' });
        }).join(''),
        { 'class': 'pine-fence', opacity: 0.72 }
      ));
    }
    if (data.support) {
      back.push(g(
        line(98, 552, 239, 240, { stroke: p.outline, 'stroke-width': 15, 'stroke-linecap': 'round' }) +
        line(98, 552, 239, 240, { stroke: p.metal, 'stroke-width': 8, 'stroke-linecap': 'round' }) +
        line(393, 553, 272, 295, { stroke: p.outline, 'stroke-width': 15, 'stroke-linecap': 'round' }) +
        line(393, 553, 272, 295, { stroke: p.metal, 'stroke-width': 8, 'stroke-linecap': 'round' }) +
        line(74, 554, 124, 554, { stroke: p.outline, 'stroke-width': 12, 'stroke-linecap': 'round' }) +
        line(369, 555, 418, 555, { stroke: p.outline, 'stroke-width': 12, 'stroke-linecap': 'round' }) +
        rect(218, 257, 52, 20, { rx: 6, fill: p.metal, stroke: p.outline, 'stroke-width': 5, transform: 'rotate(-11 244 267)' }),
        { 'class': 'pine-metal-supports' }
      ));
    }

    var foliage = pineFoliage(p);
    if (data.status === 'normal') {
      back.push(g(foliage.join(''), { 'class': 'pine-canopy pine-canopy-full' }));
    } else {
      var sparse = [foliage[1], foliage[3]];
      if (data.grafted >= 1) sparse.push(foliage[4]);
      if (data.grafted >= 2) sparse.push(foliage[0]);
      if (data.grafted >= 3 || data.status === 'sprout') sparse.push(foliage[2]);
      back.push(g(sparse.join(''), { 'class': 'pine-canopy pine-canopy-recovering', 'data-restored': data.grafted }));
    }

    back.push(g(
      path('M 240 263 C 185 225 130 207 72 205', { fill: 'none', stroke: p.outline, 'stroke-width': 28, 'stroke-linecap': 'round' }) +
      path('M 240 263 C 185 225 130 207 72 205', { fill: 'none', stroke: p.wood, 'stroke-width': 17, 'stroke-linecap': 'round' }) +
      path('M 268 216 C 321 180 365 155 423 147', { fill: 'none', stroke: p.outline, 'stroke-width': 25, 'stroke-linecap': 'round' }) +
      path('M 268 216 C 321 180 365 155 423 147', { fill: 'none', stroke: p.wood, 'stroke-width': 14, 'stroke-linecap': 'round' }) +
      path('M 208 350 C 157 327 118 310 69 304', { fill: 'none', stroke: p.outline, 'stroke-width': 22, 'stroke-linecap': 'round' }) +
      path('M 208 350 C 157 327 118 310 69 304', { fill: 'none', stroke: p.wood, 'stroke-width': 12, 'stroke-linecap': 'round' }),
      { 'class': 'pine-branches' }
    ));

    trunk.push(path('M 116 560 C 145 487 165 414 191 337 C 218 257 238 177 282 103 L 323 114 C 291 201 282 276 266 351 C 248 437 240 504 270 560 C 229 578 163 579 116 560 Z', {
      'class': 'pine-trunk', fill: p.wood, stroke: p.outline, 'stroke-width': 10, 'stroke-linejoin': 'round'
    }));
    if (data.status !== 'normal') {
      trunk.push(path('M 282 105 L 294 67 L 306 94 L 327 62 L 323 115 Z', {
        'class': 'pine-broken-crown', fill: p.paperLine, stroke: p.outline, 'stroke-width': 7, 'stroke-linejoin': 'round'
      }));
    }
    trunk.push(path('M 155 548 C 178 471 185 402 215 318 M 198 551 C 210 472 222 415 238 354 M 252 289 C 265 225 277 176 300 126', {
      'class': 'pine-bark-lines', fill: 'none', stroke: p.bark, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.8
    }));
    trunk.push(path('M 142 527 C 157 501 161 468 167 442 M 211 288 C 223 252 230 219 244 184', {
      fill: 'none', stroke: p.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.42
    }));
    trunk.push(g(
      path('M 151 542 C 112 553 83 570 45 574 C 90 582 132 576 177 560 Z', { fill: p.wood, stroke: p.outline, 'stroke-width': 7 }) +
      path('M 225 550 C 279 560 325 568 377 558 C 342 585 286 584 239 568 Z', { fill: p.wood, stroke: p.outline, 'stroke-width': 7 }) +
      path('M 185 552 C 164 576 145 588 117 596', { fill: 'none', stroke: p.outline, 'stroke-width': 12, 'stroke-linecap': 'round' }),
      { 'class': 'pine-roots art-root-grow' }
    ));

    if (data.crack) {
      /* 固定裂口路径：broken/restoring/sprout 共用，不用修复树脂遮盖。 */
      var crack = 'M 282 145 L 260 205 L 269 242 L 240 294 L 249 332 L 222 395 L 233 427 L 210 505 L 226 478 L 246 429 L 237 398 L 260 337 L 251 298 L 279 246 L 270 208 L 292 150 Z';
      front.push(path(crack, {
        'class': 'pine-crack', fill: p.heart, stroke: p.outline, 'stroke-width': 2,
        'stroke-linejoin': 'round', 'data-persistent-wound': 'true'
      }));
      front.push(path('M 259 205 L 241 188 M 243 294 L 221 277 M 226 395 L 204 380', {
        'class': 'pine-crack-branches', fill: 'none', stroke: p.heart, 'stroke-width': 5, 'stroke-linecap': 'round'
      }));
      var repairs = [];
      if (data.grafted >= 1) repairs.push(path('M 204 479 L 211 458 L 207 441', { fill: 'none', stroke: p.amber, 'stroke-width': 6, 'stroke-linecap': 'round' }));
      if (data.grafted >= 2) repairs.push(path('M 236 365 L 229 348 L 236 329', { fill: 'none', stroke: p.amber, 'stroke-width': 5, 'stroke-linecap': 'round' }));
      if (data.grafted >= 3) repairs.push(path('M 276 235 L 268 219 L 273 200', { fill: 'none', stroke: p.amber, 'stroke-width': 5, 'stroke-linecap': 'round' }));
      front.push(g(repairs.join(''), { 'class': 'pine-resin-segments art-ring-attach', 'data-crack-preserved': 'true' }));
      if (data.sprout) {
        front.push(sprout({
          x: 239, y: 337, scale: 0.68, rotate: 18,
          vivid: opts.vivid === true, soil: false, support: false,
          className: 'pine-wound-sprout'
        }));
      }
    }

    var pineLocal = g(back.join(''), { 'class': 'pine-back' }) +
      g(trunk.join(''), { 'class': 'pine-trunk-group' }) +
      g(front.join(''), { 'class': 'pine-front' });
    /* x/y 是视觉中心，便于同一机位切换树的状态。 */
    return component('pine', opts, g(pineLocal, { 'class': 'pine-local', transform: 'translate(-240 -300)' }), {
      'class': 'pine-art art-pine pine--' + data.status + (opts.className ? ' ' + opts.className : ''),
      'data-state': data.status,
      'data-grafted': data.grafted,
      'data-crack': data.crack ? 'present' : 'unbroken'
    });
  }

  /** 守忆者：无五官的浓墨站姿；仅转头时允许一小片灰白眼部亮点。 */
  function keeper(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var pose = opts.pose || (opts.reach ? 'reach' : 'stand');
    var fading = opts.fading || opts.faint || pose === 'fading';
    var dissolve = clamp(opts.dissolve !== undefined ? opts.dissolve : (pose === 'dissolve' ? 1 : 0), 0, 1);
    var opacity = clamp(opts.opacity !== undefined ? opts.opacity : (fading ? 0.46 : 0.94), 0, 1);
    opacity *= 1 - dissolve * 0.72;
    var ink = opts.ink || '#24211f';
    var body = [];
    body.push(ellipse(91, 405, 74, 13, { fill: p.shadow, opacity: 0.18 * (1 - dissolve) }));
    body.push(path('M 60 96 C 45 103 36 118 34 142 L 43 243 L 54 294 L 49 382 L 76 389 L 91 290 L 103 389 L 132 386 L 127 286 L 139 225 L 143 139 C 140 116 124 101 111 96 Z', {
      'class': 'keeper-body', fill: ink, stroke: ink, 'stroke-width': 7, 'stroke-linejoin': 'round', opacity: opacity
    }));
    body.push(path('M 65 34 C 71 9 108 4 123 26 C 139 49 128 81 111 96 C 93 107 66 92 60 71 C 56 57 59 44 65 34 Z', {
      'class': 'keeper-featureless-head', fill: ink, stroke: ink, 'stroke-width': 6, opacity: opacity
    }));
    var leftArm = 'M 47 126 C 30 170 27 217 35 263';
    var rightArm = 'M 128 128 C 148 176 148 218 139 259';
    if (pose === 'reach' || pose === 'turn-reach') rightArm = 'M 128 130 C 161 143 181 167 210 184 C 223 191 235 190 247 183';
    if (pose === 'point') rightArm = 'M 128 132 C 165 127 198 111 232 93';
    if (pose === 'lowered') rightArm = 'M 128 132 C 146 183 139 238 126 282';
    body.push(path(leftArm, {
      'class': 'keeper-arm keeper-arm-left', fill: 'none', stroke: ink,
      'stroke-width': 27, 'stroke-linecap': 'round', opacity: opacity
    }));
    body.push(path(rightArm, {
      'class': 'keeper-arm keeper-arm-right art-keeper-gesture', fill: 'none', stroke: ink,
      'stroke-width': 25, 'stroke-linecap': 'round', opacity: opacity
    }));
    body.push(path('M 64 104 L 88 132 L 112 103 M 73 101 L 88 113 L 103 100', {
      'class': 'keeper-student-collar', fill: 'none', stroke: '#68635b',
      'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: opacity * 0.82
    }));
    var showEye = opts.eye === true || opts.headTurn === true || pose === 'turn' || pose === 'turn-reach';
    if (showEye) {
      body.push(path('M 111 49 L 123 47 L 125 52 L 113 55 Z', {
        'class': 'keeper-turn-eye', fill: '#b3afa3', opacity: opacity * 0.82
      }));
    }
    var edge = [
      [54, 121, 4], [34, 183, 3], [141, 203, 4], [51, 303, 3],
      [130, 332, 3], [64, 67, 2.5], [127, 82, 3], [42, 239, 2]
    ];
    body.push(g(edge.map(function (dot, i) {
      return circle(dot[0] + (fading ? (i % 2 ? -7 : 8) : 0), dot[1], dot[2], {
        fill: ink, opacity: opacity * (fading ? 0.38 : 0.62), 'class': 'keeper-ink-edge'
      });
    }).join(''), { 'class': 'keeper-scattered-edge' }));

    if (dissolve > 0) {
      var particles = [];
      for (var i = 0; i < 30; i += 1) {
        var x = 35 + (i * 37) % 176 + dissolve * (12 + (i % 6) * 9);
        var y = 35 + (i * 61) % 350 - dissolve * (i % 5) * 8;
        if (i % 3 === 0) {
          particles.push(path('M ' + fmt(x) + ' ' + fmt(y) + ' l 12 -4 l -8 7 Z', {
            fill: ink, opacity: dissolve * 0.72, 'class': 'keeper-pine-needle'
          }));
        } else {
          particles.push(circle(x, y, 1.5 + (i % 4) * 0.7, {
            fill: ink, opacity: dissolve * (0.35 + (i % 4) * 0.1), 'class': 'keeper-ink-particle'
          }));
        }
      }
      body.push(g(particles.join(''), { 'class': 'keeper-dissolve-particles art-dissolve', 'data-direction': 'toward-pine' }));
    }

    var classes = 'pine-art art-keeper keeper--' + pose + (fading ? ' is-fading' : '') + (pose === 'shake' ? ' is-shaking art-ink-shiver' : '') + (opts.className ? ' ' + opts.className : '');
    return component('keeper', opts, g(g(body.join(''), { 'class': 'keeper-ink-silhouette' }), {
      'class': 'keeper-local', transform: 'translate(-120 -205)'
    }), {
      'class': classes,
      'data-pose': pose,
      'data-face': 'featureless',
      'data-dissolve': fmt(dissolve)
    });
  }

  function polar(cx, cy, radius, angle) {
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  }

  function gearPath(teeth, outerRadius, rootRadius) {
    teeth = clamp(integer(teeth, 16), 6, 40);
    var points = [];
    var step = Math.PI * 2 / teeth;
    for (var i = 0; i < teeth; i += 1) {
      var a = i * step - Math.PI / 2;
      points.push(polar(0, 0, rootRadius, a - step * 0.5));
      points.push(polar(0, 0, outerRadius, a - step * 0.28));
      points.push(polar(0, 0, outerRadius, a + step * 0.28));
      points.push(polar(0, 0, rootRadius, a + step * 0.5));
    }
    return 'M ' + points.map(function (point) { return fmt(point[0]) + ' ' + fmt(point[1]); }).join(' L ') + ' Z';
  }

  function normalizeGearType(type) {
    var key = String(type || 'generic').toLowerCase();
    var aliases = {
      windowgrid: 'window', 'window-grid': 'window', windowgear: 'window', library: 'window', mengfang: 'window', '窗格纹': 'window',
      soundwave: 'sound', waveform: 'sound', soundgear: 'sound', hall: 'sound', auditorium: 'sound', '声波纹': 'sound',
      blade: 'indicator', pointer: 'indicator', indicatorleafgear: 'indicator', bldg54: 'indicator', wusi: 'indicator', '指示叶片纹': 'indicator',
      drive: 'transmission', transmission3: 'transmission', transmissiongear: 'transmission', power: 'transmission', '传动三轮纹': 'transmission',
      nestedwindow: 'nested', 'nested-window': 'nested', nestedwindowgear: 'nested', frontyard: 'nested', '新旧窗格嵌套纹': 'nested',
      sign: 'signature', signaturegear: 'signature', alumni: 'signature', '签名刻痕纹': 'signature'
    };
    return aliases[key] || key;
  }

  function gearPattern(type, p) {
    var stroke = { fill: 'none', stroke: p.outline, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    var out = [];
    if (type === 'window') {
      out.push(rect(-33, -33, 66, 66, { fill: p.window, 'fill-opacity': 0.26, stroke: p.outline, 'stroke-width': 4 }));
      out.push(line(0, -33, 0, 33, stroke));
      out.push(line(-33, 0, 33, 0, stroke));
      out.push(rect(-23, -23, 18, 18, { fill: 'none', stroke: p.brass, 'stroke-width': 2 }));
    } else if (type === 'sound') {
      var heights = [22, 49, 35, 22];
      heights.forEach(function (height, i) {
        var x = -34 + i * 21;
        out.push(rect(x, -height / 2, 11, height, {
          rx: 4, fill: p.brass, stroke: p.outline, 'stroke-width': 3,
          'class': 'gear-sound-plate gear-note-' + (i + 1)
        }));
      });
      out.push(path('M -42 32 Q -28 22 -14 32 T 14 32 T 42 32', assign({}, stroke, { 'stroke-width': 2.5 })));
    } else if (type === 'indicator') {
      out.push(path('M -39 20 L 24 -39 L 41 -25 L -20 34 Z', { fill: p.brass, stroke: p.outline, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
      out.push(circle(-23, 20, 8, { fill: p.metal, stroke: p.outline, 'stroke-width': 3 }));
      out.push(line(-34, -28, 34, 28, assign({}, stroke, { opacity: 0.45 })));
    } else if (type === 'transmission') {
      out.push(path('M -26 17 L 17 -24 L 29 25 Z', assign({}, stroke, { 'stroke-width': 6 })));
      [[-27, 18, 16], [18, -24, 15], [29, 26, 13]].forEach(function (item) {
        out.push(circle(item[0], item[1], item[2], { fill: p.brass, stroke: p.outline, 'stroke-width': 4 }));
        out.push(circle(item[0], item[1], 4, { fill: p.outline }));
      });
    } else if (type === 'nested') {
      out.push(rect(-37, -34, 74, 68, { fill: p.window, 'fill-opacity': 0.2, stroke: p.outline, 'stroke-width': 4 }));
      out.push(line(-37, 0, 37, 0, stroke));
      out.push(line(0, -34, 0, 34, stroke));
      out.push(rect(-20, -21, 40, 42, { fill: p.paper, 'fill-opacity': 0.2, stroke: p.brass, 'stroke-width': 4 }));
      out.push(line(-20, -7, 20, -7, { stroke: p.brass, 'stroke-width': 3 }));
      out.push(line(-20, 8, 20, 8, { stroke: p.brass, 'stroke-width': 3 }));
    } else if (type === 'signature') {
      out.push(circle(0, 0, 41, { fill: 'none', stroke: p.outline, 'stroke-width': 2, opacity: 0.55 }));
      out.push(circle(0, 0, 25, { fill: 'none', stroke: p.brass, 'stroke-width': 2 }));
      for (var i = 0; i < 20; i += 1) {
        if (i === 18 || i === 19 || i === 0) continue; // 外圈留白：未签的位置。
        var a = -Math.PI / 2 + i * Math.PI * 2 / 20;
        var aPoint = polar(0, 0, 30, a);
        var bPoint = polar(0, 0, i % 2 ? 44 : 48, a + 0.035);
        out.push(line(aPoint[0], aPoint[1], bPoint[0], bPoint[1], {
          'class': 'gear-signature-stroke', stroke: p.outline, 'stroke-width': 3,
          'stroke-linecap': 'round'
        }));
      }
      out.push(path('M 31 -34 Q 43 -26 47 -12', { fill: 'none', stroke: p.brass, 'stroke-width': 2, 'stroke-dasharray': '3 5' }));
    } else {
      for (var j = 0; j < 8; j += 1) {
        var angle = j * Math.PI / 4;
        var start = polar(0, 0, 13, angle);
        var end = polar(0, 0, 43, angle);
        out.push(line(start[0], start[1], end[0], end[1], stroke));
      }
    }
    return out.join('');
  }

  /** 齿轮类型：window/sound/indicator/transmission/nested/signature/generic。 */
  function gear(type, opts) {
    opts = opts || {};
    var normalized = normalizeGearType(type);
    var p = paletteFrom(opts);
    var radius = clamp(number(opts.radius, 60), 16, 180);
    var teeth = integer(opts.teeth, normalized === 'signature' ? 18 : 16);
    var content = path(gearPath(teeth, radius, radius * 0.83), {
      'class': 'gear-teeth', fill: opts.fill || p.metal, stroke: p.outline,
      'stroke-width': Math.max(3, radius * 0.075), 'stroke-linejoin': 'round'
    });
    content += circle(0, 0, radius * 0.71, {
      'class': 'gear-face', fill: p.brass, 'fill-opacity': 0.3,
      stroke: p.outline, 'stroke-width': Math.max(2, radius * 0.04)
    });
    content += g(gearPattern(normalized, p), { transform: 'scale(' + fmt(radius / 64) + ')', 'class': 'gear-pattern' });
    content += circle(0, 0, Math.max(6, radius * 0.13), { 'class': 'gear-hub', fill: p.outline, stroke: p.brass, 'stroke-width': 2 });
    content += circle(0, 0, Math.max(2, radius * 0.045), { fill: p.paperLine, opacity: 0.65 });
    return component('gear', opts, content, {
      'class': 'pine-art art-gear gear--' + normalized + ' art-turn' + (opts.turning ? ' is-turning' : '') + (opts.className ? ' ' + opts.className : ''),
      'data-gear-type': normalized,
      'data-teeth': teeth
    });
  }

  function deviceGearSpec(state, side, fallback) {
    var gears = state.gears || state.slots || [];
    var value;
    if (Array.isArray(gears)) value = gears[side === 'left' ? 0 : 1];
    else if (isObject(gears)) value = gears[side];
    if (state[side + 'Gear'] !== undefined) value = state[side + 'Gear'];
    if (value === true) return { type: fallback };
    if (typeof value === 'string') return { type: value };
    if (isObject(value)) return assign({ type: fallback }, value);
    return null;
  }

  function memoryAlignment(state, side) {
    var value = state.memoryAligned !== undefined ? state.memoryAligned : state.memoriesAligned;
    if (value === true) return true;
    if (Array.isArray(value)) return side === 'left' ? !!value[0] : !!value[1];
    if (isObject(value)) return !!value[side];
    return false;
  }

  /** 刻轮装置。act=1 展示台，act=2 错位传动，act=3 树根共生。仅表现状态，不推进规则。 */
  function device(act, state, opts) {
    if (isObject(act)) {
      opts = state || opts;
      state = act;
      act = state.act || 1;
    }
    state = isObject(state) ? state : {};
    opts = opts || {};
    var actMatch = String(act).match(/[1-3]/);
    var chapter = clamp(integer(actMatch ? actMatch[0] : act, 1), 1, 3);
    var p = paletteFrom(assign({}, opts, { era: opts.era || (chapter === 1 ? '1933' : (chapter === 2 ? '1959' : '1988')) }));
    var defaults = chapter === 1 ? ['window', 'sound'] : (chapter === 2 ? ['indicator', 'transmission'] : ['nested', 'signature']);
    var left = deviceGearSpec(state, 'left', defaults[0]);
    var right = deviceGearSpec(state, 'right', defaults[1]);
    var repaired = chapter !== 2 || state.repaired === true || state.connectionRepaired === true;
    var leftMemory = chapter !== 3 || memoryAlignment(state, 'left');
    var rightMemory = chapter !== 3 || memoryAlignment(state, 'right');
    var amberValue = state.amber !== undefined ? state.amber : state.ringAmber;
    var hasAmber = amberValue === true || isObject(amberValue) || typeof amberValue === 'number';
    var ready = !!(left && right && hasAmber && repaired && leftMemory && rightMemory);
    var turning = state.turning === true || opts.turning === true;
    var back = [];
    var mechanics = [];
    var front = [];

    back.push(ellipse(320, 391, 295, 24, { fill: p.shadow, opacity: 0.22 }));
    if (chapter === 3) {
      back.push(g(
        path('M 18 391 C 86 353 94 304 143 280 C 178 262 170 221 205 194', { fill: 'none', stroke: p.outline, 'stroke-width': 25, 'stroke-linecap': 'round' }) +
        path('M 18 391 C 86 353 94 304 143 280 C 178 262 170 221 205 194', { fill: 'none', stroke: p.wood, 'stroke-width': 15, 'stroke-linecap': 'round' }) +
        path('M 613 390 C 562 350 578 300 518 276 C 486 261 506 211 470 190', { fill: 'none', stroke: p.outline, 'stroke-width': 25, 'stroke-linecap': 'round' }) +
        path('M 613 390 C 562 350 578 300 518 276 C 486 261 506 211 470 190', { fill: 'none', stroke: p.wood, 'stroke-width': 15, 'stroke-linecap': 'round' }) +
        path('M 118 394 C 196 369 268 388 320 361 C 389 330 451 387 542 383', { fill: 'none', stroke: p.wood, 'stroke-width': 14, 'stroke-linecap': 'round' }),
        { 'class': 'device-living-roots art-root-grow' }
      ));
    }
    back.push(path('M 44 89 Q 44 49 85 45 L 552 45 Q 589 49 589 86 L 589 303 L 44 303 Z', {
      'class': 'device-backboard', fill: chapter === 3 ? p.wood : p.wallAlt,
      stroke: p.outline, 'stroke-width': 9, 'stroke-linejoin': 'round'
    }));
    back.push(rect(62, 65, 507, 215, { rx: 16, fill: p.paper, 'fill-opacity': chapter === 3 ? 0.15 : 0.24, stroke: p.brass, 'stroke-width': 3 }));
    back.push(path('M 30 301 L 604 301 L 624 342 L 17 342 Z', {
      'class': 'device-tabletop', fill: p.wood, stroke: p.outline, 'stroke-width': 9, 'stroke-linejoin': 'round'
    }));
    if (chapter !== 3) {
      back.push(path('M 67 339 L 54 393 L 92 393 L 111 339 M 531 339 L 550 393 L 589 393 L 573 339', {
        'class': 'device-legs', fill: p.wood, stroke: p.outline, 'stroke-width': 8, 'stroke-linejoin': 'round'
      }));
    }

    if (chapter === 2) {
      mechanics.push(path(repaired ? 'M 150 119 L 310 89' : 'M 150 119 L 284 70 L 333 121', {
        'class': 'device-connection ' + (repaired ? 'is-repaired' : 'is-misaligned'),
        fill: 'none', stroke: repaired ? p.brass : p.wallAlt,
        'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'stroke-dasharray': repaired ? null : '11 7', 'data-connection': repaired ? 'repaired' : 'misaligned'
      }));
      if (!repaired) mechanics.push(circle(306, 91, 13, { fill: p.paper, stroke: p.outline, 'stroke-width': 5, 'class': 'device-broken-joint art-jolt' }));
    }

    function slot(side, spec, x, y, type, aligned) {
      var slotOut = [];
      slotOut.push(circle(x, y, 75, {
        'class': 'device-gear-slot device-slot-' + side, fill: p.shadow, 'fill-opacity': 0.2,
        stroke: aligned ? p.brass : p.outline, 'stroke-width': 5, 'stroke-dasharray': spec ? null : '8 7'
      }));
      if (chapter === 3) {
        var projection = [];
        if (side === 'left') {
          projection.push(rect(x - 43, y - 42, 86, 84, { fill: p.window, 'fill-opacity': 0.15, stroke: p.warm, 'stroke-width': 3 }));
          projection.push(line(x, y - 42, x, y + 42, { stroke: p.warm, 'stroke-width': 2 }));
          projection.push(line(x - 43, y, x + 43, y, { stroke: p.warm, 'stroke-width': 2 }));
        } else {
          for (var i = 0; i < 6; i += 1) {
            projection.push(line(x - 41, y - 34 + i * 13, x + 39 - (i % 3) * 8, y - 34 + i * 13, { stroke: p.warm, 'stroke-width': 3, 'stroke-linecap': 'round' }));
          }
        }
        slotOut.push(g(projection.join(''), { 'class': 'device-memory-projection art-project', opacity: aligned ? 0.75 : 0.18, 'data-aligned': aligned ? 'true' : 'false' }));
      }
      if (spec) {
        slotOut.push(gear(spec.type || type, {
          x: x, y: y, radius: number(spec.radius, 58), era: opts.era, palette: p,
          rotate: number(spec.rotate, 0), turning: turning,
          className: 'device-installed-gear device-installed-' + side
        }));
      } else {
        slotOut.push(g(gearPattern(normalizeGearType(type), p), {
          transform: 'translate(' + x + ' ' + y + ') scale(0.65)',
          'class': 'device-empty-slot-motif', opacity: 0.28
        }));
      }
      if (opts.interactive) {
        slotOut.push(circle(x, y, 78, { 'class': 'art-hit-area', fill: 'transparent', 'pointer-events': 'all', 'data-hit': 'device-' + side }));
      }
      return g(slotOut.join(''), { 'class': 'device-slot-group', 'data-slot': side, 'data-filled': spec ? 'true' : 'false' });
    }

    mechanics.push(slot('left', left, 150, 183, defaults[0], leftMemory));
    mechanics.push(slot('right', right, 310, 151, defaults[1], rightMemory));

    mechanics.push(gear('generic', {
      x: 91, y: 87, radius: 34, teeth: 12, palette: p,
      turning: turning, className: 'device-original-gear', opacity: 0.88
    }));
    mechanics.push(path('M 91 87 L 150 183 M 91 87 L 310 151', {
      fill: 'none', stroke: p.outline, 'stroke-width': 4, opacity: 0.38, 'stroke-dasharray': '5 6'
    }));

    front.push(ellipse(445, 244, 96, 78, {
      'class': 'device-amber-recess', fill: p.heart, 'fill-opacity': 0.38,
      stroke: p.brass, 'stroke-width': 5, 'stroke-dasharray': hasAmber ? null : '7 6'
    }));
    front.push(ellipse(445, 244, 82, 64, { fill: 'none', stroke: p.outline, 'stroke-width': 3, opacity: 0.8 }));
    if (hasAmber) {
      var amberData = amberValue === true || typeof amberValue === 'number' ? { rings: typeof amberValue === 'number' ? amberValue : (state.rings || chapter - 1) } : amberValue;
      front.push(amber(amberData, {
        x: 445, y: 240, scale: 0.66, palette: p,
        selected: turning, className: 'device-embedded-amber'
      }));
    }
    front.push(g(
      path('M 430 69 L 465 69 L 458 157 L 446 182 L 438 156 Z', {
        'class': 'device-needle-carriage', fill: p.metal, stroke: p.outline, 'stroke-width': 6, 'stroke-linejoin': 'round'
      }) +
      line(446, 153, 445, 190, { 'class': 'device-needle', stroke: p.heart, 'stroke-width': 5, 'stroke-linecap': 'round' }) +
      circle(445, 190, 4, { fill: p.brass }),
      { 'class': 'device-needle-group ' + (turning && ready ? 'is-cutting art-carve' : ''), 'data-cutting': turning && ready ? 'true' : 'false' }
    ));
    front.push(g(
      path('M 548 156 L 583 194 L 568 237', { fill: 'none', stroke: p.outline, 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) +
      path('M 548 156 L 583 194 L 568 237', { fill: 'none', stroke: p.brass, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) +
      circle(548, 156, 14, { fill: p.metal, stroke: p.outline, 'stroke-width': 5 }) +
      rect(552, 230, 35, 18, { rx: 8, fill: p.wood, stroke: p.outline, 'stroke-width': 5, transform: 'rotate(12 570 239)' }),
      { 'class': 'device-handle art-turn-handle ' + (turning ? 'is-turning' : ''), 'data-ready': ready ? 'true' : 'false' }
    ));
    if (turning && ready) {
      front.push(path('M 85 316 Q 183 295 260 316 T 452 316', {
        'class': 'device-memory-echo art-project', fill: 'none', stroke: p.warm,
        'stroke-width': 5, opacity: 0.65, 'stroke-dasharray': '19 12'
      }));
    }
    var deviceLocal = g(back.join(''), { 'class': 'device-back' }) +
      g(mechanics.join(''), { 'class': 'device-mechanics' }) +
      g(front.join(''), { 'class': 'device-front' });
    return component('device', opts, g(deviceLocal, { 'class': 'device-local', transform: 'translate(-320 -210)' }), {
      'class': 'pine-art art-device device--act' + chapter + (turning ? ' is-turning' : '') + (opts.className ? ' ' + opts.className : ''),
      'data-act': chapter,
      'data-ready': ready ? 'true' : 'false',
      'data-gears': (left ? 1 : 0) + (right ? 1 : 0),
      'data-amber': hasAmber ? 'inserted' : 'empty'
    });
  }

  function frontWindow(x, y, width, height, p, arched, extraClass) {
    var out = [];
    var shape;
    if (arched) {
      shape = 'M ' + x + ' ' + (y + height) + ' L ' + x + ' ' + (y + height * 0.38) + ' Q ' + (x + width / 2) + ' ' + (y - height * 0.18) + ' ' + (x + width) + ' ' + (y + height * 0.38) + ' L ' + (x + width) + ' ' + (y + height) + ' Z';
      out.push(path(shape, { fill: p.window, 'fill-opacity': 0.68, stroke: p.outline, 'stroke-width': 4 }));
    } else {
      out.push(rect(x, y, width, height, { fill: p.window, 'fill-opacity': 0.68, stroke: p.outline, 'stroke-width': 4 }));
    }
    out.push(line(x + width / 2, y + 3, x + width / 2, y + height - 3, { stroke: p.outline, 'stroke-width': 2.5 }));
    out.push(line(x + 3, y + height / 2, x + width - 3, y + height / 2, { stroke: p.outline, 'stroke-width': 2.5 }));
    return g(out.join(''), { 'class': 'building-window art-window ' + (extraClass || '') });
  }

  function windowGrid(config, p) {
    var out = [];
    var cols = Math.max(1, integer(config.cols, 3));
    var rows = Math.max(1, integer(config.rows, 2));
    var gapX = number(config.gapX, 14);
    var gapY = number(config.gapY, 15);
    var width = number(config.width, 34);
    var height = number(config.height, 38);
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        out.push(frontWindow(config.x + col * (width + gapX), config.y + row * (height + gapY), width, height, p, config.arched, config.className));
      }
    }
    return out.join('');
  }

  function door(x, y, width, height, p, arched) {
    var out = [];
    if (arched) {
      out.push(path('M ' + x + ' ' + (y + height) + ' L ' + x + ' ' + (y + 25) + ' Q ' + (x + width / 2) + ' ' + (y - 18) + ' ' + (x + width) + ' ' + (y + 25) + ' L ' + (x + width) + ' ' + (y + height) + ' Z', {
        fill: p.wood, stroke: p.outline, 'stroke-width': 6
      }));
    } else {
      out.push(rect(x, y, width, height, { fill: p.wood, stroke: p.outline, 'stroke-width': 6 }));
    }
    out.push(line(x + width / 2, y + 18, x + width / 2, y + height, { stroke: p.brass, 'stroke-width': 3, opacity: 0.65 }));
    out.push(circle(x + width * 0.64, y + height * 0.56, 3, { fill: p.brass }));
    return g(out.join(''), { 'class': 'building-door art-interactive', 'data-building-entry': 'true' });
  }

  function normalizeBuilding(id) {
    var key = String(id || 'library').toLowerCase().replace(/[\s_]+/g, '-');
    var aliases = {
      mengfang: 'library', 'mengfang-library': 'library', '孟芳图书馆': 'library',
      auditorium: 'hall', 'great-hall': 'hall', '大礼堂': 'hall',
      gymnasium: 'gym', '体育馆': 'gym',
      '54': 'bldg54', wusi: 'bldg54', 'wu-si': 'bldg54', '五四楼': 'bldg54',
      '动力楼': 'power', powerhouse: 'power',
      '55': 'bldg55', '五五楼': 'bldg55',
      'front-yard': 'frontyard', qiangongyuan: 'frontyard', 'qian-gong-yuan': 'frontyard', '前工院': 'frontyard',
      'alumni-hall': 'alumni', '校友会堂': 'alumni',
      'wu-jianxiong': 'memorial', 'chien-shiung-wu': 'memorial', '吴健雄纪念馆': 'memorial'
    };
    return aliases[key] || key;
  }

  function buildingTopDown(id, p) {
    if (id === 'hall') {
      return ellipse(240, 154, 184, 113, { fill: p.roof, stroke: p.outline, 'stroke-width': 8 }) +
        ellipse(240, 145, 72, 66, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 6 }) +
        rect(210, 248, 60, 38, { fill: p.wood, stroke: p.outline, 'stroke-width': 5, 'class': 'building-map-entry' });
    }
    var footprint = id === 'frontyard' ? 'M 48 60 L 319 60 L 319 99 L 430 99 L 430 260 L 48 260 Z' :
      (id === 'gym' ? 'M 39 92 L 240 35 L 441 92 L 421 261 L 59 261 Z' : 'M 43 57 L 437 57 L 437 260 L 43 260 Z');
    var out = path(footprint, { fill: p.roof, stroke: p.outline, 'stroke-width': 9, 'stroke-linejoin': 'round', 'class': 'building-roof' });
    out += path('M 68 82 L 412 82 L 412 235 L 68 235 Z', { fill: p.wallAlt, 'fill-opacity': 0.34, stroke: p.paperLine, 'stroke-width': 4 });
    if (id === 'library' || id === 'frontyard') {
      out += rect(191, 79, 98, 159, { fill: p.wall, 'fill-opacity': 0.4, stroke: p.outline, 'stroke-width': 4 });
      out += line(240, 82, 240, 236, { stroke: p.outline, 'stroke-width': 3 });
    } else {
      for (var i = 0; i < 5; i += 1) out += line(91 + i * 72, 87, 91 + i * 72, 230, { stroke: p.outline, 'stroke-width': 3, opacity: 0.5 });
    }
    out += rect(210, 248, 60, 31, { fill: p.wood, stroke: p.outline, 'stroke-width': 5, 'class': 'building-map-entry' });
    return out;
  }

  function buildingFacade(id, p) {
    var out = [];
    out.push(ellipse(240, 298, 225, 15, { fill: p.shadow, opacity: 0.18 }));
    if (id === 'library') {
      out.push(rect(52, 111, 376, 175, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 38 113 L 240 42 L 442 113 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8, 'stroke-linejoin': 'round' }));
      out.push(rect(174, 104, 132, 182, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 6 }));
      out.push(path('M 164 111 L 240 69 L 316 111 Z', { fill: p.paperLine, stroke: p.outline, 'stroke-width': 6 }));
      out.push(windowGrid({ x: 76, y: 141, cols: 2, rows: 2, width: 39, height: 45, gapX: 50, gapY: 22, arched: true }, p));
      out.push(windowGrid({ x: 326, y: 141, cols: 2, rows: 2, width: 39, height: 45, gapX: 16, gapY: 22, arched: true }, p));
      [185, 219, 261, 295].forEach(function (x) { out.push(rect(x, 130, 13, 151, { fill: p.paperLine, stroke: p.outline, 'stroke-width': 3 })); });
      out.push(door(219, 190, 45, 93, p, true));
    } else if (id === 'hall') {
      out.push(rect(62, 132, 356, 153, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 139 131 C 143 42 337 42 341 131 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8 }));
      out.push(rect(159, 105, 162, 42, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 6 }));
      out.push(path('M 225 51 L 240 23 L 255 51', { fill: p.brass, stroke: p.outline, 'stroke-width': 5 }));
      out.push(path('M 47 139 L 240 95 L 433 139', { fill: 'none', stroke: p.outline, 'stroke-width': 8, 'stroke-linejoin': 'round' }));
      [91, 135, 179, 301, 345, 389].forEach(function (x) { out.push(rect(x, 153, 16, 127, { fill: p.paperLine, stroke: p.outline, 'stroke-width': 3 })); });
      out.push(door(214, 183, 54, 100, p, true));
      out.push(frontWindow(235, 109, 16, 26, p, true));
    } else if (id === 'gym') {
      out.push(rect(53, 111, 374, 175, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 32 115 L 240 39 L 448 115 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 9, 'stroke-linejoin': 'round' }));
      out.push(path('M 208 83 L 240 61 L 272 83', { fill: p.paperLine, stroke: p.outline, 'stroke-width': 4 }));
      out.push(windowGrid({ x: 80, y: 147, cols: 2, rows: 1, width: 52, height: 72, gapX: 30, arched: true }, p));
      out.push(windowGrid({ x: 310, y: 147, cols: 2, rows: 1, width: 52, height: 72, gapX: 16, arched: true }, p));
      out.push(door(211, 178, 60, 105, p, true));
      for (var gy = 132; gy < 276; gy += 24) out.push(line(57, gy, 423, gy, { stroke: p.outline, 'stroke-width': 1.5, opacity: 0.22 }));
    } else if (id === 'bldg54') {
      out.push(rect(43, 62, 394, 224, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 34 63 L 446 63 L 426 43 L 56 43 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 7 }));
      out.push(rect(193, 78, 94, 208, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 5 }));
      out.push(windowGrid({ x: 67, y: 89, cols: 3, rows: 4, width: 29, height: 30, gapX: 15, gapY: 15 }, p));
      out.push(windowGrid({ x: 310, y: 89, cols: 3, rows: 4, width: 29, height: 30, gapX: 9, gapY: 15 }, p));
      out.push(windowGrid({ x: 211, y: 91, cols: 2, rows: 3, width: 24, height: 33, gapX: 11, gapY: 17 }, p));
      out.push(door(215, 229, 51, 55, p, false));
    } else if (id === 'power') {
      out.push(rect(58, 111, 365, 175, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 46 113 L 113 69 L 162 111 L 224 65 L 277 111 L 339 70 L 434 113 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8, 'stroke-linejoin': 'round' }));
      out.push(rect(351, 35, 40, 83, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 7 }));
      out.push(rect(343, 29, 56, 15, { fill: p.roof, stroke: p.outline, 'stroke-width': 5 }));
      out.push(windowGrid({ x: 83, y: 141, cols: 3, rows: 1, width: 42, height: 48, gapX: 17 }, p));
      out.push(rect(90, 218, 135, 53, { fill: p.metal, stroke: p.outline, 'stroke-width': 6 }));
      for (var vx = 103; vx < 215; vx += 18) out.push(line(vx, 224, vx, 265, { stroke: p.outline, 'stroke-width': 3 }));
      out.push(door(284, 180, 70, 103, p, false));
      out.push(circle(388, 170, 23, { fill: p.metal, stroke: p.outline, 'stroke-width': 5, 'class': 'building-vent art-turn' }));
      out.push(line(388, 149, 388, 191, { stroke: p.outline, 'stroke-width': 3 }));
      out.push(line(367, 170, 409, 170, { stroke: p.outline, 'stroke-width': 3 }));
    } else if (id === 'bldg55') {
      out.push(rect(28, 77, 424, 209, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 20 78 L 460 78 L 443 54 L 38 54 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 7 }));
      out.push(windowGrid({ x: 50, y: 98, cols: 8, rows: 3, width: 31, height: 35, gapX: 17, gapY: 30 }, p));
      out.push(line(31, 151, 449, 151, { stroke: p.outline, 'stroke-width': 6 }));
      out.push(line(31, 216, 449, 216, { stroke: p.outline, 'stroke-width': 6 }));
      out.push(rect(196, 212, 88, 74, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 5 }));
      out.push(door(218, 226, 45, 58, p, false));
    } else if (id === 'frontyard') {
      out.push(rect(53, 83, 255, 203, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(rect(308, 119, 120, 167, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 45 84 L 316 84 L 298 62 L 65 62 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 7 }));
      out.push(path('M 301 120 L 435 120 L 422 99 L 316 99 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 6 }));
      out.push(windowGrid({ x: 78, y: 111, cols: 3, rows: 3, width: 47, height: 39, gapX: 24, gapY: 18 }, p));
      out.push(windowGrid({ x: 329, y: 143, cols: 2, rows: 2, width: 31, height: 43, gapX: 17, gapY: 19 }, p));
      out.push(rect(67, 99, 170, 160, { fill: 'none', stroke: p.brass, 'stroke-width': 3, 'class': 'building-old-window-shadow art-project', opacity: 0.45 }));
      out.push(door(237, 210, 51, 73, p, false));
    } else if (id === 'alumni') {
      out.push(rect(58, 106, 364, 180, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 43 109 L 240 48 L 437 109 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8 }));
      out.push(rect(85, 137, 130, 116, { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 5, 'class': 'building-memory-wall' }));
      for (var ry = 151; ry < 240; ry += 15) {
        out.push(line(98, ry, 199 - ((ry / 15) % 3) * 12, ry, { stroke: p.paperLine, 'stroke-width': 3, opacity: 0.75 }));
      }
      out.push(frontWindow(331, 142, 54, 62, p, true));
      out.push(door(237, 174, 60, 109, p, true));
      out.push(path('M 219 142 L 240 117 L 261 142', { fill: p.brass, stroke: p.outline, 'stroke-width': 4 }));
    } else if (id === 'memorial') {
      out.push(rect(48, 144, 384, 140, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 35 145 L 445 145 L 411 115 L 69 115 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8 }));
      out.push(rect(91, 164, 96, 81, { fill: p.window, 'fill-opacity': 0.5, stroke: p.outline, 'stroke-width': 5 }));
      out.push(rect(293, 164, 96, 81, { fill: p.window, 'fill-opacity': 0.5, stroke: p.outline, 'stroke-width': 5 }));
      out.push(line(139, 165, 139, 244, { stroke: p.outline, 'stroke-width': 3 }));
      out.push(line(341, 165, 341, 244, { stroke: p.outline, 'stroke-width': 3 }));
      out.push(door(213, 164, 56, 119, p, false));
      /* 纪念馆只画真实展陈建筑，不添加虚构人物、齿轮或物证。 */
    } else {
      out.push(rect(57, 92, 366, 194, { fill: p.wall, stroke: p.outline, 'stroke-width': 8 }));
      out.push(path('M 39 96 L 240 42 L 441 96 Z', { fill: p.roof, stroke: p.outline, 'stroke-width': 8 }));
      out.push(windowGrid({ x: 88, y: 132, cols: 5, rows: 2, width: 42, height: 43, gapX: 23, gapY: 25 }, p));
      out.push(door(216, 202, 50, 81, p, false));
    }
    out.push(path('M 44 286 L 436 286 L 456 302 L 25 302 Z', { fill: p.paperLine, stroke: p.outline, 'stroke-width': 6, 'class': 'building-steps' }));
    return out.join('');
  }

  /** 建筑正面组件；opts.topDown=true 时为俯视屋顶。label=true 才显示名称。 */
  function building(id, opts) {
    opts = opts || {};
    var normalized = normalizeBuilding(id);
    var p = paletteFrom(opts);
    var content = opts.topDown ? buildingTopDown(normalized, p) : buildingFacade(normalized, p);
    if (opts.label) {
      content += text(BUILDING_NAMES[normalized] || String(id || ''), 240, opts.topDown ? 326 : 337, {
        'class': 'building-label', fill: p.ink, 'font-size': 20,
        'font-family': 'system-ui, sans-serif', 'text-anchor': 'middle', 'letter-spacing': 2
      });
    }
    if (opts.interactive) {
      content += rect(207, 224, 66, 68, {
        'class': 'art-hit-area building-entry-hit', fill: 'transparent',
        'pointer-events': 'all', 'data-hit': 'building-' + normalized
      });
    }
    return component('building', opts, g(content, { 'class': 'building-local', transform: 'translate(-240 -170)' }), {
      'class': 'pine-art art-building building--' + normalized + (opts.topDown ? ' is-top-down' : ' is-front') + (opts.completed ? ' is-completed' : '') + (opts.growing ? ' art-grow' : '') + (opts.className ? ' ' + opts.className : ''),
      'data-building': normalized,
      'data-view': opts.topDown ? 'top-down' : 'front'
    });
  }

  function filterLens(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var lens = 'M -28 -23 C -12 -35 15 -32 28 -17 L 22 -7 L 31 -1 C 34 18 16 33 -4 32 C -26 31 -37 11 -32 -8 Z';
    return component('lens', opts,
      path(lens, { fill: '#565747', 'fill-opacity': 0.82, stroke: p.outline, 'stroke-width': 5, 'stroke-linejoin': 'round', 'class': 'special-lens-glass' }) +
      path('M -22 -17 C -8 -26 8 -25 18 -19', { fill: 'none', stroke: '#838174', 'stroke-width': 2, opacity: 0.5 }) +
      circle(0, 0, 37, { fill: 'none', stroke: p.brass, 'stroke-width': 3, 'stroke-dasharray': opts.framed === false ? null : '6 4', 'class': 'special-lens-frame' }), {
      'class': 'pine-art art-lens special-lens' + (opts.className ? ' ' + opts.className : ''),
      'data-notch': 'upper-right'
    });
  }

  function cameraBag(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var out = [];
    out.push(path('M 18 28 Q 22 1 52 2 L 91 2 Q 119 5 123 30', { fill: 'none', stroke: p.outline, 'stroke-width': 10, 'stroke-linecap': 'round' }));
    out.push(rect(0, 25, 140, 91, { rx: 15, fill: p.wood, stroke: p.outline, 'stroke-width': 7 }));
    if (opts.open) {
      out.push(path('M 5 37 L 29 -4 L 117 2 L 136 38 Z', { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 6, 'class': 'camera-bag-open-flap' }));
      out.push(rect(25, 46, 91, 50, { rx: 5, fill: p.heart, opacity: 0.55 }));
    } else {
      out.push(path('M 3 38 Q 67 67 137 38 L 131 75 Q 69 95 8 74 Z', { fill: p.wallAlt, stroke: p.outline, 'stroke-width': 5, 'class': 'camera-bag-flap' }));
    }
    out.push(rect(57, 69, 27, 22, { rx: 3, fill: p.brass, stroke: p.outline, 'stroke-width': 4, 'class': 'camera-bag-clasp' }));
    if (opts.letter) {
      out.push(path('M 86 15 L 125 20 L 118 66 L 80 60 Z', { fill: p.paperLine, stroke: p.outline, 'stroke-width': 3, 'class': 'camera-bag-letter', 'data-private-letter': 'player-only' }));
      out.push(line(89, 30, 116, 34, { stroke: p.ink, 'stroke-width': 2, opacity: 0.5 }));
    }
    if (opts.interactive) out.push(rect(-8, -10, 156, 137, { fill: 'transparent', 'class': 'art-hit-area', 'pointer-events': 'all', 'data-hit': 'camera-bag' }));
    return component('camera-bag', opts, out.join(''), {
      'class': 'pine-art art-camera-bag ' + (opts.open ? 'is-open' : 'is-closed') + (opts.className ? ' ' + opts.className : '')
    });
  }

  function oldPhoto(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var content = rect(-46, -59, 92, 118, { fill: p.paperLine, stroke: p.outline, 'stroke-width': 5, transform: 'rotate(-5)' });
    content += rect(-36, -48, 72, 78, { fill: p.sky, stroke: p.outline, 'stroke-width': 3, transform: 'rotate(-5)' });
    content += path('M -8 22 L -3 -30 L 5 -42 L 9 21', { fill: p.wood, stroke: p.outline, 'stroke-width': 4, transform: 'rotate(-5)' });
    content += circle(19, 3, 5, { fill: p.ink, transform: 'rotate(-5)' });
    content += path('M 18 8 L 15 24 L 23 24 Z', { fill: p.ink, transform: 'rotate(-5)', 'class': 'old-photo-figure' });
    return component('photo', opts, content, { 'class': 'pine-art art-photo old-photo' + (opts.className ? ' ' + opts.className : '') });
  }

  /** 序章相机、三脚架与相机包。filterInstalled 只改变镜片，不自行生成守忆者。 */
  function camera(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var installed = opts.filterInstalled === true || opts.specialLens === true || opts.filter === true;
    var out = [];
    out.push(ellipse(145, 398, 125, 15, { fill: p.shadow, opacity: 0.2 }));
    out.push(g(
      line(132, 181, 58, 388, { stroke: p.outline, 'stroke-width': 13, 'stroke-linecap': 'round' }) +
      line(132, 181, 58, 388, { stroke: p.metal, 'stroke-width': 7, 'stroke-linecap': 'round' }) +
      line(147, 181, 153, 391, { stroke: p.outline, 'stroke-width': 13, 'stroke-linecap': 'round' }) +
      line(147, 181, 153, 391, { stroke: p.metal, 'stroke-width': 7, 'stroke-linecap': 'round' }) +
      line(159, 181, 232, 388, { stroke: p.outline, 'stroke-width': 13, 'stroke-linecap': 'round' }) +
      line(159, 181, 232, 388, { stroke: p.metal, 'stroke-width': 7, 'stroke-linecap': 'round' }) +
      line(86, 303, 203, 303, { stroke: p.outline, 'stroke-width': 7, 'stroke-linecap': 'round' }),
      { 'class': 'camera-tripod' }
    ));
    out.push(rect(127, 164, 31, 39, { rx: 5, fill: p.metal, stroke: p.outline, 'stroke-width': 6 }));
    out.push(path('M 55 65 L 88 33 L 169 33 L 194 66 L 232 78 L 232 172 L 49 172 L 42 93 Z', {
      'class': 'camera-body', fill: p.metal, stroke: p.outline, 'stroke-width': 8, 'stroke-linejoin': 'round'
    }));
    out.push(rect(64, 78, 63, 34, { rx: 5, fill: p.heart, stroke: p.outline, 'stroke-width': 5, 'class': 'camera-viewfinder' }));
    out.push(rect(73, 85, 44, 18, { fill: p.window, opacity: 0.55 }));
    out.push(circle(164, 123, 57, { fill: p.heart, stroke: p.outline, 'stroke-width': 8, 'class': 'camera-normal-lens' }));
    out.push(circle(164, 123, 39, { fill: '#555b57', stroke: p.brass, 'stroke-width': 5 }));
    out.push(circle(164, 123, 21, { fill: '#3f4441', stroke: p.outline, 'stroke-width': 3 }));
    out.push(rect(109, 68, 110, 111, {
      rx: 9, fill: 'none', stroke: installed ? p.brass : p.outline,
      'stroke-width': 5, 'stroke-dasharray': installed ? null : '9 6',
      'class': 'camera-filter-frame ' + (installed ? 'is-filled' : 'is-empty'), 'data-filter': installed ? 'installed' : 'empty'
    }));
    if (installed) {
      out.push(filterLens({ x: 164, y: 123, scale: 0.9, framed: false, palette: p, className: 'camera-installed-special-lens' }));
    }
    out.push(circle(211, 56, 10, { fill: p.brass, stroke: p.outline, 'stroke-width': 4, 'class': 'camera-shutter' }));
    if (opts.bag !== false) {
      out.push(cameraBag({ x: 238, y: 286, scale: 0.82, open: opts.openBag === true, letter: opts.letter === true, interactive: opts.interactive === true, palette: p }));
    }
    if (opts.photo) out.push(oldPhoto({ x: 266, y: 251, scale: 0.65, rotate: 9, palette: p }));
    if (opts.interactive) {
      out.push(rect(35, 24, 210, 166, { fill: 'transparent', 'class': 'art-hit-area camera-hit', 'pointer-events': 'all', 'data-hit': 'camera' }));
    }
    return component('camera', opts, g(out.join(''), { 'class': 'camera-local', transform: 'translate(-155 -205)' }), {
      'class': 'pine-art art-camera ' + (installed ? 'has-special-lens' : 'needs-special-lens') + (opts.className ? ' ' + opts.className : ''),
      'data-filter': installed ? 'installed' : 'empty',
      'data-bag': opts.bag === false ? 'absent' : 'present'
    });
  }

  /** 新芽：只有 opts.vivid === true 时使用全篇唯一真正饱和的绿色。 */
  function sprout(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var vivid = opts.vivid === true;
    var leaf = vivid ? VIVID_SPROUT : p.foliage;
    var out = [];
    if (opts.soil) {
      out.push(path('M -74 4 Q -41 -20 0 -11 Q 43 -22 79 5 Q 34 23 -12 19 Q -48 21 -74 4 Z', {
        fill: opts.watered ? p.bark : p.ground, stroke: p.outline, 'stroke-width': 5, 'class': opts.watered ? 'sprout-soil is-watered' : 'sprout-soil is-dry'
      }));
      if (!opts.watered) out.push(path('M -46 4 L -30 -3 L -17 5 M 25 2 L 39 -5 L 52 2', { fill: 'none', stroke: p.outline, 'stroke-width': 2.5, opacity: 0.55 }));
    }
    if (opts.crack) {
      out.push(path('M -8 10 L -2 -8 L -9 -23 L 2 -38 L 7 -17 L 2 -4 L 10 11 Z', { fill: p.heart, 'class': 'sprout-crack', 'data-persistent-wound': 'true' }));
    }
    if (opts.support) {
      out.push(path('M -32 5 L -24 -95 L -51 -129 M -24 -95 L 7 -128', {
        fill: 'none', stroke: p.outline, 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'sprout-y-support-outline'
      }));
      out.push(path('M -32 5 L -24 -95 L -51 -129 M -24 -95 L 7 -128', {
        fill: 'none', stroke: p.wood, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'sprout-y-support'
      }));
    }
    out.push(path('M 0 2 C -3 -28 7 -58 1 -96', {
      fill: 'none', stroke: p.outline, 'stroke-width': vivid ? 9 : 8, 'stroke-linecap': 'round', 'class': 'sprout-stem-outline art-grow'
    }));
    out.push(path('M 0 2 C -3 -28 7 -58 1 -96', {
      fill: 'none', stroke: leaf, 'stroke-width': vivid ? 5 : 4, 'stroke-linecap': 'round', 'class': 'sprout-stem art-grow'
    }));
    out.push(path('M 2 -66 C -18 -94 -50 -92 -57 -68 C -38 -51 -14 -51 2 -66 Z', {
      fill: leaf, stroke: p.outline, 'stroke-width': 4, 'stroke-linejoin': 'round', 'class': 'sprout-leaf sprout-leaf-left art-sway'
    }));
    out.push(path('M 2 -83 C 20 -111 52 -109 59 -84 C 41 -66 18 -66 2 -83 Z', {
      fill: leaf, stroke: p.outline, 'stroke-width': 4, 'stroke-linejoin': 'round', 'class': 'sprout-leaf sprout-leaf-right art-sway'
    }));
    if (opts.grown) {
      out.push(path('M 1 -95 C -12 -118 -7 -139 7 -148 C 22 -127 18 -106 1 -95 Z', {
        fill: leaf, stroke: p.outline, 'stroke-width': 4, 'class': 'sprout-leaf sprout-leaf-new art-grow'
      }));
    }
    out.push(path('M -43 -73 Q -22 -72 -4 -65 M 47 -87 Q 26 -84 6 -81', {
      fill: 'none', stroke: vivid ? '#19794e' : p.bark, 'stroke-width': 2, opacity: 0.65, 'class': 'sprout-leaf-veins'
    }));
    return component('sprout', opts, out.join(''), {
      'class': 'pine-art art-sprout ' + (vivid ? 'is-vivid art-new-life' : 'is-muted') + (opts.className ? ' ' + opts.className : ''),
      'data-vivid': vivid ? 'true' : 'false',
      'data-color-role': vivid ? 'unique-saturated-green' : 'restrained-foliage'
    });
  }

  function wateringCan(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var content = path('M 18 32 Q -8 33 -12 63 L -8 111 Q 30 127 67 108 L 70 49 Q 55 30 18 32 Z', { fill: p.metal, stroke: p.outline, 'stroke-width': 6 });
    content += path('M 66 55 L 117 24 L 129 38 L 74 84 Z', { fill: p.metal, stroke: p.outline, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    content += path('M 118 22 L 143 25 L 145 43 L 128 46 Z', { fill: p.brass, stroke: p.outline, 'stroke-width': 5 });
    content += path('M 3 47 C -41 42 -42 104 -6 101', { fill: 'none', stroke: p.outline, 'stroke-width': 9, 'stroke-linecap': 'round' });
    content += ellipse(30, 34, 25, 8, { fill: p.heart, stroke: p.outline, 'stroke-width': 4 });
    return component('watering-can', opts, content, { 'class': 'pine-art art-watering-can' + (opts.className ? ' ' + opts.className : '') });
  }

  function supportWood(opts) {
    opts = opts || {};
    var p = paletteFrom(opts);
    var content = path('M 0 100 L 7 -45 L -37 -91 M 7 -45 L 49 -89', { fill: 'none', stroke: p.outline, 'stroke-width': 19, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    content += path('M 0 100 L 7 -45 L -37 -91 M 7 -45 L 49 -89', { fill: 'none', stroke: p.wood, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'support-wood-y' });
    content += path('M -10 -15 L 21 -20', { stroke: p.brass, 'stroke-width': 7, 'stroke-linecap': 'round', 'class': 'support-wood-binding' });
    return component('support', opts, content, { 'class': 'pine-art art-support support-wood' + (opts.className ? ' ' + opts.className : '') });
  }

  function hitArea(x, y, width, height, opts) {
    opts = opts || {};
    return rect(x, y, Math.max(44, width), Math.max(44, height), {
      id: opts.id,
      'class': 'art-hit-area' + (opts.className ? ' ' + opts.className : ''),
      fill: 'transparent', stroke: opts.debug ? '#8f7950' : 'none',
      'stroke-dasharray': opts.debug ? '4 3' : null,
      'pointer-events': 'all', 'data-hit': opts.hitId || opts.id || 'interactive',
      'aria-label': opts.label,
      role: opts.label ? 'button' : null,
      tabindex: opts.focusable ? 0 : null
    });
  }

  var API = {
    version: '1.0.0',
    width: WIDTH,
    height: HEIGHT,
    viewBox: '0 0 1280 720',
    palettes: PALETTES,
    palette: palette,
    scene: scene,
    pine: pine,
    amber: amber,
    keeper: keeper,
    gear: gear,
    device: device,
    building: building,
    camera: camera,
    sprout: sprout,
    filterLens: filterLens,
    lens: filterLens,
    cameraBag: cameraBag,
    oldPhoto: oldPhoto,
    wateringCan: wateringCan,
    supportWood: supportWood,
    helpers: {
      esc: esc,
      attrs: attrs,
      tag: tag,
      emptyTag: emptyTag,
      g: g,
      group: g,
      path: path,
      rect: rect,
      circle: circle,
      ellipse: ellipse,
      line: line,
      polygon: polygon,
      polyline: polyline,
      text: text,
      image: image,
      use: use,
      clamp: clamp,
      transform: transform,
      localHref: localHref,
      safeId: safeId,
      smoothClosed: smoothClosed,
      organicRing: organicRing,
      gearPath: gearPath,
      frontWindow: frontWindow,
      windowGrid: windowGrid,
      door: door,
      hitArea: hitArea,
      paperGrain: paperGrain
    },
    /* 常用工具也直接导出，便于经典脚本少写一层。 */
    esc: esc,
    attrs: attrs,
    tag: tag,
    g: g,
    path: path,
    rect: rect,
    circle: circle,
    ellipse: ellipse,
    line: line,
    polygon: polygon,
    polyline: polyline,
    text: text,
    image: image,
    use: use,
    hitArea: hitArea,
    gearPath: gearPath,
    organicRing: organicRing,
    smoothClosed: smoothClosed,
    transform: transform,
    localHref: localHref
  };

  root.PineArt = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)));
