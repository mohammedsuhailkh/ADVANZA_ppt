/**
 * ADVANZA EXECUTIVE DECK ENGINE
 * 13-Slide Discrete 1-to-1 Navigation & Presenter Script Toggle
 */

(function () {
  'use strict';

  // DOM Elements
  const slides = Array.from(document.querySelectorAll('.slide-card'));
  const slidesContainer = document.getElementById('slidesContainer');
  const progressBar = document.getElementById('progressBar');
  const sheetDotsContainer = document.getElementById('sheetDots');
  const currSlideNumEl = document.getElementById('currSlideNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fsBtn = document.getElementById('fsBtn');

  const totalSlides = slides.length;
  slidesContainer.style.height = `${totalSlides * 100}vh`;
  document.querySelector('.total-num').textContent = totalSlides;
  let currentIndex = 0;
  let isTransitioning = false;
  let transitionTimer;
  const TRANSITION_DURATION = 700; // ms cooldown for discrete page flip

  // Build Right Sidebar Indicator Dots
  function buildDots() {
    sheetDotsContainer.innerHTML = '';
    slides.forEach((slide, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `dot-pill ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('data-index', idx);
      dot.setAttribute('aria-label', `Slide ${idx + 1}`);

      const tooltip = document.createElement('span');
      tooltip.className = 'dot-tooltip';
      tooltip.textContent = `${(idx + 1).toString().padStart(2, '0')}. ${slide.dataset.topic || 'Slide'}`;
      dot.appendChild(tooltip);

      dot.addEventListener('click', () => {
        goToSlide(idx);
      });

      sheetDotsContainer.appendChild(dot);
    });
  }

  // Update Visual Indicators
  function updateIndicators(index) {
    // Current Slide Number '01' to '12'
    const formattedNum = (index + 1).toString().padStart(2, '0');
    currSlideNumEl.textContent = formattedNum;

    // Top Progress Bar
    const pct = ((index + 1) / totalSlides) * 100;
    progressBar.style.width = `${pct}%`;

    // Sidebar Dots
    const dots = sheetDotsContainer.querySelectorAll('.dot-pill');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
      dot.setAttribute('aria-current', idx === index ? 'step' : 'false');
    });

    // Active Slide Class
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });

    // Hash sync
    if (window.location.hash !== `#slide-${index + 1}`) window.location.hash = `slide-${index + 1}`;
    slides.forEach((slide, idx) => { slide.inert = idx !== index; });
    window.dispatchEvent(new CustomEvent("slidechange", { detail: { index } }));
  }

  // Go to Slide Index
  function goToSlide(targetIndex) {
    if (targetIndex < 0 || targetIndex >= totalSlides) return;
    if (targetIndex === currentIndex && slidesContainer.style.transform) return;

    clearTimeout(transitionTimer);
    isTransitioning = true;
    currentIndex = targetIndex;

    // Pause any playing videos when moving between slides
    document.querySelectorAll('video').forEach((vid) => {
      vid.pause();
    });

    // Vertical discrete translation
    slidesContainer.style.transform = `translateY(-${currentIndex * 100}vh)`;

    updateIndicators(currentIndex);

    transitionTimer = setTimeout(() => {
      isTransitioning = false;
    }, TRANSITION_DURATION);
  }

  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }


  // 1. Mouse Wheel Listener (Debounced 1 flick = exactly 1 page flip)
  let wheelAccumulator = 0;
  window.addEventListener('wheel', (e) => {
    const scrollArea = e.target.closest('.slide-scroll');
    if (scrollArea && /auto|scroll/.test(getComputedStyle(scrollArea).overflowY) && scrollArea.scrollHeight > scrollArea.clientHeight) return;
    e.preventDefault();
    if (isTransitioning) return;

    wheelAccumulator += e.deltaY;

    if (wheelAccumulator > 30) {
      wheelAccumulator = 0;
      nextSlide();
    } else if (wheelAccumulator < -30) {
      wheelAccumulator = 0;
      prevSlide();
    }
  }, { passive: false });

  // 2. Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('button, a, input, select, textarea, [role=tab], video')) return;
    if (isTransitioning && e.key !== 'f' && e.key !== 'F') return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
      case ' ': // Space
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;

      case 'f':
      case 'F':
        toggleFullscreen();
        break;

      default:
        // Number keys 1-9 directly jumps to slide 1-9
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && num <= totalSlides) {
          goToSlide(num - 1);
        } else if (e.key === '0' && totalSlides >= 10) {
          goToSlide(9); // 10th slide
        }
        break;
    }
  });

  // 3. Touch Swipe Handling
  let touchStartY = 0;
  let touchStartX = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, video, .slide-scroll')) return;
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (e.target.closest('button, video, .slide-scroll')) return;
    if (isTransitioning || e.changedTouches.length === 0) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    const deltaX = touchStartX - e.changedTouches[0].clientX;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 40) {
        nextSlide();
      } else if (deltaY < -40) {
        prevSlide();
      }
    }
  }, { passive: true });

  // 4. Fullscreen Controller
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Button Listeners
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

  // Initialize from Hash or First Slide
  function init() {
    buildDots();

    const hash = window.location.hash;
    const match = hash.match(/#slide-(\d+)/);
    if (match) {
      const initialSlide = parseInt(match[1], 10) - 1;
      if (initialSlide >= 0 && initialSlide < totalSlides) {
        goToSlide(initialSlide);
        return;
      }
    }

    goToSlide(0);
  }

  function initAmbientEffects() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let requested = true;
    const icons = {
      screen: '<rect x="8" y="7" width="34" height="25" rx="3"/><path d="M25 32v8m-10 0h20"/>',
      store: '<path d="M8 21h34v22H8zM5 21l5-12h30l5 12M20 43V29h10v14M8 21h34"/>',
      person: '<circle cx="25" cy="10" r="5"/><path d="M25 15v18m-10-9 10-5 10 5M25 33l-9 12m9-12 9 12"/>',
      game: '<path d="M14 15h22c8 0 12 22 5 24-4 1-7-7-10-7H19c-3 0-6 8-10 7-7-2-3-24 5-24zM13 23v9m-5-4h10"/><circle cx="34" cy="24" r="1"/><circle cx="39" cy="29" r="1"/>',
      coupon: '<path d="M7 12h36v10a5 5 0 0 0 0 10v10H7V32a5 5 0 0 0 0-10zM30 12v30"/><path d="m15 32 9-12"/>',
      qr: '<path d="M7 7h13v13H7zM30 7h13v13H30zM7 30h13v13H7zM30 30h5v5h8v8H30z"/>',
      wallet: '<rect x="7" y="12" width="36" height="30" rx="4"/><path d="M7 18V9l29-4v7M32 24h13v12H32z"/>',
      check: '<path d="m10 25 10 10 22-23"/>',
      pin: '<path d="M25 45S10 29 10 18a15 15 0 0 1 30 0c0 11-15 27-15 27z"/><circle cx="25" cy="18" r="5"/>',
      brand: '<path d="M8 8h22l14 14-22 22L8 30z"/><circle cx="17" cy="17" r="2"/>',
      signal: '<path d="M8 40h5V28H8zM22 40h5V18h-5zM36 40h5V8h-5z"/>',
      flag: '<path d="M12 45V7m0 0h28l-6 10 6 10H12"/>',
      link: '<path d="m20 30 10-10m-6-5 6-6a9 9 0 0 1 13 13l-6 6M26 35l-6 6A9 9 0 0 1 7 28l6-6"/>'
    };
    const scenes = [
      ['screen', 'person', 'store'], ['screen', 'person', 'person'],
      ['screen', 'game', 'coupon'], ['brand', 'game', 'coupon', 'store'],
      ['screen', 'game', 'qr'], ['game', 'coupon', 'qr', 'wallet', 'check'],
      ['game', 'wallet', 'check', 'signal'], ['brand', 'link', 'store', 'coupon'],
      ['person', 'screen', 'store'], ['pin', 'brand', 'check'],
      ['pin', 'flag', 'store', 'link'], ['brand', 'link', 'store']
    ];
    slides.forEach((slide) => {
      const slideIndex = Number(slide.dataset.motionIndex);
      const layer = document.createElement('div');
      layer.className = `story-effects story-scene-${slideIndex}`;
      layer.setAttribute('aria-hidden', 'true');
      const steps = scenes[slideIndex] || ['screen', 'game', 'wallet', 'store'];
      layer.innerHTML = `<svg viewBox="0 0 600 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path class="story-route" pathLength="1" d="M40 32H560"/>${steps.map((icon, i) => {
        const x = 40 + i * 520 / (steps.length - 1);
        return `<g class="story-node" style="--story-delay:${i * .45}s" transform="translate(${x - 25} 7)"><rect class="story-tile" x="-5" y="-5" width="60" height="60" rx="12"/>${icons[icon]}</g>`;
      }).join('')}<circle class="story-traveller" cx="40" cy="32" r="4"/></svg>`;
      slide.appendChild(layer);
      const backdrop = document.createElement('div');
      backdrop.className = `cinematic-backdrop cinematic-theme-${slideIndex % 4}`;
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.innerHTML = `<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="beam-${slideIndex}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1557ff" stop-opacity=".3"/><stop offset="1" stop-color="#c8cfff" stop-opacity="0"/></linearGradient></defs><path class="cinema-ribbon" d="M850 -180C1500 150 350 490 1550 1000" fill="none" stroke="url(#beam-${slideIndex})" stroke-width="180"/><g class="cinema-orbits" fill="none" stroke="currentColor"><ellipse cx="1200" cy="450" rx="310" ry="390"/><ellipse cx="1200" cy="450" rx="220" ry="310"/><ellipse cx="1200" cy="450" rx="130" ry="210"/></g><path class="cinema-signal" d="M0 800H260L320 740H560L640 820H1000L1120 700H1440" fill="none" stroke="currentColor" stroke-width="2"/><g class="cinema-stars" fill="currentColor"><path d="M1200 120v26m-13-13h26M1050 750v18m-9-9h18M140 190v20m-10-10h20"/></g></svg>`;
      slide.prepend(backdrop);
      const frame = slide.querySelector('.photo-frame');
      if (frame) {
        const hud = document.createElement('div');
        hud.className = 'visual-hud';
        hud.setAttribute('aria-hidden', 'true');
        const labels = {0:'SCREEN TO STORE',1:'PASSIVE ATTENTION',2:'TAP. PLAY. DISCOVER.',4:'PLAYABLE RETAIL MEDIA',8:'CONNECTED RETAIL'};
        hud.innerHTML = `<span class="visual-status"></span><span>${labels[slideIndex] || 'ADVANZA EXPERIENCE'}</span><svg viewBox="0 0 70 20"><path d="M0 15h10l5-10 8 15 8-17 8 12h31" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
        frame.appendChild(hud);
      }

      slide.querySelectorAll('.journey-card, .flow-step-card, .metric-card, .market-card, .checklist-row, .benefit-row, .roadmap-node').forEach((item, i) => {
        item.classList.add('story-emphasis');
        item.style.setProperty('--story-delay', `${.35 + i * .45}s`);
      });
    });
    const game = document.querySelector('.game-screen');
    const brand = document.querySelector('.brand-screen');
    const reward = document.querySelector('.reward-screen');
    if (brand) brand.insertAdjacentHTML('afterbegin', '<div class="creative-art" aria-hidden="true"><span>&#10022;</span><span>&#10022;</span><span>&#10022;</span></div>');
    if (game) game.insertAdjacentHTML('afterbegin', '<div class="game-art" aria-hidden="true"><i></i><i></i><i></i><div class="slice-trail"></div></div>');
    if (reward) reward.insertAdjacentHTML('afterbegin', '<div class="reward-art" aria-hidden="true"><svg viewBox="0 0 140 90"><path d="M10 10h120v25a10 10 0 0 0 0 20v25H10V55a10 10 0 0 0 0-20z" fill="#fff" stroke="#fbbf24" stroke-width="2"/><path d="M95 10v70" stroke="#fbbf24" stroke-dasharray="4 4"/><path d="m40 52 10 10 22-29" fill="none" stroke="#dc2626" stroke-width="5"/></svg></div>');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hud-btn';
    toggle.id = 'effectsToggle';
    toggle.setAttribute('aria-label', 'Toggle visual animations');
    document.querySelector('.hud-right').prepend(toggle);
    const update = () => {
      const enabled = requested && !reducedMotion.matches;
      document.body.classList.toggle('effects-paused', !enabled);
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.textContent = enabled ? 'Effects on' : 'Effects off';
      toggle.disabled = reducedMotion.matches;
      toggle.title = reducedMotion.matches ? 'Animations disabled by your reduced-motion preference' : 'Turn background effects on or off';
    };
    toggle.addEventListener('click', () => { requested = !requested; update(); });
    reducedMotion.addEventListener('change', update);
    document.addEventListener('visibilitychange', () => {
      document.body.classList.toggle('effects-hidden', document.hidden);
    });
    update();
  }

  window.addEventListener('hashchange', () => {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (match) goToSlide(Number(match[1]) - 1);
  });
  initAmbientEffects();
  init();
})();
