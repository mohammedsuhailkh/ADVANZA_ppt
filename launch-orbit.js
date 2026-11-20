(() => {
  'use strict';
  const world = document.querySelector('.hero-world');
  const track = world.querySelector('.orbit-back');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...world.querySelectorAll('.floating-feature, .floating-gift')].map((icon, index) => {
    const layer = document.createElement('div');
    layer.className = 'orbit-satellite';
    icon.before(layer);
    layer.append(icon);
    // Separate the four touchpoints by a quarter turn on the same ellipse.
    return { layer, angle: [-2.9, -1.25, .45, 2.05][index] };
  });
  let geometry;
  let phase = 0;
  let lastTime = null;
  let frame = null;
  let hovered = false;
  const tilt = -19 * Math.PI / 180;
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  function measure() {
    const bounds = track.getBoundingClientRect();
    const origin = world.getBoundingClientRect();
    const scale = Math.min(bounds.width / 700, bounds.height / 600);
    geometry = {
      scale,
      x: bounds.left - origin.left + (bounds.width - 700 * scale) / 2,
      y: bounds.top - origin.top + (bounds.height - 600 * scale) / 2
    };
    render();
  }
  function render() {
    if (!geometry) return;
    items.forEach(({layer, angle}) => {
      const theta = angle + phase;
      const depth = Math.sin(theta);
      const x = 335 * Math.cos(theta), y = 135 * depth;
      const px = geometry.x + (350 + x * cos - y * sin) * geometry.scale;
      const py = geometry.y + (330 + x * sin + y * cos) * geometry.scale;
      const size = .87 + .13 * (depth + 1) / 2;
      layer.style.transform = `translate3d(${px}px,${py}px,0) translate(-50%,-50%) scale(${size})`;
      layer.style.zIndex = depth >= 0 ? '4' : '1';
      layer.dataset.depth = depth >= 0 ? 'front' : 'back';
    });
  }
  function enabled() {
    return !reduced.matches && !document.hidden && world.closest('.slide-card').classList.contains('active') && !document.body.classList.contains('effects-paused');
  }
  function tick(time) {
    frame = null;
    if (!enabled()) { lastTime = null; return; }
    if (lastTime !== null && !hovered && !world.querySelector('.floating-feature:focus-visible')) {
      phase = (phase + Math.min(time - lastTime, 64) / 1000 * Math.PI * 2 / 32) % (Math.PI * 2);
      render();
    }
    lastTime = time;
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (!enabled()) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; lastTime = null;
    } else if (frame === null) frame = requestAnimationFrame(tick);
  }
  world.querySelectorAll('.floating-feature').forEach(icon => {
    icon.addEventListener('pointerenter', () => { hovered = true; });
    icon.addEventListener('pointerleave', () => { hovered = false; });
  });
  new ResizeObserver(measure).observe(world);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('slidechange', sync);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  measure(); sync();
})();
