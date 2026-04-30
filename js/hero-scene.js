/* ============================================================
   ArcLab — Hero Scene System
   Two alternating scenes with glitch transition + live typing
============================================================ */

(function HeroSceneSystem() {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── DOM refs ─────────────────────────────────────────── */
  const heroVisual   = document.getElementById('heroVisual');
  const sceneA       = document.getElementById('sceneA');
  const sceneB       = document.getElementById('sceneB');
  const glitchCanvas = document.getElementById('glitchCanvas');
  const codeLines    = document.getElementById('codeLines');
  const codeCaret    = document.getElementById('codeCaret');
  const imgWorkspace = document.getElementById('imgWorkspace');

  if (!heroVisual || !sceneA || !sceneB) return;

  const glitchCtx = glitchCanvas.getContext('2d');

  /* ── State ────────────────────────────────────────────── */
  let currentScene  = 'A';
  let sceneTimer    = null;
  let kenBurnsRaf   = null;
  let kenStart      = null;
  let typingState   = null;
  let busy          = false; // prevents overlapping transitions

  /* ── Code content ─────────────────────────────────────── */
  // Each part: { t: 'text', c: 'css-class' }
  const LINES = [
    [{ t: 'from ', c: 'ck' }, { t: 'aiogram', c: '' }, { t: ' import ', c: 'ck' }, { t: 'Bot, Dispatcher', c: 'cf' }],
    [{ t: 'import ', c: 'ck' }, { t: 'asyncio', c: '' }],
    [],
    [{ t: 'TOKEN', c: 'cf' }, { t: ' = os.getenv(', c: '' }, { t: '"BOT_TOKEN"', c: 'cs' }, { t: ')', c: '' }],
    [],
    [{ t: 'bot', c: '' }, { t: ' = ', c: '' }, { t: 'Bot', c: 'cf' }, { t: '(token=TOKEN)', c: '' }],
    [{ t: 'dp', c: '' },  { t: ' = ', c: '' }, { t: 'Dispatcher', c: 'cf' }, { t: '()', c: '' }],
    [],
    [{ t: '@dp.message()', c: 'ck' }],
    [{ t: 'async ', c: 'ck' }, { t: 'def ', c: 'ck' }, { t: 'start', c: 'cf' }, { t: '(message):', c: '' }],
    [{ t: '    ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'message.', c: '' }, { t: 'answer', c: 'cf' }, { t: '(', c: '' }, { t: '"Вітаємо!"', c: 'cs' }, { t: ')', c: '' }],
    [],
    [{ t: 'async ', c: 'ck' }, { t: 'def ', c: 'ck' }, { t: 'main', c: 'cf' }, { t: '():', c: '' }],
    [{ t: '    ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'dp.', c: '' }, { t: 'start_polling', c: 'cf' }, { t: '(bot)', c: '' }],
    [],
    [{ t: '# launching bot...', c: 'cc' }],
    [{ t: 'asyncio.run(main())', c: '' }],
  ];

  /* ── Preload images ───────────────────────────────────── */
  ['assets/hero/hero-workspace.png', 'assets/hero/hero-code.png'].forEach(src => {
    const img = new Image(); img.src = src;
  });

  /* ══════════════════════════════════════════════════════
     KEN BURNS — Scene A subtle drift
  ══════════════════════════════════════════════════════ */
  function startKenBurns() {
    kenStart = null;
    const dur = 12000;

    function tick(ts) {
      if (currentScene !== 'A') return;
      if (!kenStart) kenStart = ts;
      const p = Math.min((ts - kenStart) / dur, 1);
      // Smooth ease-out
      const e = 1 - Math.pow(1 - p, 3);
      imgWorkspace.style.transform =
        `scale(${1 + e * 0.04}) translate(${-e * 9}px, ${-e * 5}px)`;
      kenBurnsRaf = requestAnimationFrame(tick);
    }
    kenBurnsRaf = requestAnimationFrame(tick);
  }

  function stopKenBurns() {
    cancelAnimationFrame(kenBurnsRaf);
    kenBurnsRaf = null;
  }

  function resetKenBurns() {
    imgWorkspace.style.transform = '';
  }

  /* ══════════════════════════════════════════════════════
     GLITCH TRANSITION
  ══════════════════════════════════════════════════════ */
  function resizeCanvas() {
    glitchCanvas.width  = heroVisual.offsetWidth;
    glitchCanvas.height = heroVisual.offsetHeight;
  }

  function drawGlitch() {
    const w = glitchCanvas.width;
    const h = glitchCanvas.height;
    glitchCtx.clearRect(0, 0, w, h);

    // Subtle scanline grid
    glitchCtx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < h; y += 3) glitchCtx.fillRect(0, y, w, 1);

    // 3-5 random bright horizontal bands
    const bands = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bands; i++) {
      const by = Math.random() * h;
      const bh = Math.random() * 10 + 1;
      const bx = (Math.random() - 0.5) * 8;
      glitchCtx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
      glitchCtx.fillRect(bx, by, w, bh);
    }

    // Occasional white flicker strip
    if (Math.random() > 0.7) {
      const fy = Math.random() * h;
      glitchCtx.fillStyle = 'rgba(255,255,255,0.04)';
      glitchCtx.fillRect(0, fy, w, 2);
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function glitchTransition(flipFn) {
    if (REDUCED) { flipFn(); return; }
    resizeCanvas();

    const TOTAL   = 420;
    const FLIP_AT = 200;
    let   done    = false;
    const t0      = performance.now();

    /* Canvas animation loop */
    function animCanvas(ts) {
      if (done) return;
      const elapsed  = ts - t0;
      const progress = Math.min(elapsed / TOTAL, 1);
      // Arc: ramp up, ramp down
      const alpha = progress < 0.5
        ? progress * 2 * 0.9
        : (1 - progress) * 2 * 0.9;
      glitchCanvas.style.opacity = alpha;
      if (Math.random() > 0.35) drawGlitch();
      if (!done) requestAnimationFrame(animCanvas);
    }
    requestAnimationFrame(animCanvas);

    /* Scene shake */
    const out = currentScene === 'A' ? sceneA : sceneB;
    out.style.transition = 'none';
    await delay(35);  out.style.transform = 'translateX(2px) scaleY(1.002)';
    await delay(55);  out.style.transform = 'translateX(-2px)';
    out.style.opacity = '0.65';
    await delay(55);  out.style.transform = 'translateX(1px)';
    await delay(FLIP_AT - 145); // reach midpoint

    /* Flip */
    out.style.transition  = '';
    out.style.transform   = '';
    out.style.opacity     = '';
    flipFn();

    /* Post-flip settle */
    await delay(TOTAL - FLIP_AT);
    done = true;
    glitchCanvas.style.opacity = 0;
    glitchCtx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
  }

  /* ══════════════════════════════════════════════════════
     SCENE SWITCHING
  ══════════════════════════════════════════════════════ */
  async function switchScene() {
    if (busy) return;
    busy = true;
    clearTimeout(sceneTimer);

    if (currentScene === 'A') {
      await glitchTransition(() => {
        sceneA.classList.remove('is-active');
        sceneB.classList.add('is-active');
        currentScene = 'B';
        stopKenBurns();
        resetKenBurns();
        startTyping();
      });
    } else {
      await glitchTransition(() => {
        sceneB.classList.remove('is-active');
        sceneA.classList.add('is-active');
        currentScene = 'A';
        stopTyping();
        startKenBurns();
      });
    }

    busy = false;
    scheduleSwitch();
  }

  function scheduleSwitch() {
    sceneTimer = setTimeout(switchScene, 5000);
  }

  /* ══════════════════════════════════════════════════════
     TYPING ANIMATION — Scene B
  ══════════════════════════════════════════════════════ */
  function startTyping() {
    if (REDUCED) return;
    stopTyping();
    codeLines.innerHTML = '';
    codeCaret.style.display = 'inline';

    const st = { active: true, tid: null };
    typingState = st;
    runTypingLoop(st);
  }

  function stopTyping() {
    if (typingState) {
      typingState.active = false;
      clearTimeout(typingState.tid);
      typingState = null;
    }
    codeLines.innerHTML = '';
    codeCaret.style.display = 'none';
  }

  function sleep(st, ms) {
    return new Promise(res => {
      if (!st.active) return res();
      st.tid = setTimeout(res, ms);
    });
  }

  function charDelay() { return 25 + Math.random() * 20; }

  async function runTypingLoop(st) {
    while (st.active) {
      codeLines.innerHTML = '';

      for (let li = 0; li < LINES.length && st.active; li++) {
        const parts = LINES[li];
        const lineEl = document.createElement('div');
        lineEl.className = 'code-line';
        codeLines.appendChild(lineEl);
        lineEl.appendChild(codeCaret); // caret at end of current line

        if (parts.length === 0) {
          // empty line — just a short pause
          await sleep(st, 80);
          continue;
        }

        for (const part of parts) {
          if (!st.active || !part.t) continue;
          const span = document.createElement('span');
          if (part.c) span.className = part.c;
          lineEl.insertBefore(span, codeCaret); // before caret

          for (const char of part.t) {
            if (!st.active) return;
            span.textContent += char;
            await sleep(st, charDelay());
          }
        }
        // brief pause between lines
        await sleep(st, 40 + Math.random() * 60);
      }

      if (!st.active) return;

      // Hold completed code
      await sleep(st, 1500);
      if (!st.active) return;

      // Soft fade out, then restart
      codeLines.style.transition = 'opacity 0.35s ease';
      codeLines.style.opacity    = '0';
      await sleep(st, 380);
      if (!st.active) return;
      codeLines.innerHTML        = '';
      codeLines.style.opacity    = '1';
      codeLines.style.transition = '';
      codeLines.appendChild(codeCaret);
      await sleep(st, 200);
    }
  }

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init() {
    sceneA.classList.add('is-active');
    sceneB.classList.remove('is-active');
    glitchCanvas.style.opacity = 0;
    codeCaret.style.display    = 'none';

    window.addEventListener('resize', resizeCanvas);

    if (!REDUCED) {
      startKenBurns();
      scheduleSwitch();
    }
  }

  // Wait for GSAP hero load animation to finish (~1.1s)
  setTimeout(init, 1300);
})();
