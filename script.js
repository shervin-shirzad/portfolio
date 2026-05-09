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

  /* ── Disable context menu on the whole item ── */
  div.addEventListener('contextmenu', (e) => e.preventDefault());

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

/* ============================================
   IMAGE PROTECTION — fetch → blob URL
   The original file URL is never exposed in
   the DOM, Network tab shows only blob: URLs
   ============================================ */

/**
 * Load a single image via fetch → blob URL.
 * The original src is consumed and never placed
 * in any DOM attribute.
 */
async function loadProtectedImage(img) {
  const originalSrc = img.dataset.src;
  if (!originalSrc) return;

  try {
    const response = await fetch(originalSrc, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    img.src = blobUrl;
    img.removeAttribute('data-src');

    // Revoke the blob URL only after image fully loads —
    // but keep the image displayed (revoking doesn't destroy
    // an already-loaded image, just prevents re-fetch from that URL)
    img.addEventListener('load', () => {
      // Small delay ensures browser has fully decoded the image
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    }, { once: true });

  } catch (err) {
    // Fallback: use original src if fetch fails (e.g. local file://)
    img.src = originalSrc;
    img.removeAttribute('data-src');
    console.warn('Protected load failed, fallback:', originalSrc, err);
  }
}

/* ── Lazy load + protect with IntersectionObserver ── */
function observePortfolioItems() {
  const lazyImgs = portfolioGrid.querySelectorAll('img[data-src]');

  const imgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadProtectedImage(entry.target);
          imgObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  lazyImgs.forEach((img) => imgObserver.observe(img));
}

/* ============================================
   DISABLE ALL IMAGE EXTRACTION VECTORS
   ============================================ */
function initImageProtection() {

  /* 1. Block right-click globally */
  document.addEventListener('contextmenu', (e) => {
    if (
      e.target.tagName === 'IMG' ||
      e.target.closest('.portfolio-item') ||
      e.target.closest('.lightbox__content')
    ) {
      e.preventDefault();
    }
  });

  /* 2. Block drag on all images */
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  /* 3. Block Ctrl+S / Cmd+S (save page) */
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl+S — Save
    if (ctrl && e.key === 's') { e.preventDefault(); return; }
    // Ctrl+U — View source
    if (ctrl && e.key === 'u') { e.preventDefault(); return; }
    // Ctrl+Shift+I / F12 — DevTools
    if ((ctrl && e.shiftKey && e.key === 'I') || e.key === 'F12') {
      e.preventDefault(); return;
    }
    // Ctrl+Shift+J — Console
    if (ctrl && e.shiftKey && e.key === 'J') { e.preventDefault(); return; }
    // Ctrl+Shift+C — Inspector
    if (ctrl && e.shiftKey && e.key === 'C') { e.preventDefault(); return; }
    // Ctrl+P — Print (can capture images)
    if (ctrl && e.key === 'p') { e.preventDefault(); return; }
  });

  /* 4. Disable text/image selection on portfolio */
  portfolioGrid.addEventListener('selectstart', (e) => e.preventDefault());

  /* 5. CSS pointer-events on images handled via stylesheet,
        but also set via JS as a belt-and-suspenders measure */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .portfolio-item img,
    .lightbox__img {
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
  `;
  document.head.appendChild(styleEl);
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

/* Lightbox close on Escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) {
    closeLightbox();
  }
});

// Prevent image interaction inside lightbox
// Image protection handled globally by initImageProtection()


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
   BACK TO TOP
   ============================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  // Show after scrolling 400px
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  handleNavScroll();
  animateHeroTitle();
  initImageProtection();
  initBackToTop();
  loadPortfolioData();

  requestAnimationFrame(() => {
    initScrollReveal();
    initActiveNavLinks();
    initParallax();
    initCustomCursor();
  });
});
