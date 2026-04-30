/* ============================================================
   ArcLab — Hero Scene System v2
   Scene A: workspace + Ken Burns (4s)
   Scene B: code env + live typing (until done + 2s pause)
   Glitch transition: 450ms monochrome premium
============================================================ */

(function HeroSceneSystem() {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCENE_A_MS = 4000;

  /* ── DOM ──────────────────────────────────────────────── */
  const heroVisual   = document.getElementById('heroVisual');
  const sceneA       = document.getElementById('sceneA');
  const sceneB       = document.getElementById('sceneB');
  const glitchCanvas = document.getElementById('glitchCanvas');
  const codeLines    = document.getElementById('codeLines');
  const codeCaret    = document.getElementById('codeCaret');
  const imgWorkspace = document.getElementById('imgWorkspace');

  if (!heroVisual || !sceneA || !sceneB) return;

  const gctx = glitchCanvas.getContext('2d');

  /* ── State ────────────────────────────────────────────── */
  let currentScene = 'A';
  let sceneTimer   = null;
  let kenRaf       = null;
  let kenStart     = null;
  let typingState  = null;
  let busy         = false;

  /* ══════════════════════════════════════════════════════
     CODE CONTENT
     First PRE_N lines rendered instantly ("already typed"),
     remaining lines typed character-by-character.
  ══════════════════════════════════════════════════════ */
  const PRE_N = 18; // lines shown instantly on scene enter

  // Each line: array of parts { t: text, c: css-class }
  // Empty array = blank line
  const ALL_LINES = [
    /* 1  */ [{ t: 'from ', c: 'ck' }, { t: 'aiogram', c: 'cm' }, { t: ' import ', c: 'ck' }, { t: 'Bot', c: 'cf' }, { t: ', ', c: 'cp' }, { t: 'Dispatcher', c: 'cf' }, { t: ', ', c: 'cp' }, { t: 'types', c: 'cf' }],
    /* 2  */ [{ t: 'from ', c: 'ck' }, { t: 'aiogram.filters', c: 'cm' }, { t: ' import ', c: 'ck' }, { t: 'CommandStart', c: 'cf' }],
    /* 3  */ [{ t: 'from ', c: 'ck' }, { t: 'aiogram.types', c: 'cm' }, { t: ' import ', c: 'ck' }, { t: 'InlineKeyboardMarkup', c: 'cf' }, { t: ', ', c: 'cp' }, { t: 'InlineKeyboardButton', c: 'cf' }],
    /* 4  */ [{ t: 'from ', c: 'ck' }, { t: 'aiogram.utils.keyboard', c: 'cm' }, { t: ' import ', c: 'ck' }, { t: 'InlineKeyboardBuilder', c: 'cf' }],
    /* 5  */ [{ t: 'import ', c: 'ck' }, { t: 'asyncio', c: 'cm' }],
    /* 6  */ [{ t: 'import ', c: 'ck' }, { t: 'logging', c: 'cm' }],
    /* 7  */ [{ t: 'import ', c: 'ck' }, { t: 'os', c: 'cm' }],
    /* 8  */ [{ t: 'from ', c: 'ck' }, { t: 'datetime', c: 'cm' }, { t: ' import ', c: 'ck' }, { t: 'datetime', c: 'cf' }],
    /* 9  */ [],
    /* 10 */ [{ t: 'API_TOKEN', c: 'cf' }, { t: ' = ', c: 'cp' }, { t: 'os', c: 'cf' }, { t: '.getenv(', c: 'cp' }, { t: '"BOT_TOKEN"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 11 */ [{ t: 'ADMIN_IDS', c: 'cf' }, { t: ' = [', c: 'cp' }, { t: '123456789', c: 'cn' }, { t: ', ', c: 'cp' }, { t: '987654321', c: 'cn' }, { t: ']', c: 'cp' }],
    /* 12 */ [],
    /* 13 */ [{ t: 'bot', c: 'cf' }, { t: ' = ', c: 'cp' }, { t: 'Bot', c: 'cf' }, { t: '(token=', c: 'cp' }, { t: 'API_TOKEN', c: 'cf' }, { t: ', parse_mode=', c: 'cp' }, { t: '"HTML"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 14 */ [{ t: 'dp', c: 'cf' }, { t: ' = ', c: 'cp' }, { t: 'Dispatcher', c: 'cf' }, { t: '()', c: 'cp' }],
    /* 15 */ [],
    /* 16 */ [{ t: 'logging', c: 'cf' }, { t: '.basicConfig(', c: 'cp' }],
    /* 17 */ [{ t: '    level', c: 'cf' }, { t: '=logging', c: 'cp' }, { t: '.INFO,', c: 'cp' }],
    /* 18 */ [{ t: '    format', c: 'cf' }, { t: '=', c: 'cp' }, { t: '"%(asctime)s - %(name)s - %(levelname)s - %(message)s"', c: 'cs' }],
    /* 19 */ [{ t: ')', c: 'cp' }],
    /* 20 */ [{ t: 'logger', c: 'cf' }, { t: ' = ', c: 'cp' }, { t: 'logging', c: 'cf' }, { t: '.getLogger(', c: 'cp' }, { t: '__name__', c: 'cf' }, { t: ')', c: 'cp' }],
    /* 21 */ [],
    /* 22 */ [{ t: 'def ', c: 'ck' }, { t: 'main_keyboard', c: 'cf' }, { t: '() -> ', c: 'cp' }, { t: 'InlineKeyboardMarkup', c: 'cf' }, { t: ':', c: 'cp' }],
    /* 23 */ [{ t: '    builder', c: 'cf' }, { t: ' = ', c: 'cp' }, { t: 'InlineKeyboardBuilder', c: 'cf' }, { t: '()', c: 'cp' }],
    /* 24 */ [{ t: '    builder', c: 'cf' }, { t: '.button(text=', c: 'cp' }, { t: '"Послуги"', c: 'cs' }, { t: ', callback_data=', c: 'cp' }, { t: '"services"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 25 */ [{ t: '    builder', c: 'cf' }, { t: '.button(text=', c: 'cp' }, { t: '"Портфоліо"', c: 'cs' }, { t: ', callback_data=', c: 'cp' }, { t: '"portfolio"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 26 */ [{ t: '    builder', c: 'cf' }, { t: '.button(text=', c: 'cp' }, { t: '"Про нас"', c: 'cs' }, { t: ', callback_data=', c: 'cp' }, { t: '"about"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 27 */ [{ t: '    builder', c: 'cf' }, { t: '.button(text=', c: 'cp' }, { t: '"Контакти"', c: 'cs' }, { t: ', callback_data=', c: 'cp' }, { t: '"contact"', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 28 */ [{ t: '    builder', c: 'cf' }, { t: '.adjust(', c: 'cp' }, { t: '2', c: 'cn' }, { t: ', ', c: 'cp' }, { t: '2', c: 'cn' }, { t: ')', c: 'cp' }],
    /* 29 */ [{ t: '    ', c: '' }, { t: 'return ', c: 'ck' }, { t: 'builder', c: 'cf' }, { t: '.as_markup()', c: 'cp' }],
    /* 30 */ [],
    /* 31 */ [{ t: '@dp.message', c: 'cf' }, { t: '(', c: 'cp' }, { t: 'CommandStart', c: 'cf' }, { t: '())', c: 'cp' }],
    /* 32 */ [{ t: 'async ', c: 'ck' }, { t: 'def ', c: 'ck' }, { t: 'cmd_start', c: 'cf' }, { t: '(message: ', c: 'cp' }, { t: 'types', c: 'cf' }, { t: '.Message):', c: 'cp' }],
    /* 33 */ [{ t: '    ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'message', c: 'cf' }, { t: '.answer(', c: 'cp' }],
    /* 34 */ [{ t: '        f', c: 'cp' }, { t: '"Вітаємо, {message.from_user.first_name}! 👋\\n"', c: 'cs' }],
    /* 35 */ [{ t: '        ', c: '' }, { t: '"Оберіть розділ нижче"', c: 'cs' }, { t: ',', c: 'cp' }],
    /* 36 */ [{ t: '        reply_markup=', c: 'cp' }, { t: 'main_keyboard', c: 'cf' }, { t: '()', c: 'cp' }],
    /* 37 */ [{ t: '    )', c: 'cp' }],
    /* 38 */ [],
    /* 39 */ [{ t: '@dp.callback_query', c: 'cf' }, { t: '()', c: 'cp' }],
    /* 40 */ [{ t: 'async ', c: 'ck' }, { t: 'def ', c: 'ck' }, { t: 'process_callback', c: 'cf' }, { t: '(callback: ', c: 'cp' }, { t: 'types', c: 'cf' }, { t: '.CallbackQuery):', c: 'cp' }],
    /* 41 */ [{ t: '    data', c: 'cf' }, { t: ' = callback.data', c: 'cp' }],
    /* 42 */ [{ t: '    ', c: '' }, { t: 'if ', c: 'ck' }, { t: 'data', c: 'cf' }, { t: ' == ', c: 'cp' }, { t: '"services"', c: 'cs' }, { t: ':', c: 'cp' }],
    /* 43 */ [{ t: '        ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'callback', c: 'cf' }, { t: '.message.edit_text(', c: 'cp' }],
    /* 44 */ [{ t: '            ', c: '' }, { t: '"<b>Наші послуги:</b>\\n"', c: 'cs' }],
    /* 45 */ [{ t: '            ', c: '' }, { t: '"• Telegram-боти\\n• Веб-сайти\\n"', c: 'cs' }],
    /* 46 */ [{ t: '            ', c: '' }, { t: '"• Автоматизація бізнес-процесів\\n"', c: 'cs' }],
    /* 47 */ [{ t: '            ', c: '' }, { t: '"• AI інтеграції"', c: 'cs' }],
    /* 48 */ [{ t: '        )', c: 'cp' }],
    /* 49 */ [{ t: '    ', c: '' }, { t: 'elif ', c: 'ck' }, { t: 'data', c: 'cf' }, { t: ' == ', c: 'cp' }, { t: '"portfolio"', c: 'cs' }, { t: ':', c: 'cp' }],
    /* 50 */ [{ t: '        ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'callback', c: 'cf' }, { t: '.message.edit_text(', c: 'cp' }],
    /* 51 */ [{ t: '            ', c: '' }, { t: '"<b>Портфоліо</b>\\nСкоро буде доступно 🚀"', c: 'cs' }],
    /* 52 */ [{ t: '        )', c: 'cp' }],
    /* 53 */ [{ t: '    ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'callback', c: 'cf' }, { t: '.answer()', c: 'cp' }],
    /* 54 */ [],
    /* 55 */ [{ t: 'async ', c: 'ck' }, { t: 'def ', c: 'ck' }, { t: 'main', c: 'cf' }, { t: '():', c: 'cp' }],
    /* 56 */ [{ t: '    logger', c: 'cf' }, { t: '.info(', c: 'cp' }, { t: '"Starting ArcLab bot..."', c: 'cs' }, { t: ')', c: 'cp' }],
    /* 57 */ [{ t: '    ', c: '' }, { t: 'await ', c: 'ck' }, { t: 'dp', c: 'cf' }, { t: '.start_polling(', c: 'cp' }, { t: 'bot', c: 'cf' }, { t: ')', c: 'cp' }],
    /* 58 */ [],
    /* 59 */ [{ t: 'if ', c: 'ck' }, { t: '__name__', c: 'cf' }, { t: ' == ', c: 'cp' }, { t: '"__main__"', c: 'cs' }, { t: ':', c: 'cp' }],
    /* 60 */ [{ t: '    asyncio', c: 'cf' }, { t: '.run(', c: 'cp' }, { t: 'main', c: 'cf' }, { t: '())', c: 'cp' }],
  ];

  /* ── Preload ───────────────────────────────────────────── */
  ['assets/hero/hero-workspace.png']
    .forEach(src => { const i = new Image(); i.src = src; });

  /* ══════════════════════════════════════════════════════
     KEN BURNS — Scene A
  ══════════════════════════════════════════════════════ */
  function startKenBurns() {
    kenStart = null;
    const DUR = 13000;
    function tick(ts) {
      if (currentScene !== 'A') return;
      if (!kenStart) kenStart = ts;
      const p = Math.min((ts - kenStart) / DUR, 1);
      const e = 1 - Math.pow(1 - p, 3);
      imgWorkspace.style.transform =
        `scale(${1 + e * 0.042}) translate(${-e * 9}px, ${-e * 4}px)`;
      kenRaf = requestAnimationFrame(tick);
    }
    kenRaf = requestAnimationFrame(tick);
  }

  function stopKenBurns() { cancelAnimationFrame(kenRaf); kenRaf = null; }
  function resetKenBurns() { imgWorkspace.style.transform = ''; }

  /* ══════════════════════════════════════════════════════
     GLITCH TRANSITION
  ══════════════════════════════════════════════════════ */
  function resizeCanvas() {
    glitchCanvas.width  = heroVisual.offsetWidth;
    glitchCanvas.height = heroVisual.offsetHeight;
  }

  function drawGlitch() {
    const w = glitchCanvas.width, h = glitchCanvas.height;
    gctx.clearRect(0, 0, w, h);
    // Scanline grid
    gctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let y = 0; y < h; y += 3) gctx.fillRect(0, y, w, 1);
    // Random bright bands
    for (let i = 0, n = 2 + (Math.random() * 4 | 0); i < n; i++) {
      gctx.fillStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.055})`;
      gctx.fillRect((Math.random() - 0.5) * 6, Math.random() * h, w, Math.random() * 11 + 1);
    }
    // Occasional bright flicker stripe
    if (Math.random() > 0.65) {
      gctx.fillStyle = 'rgba(255,255,255,0.045)';
      gctx.fillRect(0, Math.random() * h, w, 2);
    }
  }

  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function glitchTransition(flipFn) {
    if (REDUCED) { flipFn(); return; }
    resizeCanvas();

    const TOTAL = 450, FLIP = 210;
    let done = false;
    const t0 = performance.now();

    ;(function animG(ts) {
      if (done) return;
      const p   = Math.min((ts - t0) / TOTAL, 1);
      const alpha = p < 0.5 ? p * 2 * 0.88 : (1 - p) * 2 * 0.88;
      glitchCanvas.style.opacity = alpha;
      if (Math.random() > 0.3) drawGlitch();
      if (!done) requestAnimationFrame(animG);
    })(t0);

    // Scene micro-shake
    const out = currentScene === 'A' ? sceneA : sceneB;
    out.style.transition = 'none';
    await delay(30);  out.style.transform = 'translateX(2px) scaleY(1.003)';
    await delay(55);  out.style.transform = 'translateX(-2px)';
    out.style.opacity = '0.6';
    await delay(60);  out.style.transform = 'translateX(1px)';
    await delay(FLIP - 145);

    // Flip
    out.style.transition = '';
    out.style.transform  = '';
    out.style.opacity    = '';
    flipFn();

    await delay(TOTAL - FLIP);
    done = true;
    glitchCanvas.style.opacity = 0;
    gctx.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
  }

  /* ══════════════════════════════════════════════════════
     SCENE MANAGEMENT
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
    if (currentScene === 'A') {
      sceneTimer = setTimeout(switchScene, SCENE_A_MS);
    }
    // Scene B timer is driven by typing completion (no fixed timer)
  }

  /* ══════════════════════════════════════════════════════
     LINE DOM HELPERS
  ══════════════════════════════════════════════════════ */
  function createLineEl(lineNum) {
    const el   = document.createElement('div');
    el.className = 'code-line';
    const ln   = document.createElement('span');
    ln.className = 'code-ln';
    ln.textContent = lineNum;
    el.appendChild(ln);
    const body = document.createElement('span');
    body.className = 'code-body';
    el.appendChild(body);
    return { el, body };
  }

  function renderInstant(lineNum, parts) {
    const { el, body } = createLineEl(lineNum);
    for (const p of parts) {
      if (!p.t) continue;
      const s = document.createElement('span');
      if (p.c) s.className = p.c;
      s.textContent = p.t;
      body.appendChild(s);
    }
    codeLines.appendChild(el);
    return el;
  }

  /* ══════════════════════════════════════════════════════
     TYPING ANIMATION
  ══════════════════════════════════════════════════════ */
  function charDelay() { return 8 + Math.random() * 14; } // 8–22ms avg ~15ms

  function sleep(st, ms) {
    return new Promise(r => {
      if (!st.active) return r();
      st.tid = setTimeout(r, ms);
    });
  }

  function startTyping() {
    if (REDUCED) return;
    stopTyping();
    codeLines.innerHTML = '';
    codeCaret.style.display = 'inline';

    const st = { active: true, tid: null };
    typingState = st;

    // 1. Render PRE_N lines instantly (mid-session look)
    for (let i = 0; i < PRE_N && i < ALL_LINES.length; i++) {
      renderInstant(i + 1, ALL_LINES[i]);
    }
    // Put caret at end of last pre-typed line
    const lastPre = codeLines.lastElementChild;
    if (lastPre) lastPre.appendChild(codeCaret);

    // 2. Type the rest
    runTypingSession(st, PRE_N);
  }

  function stopTyping() {
    if (!typingState) return;
    typingState.active = false;
    clearTimeout(typingState.tid);
    typingState = null;
    codeLines.innerHTML = '';
    codeCaret.style.display = 'none';
  }

  async function runTypingSession(st, startIdx) {
    // Type remaining lines
    for (let i = startIdx; i < ALL_LINES.length && st.active; i++) {
      await typeLine(st, i + 1, ALL_LINES[i]);
    }
    if (!st.active) return;

    // Post-type pause
    await sleep(st, 2000);
    if (!st.active) return;

    // Clear bottom → top
    await clearAnimation(st);
    if (!st.active) return;

    // Trigger switch back to Scene A
    if (currentScene === 'B') switchScene();
  }

  async function typeLine(st, lineNum, parts) {
    const { el, body } = createLineEl(lineNum);
    codeLines.appendChild(el);
    el.appendChild(codeCaret); // move caret to this line

    if (!parts || parts.length === 0) {
      await sleep(st, 55 + Math.random() * 35);
      return;
    }

    for (const part of parts) {
      if (!st.active) return;
      if (!part.t) continue;
      const span = document.createElement('span');
      if (part.c) span.className = part.c;
      body.appendChild(span);

      for (const char of part.t) {
        if (!st.active) return;
        span.textContent += char;
        // Occasional natural pause (end of word, punctuation)
        const extra = /[,.()\s]/.test(char) && Math.random() > 0.7 ? 30 : 0;
        await sleep(st, charDelay() + extra);
      }
    }

    await sleep(st, 35 + Math.random() * 55);
  }

  async function clearAnimation(st) {
    codeCaret.style.display = 'none';
    const lines = Array.from(codeLines.querySelectorAll('.code-line'));
    // Fade out lines from bottom to top
    for (let i = lines.length - 1; i >= 0 && st.active; i--) {
      lines[i].style.transition = 'opacity 0.1s ease';
      lines[i].style.opacity    = '0';
      await sleep(st, 30);
    }
    await sleep(st, 120);
    if (!st.active) return;
    codeLines.innerHTML  = '';
    codeCaret.style.display = 'inline';
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
      sceneTimer = setTimeout(switchScene, SCENE_A_MS);
    }
  }

  // Delay until GSAP hero-load animation finishes
  setTimeout(init, 1300);
})();
