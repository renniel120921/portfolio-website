/**
 * Apple HIG-Inspired Portfolio Application Logic
 * Human-Centered Systems Lab (Renz.dev)
 * 7-Route Architecture, Legacy Aliases, OverlayManager, Spotlight AI, Case Studies & Chatbot
 */

(function () {
  'use strict';

  // 7 Primary Navigation Sections
  const VALID_SECTIONS = [
    'home',
    'work',
    'lab',
    'services',
    'journey',
    'about',
    'contact'
  ];

  // Legacy Hash Aliases mapped to 7 primary destinations
  const LEGACY_HASH_MAP = {
    projects: 'work',
    gallery: 'work',
    stack: 'lab',
    credentials: 'journey',
    experience: 'journey',
    testimonials: 'journey'
  };

  const SECTION_TITLES = {
    home: 'Home',
    work: 'Work & Systems',
    lab: 'Systems Lab',
    services: 'Services',
    journey: 'Engineering Journey',
    about: 'About Me',
    contact: 'Contact & Inquiries'
  };

  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.querySelector('.sidebar-nav');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const navLinks = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');

  // Lightbox Elements
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');

  // Chat Elements
  const chatBtn = document.getElementById('chat-btn');
  const chatWin = document.getElementById('chat-win');
  const chatClose = document.getElementById('chat-close');
  const chatReset = document.getElementById('chat-reset');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMsgs = document.getElementById('chat-msgs');
  const chatCharCount = document.getElementById('chat-char-count');

  // Check Reduced Motion
  function isReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ==========================================================================
     PRIVACY-FRIENDLY EVENT DISPATCHER (Vercel Web Analytics Safe Wrapper)
     ========================================================================== */
  window.trackEvent = function (name, data) {
    try {
      if (typeof window.va === 'function') {
        window.va('event', { name, ...data });
      }
    } catch (_) {
      // Safe no-op on free tier or local development
    }
  };

  /* ==========================================================================
     1. GLIDING NAV INDICATOR (Selection Capsule)
     ========================================================================== */

  let navIndicator = document.querySelector('.nav-indicator');
  if (!navIndicator && sidebarNav) {
    navIndicator = document.createElement('div');
    navIndicator.className = 'nav-indicator';
    sidebarNav.prepend(navIndicator);
  }

  function updateNavIndicator(activeLink) {
    if (!navIndicator || !sidebarNav) return;

    const currentLink = activeLink || sidebarNav.querySelector('.nav-item.active');
    if (!currentLink) {
      navIndicator.style.opacity = '0';
      return;
    }

    const navRect = sidebarNav.getBoundingClientRect();
    const linkRect = currentLink.getBoundingClientRect();

    const topPos = linkRect.top - navRect.top + sidebarNav.scrollTop;
    const height = linkRect.height;

    navIndicator.style.transform = `translateY(${topPos}px)`;
    navIndicator.style.height = `${height}px`;
    navIndicator.style.opacity = '1';
  }

  // Debounced/rAF Resize Listener
  let resizeTimer = null;
  let lastViewportWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(function () {
      const currentWidth = window.innerWidth;
      if (typeof syncSidebarResponsive === 'function') {
        if ((lastViewportWidth <= 768 && currentWidth > 768) ||
            (lastViewportWidth > 768 && currentWidth <= 768) ||
            (lastViewportWidth <= 1024 && currentWidth > 1024) ||
            (lastViewportWidth > 1024 && currentWidth <= 1024)) {
          syncSidebarResponsive();
        }
      }
      lastViewportWidth = currentWidth;
      updateNavIndicator();
    });
  });

  /* ==========================================================================
     2. NAVIGATION & SECTION TRANSITIONS (7 Routes + 6 Legacy Aliases)
     ========================================================================== */

  function getActiveHash() {
    const raw = window.location.hash.replace(/^#/, '').toLowerCase().trim();
    if (LEGACY_HASH_MAP[raw]) {
      return LEGACY_HASH_MAP[raw];
    }
    return VALID_SECTIONS.includes(raw) ? raw : 'home';
  }

  let activeViewTransition = null;
  let renderedRoute = null;
  let requestedRoute = null;

  function applySectionDOM(targetId) {
    let targetSection = null;

    // Toggle Content Sections (guaranteed single active section)
    contentSections.forEach(section => {
      if (section.id === targetId) {
        section.classList.add('active');
        targetSection = section;
      } else {
        section.classList.remove('active');
      }
    });

    // Update Sidebar Navigation States
    let activeLink = null;
    navLinks.forEach(link => {
      const linkHash = (link.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
      if (linkHash === targetId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        activeLink = link;
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Animate Selection Capsule
    updateNavIndicator(activeLink);

    // Update Document Title
    const label = SECTION_TITLES[targetId] || 'Systems Lab';
    document.title = `${label} — Renz.dev | Human-Centered Systems Lab`;

    // Scroll to Top
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Focus Target Section for Accessibility
    if (targetSection) {
      targetSection.setAttribute('tabindex', '-1');
      targetSection.focus({ preventScroll: true });
    }

    // Close Mobile Sidebar if open
    closeMobileSidebar();
  }

  function renderRoute(targetId) {
    const validTarget = VALID_SECTIONS.includes(targetId) ? targetId : 'home';
    if (validTarget === requestedRoute) return;

    requestedRoute = validTarget;

    let domUpdated = false;
    const updateDOM = () => {
      if (domUpdated) return;
      domUpdated = true;
      applySectionDOM(validTarget);
      renderedRoute = validTarget;
    };

    const reducedMotion = isReducedMotion();

    if (!document.startViewTransition || reducedMotion) {
      updateDOM();
      return;
    }

    try {
      activeViewTransition?.skipTransition?.();
    } catch (error) {
      if (
        error?.name !== 'AbortError' &&
        !(error?.name === 'InvalidStateError' && error?.message?.includes('aborted'))
      ) {
        console.error('Failed to skip previous view transition:', error);
      }
    }

    let vt;
    try {
      vt = document.startViewTransition(updateDOM);
      activeViewTransition = vt;
    } catch (error) {
      updateDOM();
      return;
    }

    vt.updateCallbackDone.catch(() => {
      updateDOM();
    });

    Promise.allSettled([
      vt.ready,
      vt.updateCallbackDone,
      vt.finished
    ]).then((results) => {
      for (const result of results) {
        if (
          result.status === 'rejected' &&
          result.reason?.name !== 'AbortError' &&
          !(result.reason?.name === 'InvalidStateError' && result.reason?.message?.includes('aborted'))
        ) {
          console.error('View transition failed:', result.reason);
        }
      }
    }).finally(() => {
      if (activeViewTransition === vt) {
        activeViewTransition = null;
      }
      updateDOM();
    });
  }

  function handleHashRoute() {
    renderRoute(getActiveHash());
  }

  // Intercept Navigation Link Clicks (Hashchange is the single authoritative trigger)
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href === '#' || !href) return;

    const rawTarget = href.replace(/^#/, '').toLowerCase().trim();
    const targetSection = LEGACY_HASH_MAP[rawTarget] || rawTarget;
    if (VALID_SECTIONS.includes(targetSection)) {
      e.preventDefault();
      const currentHash = window.location.hash.replace(/^#/, '').toLowerCase().trim();
      if (currentHash === targetSection) {
        return;
      }
      window.location.hash = targetSection;
    }
  });

  window.addEventListener('hashchange', handleHashRoute);

  /* ==========================================================================
     3. OVERLAY MANAGER (Centralized Focus Trap, Scroll Locking & Escape Stack)
     ========================================================================== */

  const OverlayManager = (function () {
    const stack = [];

    function open(overlayEl, initialFocusEl, triggerEl) {
      if (!overlayEl || stack.some(item => item.el === overlayEl)) return;

      const trigger = triggerEl || document.activeElement;
      stack.push({
        el: overlayEl,
        trigger: trigger
      });

      overlayEl.classList.add('active');
      overlayEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const focusTarget = initialFocusEl || overlayEl.querySelector('input, button, [tabindex="0"]');
      if (focusTarget) {
        requestAnimationFrame(() => {
          focusTarget.focus();
        });
      }
    }

    function close(overlayEl) {
      let index = -1;
      if (overlayEl) {
        index = stack.findIndex(item => item.el === overlayEl);
      } else if (stack.length > 0) {
        index = stack.length - 1;
      }

      if (index === -1) return;

      const item = stack.splice(index, 1)[0];
      item.el.classList.remove('active');
      item.el.setAttribute('aria-hidden', 'true');

      if (stack.length === 0) {
        document.body.style.overflow = '';
      }

      if (item.trigger && typeof item.trigger.focus === 'function') {
        item.trigger.focus();
      }
    }

    function closeTop() {
      if (stack.length > 0) {
        close(stack[stack.length - 1].el);
      }
    }

    function getTop() {
      return stack.length > 0 ? stack[stack.length - 1] : null;
    }

    // Global Key Listener for Overlays
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (stack.length > 0) {
          e.preventDefault();
          closeTop();
          return;
        }
        if (lightbox && lightbox.classList.contains('active')) {
          window.closeLightbox();
        }
        if (sidebar && sidebar.classList.contains('open')) {
          closeMobileSidebar();
        }
        if (chatWin && chatWin.classList.contains('active')) {
          toggleChat(false);
        }
        return;
      }

      if (e.key === 'Tab' && stack.length > 0) {
        const current = getTop();
        if (!current) return;
        const focusables = current.el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    return {
      open,
      close,
      closeTop,
      getTop
    };
  })();

  /* ==========================================================================
     4. SPOTLIGHT AI NAVIGATOR (Command Palette)
     ========================================================================== */

  function initSpotlight() {
    const spotlightModal = document.getElementById('spotlight-modal');
    const spotlightOpenBtn = document.getElementById('spotlight-open-btn');
    const spotlightCloseBtn = document.getElementById('spotlight-close-btn');
    const spotlightInput = document.getElementById('spotlight-search');
    const spotlightResults = document.getElementById('spotlight-results');

    if (!spotlightModal || !spotlightInput) return;

    function openSpotlight(triggerEl) {
      spotlightInput.value = '';
      filterSpotlightItems('');
      OverlayManager.open(spotlightModal, spotlightInput, triggerEl || spotlightOpenBtn);
      window.trackEvent('spotlight_opened', { source: triggerEl ? 'button' : 'shortcut' });
    }

    function closeSpotlight() {
      OverlayManager.close(spotlightModal);
    }

    if (spotlightOpenBtn) {
      spotlightOpenBtn.addEventListener('click', function () {
        openSpotlight(spotlightOpenBtn);
      });
    }

    if (spotlightCloseBtn) {
      spotlightCloseBtn.addEventListener('click', closeSpotlight);
    }

    spotlightModal.addEventListener('click', function (e) {
      if (e.target === spotlightModal) {
        closeSpotlight();
      }
    });

    // Keyboard shortcut listener: Command+K / Ctrl+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditable = document.activeElement && (document.activeElement.isContentEditable || activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select');

        // Typing safety guard: ignore if typing inside another form input
        if (isEditable && document.activeElement !== spotlightInput) {
          return;
        }

        e.preventDefault();
        if (spotlightModal.classList.contains('active')) {
          closeSpotlight();
        } else {
          openSpotlight();
        }
      }
    });

    function filterSpotlightItems(query) {
      const q = (query || '').toLowerCase().trim();
      const items = spotlightResults.querySelectorAll('.spotlight-item');
      const groups = spotlightResults.querySelectorAll('.spotlight-group-label');

      items.forEach(item => {
        const title = (item.getAttribute('data-title') || item.textContent || '').toLowerCase();
        const desc = (item.getAttribute('data-desc') || '').toLowerCase();
        if (!q || title.includes(q) || desc.includes(q)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });

      groups.forEach(group => {
        let next = group.nextElementSibling;
        let hasVisible = false;
        while (next && !next.classList.contains('spotlight-group-label')) {
          if (next.classList.contains('spotlight-item') && next.style.display !== 'none') {
            hasVisible = true;
            break;
          }
          next = next.nextElementSibling;
        }
        group.style.display = hasVisible ? 'block' : 'none';
      });
    }

    spotlightInput.addEventListener('input', function () {
      filterSpotlightItems(spotlightInput.value);
    });

    spotlightInput.addEventListener('keydown', function (e) {
      const visibleItems = Array.from(spotlightResults.querySelectorAll('.spotlight-item')).filter(el => el.style.display !== 'none');
      if (visibleItems.length === 0) return;

      const currentIndex = visibleItems.findIndex(el => el.classList.contains('selected'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % visibleItems.length;
        visibleItems.forEach(el => el.classList.remove('selected'));
        visibleItems[nextIndex].classList.add('selected');
        visibleItems[nextIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        visibleItems.forEach(el => el.classList.remove('selected'));
        visibleItems[prevIndex].classList.add('selected');
        visibleItems[prevIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = visibleItems.find(el => el.classList.contains('selected')) || visibleItems[0];
        if (selected) {
          selected.click();
        } else if (spotlightInput.value.trim()) {
          submitChatQuery(spotlightInput.value.trim(), 'spotlight');
          closeSpotlight();
        }
      }
    });

    spotlightResults.addEventListener('click', function (e) {
      const item = e.target.closest('.spotlight-item');
      if (!item) return;

      if (item.id === 'spotlight-ask-ai-btn') {
        e.preventDefault();
        closeSpotlight();
        const query = spotlightInput.value.trim();
        submitChatQuery(query || '', 'spotlight');
        return;
      }

      if (item.classList.contains('case-study-trigger')) {
        e.preventDefault();
        const caseId = item.getAttribute('data-case');
        closeSpotlight();
        openCaseStudy(caseId, item);
        return;
      }

      const href = item.getAttribute('href');
      if (href && href.startsWith('#')) {
        closeSpotlight();
      }
    });
  }

  /* ==========================================================================
     5. CASE STUDY SHEETS (Likha Apps & Tipid App)
     ========================================================================== */

  function openCaseStudy(caseId, triggerEl) {
    const sheetId = `case-study-${caseId}`;
    const sheet = document.getElementById(sheetId);
    if (!sheet) return;
    OverlayManager.open(sheet, sheet.querySelector('.sheet-close-btn'), triggerEl);
    window.trackEvent('case_study_opened', { project: caseId });
  }

  function initCaseStudies() {
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('.case-study-trigger');
      if (trigger) {
        e.preventDefault();
        const caseId = trigger.getAttribute('data-case');
        if (caseId) {
          openCaseStudy(caseId, trigger);
        }
        return;
      }

      const closeBtn = e.target.closest('.sheet-close-btn');
      if (closeBtn) {
        const sheet = closeBtn.closest('.sheet-overlay');
        if (sheet) {
          OverlayManager.close(sheet);
        }
        return;
      }

      if (e.target.classList.contains('sheet-overlay')) {
        OverlayManager.close(e.target);
      }
    });
  }

  /* ==========================================================================
     6. WORK ARCHIVE FILTERS & PAGINATION
     ========================================================================== */

  function initProjectArchive() {
    const filterButtons = document.querySelectorAll('.archive-filter-btn');
    const archiveGrid = document.getElementById('project-archive-grid');
    const moreBtn = document.getElementById('archive-more-btn');
    const countBadge = document.getElementById('archive-count-badge');

    if (!archiveGrid) return;
    const allCards = Array.from(archiveGrid.querySelectorAll('.archive-item'));

    let currentFilter = 'all';
    let isExpanded = false;

    function applyFilterAndPagination() {
      let matchingCards = [];

      allCards.forEach(card => {
        const categories = (card.getAttribute('data-categories') || '').split(' ');
        const matches = currentFilter === 'all' || categories.includes(currentFilter);
        if (matches) {
          matchingCards.push(card);
        } else {
          card.classList.add('hidden');
        }
      });

      const limit = (currentFilter === 'all' && !isExpanded) ? 6 : matchingCards.length;

      matchingCards.forEach((card, index) => {
        if (index < limit) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      const visibleCount = Math.min(limit, matchingCards.length);
      if (countBadge) {
        countBadge.textContent = `Showing ${visibleCount} of ${matchingCards.length} Projects`;
      }

      if (moreBtn) {
        const moreContainer = moreBtn.parentElement;
        if (currentFilter === 'all' && !isExpanded && matchingCards.length > 6) {
          moreContainer.style.display = 'flex';
          moreBtn.innerHTML = '<span>Show More Projects</span> <i class="fa-solid fa-chevron-down"></i>';
        } else if (currentFilter === 'all' && isExpanded && matchingCards.length > 6) {
          moreContainer.style.display = 'flex';
          moreBtn.innerHTML = '<span>Show Less Projects</span> <i class="fa-solid fa-chevron-up"></i>';
        } else {
          moreContainer.style.display = 'none';
        }
      }
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        filterButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        applyFilterAndPagination();
        window.trackEvent('archive_filtered', { category: currentFilter });
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        isExpanded = !isExpanded;
        applyFilterAndPagination();
        window.trackEvent('archive_expansion_toggled', { expanded: isExpanded });
      });
    }

    applyFilterAndPagination();
  }

  /* ==========================================================================
     7. MOBILE SIDEBAR DRAWER
     ========================================================================== */

  function openMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      updateNavIndicator();
    });
  }

  function closeMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  /* ==========================================================================
     8. COLLAPSIBLE DESKTOP SIDEBAR & FLOATING ACCESSIBLE TOOLTIPS
     ========================================================================== */

  const STORAGE_KEY_SIDEBAR = 'portfolio.sidebarCollapsed';

  function getStoredSidebarPreference() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_SIDEBAR);
      if (val === 'true') return true;
      if (val === 'false') return false;
      return null;
    } catch (e) {
      return null;
    }
  }

  function setStoredSidebarPreference(val) {
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(val));
    } catch (e) {
      // Safe fallback if localStorage is blocked
    }
  }

  let sidebarTooltip = document.querySelector('.sidebar-tooltip');
  if (!sidebarTooltip) {
    sidebarTooltip = document.createElement('div');
    sidebarTooltip.className = 'sidebar-tooltip';
    sidebarTooltip.setAttribute('role', 'tooltip');
    sidebarTooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sidebarTooltip);
  }

  function showSidebarTooltip(item) {
    if (!sidebarTooltip || !document.body.classList.contains('sidebar-collapsed') || window.innerWidth <= 768) {
      return;
    }
    const tipText = item.getAttribute('data-tooltip') || item.querySelector('.nav-label')?.textContent?.trim();
    if (!tipText) return;

    sidebarTooltip.textContent = tipText;
    const rect = item.getBoundingClientRect();
    const tipHeight = sidebarTooltip.offsetHeight || 28;
    const topPos = rect.top + (rect.height - tipHeight) / 2;
    const leftPos = rect.right + 12;

    sidebarTooltip.style.top = `${topPos}px`;
    sidebarTooltip.style.left = `${leftPos}px`;
    sidebarTooltip.classList.add('visible');
    sidebarTooltip.setAttribute('aria-hidden', 'false');
  }

  function hideSidebarTooltip() {
    if (!sidebarTooltip) return;
    sidebarTooltip.classList.remove('visible');
    sidebarTooltip.setAttribute('aria-hidden', 'true');
  }

  function applySidebarState(collapsed, saveToStorage) {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
      if (sidebar) sidebar.classList.add('collapsed');
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute('aria-expanded', 'false');
        sidebarToggleBtn.setAttribute('aria-label', 'Expand sidebar');
        sidebarToggleBtn.setAttribute('title', 'Expand sidebar');
      }
    } else {
      document.body.classList.remove('sidebar-collapsed');
      if (sidebar) sidebar.classList.remove('collapsed');
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute('aria-expanded', 'true');
        sidebarToggleBtn.setAttribute('aria-label', 'Collapse sidebar');
        sidebarToggleBtn.setAttribute('title', 'Collapse sidebar');
      }
    }

    if (saveToStorage) {
      setStoredSidebarPreference(collapsed);
    }

    hideSidebarTooltip();

    setTimeout(function () {
      updateNavIndicator();
    }, 280);
  }

  function syncSidebarResponsive() {
    const width = window.innerWidth;
    if (width <= 768) {
      document.body.classList.remove('sidebar-collapsed');
      if (sidebar) sidebar.classList.remove('collapsed');
      hideSidebarTooltip();
    } else if (width <= 1024) {
      const pref = getStoredSidebarPreference();
      if (pref !== null) {
        applySidebarState(pref, false);
      } else {
        applySidebarState(true, false);
      }
    } else {
      const pref = getStoredSidebarPreference();
      if (pref !== null) {
        applySidebarState(pref, false);
      } else {
        applySidebarState(false, false);
      }
    }
    updateNavIndicator();
  }

  function initSidebarCollapse() {
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', function () {
        const isCurrentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
        applySidebarState(!isCurrentlyCollapsed, true);
      });
    }

    if (sidebar) {
      sidebar.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'width' || e.propertyName === 'transform') {
          updateNavIndicator();
        }
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('mouseenter', function () {
        showSidebarTooltip(link);
      });
      link.addEventListener('focus', function () {
        showSidebarTooltip(link);
      });
      link.addEventListener('mouseleave', hideSidebarTooltip);
      link.addEventListener('blur', hideSidebarTooltip);
      link.addEventListener('click', hideSidebarTooltip);
    });

    syncSidebarResponsive();
  }

  /* ==========================================================================
     9. ACCESSIBLE LIGHTBOX
     ========================================================================== */

  window.openLightbox = function (src, alt) {
    if (!lightbox || !lbImg) return;
    lbImg.src = src;
    lbImg.alt = alt || 'Preview Image';
    if (lbCaption) lbCaption.textContent = alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.trackEvent('lightbox_opened', { image: src });
  };

  window.closeLightbox = function () {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    if (lbImg) lbImg.src = '';
    document.body.style.overflow = '';
  };

  if (lbClose) {
    lbClose.addEventListener('click', window.closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        window.closeLightbox();
      }
    });
  }

  /* ==========================================================================
     10. AI CHATBOT INTEGRATION (Single Authoritative Backend)
     ========================================================================== */

  const BACKEND_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://portfolio-website-iyv7.onrender.com';
  const API_ENDPOINT = `${BACKEND_BASE_URL}/api/chat`;
  const HEALTH_ENDPOINT = `${BACKEND_BASE_URL}/api/health`;

  let chatHistory = [];
  let isSubmitting = false;
  let activeAbortController = null;
  let healthCheckActive = false;

  const chatStatusEl = document.getElementById('chat-header-status') || document.querySelector('.chat-header-status');

  function setChatStatus(state) {
    if (!chatStatusEl) return;
    chatStatusEl.classList.remove('status-online', 'status-connecting', 'status-starting', 'status-unavailable');

    switch (state) {
      case 'online':
        chatStatusEl.textContent = 'Online · Ready';
        chatStatusEl.classList.add('status-online');
        break;
      case 'starting':
        chatStatusEl.textContent = 'Starting assistant…';
        chatStatusEl.classList.add('status-starting');
        break;
      case 'unavailable':
        chatStatusEl.textContent = 'Temporarily unavailable';
        chatStatusEl.classList.add('status-unavailable');
        break;
      case 'connecting':
      default:
        chatStatusEl.textContent = 'Connecting…';
        chatStatusEl.classList.add('status-connecting');
        break;
    }
  }

  async function checkBackendHealth() {
    if (healthCheckActive) return;
    healthCheckActive = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.status === 'ok') {
          setChatStatus('online');
          return;
        }
      }
      if (res.status === 502 || res.status === 503) {
        setChatStatus('starting');
      } else {
        setChatStatus('unavailable');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setChatStatus('starting');
      } else {
        setChatStatus('unavailable');
      }
    } finally {
      healthCheckActive = false;
    }
  }

  function toggleChat(forceState) {
    if (!chatWin) return;
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !chatWin.classList.contains('active');
    if (shouldOpen) {
      chatWin.classList.add('active');
      if (chatInput) chatInput.focus();
      if (!chatStatusEl || !chatStatusEl.classList.contains('status-online')) {
        checkBackendHealth();
      }
      window.trackEvent('chat_opened');
    } else {
      chatWin.classList.remove('active');
    }
  }

  // Single-source Natural Language Question Handoff (Spotlight -> Authoritative AI)
  function submitChatQuery(userText, source = 'standard') {
    toggleChat(true);
    if (userText) {
      handleSendMessage(userText);
      window.trackEvent('ai_query_submitted', { source });
    }
  }

  if (chatBtn) {
    chatBtn.addEventListener('click', () => toggleChat());
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => toggleChat(false));
  }

  function formatSafeContent(container, rawText) {
    const lines = (rawText || '').split('\n');
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        container.appendChild(document.createElement('br'));
      }

      const tokenRegex = /(https?:\/\/[^\s)]+)|(#[a-zA-Z0-9_-]+)/g;
      let lastIdx = 0;
      let match;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          container.appendChild(document.createTextNode(line.substring(lastIdx, match.index)));
        }

        const token = match[0];
        if (token.startsWith('#')) {
          const rawHash = token.replace('#', '').toLowerCase();
          const targetRoute = LEGACY_HASH_MAP[rawHash] || rawHash;
          const link = document.createElement('a');
          link.href = `#${targetRoute}`;
          link.className = 'chat-link';
          link.textContent = token;
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = targetRoute;
            if (window.innerWidth <= 768) {
              toggleChat(false);
            }
          });
          container.appendChild(link);
        } else {
          const link = document.createElement('a');
          link.href = token;
          link.className = 'chat-link';
          link.textContent = token;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          container.appendChild(link);
        }
        lastIdx = match.index + token.length;
      }

      if (lastIdx < line.length) {
        container.appendChild(document.createTextNode(line.substring(lastIdx)));
      }
    });
  }

  function appendChatMessage(role, text, isError = false, onRetry = null) {
    if (!chatMsgs) return null;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (role === 'user') {
      bubble.textContent = text;
    } else {
      formatSafeContent(bubble, text);
    }

    if (isError && typeof onRetry === 'function') {
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'chat-retry-btn';
      retryBtn.setAttribute('aria-label', 'Retry asking question');
      retryBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry question';
      retryBtn.addEventListener('click', () => {
        retryBtn.remove();
        onRetry();
      });
      bubble.appendChild(retryBtn);
    }

    msgDiv.appendChild(bubble);
    chatMsgs.appendChild(msgDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return msgDiv;
  }

  function createTypingIndicator(customText) {
    if (!chatMsgs) return null;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg ai';
    typingDiv.id = 'chat-typing-bubble';

    const indicator = document.createElement('div');
    indicator.className = 'chat-typing-indicator';

    if (customText) {
      const textSpan = document.createElement('span');
      textSpan.className = 'chat-typing-text';
      textSpan.textContent = customText;
      textSpan.style.fontSize = '0.82rem';
      textSpan.style.marginRight = '6px';
      indicator.appendChild(textSpan);
    }

    const dot1 = document.createElement('span');
    dot1.className = 'chat-typing-dot';
    const dot2 = document.createElement('span');
    dot2.className = 'chat-typing-dot';
    const dot3 = document.createElement('span');
    dot3.className = 'chat-typing-dot';

    indicator.appendChild(dot1);
    indicator.appendChild(dot2);
    indicator.appendChild(dot3);

    typingDiv.appendChild(indicator);
    chatMsgs.appendChild(typingDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-bubble');
    if (indicator) indicator.remove();
  }

  function updateCharCounter() {
    if (!chatCharCount || !chatInput) return;
    const len = chatInput.value.length;
    chatCharCount.textContent = `${len}/500`;
    if (len >= 350) {
      chatCharCount.classList.add('visible');
    } else {
      chatCharCount.classList.remove('visible');
    }
  }

  if (chatInput) {
    chatInput.addEventListener('input', updateCharCounter);
  }

  async function handleSendMessage(rawText) {
    if (isSubmitting) return;
    const userText = (rawText || '').trim();
    if (!userText) return;

    if (userText.length > 500) {
      appendChatMessage('ai', 'Your question exceeds the 500 character limit. Please shorten your question.');
      return;
    }

    isSubmitting = true;
    if (chatInput) {
      chatInput.value = '';
      chatInput.disabled = true;
    }
    if (chatSendBtn) chatSendBtn.disabled = true;
    updateCharCounter();

    appendChatMessage('user', userText);
    createTypingIndicator();

    const coldStartTimer = setTimeout(() => {
      if (isSubmitting) {
        setChatStatus('starting');
        removeTypingIndicator();
        createTypingIndicator('Starting assistant…');
      }
    }, 5000);

    activeAbortController = new AbortController();
    const timeoutId = setTimeout(() => {
      if (activeAbortController) {
        activeAbortController.abort();
      }
    }, 45000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: chatHistory.slice(-6)
        }),
        signal: activeAbortController.signal
      });

      clearTimeout(timeoutId);
      clearTimeout(coldStartTimer);
      removeTypingIndicator();

      if (!response.ok) {
        let errMessage = "I'm processing... please try again in a moment.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMessage = errData.error;
          }
        } catch (_) {}

        if (response.status === 429) {
          setChatStatus('online');
          appendChatMessage('ai', errMessage || 'Request limit reached. Please wait a moment before sending another message.', true, () => handleSendMessage(userText));
          return;
        }

        if (response.status === 502 || response.status === 503 || response.status === 504) {
          setChatStatus('starting');
          appendChatMessage('ai', 'Starting the assistant. This may take a moment… Please retry in a few seconds.', true, () => handleSendMessage(userText));
          return;
        }

        setChatStatus('unavailable');
        appendChatMessage('ai', errMessage, true, () => handleSendMessage(userText));
        return;
      }

      const data = await response.json().catch(() => null);
      if (data && typeof data.text === 'string' && data.text) {
        setChatStatus('online');
        appendChatMessage('ai', data.text);
        chatHistory.push({ role: 'user', parts: [{ text: userText }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.text }] });
      } else {
        appendChatMessage('ai', "I'm processing your request. Please try asking again.", true, () => handleSendMessage(userText));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      clearTimeout(coldStartTimer);
      removeTypingIndicator();

      if (err.name === 'AbortError') {
        setChatStatus('unavailable');
        appendChatMessage('ai', 'Request timed out after waiting for the assistant to respond. Please try asking again.', true, () => handleSendMessage(userText));
      } else {
        setChatStatus('unavailable');
        appendChatMessage('ai', 'Unable to reach the assistant right now. You can retry or email rennielsalazar948@gmail.com directly.', true, () => handleSendMessage(userText));
      }
    } finally {
      isSubmitting = false;
      activeAbortController = null;
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.focus();
      }
      if (chatSendBtn) chatSendBtn.disabled = false;
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!chatInput) return;
      handleSendMessage(chatInput.value);
    });
  }

  const chipButtons = document.querySelectorAll('.chat-chip');
  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (isSubmitting) return;
      const query = chip.getAttribute('data-query');
      if (query) {
        handleSendMessage(query);
      }
    });

    chip.addEventListener('focus', () => {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  });

  if (chatReset) {
    chatReset.addEventListener('click', () => {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      removeTypingIndicator();
      isSubmitting = false;
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.value = '';
      }
      if (chatSendBtn) chatSendBtn.disabled = false;
      updateCharCounter();

      chatHistory = [];
      if (chatMsgs) {
        const firstBubble = chatMsgs.querySelector('.chat-msg.ai');
        chatMsgs.innerHTML = '';
        if (firstBubble) {
          chatMsgs.appendChild(firstBubble);
        } else {
          appendChatMessage('ai', "Hi! I'm Renniel's AI portfolio assistant. Ask me about his current work at City Health Office (CHO), featured projects like Likha Apps & Tipid App, tech stack, or services at EasyWeb PH!");
        }
      }
    });
  }

  /* ==========================================================================
     11. ACCESSIBLE FAQ ACCORDION
     ========================================================================== */

  function initFAQ() {
    const faqButtons = document.querySelectorAll('.faq-trigger');
    faqButtons.forEach(button => {
      button.addEventListener('click', function () {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const contentId = button.getAttribute('aria-controls');
        const content = document.getElementById(contentId);

        faqButtons.forEach(otherBtn => {
          if (otherBtn !== button) {
            otherBtn.setAttribute('aria-expanded', 'false');
            const otherContent = document.getElementById(otherBtn.getAttribute('aria-controls'));
            if (otherContent) {
              otherContent.style.maxHeight = null;
              otherContent.classList.remove('open');
            }
          }
        });

        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          if (content) {
            content.style.maxHeight = null;
            content.classList.remove('open');
          }
        } else {
          button.setAttribute('aria-expanded', 'true');
          if (content) {
            content.classList.add('open');
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        }
      });
    });
  }

  /* ==========================================================================
     12. INITIALIZATION
     ========================================================================== */

  function initApp() {
    initSidebarCollapse();
    handleHashRoute();
    initSpotlight();
    initCaseStudies();
    initProjectArchive();
    initFAQ();
    setChatStatus('connecting');
    checkBackendHealth();

    requestAnimationFrame(function () {
      updateNavIndicator();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
