/* =============================================
   SHERVIN SHIRZAD — PORTFOLIO 2023
   script.js
   ============================================= */

'use strict';

/* ── Constants ── */
const INITIAL_LOAD = 9;
const LOAD_MORE_COUNT = 6;

/* ── State ── */
let allItems = [];
let displayedCount = 0;

/* ── DOM References ── */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const portfolioGrid = document.getElementById('portfolioGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const nav = document.getElementById('nav');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxOverlay = document.getElementById('lightboxOverlay');

/* ============================================
   THEME SYSTEM
   ============================================ */
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('portfolio-theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('portfolio-theme');
  const theme = saved || getSystemTheme();
  applyTheme(theme);
}

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('portfolio-theme')) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

/* ============================================
   NAVIGATION SCROLL BEHAVIOR
   ============================================ */
function handleNavScroll() {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });

/* ============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================ */
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-up'
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Unobserve after animation to save resources
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ============================================
   PORTFOLIO — LOAD FROM data.json
   ============================================ */
async function loadPortfolioData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to load data.json');
    allItems = await response.json();
  } catch (err) {
    console.warn('Could not load data.json, using placeholder items.', err);
    // Fallback: generate placeholder items
    allItems = Array.from({ length: 15 }, (_, i) => ({
      src: `https://picsum.photos/seed/${i + 10}/800/600`,
      title: [
        'Brand Identity', 'Logo Design', 'Social Media',
        'Vector Art', 'Typography', 'Layout Design',
        'Brand Design', 'Poster Art', 'Packaging',
        'Editorial', 'Illustration', 'Visual Identity',
        'Motion Design', 'Campaign', 'Art Direction',
      ][i],
    }));
  }

  renderPortfolioItems(0, INITIAL_LOAD);
  displayedCount = Math.min(INITIAL_LOAD, allItems.length);
  updateLoadMoreBtn();
}

/* ── Build & inject portfolio items ── */
function renderPortfolioItems(start, count) {
  const slice = allItems.slice(start, start + count);

  slice.forEach((item, idx) => {
    const el = createPortfolioItem(item, idx);
    portfolioGrid.appendChild(el);

    // Stagger reveal animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.classList.add('visible');
      }, idx * 80);
    });
  });

  // Re-run scroll reveal so new items get observed
  observePortfolioItems();
}

function createPortfolioItem(item, idx) {
  const div = document.createElement('div');
  div.className = 'portfolio-item loading';
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-label', `View ${item.title || 'project'}`);
  div.style.setProperty('--i', idx);

  const img = document.createElement('img');
  img.alt = item.title || 'Portfolio project';
  img.loading = 'lazy';
  img.draggable = false;

  // Disable right-click and drag on portfolio images
  img.addEventListener('contextmenu', (e) => e.preventDefault());
  img.addEventListener('dragstart', (e) => e.preventDefault());
  img.addEventListener('mousedown', (e) => {
    if (e.button === 2) e.preventDefault();
  });

  // Lazy load via IntersectionObserver
  img.dataset.src = item.src;
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"%3E%3C/svg%3E'; // tiny placeholder

  img.addEventListener('load', () => {
    if (img.src !== img.dataset.src) return;
    div.classList.remove('loading');
  });

  img.addEventListener('error', () => {
    // If image fails, show placeholder gradient
    div.classList.remove('loading');
    div.style.background = `linear-gradient(135deg, hsl(${(idx * 47) % 360}, 30%, 20%), hsl(${(idx * 47 + 60) % 360}, 25%, 15%))`;
  });

  const overlay = document.createElement('div');
  overlay.className = 'portfolio-item__overlay';

  const title = document.createElement('span');
  title.className = 'portfolio-item__title';
  title.textContent = item.title || '';
  overlay.appendChild(title);

  div.appendChild(img);
  div.appendChild(overlay);

  // Click to open lightbox
  div.addEventListener('click', () => openLightbox(img.src, item.title));
  div.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(img.src, item.title);
    }
  });

  // Disable context menu on the whole item
  div.addEventListener('contextmenu', (e) => e.preventDefault());

  return div;
}

/* ── Lazy load images with IntersectionObserver ── */
function observePortfolioItems() {
  const lazyImgs = portfolioGrid.querySelectorAll('img[data-src]');

  const imgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imgObserver.unobserve(img);
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  lazyImgs.forEach((img) => imgObserver.observe(img));
}

/* ── Load More ── */
loadMoreBtn.addEventListener('click', () => {
  const start = displayedCount;
  const remaining = allItems.length - displayedCount;
  const toLoad = Math.min(LOAD_MORE_COUNT, remaining);

  if (toLoad <= 0) return;

  renderPortfolioItems(start, toLoad);
  displayedCount += toLoad;
  updateLoadMoreBtn();
});

function updateLoadMoreBtn() {
  if (displayedCount >= allItems.length) {
    loadMoreBtn.textContent = 'All projects loaded';
    loadMoreBtn.disabled = true;
  } else {
    const remaining = allItems.length - displayedCount;
    loadMoreBtn.textContent = `Load More (${remaining} remaining)`;
    loadMoreBtn.disabled = false;
  }
}

/* ============================================
   LIGHTBOX
   ============================================ */
function openLightbox(src, title) {
  lightboxImg.src = src;
  lightboxImg.alt = title || '';
  lightboxCaption.textContent = title || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Focus close button for accessibility
  setTimeout(() => lightboxClose.focus(), 50);
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';

  // Clear src after animation
  setTimeout(() => {
    lightboxImg.src = '';
    lightboxImg.alt = '';
    lightboxCaption.textContent = '';
  }, 400);
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', closeLightbox);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) {
    closeLightbox();
  }
});

// Prevent image interaction inside lightbox
lightboxImg.addEventListener('contextmenu', (e) => e.preventDefault());
lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

/* ============================================
   DISABLE GLOBAL TEXT SELECTION ON PORTFOLIO
   ============================================ */
portfolioGrid.addEventListener('selectstart', (e) => e.preventDefault());

/* ============================================
   SMOOTH NAV LINK ACTIVE STATE
   ============================================ */
function initActiveNavLinks() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

/* ============================================
   HERO PARALLAX (subtle)
   ============================================ */
function initParallax() {
  const heroBg = document.querySelector('.hero__bg-gradient');
  const heroBadge = document.querySelector('.hero__badge');
  if (!heroBg) return;

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        const factor = y * 0.3;
        heroBg.style.transform = `translateY(${factor}px)`;
        if (heroBadge) heroBadge.style.transform = `translateY(${y * 0.15}px)`;
      }
    },
    { passive: true }
  );
}

/* ============================================
   CURSOR CUSTOM EFFECT (desktop only)
   ============================================ */
function initCustomCursor() {
  if (window.innerWidth < 900) return;

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
  document.body.appendChild(cursor);

  // Inject cursor CSS dynamically
  const style = document.createElement('style');
  style.textContent = `
    .custom-cursor {
      position: fixed;
      top: 0; left: 0;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: difference;
    }
    .cursor-dot {
      position: absolute;
      width: 6px; height: 6px;
      background: #fff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease;
    }
    .cursor-ring {
      position: absolute;
      width: 36px; height: 36px;
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), width 0.3s ease, height 0.3s ease, opacity 0.2s ease;
    }
    body:has(.portfolio-item:hover) .cursor-ring,
    body:has(.contact-link:hover) .cursor-ring {
      width: 60px; height: 60px;
      opacity: 0.7;
    }
  `;
  document.head.appendChild(style);

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
}

/* ============================================
   HERO TITLE LETTER ANIMATION
   ============================================ */
function animateHeroTitle() {
  const title = document.querySelector('.hero__title');
  if (!title) return;

  const text = title.textContent;
  title.textContent = '';
  title.style.opacity = '1';
  title.style.transform = 'none';

  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.cssText = `
      display: inline-block;
      opacity: 0;
      transform: translateY(60px) rotate(${(Math.random() - 0.5) * 8}deg);
      transition: opacity 0.6s ease ${0.05 + i * 0.04}s,
                  transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.04}s;
    `;
    title.appendChild(span);
  });

  // Trigger after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      title.querySelectorAll('span').forEach((span) => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0) rotate(0deg)';
      });
    });
  });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  handleNavScroll();
  animateHeroTitle();
  loadPortfolioData();

  // Defer non-critical inits
  requestAnimationFrame(() => {
    initScrollReveal();
    initActiveNavLinks();
    initParallax();
    initCustomCursor();
  });
});
