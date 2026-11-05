/* ==========================================================================
   Luma Tales Website Kit — luma-kit.js v1 (30 Oct 2026)
   1) EN | VN language toggle   2) click + lead tracking (Umami / GA4)
   3) contact form → email (Web3Forms, free 250/mo)   4) source capture (UTM)
   5) reveal-on-scroll, footer year.  No dependencies. ~4 KB.
   Config lives on <html>:  data-demo="true"  (demo: form never sends)
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var DEMO = root.getAttribute("data-demo") === "true";

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- 1. Tracking ---------------------------------------------- */
  // Every element with data-track="name" fires an event on click.
  // Works with Umami (window.umami) and/or GA4 (window.gtag) if their snippet is on the page.
  function track(name, props) {
    props = props || {};
    props.lang = root.lang;
    try { if (window.umami && window.umami.track) window.umami.track(name, props); } catch (e) {}
    try { if (window.gtag) window.gtag("event", name, props); } catch (e) {}
    if (DEMO) toast("Tracked: " + name);
  }
  window.lumaTrack = track;
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"), { place: el.getAttribute("data-place") || "" });
  });

  /* ---------- 2. Language toggle (EN | VN) ------------------------------ */
  // Mark text with data-i18n="key"; put Vietnamese in window.LUMA_VI = { key: "..." }.
  // Placeholders: data-i18n-ph="key".  English stays in the HTML (SEO + fallback).
  var VI = window.LUMA_VI || {};
  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-i18n]"));
  var phs = Array.prototype.slice.call(document.querySelectorAll("[data-i18n-ph]"));
  nodes.forEach(function (n) { n.__en = n.innerHTML; });
  phs.forEach(function (n) { n.__en = n.getAttribute("placeholder"); });
  function setLang(lang) {
    var vi = lang === "vi";
    nodes.forEach(function (n) { var k = n.getAttribute("data-i18n"); n.innerHTML = vi && VI[k] ? VI[k] : n.__en; });
    phs.forEach(function (n) { var k = n.getAttribute("data-i18n-ph"); n.setAttribute("placeholder", vi && VI[k] ? VI[k] : n.__en); });
    root.lang = vi ? "vi" : "en";
    document.querySelectorAll(".lang-toggle button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    store("luma-lang", lang);
  }
  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); track("lang_switch", { to: b.getAttribute("data-lang") }); });
  });
  if (Object.keys(VI).length) setLang(store("luma-lang") || "en");

  /* ---------- 3. Source capture ---------------------------------------- */
  // Remembers where the visitor came from (utm_source, QR code ?src=card, referrer)
  // and adds it to every lead, so the day-30 report can say "Google 6, IG 3, QR 2".
  var q = new URLSearchParams(location.search);
  var src = q.get("utm_source") || q.get("src") || "";
  if (src) store("luma-src", src + (q.get("utm_campaign") ? " / " + q.get("utm_campaign") : ""));
  if (!store("luma-ref") && document.referrer) store("luma-ref", document.referrer);

  /* ---------- 4. Contact form → email ----------------------------------- */
  // <form data-luma-form action="https://api.web3forms.com/submit"> with
  // <input type="hidden" name="access_key" value="CLIENT_KEY">.  No key / demo = no send.
  document.querySelectorAll("form[data-luma-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    function show(ok, msg) { if (!status) return; status.className = "form-status " + (ok ? "is-ok" : "is-err"); status.textContent = msg; status.setAttribute("role", ok ? "status" : "alert"); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector(".hp input") && form.querySelector(".hp input").value) return; // bot
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      data.set("lead_source", store("luma-src") || "direct");
      data.set("referrer", store("luma-ref") || "");
      data.set("page", location.href.split("#")[0]);
      data.set("language", root.lang);
      var key = (data.get("access_key") || "").trim();
      var btn = form.querySelector("[type=submit]");
      var vi = root.lang === "vi";
      // Hook for add-ons (e.g. Pro "lead → 1003" preview): fires with the submitted fields before reset.
      function emit() { try { var o = {}; data.forEach(function (v, k) { o[k] = v; }); form.dispatchEvent(new CustomEvent("luma:lead", { detail: o, bubbles: true })); } catch (err) {} }
      // Lead Agent (optional): <form data-agent="APPS_SCRIPT_WEB_APP_URL"> logs + drafts a reply. Never sends.
      var agent = form.getAttribute("data-agent");
      if (agent && !DEMO) {
        fetch(agent, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) }).catch(function () {});
        if (!key || key === "DEMO") { show(true, form.getAttribute("data-ok") || "Thanks — we'll call you back within one business day."); track("lead_submit"); emit(); form.reset(); return; }
      }
      if (DEMO || !key || key === "DEMO") {
        show(true, vi ? "Bản demo: form hoạt động, nhưng không gửi đi đâu cả. Trên site thật, tin nhắn tới email của bạn ngay lập tức."
                      : "Demo: the form works, but nothing was sent. On a live site this lead lands in the owner's inbox instantly.");
        track("lead_submit", { demo: true }); emit(); form.reset(); return;
      }
      btn.disabled = true;
      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) { show(true, form.getAttribute("data-ok") || "Thanks — we'll call you back within one business day."); track("lead_submit"); emit(); form.reset(); }
          else throw new Error(j.message);
        })
        .catch(function () { show(false, form.getAttribute("data-err") || "Something went wrong. Please call us instead."); track("lead_error"); })
        .finally(function () { btn.disabled = false; });
    });
  });

  /* ---------- 5. Small things ------------------------------------------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.setAttribute("aria-live", "polite");
      toastEl.style.cssText = "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99;background:#1F2A2E;color:#fff;padding:.5rem .9rem;border-radius:999px;font:500 13px/1.3 system-ui;opacity:0;transition:opacity .2s;pointer-events:none";
      document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.opacity = "1";
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.style.opacity = "0"; }, 1400);
  }
  document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (n) { io.observe(n); });
  } else { document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-in"); }); }
})();
