'use strict';

window.renderMasonryGallery = function(container, works, onOpen) {
  if (!container || !Array.isArray(works) || !works.length) return;

  var section = document.createElement('section');
  section.className = 'masonry-section';
  section.innerHTML =
    '<div class="masonry-rail">' +
      '<span>ALL WORKS / VISUAL ARCHIVE</span>' +
      '<span>' + String(works.length).padStart(2, '0') + ' FRAMES</span>' +
    '</div>' +
    '<div class="masonry-grid" role="list" aria-label="Arosa 全部摄影作品"></div>' +
    '<div class="masonry-footer"><span>AROSA / SELECTED ARCHIVE</span><span>CLICK TO VIEW FULL FRAME</span></div>';

  var grid = section.querySelector('.masonry-grid');
  works.forEach(function(work, index) {
    var item = document.createElement('button');
    var number = String(index + 1).padStart(2, '0');
    var type = /^合成/.test(work.title || '') ? 'COMPOSITE' : 'LOCATION';
    item.type = 'button';
    item.className = 'masonry-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', '查看作品 ' + number + '：' + (work.title || '摄影作品'));
    item.style.setProperty('--work-ratio', (work.w || 4) + ' / ' + (work.h || 3));
    item.innerHTML =
      '<span class="masonry-media">' +
        '<img src="' + encodeURI(work.thumb || work.web) + '" alt="' + escapeHtml(work.title || ('作品 ' + number)) + '" loading="eager" decoding="auto" draggable="false">' +
        '<span class="masonry-shade" aria-hidden="true"></span>' +
      '</span>' +
      '<span class="masonry-index" aria-hidden="true">' + number + '</span>' +
      '<span class="masonry-caption" aria-hidden="true"><small>' + type + ' / ' + (work.mtime || 'ARCHIVE') + '</small><b>' + escapeHtml(work.title || ('FRAME ' + number)) + '</b><i>VIEW</i></span>';
    item.addEventListener('click', function() { onOpen(index); });
    grid.appendChild(item);
  });

  container.appendChild(section);
  layoutMasonry();
  window.addEventListener('resize', debounce(layoutMasonry, 120));

  function layoutMasonry() {
    var rowHeight = 8;
    var gap = parseFloat(window.getComputedStyle(grid).rowGap) || 12;
    grid.querySelectorAll('.masonry-item').forEach(function(item) {
      item.style.gridRowEnd = 'auto';
      var media = item.querySelector('.masonry-media');
      var height = media ? media.getBoundingClientRect().height : item.scrollHeight;
      item.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));
    });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function debounce(callback, wait) {
    var timer = null;
    return function() {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, wait);
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function(character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }
};
