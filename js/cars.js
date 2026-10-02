/*
  The three Retrograde cars, drawn as side views.

  Each car is plain data: its body lines plus two sets of details.
  - `old`: how we found it. Chrome bumpers, old lamps, hubcaps, rust.
  - `new`: what we changed. LED ring lamps, light bar, aero wheels,
    hidden charging port. New parts are always amber.

  The rebuilt drawing goes into the page. The "as found" drawing is turned
  into an image and printed into the dust, so wiping the glass swaps one
  for the other.

  Shapes are original, based on the general look of each decade:
  a round 1960s saloon, a long-roof 1970s estate and a wedge 1980s coupé.
*/
(function () {
  const PAPER = "#e8eef1";
  const AMBER = "#f2a33a";
  const OLD = "#c9b9a0";   // faded chrome and paint, seen through dust
  const RUST = "#c06a43";

  const CARS = {
    saloon: {
      wheels: [230, 760],
      body: [
        "M100 310 C88 300 84 270 92 250 C100 228 125 214 170 208 L395 194 C420 160 445 130 478 118 C540 104 640 104 700 116 C740 130 770 160 792 192 L905 204 C930 210 940 240 932 280 L925 310 L829 310 A74 74 0 0 0 691 310 L299 310 A74 74 0 0 0 161 310 Z",
        "M412 196 C434 165 454 141 484 129 C540 117 630 117 688 127 C720 141 746 166 766 192 Z",
        "M588 122 L588 194",
      ],
      thin: [
        "M170 214 L905 210",
        "M405 198 L405 306 M588 196 L588 306 M700 192 L700 290",
      ],
      handles: "M548 228 h26 M662 226 h26",
      old: {
        lamps: '<circle cx="114" cy="243" r="14"/><circle cx="114" cy="243" r="7"/>',
        grille: "M96 268 v24 M104 266 v28 M112 266 v28",
        bumpers: '<rect x="74" y="292" width="72" height="14" rx="7"/><rect x="896" y="290" width="54" height="14" rx="7"/>',
        tail: '<circle cx="922" cy="244" r="8"/>',
        rust: [[180, 296], [330, 300], [870, 296], [640, 300]],
        crack: "M470 140 L500 160 L492 176",
      },
      new: {
        lamps: '<circle cx="114" cy="243" r="15"/><circle cx="114" cy="243" r="8"/>',
        drl: "M96 266 h34",
        bumpers: '<rect x="80" y="296" width="62" height="8" rx="4"/><rect x="900" y="294" width="46" height="8" rx="4"/>',
        tail: "M934 232 V266",
        port: '<rect x="842" y="220" width="22" height="14" rx="3"/>',
      },
    },

    estate: {
      wheels: [230, 780],
      body: [
        "M90 312 L86 262 C86 246 96 238 120 236 L380 222 L430 150 C436 140 444 136 456 136 L900 132 C914 132 920 140 922 152 L930 230 L934 290 L928 312 L849 312 A74 74 0 0 0 711 312 L299 312 A74 74 0 0 0 161 312 Z",
        "M444 220 L480 154 L618 152 L618 220 Z",
        "M630 152 L758 150 L758 220 L630 220 Z",
        "M770 150 L898 148 L906 220 L770 220 Z",
      ],
      thin: [
        "M120 236 L926 228",
        "M440 224 L440 306 M624 222 L624 306 M764 222 L764 288",
        "M470 128 L900 124",
      ],
      handles: "M590 240 h24 M730 238 h24",
      old: {
        lamps: '<rect x="92" y="246" width="26" height="22" rx="3"/><rect x="98" y="251" width="14" height="12" rx="2"/>',
        grille: "M124 252 h60 M124 260 h60 M124 268 h60",
        bumpers: '<rect x="72" y="296" width="70" height="14" rx="7"/><rect x="905" y="294" width="48" height="14" rx="7"/>',
        tail: '<rect x="916" y="238" width="12" height="30" rx="2"/>',
        rust: [[170, 298], [360, 300], [880, 298], [690, 302]],
        crack: "M486 160 L520 182 L512 200",
      },
      new: {
        lamps: '<rect x="92" y="248" width="28" height="16" rx="5"/>',
        drl: "M96 256 h20",
        bumpers: '<rect x="78" y="298" width="60" height="8" rx="4"/><rect x="906" y="296" width="42" height="8" rx="4"/>',
        tail: "M934 236 V290",
        port: '<rect x="868" y="238" width="22" height="14" rx="3"/>',
      },
    },

    coupe: {
      wheels: [230, 770],
      body: [
        "M86 318 L84 280 C84 268 92 262 106 262 L360 248 L470 176 C476 172 482 170 490 170 L700 170 C710 170 716 174 722 180 L790 238 L920 244 C934 246 940 254 940 266 L938 318 L841 318 A74 74 0 0 0 699 318 L301 318 A74 74 0 0 0 159 318 Z",
        "M484 244 L504 186 L698 186 L758 240 Z",
        "M642 186 L642 242",
      ],
      thin: [
        "M106 262 L360 252 L790 244 L920 248",
        "M478 250 L478 312 M664 248 L664 312",
      ],
      handles: "M620 262 h28",
      old: {
        lamps: '<rect x="88" y="266" width="34" height="14" rx="2"/><path d="M105 266 v14"/>',
        grille: "M126 270 h50 M126 276 h50",
        bumpers: '<rect x="70" y="300" width="74" height="14" rx="5"/><rect x="912" y="298" width="40" height="14" rx="5"/>',
        tail: '<rect x="926" y="252" width="10" height="20" rx="2"/>',
        rust: [[180, 304], [380, 306], [880, 304], [620, 308]],
        crack: "M520 196 L548 214 L540 230",
      },
      new: {
        lamps: '<path d="M86 270 h40"/>',
        drl: "M90 278 h28",
        bumpers: '<rect x="78" y="304" width="62" height="8" rx="4"/><rect x="914" y="302" width="36" height="8" rx="4"/>',
        tail: "M940 254 V284",
        port: '<rect x="858" y="256" width="22" height="14" rx="3"/>',
      },
    },
  };

  /* ---------- drawing helpers ---------- */

  // a small rough blob, for rust patches
  function blob(cx, cy, seed) {
    let d = "";
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = 7 + ((seed * (i + 3) * 37) % 9);
      d += (i ? " L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r * 0.6).toFixed(1);
    }
    return d + " Z";
  }

  // wheel: tyre always, then old hubcaps or new aero discs
  function wheel(cx, state, missingCap) {
    const cy = 337;
    let s = `<circle cx="${cx}" cy="${cy}" r="58"/>`;
    if (state === "old") {
      if (!missingCap) s += `<circle cx="${cx}" cy="${cy}" r="26"/><circle cx="${cx}" cy="${cy}" r="5"/>`;
      else s += `<circle cx="${cx}" cy="${cy}" r="9"/>`;
      return s;
    }
    // aero disc with five curved spokes, in amber
    let spokes = "";
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      const p = (r, off) => [cx + Math.cos(a + off) * r, cy + Math.sin(a + off) * r].map((n) => n.toFixed(1)).join(" ");
      spokes += `M${p(11, 0)} Q${p(26, 0.32)} ${p(39, 0.18)} `;
    }
    s += `<g stroke="${AMBER}"><circle cx="${cx}" cy="${cy}" r="41"/><circle cx="${cx}" cy="${cy}" r="10"/><path d="${spokes}"/></g>`;
    return s;
  }

  // Build the SVG for a car in one state ("old" or "new").
  function carSVG(key, state) {
    const car = CARS[key];
    const ink = state === "old" ? OLD : PAPER;
    const d = car[state];
    const strong = `fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
    const light = `fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.75"`;
    const accent = `fill="none" stroke="${AMBER}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;

    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 420" width="1000" height="420">`;
    s += `<g ${strong}>${car.body.map((p) => `<path d="${p}"/>`).join("")}<path d="${car.handles}"/></g>`;
    s += `<g ${light}>${car.thin.map((p) => `<path d="${p}"/>`).join("")}</g>`;
    s += `<g ${light}><path d="M30 396 H970"/></g>`;

    if (state === "old") {
      s += `<g ${strong}>${d.lamps}${d.bumpers}${d.tail}</g>`;
      s += `<g ${light}><path d="${d.grille}"/><path d="${d.crack}"/></g>`;
      s += `<g fill="${RUST}" fill-opacity="0.55" stroke="none">${d.rust.map(([x, y], i) => `<path d="${blob(x, y, i + 2)}"/>`).join("")}</g>`;
      s += `<g ${strong}>${car.wheels.map((x, i) => wheel(x, "old", i === 1)).join("")}</g>`;
    } else {
      s += `<g ${strong}>${d.bumpers}</g>`;
      s += `<g ${accent}>${d.lamps}<path d="${d.drl}"/><path d="${d.tail}" stroke-width="4"/>${d.port}</g>`;
      s += `<g ${strong}>${car.wheels.map((x) => wheel(x, "new")).join("")}</g>`;
    }
    return s + "</svg>";
  }

  /* ---------- put the cars on the page ---------- */

  document.querySelectorAll(".car-card[data-car]").forEach((card) => {
    const key = card.dataset.car;
    const fig = card.querySelector(".car-fig");
    const button = card.querySelector(".car-toggle");

    // rebuilt car: real SVG in the page, under the glass
    const rebuilt = document.createElement("div");
    rebuilt.className = "car-rebuilt";
    rebuilt.innerHTML = carSVG(key, "new");
    fig.prepend(rebuilt);

    // "as found" car: an image painted into the dust
    const img = new Image();
    const url = URL.createObjectURL(new Blob([carSVG(key, "old")], { type: "image/svg+xml" }));
    let ready = false;

    const glass = window.DustGlass(fig.querySelector(".dust"), {
      tint: "rgba(13, 36, 58, 0.97)",
      brush: 0.16,
      settle: 0,
      hint: fig.querySelector(".wipe-hint"),
      overlay(ctx, w, h) {
        if (ready) {
          ctx.globalAlpha = 0.9;
          ctx.drawImage(img, 0, 0, w, h);
          ctx.globalAlpha = 1;
        }
      },
    });

    img.onload = () => { ready = true; glass.repaint(); URL.revokeObjectURL(url); };
    img.src = url;

    // keyboard and screen reader friendly way to see the change
    let shown = false;
    button.addEventListener("click", () => {
      shown = !shown;
      shown ? glass.clear() : glass.reset();
      button.textContent = shown ? "Show it as found" : "Show it rebuilt";
      button.setAttribute("aria-pressed", String(shown));
    });
  });

  window.RetrogradeCars = { carSVG };
})();
