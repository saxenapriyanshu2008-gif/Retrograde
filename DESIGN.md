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

## Still to build

- Day 2: scroll-driven exploded view (engine out, battery in), and a dust wipe on each car card to reveal it restored.
- Day 3: mobile polish, Lighthouse pass, deploy.
