/* Frontstep Motion 1.0 — local, declarative GSAP scenes for static pages.
 * Requires ./gsap.min.js and ./ScrollTrigger.min.js before this file.
 * All content is visible in HTML/CSS without JavaScript or with reduced motion.
 */
(function (win, doc) {
  'use strict';
  var gsap = win.gsap;
  var ScrollTrigger = win.ScrollTrigger;
  var instances = new Map();
  var mounts = new Map();
  var allowed = new Set([
    'accounting-documents', 'food-photo', 'beauty-line', 'fitness-orbit',
    'shop-product', 'lodging-landscape', 'industry-process', 'repair-path', 'health-clarity'
  ]);

  function parts(section, name) {
    return Array.prototype.slice.call(section.querySelectorAll('[data-motion-part="' + name + '"]'));
  }
  function first(section, name) { return parts(section, name)[0] || null; }
  function rememberListener(list, target, type, handler, options) {
    target.addEventListener(type, handler, options);
    list.push(function () { target.removeEventListener(type, handler, options); });
  }
  function scrollVars(trigger, start, end, scrub) {
    return { trigger: trigger, start: start || 'top 88%', end: end || 'bottom 52%', scrub: scrub === undefined ? .55 : scrub, invalidateOnRefresh: true };
  }

  function accountingDocuments(section) {
    parts(section, 'document').forEach(function (card, index) {
      gsap.fromTo(card, { y: 24 + index * 9, rotation: (index % 2 ? 1 : -1) * (3 + index) }, {
        y: 0, rotation: 0, ease: 'none', scrollTrigger: scrollVars(section, 'top 85%', 'center 45%')
      });
    });
  }
  function foodPhoto(section) {
    parts(section, 'photo').slice(0, 4).forEach(function (figure) {
      var image = figure.querySelector('img');
      if (!image) return;
      gsap.fromTo(figure, { clipPath: 'inset(8% 6% round 24px)' }, {
        clipPath: 'inset(0% 0% round 0px)', ease: 'none', scrollTrigger: scrollVars(figure, 'top 88%', 'center 45%')
      });
      gsap.fromTo(image, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: scrollVars(figure, 'top 88%', 'center 45%') });
    });
  }
  function beautyLine(section) {
    parts(section, 'line').forEach(function (path) {
      if (typeof path.getTotalLength !== 'function') return;
      var length = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, {
        strokeDashoffset: 0, ease: 'none', scrollTrigger: scrollVars(section, 'top 85%', 'bottom 55%')
      });
    });
  }
  function fitnessOrbit(section) {
    parts(section, 'orbit').forEach(function (orbit, index) {
      gsap.fromTo(orbit, { rotation: (index % 2 ? -1 : 1) * -38 }, {
        rotation: (index % 2 ? -1 : 1) * 42, ease: 'none',
        scrollTrigger: scrollVars(section, 'top bottom', 'bottom top', .7)
      });
    });
  }
  function shopProduct(section, listeners, eventTargets) {
    parts(section, 'product').slice(0, 8).forEach(function (card, index) {
      gsap.fromTo(card, { y: 22, rotation: index % 2 ? 2 : -2 }, {
        y: 0, rotation: 0, ease: 'power2.out', duration: .65,
        scrollTrigger: { trigger: card, start: 'top 89%', once: true }
      });
      var image = card.querySelector('[data-motion-part="product-image"]');
      if (!image) return;
      eventTargets.push(image);
      rememberListener(listeners, card, 'pointerenter', function () {
        gsap.to(image, { scale: 1.045, duration: .22, ease: 'power2.out', overwrite: true });
      });
      rememberListener(listeners, card, 'pointerleave', function () {
        gsap.to(image, { scale: 1, duration: .25, ease: 'power2.out', overwrite: true });
      });
    });
  }
  function lodgingLandscape(section) {
    var image = first(section, 'landscape');
    if (!image) return;
    gsap.fromTo(image, { scale: 1 }, { scale: 1.07, ease: 'none', scrollTrigger: scrollVars(section, 'top bottom', 'bottom top', .8) });
  }
  function industryProcess(section) {
    var rail = first(section, 'rail');
    if (rail) gsap.fromTo(rail, { scaleX: .08, transformOrigin: 'left center' }, {
      scaleX: 1, ease: 'none', scrollTrigger: scrollVars(section, 'top 86%', 'bottom 55%')
    });
    parts(section, 'step').slice(0, 7).forEach(function (step, index) {
      gsap.fromTo(step, { y: 16, rotation: index % 2 ? 1.2 : -1.2 }, {
        y: 0, rotation: 0, duration: .45, ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 86%', once: true }
      });
    });
  }
  function repairPath(section) {
    parts(section, 'path').forEach(function (path) {
      if (typeof path.getTotalLength !== 'function') return;
      var length = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, {
        strokeDashoffset: 0, ease: 'none', scrollTrigger: scrollVars(section, 'top 87%', 'bottom 60%')
      });
    });
    parts(section, 'tool').slice(0, 4).forEach(function (tool, index) {
      gsap.fromTo(tool, { x: index % 2 ? 18 : -18, rotation: index % 2 ? 7 : -7 }, {
        x: 0, rotation: 0, duration: .55, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: tool, start: 'top 90%', once: true }
      });
    });
  }
  function healthClarity(section, listeners, eventTargets) {
    var progress = first(section, 'progress');
    var fields = Array.prototype.slice.call(section.querySelectorAll('[data-motion-field]'));
    if (!progress || !fields.length) return;
    eventTargets.push(progress);
    progress.style.transformOrigin = 'left center';
    function update() {
      var filled = fields.filter(function (field) { return Boolean(field.value); }).length;
      gsap.to(progress, { scaleX: Math.max(.04, filled / fields.length), duration: .28, ease: 'power2.out', overwrite: true });
    }
    fields.forEach(function (field) {
      rememberListener(listeners, field, 'change', update);
      rememberListener(listeners, field, 'input', update);
    });
    update();
  }

  function mountSection(section) {
    if (instances.has(section)) return instances.get(section);
    var signature = section.getAttribute('data-motion-signature');
    var purpose = section.getAttribute('data-motion-purpose');
    if (!allowed.has(signature) || !purpose || !purpose.trim()) {
      section.setAttribute('data-motion-status', 'static');
      return function () {};
    }
    if (!gsap || !ScrollTrigger) {
      section.setAttribute('data-motion-status', 'static');
      return function () {};
    }
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', mobile: '(max-width: 820px)', fine: '(hover: hover) and (pointer: fine)' }, function (conditions) {
      if (!conditions.conditions.motion) {
        section.setAttribute('data-motion-status', 'reduced');
        return function () { section.removeAttribute('data-motion-status'); };
      }
      var listeners = [];
      var eventTargets = [];
      var context = gsap.context(function () {
        switch (signature) {
          case 'accounting-documents': accountingDocuments(section); break;
          case 'food-photo': foodPhoto(section); break;
          case 'beauty-line': beautyLine(section); break;
          case 'fitness-orbit': fitnessOrbit(section); break;
          case 'shop-product': shopProduct(section, listeners, eventTargets); break;
          case 'lodging-landscape': lodgingLandscape(section); break;
          case 'industry-process': industryProcess(section); break;
          case 'repair-path': repairPath(section); break;
          case 'health-clarity': healthClarity(section, listeners, eventTargets); break;
        }
      }, section);
      if (conditions.conditions.fine && !conditions.conditions.mobile && (signature === 'food-photo' || signature === 'shop-product')) {
        mountMenuHover(section, listeners, eventTargets);
      }
      section.setAttribute('data-motion-status', 'mounted');
      return function () {
        listeners.forEach(function (dispose) { dispose(); });
        eventTargets.forEach(function (target) { gsap.killTweensOf(target); });
        context.revert();
        section.removeAttribute('data-motion-status');
      };
    });
    var dispose = function () { mm.revert(); instances.delete(section); section.removeAttribute('data-motion-status'); };
    instances.set(section, dispose);
    return dispose;
  }

  function mountMenuHover(section, listeners, eventTargets) {
    var list = section.querySelector('[data-motion-menu]');
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll('[data-motion-menu-item]')).filter(function (item) {
      return item.querySelector('img');
    });
    if (!items.length) return;
    var follower = doc.createElement('div');
    follower.className = 'fs-motion-follower';
    follower.setAttribute('aria-hidden', 'true');
    var image = doc.createElement('img');
    image.alt = '';
    follower.appendChild(image);
    doc.body.appendChild(follower);
    eventTargets.push(follower);
    var xTo = gsap.quickTo(follower, 'x', { duration: .32, ease: 'power3.out' });
    var yTo = gsap.quickTo(follower, 'y', { duration: .32, ease: 'power3.out' });
    rememberListener(listeners, list, 'pointermove', function (event) { xTo(event.clientX + 20); yTo(event.clientY + 20); });
    items.forEach(function (item) {
      rememberListener(listeners, item, 'pointerenter', function () {
        image.src = item.querySelector('img').currentSrc || item.querySelector('img').src;
        gsap.to(follower, { autoAlpha: 1, scale: 1, duration: .22, ease: 'power2.out', overwrite: true });
      });
    });
    rememberListener(listeners, list, 'pointerleave', function () {
      gsap.to(follower, { autoAlpha: 0, scale: .96, duration: .18, overwrite: true });
    });
    listeners.push(function () { follower.remove(); });
  }

  function initPage(root) {
    root = root || doc;
    var header = root.querySelector('[data-motion-header]');
    if (!header) return function () {};
    function update() { header.classList.toggle('fs-motion-scrolled', win.scrollY > 32); }
    win.addEventListener('scroll', update, { passive: true });
    update();
    return function () { win.removeEventListener('scroll', update); header.classList.remove('fs-motion-scrolled'); };
  }
  function mount(root) {
    root = root || doc;
    if (mounts.has(root)) return mounts.get(root);
    var sections = [];
    if (root.matches && root.matches('[data-motion-signature]')) sections.push(root);
    sections = sections.concat(Array.prototype.slice.call(root.querySelectorAll('[data-motion-signature]')));
    var disposers = sections.map(mountSection);
    var disposePage = initPage(root);
    var dispose = function () {
      disposers.forEach(function (remove) { remove(); });
      disposePage();
      mounts.delete(root);
    };
    mounts.set(root, dispose);
    return dispose;
  }
  function destroyAll() {
    Array.from(mounts.values()).forEach(function (dispose) { dispose(); });
    Array.from(instances.values()).forEach(function (dispose) { dispose(); });
  }
  win.FrontstepMotion = Object.freeze({ version: '1.0.0', mount: mount, destroyAll: destroyAll });
  function boot() { if (doc.querySelector('[data-motion-signature]')) mount(doc); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(window, document);
