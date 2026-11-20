(() => {
  'use strict';
  const slide = document.querySelector('.comparison-slide');
  if (!slide) return;
  const right = slide.querySelector('.advanza-side');
  const stepButtons = [...slide.querySelectorAll('[data-compare-step]')].filter(node => node.tagName === 'BUTTON');
  const rows = [...right.querySelectorAll('.split-ad-bullets li')];
  const caption = slide.querySelector('.cmp-phase-caption');
  const announcement = slide.querySelector('.cmp-sr-status');
  const pauseButton = document.getElementById('comparisonPause');
  const replayButton = document.getElementById('comparisonReplay');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [
    { key: 'play', row: 0, text: 'Illustrative play: a shopper stops and taps the screen.' },
    { key: 'save', row: 1, text: 'Eligible offer: scan the pickup QR, log in, then save to a wallet.' },
    { key: 'redeem', row: 2, text: 'Illustrative redemption: present the saved coupon for store staff to verify.' },
    { key: 'track', row: 3, text: 'Illustrative events: play, save and redemption are recorded separately.' }
  ];
  const PHASE_DURATION = 3000;
  let index = 0;
  let wasActive = false;
  let userPaused = false;
  let manualStill = false;
  let timer = null;
  let deadline = 0;
  let remaining = PHASE_DURATION;
  let previousMotionOff = null;

  function stopTimer(preserveRemaining) {
    if (timer === null) return;
    if (preserveRemaining) remaining = Math.max(0, deadline - performance.now());
    clearTimeout(timer);
    timer = null;
  }

  function showStep(next, restart = false, announce = false) {
    stopTimer(false);
    index = next;
    remaining = PHASE_DURATION;
    const step = steps[index];
    if (restart) {
      right.dataset.compareStep = 'reset';
      // Reflow only on an explicit replay of the current scene, never per frame.
      void right.offsetWidth;
    }
    right.dataset.compareStep = step.key;
    stepButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.compareStep === step.key)));
    rows.forEach((row, rowIndex) => {
      row.classList.toggle('cmp-current-row', rowIndex === step.row);
      row.classList.toggle('cmp-related-row', step.key === 'save' && rowIndex === 2);
    });
    caption.textContent = step.text;
    // Automatic loops never repeatedly announce themselves to screen-reader users.
    if (announce) announcement.textContent = step.text;
  }

  function sync() {
    const active = slide.classList.contains('active');
    const motionOff = reducedMotion.matches || document.body.classList.contains('effects-paused');
    if (active !== wasActive) {
      stopTimer(false);
      manualStill = userPaused;
      showStep(0);
      wasActive = active;
    }
    if (motionOff !== previousMotionOff) {
      stopTimer(false);
      remaining = PHASE_DURATION;
      previousMotionOff = motionOff;
    }
    const running = active && !document.hidden && !motionOff && !userPaused;
    slide.classList.toggle('comparison-paused', !running);
    slide.classList.toggle('comparison-motion-off', motionOff);
    slide.classList.toggle('comparison-manual-still', manualStill);
    pauseButton.disabled = motionOff;
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.textContent = motionOff ? 'Motion off' : userPaused ? 'Resume demo' : 'Pause demo';
    pauseButton.title = motionOff ? 'Use the journey buttons to explore still previews; motion follows Effects and reduced-motion settings.' : 'Pause or resume the comparison animation';
    if (!running) {
      stopTimer(true);
      return;
    }
    if (timer !== null) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      showStep((index + 1) % steps.length);
      sync();
    }, remaining);
  }

  stepButtons.forEach(button => {
    button.addEventListener('click', () => {
      const next = steps.findIndex(step => step.key === button.dataset.compareStep);
      manualStill = userPaused;
      showStep(next, true, true);
      sync();
    });
  });
  pauseButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused && manualStill) {
      manualStill = false;
      showStep(index, true);
    }
    sync();
  });
  replayButton.addEventListener('click', () => {
    userPaused = false;
    manualStill = false;
    showStep(0, true, true);
    sync();
  });
  window.addEventListener('slidechange', sync);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  showStep(0);
  sync();
})();
