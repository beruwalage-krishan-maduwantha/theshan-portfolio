document.addEventListener('DOMContentLoaded', () => {

  // Footer copyright year
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  // ===== Social FAB toggle =====
  const socialFabToggle = document.getElementById('socialFabToggle');
  const socialFabIcons = document.getElementById('socialFabIcons');
  if (socialFabToggle && socialFabIcons) {
    socialFabToggle.addEventListener('click', () => {
      const isActive = socialFabToggle.classList.toggle('active');
      socialFabIcons.classList.toggle('active', isActive);
      socialFabToggle.setAttribute('aria-expanded', String(isActive));
      // Keep the hidden icons out of tab order until actually revealed
      socialFabIcons.querySelectorAll('.social-fab-icon').forEach((el) => {
        el.tabIndex = isActive ? 0 : -1;
      });
    });
  }

  // ===== Preloader =====
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');
  const body = document.body;

  function finishPreload() {
    preloader.classList.add('done');
    body.classList.remove('is-loading');
    revealHero();
  }

  if (preloader && preloaderCount) {
    let count = 0;
    const countTimer = setInterval(() => {
      count += Math.ceil(Math.random() * 12) + 4;
      if (count >= 100) {
        count = 100;
        preloaderCount.textContent = count;
        clearInterval(countTimer);
        setTimeout(finishPreload, 250);
        return;
      }
      preloaderCount.textContent = count;
    }, 90);
    // Safety net: never block the page longer than ~2.5s
    setTimeout(() => {
      clearInterval(countTimer);
      if (!preloader.classList.contains('done')) finishPreload();
    }, 2500);
  } else {
    revealHero();
  }

  // ===== Split-text word reveal =====
  function splitWords(el) {
    const html = el.innerHTML;
    const lines = html.split(/<br\s*\/?>/i);
    el.innerHTML = lines.map(line => {
      const words = line.trim().split(/\s+/).filter(Boolean);
      return words.map(word =>
        `<span class="split-word"><span>${word}</span></span>`
      ).join(' ');
    }).join('<br>');
  }

  const splitEls = document.querySelectorAll('.split-words');
  splitEls.forEach(el => splitWords(el));

  function revealHero() {
    const heroTitle = document.querySelector('.hero-title.split-words');
    if (heroTitle) {
      requestAnimationFrame(() => {
        setTimeout(() => heroTitle.classList.add('revealed'), 150);
      });
    }
  }

  // Scroll-triggered split-word headings (skip hero, already handled above)
  const scrollSplitEls = document.querySelectorAll('.split-words:not(.hero-title)');
  const splitIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        splitIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  scrollSplitEls.forEach(el => splitIo.observe(el));

  // ===== Animated number counters =====
  const counters = document.querySelectorAll('[data-count]');
  const counterIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterIo.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterIo.observe(el));

  // ===== Magnetic buttons =====
  const magneticEls = document.querySelectorAll('[data-magnetic]');
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!isTouchDevice) {
    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${relX * 0.35}px, ${relY * 0.45}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }


  // ===== Reveal-wipe images =====
  // Note: observe the unclipped parent, not the clip-path'd element itself —
  // Chromium computes intersection ratio against the clipped (near-zero) area,
  // so a clip-path target never crosses the visibility threshold.
  const wipeIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const thumb = entry.target.querySelector('.reveal-wipe');
        if (thumb) thumb.classList.add('revealed');
        wipeIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal-wipe').forEach(el => {
    const parent = el.closest('.project-item') || el.parentElement;
    wipeIo.observe(parent);
  });

  // Header scroll state
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const heroBg = document.getElementById('heroBg');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    backToTop.classList.toggle('show', y > 500);
    if (heroBg) {
      const shift = Math.min(y * 0.15, 80);
      heroBg.style.transform = `translateY(${shift}px) scale(1.05)`;
    }
  }, { passive: true });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Custom cursor (dot + trailing ring + hover label), disabled on touch devices
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const cursorLabel = document.getElementById('cursorLabel');
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  if (cursorDot && cursorRing && cursorLabel && !isTouch) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let currentLabelText = '';

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top = mouseY + 'px';
    });

    // The hover/labeled state is recomputed from the real cursor position
    // every frame (via elementFromPoint) rather than tracked through
    // mouseenter/mouseleave. Enter/leave events never fire on scroll — the
    // page moves under a stationary cursor — so a previous "stuck" version
    // of this left the ring frozen in its last hover/labeled state (e.g. a
    // solid orange "labeled" circle appearing to sit on top of and hide a
    // footer link after scrolling). Recomputing from scratch every frame
    // makes that class of bug structurally impossible: the ring always
    // reflects what's actually under the cursor right now.
    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';

      const target = document.elementFromPoint(mouseX, mouseY);
      const labelEl = target ? target.closest('[data-cursor]') : null;
      const hoverEl = !labelEl && target ? target.closest('a, button, .acc-header') : null;

      if (labelEl) {
        const text = labelEl.getAttribute('data-cursor');
        if (text !== currentLabelText) {
          currentLabelText = text;
          cursorLabel.textContent = text;
        }
        cursorRing.classList.add('labeled');
        cursorRing.classList.remove('hover');
        cursorDot.classList.add('hidden');
      } else if (hoverEl) {
        cursorRing.classList.add('hover');
        cursorRing.classList.remove('labeled');
        cursorDot.classList.add('hidden');
      } else {
        cursorRing.classList.remove('hover', 'labeled');
        cursorDot.classList.remove('hidden');
      }

      requestAnimationFrame(animateRing);
    }
    animateRing();
  }

  // Offcanvas menu
  const menuToggle = document.getElementById('menuToggle');
  const offcanvas = document.getElementById('offcanvas');
  const offcanvasClose = document.getElementById('offcanvasClose');
  const overlay = document.getElementById('overlay');

  function openOffcanvas() {
    offcanvas.classList.add('open');
    overlay.classList.add('open');
  }
  function closeOffcanvas() {
    offcanvas.classList.remove('open');
    overlay.classList.remove('open');
  }
  menuToggle.addEventListener('click', openOffcanvas);
  offcanvasClose.addEventListener('click', closeOffcanvas);
  overlay.addEventListener('click', closeOffcanvas);

  // Services accordion
  const accItems = document.querySelectorAll('.acc-item');
  accItems.forEach(item => {
    const header = item.querySelector('.acc-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      accItems.forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  // ===== Smooth momentum scroll (desktop only, respects reduced-motion) =====
  let smoothScrollTo = (y) => window.scrollTo({ top: y, behavior: 'smooth' });

  if (!isTouchDevice && !prefersReducedMotion) {
    const getMaxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    let current = window.scrollY;
    let target = window.scrollY;
    let looping = false;
    let programmatic = false;

    function momentumLoop() {
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        looping = false;
      }
      programmatic = true;
      window.scrollTo(0, current);
      if (looping) requestAnimationFrame(momentumLoop);
    }
    function startMomentum() {
      if (!looping) {
        looping = true;
        requestAnimationFrame(momentumLoop);
      }
    }

    window.addEventListener('wheel', (e) => {
      if (e.target.closest('.offcanvas')) return; // let internally-scrolling panels behave natively
      e.preventDefault();
      target = Math.max(0, Math.min(getMaxScroll(), target + e.deltaY));
      startMomentum();
    }, { passive: false });

    // If the user scrolls by other means (keyboard, scrollbar drag), resync
    window.addEventListener('scroll', () => {
      if (programmatic) { programmatic = false; return; }
      if (looping) return;
      target = window.scrollY;
      current = window.scrollY;
    }, { passive: true });

    smoothScrollTo = (y) => {
      target = Math.max(0, Math.min(getMaxScroll(), y));
      startMomentum();
    };

    // Route anchor-link navigation through the same easing
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const dest = document.getElementById(id);
      if (!dest) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScrollTo(dest.getBoundingClientRect().top + window.scrollY - 90);
      });
    });
  }

  // Back to top
  backToTop.addEventListener('click', () => smoothScrollTo(0));

  // Scroll reveal for sections
  const revealTargets = document.querySelectorAll('.stat-item, .project-item, .award-item, .services-head, .acc-item');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    io.observe(el);
  });

});
