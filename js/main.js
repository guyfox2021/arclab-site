/* ============================================================
   ArcLab — main.js
   GSAP 3 + ScrollTrigger | Premium motion system
============================================================ */

gsap.registerPlugin(ScrollTrigger);

const EASE = 'power3.out';
const EASE_BACK = 'power4.out';

/* ============================================================
   PAGE LOAD SEQUENCE
============================================================ */
(function initLoad() {
  const tl = gsap.timeline({ defaults: { ease: EASE } });

  // 1. Fade in body
  tl.to('body', { opacity: 1, duration: 0.5 });

  // 2. Header slides in from top
  tl.to('.header', {
    opacity: 1,
    y: 0,
    duration: 0.7,
  }, '-=0.2');

  // 3. Hero left content — staggered reveal
  tl.to('.hero__eyebrow', {
    opacity: 1,
    y: 0,
    duration: 0.65,
  }, '-=0.35');

  tl.to('.hero__heading', {
    opacity: 1,
    y: 0,
    duration: 0.7,
  }, '-=0.5');

  tl.to('.hero__subtitle', {
    opacity: 1,
    y: 0,
    duration: 0.65,
  }, '-=0.5');

  tl.to('.hero__cta', {
    opacity: 1,
    y: 0,
    duration: 0.6,
  }, '-=0.48');

  tl.to('.hero__stats', {
    opacity: 1,
    y: 0,
    duration: 0.6,
  }, '-=0.46');

  // 4. Hero visual — fade + slide from right + blur
  tl.fromTo('.hero__visual',
    { opacity: 0, x: 40, filter: 'blur(12px)' },
    { opacity: 1, x: 0,  filter: 'blur(0px)', duration: 1.1, ease: EASE_BACK },
    '-=1.0'
  );

  // 5. Bottom bar
  tl.to('.hero__bottom', {
    opacity: 1,
    duration: 0.55,
  }, '-=0.4');
})();

/* ============================================================
   HEADER — scroll behavior
============================================================ */
const header = document.getElementById('header');

ScrollTrigger.create({
  start: 'top -64',
  onEnter:     () => header.classList.add('header--scrolled'),
  onLeaveBack: () => header.classList.remove('header--scrolled'),
});

/* ============================================================
   MOBILE BURGER MENU
============================================================ */
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ============================================================
   SCROLL REVEALS — sections
============================================================ */
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.to(el, {
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
    opacity: 1,
    y: 0,
    duration: 0.65,
    ease: EASE,
  });
});

// Stagger children inside section headers and grids
const staggerGroups = [
  { parent: '.services__grid',  children: '.service-card' },
  { parent: '.portfolio__grid', children: '.portfolio-card' },
  { parent: '.pricing__grid',   children: '.pricing-card' },
  { parent: '.about__stats',    children: '.about-stat' },
];

staggerGroups.forEach(({ parent, children }) => {
  const parentEl = document.querySelector(parent);
  if (!parentEl) return;

  // Override individual reveal so the group animates together
  const items = parentEl.querySelectorAll(children);
  items.forEach(item => {
    gsap.set(item, { opacity: 0, y: 28 });
  });

  gsap.to(items, {
    scrollTrigger: {
      trigger: parentEl,
      start: 'top 82%',
      toggleActions: 'play none none none',
    },
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: EASE,
  });
});

/* ============================================================
   MOUSE PARALLAX — Hero
============================================================ */
const heroSection = document.getElementById('home');
const heroVisual  = document.querySelector('.hero__visual');
const heroHeading = document.querySelector('.hero__heading');

if (heroSection && heroVisual && heroHeading) {
  let raf = null;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  heroSection.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = heroSection.getBoundingClientRect();
    const xRatio = (e.clientX - left) / width  - 0.5;
    const yRatio = (e.clientY - top)  / height - 0.5;
    targetX = xRatio;
    targetY = yRatio;

    if (!raf) tick();
  });

  heroSection.addEventListener('mouseleave', () => {
    gsap.to(heroHeading, { x: 0, y: 0, duration: 1.2, ease: EASE });
    gsap.to(heroVisual,  { x: 0, y: 0, duration: 1.4, ease: EASE });
    cancelAnimationFrame(raf);
    raf = null;
  });

  function tick() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    gsap.set(heroHeading, { x: currentX * 6, y: currentY * 4 });
    gsap.set(heroVisual,  { x: -currentX * 14, y: -currentY * 7 });

    raf = requestAnimationFrame(tick);
  }
}

/* ============================================================
   HERO VISUAL — floating animation
============================================================ */
const heroImg = document.querySelector('.hero__image');
if (heroImg) {
  gsap.to(heroImg, {
    y: -8,
    duration: 6,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });

  // Subtle screen flicker
  gsap.to(heroImg, {
    opacity: 0.96,
    duration: 0.08,
    ease: 'none',
    yoyo: true,
    repeat: -1,
    repeatDelay: gsap.utils.random(4, 8),
  });
}

/* ============================================================
   FOOTER — scroll reveal
============================================================ */
gsap.from('.footer', {
  scrollTrigger: {
    trigger: '.footer',
    start: 'top 92%',
  },
  opacity: 0,
  y: 20,
  duration: 0.7,
  ease: EASE,
});

/* ============================================================
   CONTACT FORM — basic submit handler
============================================================ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'Відправляємо…';
    btn.disabled = true;

    // Simulate submission (replace with real API call)
    setTimeout(() => {
      btn.innerHTML = '✓ Повідомлення надіслано';
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.color = 'rgba(255,255,255,0.7)';
      btn.style.border = '1px solid rgba(255,255,255,0.2)';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.cssText = '';
        contactForm.reset();
      }, 3500);
    }, 1200);
  });
}

/* ============================================================
   SMOOTH ANCHOR SCROLL
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============================================================
   REDUCED MOTION — respect prefers-reduced-motion
============================================================ */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(100);
}
