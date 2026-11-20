(() => {
  'use strict';
  const slide = document.querySelector('.campaign-slide');
  if (!slide) return;

  const stageButtons = [...slide.querySelectorAll('.campaign-navigation button')];
  const stepCards = [...slide.querySelectorAll('.flow-step-card')];
  const sceneNodes = [...slide.querySelectorAll('.campaign-scene')];
  const pauseButton = document.getElementById('campaignPause');
  const replayButton = document.getElementById('campaignReplay');
  const caption = document.getElementById('campaignCaption') || slide.querySelector('.campaign-caption');
  const announcement = slide.querySelector('.campaign-sr-status');
  const video = document.getElementById('campaignGameplay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const phases = [
    { key: 'brief', duration: 4000, stepIndex: 0, text: 'Illustrative brief: brand creatives, goals and offer conditions form the campaign input.' },
    { key: 'create', duration: 5000, stepIndex: 1, text: 'Playable ad creation: interactive HTML5 mini-game assembled with brand assets and offer logic.' },
    { key: 'publish', duration: 4500, stepIndex: 2, text: 'Review & approval: verified campaigns are scheduled and deployed to retail kiosk screens.' },
    { key: 'report', duration: 4500, stepIndex: 3, text: 'Event attribution: game completions, QR saves, and in-store redemptions tracked as separate events.' },
    { key: 'complete', duration: 3500, stepIndex: -1, text: 'End-to-end workflow: from brand brief to verified store visit and measurable event reporting.' }
  ];

  let index = 0;
  let userPaused = false;
  let manualStill = false;
  let wasActive = false;
  let previousMotionOff = null;
  let timer = null;
  let deadline = 0;
  let remaining = phases[0].duration;

  if (video) {
    video.muted = true;
  }

  function motionOff() {
    return reduced.matches || document.body.classList.contains('effects-paused');
  }

  function running() {
    return slide.classList.contains('active') && !document.hidden && !motionOff() && !userPaused;
  }

  function shouldPlayVideo() {
    return running() && phases[index].key === 'create';
  }

  function syncVideo() {
    if (!video) return;
    if (!shouldPlayVideo()) {
      video.pause();
      return;
    }
    if (!video.paused) return;
    video.play().then(() => {
      if (!shouldPlayVideo()) video.pause();
    }).catch(() => {
      // Autoplay or decode fallback
    });
  }

  function stopTimer(preserve) {
    if (timer === null) return;
    if (preserve) remaining = Math.max(0, deadline - performance.now());
    clearTimeout(timer);
    timer = null;
  }

  function showPhase(next, restart = false, announce = false) {
    stopTimer(false);
    index = next;
    const phase = phases[index];
    remaining = phase.duration;

    if (restart) {
      slide.dataset.campaignPhase = 'reset';
      void slide.offsetWidth;
    }

    slide.dataset.campaignPhase = phase.key;

    stageButtons.forEach(button => {
      const isMatch = button.dataset.campaignStage === phase.key;
      button.setAttribute('aria-pressed', String(isMatch));
    });

    stepCards.forEach((card, cardIdx) => {
      const isCurrent = cardIdx === phase.stepIndex || phase.stepIndex === -1;
      card.classList.toggle('campaign-card-current', isCurrent);
    });

    sceneNodes.forEach(node => {
      const isMatch = node.dataset.campaignNode === phase.key;
      node.setAttribute('aria-selected', String(isMatch));
    });

    if (caption) caption.textContent = phase.text;
    if (announcement && announce) announcement.textContent = phase.text;

    syncVideo();
  }

  function sync() {
    const active = slide.classList.contains('active');
    const off = motionOff();

    if (active !== wasActive) {
      stopTimer(false);
      manualStill = userPaused;
      showPhase(0);
      wasActive = active;
    }

    if (off !== previousMotionOff) {
      stopTimer(false);
      remaining = phases[index].duration;
      previousMotionOff = off;
    }

    const enabled = running();
    slide.classList.toggle('campaign-paused', !enabled);
    slide.classList.toggle('campaign-motion-off', off);
    slide.classList.toggle('campaign-manual-still', manualStill);

    if (pauseButton) {
      pauseButton.disabled = off;
      pauseButton.textContent = off ? 'Motion off' : userPaused ? 'Resume demo' : 'Pause demo';
      pauseButton.setAttribute('aria-pressed', String(userPaused));
      pauseButton.title = off ? 'Explore still previews with the stage buttons' : 'Pause or resume the campaign production workflow';
    }

    syncVideo();

    if (!enabled) {
      stopTimer(true);
      return;
    }

    if (timer !== null) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      showPhase((index + 1) % phases.length);
      sync();
    }, remaining);
  }

  // Stage button clicks
  stageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const next = phases.findIndex(p => p.key === button.dataset.campaignStage);
      if (next >= 0) {
        manualStill = userPaused;
        showPhase(next, true, true);
        sync();
      }
    });
  });

  // Flow cards clicks
  stepCards.forEach((card, cardIdx) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View stage ${cardIdx + 1}`);

    const activate = () => {
      manualStill = userPaused;
      showPhase(cardIdx, true, true);
      sync();
    };

    card.addEventListener('click', activate);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  // SVG nodes clicks
  sceneNodes.forEach(node => {
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    const key = node.dataset.campaignNode;
    node.setAttribute('aria-label', `Inspect ${key} node`);

    const activate = () => {
      const next = phases.findIndex(p => p.key === key);
      if (next >= 0) {
        manualStill = userPaused;
        showPhase(next, true, true);
        sync();
      }
    };

    node.addEventListener('click', activate);
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      userPaused = !userPaused;
      if (!userPaused && manualStill) {
        manualStill = false;
        showPhase(index, true);
      }
      sync();
    });
  }

  if (replayButton) {
    replayButton.addEventListener('click', () => {
      userPaused = false;
      manualStill = false;
      showPhase(0, true, true);
      sync();
    });
  }

  window.addEventListener('slidechange', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  showPhase(0);
  sync();
})();
