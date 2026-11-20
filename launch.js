(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide-card')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const icons = {
    play: '<path d="M14 16h20c8 0 12 22 5 23-4 1-6-7-10-7H19c-4 0-6 8-10 7-7-1-3-23 5-23Z"/><path d="M14 22v10m-5-5h10"/><circle cx="33" cy="24" r="1"/><circle cx="38" cy="29" r="1"/>',
    save: '<path d="M5 13h38v9a5 5 0 0 0 0 10v7H5v-7a5 5 0 0 0 0-10Z"/><path d="m18 32 12-14"/><circle cx="18" cy="20" r="2"/><circle cx="30" cy="30" r="2"/>',
    scan: '<path d="M5 16V5h11m16 0h11v11M5 32v11h11m16 0h11V32M13 13h7v7h-7Zm15 0h7v7h-7ZM13 28h7v7h-7Zm15 0h7v7h-7Z"/>'
  };
  const svg = key => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;
  document.querySelectorAll('[data-hero-step]').forEach(button => {
    button.innerHTML = svg(button.dataset.heroStep);
    button.addEventListener('click', () => showPreview(button.dataset.heroStep));
  });
  document.querySelectorAll('.mini-icon').forEach((icon, index) => { icon.innerHTML = svg(['play','save','scan'][index]); });
  const gameplay = document.getElementById('kioskGameplay');
  const caption = document.querySelector('.hero-world-caption');
  const descriptionsByStep = {
    play: 'Play: a short branded game starts on the touchscreen.',
    save: 'Save: eligible offers can be saved after login. Availability and campaign rules apply.',
    scan: 'Redeem: scan on your phone, log in, save, then present to store staff.'
  };
  function showPreview(step) { caption.textContent = descriptionsByStep[step]; }
  function syncGameplay() {
    if (slides[0].classList.contains('active') && !document.hidden && !motion.matches) {
      gameplay.play().catch(() => { caption.textContent = 'Gameplay preview - press Play on the screen to start.'; });
    } else gameplay.pause();
  }
  gameplay.muted = true;
  window.addEventListener('slidechange', syncGameplay);
  document.addEventListener('visibilitychange', syncGameplay);
  motion.addEventListener('change', syncGameplay);
  syncGameplay();
  const go = index => document.querySelectorAll('.dot-pill')[index].click();
  document.getElementById('exploreBtn').addEventListener('click', () => go(2));
  document.getElementById('watchBtn').addEventListener('click', () => go(1));
  slides.forEach((slide, index) => {
    slide.classList.add('slide-scroll');
    const light = document.createElement('div'); light.className = 'cursor-light'; light.setAttribute('aria-hidden','true'); slide.prepend(light);
    slide.querySelectorAll('.market-card,.metric-card,.journey-card,.flow-step-card,.benefit-row,.rev-card,.invest-card,.split-ad-side').forEach((card, i) => {
      card.classList.add('launch-reveal'); card.style.setProperty('--reveal-delay', `${Math.min(i * .08 + .1, .6)}s`);
    });
    slide.addEventListener('pointermove', event => {
      if (motion.matches || document.body.classList.contains('effects-paused') || event.pointerType !== 'mouse') return;
      const bounds = slide.getBoundingClientRect();
      light.style.setProperty('--px', `${event.clientX-bounds.left}px`); light.style.setProperty('--py', `${event.clientY-bounds.top}px`);
    });
  });
  const world = document.querySelector('.hero-world');
  world.addEventListener('pointermove', event => {
    if(motion.matches || document.body.classList.contains('effects-paused') || event.pointerType !== 'mouse') return;
    const rect=world.getBoundingClientRect(); world.style.setProperty('--my', `${(event.clientY-rect.top-rect.height/2)/100}deg`);
  });
  world.addEventListener('pointerleave', () => world.style.setProperty('--my','0deg'));
  // A selectable walkthrough explains each real product step without fabricating results.
  const journey = document.querySelector('[data-topic="The Shopper Journey"]');
  const bar = document.createElement('div'); bar.className='journey-demo-bar';
  const coupon = document.createElement('button'); coupon.type='button'; coupon.className='demo-coupon'; coupon.setAttribute('aria-pressed','false');
  coupon.innerHTML='<strong>Illustrative coupon ↗</strong><span>Tap to see redemption conditions</span>';
  const status = document.createElement('p'); status.className='journey-demo-status';status.setAttribute('aria-live','polite');status.textContent='Select a step above to explore the journey.';
  bar.append(coupon,status);journey.querySelector('.journey-grid').after(bar);
  coupon.addEventListener('click',()=>{const open=coupon.getAttribute('aria-pressed')!=='true';coupon.setAttribute('aria-pressed',String(open));coupon.innerHTML=open?'<strong>Availability & eligibility apply</strong><span>Login required · Store staff verify redemption</span>':'<strong>Illustrative coupon ↗</strong><span>Tap to see redemption conditions</span>';});
  const descriptions=['A short branded game is the entry point.','The campaign checks offer eligibility and remaining stock.','A pickup QR continues the experience on the shopper’s own phone.','Login links the saved coupon to the shopper’s wallet.','Store staff verify the saved coupon at redemption.','Game activity, coupon saves and redemption are separate events.'];
  journey.querySelectorAll('.journey-card').forEach((card,i)=>{
    card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-pressed','false');
    const select=()=>{journey.querySelectorAll('.journey-card').forEach(other=>{other.classList.toggle('is-selected',other===card);other.setAttribute('aria-pressed',String(other===card));});status.textContent=descriptions[i];};
    card.addEventListener('click',select);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();select();}});
  });
  window.addEventListener('slidechange', ({detail}) => {
    // Inactive slides never retain keyboard focus; native media controls keep their own shortcuts.
    const active = document.activeElement;
    if(active && active.closest('.slide-card') && !slides[detail.index].contains(active)) active.blur();
  });
})();
// Small pointer tilt, independent of entrance transforms; motion preferences always win.
document.querySelectorAll('.market-card,.invest-card,.rev-card').forEach(card => {
  card.addEventListener('pointermove', event => {
    if(event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('effects-paused')) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--tilt', `${(event.clientX-bounds.left-bounds.width/2)/bounds.width*1.5}deg`);
  });
  card.addEventListener('pointerleave', () => card.style.setProperty('--tilt','0deg'));
});
