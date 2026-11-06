(function () {
  'use strict';

  var canvas = document.getElementById('ghost-fibers');
  if (!canvas) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });

  function renderFallback() {
    var context = canvas.getContext('2d');
    if (!context) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    var width = Math.max(1, window.innerWidth);
    var height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    for (var ribbon = 0; ribbon < 3; ribbon += 1) {
      for (var fiber = 0; fiber < 34; fiber += 1) {
        var v = fiber / 33 * 2 - 1;
        for (var bead = 0; bead < 58; bead += 1) {
          var s = bead / 57 * 2.7 - 1.35;
          var phase = ribbon * 2.3;
          var twist = s * 7.6 + phase;
          var x = s;
          var y = Math.sin(s * 3.4 + phase) * 0.14 + Math.cos(twist) * v * 0.35;
          y += ribbon === 1 ? -0.46 : ribbon === 2 ? 0.42 : 0;
          var rx = x * 0.95 - y * 0.31;
          var ry = x * 0.31 + y * 0.95;
          var px = width * (0.5 + rx * 0.38);
          var py = height * (0.5 + ry * 0.52);
          var alpha = 0.05 + Math.pow(1 - Math.abs(Math.cos(twist)), 4) * 0.14;
          context.fillStyle = 'rgba(228,223,241,' + alpha.toFixed(3) + ')';
          context.fillRect(px, py, 1.2, 1.2);
        }
      }
    }
  }

  if (!gl) {
    document.documentElement.classList.add('ghost-fibers-fallback');
    renderFallback();
    window.addEventListener('resize', renderFallback, { passive: true });
    return;
  }

  var vertexSource = `#version 300 es
    precision highp float;
    uniform float uTime;
    uniform float uIntro;
    uniform float uDpr;
    uniform float uPulse;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform int uThreads;
    uniform int uDots;
    out vec3 vColor;
    out float vAlpha;

    float hash11(float n) {
      return fract(sin(n * 91.3458) * 47453.5453);
    }

    void main() {
      int perRibbon = uThreads * uDots;
      int ribbon = gl_VertexID / perRibbon;
      int localId = gl_VertexID - ribbon * perRibbon;
      int fiber = localId / uDots;
      int bead = localId - fiber * uDots;

      float fi = float(fiber) / max(float(uThreads - 1), 1.0);
      float bi = float(bead) / max(float(uDots - 1), 1.0);
      float seed = hash11(float(fiber) * 1.731 + float(ribbon) * 17.0);
      float s = mix(-1.38, 1.38, bi);
      float v = mix(-1.0, 1.0, fi) + (seed - 0.5) * 0.025;
      float phase = float(ribbon) * 2.31;

      float x = s;
      float y = sin(s * 3.4 + uTime * 0.42 + phase) * 0.14;
      y += sin(s * 6.1 - uTime * 0.22 + phase * 0.7) * 0.045;
      float z = sin(s * 2.7 - uTime * 0.25 + phase) * 0.36;
      float twist = s * 7.6 + uTime * 0.46 + phase;
      float spread = 0.35 * (0.82 + 0.18 * cos(s * 2.3));
      y += cos(twist) * v * spread;
      z += sin(twist) * v * spread;

      if (ribbon == 1) {
        y -= 0.46;
        z -= 0.48;
      } else if (ribbon == 2) {
        y += 0.42;
        z += 0.30;
      }

      float angle = 0.314159;
      float rx = x * cos(angle) - y * sin(angle);
      float ry = x * sin(angle) + y * cos(angle);
      rx += uPointer.x * (0.018 + z * 0.012);
      ry += uPointer.y * (0.018 + z * 0.012);

      float perspective = 1.18 / max(1.72 - z * 0.34, 0.65);
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      float xFit = mix(0.80, 1.0, smoothstep(0.55, 1.5, aspect));
      vec2 projected = vec2(rx * perspective * xFit, ry * perspective * clamp(aspect, 0.82, 1.58));
      gl_Position = vec4(projected, 0.0, 1.0);

      float edge = smoothstep(0.0, 0.08, bi) * smoothstep(1.0, 0.92, bi);
      float reveal = smoothstep(bi * 1.08, bi * 1.08 + 0.18, uIntro);
      float fold = pow(1.0 - abs(cos(twist)), 4.0);
      float sparkleSeed = hash11(float(gl_VertexID) * 0.713);
      float sparkle = pow(max(sin(uTime * (1.0 + sparkleSeed * 1.7) * 4.0 + sparkleSeed * 56.0), 0.0), 30.0);
      float pulse = uPulse < 0.0 ? 0.0 : exp(-pow((bi - uPulse) / 0.045, 2.0));
      float depthFade = mix(0.58, 1.0, smoothstep(-0.6, 0.5, z));

      vec3 glow = vec3(0.894, 0.875, 0.945);
      vec3 secondary = vec3(0.57, 0.57, 0.60);
      vec3 line = vec3(0.985, 0.975, 1.0);
      float tint = clamp(0.28 + float(ribbon) * 0.22 + z * 0.16, 0.0, 1.0);
      vColor = mix(secondary, glow, tint);
      vColor = mix(vColor, line, clamp(fold * 0.68 + sparkle + pulse, 0.0, 1.0));
      vAlpha = edge * reveal * depthFade * (0.42 + fold * 0.14 + sparkle * 0.12 + pulse * 0.24);

      float dof = abs(z - 0.08);
      float pointSize = 1.75 + dof * 3.1 + fold * 0.75 + sparkle * 1.0 + pulse * 1.8;
      gl_PointSize = min(pointSize * uDpr, 14.0 * uDpr);
    }
  `;

  var fragmentSource = `#version 300 es
    precision highp float;
    in vec3 vColor;
    in float vAlpha;
    out vec4 outColor;

    void main() {
      vec2 point = gl_PointCoord - 0.5;
      float radius = length(point) * 2.0;
      if (radius > 1.0) discard;
      float core = exp(-radius * radius * 7.5);
      float halo = exp(-radius * radius * 2.1) * 0.46;
      float alpha = (core + halo) * vAlpha;
      outColor = vec4(vColor, alpha);
    }
  `;

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || 'GhostFibers shader compilation failed.');
    }
    return shader;
  }

  var program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('GhostFibers WebGL initialization failed:', error);
    gl = null;
    renderFallback();
    window.addEventListener('resize', renderFallback, { passive: true });
    return;
  }

  var uniforms = {};
  ['uTime', 'uIntro', 'uDpr', 'uPulse', 'uResolution', 'uPointer', 'uThreads', 'uDots'].forEach(function (name) {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  var state = {
    width: 1,
    height: 1,
    dpr: 1,
    threads: 72,
    dots: 72,
    pointerX: 0,
    pointerY: 0,
    targetX: 0,
    targetY: 0,
    intro: reduceMotion ? 1.3 : 0,
    pulseStart: -1,
    last: 0,
    time: 0,
    raf: 0,
    visible: !document.hidden
  };

  function resize() {
    var width = Math.max(1, window.innerWidth);
    var height = Math.max(1, window.innerHeight);
    var mobile = width < 720;
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    var longest = Math.max(width, height) * dpr;
    if (longest > 2200) dpr *= 2200 / longest;
    var pixelWidth = Math.max(1, Math.round(width * dpr));
    var pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.width = width;
    state.height = height;
    state.dpr = dpr;
    state.threads = mobile ? 56 : 72;
    state.dots = mobile ? 116 : 152;
    draw();
  }

  function pulseValue(now) {
    if (state.pulseStart < 0) return -1;
    var age = (now - state.pulseStart) / 1000;
    if (age > 2.1) {
      state.pulseStart = -1;
      return -1;
    }
    return age / 2.1;
  }

  function draw(now) {
    if (!gl) return;
    now = typeof now === 'number' ? now : performance.now();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform1f(uniforms.uTime, state.time);
    gl.uniform1f(uniforms.uIntro, state.intro);
    gl.uniform1f(uniforms.uDpr, state.dpr);
    gl.uniform1f(uniforms.uPulse, pulseValue(now));
    gl.uniform2f(uniforms.uResolution, state.width, state.height);
    gl.uniform2f(uniforms.uPointer, state.pointerX, state.pointerY);
    gl.uniform1i(uniforms.uThreads, state.threads);
    gl.uniform1i(uniforms.uDots, state.dots);
    gl.drawArrays(gl.POINTS, 0, state.threads * state.dots * 3);
    gl.disable(gl.BLEND);
  }

  function frame(now) {
    state.raf = 0;
    if (!state.visible || !gl) return;
    var elapsed = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
    state.last = now;
    if (!reduceMotion) {
      state.time += elapsed * 0.5;
      state.intro = Math.min(1.3, state.intro + elapsed / 2.0);
    }
    var easing = 1 - Math.exp(-elapsed / 0.22);
    state.pointerX += (state.targetX - state.pointerX) * easing;
    state.pointerY += (state.targetY - state.pointerY) * easing;
    draw(now);
    if (!reduceMotion || state.pulseStart >= 0) state.raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!state.raf && state.visible) {
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    }
  }

  window.addEventListener('pointermove', function (event) {
    state.targetX = (event.clientX / Math.max(state.width, 1) - 0.5) * 2;
    state.targetY = (0.5 - event.clientY / Math.max(state.height, 1)) * 2;
    wake();
  }, { passive: true });

  window.addEventListener('pointerdown', function (event) {
    if (reduceMotion || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    state.pulseStart = performance.now();
    wake();
  });

  document.addEventListener('visibilitychange', function () {
    state.visible = !document.hidden;
    if (!state.visible && state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    } else {
      wake();
    }
  });

  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  wake();
})();
