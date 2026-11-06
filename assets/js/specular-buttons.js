'use strict';

(function () {
  var selector = [
    '.nav-links .cta',
    '.btn',
    '.lb-btn',
    '.lb-close',
    '.lb-prev',
    '.lb-next'
  ].join(',');
  var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
  if (!elements.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pointer = { x: 0, y: 0, known: false };
  var frame = 0;
  var proximity = 250;

  var items = elements.map(function (element) {
    element.classList.add('specular-button');
    if (element.matches('.lb-close,.lb-prev,.lb-next')) element.classList.add('specular-button--icon');
    if (element.matches('.nav-links .cta')) element.classList.add('specular-button--pill');
    if (element.matches('.btn-primary,.lb-btn.primary,.nav-links .cta')) element.classList.add('specular-button--primary');

    if (!element.querySelector(':scope > .specular-button__label')) {
      var label = document.createElement('span');
      label.className = 'specular-button__label';
      while (element.firstChild) label.appendChild(element.firstChild);
      element.appendChild(label);
    }

    var state = {
      element: element,
      angle: 38,
      targetAngle: 38,
      level: 0.45,
      targetLevel: 0.45,
      x: 50,
      y: 50,
      focused: false
    };
    element.style.setProperty('--sb-angle', state.angle + 'deg');
    element.style.setProperty('--sb-level', state.level.toFixed(3));
    element.addEventListener('focus', function () { state.focused = true; wake(); });
    element.addEventListener('blur', function () { state.focused = false; wake(); });
    return state;
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateTargets() {
    items.forEach(function (item) {
      var rect = item.element.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = pointer.x - cx;
      var dy = pointer.y - cy;
      var outsideX = Math.max(Math.abs(dx) - rect.width / 2, 0);
      var outsideY = Math.max(Math.abs(dy) - rect.height / 2, 0);
      var distance = Math.hypot(outsideX, outsideY);
      var near = pointer.known ? clamp(1 - distance / proximity, 0, 1) : 0;
      near = near * near * (3 - 2 * near);

      if (near > 0 || item.focused) {
        item.targetAngle = pointer.known ? Math.atan2(dy, dx) * 180 / Math.PI + 90 : 38;
        item.targetLevel = Math.max(item.focused ? 0.92 : 0, 0.45 + near * 0.55);
        item.x = clamp((pointer.x - rect.left) / Math.max(rect.width, 1) * 100, 0, 100);
        item.y = clamp((pointer.y - rect.top) / Math.max(rect.height, 1) * 100, 0, 100);
      } else {
        item.targetAngle = 38;
        item.targetLevel = 0.45;
        item.x = 72;
        item.y = 18;
      }
    });
  }

  function render() {
    frame = 0;
    updateTargets();
    var unsettled = false;

    items.forEach(function (item) {
      var angleDiff = (item.targetAngle - item.angle + 540) % 360 - 180;
      var levelDiff = item.targetLevel - item.level;
      var factor = reduced.matches ? 1 : 0.16;
      item.angle += angleDiff * factor;
      item.level += levelDiff * factor;
      item.element.style.setProperty('--sb-angle', item.angle.toFixed(2) + 'deg');
      item.element.style.setProperty('--sb-level', item.level.toFixed(3));
      item.element.style.setProperty('--sb-x', item.x.toFixed(1) + '%');
      item.element.style.setProperty('--sb-y', item.y.toFixed(1) + '%');
      if (Math.abs(angleDiff) > 0.08 || Math.abs(levelDiff) > 0.002) unsettled = true;
    });

    if (unsettled) frame = window.requestAnimationFrame(render);
  }

  function wake() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('pointermove', function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.known = true;
    wake();
  }, { passive: true });
  window.addEventListener('pointerup', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });
  window.addEventListener('scroll', wake, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () {
    pointer.known = false;
    wake();
  });
  if (reduced.addEventListener) reduced.addEventListener('change', wake);
  else reduced.addListener(wake);

  wake();
})();
