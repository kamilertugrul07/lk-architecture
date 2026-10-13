/* LK Architecture — page transitions & reveals.
   Leave: content fades → ivory veil fills the viewport → navigate.
   Arrive: veil lifts → content staggers in (~1–1.2s total).
   "Entrer" instead keeps the cover on screen; Vision opens with the cover
   split into two door leaves that swing apart onto the page. */
(function () {
  var root = document.documentElement;
  var veil = document.querySelector('.veil');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'lk-transition';

  function store(fn) { try { return fn(sessionStorage); } catch (e) { return null; } }
  var arriving = root.classList.contains('is-arriving');
  var entering = root.classList.contains('is-entering');
  store(function (s) { s.removeItem(KEY); });

  // No GSAP (CDN blocked) or reduced motion: show everything, plain navigation.
  if (!window.gsap || reduce) {
    root.classList.remove('is-arriving', 'is-entering', 'js-reveal');
    return;
  }

  var gsap = window.gsap;
  gsap.defaults({ ease: 'power2.out' });

  /* ── Leaving ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-transition]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (link.origin !== location.origin) return;
    e.preventDefault();
    var href = link.href;

    if (link.getAttribute('data-transition') === 'door') {
      gsap.to('.hero__title, .hero__enter, .lang', {
        opacity: 0, y: 6, duration: .4, ease: 'power1.inOut',
        onComplete: function () {
          store(function (s) { s.setItem(KEY, 'door'); });
          location.href = href;
        }
      });
      return;
    }
    var content = document.querySelectorAll('[data-hero-item], .site-header, main');

    gsap.timeline({
      onComplete: function () {
        store(function (s) { s.setItem(KEY, '1'); });
        location.href = href;
      }
    })
      .to(content, { opacity: 0, y: -8, duration: .45, ease: 'power1.inOut' })
      .to(veil, { opacity: 1, duration: .4, ease: 'power1.inOut' }, '-=.2');
  });

  // Back/forward cache: never come back to a covered page.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    gsap.set(veil, { opacity: 0 });
    gsap.set('[data-hero-item], .site-header, main', { opacity: 1, y: 0 });
  });

  /* ── Hero (home) ── */
  var heroItems = document.querySelectorAll('[data-hero-item]');
  if (heroItems.length) {
    gsap.from(heroItems, { opacity: 0, y: 12, duration: 1.1, stagger: .18, delay: arriving ? .5 : .3 });
  }

  /* ── Reveals (inner pages) ── */
  var items = gsap.utils.toArray('[data-reveal]');
  var header = document.querySelector('.site-header');

  gsap.set(items, { opacity: 0, y: 22 });
  items.forEach(function (el) {
    if (el.getAttribute('data-reveal') === 'image') {
      gsap.set(el, { y: 0 });
      gsap.set(el.querySelector('img'), { scale: 1.04 });
    }
  });
  root.classList.remove('js-reveal');

  function reveal(batch) {
    batch.forEach(function (el, i) {
      var isImage = el.getAttribute('data-reveal') === 'image';
      gsap.to(el, { opacity: 1, y: 0, duration: isImage ? 1.4 : 1, delay: i * .12 });
      if (isImage) gsap.to(el.querySelector('img'), { scale: 1, duration: 1.8, delay: i * .12, ease: 'power1.out' });
    });
  }

  function startReveals() {
    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      window.ScrollTrigger.batch(items, { start: 'top 88%', once: true, onEnter: reveal });
    } else {
      reveal(items);
    }
  }

  if (entering) {
    var doors = document.querySelector('.doors');
    var left = doors.querySelector('.door--left');
    var right = doors.querySelector('.door--right');
    var main = document.querySelector('main');
    gsap.set(main, { scale: .97, transformOrigin: '50% 30%' });
    if (header) gsap.set(header, { opacity: 0 });

    gsap.timeline({
      delay: .15,
      onComplete: function () {
        root.classList.remove('is-entering');
        gsap.set(main, { clearProps: 'transform' });
      }
    })
      // a thread of light where the leaves meet
      .to('.doors__seam', { opacity: 1, scaleY: 1, duration: .55, ease: 'power2.out' })
      .set([left, right], { boxShadow: '0 0 40px rgba(12, 8, 5, .55)' })
      .to(left, { xPercent: -100, duration: 1.5, ease: 'power3.inOut' }, '+=.05')
      .to(right, { xPercent: 100, duration: 1.5, ease: 'power3.inOut' }, '<')
      // a touch of parallax: the photograph lags slightly behind each leaf
      .to(left.firstElementChild, { xPercent: 12, duration: 1.5, ease: 'power3.inOut' }, '<')
      .to(right.firstElementChild, { xPercent: -12, duration: 1.5, ease: 'power3.inOut' }, '<')
      .to('.doors__seam', { opacity: 0, duration: .5 }, '<')
      .to(main, { scale: 1, duration: 1.8, ease: 'power2.out' }, '<.1')
      .to(header, { opacity: 1, duration: .8 }, '<.6')
      .add(startReveals, '<-.2');
  } else if (arriving) {
    if (header) gsap.set(header, { opacity: 0 });
    gsap.timeline({ onComplete: function () { root.classList.remove('is-arriving'); } })
      .to(veil, { opacity: 0, duration: .5, ease: 'power1.inOut' })
      .to(header, { opacity: 1, duration: .6 }, '-=.15')
      .add(startReveals, '-=.5');
  } else {
    root.classList.remove('is-arriving');
    startReveals();
  }
})();
