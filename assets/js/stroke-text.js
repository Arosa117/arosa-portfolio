'use strict';

(function() {
  var targets = document.querySelectorAll([
    '.opening-word > span',
    '.hero-title-line',
    '.section-head h2',
    '.works-statement h3',
    '.about-intro h2',
    '.contact-head h2'
  ].join(','));

  targets.forEach(function(target) {
    if (target.dataset.strokeReady === 'true') return;
    var label = target.textContent.replace(/\s+/g, ' ').trim();
    target.classList.add('stroke-text');
    target.dataset.strokeReady = 'true';
    target.setAttribute('aria-label', label);
    wrapTextNodes(target);
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function(target) { target.classList.add('is-drawn'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.28, rootMargin: '0px 0px -7% 0px' });
  targets.forEach(function(target) { observer.observe(target); });

  function wrapTextNodes(root) {
    Array.from(root.childNodes).forEach(function(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var fragment = document.createDocumentFragment();
        Array.from(node.nodeValue).forEach(function(character, index) {
          var span = document.createElement('span');
          span.className = character.trim() ? 'stroke-char' : 'stroke-char stroke-space';
          span.dataset.char = character;
          span.style.setProperty('--stroke-delay', (index * 0.035) + 's');
          span.textContent = character === ' ' ? '\u00a0' : character;
          span.setAttribute('aria-hidden', 'true');
          fragment.appendChild(span);
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        wrapTextNodes(node);
      }
    });
  }
})();
