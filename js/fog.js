/*
  FogGlass: a fogged-up sapphire crystal you can wipe clean.

  Used on the hero watch. Breathe on a watch glass and it fogs; wipe it with
  your thumb and the dial shows through. The fog slowly comes back.

  How it works:
  1. `mask` is an offscreen canvas that holds the fog. We paint it once
     into `texture`, then copy it.
  2. Moving the cursor or a finger erases a soft circle from the mask using
     the "destination-out" blend mode. That is the wipe.
  3. Every few frames a very small amount of the texture is painted back, so
     the glass slowly fogs up again.
  4. Each frame we copy the mask to the visible canvas.

  Loops only run while the glass is on screen and the tab is visible.
*/
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function FogGlass(canvas, options = {}) {
    const opts = Object.assign({
      tint: "rgba(214, 216, 214, 0.42)", // colour of the fog
      motes: false,                    // floating specks
      wiperArcs: false,                // faint old wiper marks
      overlay: null,                   // function(ctx, w, h) that draws on the fog
      hint: null,                      // element to hide once the user wipes
      brush: 0.07,                     // brush size, as a share of the short side
      settle: 0.008,                   // how fast fog comes back
      onWipe: null,                    // called with the share of glass wiped
    }, options);

    const host = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    const texture = document.createElement("canvas");

    let width = 0, height = 0, dpr = 1;
    let motes = [];
    let running = false;
    let visible = false;
    let frame = 0;
    let last = null;
    let wiped = 0;

    /* ---------- setup ---------- */

    function resize() {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      for (const c of [canvas, mask, texture]) {
        c.width = Math.max(1, Math.round(width * dpr));
        c.height = Math.max(1, Math.round(height * dpr));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintTexture();
      mctx.globalCompositeOperation = "source-over";
      mctx.drawImage(texture, 0, 0, width, height);
      if (opts.motes) makeMotes();
      draw();
    }

    function paintTexture() {
      const f = texture.getContext("2d");
      f.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.clearRect(0, 0, width, height);
      f.fillStyle = opts.tint;
      f.fillRect(0, 0, width, height);

      const area = width * height;
      // soft patches where the fog is thicker
      for (let i = 0; i < area / 9000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 20 + Math.random() * 90;
        const g = f.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255, 255, 255, 0.08)");
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        f.fillStyle = g;
        f.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // fine grit
      f.fillStyle = "rgba(255, 255, 255, 0.12)";
      for (let i = 0; i < area / 700; i++) {
        f.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
      if (opts.wiperArcs) {
        f.strokeStyle = "rgba(255, 255, 255, 0.04)";
        f.lineWidth = 26;
        for (let i = 0; i < 3; i++) {
          f.beginPath();
          f.arc(width * (0.3 + i * 0.25), height * 1.05, height * (0.55 + i * 0.05), Math.PI * 1.15, Math.PI * 1.85);
          f.stroke();
        }
      }
      if (opts.overlay) opts.overlay(f, width, height);
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

    // Fill the gap between two positions so fast moves stay smooth.
    function wipeTo(x, y, byUser = true) {
      const r = Math.max(22, Math.min(width, height) * opts.brush);
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
        if (opts.hint && wiped > 300) opts.hint.classList.add("is-gone");
        if (opts.onWipe) opts.onWipe(wiped);
      }
      if (!running) draw();
    }

    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    canvas.addEventListener("pointermove", (e) => { const p = pos(e); wipeTo(p.x, p.y); });
    canvas.addEventListener("pointerdown", (e) => { last = null; const p = pos(e); wipeTo(p.x, p.y); });
    canvas.addEventListener("pointerleave", () => { last = null; });
    canvas.addEventListener("pointercancel", () => { last = null; });

    /* ---------- motes ---------- */

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
        ctx.fillStyle = `rgba(242, 214, 170, ${glow})`;
        ctx.fill();
      }
    }

    /* ---------- loop ---------- */

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(mask, 0, 0, width, height);
      if (opts.motes) drawMotes();
    }

    function tick() {
      if (!running) return;
      frame++;
      if (frame % 3 === 0 && opts.settle > 0) {
        mctx.globalCompositeOperation = "source-over";
        mctx.globalAlpha = opts.settle;
        mctx.drawImage(texture, 0, 0, width, height);
        mctx.globalAlpha = 1;
      }
      if (opts.motes) updateMotes();
      draw();
      requestAnimationFrame(tick);
    }

    function start() {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      requestAnimationFrame(tick);
    }
    function stop() { running = false; }

    /* ---------- wiring ---------- */

    resize();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      // phones fire resize when the address bar hides; only reset on a real width change
      resizeTimer = setTimeout(() => {
        if (Math.abs(host.getBoundingClientRect().width - width) < 2) return;
        resize();
      }, 150);
    });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    }).observe(host);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    return {
      // scripted wipe along a wave, used for the hero intro
      sweep(cx, cy, span, wave, duration = 1400) {
        if (reduceMotion) {
          for (let a = -1; a <= 1; a += 0.05) eraseCircle(cx + a * span, cy + Math.sin(a * 3) * wave, 90);
          draw();
          return;
        }
        const t0 = performance.now();
        last = null;
        (function step(now) {
          const t = Math.min(1, (now - t0) / duration);
          const e = 1 - Math.pow(1 - t, 3);
          const a = -1 + e * 2;
          wipeTo(cx + a * span, cy + Math.sin(a * 3) * wave, false);
          if (t < 1) requestAnimationFrame(step);
          else last = null;
        })(t0);
      },
      // wipe everything, used by the "Show rebuilt" buttons
      clear() {
        mctx.globalCompositeOperation = "destination-out";
        mctx.fillStyle = "#000";
        mctx.fillRect(0, 0, width, height);
        if (opts.hint) opts.hint.classList.add("is-gone");
        draw();
      },
      // fog the glass back up
      reset() {
        mctx.globalCompositeOperation = "source-over";
        mctx.clearRect(0, 0, width, height);
        mctx.drawImage(texture, 0, 0, width, height);
        if (opts.hint) opts.hint.classList.remove("is-gone");
        wiped = 0;
        draw();
      },
      repaint: resize,
    };
  }

  window.FogGlass = FogGlass;

  /* ---------- hero watch ---------- */
  const crystal = document.querySelector(".hero .crystal");
  if (crystal) {
    const glass = FogGlass(crystal.querySelector(".fog"), {
      brush: 0.11,
      settle: 0.01,
      hint: crystal.querySelector(".wipe-hint"),
    });
    // one thumb-wipe across the dial on load, so people see what it does
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      setTimeout(() => {
        const r = crystal.getBoundingClientRect();
        glass.sweep(r.width / 2, r.height / 2, r.width * 0.3, r.height * 0.1, 1200);
      }, 600);
    });
  }
})();
