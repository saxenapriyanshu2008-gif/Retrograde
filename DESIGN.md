# Design decisions

Notes for the presentation. Each choice has a reason tied to the brand.

## The idea in one line

A restoration blueprint seen through the dusty windscreen of a barn find.

## Colour

| Token | Hex | Why |
|---|---|---|
| `--ink` | `#123b5e` | Cyanotype blue. Restoration work starts from drawings, and old blueprints were this blue. |
| `--ink-deep` | `#0a2238` | Night. Used for depth, the dust layer and the footer. |
| `--paper` | `#e8eef1` | Cool blueprint paper. Not cream, because cream reads as "vintage template". |
| `--paper-dim` | `#a9bccb` | Secondary text. Still passes contrast on the blue. |
| `--sodium` | `#f2a33a` | The sodium lamp over a scrapyard at night. The only accent. |

Rule: **amber always means "new"**. The battery and motor in the drawings are amber, the old body is white. Buttons are amber because reserving is the new step for the user too.

## Type

- **Archivo**, one family. Expanded width (125) for headlines, like the stretched badges on old car boots. Normal width (100) for reading.
- **Architects Daughter**, only for notes written on drawings, like a draughtsman's handwriting. Never for body text.
- Scale ratio 1.333 (perfect fourth). Body lines kept under about 70 characters.

## Layout

- Most sections are blue. The **story** is the only paper-coloured section, so it reads like a page pulled out of the workshop file.
- The rebuild steps are numbered because they are a real sequence. Specs and features are not numbered because they are not.
- No cards with shadows. Sections are separated by thin rule lines, like a technical drawing.

## The hero: dusty windscreen (custom interactive element)

Why dust: every Retrograde starts as a barn find. Wiping the dust off the glass is the first thing you do when you find an old car, so the interaction tells the brand story without words.

- `js/dust.js` keeps the dust in an offscreen canvas called `mask`.
- Moving the cursor erases a soft circle from the mask with `globalCompositeOperation = "destination-out"`.
- Every third frame a very small amount of dust settles back, so the glass never stays fully clean.
- Dust motes drift upward in front of the glass, lit amber like dust in lamp light.
- On load, one scripted wipe crosses the car, so phone users see it right away and learn what the glass does.
- Performance: the loop stops when the hero is off screen or the tab is hidden, and the canvas resolution is capped at 1.5x.
- Accessibility: with reduced motion, there is no animation, just one clear patch over the car. The headline is never covered.

## The cars: wipe to rebuild (the dust idea, used again)

- Three original side views, one per decade: a round 1960s saloon, a long-roof 1970s estate and a wedge 1980s coupé. Proportions were based on general reference photos of cars from each era. No real model is copied.
- `js/cars.js` stores each car as data: body lines, plus an `old` set (chrome bumpers, old lamps, hubcaps, rust, a cracked window, one missing hubcap) and a `new` set (LED lamps, light bar, aero wheels, charge port).
- The rebuilt drawing sits in the page. The "as found" drawing is turned into an image and painted into the dust, so wiping the glass swaps old for new.
- Each card has a "Show it rebuilt" button, so keyboard and screen reader users get the same change.

## The rebuild: holographic 3D (scroll-driven animation)

- `js/rebuild3d.js`, built with Three.js. The section is 620vh tall and the stage is `position: sticky`, so scrolling moves through the timeline while the car stays on screen.
- The 3D car is made from the **same outlines as the SVG drawing**: each outline becomes a `THREE.Shape` and is extruded to give it width. So the 2D and 3D cars always match.
- Every part is a hologram: a faint additive fill plus glowing edges from `EdgesGeometry`.
- Colour rule in 3D: cyan is the body we keep, red is the old parts we remove, amber is the new parts we add.
- Timeline: as found, taken apart, old engine glows red, old parts leave (engine lifted out, the rest dropped), battery rises in and motor slides in, modern touches (LED rings, light bar, aero wheels, charge port), panels go back.
- The camera moves between one key position per step. The scroll value is smoothed a little so the motion feels mechanical.
- HTML labels are pinned to the 3D parts by projecting a 3D point to the screen each frame.
- Performance: Three.js only loads after the first scroll, touch or key press, so it does not slow the first load. Rendering stops when the section is off screen. If WebGL is missing, a flat drawing is shown instead.
