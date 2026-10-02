/*
  Dusty windscreen for the hero.

  The idea: a barn-find car. You see it through glass covered in years of
  dust, and you wipe the dust off to see what is underneath.

  How it works:
  1. `mask` is an offscreen canvas that holds the dust. We paint it once.
  2. Moving the cursor (or a finger) erases a soft circle from the mask using
     the "destination-out" blend mode. That is the wipe.
  3. Every few frames a very small amount of dust settles back, so the glass
     never stays perfectly clean.
  4. Dust motes float slowly in front of the glass, like dust in lamp light.
  5. Each frame we draw the mask onto the visible canvas, then the motes.

  The loop pauses when the hero is off screen or the tab is hidden, which
  keeps the page light for Lighthouse and for phone batteries.
*/
(function () {
  const canvas = document.querySelector(".dust");
  if (!canvas) return;

  const hero = canvas.closest(".hero");
  const hint = document.querySelector(".wipe-hint");
  const ctx = canvas.getContext("2d");
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");
  const dustTexture = document.createElement("canvas");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let motes = [];
  let running = false;
  let frame = 0;
  let last = null;   // last pointer position, for smooth strokes
  let wiped = 0;     // how far the user has wiped, to hide the hint

  /* ---------- setup ---------- */

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap for speed
    width = rect.width;
    height = rect.height;

    for (const c of [canvas, mask, dustTexture]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    paintDustTexture();
    mctx.globalCompositeOperation = "source-over";
    mctx.drawImage(dustTexture, 0, 0, width, height);
    makeMotes();
  }

  // Dark grime with soft patches, fine grit, and a few old wiper arcs.
  function paintDustTexture() {
    const f = dustTexture.getContext("2d");
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, width, height);
    f.fillStyle = "rgba(14, 38, 60, 0.94)";
    f.fillRect(0, 0, width, height);

    // soft patches where dust is thicker
    const area = width * height;
    for (let i = 0; i < area / 9000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 20 + Math.random() * 90;
      const g = f.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(169, 188, 203, 0.06)");
      g.addColorStop(1, "rgba(169, 188, 203, 0)");
      f.fillStyle = g;
      f.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // fine grit
    f.fillStyle = "rgba(200, 212, 222, 0.08)";
    for (let i = 0; i < area / 700; i++) {
      f.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }

    // faint arcs left by an old wiper, years ago
    f.strokeStyle = "rgba(169, 188, 203, 0.025)";
    f.lineWidth = 26;
    for (let i = 0; i < 3; i++) {
      f.beginPath();
      f.arc(width * (0.3 + i * 0.25), height * 1.05, height * (0.55 + i * 0.05), Math.PI * 1.15, Math.PI * 1.85);
      f.stroke();
    }
  }

  /* ---------- wiping ---------- */

  function eraseCircle(x, y, r) {
    const g = mctx.createRadialGradient(x, y, r * 0.35, x, y, r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    mctx.globalCompositeOperation = "destination-out";
    mctx.fillStyle = g;
    mctx.beginPath();
    mctx.arc(x, y, r, 0, Math.PI * 2);
    mctx.fill();
  }

  // Fill the gap between two pointer positions so fast moves stay smooth.
  function wipeTo(x, y, byUser = true) {
    const r = Math.max(36, Math.min(width, height) * 0.07);
    if (!last) last = { x, y };
    const dx = x - last.x;
    const dy = y - last.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.3)));
    for (let i = 1; i <= steps; i++) {
      eraseCircle(last.x + (dx * i) / steps, last.y + (dy * i) / steps, r);
    }
    last = { x, y };

    if (byUser) {
      wiped += dist;
      if (hint && wiped > 400) hint.classList.add("is-gone");
    }
    if (!running) draw(); // keep the view fresh even when paused
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener("pointermove", (e) => {
    const p = pointerPos(e);
    wipeTo(p.x, p.y);
  });
  canvas.addEventListener("pointerleave", () => { last = null; });
  canvas.addEventListener("pointercancel", () => { last = null; });
  canvas.addEventListener("pointerdown", (e) => {
    last = null;
    const p = pointerPos(e);
    wipeTo(p.x, p.y);
  });

  /* ---------- dust motes ---------- */

  function makeMotes() {
    const count = Math.round(Math.min(40, width / 30));
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.12, // warm air, motes drift up
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function updateMotes() {
    for (const m of motes) {
      m.phase += 0.01;
      m.x += m.vx + Math.sin(m.phase) * 0.12;
      m.y += m.vy;
      if (m.y < -5) { m.y = height + 5; m.x = Math.random() * width; }
      if (m.x < -5) m.x = width + 5;
      if (m.x > width + 5) m.x = -5;
    }
  }

  function drawMotes() {
    for (const m of motes) {
      const glow = 0.25 + 0.2 * Math.sin(m.phase * 2);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(242, 214, 170, ${glow})`; // lit by the amber lamp
      ctx.fill();
    }
  }

  /* ---------- main loop ---------- */

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mask, 0, 0, width, height);
    drawMotes();
  }

  function tick() {
    if (!running) return;
    frame++;

    // dust slowly settles back on the glass
    if (frame % 3 === 0) {
      mctx.globalCompositeOperation = "source-over";
      mctx.globalAlpha = 0.008;
      mctx.drawImage(dustTexture, 0, 0, width, height);
      mctx.globalAlpha = 1;
    }

    updateMotes();
    draw();
    requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }

  // One wipe on load, so people on phones see the car right away
  // and understand what the glass does.
  function introWipe() {
    const car = document.querySelector(".hero-car").getBoundingClientRect();
    const box = hero.getBoundingClientRect();
    const cx = car.left - box.left + car.width * 0.5;
    const cy = car.top - box.top + car.height * 0.55;
    const span = car.width * 0.36;
    const wave = car.height * 0.12;

    if (reduceMotion) {
      // no animation: just clear the area over the car
      for (let a = -1; a <= 1; a += 0.05) {
        eraseCircle(cx + a * span, cy + Math.sin(a * 3) * wave, 90);
      }
      draw();
      return;
    }

    const duration = 1400;
    const t0 = performance.now();
    last = null;
    (function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 3); // ease out
      const a = -1 + e * 2;
      wipeTo(cx + a * span, cy + Math.sin(a * 3) * wave, false);
      if (t < 1) requestAnimationFrame(step);
      else last = null;
    })(t0);
  }

  /* ---------- wiring ---------- */

  resize();
  draw();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    // phones fire resize when the address bar hides; only reset on a real width change
    resizeTimer = setTimeout(() => {
      if (Math.abs(hero.getBoundingClientRect().width - width) < 2) return;
      resize();
      draw();
    }, 150);
  });

  new IntersectionObserver(([entry]) => {
    entry.isIntersecting ? start() : stop();
  }).observe(hero);

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  // wait for fonts so the intro does not fight the layout shift
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    setTimeout(introWipe, 500);
  });
})();
