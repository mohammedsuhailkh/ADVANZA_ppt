(() => {
  'use strict';
  const slide = document.querySelector('.problem-slide');
  if (!slide) return;
  const scene = slide.querySelector('.problem-scene');
  const cards = [...slide.querySelectorAll('.problem-card')];
  const detail = slide.querySelector('.problem-detail');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Map();
  let selected = null;
  let frame = null;
  let pointer = null;
  function motionEnabled() {
    return slide.classList.contains('active') && !reduced.matches && !document.hidden && !document.body.classList.contains('effects-paused');
  }
  function closeDetail(focus = false) {
    const previous = selected;
    cards.forEach(card => { card.classList.remove('is-expanded'); card.querySelector('button').setAttribute('aria-expanded','false'); });
    detail.hidden = true; selected = null;
    if (focus && previous) previous.querySelector('button').focus();
  }
  cards.forEach(card => {
    const trigger = card.querySelector('.problem-card-trigger');
    trigger.addEventListener('click', () => {
      if (selected === card) { closeDetail(); return; }
      closeDetail(); selected = card;
      card.classList.add('is-expanded'); trigger.setAttribute('aria-expanded','true');
      detail.setAttribute('aria-labelledby', trigger.id);
      detail.querySelector('.problem-detail-title').textContent = card.querySelector('.problem-card-title').textContent;
      detail.querySelector('.problem-detail-copy').textContent = [...card.querySelectorAll('li')].map(item => item.textContent).join(' ');
      detail.hidden = false;
    });
    card.addEventListener('click', event => {
      if (!event.target.closest('button')) trigger.click();
    });
    card.addEventListener('pointerenter', () => {
      if (!motionEnabled()) return;
      clearTimeout(timers.get(card));
      card.classList.remove('replay');
      // Restart only the meaningful graph animation on deliberate interaction.
      void card.offsetWidth;
      card.classList.add('replay');
      timers.set(card,setTimeout(() => { card.classList.remove('replay'); timers.delete(card); }, 900));
    });
  });
  detail.querySelector('button').addEventListener('click', () => closeDetail(true));
  slide.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected) { event.stopPropagation(); closeDetail(true); }
  });
  function resetPointerMotion() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; pointer = null;
    scene.style.setProperty('--scene-x','0px'); scene.style.setProperty('--scene-y','0px');
    cards[0].style.setProperty('--eye-x','0px'); cards[0].style.setProperty('--eye-y','0px');
  }
  slide.addEventListener('pointermove', event => {
    if (!motionEnabled() || event.pointerType !== 'mouse') return;
    pointer = { x:event.clientX, y:event.clientY };
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!pointer || !motionEnabled()) return;
      const eyeBounds = cards[0].getBoundingClientRect();
      cards[0].style.setProperty('--eye-x', `${Math.max(-3,Math.min(3,-(pointer.x-eyeBounds.left-eyeBounds.width/2)/35))}px`);
      cards[0].style.setProperty('--eye-y', `${Math.max(-2,Math.min(2,-(pointer.y-eyeBounds.top-35)/40))}px`);
    });
  });
  slide.addEventListener('pointerleave', resetPointerMotion);
  function cleanup() {
    resetPointerMotion();
    timers.forEach(clearTimeout); timers.clear();
    cards.forEach(card => card.classList.remove('replay'));
    if (!slide.classList.contains('active')) closeDetail();
  }
  window.addEventListener('slidechange', cleanup);
  reduced.addEventListener('change', cleanup);
  document.addEventListener('visibilitychange', () => { if(document.hidden) cleanup(); });
  new MutationObserver(() => { if (!motionEnabled()) cleanup(); }).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
