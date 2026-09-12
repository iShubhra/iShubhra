/* ==========================================================================
   main.js — navigation, active states, copy-email, back-to-top
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("nav-toggle");
  var siteNav = document.getElementById("site-nav");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-list a"));
  var toTop = document.getElementById("to-top");
  var copyBtn = document.getElementById("copy-email");
  var copyLabel = document.getElementById("copy-email-label");
  var copyOk = document.getElementById("copy-ok");
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------ header  */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 8);
    toTop.classList.toggle("is-visible", y > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------ mobile nav  */
  function setNav(open) {
    siteNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", open);
  }

  navToggle.addEventListener("click", function () {
    setNav(siteNav.classList.contains("is-open") ? false : true);
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () { setNav(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  var mqDesktop = window.matchMedia("(min-width: 761px)");
  var onDesktop = function (e) { if (e.matches) setNav(false); };
  if (typeof mqDesktop.addEventListener === "function") mqDesktop.addEventListener("change", onDesktop);
  else if (typeof mqDesktop.addListener === "function") mqDesktop.addListener(onDesktop);

  /* ------------------------------------------- active section marker  */
  var navMap = {};
  navLinks.forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace("#", "");
    if (id) navMap[id] = link;
  });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var current = entry.target.getAttribute("id");
        navLinks.forEach(function (l) { l.classList.remove("active"); });
        if (navMap[current]) navMap[current].classList.add("active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------- copy email  */
  var EMAIL = "shubhrakantighosh1996@gmail.com";

  function copyEmail() {
    if (!copyBtn || !copyLabel) return;

    var done = function () {
      copyLabel.textContent = "Copied!";
      copyOk.classList.add("is-visible");
      setTimeout(function () {
        copyLabel.textContent = "Copy Email";
        copyOk.classList.remove("is-visible");
      }, 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { fallbackCopy(); });
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try { document.execCommand("copy"); done(); } catch (err) {}
      document.body.removeChild(ta);
    }
  }
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* ------------------------------------------------------- back to top  */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    });
  }

  /*                                    respect reduced-motion for smooth  */
  if (reducedMotion.matches) {
    document.documentElement.style.scrollBehavior = "auto";
  }
})();