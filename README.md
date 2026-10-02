# Vela

**Watches for every kind of time.**

Vela (वेला, Hindi for time) is a made-up Indian watch brand with four collections: Nimesh (digital), Pal (analog quartz), Ghati (mechanical automatic) and Kalpa, a rare handcrafted line. Each collection is named after an old Indian unit of time.

Built for the ACM Technical Team, Bennett University, Junior Core Round 2.

## Brand and concept (150 words max)

Vela, Hindi for time, is an Indian watch brand designed and assembled in New Delhi. It makes four collections, each named after an old Indian unit of time that matches what the watch is for: Nimesh, a blink, for digital watches; Pal, 24 seconds, for everyday quartz; Ghati, 24 minutes, for mechanical automatics; and Kalpa, an age of 4.32 billion years, for rare handcrafted pieces with Bidriware, meteorite and astronomical dials.

The site feels like opening a black watch box: one object at a time on black velvet, with brass as the only accent. In the hero, a live watch turns toward your cursor as light slides across its glass. Scrolling takes the Ghati 01 apart in 3D, part by part, then puts it back together.

## Tech stack

- Plain HTML, CSS and JavaScript. No framework, no build step.
- Product images rendered from our own Three.js watch model with `tools/render.html` (five models, photoreal materials and leather straps), saved as WebP.
- CSS 3D transforms for the hero watch that tilts toward the cursor.
- Three.js r160 for the scroll-driven exploded watch: physical materials, a studio environment map and a bloom pass. Loaded only after the first scroll or tap.
- Google Fonts: Bodoni Moda, Instrument Sans, Tiro Devanagari Hindi.
- Hosting: Vercel (static).

## Run it locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Credits and assets

- **Bodoni Moda** (indestructible type*), **Instrument Sans** (Instrument), **Tiro Devanagari Hindi** (Tiro Typeworks). All SIL Open Font License, via Google Fonts.
- **Three.js** r160 and its addons (RoomEnvironment, RoundedBoxGeometry, EffectComposer, UnrealBloomPass, OutputPass), MIT License, see `vendor/three-LICENSE.txt`.
- **Smartwatch video** on the Nimesh card: free stock video from Pexels (video 11148471), used under the Pexels License, trimmed and cropped.
- All analog watch images, the 3D watch, its textures and the favicon are original and made in code for this project. A published exploded-view diagram of a dive watch was used only as a layout reference for how parts stack.
- Vela, its watches, prices and address are fictional.

See [DESIGN.md](DESIGN.md) for the design decisions.
