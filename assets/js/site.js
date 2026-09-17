/* ============================================================
   Josh Chappell — site behaviour
   Nothing here needs editing to add a product. Edit
   assets/data/catalog.json instead.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- How each content type is labelled and coloured ---------- */
  var TYPES = {
    "guide":          { label: "Guide",          color: "var(--gold)"   },
    "skill":          { label: "Claude Skill",   color: "var(--violet)" },
    "knowledge-base": { label: "Knowledge Base", color: "var(--teal)"   },
    "business-plan":  { label: "Business Plan",  color: "var(--gold)"   },
    "tool":           { label: "Tool",           color: "var(--violet)" }
  };

  /* Pages live at the root, so a relative url in the catalog needs a
     "../" prefix when the current page is inside /guides/. */
  var DEPTH = location.pathname.replace(/[^/]*$/, "").split("/guides/").length > 1 ? "../" : "";

  function resolve(url) {
    if (!url || url === "#") return "#";
    if (/^(https?:|mailto:|#)/.test(url)) return url;
    return DEPTH + url;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  /* ---------- Card markup ---------- */

  function cardHTML(item) {
    var meta = TYPES[item.type] || { label: item.type || "Item", color: "var(--gold)" };
    var href = item.stripeBuyButtonId
      ? DEPTH + "checkout.html?id=" + encodeURIComponent(item.id)
      : resolve(item.url);
    var isExternal = /^https?:/.test(href);
    var isFree = /free/i.test(item.price || "");
    var unavailable = href === "#";

    return '<a class="card reveal" href="' + esc(href) + '"' +
      ' style="--accent:' + meta.color + '"' +
      (isExternal ? ' target="_blank" rel="noopener"' : "") +
      (unavailable ? ' aria-disabled="true"' : "") + '>' +
        '<div class="card-top">' +
          '<span class="tag">' + esc(meta.label) + '</span>' +
          (item.price
            ? '<span class="price' + (isFree ? " free" : "") + '">' + esc(item.price) + '</span>'
            : "") +
        '</div>' +
        '<h3>' + esc(item.title) + '</h3>' +
        '<p>' + esc(item.blurb) + '</p>' +
        '<div class="card-foot">' +
          '<span>' + esc(item.badge || fmtDate(item.date)) + '</span>' +
          '<span class="card-cta">' + esc(item.cta || "Open") + ' &rarr;</span>' +
        '</div>' +
      '</a>';
  }

  /* ---------- Render a grid ---------- */

  function render(gridEl, items) {
    if (!items.length) {
      gridEl.innerHTML = '<p class="empty">Nothing here yet — new drops land regularly.</p>';
      return;
    }
    gridEl.innerHTML = items.map(cardHTML).join("");
    observeReveals(gridEl);
  }

  function sortNewest(a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  }

  /* ---------- Boot ---------- */

  function boot(catalog) {
    var items = (catalog.items || []).slice().sort(sortNewest);
    window.__catalog = catalog;
    if (typeof window.onCatalogReady === "function") window.onCatalogReady(catalog);

    document.querySelectorAll("[data-grid]").forEach(function (gridEl) {
      var mode = gridEl.getAttribute("data-grid");            // "featured" | "all" | a type name
      var limit = parseInt(gridEl.getAttribute("data-limit"), 10) || Infinity;

      var pool = items.filter(function (it) {
        if (mode === "featured") return it.featured;
        if (mode === "all" || !mode) return true;
        if (mode === "paid") return !/free/i.test(it.price || "");
        if (mode === "free") return /free/i.test(it.price || "");
        return it.type === mode;
      }).slice(0, limit);

      render(gridEl, pool);

      /* Filter pills, if this grid has any */
      var bar = gridEl.previousElementSibling;
      if (bar && bar.classList.contains("filters")) {
        bar.addEventListener("click", function (e) {
          var btn = e.target.closest(".filter");
          if (!btn) return;
          bar.querySelectorAll(".filter").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          var f = btn.getAttribute("data-filter");
          render(gridEl, f === "all" ? pool : pool.filter(function (it) {
            if (f === "free") return /free/i.test(it.price || "");
            if (f === "paid") return !/free/i.test(it.price || "");
            return it.type === f;
          }));
        });
      }
    });
  }

  /* ---------- Scroll reveal ---------- */

  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;

  function observeReveals(root) {
    var els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!io) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    els.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 6) * 55 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Header + nav ---------- */

  function chrome() {
    var header = document.querySelector(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("scrolled", window.scrollY > 12);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    /* Mark the current page in the nav */
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var target = (a.getAttribute("href") || "").split("/").pop();
      if (target && target === here) a.setAttribute("aria-current", "page");
    });

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Photographic hero ----------
     Only apply the photo treatment once the image has actually loaded,
     so a missing hero.jpg falls back to the generative art instead of
     showing an empty box. ------------------------------------------- */

  function heroPhoto() {
    var hero = document.getElementById("hero");
    if (!hero) return;
    var probe = new Image();
    probe.onload = function () { hero.classList.add("has-photo"); };
    probe.src = DEPTH + "assets/img/hero.jpg";
  }

  /* ---------- Generative hero art ---------- */

  function heroArt() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, t = 0, raf;

    function size() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* Flow-field ribbons — slow, quiet, never loops visibly. */
    var LINES = 34;
    var palette = ["224,164,74", "139,123,247", "79,179,165"];

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < LINES; i++) {
        var p = i / LINES;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 8) {
          var nx = x / w;
          var y = h * (0.28 + p * 0.5)
                + Math.sin(nx * 3.1 + t * 0.35 + p * 5.4) * (44 + p * 90)
                + Math.sin(nx * 7.3 - t * 0.22 + p * 2.1) * 18;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        var c = palette[i % palette.length];
        ctx.strokeStyle = "rgba(" + c + "," + (0.04 + 0.1 * Math.sin(p * Math.PI)) + ")";
        ctx.lineWidth = 1 + p * 0.8;
        ctx.stroke();
      }
      t += 0.0055;
      raf = requestAnimationFrame(frame);
    }

    size();
    frame();
    window.addEventListener("resize", size);

    /* Stop painting when the hero is off screen or the tab is hidden. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(frame); }
    });
  }

  /* ---------- Go ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    chrome();
    heroPhoto();
    heroArt();
    observeReveals(document);

    if (!document.querySelector("[data-grid]") &&
        typeof window.onCatalogReady !== "function") return;

    fetch(DEPTH + "assets/data/catalog.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(boot)
      .catch(function (err) {
        console.error("Could not load catalog.json:", err);
        document.querySelectorAll("[data-grid]").forEach(function (g) {
          g.innerHTML = '<p class="empty">Catalog unavailable. ' +
            'If you are viewing this file directly from your Mac, use a local ' +
            'server instead &mdash; see README.md.</p>';
        });
      });
  });
})();
