/* Page behaviours: mobile menu, the scroll-driven teardown, the booking form. */
(function () {
  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
    links.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- hero: the watch turns toward your cursor ---------- */
  // Move the mouse anywhere in the hero and the watch tilts to face it,
  // like picking one up off a tray. The glint on the glass moves the
  // other way, as light from a window would.
  const hero = document.querySelector(".hero");
  const tilt = hero.querySelector(".tilt");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (tilt && !reduce && window.matchMedia("(hover: hover)").matches) {
    let frame = 0;
    hero.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = tilt.getBoundingClientRect();
        // -1 to 1 from the watch centre, limited so it never flips
        const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
        const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9)));
        tilt.classList.add("is-moving");
        tilt.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
        tilt.style.setProperty("--gx", `${(50 - x * 35).toFixed(1)}%`);
        tilt.style.setProperty("--gy", `${(45 - y * 30).toFixed(1)}%`);
      });
    });
    hero.addEventListener("pointerleave", () => {
      tilt.classList.remove("is-moving");
      ["--rx", "--ry", "--gx", "--gy"].forEach((v) => tilt.style.removeProperty(v));
    });
  }

  /* ---------- inside the watch: scroll progress ---------- */
  // The section is 800vh tall and its stage sticks to the screen.
  // Progress is how far we are through it, from 0 to 1.
  const inside = document.querySelector(".inside");
  const steps = [...inside.querySelectorAll(".stages li")];
  const rail = inside.querySelector(".rail");
  // where each step starts; must match the timeline in watch3d.js
  const starts = [0, 0.08, 0.2, 0.32, 0.46, 0.6, 0.74, 0.88];
  let progress = 0;
  let ticking = false;

  function readProgress() {
    const rect = inside.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    progress = Math.min(1, Math.max(0, -rect.top / total));
    let active = 0;
    starts.forEach((s, i) => { if (progress >= s) active = i; });
    steps.forEach((li, i) => li.classList.toggle("is-active", i === active));
    rail.style.setProperty("--progress", progress.toFixed(3));
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(readProgress); }
  }, { passive: true });
  readProgress();

  // a flat dial is shown if WebGL is not available
  const fallback = inside.querySelector(".inside-fallback");
  const heroDial = document.querySelector(".hero .dial svg");
  if (heroDial) fallback.appendChild(heroDial.cloneNode(true));

  // Load Three.js only after the visitor starts using the page, so the
  // first load stays small and fast.
  let loaded = false;
  const events = ["scroll", "pointerdown", "keydown", "touchstart"];
  function load3D() {
    if (loaded) return;
    loaded = true;
    events.forEach((t) => window.removeEventListener(t, load3D));
    import("./watch3d.js").then((mod) => {
      const ok = mod.init({
        canvas: inside.querySelector(".watch3d"),
        section: inside,
        getProgress: () => progress,
        callout: inside.querySelector(".callout"),
      });
      if (ok) inside.classList.add("is-3d");
    }).catch((err) => console.warn("3D not loaded:", err));
  }
  events.forEach((t) => window.addEventListener(t, load3D, { passive: true }));
  if (window.scrollY > 0) load3D();

  /* ---------- booking form ---------- */
  // No backend, so we check the fields and confirm on the page.
  const form = document.querySelector(".visit-form");
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    if (!name) { status.textContent = "Add your name so we know who is coming."; form.name.focus(); return; }
    if (!contact) { status.textContent = "Add an email or phone number so we can confirm the time."; form.contact.focus(); return; }
    const when = form.date.value
      ? new Date(form.date.value + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
      : "a day that suits you";
    status.textContent = `Viewing requested for ${when}, ${name.split(" ")[0]}. We will confirm within a day.`;
    form.reset();
  });
})();
