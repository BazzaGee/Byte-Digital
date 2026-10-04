(function () {
  'use strict';

  var ENDPOINT = 'https://bytedigital.co.nz/api/websites-funnel';
  var OPEN_DELAY = 10000;

  function endpointFor(tag) {
    var src = tag.getAttribute('src') || '';
    if (!src) return ENDPOINT;
    try {
      var resolved = new URL('/api/websites-funnel', new URL(src, document.baseURI)).href;
      return /^https?:/i.test(resolved) ? resolved : ENDPOINT;
    } catch (e) {
      return ENDPOINT;
    }
  }

  /**
   * Absolute URL for a Byte Digital page, resolved against the script's own
   * origin so dev/staging keep working and live-site embeds never resolve
   * against the prospect's domain.
   */
  function pageFor(tag, path) {
    var fallback = 'https://bytedigital.co.nz' + path;
    var src = tag.getAttribute('src') || '';
    if (!src) return fallback;
    try {
      var resolved = new URL(path, new URL(src, document.baseURI)).href;
      return /^https?:/i.test(resolved) ? resolved : fallback;
    } catch (e) {
      return fallback;
    }
  }

  var STYLES = [
    '.bdf-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;visibility:hidden;transition:opacity .35s cubic-bezier(.4,0,.2,1),visibility .35s;font-family:"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
    '.bdf-overlay.bdf-open{opacity:1;visibility:visible}',
    '.bdf-backdrop{position:absolute;inset:0;background:rgba(3,3,4,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
    '.bdf-modal{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 40px);overflow-y:auto;border-radius:24px;background:linear-gradient(180deg,#15151d 0%,#0d0d13 100%);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 60px rgba(139,120,230,.12);transform:translateY(24px) scale(.96);transition:transform .4s cubic-bezier(.4,0,.2,1);color:#E2E8F0;box-sizing:border-box}',
    '.bdf-overlay.bdf-open .bdf-modal{transform:translateY(0) scale(1)}',
    '.bdf-glow{position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:420px;height:240px;background:radial-gradient(ellipse at center,rgba(139,120,230,.28),transparent 70%);pointer-events:none}',
    '.bdf-topline{position:sticky;top:0;height:4px;background:rgba(255,255,255,.06);overflow:hidden;z-index:2}',
    '.bdf-topline-bar{height:100%;width:0;background:linear-gradient(90deg,#8B78E6,#5EEAD4);transition:width .5s cubic-bezier(.4,0,.2,1)}',
    '.bdf-close{position:absolute;top:16px;right:16px;z-index:3;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#94A3B8;cursor:pointer;transition:all .2s ease;padding:0}',
    '.bdf-close:hover{background:rgba(255,255,255,.1);color:#fff}',
    '.bdf-close svg{width:18px;height:18px}',
    '.bdf-steps{padding:44px 32px 32px;position:relative}',
    '.bdf-step[hidden]{display:none}',
    '.bdf-eyebrow{display:inline-block;padding:5px 12px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5EEAD4;background:rgba(94,234,212,.08);border:1px solid rgba(94,234,212,.2);margin-bottom:16px}',
    '.bdf-heading{font-size:clamp(24px,4vw,30px);font-weight:700;line-height:1.18;letter-spacing:-.02em;color:#fff;margin:0 0 12px}',
    '.bdf-gradient{background:linear-gradient(135deg,#8B78E6,#5EEAD4);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
    '.bdf-lede{font-size:15px;line-height:1.65;color:#94A3B8;margin:0 0 22px}',
    '.bdf-lede strong{color:#E2E8F0;font-weight:600}',
    '.bdf-actions{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}',
    '.bdf-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px 24px;border-radius:999px;font-family:inherit;font-size:15px;font-weight:700;line-height:1.1;cursor:pointer;border:1px solid transparent;transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s,background .25s,border-color .25s}',
    '.bdf-btn-primary{background:linear-gradient(135deg,#5EEAD4,#fff);color:#050507}',
    '.bdf-btn-primary:hover{transform:scale(1.02);box-shadow:0 0 34px rgba(94,234,212,.4)}',
    '.bdf-btn-secondary{background:rgba(139,120,230,.1);border-color:rgba(139,120,230,.35);color:#fff}',
    '.bdf-btn-secondary:hover{background:rgba(139,120,230,.2);border-color:#8B78E6}',
    '.bdf-btn:disabled{opacity:.65;cursor:default;transform:none;box-shadow:none}',
    '.bdf-dismiss{display:block;margin:4px auto 0;background:none;border:none;color:#64748B;font-family:inherit;font-size:13px;cursor:pointer;padding:6px 10px;transition:color .2s}',
    '.bdf-dismiss:hover{color:#94A3B8}',
    '.bdf-micro{text-align:center;font-size:11.5px;color:#64748B;margin:12px 0 0;letter-spacing:.2px}',
    '.bdf-list{list-style:none;margin:0 0 24px;padding:0;display:flex;flex-direction:column;gap:12px}',
    '.bdf-list li{display:flex;align-items:flex-start;gap:12px;font-size:14.5px;color:#CBD5E1;line-height:1.5}',
    '.bdf-tick{flex:0 0 auto;width:20px;height:20px;margin-top:1px;border-radius:50%;background:rgba(94,234,212,.12);border:1px solid rgba(94,234,212,.3);position:relative}',
    '.bdf-tick:after{content:"";position:absolute;left:6px;top:4px;width:5px;height:9px;border:solid #5EEAD4;border-width:0 2px 2px 0;transform:rotate(45deg)}',
    '.bdf-form{display:flex;flex-direction:column;gap:12px}',
    '.bdf-input{width:100%;padding:15px 18px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);color:#E2E8F0;font-family:inherit;font-size:15px;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}',
    '.bdf-input::placeholder{color:#64748B}',
    '.bdf-input:focus{outline:none;border-color:#8B78E6;box-shadow:0 0 0 3px rgba(139,120,230,.18)}',
    '.bdf-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '.bdf-error{font-size:13px;color:#fca5a5;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:9px 12px}',
    '.bdf-center{text-align:center}',
    '.bdf-center .bdf-actions{margin-top:22px}',
    '.bdf-center .bdf-btn{width:auto;min-width:160px}',
    '.bdf-success{width:68px;height:68px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#5EEAD4;background:rgba(94,234,212,.1);border:1px solid rgba(94,234,212,.3);box-shadow:0 0 40px rgba(94,234,212,.25)}',
    '.bdf-success svg{width:34px;height:34px}',
    '.bdf-pill{position:fixed;right:16px;bottom:16px;z-index:2147482999;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#5EEAD4,#fff);color:#050507;font-family:"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.45),0 0 24px rgba(94,234,212,.3);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}',
    '.bdf-pill.bdf-show{opacity:1;visibility:visible}',
    '@media(max-width:560px){.bdf-steps{padding:40px 22px 26px}.bdf-modal{border-radius:20px}}'
  ].join('');

  var COPY = {
    showcase: {
      lead: 'We built ',
      accent: 'website.',
      lede: 'It\u2019s already done \u2014 and you can have it, completely free. Just pick one:'
    },
    live: {
      lead: 'Like this website? ',
      accent: 'It\u2019s yours \u2014 free.',
      lede: 'We built this for your business at no cost. It\u2019s already done \u2014 and you can have it. Just pick one:'
    }
  };

  function svg(paths, width) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="' + width + '" height="' + width + '">' + paths + '</svg>';
  }

  function arrow() {
    return svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 16);
  }

  function shell(context, business) {
    var copy = COPY[context] || COPY.showcase;
    return '' +
      '<div class="bdf-backdrop" data-bdf-close></div>' +
      '<div class="bdf-modal" role="dialog" aria-modal="true" aria-label="Get your free website">' +
        '<div class="bdf-glow" aria-hidden="true"></div>' +
        '<div class="bdf-topline" aria-hidden="true"><div class="bdf-topline-bar" data-bdf="topbar"></div></div>' +
        '<button type="button" class="bdf-close" data-bdf-close aria-label="Close">' + svg('<path d="M18 6L6 18M6 6l12 12"/>', 18) + '</button>' +
        '<div class="bdf-steps">' +
          '<section class="bdf-step" data-step="choice">' +
            '<div class="bdf-eyebrow">Free for ' + business + '</div>' +
            '<h2 class="bdf-heading"><span data-bdf="h-lead"></span> <span class="bdf-gradient" data-bdf="h-accent"></span></h2>' +
            '<p class="bdf-lede" data-bdf="lede"></p>' +
            '<div class="bdf-actions">' +
              '<button type="button" class="bdf-btn bdf-btn-primary" data-bdf-branch="files">' + svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', 18) + 'Yes! I want this website</button>' +
              '<button type="button" class="bdf-btn bdf-btn-secondary" data-bdf-branch="redesign">' + svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/>', 18) + 'Make it even better \u2014 free redesign</button>' +
            '</div>' +
            '<button type="button" class="bdf-dismiss" data-bdf-close>No thanks, just browsing</button>' +
            '<p class="bdf-micro">Completely free \u00b7 No catch \u00b7 No tech skills needed</p>' +
          '</section>' +
          '<section class="bdf-step" data-step="a1" hidden>' +
            '<div class="bdf-eyebrow">Yours to keep</div>' +
            '<h2 class="bdf-heading"><span>Your website is ready \u2014 and it\u2019s </span><span class="bdf-gradient">yours free.</span></h2>' +
            '<p class="bdf-lede">Here\u2019s the good part:</p>' +
            '<ul class="bdf-list">' +
              '<li><span class="bdf-tick" aria-hidden="true"></span>Already built for your business</li>' +
              '<li><span class="bdf-tick" aria-hidden="true"></span>Yours to keep \u2014 100% free</li>' +
              '<li><span class="bdf-tick" aria-hidden="true"></span>We\u2019ll walk you through getting it online, no tech skills needed</li>' +
            '</ul>' +
            '<div class="bdf-actions">' +
              '<button type="button" class="bdf-btn bdf-btn-primary" data-bdf-go="a2">Yes! Send me my website' + arrow() + '</button>' +
            '</div>' +
            '<button type="button" class="bdf-dismiss" data-bdf-go="choice">\u2190 Back</button>' +
          '</section>' +
          '<section class="bdf-step" data-step="a2" hidden>' +
            '<div class="bdf-eyebrow">Almost yours</div>' +
            '<h2 class="bdf-heading">Where should we send it?</h2>' +
            '<p class="bdf-lede">Pop your email in and your website is on its way.</p>' +
            '<form class="bdf-form" data-bdf-form="files" novalidate>' +
              '<input type="email" class="bdf-input" name="email" placeholder="you@yourbusiness.co.nz" autocomplete="email" required>' +
              '<input type="text" name="website" class="bdf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
              '<div class="bdf-error" role="alert" hidden></div>' +
              '<button type="submit" class="bdf-btn bdf-btn-primary">Send me my website' + arrow() + '</button>' +
            '</form>' +
            '<p class="bdf-micro">We\u2019ll include a simple guide to getting it online.</p>' +
            '<button type="button" class="bdf-dismiss" data-bdf-go="a1">\u2190 Back</button>' +
          '</section>' +
          '<section class="bdf-step bdf-center" data-step="a3" hidden>' +
            '<div class="bdf-success" aria-hidden="true">' + svg('<path d="M20 6L9 17l-5-5"/>', 34) + '</div>' +
            '<h2 class="bdf-heading">Check your inbox</h2>' +
            '<p class="bdf-lede" data-bdf="success-files"></p>' +
            '<div class="bdf-actions"><button type="button" class="bdf-btn bdf-btn-primary" data-bdf-close>Got it</button></div>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  function mount(tag) {
    var config = {
      slug: (tag.getAttribute('data-slug') || '').trim(),
      business: (tag.getAttribute('data-business') || '').trim() || 'your business',
      category: (tag.getAttribute('data-category') || '').trim(),
      liveUrl: (tag.getAttribute('data-live-url') || '').trim(),
      context: (tag.getAttribute('data-context') || 'showcase').trim()
    };
    if (!config.slug) return;

    var copy = COPY[config.context] || COPY.showcase;
    var storageKey = 'bd-funnel-' + config.slug;
    var endpoint = endpointFor(tag);

    var style = document.createElement('style');
    style.setAttribute('data-bd-funnel', 'styles');
    style.textContent = STYLES;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'bdf-overlay';
    overlay.setAttribute('data-bd-funnel', 'overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = shell(config.context, '');
    document.body.appendChild(overlay);

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'bdf-pill';
    pill.setAttribute('data-bd-funnel', 'pill');
    pill.textContent = 'Get this website free';
    document.body.appendChild(pill);

    var steps = Array.prototype.slice.call(overlay.querySelectorAll('.bdf-step'));
    var topbar = overlay.querySelector('[data-bdf="topbar"]');
    var progress = { choice: 0, a1: 33, a2: 66, a3: 100 };
    var current = 'choice';
    var opened = false;
    var suppressedFlag = false;
    var completed = false;
    var savedEmail = '';

    overlay.querySelector('[data-bdf="h-lead"]').textContent = config.context === 'live' ? copy.lead : copy.lead + config.business + ' a';
    overlay.querySelector('[data-bdf="h-accent"]').textContent = copy.accent;
    overlay.querySelector('[data-bdf="lede"]').textContent = copy.lede;
    var eyebrow = overlay.querySelector('.bdf-step[data-step="choice"] .bdf-eyebrow');
    if (eyebrow) eyebrow.textContent = 'Free for ' + config.business;

    function suppressed() {
      if (suppressedFlag) return true;
      try { return sessionStorage.getItem(storageKey) === '1'; } catch (e) { return false; }
    }
    function suppress() {
      suppressedFlag = true;
      try { sessionStorage.setItem(storageKey, '1'); } catch (e) {}
    }

    function go(step) {
      if (!Object.prototype.hasOwnProperty.call(progress, step)) return;
      current = step;
      steps.forEach(function (node) { node.hidden = node.getAttribute('data-step') !== step; });
      if (topbar) topbar.style.width = (progress[step] || 0) + '%';
      var active = overlay.querySelector('.bdf-step[data-step="' + step + '"]');
      if (active) {
        var input = active.querySelector('.bdf-input');
        if (input) setTimeout(function () { input.focus(); }, 60);
      }
      if (step === 'a3') {
        var line = overlay.querySelector('[data-bdf="success-files"]');
        if (line) {
          line.textContent = 'Your website for ' + config.business + ' is on its way to ' + savedEmail + '. Can\u2019t find it? Look in Promotions or spam.';
        }
      }
    }

    function open(force) {
      if (opened) return;
      if (!force && suppressed()) return;
      opened = true;
      pill.classList.remove('bdf-show');
      overlay.classList.add('bdf-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      go('choice');
      var closeBtn = overlay.querySelector('.bdf-close');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('bdf-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      suppress();
      if (completed) return;
      pill.classList.add('bdf-show');
    }

    function setError(form, message) {
      var box = form.querySelector('.bdf-error');
      if (!box) return;
      if (message) { box.textContent = message; box.removeAttribute('hidden'); }
      else { box.textContent = ''; box.setAttribute('hidden', 'hidden'); }
    }

    function send(form) {
      var input = form.querySelector('input[name="email"]');
      var honeypot = form.querySelector('input[name="website"]');
      var button = form.querySelector('button[type="submit"]');
      var email = (input.value || '').trim();
      setError(form, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(form, 'Please enter a valid email address.');
        input.focus();
        return;
      }
      var original = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Sending\u2026';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: config.slug,
          businessName: config.business,
          category: config.category,
          liveUrl: config.liveUrl,
          choice: 'files',
          email: email,
          website: honeypot ? honeypot.value : '',
          pageUrl: window.location.href,
          surface: config.context
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('request failed');
        savedEmail = email;
        completed = true;
        suppress();
        go('a3');
      }).catch(function () {
        setError(form, 'Something went wrong. Please try again.');
        button.disabled = false;
        button.innerHTML = original;
      });
    }

    // The redesign branch lives on Byte Digital now: a dedicated six-step
    // brief at /rebuild/, tagged so the lead can be traced back to this site.
    function redesignUrl() {
      var parts = ['src=' + encodeURIComponent(config.context === 'live' ? 'live' : 'showcase')];
      if (config.slug) parts.push('slug=' + encodeURIComponent(config.slug));
      if (config.business && config.business !== 'your business') {
        parts.push('business=' + encodeURIComponent(config.business));
      }
      if (config.liveUrl) parts.push('live=' + encodeURIComponent(config.liveUrl));
      return pageFor(tag, '/rebuild/') + '?' + parts.join('&');
    }

    overlay.addEventListener('click', function (event) {
      var target = event.target;
      if (target.closest('[data-bdf-close]')) { close(); return; }
      var nav = target.closest('[data-bdf-go]');
      if (nav) { go(nav.getAttribute('data-bdf-go')); return; }
      var branch = target.closest('[data-bdf-branch]');
      if (!branch) return;
      if (branch.getAttribute('data-bdf-branch') === 'files') { go('a1'); return; }
      window.location.assign(redesignUrl());
    });

    Array.prototype.forEach.call(overlay.querySelectorAll('form.bdf-form'), function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        send(form);
      });
    });

    pill.addEventListener('click', function () {
      opened = false;
      open(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay.classList.contains('bdf-open')) close();
    });

    var params = new URLSearchParams(window.location.search);
    var automated = navigator.webdriver === true || params.get('bd_no_popup') === '1';
    if (!automated && !suppressed()) {
      setTimeout(function () { open(); }, OPEN_DELAY);
    }

    window.__bdfOpen = function () { opened = false; open(true); };
  }

  function init() {
    var tags = Array.prototype.slice.call(document.querySelectorAll('script[data-bd-funnel]'));
    var seen = 0;
    tags.forEach(function (tag) {
      if (tag.getAttribute('data-bd-funnel-mounted') === '1') return;
      tag.setAttribute('data-bd-funnel-mounted', '1');
      seen++;
      try { mount(tag); } catch (error) {}
    });
    return seen;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
