/* Small page behaviours: mobile menu and the reservation form. */
(function () {
  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
    links.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  // close the menu after picking a link
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- rebuild sequence: scroll progress ---------- */
  // The section is 620vh tall and its stage sticks to the screen.
  // Progress is how far we have scrolled through it, from 0 to 1.
  const rebuild = document.querySelector(".rebuild");
  const steps = [...rebuild.querySelectorAll(".stages li")];
  const rail = rebuild.querySelector(".rebuild-rail");
  // where each step starts, matching the timeline in rebuild3d.js
  const starts = [0, 0.1, 0.24, 0.4, 0.54, 0.7, 0.84];
  let progress = 0;
  let ticking = false;

  function readProgress() {
    const rect = rebuild.getBoundingClientRect();
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

  // drawing shown if WebGL is not available
  if (window.RetrogradeCars) {
    rebuild.querySelector(".holo-fallback").innerHTML = window.RetrogradeCars.carSVG("saloon", "new");
  }

  // Load Three.js only after the visitor starts using the page (first scroll,
  // touch or key press), so the first page load stays small and fast.
  let loaded = false;
  function load3D() {
    if (loaded) return;
    loaded = true;
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach((t) => window.removeEventListener(t, load3D));
    import("./rebuild3d.js").then((mod) => {
      const ok = mod.init({
        canvas: rebuild.querySelector(".holo"),
        section: rebuild,
        getProgress: () => progress,
        callouts: {
          engine: rebuild.querySelector('[data-part="engine"]'),
          battery: rebuild.querySelector('[data-part="battery"]'),
          motor: rebuild.querySelector('[data-part="motor"]'),
        },
      });
      if (ok) rebuild.classList.add("is-3d");
    }).catch(() => { /* keep the drawing */ });
  }
  ["scroll", "pointerdown", "keydown", "touchstart"].forEach((t) =>
    window.addEventListener(t, load3D, { passive: true })
  );
  // if the page opens already scrolled down (a link to #rebuild), load now
  if (window.scrollY > 0) load3D();

  /* ---------- reservation form ---------- */
  // There is no backend, so we check the fields and show a confirmation.
  const form = document.querySelector(".reserve-form");
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const contact = form.contact.value.trim();

    if (!name) {
      status.textContent = "Add your name so we know who to call.";
      form.name.focus();
      return;
    }
    if (!contact) {
      status.textContent = "Add an email or phone number so we can reach you.";
      form.contact.focus();
      return;
    }

    const first = name.split(" ")[0];
    status.textContent = `Slot reserved for the ${form.model.value}. We will call you within two days, ${first}.`;
    form.reset();
  });
})();
