/* ==========================================================================
   animations.js — scroll reveal + hero packet animation
   ========================================================================== */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------ scroll reveal  */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------------------------------------------- hero request flow  */
  function startHeroPackets() {
    if (reducedMotion.matches) return;

    var animated = Array.prototype.slice.call(
      document.querySelectorAll(".hero-svg .packets circle animateMotion")
    );
    animated.forEach(function (m) {
      try {
        if (typeof m.beginElement === "function") m.beginElement();
      } catch (e) {}
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startHeroPackets);
  } else {
    startHeroPackets();
  }

  /*                      idle-timer: only animate while page is visible  */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      document.querySelectorAll(".hero-svg .packets animateMotion").forEach(function (m) {
        try { if (typeof m.pauseElement === "function") m.pauseElement(); } catch (e) {}
      });
    } else if (!reducedMotion.matches) {
      document.querySelectorAll(".hero-svg .packets animateMotion").forEach(function (m) {
        try { if (typeof m.beginElement === "function") m.beginElement(); } catch (e) {}
      });
    }
  });
})();