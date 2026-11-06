(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var opening = document.getElementById('opening');
  var videos = Array.prototype.slice.call(document.querySelectorAll('.hero-video'));
  var video = videos[0] || null;
  var nav = document.querySelector('.site-nav');
  var desktopVideo = videos.length && !reduced;

  if (desktopVideo) {
    videos.forEach(function (item) {
      if (item.dataset.src) { item.src = item.dataset.src; item.load(); }
    });
    var initialPlay = videos[0].play();
    if (initialPlay && initialPlay.catch) initialPlay.catch(function () {});
  }

  function finishOpening() {
    document.body.classList.remove('is-opening');
    if (opening) opening.remove();
    if (nav) nav.classList.add('motion-ready');
    if (desktopVideo) {
      var promise = videos[0].play();
      if (promise && promise.catch) promise.catch(function () {});
    }
  }

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    finishOpening();
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });
  gsap.set('.opening-word > span', { yPercent: 115, scaleX: .58 });
  gsap.set('.hero-title-line', { yPercent: 120, scaleX: .62 });
  gsap.set('.opening-cycle span', { yPercent: 110, opacity: 0 });

  var countState = { value: 0 };
  gsap.to(countState, {
    value: 100,
    duration: 2.7,
    ease: 'power2.inOut',
    onUpdate: function () {
      var count = document.querySelector('.opening-count span');
      if (count) count.textContent = String(Math.round(countState.value)).padStart(3, '0');
    }
  });
  var cycleWords = gsap.utils.toArray('.opening-cycle span');
  cycleWords.forEach(function (word, index) {
    gsap.timeline({ repeat: 0, delay: index * .82 })
      .to(word, { opacity: 1, yPercent: 0, duration: .48, ease: 'power3.out' })
      .to(word, { opacity: 0, yPercent: -110, duration: .42, ease: 'power3.in' }, '+=.28');
  });

  var heroTl = gsap.timeline({ paused: true });
  heroTl
    .to('.hero-title-line', { yPercent: 0, scaleX: 1, duration: 1.7, stagger: .13, ease: 'expo.out' })
    .to('.hero-video', { scale: 1.03, duration: 2.6, ease: 'power4.out' }, '<')
    .from('.hero-topline > *, .hero-intro > *, .hero-data > *', { y: 28, opacity: 0, duration: 1.05, stagger: .08 }, '-=.95')
    .from('.hero-scroll', { opacity: 0, y: -20, duration: .8 }, '-=.45')
    .to('.site-nav', { opacity: 1, y: 0, duration: .9, onComplete: function () { nav && nav.classList.add('motion-ready'); } }, '-=.7');

  if (desktopVideo && videos.length > 1) {
    var activeVideo = 0;
    var changingVideo = false;
    var changeVideo = function () {
      if (changingVideo) return;
      changingVideo = true;
      var current = videos[activeVideo];
      var nextIndex = (activeVideo + 1) % videos.length;
      var next = videos[nextIndex];
      next.currentTime = 0;
      var playNext = next.play();
      if (playNext && playNext.catch) playNext.catch(function () {});
      next.classList.add('is-active');
      current.classList.remove('is-active');
      window.setTimeout(function () {
        current.pause();
        activeVideo = nextIndex;
        changingVideo = false;
      }, 1900);
    };
    videos.forEach(function (item, index) {
      item.addEventListener('timeupdate', function () {
        if (index === activeVideo && item.duration && item.duration - item.currentTime < 1.8) changeVideo();
      });
      item.addEventListener('ended', function () { if (index === activeVideo) changeVideo(); });
    });
  }

  var openingTl = gsap.timeline({
    defaults: { ease: 'power4.inOut' },
    onComplete: function () { finishOpening(); heroTl.play(); }
  });
  openingTl
    .to('.opening-progress i', { scaleX: 1, duration: 1.15, ease: 'power2.inOut' })
    .to('.opening-word > span', { yPercent: -4, scaleX: 1, duration: 1.4 }, .12)
    .from('.opening-index, .opening-status', { opacity: 0, y: 12, duration: .8, stagger: .1 }, .2)
    .to('.opening-word > span', { yPercent: -120, scaleX: .82, duration: 1.05 }, '+=.45')
    .to('.opening-index, .opening-status, .opening-progress', { opacity: 0, duration: .45 }, '<')
    .to('.opening-panel-b', { clipPath: 'inset(0% 0 0%)', duration: .8 }, '<.1')
    .to('.opening-panel-a, .opening-panel-b', { scaleY: 0, transformOrigin: 'top', duration: 1.15, stagger: .08 }, '>-0.05')
    .set('.opening', { pointerEvents: 'none' });

  gsap.to('.hero-video', {
    yPercent: 9,
    scale: 1.1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
  });
  gsap.to('.hero-title', {
    yPercent: 30,
    opacity: .25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '25% top', end: 'bottom top', scrub: 1 }
  });

  document.querySelectorAll('.motion-heading').forEach(function (el) {
    gsap.from(el, {
      yPercent: 45,
      scaleX: .82,
      opacity: 0,
      transformOrigin: 'left bottom',
      duration: 1.5,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  document.querySelectorAll('.motion-copy, .motion-kicker').forEach(function (el) {
    gsap.from(el, {
      y: 54,
      opacity: 0,
      duration: 1.25,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  document.querySelectorAll('.motion-rule').forEach(function (el, index) {
    gsap.from(el, {
      y: 34,
      opacity: 0,
      duration: 1.05,
      delay: (index % 4) * .08,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  var portrait = document.querySelector('.about-portrait-clip');
  if (portrait) {
    gsap.to(portrait, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.65,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: portrait, start: 'top 82%', once: true }
    });
    gsap.to('.about-portrait img', {
      scale: 1,
      duration: 2,
      ease: 'power3.out',
      scrollTrigger: { trigger: portrait, start: 'top 82%', once: true }
    });
  }

  var roles = ['PORTRAIT MAKER', 'COMPOSITE ARTIST', 'VISUAL STORYTELLER'];
  var roleIndex = 0;
  var roleElement = document.getElementById('hero-role');
  if (roleElement) {
    window.setInterval(function () {
      roleIndex = (roleIndex + 1) % roles.length;
      gsap.to(roleElement, {
        y: -8, opacity: 0, duration: .28, ease: 'power2.in',
        onComplete: function () {
          roleElement.textContent = roles[roleIndex];
          gsap.fromTo(roleElement, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
        }
      });
    }, 2400);
  }

  gsap.to('.contact-marquee div', { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });

  document.querySelectorAll('.masonry-item').forEach(function (item, index) {
    gsap.fromTo(item,
      { y: 72, opacity: 0, filter: 'blur(12px)', scale: .975 },
      { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.25, delay: (index % 4) * .06, ease: 'power4.out', scrollTrigger: { trigger: item, start: 'top 93%', once: true } }
    );
  });

  document.querySelectorAll('.reveal').forEach(function (el) {
    gsap.fromTo(el,
      { y: 48, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 89%', once: true } }
    );
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
