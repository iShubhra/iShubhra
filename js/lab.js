/* ==========================================================================
   lab.js — interactive system simulations (Engineering Lab)
   Worker pool · Distributed request flow · Fault-tolerant stream
   All coordinates are SVG viewBox units so they scale with the layout.
   ========================================================================== */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var PAUSED_LABEL = "motion off";

  /* ---------------------------------------------------------- helpers  */
  function makeCircle(cls) {
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "sim-dot " + cls);
    c.setAttribute("r", 3.5);
    return c;
  }

  function stepToward(dot, tx, ty, speed, s) {
    var dx = tx - dot.cx;
    var dy = ty - dot.cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var step = speed * s;
    if (dist <= step) {
      dot.cx = tx; dot.cy = ty;
      dot.el.setAttribute("cx", tx);
      dot.el.setAttribute("cy", ty);
      return true;
    }
    var k = step / dist;
    dot.cx += dx * k; dot.cy += dy * k;
    dot.el.setAttribute("cx", dot.cx);
    dot.el.setAttribute("cy", dot.cy);
    return false;
  }

  function fadeDot(sim, dot) {
    dot.el.setAttribute("opacity", "0");
    setTimeout(function () {
      if (dot.el.parentNode) dot.el.parentNode.removeChild(dot.el);
      var i = sim.dots.indexOf(dot);
      if (i !== -1) sim.dots.splice(i, 1);
    }, 380);
  }

  function spawnDot(sim, x, y, cls) {
    var el = makeCircle(cls);
    el.setAttribute("cx", x);
    el.setAttribute("cy", y);
    sim.g.appendChild(el);
    var dot = { el: el, cx: x, cy: y, state: "idle" };
    sim.dots.push(dot);
    return dot;
  }

  function onMQChange(mq, handler) {
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", handler);
    else if (typeof mq.addListener === "function") mq.addListener(handler);
  }

  /* ------------------------------------------------------ sim registry  */
  var sims = [];
  var animated = !reducedMotion.matches;

  function makeSim(card, cfg) {
    var svg = card.querySelector("svg");
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "dots");
    svg.appendChild(g);

    var sim = {
      card: card,
      g: g,
      dots: [],
      timer: 0,
      visible: false,
      stateEl: card.querySelector(".lab-state"),
      statsEl: card.querySelector(".sim-stats"),
      update: cfg.update,
      render: cfg.render || function () {},
      setStat: function (txt) {
        if (sim.statsEl) sim.statsEl.textContent = txt;
      }
    };

    sims.push(sim);
    if (reducedMotion.matches && sim.stateEl) sim.stateEl.textContent = PAUSED_LABEL;
    return sim;
  }

  /* ======================================================================
     SIM 01 — Worker Pool
     ====================================================================== */
  (function () {
    var PRODUCER = { x: 49, y: 100 };
    var WORKER_PTS = [{ x: 235, y: 100 }, { x: 275, y: 100 }, { x: 315, y: 100 }];
    var QUEUE_SLOTS = [];
    for (var i = 0; i < 6; i++) QUEUE_SLOTS.push({ x: 165, y: 105 + i * 13 });
    var RESULT_SLOTS = [];
    for (var j = 0; j < 5; j++) RESULT_SLOTS.push({ x: 490 + j * 9, y: 88 + (j % 2) * 14 });

    var card = document.querySelector('[data-sim="workers"]');
    if (!card) return;

    var buttons = Array.prototype.slice.call(card.querySelectorAll(".sim-worker"));
    var sim = makeSim(card, {
      update: function (state) { updateWorkers(state); },
      render: function () { renderWorkers(); }
    });

    sim.emitEvery = 1500;
    sim.queue = [];
    sim.workers = buttons.map(function (b, i) {
      return {
        el: b, active: true, busy: null, busyLeft: 0,
        busyMs: 850 + i * 220
      };
    });
    sim.produced = 0;
    sim.done = 0;

    function restack() {
      for (var i = 0; i < sim.queue.length; i++) {
        sim.queue[i].target = QUEUE_SLOTS[i];
        sim.queue[i].state = "to-queue";
      }
    }

    function updateWorkers(state) {
      sim.timer -= state.dtMs;
      if (sim.timer <= 0 && sim.queue.length < 6) {
        sim.timer = sim.emitEvery;
        var dot = spawnDot(sim, PRODUCER.x, PRODUCER.y, "worker-job");
        sim.produced++;
        sim.queue.push(dot);
        dot.target = QUEUE_SLOTS[sim.queue.length - 1];
        dot.state = "to-queue";
      }

      sim.workers.forEach(function (w) {
        if (w.busy) {
          w.busyLeft -= state.dtMs;
          if (w.busyLeft <= 0) {
            var d = w.busy;
            w.busy = null;
            d.state = "to-result";
            d.target = RESULT_SLOTS[sim.done % RESULT_SLOTS.length];
          }
        } else if (w.active && sim.queue.length) {
          var job = sim.queue.shift();
          w.busy = job;
          w.busyLeft = w.busyMs;
          job.state = "to-worker";
          job.target = WORKER_PTS[sim.workers.indexOf(w)];
          restack();
        }
      });

      for (var k = sim.dots.length - 1; k >= 0; k--) {
        var dot = sim.dots[k];
        if (dot.state === "to-queue" && dot.target) {
          if (stepToward(dot, dot.target.x, dot.target.y, 120, state.s)) dot.state = "queued";
        } else if (dot.state === "to-worker") {
          if (stepToward(dot, dot.target.x, dot.target.y, 150, state.s)) {
            dot.state = "working";
            dot.el.setAttribute("class", "sim-dot hit");
          }
        } else if (dot.state === "to-result") {
          if (stepToward(dot, dot.target.x, dot.target.y, 180, state.s)) {
            sim.done++;
            dot.state = "done";
            fadeDot(sim, dot);
          }
        }
      }
    }

    function renderWorkers() {
      sim.workers.forEach(function (w) {
        w.el.classList.toggle("is-busy", !!w.busy);
        w.el.setAttribute("aria-pressed", w.active ? "true" : "false");
        var label = w.el.querySelector(".sim-worker-state");
        if (label) {
          label.textContent = w.active ? (w.busy ? "working" : "idle") : "paused";
        }
      });

      var active = sim.workers.filter(function (w) { return !!w.busy; }).length;
      sim.setStat(
        "queued " + sim.queue.length +
        " · active " + active +
        " · done " + sim.done +
        " · produced " + sim.produced
      );
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        sim.workers[i].active = !sim.workers[i].active;
      });
    });
  })();

  /* ======================================================================
     SIM 02 — Distributed Request Flow
     ====================================================================== */
  (function () {
    var CLIENT = { x: 49, y: 105 };
    var LB = { x: 175, y: 105 };
    var APIS = [{ x: 335, y: 70 }, { x: 335, y: 105 }, { x: 335, y: 140 }];
    var REDIS = { x: 497, y: 80 };
    var PG = { x: 497, y: 130 };

    var card = document.querySelector('[data-sim="flow"]');
    if (!card) return;

    var sim = makeSim(card, {
      update: function (state) { updateFlow(state); },
      render: function () {
        sim.setStat(
          "served " + (sim.hit + sim.miss) +
          " · in-flight " + sim.dots.length +
          " · hits " + sim.hit +
          " · misses " + sim.miss
        );
      }
    });
    sim.emitEvery = 750;
    sim.hit = 0;
    sim.miss = 0;

    function emitRequest() {
      var api = APIS[Math.floor(Math.random() * APIS.length)];
      var toCache = Math.random() < 0.72;
      var dot = spawnDot(sim, CLIENT.x, CLIENT.y, toCache ? "hit" : "miss");
      dot.way = [LB, api, toCache ? REDIS : PG];
      dot.path = 0;
      dot.toCache = toCache;
      dot.state = "travel";
    }

    function updateFlow(state) {
      sim.timer -= state.dtMs;
      if (sim.timer <= 0) {
        sim.timer = sim.dots.length >= 70 ? 120 : sim.emitEvery;
        if (sim.dots.length < 70) emitRequest();
      }

      for (var i = sim.dots.length - 1; i >= 0; i--) {
        var dot = sim.dots[i];
        if (dot.state !== "travel") continue;
        var target = dot.way[dot.path];
        var speed = dot.path === 2 ? 260 : 330;
        if (stepToward(dot, target.x, target.y, speed, state.s)) {
          dot.path++;
          if (dot.path >= dot.way.length) {
            if (dot.toCache) sim.hit++; else sim.miss++;
            dot.state = "done";
            fadeDot(sim, dot);
          }
        }
      }
    }

    card.querySelector("#flow-burst").addEventListener("click", function () {
      for (var i = 0; i < 12; i++) emitRequest();
    });
  })();

  /* ======================================================================
     SIM 03 — Fault-Tolerant Stream
     ====================================================================== */
  (function () {
    var STREAM = { x: 50, y: 100 };
    var CONSUMER = { x: 200, y: 100 };
    var PROCESSED = { x: 410, y: 100 };
    var RETRY = { x: 455, y: 42 };
    var POISON = { x: 510, y: 150 };
    var MAX_ATTEMPTS = 3;

    var card = document.querySelector('[data-sim="stream"]');
    if (!card) return;

    var sim = makeSim(card, {
      update: function (state) { updateStream(state); },
      render: function () {
        var retrying = sim.dots.filter(function (d) {
          return d.state === "travel" && (d.phase === "to-retry" || (d.phase === "to-consumer" && d.poisoned));
        }).length;
        sim.setStat(
          "processed " + sim.processed +
          " · retrying " + retrying +
          " · quarantined " + sim.quarantined
        );
      }
    });
    sim.emitEvery = 1150;
    sim.processed = 0;
    sim.quarantined = 0;

    function emitRecord(poisoned) {
      var dot = spawnDot(sim, STREAM.x, STREAM.y, poisoned ? "miss" : "hit");
      dot.phase = "to-consumer";
      dot.target = CONSUMER;
      dot.poisoned = !!poisoned;
      dot.attempts = 0;
      dot.state = "travel";
    }

    function updateStream(state) {
      sim.timer -= state.dtMs;
      if (sim.timer <= 0) {
        sim.timer = sim.emitEvery;
        emitRecord(Math.random() < 0.15);
      }

      for (var i = sim.dots.length - 1; i >= 0; i--) {
        var dot = sim.dots[i];
        if (dot.state !== "travel") continue;
        if (stepToward(dot, dot.target.x, dot.target.y, 200, state.s)) {
          if (dot.phase === "to-consumer") {
            if (!dot.poisoned) {
              sim.processed++;
              dot.state = "done";
              fadeDot(sim, dot);
            } else {
              dot.attempts++;
              if (dot.attempts > MAX_ATTEMPTS) {
                dot.phase = "to-poison";
                dot.target = POISON;
                dot.el.setAttribute("class", "sim-dot poison");
              } else {
                dot.phase = "to-retry";
                dot.target = RETRY;
                dot.el.setAttribute("class", "sim-dot miss");
              }
            }
          } else if (dot.phase === "to-retry") {
            dot.phase = "to-consumer";
            dot.target = CONSUMER;
            dot.el.setAttribute("class", "sim-dot miss");
          } else if (dot.phase === "to-poison") {
            sim.quarantined++;
            dot.state = "done";
            fadeDot(sim, dot);
          }
        }
      }
    }

    card.querySelector("#stream-inject").addEventListener("click", function () {
      emitRecord(true);
    });
  })();

  /* ======================================================================
     visibility + master loop
     ====================================================================== */
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sims.forEach(function (sim) {
          if (sim.card === entry.target) {
            sim.visible = entry.isIntersecting;
            if (sim.stateEl) {
              sim.stateEl.textContent = reducedMotion.matches
                ? PAUSED_LABEL
                : entry.isIntersecting ? "running" : "paused";
            }
          }
        });
      });
    }, { threshold: 0.1 });
    sims.forEach(function (sim) { obs.observe(sim.card); });
  } else {
    sims.forEach(function (sim) { sim.visible = false; });
  }

  if (animated && typeof requestAnimationFrame === "function") {
    var last = performance.now();

    function frame(now) {
      if (document.hidden) {
        last = now;
        requestAnimationFrame(frame);
        return;
      }
      var dt = Math.min(50, now - last);
      last = now;
      var s = dt / 1000;
      sims.forEach(function (sim) {
        if (sim.visible) {
          sim.update({ dtMs: dt, s: s });
          sim.render();
        }
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    onMQChange(reducedMotion, function (e) {
      sims.forEach(function (sim) {
        if (sim.stateEl) sim.stateEl.textContent = e.matches ? PAUSED_LABEL : "running";
      });
    });
  }
})();