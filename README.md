# Pahar

**India measured time in pahar. So do we.**

Pahar is a made-up Indian watch brand with four collections: Nimesh (digital), Pal (analog quartz), Ghati (mechanical automatic) and Kalpa, a rare handcrafted line. Every name is an old Indian unit of time.

Built for the ACM Technical Team, Bennett University, Junior Core Round 2.

## Brand and concept (150 words max)

Before hours and minutes, India split the day from sunrise into 8 pahar and 60 ghati. Pahar is a watch brand built on those units. Each collection is named after how much time it is made for: Nimesh, a blink, for digital watches; Pal, 24 seconds, for everyday quartz; Ghati, 24 minutes, for mechanical automatics; and Kalpa, an age of 4.32 billion years, for rare handcrafted pieces with Bidriware, meteorite and astronomical dials.

The site feels like opening a black watch box. Brass is the only accent, taken from applied dial indices. The hero shows a live dial under fogged sapphire that you wipe clean, with the current time also shown in pahar, ghati and pal. Scrolling takes the Ghati 01 apart in 3D, part by part, then puts it back together.

## Tech stack

- Plain HTML, CSS and JavaScript. No framework, no build step.
- SVG for the live watch faces (real time, real moon phase and tithi).
- Canvas 2D for the fogged crystal in the hero.
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
- All watch faces, the 3D watch, textures and the favicon are original and made in code for this project. No photos or third-party models are used. A published exploded-view diagram of a dive watch was used only as a layout reference for how parts stack.
- Pahar, its watches, prices and address are fictional.

See [DESIGN.md](DESIGN.md) for the design decisions.
