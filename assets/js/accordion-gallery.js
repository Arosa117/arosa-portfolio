'use strict';

window.renderAccordionGallery = function(container, works, onOpen) {
  if (!container || !works || !works.length) return;

  var gsap = window.gsap;
  var reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 640px)');
  var items = works.map(function(work, index) {
    return { work: work, index: index };
  });
  var active = Math.min(8, items.length - 1);
  var firstLayout = true;
  var timeline = null;

  var section = document.createElement('section');
  section.className = 'ag-section';
  section.innerHTML =
    '<div class="ag-rail">' +
      '<span>ALL WORKS / VISUAL ARCHIVE</span>' +
      '<span>' + String(items.length).padStart(2, '0') + ' FRAMES</span>' +
    '</div>' +
    '<div class="accordion-gallery" role="list" aria-label="全部摄影作品，使用方向键切换，回车查看大图"></div>' +
    '<div class="ag-footer">' +
      '<p class="ag-active-title" aria-live="polite"></p>' +
      '<p class="ag-help">悬停或点击展开作品 · 再次点击查看完整画面</p>' +
    '</div>';
  container.appendChild(section);

  var root = section.querySelector('.accordion-gallery');
  var activeTitle = section.querySelector('.ag-active-title');
  var panels = items.map(function(item, index) {
    var panel = document.createElement('button');
    var number = String(index + 1).padStart(2, '0');
    var wasActiveOnPointerDown = false;
    panel.type = 'button';
    panel.className = 'ag-panel';
    panel.setAttribute('role', 'listitem');
    panel.setAttribute('aria-label', '作品 ' + number + '，' + item.work.title);
    panel.setAttribute('aria-expanded', 'false');
    panel.innerHTML =
      '<span class="ag-panel__frame">' +
        '<img class="ag-panel__image" src="' + encodeURI(item.work.web) + '" alt="' + item.work.title + '" loading="lazy" decoding="async" draggable="false">' +
        '<span class="ag-panel__shade" aria-hidden="true"></span>' +
      '</span>' +
      '<span class="ag-panel__index" aria-hidden="true">' + number + '</span>' +
      '<span class="ag-panel__caption" aria-hidden="true">' +
        '<i></i><span><small>AROSA / FRAME ' + number + '</small><b>' + item.work.title + '</b></span>' +
      '</span>';

    panel.addEventListener('pointerenter', function(event) {
      if (event.pointerType === 'mouse') setActive(index, true);
    });
    panel.addEventListener('pointerdown', function() {
      wasActiveOnPointerDown = active === index;
    });
    panel.addEventListener('focus', function() { setActive(index, true); });
    panel.addEventListener('click', function(event) {
      var shouldOpen = event.detail === 0 ? active === index : wasActiveOnPointerDown;
      if (shouldOpen) onOpen(item.index);
      else setActive(index, true);
    });
    panel.addEventListener('keydown', function(event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (next !== null) {
        event.preventDefault();
        panels[next].focus();
      }
    });
    root.appendChild(panel);
    return panel;
  });

  function setActive(index, animate) {
    if (index < 0 || index >= items.length) return;
    active = index;
    applyLayout(animate !== false);
  }

  function applyLayout(animate) {
    var vertical = mobileQuery.matches;
    var reduced = reducedQuery.matches;
    var expandRatio = vertical ? 0.34 : 0.56;
    var grow = items.length > 1 ? (expandRatio * (items.length - 1)) / (1 - expandRatio) : 1;
    var duration = animate && !reduced && !firstLayout ? 0.9 : 0;

    root.classList.toggle('accordion-gallery--vertical', vertical);
    if (timeline && timeline.kill) timeline.kill();
    timeline = gsap ? gsap.timeline() : null;

    panels.forEach(function(panel, index) {
      var isActive = index === active;
      var image = panel.querySelector('.ag-panel__image');
      var captionParts = panel.querySelectorAll('.ag-panel__caption > *');
      var rotation = vertical || isActive ? 0 : (index < active ? 6 : -6);
      var imageShift = isActive ? 0 : Math.max(-8, Math.min(8, (active - index) * 1.4));

      panel.classList.toggle('ag-panel--active', isActive);
      panel.setAttribute('aria-expanded', String(isActive));

      if (timeline) {
        timeline.to(panel, {
          flexGrow: isActive ? grow : 1,
          rotateY: rotation,
          rotateX: 0,
          duration: duration,
          ease: 'power4.out'
        }, 0);
        timeline.to(image, {
          xPercent: vertical ? 0 : imageShift,
          yPercent: vertical ? imageShift * 0.35 : 0,
          scale: isActive ? 1.015 : 1.12,
          filter: isActive ? 'grayscale(0%) brightness(1) saturate(1)' : 'grayscale(100%) brightness(0.5) saturate(0.55)',
          duration: duration,
          ease: 'power4.out'
        }, 0);
        timeline.to(captionParts, {
          x: isActive ? 0 : -18,
          opacity: isActive ? 1 : 0,
          duration: duration ? duration * 0.72 : 0,
          stagger: duration ? 0.06 : 0,
          ease: 'power3.out'
        }, 0.08);
      } else {
        panel.style.flexGrow = isActive ? grow : 1;
        panel.style.transform = vertical ? 'none' : 'rotateY(' + rotation + 'deg)';
      }
    });

    activeTitle.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0') + '  —  ' + items[active].work.title;
    firstLayout = false;
  }

  function refreshOrientation() { applyLayout(false); }
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', refreshOrientation);
  else mobileQuery.addListener(refreshOrientation);
  if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', refreshOrientation);
  else reducedQuery.addListener(refreshOrientation);

  applyLayout(false);
};
