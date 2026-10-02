/*
  Fogged glass for the hero.

  How it works:
  1. `mask` is an offscreen canvas that holds the fog. We paint fog into it once.
  2. Moving the cursor (or a finger) erases a soft circle from the mask using
     the "destination-out" blend mode. That is the wipe.
  3. Every few frames we paint a tiny bit of fog back, so the glass slowly
     fogs up again, like a real windscreen.
  4. Rain drops slide down the glass. Each drop also erases a thin line from
     the mask, so it leaves a clear trail behind it.
  5. Each frame we draw the mask onto the visible canvas, then the drops on top.

  The loop pauses when the hero is off screen or the tab is hidden, which
  keeps the page light for Lighthouse and for phone batteries.
*/
(function () {
  const canvas = document.querySelector(".fog");
  if (!canvas) return;

  const hero = canvas.closest(".hero");
  const hint = document.querySelector(".wipe-hint");
  const ctx = canvas.getContext("2d");
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");
  const fogTexture = document.createElement("canvas");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let drops = [];
  let running = false;
  let frame = 0;
  let last = null;        // last pointer position, for smooth strokes
  let wiped = 0;          // how far the user has wiped, to hide the hint

  /* ---------- setup ---------- */

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap for speed
    width = rect.width;
    height = rect.height;

    for (const c of [canvas, mask, fogTexture]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    paintFogTexture();
    mctx.globalCompositeOperation = "source-over";
    mctx.drawImage(fogTexture, 0, 0, width, height);
    drops = [];
  }

  // A dark, misty layer with soft lighter patches, like breath on glass at night.
  function paintFogTexture() {
    const f = fogTexture.getContext("2d");
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, width, height);
    f.fillStyle = "rgba(16, 42, 66, 0.93)";
    f.fillRect(0, 0, width, height);

    const blobs = Math.round((width * height) / 9000);
    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 20 + Math.random() * 90;
      const g = f.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(169, 188, 203, 0.06)");
      g.addColorStop(1, "rgba(169, 188, 203, 0)");
      f.fillStyle = g;
      f.fillRect(x - r, y - r, r * 2, r * 2);
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

  /* ---------- rain drops ---------- */

  function spawnDrop() {
    drops.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      r: 1.5 + Math.random() * 3,
      vy: 0,
      wait: 60 + Math.random() * 240, // drops stick for a while, then slide
    });
  }

  function updateDrops() {
    if (drops.length < Math.min(28, width / 40) && Math.random() < 0.08) spawnDrop();

    mctx.globalCompositeOperation = "destination-out";
    mctx.strokeStyle = "rgba(0,0,0,0.3)";
    mctx.lineCap = "round";

    for (const d of drops) {
      if (d.wait > 0) { d.wait--; continue; }
      const prevY = d.y;
      d.vy = Math.min(d.vy + 0.02 * d.r, 1.2 * d.r);
      d.y += d.vy;
      d.x += (Math.random() - 0.5) * 0.6;
      // the trail: a clear line where the drop slid
      mctx.lineWidth = d.r * 0.9;
      mctx.beginPath();
      mctx.moveTo(d.x, prevY);
      mctx.lineTo(d.x, d.y);
      mctx.stroke();
    }
    drops = drops.filter((d) => d.y < height + 10);
  }

  function drawDrops() {
    for (const d of drops) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 238, 241, 0.16)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.35, d.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 238, 241, 0.55)";
      ctx.fill();
    }
  }

  /* ---------- main loop ---------- */

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mask, 0, 0, width, height);
    drawDrops();
  }

  function tick() {
    if (!running) return;
    frame++;

    // slowly fog the glass back up
    if (frame % 3 === 0) {
      mctx.globalCompositeOperation = "source-over";
      mctx.globalAlpha = 0.018;
      mctx.drawImage(fogTexture, 0, 0, width, height);
      mctx.globalAlpha = 1;
    }

    updateDrops();
    draw();
    requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(tick);
  }
  function stop() { running = false; }

  // A single wipe on load, so people on phones see the car right away
  // and understand what the glass does.
  function introWipe() {
    // aim the wipe at the drawing of the car
    const car = document.querySelector(".hero-car").getBoundingClientRect();
    const box = hero.getBoundingClientRect();
    const cx = car.left - box.left + car.width * 0.5;
    const cy = car.top - box.top + car.height * 0.55;
    const span = car.width * 0.36;

    if (reduceMotion) {
      // no animation: just clear the area over the car
      for (let a = -1; a <= 1; a += 0.05) {
        eraseCircle(cx + a * span, cy + Math.sin(a * 3) * 30, 90);
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
      wipeTo(cx + a * span, cy + Math.sin(a * 3) * car.height * 0.12, false);
      if (t < 1) requestAnimationFrame(step);
      else { last = null; wiped = 0; }
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
