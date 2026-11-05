/* ==========================================================================
   Luma Tales Website Kit — showcase.js (4 Nov 2026)
   Shared code for the sales showcase (Quick / Pro / Funnel / Complete demos).
   Load it in <head> (no defer) so the saved theme applies before first paint.
   1) Theme follows across pages  (localStorage "luma-theme", <html data-theme>)
   2) Tier strip injected from    <html data-tier="quick|pro|funnel|complete">
   3) Pro add-on:   [data-lead-panel]  — lead → pre-filled 1003 preview
   4) Complete:     [data-calc]        — P&I calculator (estimate only)
                    [data-booking]     — sample availability grid
   No dependencies. Everything shown is sample data for a fictional brand.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "luma-theme";
  var THEMES = ["coast", "classic", "sage"];
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- 1. Theme (runs immediately) ------------------------------- */
  var saved = store(KEY);
  if (saved && THEMES.indexOf(saved) > -1) root.setAttribute("data-theme", saved);
  function setTheme(t) {
    if (THEMES.indexOf(t) < 0) return;
    root.setAttribute("data-theme", t); store(KEY, t);
    document.querySelectorAll("[data-set-theme]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === t)); });
  }
  window.lumaSetTheme = setTheme;

  /* ---------- 2. Tier strip ----------------------------------------------- */
  var TIERS = [
    { id: "quick",    name: "Quick",    price: "$400"   },
    { id: "pro",      name: "Pro",      price: "$550"   },
    { id: "funnel",   name: "Funnel",   price: "$850"   },
    { id: "complete", name: "Complete", price: "$1,500" }
  ];
  function strip() {
    var tier = root.getAttribute("data-tier");
    var cur = TIERS.filter(function (t) { return t.id === tier; })[0];
    if (!cur) return;
    var base = root.getAttribute("data-root") || "../";       // demo pages live one folder deep
    var el = document.createElement("div");
    el.className = "tier-strip"; el.setAttribute("role", "navigation"); el.setAttribute("aria-label", "Showcase packages");
    var html = '<div class="wrap"><span class="viewing"><span class="lbl">You’re viewing:</span> <b>' + cur.name + '</b> · ' + cur.price + '</span>' +
      '<span class="sep" aria-hidden="true">—</span><nav><a class="all" href="' + base + '">← All<span class="long"> packages</span></a>';
    TIERS.forEach(function (t) {
      html += '<a href="' + base + t.id + '/"' + (t.id === tier ? ' aria-current="page"' : '') + '>' + t.name + '</a>';
    });
    html += '</nav></div>';
    el.innerHTML = html;
    document.body.insertBefore(el, document.body.firstChild);
    document.body.classList.add("has-strip");
  }

  /* ---------- 3. Pro: lead → 1003 / MISMO 3.4 preview ------------------- */
  var GOAL = { buy: ["Purchase", "Primary residence (to confirm)"], refinance: ["Refinance", "Rate/term or cash-out (to confirm)"], exploring: ["Undetermined", "Pre-qualification conversation"] };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function leadPanel() {
    var panel = document.querySelector("[data-lead-panel]");
    if (!panel) return;
    document.addEventListener("luma:lead", function (e) {
      var d = e.detail || {};
      var g = GOAL[d.goal] || GOAL.exploring;
      var src = store("luma-src") || "Google (sample)";
      var lang = root.lang === "vi" ? "Vietnamese" : "English";
      var now = new Date();
      var stamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      panel.querySelector("[data-f=stamp]").textContent = stamp;
      panel.querySelector("[data-f=src]").textContent = src;
      var map = {
        name: d.name, phone: d.phone, email: d.email,
        purpose: g[0], occupancy: g[1], timeframe: d.timeframe || "—",
        lang: lang, notes: d.message ? d.message : "—",
        consent: d.sms_consent === "yes" ? "Yes — texting OK (TCPA consent recorded)" : "No — call only"
      };
      Object.keys(map).forEach(function (k) { var n = panel.querySelector("[data-f=" + k + "]"); if (n) n.textContent = map[k] || "—"; });
      panel.hidden = false;
      panel.classList.add("is-in");
      setTimeout(function () { panel.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150);
    });
  }

  /* ---------- 4. Complete: P&I calculator ------------------------------- */
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function calc() {
    var box = document.querySelector("[data-calc]");
    if (!box) return;
    var price = box.querySelector("[name=price]"), down = box.querySelector("[name=down]"), rate = box.querySelector("[name=rate]"), term = box.querySelector("[name=term]");
    var out = box.querySelector("[data-out=downpct]");
    var res = box.querySelector(".result");
    function run() {
      var P = parseFloat(price.value) || 0, dp = parseFloat(down.value) || 0, r = parseFloat(rate.value), n = (parseInt(term.value, 10) || 30) * 12;
      if (out) out.value = dp + "%";
      var loan = P * (1 - dp / 100);
      var dollars = P * dp / 100;
      box.querySelector("[data-out=loan]").textContent = P ? money(loan) : "—";
      box.querySelector("[data-out=down]").textContent = P ? money(dollars) : "—";
      var big = box.querySelector("[data-out=pi]");
      if (!P || isNaN(r) || r <= 0 || r > 30) { big.textContent = "—"; res.classList.add("is-empty"); return; }
      var i = r / 100 / 12;
      var pi = loan * i / (1 - Math.pow(1 + i, -n));
      big.textContent = money(pi);
      res.classList.remove("is-empty");
    }
    [price, down, rate, term].forEach(function (f) { f.addEventListener("input", run); f.addEventListener("change", run); });
    run();
  }

  /* ---------- 5. Complete: sample booking grid -------------------------- */
  function booking() {
    var box = document.querySelector("[data-booking]");
    if (!box) return;
    var grid = box.querySelector(".slots"), msg = box.querySelector(".book-msg");
    var times = [["9:00", "AM"], ["10:30", "AM"], ["1:00", "PM"], ["3:30", "PM"]];
    var taken = { "0-1": 1, "1-3": 1, "2-0": 1, "3-2": 1, "4-1": 1, "4-3": 1 }; // fixed pattern so the demo looks the same every time
    var d = new Date(); d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); // start next weekday
    var html = "";
    for (var c = 0; c < 5; c++) {
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      var dayName = d.toLocaleDateString("en-US", { weekday: "short" }), dayNum = d.getDate();
      html += '<div class="day"><h4>' + dayName + '<b>' + dayNum + '</b></h4>';
      times.forEach(function (t, r) {
        var dis = taken[c + "-" + r] ? " disabled" : "";
        html += '<button type="button" class="slot" aria-pressed="false" data-label="' + dayName + ' ' + dayNum + ', ' + t[0] + ' ' + t[1] + '"' + dis + '>' + t[0] + '<small>' + t[1] + '</small></button>';
      });
      html += "</div>";
      d.setDate(d.getDate() + 1);
    }
    grid.innerHTML = html;
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".slot"); if (!b || b.disabled) return;
      grid.querySelectorAll(".slot").forEach(function (s) { s.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      msg.className = "book-msg is-on";
      msg.innerHTML = "<strong>" + esc(b.getAttribute("data-label")) + "</strong> — Sample. On the live site this books straight into your calendar and sends the client a confirmation.";
      if (window.lumaTrack) window.lumaTrack("book_slot", { demo: true });
    });
  }

  /* ---------- boot ------------------------------------------------------- */
  function boot() {
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === root.getAttribute("data-theme")));
      b.addEventListener("click", function () { setTheme(b.getAttribute("data-set-theme")); });
    });
    strip(); leadPanel(); calc(); booking();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
