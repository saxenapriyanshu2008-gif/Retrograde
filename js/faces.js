/*
  Live watch faces, drawn as SVG.

  Every element with data-face="..." gets a dial built here, and its hands
  show the real time. Two kinds of second hand, like real watches:
  - quartz (Pal, Nimesh): jumps once a second
  - mechanical (Ghati, Kalpa, hero): sweeps in 8 small beats a second,
    because a 28,800 beats an hour movement ticks 8 times a second

  Also exports the Indian time units, counted from sunrise (taken as 6 am).
*/
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = 200; // dial centre, viewBox is 400 x 400

  /* ---------- Indian time units ---------- */
  // 1 day = 8 pahar = 60 ghati, 1 ghati = 60 pal (24 s), 1 pal = 60 vipal
  function indianTime(d = new Date()) {
    const secs = ((d.getHours() - 6 + 24) % 24) * 3600 + d.getMinutes() * 60 + d.getSeconds();
    return {
      pahar: Math.floor(secs / 10800) + 1,          // 1 to 8
      ghati: Math.floor(secs / 1440) + 1,           // 1 to 60 in the day
      pal: Math.floor((secs % 1440) / 24) + 1,      // 1 to 60 in the ghati
    };
  }

  /* ---------- moon, for the Kalpa Jantar ---------- */
  function moonAge(d = new Date()) {
    const known = Date.UTC(2000, 0, 6, 18, 14); // a new moon
    const syn = 29.530588853;
    return ((((d - known) / 86400000) % syn) + syn) % syn;
  }

  /* ---------- small svg helpers ---------- */
  const polar = (r, deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  const f = (n) => n.toFixed(2);

  function ticks(r1, r2, count, every, cls, cls2) {
    let s = "";
    for (let i = 0; i < count; i++) {
      const deg = (i * 360) / count;
      const big = every && i % every === 0;
      const [x1, y1] = polar(big ? r1 - 6 : r1, deg);
      const [x2, y2] = polar(r2, deg);
      s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${big ? cls2 : cls}"/>`;
    }
    return s;
  }

  // applied hour markers: small bars, a double bar at 12
  function indices(r, len, w, cls) {
    let s = "";
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      if (i === 0) {
        s += `<g transform="rotate(0 ${C} ${C})"><rect x="${C - w * 1.6}" y="${C - r}" width="${w}" height="${len}" rx="1" class="${cls}"/><rect x="${C + w * 0.6}" y="${C - r}" width="${w}" height="${len}" rx="1" class="${cls}"/></g>`;
      } else {
        s += `<rect x="${C - w / 2}" y="${C - r}" width="${w}" height="${len}" rx="1" class="${cls}" transform="rotate(${deg} ${C} ${C})"/>`;
      }
    }
    return s;
  }

  // sunburst: many faint rays from the centre
  function sunburst(r, colorA, colorB) {
    let s = "";
    for (let i = 0; i < 180; i++) {
      const [x, y] = polar(r, i * 2);
      s += `<line x1="${C}" y1="${C}" x2="${f(x)}" y2="${f(y)}" stroke="${i % 2 ? colorA : colorB}" stroke-width="2.4"/>`;
    }
    return s;
  }

  function caseRing(id, metal) {
    // metal: "steel" or "gold"
    const stops = metal === "gold"
      ? ["#f3dca6", "#a8834a", "#f6e4b8", "#7d5f2f"]
      : ["#f2f2f0", "#7c7d80", "#e4e4e2", "#4a4b4e"];
    return `
      <defs>
        <linearGradient id="case-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${stops[0]}"/><stop offset=".35" stop-color="${stops[1]}"/>
          <stop offset=".65" stop-color="${stops[2]}"/><stop offset="1" stop-color="${stops[3]}"/>
        </linearGradient>
      </defs>
      <rect x="383" y="186" width="16" height="28" rx="4" fill="url(#case-${id})"/>
      <circle cx="${C}" cy="${C}" r="192" fill="url(#case-${id})"/>
      <circle cx="${C}" cy="${C}" r="178" fill="#050505"/>`;
  }

  /* hands, pointing to 12; the code rotates them around the centre */
  const hands = {
    dauphine: (cls) => `
      <g class="h-hour"><path d="M${C} ${C - 98} L${C + 8} ${C} L${C} ${C + 14} L${C - 8} ${C} Z" class="${cls}"/></g>
      <g class="h-min"><path d="M${C} ${C - 148} L${C + 6} ${C} L${C} ${C + 18} L${C - 6} ${C} Z" class="${cls}"/></g>`,
    baton: (cls) => `
      <g class="h-hour"><rect x="${C - 4}" y="${C - 96}" width="8" height="112" rx="4" class="${cls}"/></g>
      <g class="h-min"><rect x="${C - 3}" y="${C - 148}" width="6" height="166" rx="3" class="${cls}"/></g>`,
    leaf: (cls) => `
      <g class="h-hour"><path d="M${C} ${C - 100} C${C + 14} ${C - 60} ${C + 10} ${C - 10} ${C} ${C + 12} C${C - 10} ${C - 10} ${C - 14} ${C - 60} ${C} ${C - 100} Z" class="${cls}"/></g>
      <g class="h-min"><path d="M${C} ${C - 150} C${C + 11} ${C - 90} ${C + 8} ${C - 10} ${C} ${C + 14} C${C - 8} ${C - 10} ${C - 11} ${C - 90} ${C} ${C - 150} Z" class="${cls}"/></g>`,
    seconds: (cls, tip) => `
      <g class="h-sec"><line x1="${C}" y1="${C + 34}" x2="${C}" y2="${C - 160}" class="${cls}"/>
      <circle cx="${C}" cy="${C + 34}" r="6" class="${tip}"/><circle cx="${C}" cy="${C}" r="5" class="${tip}"/></g>`,
  };

  /* ---------- the faces ---------- */

  const FACES = {
    // the hero: black sunburst, brass indices, a pahar ring at six o'clock
    hero: {
      sweep: true,
      svg: (id) => `
        ${caseRing(id, "steel")}
        <clipPath id="clip-${id}"><circle cx="${C}" cy="${C}" r="176"/></clipPath>
        <g clip-path="url(#clip-${id})">${sunburst(180, "#0d0d0d", "#141414")}</g>
        <circle cx="${C}" cy="${C}" r="176" fill="url(#sheen-${id})"/>
        <defs><radialGradient id="sheen-${id}" cx=".35" cy=".25" r=".9">
          <stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
        </radialGradient></defs>
        ${ticks(166, 172, 60, 5, "tk", "tk-b")}
        ${indices(156, 26, 7, "brass")}
        <text x="${C}" y="118" class="brand">PAHAR</text>
        <text x="${C}" y="138" class="deva-s" lang="hi">पहर</text>
        <g class="pahar-ring">${paharRing(C, 268, 30)}</g>
        <text x="${C}" y="${268 + 4}" class="sub" data-pahar-num>3</text>
        ${hands.dauphine("brass-hand")}
        ${hands.seconds("sec", "sec-dot")}
        <circle cx="${C}" cy="${C}" r="3" fill="#050505"/>`,
    },

    // digital: rounded case, dark screen, live digits and Indian time
    nimesh: {
      digital: true,
      svg: (id) => `
        <defs><linearGradient id="case-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3a3a3c"/><stop offset=".5" stop-color="#151516"/><stop offset="1" stop-color="#2b2b2d"/>
        </linearGradient></defs>
        <rect x="40" y="40" width="320" height="320" rx="70" fill="url(#case-${id})"/>
        <rect x="64" y="64" width="272" height="272" rx="50" fill="#050505"/>
        <text x="${C}" y="118" class="lcd-label">PAHAR NIMESH</text>
        <text x="${C}" y="218" class="lcd-big" data-digital-time>10:08</text>
        <text x="${C}" y="252" class="lcd-small" data-digital-sec>SEC 32</text>
        <line x1="104" y1="274" x2="296" y2="274" class="lcd-rule"/>
        <text x="${C}" y="304" class="lcd-small brassfill" data-digital-indian>PAHAR 3  GHATI 12</text>
        <rect x="372" y="120" width="10" height="40" rx="3" fill="#2b2b2d"/>
        <rect x="372" y="240" width="10" height="40" rx="3" fill="#2b2b2d"/>`,
    },

    // analog quartz: light dial, thin black batons, four numerals
    pal: {
      svg: (id) => `
        ${caseRing(id, "steel")}
        <circle cx="${C}" cy="${C}" r="178" fill="#e8e5de"/>
        ${ticks(168, 174, 60, 5, "tk-d", "tk-db")}
        <text x="${C}" y="76" class="num">12</text><text x="${C + 140}" y="${C + 12}" class="num">3</text>
        <text x="${C}" y="${C + 154}" class="num">6</text><text x="${C - 140}" y="${C + 12}" class="num">9</text>
        <text x="${C}" y="132" class="brand dark">PAHAR</text>
        <text x="${C}" y="282" class="sub dark">PAL QUARTZ</text>
        ${hands.baton("ink-hand")}
        ${hands.seconds("sec", "sec-dot")}`,
    },

    // mechanical: slate dial, open heart at nine showing the balance wheel
    ghati: {
      sweep: true,
      svg: (id) => `
        ${caseRing(id, "steel")}
        <clipPath id="clip-${id}"><circle cx="${C}" cy="${C}" r="176"/></clipPath>
        <g clip-path="url(#clip-${id})">${sunburst(180, "#141a1c", "#1b2326")}</g>
        ${ticks(166, 172, 60, 5, "tk", "tk-b")}
        ${indices(156, 22, 6, "steelfill")}
        <circle cx="118" cy="${C}" r="44" fill="#0a0a0a" stroke="#8d8e90" stroke-width="3"/>
        <g class="balance" style="transform-origin:118px 200px">
          <circle cx="118" cy="${C}" r="30" fill="none" stroke="#c8a46a" stroke-width="4"/>
          <path d="M88 200 H148 M118 170 V230" stroke="#c8a46a" stroke-width="3"/>
          <path d="M118 200 m0 -6 a6 6 0 1 1 -1 0 m1 -6 a12 12 0 1 1 -2 0 m2 -6 a18 18 0 1 1 -3 0" fill="none" stroke="#9fa0a3" stroke-width="1"/>
        </g>
        <text x="${C + 50}" y="128" class="brand">PAHAR</text>
        <text x="${C + 50}" y="146" class="sub">GHATI AUTOMATIC</text>
        ${hands.dauphine("steel-hand")}
        ${hands.seconds("sec", "sec-dot")}`,
    },

    // Kalpa preview in the collection grid uses the Bidri dial
    kalpa: { sweep: true, svg: (id) => bidri(id) },
    bidri: { sweep: true, svg: (id) => bidri(id) },

    // meteorite: crossing bands in three directions, like Widmanstatten lines
    ulka: {
      sweep: true,
      svg: (id) => {
        let bands = "";
        let seed = 7;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        for (const ang of [20, 80, 140]) {
          for (let i = 0; i < 26; i++) {
            const off = -200 + rnd() * 400;
            const w = 3 + rnd() * 16;
            const shade = 90 + Math.floor(rnd() * 90);
            bands += `<rect x="-60" y="${f(C + off)}" width="520" height="${f(w)}" fill="rgb(${shade},${shade},${shade + 6})" opacity="${f(0.25 + rnd() * 0.35)}" transform="rotate(${ang} ${C} ${C})"/>`;
          }
        }
        return `
          ${caseRing(id, "gold")}
          <clipPath id="clip-${id}"><circle cx="${C}" cy="${C}" r="176"/></clipPath>
          <circle cx="${C}" cy="${C}" r="176" fill="#5d5e62"/>
          <g clip-path="url(#clip-${id})">${bands}</g>
          ${indices(160, 20, 6, "goldfill")}
          <text x="${C}" y="126" class="brand">PAHAR</text>
          ${hands.leaf("gold-hand")}
          ${hands.seconds("sec-gold", "gold-dot")}`;
      },
    },

    // astronomical: live moon phase window and a ring of 30 tithis
    jantar: {
      sweep: true,
      svg: (id) => {
        const age = moonAge();
        const tithi = Math.floor((age / 29.530588853) * 30) + 1; // 1 to 30
        let ring = "";
        for (let i = 0; i < 30; i++) {
          const [x, y] = polar(150, i * 12 + 6);
          ring += `<text x="${f(x)}" y="${f(y + 4)}" class="tithi${i + 1 === tithi ? " now" : ""}">${i + 1}</text>`;
        }
        // moon: a lit disc with a shadow disc offset by the phase
        const k = Math.cos((age / 29.530588853) * 2 * Math.PI); // 1 new, -1 full
        const shift = f(k * 52);
        return `
          ${caseRing(id, "gold")}
          <circle cx="${C}" cy="${C}" r="176" fill="#07090f"/>
          ${ticks(166, 172, 30, 0, "tk", "tk")}
          ${ring}
          <circle cx="${C}" cy="${C}" r="132" fill="none" stroke="#c8a46a" stroke-opacity=".35"/>
          <clipPath id="moon-${id}"><circle cx="${C}" cy="270" r="26"/></clipPath>
          <circle cx="${C}" cy="270" r="30" fill="#0b0e18" stroke="#c8a46a" stroke-width="2"/>
          <g clip-path="url(#moon-${id})">
            <circle cx="${C}" cy="270" r="26" fill="#efe6cf"/>
            <circle cx="${f(C + Number(shift))}" cy="270" r="27" fill="#0b0e18"/>
          </g>
          <text x="${C}" y="118" class="brand">PAHAR</text>
          <text x="${C}" y="138" class="sub">TITHI ${tithi}</text>
          ${hands.leaf("gold-hand")}
          ${hands.seconds("sec-gold", "gold-dot")}`;
      },
    },
  };

  // eight segments for the pahar sub-dial; the current one is lit
  function paharRing(cx, cy, r) {
    let s = "";
    for (let i = 0; i < 8; i++) {
      const a0 = ((i * 45 - 90 + 3) * Math.PI) / 180;
      const a1 = (((i + 1) * 45 - 90 - 3) * Math.PI) / 180;
      const p = (a, rr) => `${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))}`;
      s += `<path data-seg="${i + 1}" d="M${p(a0, r)} A${r} ${r} 0 0 1 ${p(a1, r)} L${p(a1, r - 7)} A${r - 7} ${r - 7} 0 0 0 ${p(a0, r - 7)} Z" class="seg"/>`;
    }
    return s;
  }

  // Bidri: black dial, a silver eight-petal rosette and a border of diamonds
  function bidri(id) {
    let petals = "";
    for (let i = 0; i < 8; i++) {
      petals += `<path d="M${C} ${C - 22} C${C + 26} ${C - 50} ${C + 18} ${C - 104} ${C} ${C - 118} C${C - 18} ${C - 104} ${C - 26} ${C - 50} ${C} ${C - 22} Z" class="inlay" transform="rotate(${i * 45} ${C} ${C})"/>`;
      petals += `<path d="M${C} ${C - 40} C${C + 10} ${C - 60} ${C + 8} ${C - 86} ${C} ${C - 96}" class="inlay-thin" transform="rotate(${i * 45 + 22.5} ${C} ${C})"/>`;
    }
    let border = "";
    for (let i = 0; i < 48; i++) {
      const [x, y] = polar(150, i * 7.5);
      border += `<rect x="${f(x - 3.2)}" y="${f(y - 3.2)}" width="6.4" height="6.4" class="inlay-fill" transform="rotate(${i * 7.5 + 45} ${f(x)} ${f(y)})"/>`;
    }
    return `
      ${caseRing(id, "gold")}
      <circle cx="${C}" cy="${C}" r="176" fill="#101011"/>
      <circle cx="${C}" cy="${C}" r="162" fill="none" class="inlay"/>
      <circle cx="${C}" cy="${C}" r="138" fill="none" class="inlay-thin"/>
      ${border}${petals}
      <circle cx="${C}" cy="${C}" r="16" class="inlay"/>
      ${hands.leaf("silver-hand")}
      ${hands.seconds("sec-silver", "silver-dot")}`;
  }

  /* ---------- build and run ---------- */

  const live = [];
  let n = 0;

  document.querySelectorAll("[data-face]").forEach((host) => {
    const kind = host.dataset.face;
    const face = FACES[kind];
    if (!face) return;
    const id = `${kind}-${n++}`;
    host.innerHTML = `<svg xmlns="${NS}" viewBox="0 0 400 400" class="face face-${kind}">${face.svg(id)}</svg>`;
    const svg = host.firstElementChild;
    live.push({
      face, svg,
      hour: svg.querySelector(".h-hour"),
      min: svg.querySelector(".h-min"),
      sec: svg.querySelector(".h-sec"),
      balance: svg.querySelector(".balance"),
      visible: true,
    });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rot = (el, deg) => el && el.setAttribute("transform", `rotate(${f(deg)} ${C} ${C})`);

  function update(now) {
    const d = new Date();
    const ms = d.getMilliseconds();
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    const it = indianTime(d);

    for (const w of live) {
      if (!w.visible) continue;
      if (w.face.digital) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        w.svg.querySelector("[data-digital-time]").textContent = `${hh}:${mm}`;
        w.svg.querySelector("[data-digital-sec]").textContent = `SEC ${String(s).padStart(2, "0")}`;
        w.svg.querySelector("[data-digital-indian]").textContent = `PAHAR ${it.pahar}  GHATI ${it.ghati}`;
        continue;
      }
      rot(w.hour, h * 30);
      rot(w.min, m * 6);
      // mechanical: 8 beats a second; quartz: one jump a second
      const secs = w.face.sweep && !reduceMotion ? s + Math.floor(ms / 125) / 8 : s;
      rot(w.sec, secs * 6);
      if (w.balance && !reduceMotion) {
        w.balance.style.transform = `rotate(${f(Math.sin(now / 1000 * Math.PI * 8) * 200)}deg)`;
      }
      const num = w.svg.querySelector("[data-pahar-num]");
      if (num) {
        num.textContent = it.pahar;
        w.svg.querySelectorAll(".seg").forEach((seg) => seg.classList.toggle("on", Number(seg.dataset.seg) === it.pahar));
      }
    }

    // the "right now" line under the hero watch
    const set = (u, v) => { const el = document.querySelector(`.now [data-unit="${u}"]`); if (el) el.textContent = v; };
    set("pahar", `Pahar ${it.pahar} of 8`);
    set("ghati", `Ghati ${it.ghati} of 60`);
    set("pal", `Pal ${it.pal} of 60`);
  }

  // only animate faces on screen
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const w = live.find((x) => x.svg === e.target);
      if (w) w.visible = e.isIntersecting;
    }
  });
  live.forEach((w) => io.observe(w.svg));

  function loop(now) {
    update(now);
    if (reduceMotion) setTimeout(() => requestAnimationFrame(loop), 1000);
    else requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.PaharTime = { indianTime, moonAge };
})();
