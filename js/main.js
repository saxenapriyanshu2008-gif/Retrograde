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
