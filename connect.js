(() => {
  'use strict';
  const slide = document.querySelector('.connect-slide');
  if (!slide) return;
  const buttons = [...slide.querySelectorAll('.connect-stage-button')];
  const benefits = [...slide.querySelectorAll('.market-card')];
  const devices = [...slide.querySelectorAll('.connect-device')];
  const pauseButton = document.getElementById('connectPause');
  const replayButton = document.getElementById('connectReplay');
  const caption = slide.querySelector('.connect-phase-caption');
  const announcement = slide.querySelector('.connect-sr-status');
  const video = document.getElementById('connectGameplay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phases = [
    { key: 'play', duration: 3500, benefit: -1, text: 'Illustrative journey: play a short branded game at the kiosk.' },
    { key: 'save', duration: 4500, benefit: 0, text: 'Eligible offers only: scan the pickup QR, log in, then save to a wallet.' },
    { key: 'redeem', duration: 3500, benefit: 1, text: 'Illustrative redemption: present the saved coupon for participating store staff to verify.' },
    { key: 'complete', duration: 2500, benefit: 2, text: 'One connected experience: kiosk, wallet and store redemption. Pilot validation remains ahead.' }
  ];
  let index = 0;
  let userPaused = false;
  let manualStill = false;
  let wasActive = false;
  let previousMotionOff = null;
  let timer = null;
  let deadline = 0;
  let remaining = phases[0].duration;
  video.muted = true;

  function motionOff() {
    return reduced.matches || document.body.classList.contains('effects-paused');
  }
  function running() {
    return slide.classList.contains('active') && !document.hidden && !motionOff() && !userPaused;
  }
  function shouldPlayVideo() { return running() && index === 0; }
  function syncVideo() {
    if (!shouldPlayVideo()) {
      video.pause();
      return;
    }
    if (!video.paused) return;
    video.play().then(() => {
      // A navigation or pause may have happened while playback was starting.
      if (!shouldPlayVideo()) video.pause();
    }).catch(error => {
      if (shouldPlayVideo() && error.name !== 'AbortError') caption.textContent = 'Illustrative gameplay preview: select Retail kiosk to start the video.';
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
      slide.dataset.connectPhase = 'reset';
      // Explicit replay only; motion itself uses CSS, not a layout frame loop.
      void slide.offsetWidth;
    }
    slide.dataset.connectPhase = phase.key;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.connectStage === phase.key)));
    benefits.forEach((card, cardIndex) => card.classList.toggle('connect-benefit-current', cardIndex === phase.benefit));
    devices.forEach((device, deviceIndex) => device.setAttribute('aria-pressed', String(phases[deviceIndex].key === phase.key)));
    caption.textContent = phase.text;
    if (announce) announcement.textContent = phase.text;
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
    slide.classList.toggle('connect-paused', !enabled);
    slide.classList.toggle('connect-motion-off', off);
    slide.classList.toggle('connect-manual-still', manualStill);
    pauseButton.disabled = off;
    pauseButton.textContent = off ? 'Motion off' : userPaused ? 'Resume demo' : 'Pause demo';
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.title = off ? 'Explore still previews with the stage buttons; motion follows Effects and reduced-motion settings.' : 'Pause or resume the connected journey';
    syncVideo();
    if (!enabled) { stopTimer(true); return; }
    if (timer !== null) return;
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      showPhase((index + 1) % phases.length);
      sync();
    }, remaining);
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const next = phases.findIndex(phase => phase.key === button.dataset.connectStage);
    manualStill = userPaused;
    showPhase(next, true, true);
    sync();
  }));
  devices.forEach((device, deviceIndex) => {
    device.tabIndex = 0;
    device.setAttribute('role', 'button');
    device.setAttribute('aria-label', `Replay ${buttons[deviceIndex].textContent.trim()} stage`);
    device.addEventListener('click', () => buttons[deviceIndex].click());
    device.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        buttons[deviceIndex].click();
      }
    });
  });
  pauseButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused && manualStill) {
      manualStill = false;
      showPhase(index, true);
    }
    sync();
  });
  replayButton.addEventListener('click', () => {
    userPaused = false;
    manualStill = false;
    showPhase(0, true, true);
    sync();
  });
  window.addEventListener('slidechange', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  showPhase(0);
  sync();
})();
