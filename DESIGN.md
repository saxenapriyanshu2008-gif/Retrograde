# Design decisions

Notes for the presentation. Every choice ties back to the brand.

## The idea in one line

Opening a black watch box: one object at a time on black velvet, lit from above.

## Name and story

- **Vela** (वेला) is a Hindi word for time.
- Each collection is named after an old Indian unit of time that matches what it is for: **Nimesh** (a blink) for digital, **Pal** (24 s) for quartz, **Ghati** (24 min) for mechanical, **Kalpa** (4.32 billion years) for the rare handcrafted line.
- The "Our names" table shows where the names come from.

## Colour

| Token | Hex | Why |
|---|---|---|
| `--black` | `#000000` | The velvet inside a watch box. Pure black lets polished steel and brass glow. |
| `--tray` | `#0b0b0a` | Raised trays: the Kalpa section and the footer. |
| `--white` | `#ecebe7` | Dial white, slightly warm so it is not harsh on black. |
| `--dim` | `#9b988f` | Secondary text, like small print on a dial. |
| `--brass` | `#c8a46a` | Applied indices and hands. The only accent. |

## Type

- **Bodoni Moda** for headings: high-contrast numerals like the ones printed on classic dials.
- **Instrument Sans** for reading and for digital displays.
- **Tiro Devanagari Hindi** for वेला and the unit names (घटी, पल), so the Indian side of the brand is visible, not just mentioned.

## Hero: a watch that turns toward you (custom interactive element)

- A live dial in SVG (`js/faces.js`): hands show the real time and the seconds hand sweeps in 8 beats a second, like a 28,800 vph mechanical movement.
- Move the cursor anywhere in the hero and the watch tilts to face it with CSS 3D transforms (`rotateX`, `rotateY`), like picking it up off a tray. A glint on the glass slides the other way, as light from a window would.
- Updates are batched with `requestAnimationFrame`. Touch screens and reduced motion get a still watch.

## Inside: exploded 3D watch (scroll-driven animation)

- `js/watch3d.js`, Three.js. The section is 800vh tall and its stage is `position: sticky`.
- The watch is built in code: lathe-turned case and caseback, a bezel with 60 grip notches, a ceramic dive-bezel insert with a 60 minute scale, a domed sapphire crystal (`transmission`), a sunburst dial texture with 3D applied indices, gold hands showing the real time, and a movement with toothed gears, ruby jewels, blued screws, a balance wheel with hairspring, and a gold rotor.
- Materials are physical (metalness, roughness, clearcoat) and lit by a studio environment map, so steel reflects like steel. A gentle bloom pass adds glow to polished edges.
- Timeline: product shot, then the stack opens vertically along the watch's axis with labelled leader lines (like a technical drawing). Then each key part flies out of the stack toward you, turns to face you, gets a brass hologram outline and a label, and goes back. Finally everything reassembles.
- The balance wheel swings at 4 Hz, the gear train turns, and the rotor spins while in focus.
- Performance: Three.js loads only after the first scroll, tap or key press. Rendering stops when the section is off screen. Pixel ratio is capped. Without WebGL, a flat dial is shown.

## Collections and Kalpa

- Every face is live SVG: Nimesh shows digital time, seconds and the date, Pal is a light quartz dial, Ghati has an open heart with a beating balance wheel.
- Kalpa pieces: Bidri (silver inlay rosette), Ulka (meteorite crystal pattern drawn procedurally) and Jantar (real moon phase and the current tithi, worked out from the date).
