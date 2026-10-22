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

    // Update Workspace Top Bar Breadcrumb
    const topbarActivePage = document.getElementById('topbar-active-page');
    if (topbarActivePage) {
      topbarActivePage.textContent = label;
    }

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
    const spotlightOpenBtns = document.querySelectorAll('#spotlight-open-btn, .spotlight-open-btn, #mobile-search-trigger, #sidebar-search-trigger');
    const spotlightCloseBtn = document.getElementById('spotlight-close-btn');
    const spotlightInput = document.getElementById('spotlight-search');
    const spotlightResults = document.getElementById('spotlight-results');

    if (!spotlightModal || !spotlightInput) return;

    function openSpotlight(triggerEl) {
      spotlightInput.value = '';
      filterSpotlightItems('');
      OverlayManager.open(spotlightModal, spotlightInput, triggerEl || spotlightOpenBtns[0]);
      window.trackEvent('spotlight_opened', { source: triggerEl ? 'button' : 'shortcut' });
    }

    function closeSpotlight() {
      OverlayManager.close(spotlightModal);
    }

    spotlightOpenBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        openSpotlight(btn);
      });
    });

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

    const tooltipTargets = document.querySelectorAll('.nav-item, #sidebar-search-trigger');
    tooltipTargets.forEach(link => {
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

      let currentLine = line;
      if (/^\s*[-*•]\s+/.test(currentLine)) {
        currentLine = currentLine.replace(/^\s*[-*•]\s+/, '• ');
      }

      const tokenRegex = /(https?:\/\/[^\s)]+)|(#[a-zA-Z0-9_-]+)|(\*\*[^*]+\*\*)|(`[^`]+`)/g;
      let lastIdx = 0;
      let match;

      while ((match = tokenRegex.exec(currentLine)) !== null) {
        if (match.index > lastIdx) {
          container.appendChild(document.createTextNode(currentLine.substring(lastIdx, match.index)));
        }

        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
          const strong = document.createElement('strong');
          strong.textContent = token.slice(2, -2);
          container.appendChild(strong);
        } else if (token.startsWith('`') && token.endsWith('`')) {
          const code = document.createElement('code');
          code.className = 'chat-inline-code';
          code.textContent = token.slice(1, -1);
          container.appendChild(code);
        } else if (token.startsWith('#')) {
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

      if (lastIdx < currentLine.length) {
        container.appendChild(document.createTextNode(currentLine.substring(lastIdx)));
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
      msgDiv.appendChild(bubble);
    } else {
      formatSafeContent(bubble, text);

      const msgRow = document.createElement('div');
      msgRow.className = 'chat-msg-row';

      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'chat-msg-avatar-wrap';
      const avatarImg = document.createElement('img');
      avatarImg.src = 'images/my_own_mascot.webp';
      avatarImg.alt = 'AI Mascot';
      avatarImg.className = 'chat-msg-avatar';
      avatarWrap.appendChild(avatarImg);

      msgRow.appendChild(avatarWrap);
      msgRow.appendChild(bubble);
      msgDiv.appendChild(msgRow);
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

    chatMsgs.appendChild(msgDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return msgDiv;
  }

  function createTypingIndicator(customText) {
    if (!chatMsgs) return null;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg ai';
    typingDiv.id = 'chat-typing-bubble';

    const msgRow = document.createElement('div');
    msgRow.className = 'chat-msg-row';

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'chat-msg-avatar-wrap';
    const avatarImg = document.createElement('img');
    avatarImg.src = 'images/my_own_mascot.webp';
    avatarImg.alt = 'AI Mascot';
    avatarImg.className = 'chat-msg-avatar';
    avatarWrap.appendChild(avatarImg);
    msgRow.appendChild(avatarWrap);

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

    msgRow.appendChild(indicator);
    typingDiv.appendChild(msgRow);
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
          appendChatMessage('ai', "Hi! I'm Rennie, Renniel's AI portfolio assistant. Ask me about his current work at City Health Office (CHO), featured projects like Likha Apps & Tipid App, tech stack, or services at EasyWeb PH!");
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
     11A. CONTACT & INQUIRIES INTERACTION SUITE
     ========================================================================== */

  function initContactSection() {
    const copyBtn = document.getElementById('contact-copy-email-trigger');
    const copyLabel = document.getElementById('copy-email-btn-text');
    const emailToCopy = 'rennielsalazar948@gmail.com';

    if (!copyBtn) return;

    let revertTimeout = null;

    copyBtn.addEventListener('click', async function () {
      let copySuccess = false;

      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(emailToCopy);
          copySuccess = true;
        } catch (_) {
          copySuccess = false;
        }
      }

      // Fallback using temporary textarea
      if (!copySuccess) {
        try {
          const tempTextarea = document.createElement('textarea');
          tempTextarea.value = emailToCopy;
          tempTextarea.setAttribute('readonly', '');
          tempTextarea.style.position = 'fixed';
          tempTextarea.style.left = '-9999px';
          tempTextarea.style.top = '0';
          document.body.appendChild(tempTextarea);
          tempTextarea.select();
          copySuccess = document.execCommand('copy');
          document.body.removeChild(tempTextarea);
        } catch (_) {
          copySuccess = false;
        }
      }

      // Visual and telemetry feedback
      if (copySuccess) {
        const iconEl = copyBtn.querySelector('i');
        copyBtn.classList.add('copied');
        if (copyLabel) copyLabel.textContent = 'Email Copied! ✓';
        if (iconEl) {
          iconEl.className = 'fa-solid fa-check';
        }

        if (typeof window.trackEvent === 'function') {
          window.trackEvent('contact_copy_email', { email: emailToCopy });
        }

        if (revertTimeout) clearTimeout(revertTimeout);
        revertTimeout = setTimeout(function () {
          copyBtn.classList.remove('copied');
          if (copyLabel) copyLabel.textContent = 'Copy Email Address';
          if (iconEl) {
            iconEl.className = 'fa-regular fa-copy';
          }
        }, 2500);
      }
    });
  }

  /* ==========================================================================
     11B. THEME TOGGLE (Modern SaaS Dark / Apple Light)
     ========================================================================== */

  function initThemeToggle() {
    const desktopToggle = document.getElementById('desktop-theme-toggle');
    const mobileToggle = document.getElementById('mobile-theme-toggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function getPreferredTheme() {
      try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
      } catch (e) {}
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
      if (themeMeta) {
        themeMeta.setAttribute('content', theme === 'light' ? '#F5F5F7' : '#080C14');
      }
      const label = theme === 'light' ? 'Switch to Dark SaaS Theme' : 'Switch to Light Theme';
      if (desktopToggle) desktopToggle.setAttribute('aria-label', label);
      if (mobileToggle) mobileToggle.setAttribute('aria-label', label);
    }

    const currentTheme = getPreferredTheme();
    setTheme(currentTheme);

    function toggleTheme() {
      const active = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = active === 'dark' ? 'light' : 'dark';
      setTheme(next);

      // Trigger cinematic glow animation on hero portrait during theme toggle
      const portraitFrame = document.getElementById('hero-portrait-frame');
      if (portraitFrame) {
        portraitFrame.classList.remove('theme-animating');
        void portraitFrame.offsetWidth; // Force reflow
        portraitFrame.classList.add('theme-animating');
        setTimeout(() => {
          portraitFrame.classList.remove('theme-animating');
        }, 800);
      }
    }

    if (desktopToggle) desktopToggle.addEventListener('click', toggleTheme);
    if (mobileToggle) mobileToggle.addEventListener('click', toggleTheme);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        try {
          if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        } catch (err) {}
      });
    }
  }

  /* ==========================================================================
     11C. LIVE GITHUB TELEMETRY & MULTI-YEAR HEATMAP (2024 - 2026)
     ========================================================================== */

  async function initGitHubHeatmap() {
    const grid = document.getElementById('github-heatmap-grid');
    const monthsRow = document.getElementById('heatmap-months-row');
    const tooltip = document.getElementById('heatmap-tooltip');
    const container = document.getElementById('telemetry-heatmap-container');
    const summaryCount = document.getElementById('heatmap-live-summary');
    const metricContrib = document.getElementById('telemetry-contrib-count');
    const metricLabel = document.getElementById('telemetry-contrib-label');
    const metricSub = document.getElementById('telemetry-contrib-sub');
    const metricActiveDays = document.getElementById('telemetry-active-days');
    const metricPeakVelocity = document.getElementById('telemetry-peak-velocity');
    const yearButtons = document.querySelectorAll('.heatmap-year-btn');

    if (!grid || !monthsRow) return;

    let allContributions = [];
    const embeddedScript = document.getElementById('github-contributions-data');
    if (embeddedScript && embeddedScript.textContent) {
      try {
        allContributions = JSON.parse(embeddedScript.textContent);
      } catch (e) {}
    }

    if (!allContributions || !allContributions.length) {
      try {
        const res = await fetch('data/github-contributions.json');
        if (res.ok) {
          allContributions = await res.json();
        }
      } catch (err) {
        console.warn('Could not load github-contributions.json', err);
      }
    }

    if (!allContributions || !allContributions.length) return;

    allContributions.sort((a, b) => a.date.localeCompare(b.date));

    // Filter and render function by selected year
    function renderYearView(selectedYear) {
      let filtered = [];
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);
      const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

      if (selectedYear === '2026') {
        // Last 365 days / 2026 rolling view (matches user's GitHub screenshot: 561 contributions)
        filtered = allContributions.filter(item => item.date >= oneYearAgoStr || item.date.startsWith('2026'));
      } else if (selectedYear === '2025') {
        filtered = allContributions.filter(item => item.date.startsWith('2025'));
      } else if (selectedYear === '2024') {
        filtered = allContributions.filter(item => item.date.startsWith('2024'));
      } else {
        // All years (2024 to 2026)
        filtered = allContributions;
      }

      // Compute telemetry stats for current view
      const totalCount = filtered.reduce((acc, item) => acc + (item.count || 0), 0);
      const activeDays = filtered.filter(item => (item.count || 0) > 0).length;
      let peakVelocity = 0;
      filtered.forEach(item => {
        if ((item.count || 0) > peakVelocity) peakVelocity = item.count;
      });

      // Update UI telemetry badges
      if (metricContrib) metricContrib.textContent = totalCount;
      if (metricActiveDays) metricActiveDays.textContent = activeDays;
      if (metricPeakVelocity && peakVelocity > 0) metricPeakVelocity.textContent = peakVelocity;

      if (summaryCount) {
        if (selectedYear === '2026') {
          summaryCount.innerHTML = `<strong>${totalCount}</strong> contributions in the last year`;
        } else if (selectedYear === 'all') {
          summaryCount.innerHTML = `<strong>${totalCount}</strong> verified contributions across 2024–2026`;
        } else {
          summaryCount.innerHTML = `<strong>${totalCount}</strong> contributions in ${selectedYear}`;
        }
      }

      if (metricLabel) {
        if (selectedYear === '2026') {
          metricLabel.textContent = 'Contributions in 2026';
        } else if (selectedYear === 'all') {
          metricLabel.textContent = 'Contributions (2024–2026)';
        } else {
          metricLabel.textContent = `Contributions in ${selectedYear}`;
        }
      }

      if (metricSub) {
        if (selectedYear === '2026') {
          metricSub.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> Last 365 Days';
        } else if (selectedYear === 'all') {
          metricSub.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Multi-Year Shipping Record';
        } else {
          metricSub.innerHTML = `<i class="fa-solid fa-calendar"></i> Full Year ${selectedYear}`;
        }
      }

      // Render Months Row
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let lastMonth = -1;
      const weekCount = Math.ceil(filtered.length / 7);

      monthsRow.innerHTML = '';
      for (let w = 0; w < weekCount; w++) {
        const dayIdx = w * 7;
        if (dayIdx < filtered.length) {
          const d = new Date(filtered[dayIdx].date + 'T00:00:00');
          const m = d.getMonth();
          if (m !== lastMonth) {
            lastMonth = m;
            const label = document.createElement('span');
            label.className = 'heatmap-month-label';
            label.textContent = selectedYear === 'all' ? `${monthNames[m]} '${d.getFullYear().toString().slice(2)}` : monthNames[m];
            label.style.width = selectedYear === 'all' ? '64px' : '56px';
            monthsRow.appendChild(label);
          }
        }
      }

      // Render Grid Cells
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();

      filtered.forEach((item) => {
        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${item.level}`;
        cell.setAttribute('data-date', item.date);
        cell.setAttribute('data-count', item.count);
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'button');

        const dateObj = new Date(item.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const countLabel = `${item.count} contribution${item.count === 1 ? '' : 's'}`;
        cell.setAttribute('aria-label', `${formattedDate}: ${countLabel}`);

        function showTooltip() {
          if (!tooltip || !container) return;
          tooltip.textContent = `${countLabel} on ${formattedDate}`;
          tooltip.classList.add('visible');

          const cellRect = cell.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const left = cellRect.left - containerRect.left + cellRect.width / 2 + container.scrollLeft;
          const top = cellRect.top - containerRect.top + container.scrollTop;

          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        }

        function hideTooltip() {
          if (tooltip) {
            tooltip.classList.remove('visible');
          }
        }

        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
        cell.addEventListener('focus', showTooltip);
        cell.addEventListener('blur', hideTooltip);

        fragment.appendChild(cell);
      });

      grid.appendChild(fragment);

      if (container) {
        requestAnimationFrame(() => {
          container.scrollLeft = container.scrollWidth;
        });
      }
    }

    // Attach Year Button Listeners
    yearButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        yearButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const year = btn.getAttribute('data-year') || '2026';
        renderYearView(year);
      });
    });

    // Default view: 2026 (561 contributions in the last year)
    renderYearView('2026');
  }

  /* ==========================================================================
     11D. LIVE SYSTEMS ARCHITECTURE & TOPOLOGY VISUALIZER
     ========================================================================== */

  function initSystemsVisualizer() {
    const card = document.getElementById('system-visualizer-card');
    if (!card) return;

    const presetButtons = card.querySelectorAll('.vis-preset-btn');
    const nodeButtons = card.querySelectorAll('.topology-node');

    const kickerEl = document.getElementById('sys-vis-kicker-text');
    const mainTitleEl = document.getElementById('sys-vis-main-title');
    const mainDescEl = document.getElementById('sys-vis-main-desc');

    const inspectTag = document.getElementById('inspect-tag');
    const inspectStatus = document.getElementById('inspect-status');
    const inspectTitle = document.getElementById('inspect-title');
    const inspectDesc = document.getElementById('inspect-desc');
    const inspectTech = document.getElementById('inspect-tech');
    const inspectSecurity = document.getElementById('inspect-security');
    const inspectLatency = document.getElementById('inspect-latency');
    const inspectDeployed = document.getElementById('inspect-deployed');
    const inspectQuote = document.getElementById('inspect-quote');

    const TOPOLOGY_DATA = {
      saas: {
        kicker: 'SaaS & PWA Architecture Topology',
        title: 'Full-Stack Production Topology',
        desc: 'Decoupled, event-driven Progressive Web App architecture engineered for instant edge delivery, zero app store fees, offline resilience, and automatic data synchronization.',
        nodeLabels: {
          'client-edge': { title: 'Presentation & PWA Edge', sub: 'Next.js 16 · Service Worker' },
          'gateway-auth': { title: 'API Gateway & Auth', sub: 'Vercel Serverless · RBAC' },
          'data-persistence': { title: 'Data & Persistence', sub: 'Cloud Firestore · Supabase' },
          'telemetry-ops': { title: 'Telemetry & CI/CD', sub: 'GitHub Actions · Vercel Analytics' }
        },
        nodes: {
          'client-edge': {
            tag: 'TIER 01 · CLIENT PRESENTATION',
            status: 'Production Validated',
            statusClass: 'online',
            icon: 'fa-circle-check',
            title: 'Presentation & Progressive Web App (PWA)',
            desc: 'High-performance user interfaces built with responsive Apple HIG ergonomics, offline service worker caching, instant hydration, and accessible keyboard-first navigation.',
            tech: 'Next.js 16, React 19, TypeScript, Tailwind CSS v4, Workbox / PWA Service Workers',
            security: 'Strict Content Security Policy (CSP), TLS 1.3, Subresource Integrity, HTTPS only',
            latency: '< 1.2s First Contentful Paint (FCP), Stale-While-Revalidate Edge Cache',
            deployed: 'Likha Apps, Tipid App, EasyWeb PH Clients, Portfolio-website',
            quote: 'Engineering software for the open web without app store tollgates, guaranteeing instant discovery and sub-second load times.'
          },
          'gateway-auth': {
            tag: 'TIER 02 · EDGE ROUTING & IDENTITY',
            status: 'Hardened Security',
            statusClass: 'online',
            icon: 'fa-shield-halved',
            title: 'API Gateway, Auth & Serverless Edge',
            desc: 'Edge-rendered microservices and authentication workflows enforcing role-based permissions, rate limiting, and zero-trust parameter validation.',
            tech: 'Vercel Serverless Functions, Node.js REST Services, Firebase Authentication, JWT Tokens',
            security: 'Signed HTTP-Only Session Cookies, CORS Origin Whitelist, Sanitized Payloads',
            latency: '~24ms global edge invocation, automated cold-start mitigation',
            deployed: 'EasyWeb PH Agency backend, Likha Apps Submission Flow, Tipid App Auth',
            quote: 'Decoupled API endpoints protected by strict input validation and defense-in-depth authorization policies.'
          },
          'data-persistence': {
            tag: 'TIER 03 · DISTRIBUTED DATA STORE',
            status: 'Realtime Sync Active',
            statusClass: 'online',
            icon: 'fa-database',
            title: 'Cloud Persistence, Realtime DB & Cache',
            desc: 'NoSQL distributed collections and transactional document stores optimized for low-latency indexing, offline SQLite/IndexedDB syncing, and ACID compliance.',
            tech: 'Cloud Firestore, IndexedDB (Offline Client Cache), Supabase / PostgreSQL',
            security: 'Declarative Security Rules, AES-256 encryption at rest, field-level data masking',
            latency: '< 35ms query execution, optimistic UI updates with background synchronization',
            deployed: 'Tipid App Personal Finance, Likha Apps Directory DB, Supabase Research Tools',
            quote: 'Data architectures designed for offline reliability first, ensuring zero user data loss during intermittent network states.'
          },
          'telemetry-ops': {
            tag: 'TIER 04 · OBSERVABILITY & CONTINUOUS DELIVERY',
            status: 'Continuous Monitoring',
            statusClass: 'online',
            icon: 'fa-chart-line',
            title: 'Observability, Health Telemetry & CI/CD',
            desc: 'Continuous delivery pipelines with automated linting, test suites, live uptime probes, Core Web Vitals tracking, and GitHub push-to-deploy workflows.',
            tech: 'GitHub Actions CI/CD, Vercel Web Analytics, Automated Lighthouse Auditing, Ping Telemetry',
            security: 'Automated dependency vulnerability audits (npm audit / Dependabot), encrypted secrets',
            latency: 'Zero-downtime rolling atomic deploys in < 45 seconds',
            deployed: 'All 10 GitHub Production Repositories, Vercel Edge Pipeline',
            quote: 'Automating developer operations so every code push is validated, audited, and deployed with zero user interruption.'
          }
        }
      },
      govtech: {
        kicker: 'GovTech Core Topology · RA 10173 Compliant',
        title: 'Municipal Records & RA 10173 Audit Topology',
        desc: 'Mission-critical municipal health record architecture strictly adhering to the Philippine Data Privacy Act of 2012 (RA 10173), role-based audit enclaves, and high-availability clinic terminals.',
        nodeLabels: {
          'client-edge': { title: 'Clinic & Department Terminals', sub: 'Ergonomic Web Workstation' },
          'gateway-auth': { title: 'RBAC Access Gateway', sub: 'Role Separation & Audit Trail' },
          'data-persistence': { title: 'Normalized Health Schemas', sub: 'MySQL · Encrypted Enclave' },
          'telemetry-ops': { title: 'Compliance & Failover Recovery', sub: 'Disaster Recovery & Snapshots' }
        },
        nodes: {
          'client-edge': {
            tag: 'TIER 01 · INSTITUTIONAL WORKFLOW TERMINAL',
            status: 'Active System Development',
            statusClass: 'in-dev',
            icon: 'fa-hospital-user',
            title: 'Clinic & Departmental Workstation Terminals',
            desc: 'Ergonomic, high-contrast web portals engineered for clinical data entry, patient triage queuing, and administrative staff workflows with strict input masks.',
            tech: 'Responsive Web Framework, Modern DOM APIs, CSS Grid, Accessible Keyboard Shortcuts',
            security: 'Session auto-lockout after inactivity, zero client-side caching of identifiable patient records (RA 10173)',
            latency: 'Sub-second form transitions, local intranet low-latency optimization',
            deployed: 'City Health Office (CHO) Ongoing Core System Development',
            quote: 'Transforming legacy physical logbooks and paper-based clinic procedures into seamless, human-centered digital experiences.'
          },
          'gateway-auth': {
            tag: 'TIER 02 · RBAC ACCESS GATEWAY',
            status: 'Role Separation Enforced',
            statusClass: 'online',
            icon: 'fa-id-badge',
            title: 'Role-Based Access Control (RBAC) & Audit Gate',
            desc: 'Granular access control layer ensuring doctors, nurses, and administrative officers access only explicitly authorized records with mandatory audit trail logging.',
            tech: 'Token-based session management, hierarchical role definitions, parameterized request filters',
            security: 'Zero-Trust compartmentalization, multi-factor credential checks, immutable request logs',
            latency: '< 15ms authorization verification per transactional endpoint',
            deployed: 'City Health Office (CHO) Architecture, Custom DTR Attendance Systems',
            quote: 'Public health systems demand impenetrable access barriers where every view, update, and export is permanently audited.'
          },
          'data-persistence': {
            tag: 'TIER 03 · NORMALIZED HEALTH ENCLAVE',
            status: 'Active Schema Engineering',
            statusClass: 'in-dev',
            icon: 'fa-database',
            title: 'Normalized Health Schemas & Secure Storage',
            desc: 'Highly structured relational schemas organizing municipal patient demographics, consultation encounters, prescription histories, and inventory balances.',
            tech: 'Relational Database Management (MySQL / Normalized SQL), Automated Daily Backups',
            security: 'Encrypted database volumes, anonymized reporting views for statistical compliance, non-exportable PHI',
            latency: 'Optimized B-tree indexing for high-volume patient lookups and historical filtering',
            deployed: 'City Health Office (CHO) Workflow Architecture, Capstone SmartBasura Municipal Backend',
            quote: 'Architecting rock-solid data foundations that preserve data integrity across decades of public health service.'
          },
          'telemetry-ops': {
            tag: 'TIER 04 · COMPLIANCE & INCIDENT RECOVERY',
            status: 'Audit Enclave Active',
            statusClass: 'online',
            icon: 'fa-shield-halved',
            title: 'Compliance Verification & Reliability Assurance',
            desc: 'Automated database snapshotting, failover protocols, data privacy impact audits, and non-disclosure operational standards.',
            tech: 'Database Snapshots, Redundant Backup Scripts, RA 10173 Compliance Checklists',
            security: 'Tamper-evident logs, disaster recovery protocols with verified Recovery Point Objective (RPO)',
            latency: 'Automated 24/7 internal service heartbeat checks',
            deployed: 'City Health Office (CHO) Placement Standards, EasyWeb PH Enterprise Deployments',
            quote: 'Government systems must never fail the citizens they serve; reliability and privacy are non-negotiable.'
          }
        }
      }
    };

    let activePreset = 'saas';
    let activeNode = 'client-edge';

    function updateInspector(presetKey, nodeKey) {
      const preset = TOPOLOGY_DATA[presetKey] || TOPOLOGY_DATA.saas;
      const node = preset.nodes[nodeKey] || preset.nodes['client-edge'];

      if (!node) return;

      if (inspectTag) inspectTag.textContent = node.tag;
      if (inspectStatus) {
        inspectStatus.className = `inspector-status-pill ${node.statusClass}`;
        inspectStatus.innerHTML = `<i class="fa-solid ${node.icon}" aria-hidden="true"></i> <span>${node.status}</span>`;
      }
      if (inspectTitle) inspectTitle.textContent = node.title;
      if (inspectDesc) inspectDesc.textContent = node.desc;
      if (inspectTech) inspectTech.textContent = node.tech;
      if (inspectSecurity) inspectSecurity.textContent = node.security;
      if (inspectLatency) inspectLatency.textContent = node.latency;
      if (inspectDeployed) inspectDeployed.textContent = node.deployed;
      if (inspectQuote) inspectQuote.textContent = `"${node.quote}"`;

      // Update node labels in the list
      nodeButtons.forEach(btn => {
        const key = btn.getAttribute('data-node');
        const labelData = preset.nodeLabels[key];
        if (labelData) {
          const titleEl = btn.querySelector('.node-title');
          const subEl = btn.querySelector('.node-sub');
          if (titleEl) titleEl.textContent = labelData.title;
          if (subEl) subEl.textContent = labelData.sub;
        }
      });
    }

    function switchPreset(newPreset) {
      activePreset = newPreset;
      const data = TOPOLOGY_DATA[activePreset];
      if (!data) return;

      presetButtons.forEach(btn => {
        const matches = btn.getAttribute('data-preset') === activePreset;
        btn.classList.toggle('active', matches);
        btn.setAttribute('aria-selected', matches ? 'true' : 'false');
      });

      if (kickerEl) kickerEl.textContent = data.kicker;
      if (mainTitleEl) mainTitleEl.textContent = data.title;
      if (mainDescEl) mainDescEl.textContent = data.desc;

      updateInspector(activePreset, activeNode);

      if (typeof window.trackEvent === 'function') {
        window.trackEvent('topology_preset_switch', { preset: activePreset });
      }
    }

    function selectNode(nodeKey) {
      activeNode = nodeKey;
      nodeButtons.forEach(btn => {
        const matches = btn.getAttribute('data-node') === nodeKey;
        btn.classList.toggle('active', matches);
        btn.setAttribute('aria-selected', matches ? 'true' : 'false');
      });

      updateInspector(activePreset, activeNode);

      if (typeof window.trackEvent === 'function') {
        window.trackEvent('topology_node_select', { node: activeNode, preset: activePreset });
      }
    }

    // Attach Preset Listeners
    presetButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const preset = btn.getAttribute('data-preset');
        if (preset && preset !== activePreset) {
          switchPreset(preset);
        }
      });
    });

    // Attach Node Click Listeners
    nodeButtons.forEach((btn, index) => {
      btn.addEventListener('click', function () {
        const node = btn.getAttribute('data-node');
        if (node) selectNode(node);
      });

      // Keyboard arrow navigation
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (index + 1) % nodeButtons.length;
          nodeButtons[nextIndex].focus();
          const nextNode = nodeButtons[nextIndex].getAttribute('data-node');
          if (nextNode) selectNode(nextNode);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (index - 1 + nodeButtons.length) % nodeButtons.length;
          nodeButtons[prevIndex].focus();
          const prevNode = nodeButtons[prevIndex].getAttribute('data-node');
          if (prevNode) selectNode(prevNode);
        }
      });
    });

    // Initial render
    updateInspector(activePreset, activeNode);
  }

  /* ==========================================================================
     12. INITIALIZATION
     ========================================================================== */

  function initApp() {
    initThemeToggle();
    initSidebarCollapse();
    handleHashRoute();
    initSpotlight();
    initCaseStudies();
    initProjectArchive();
    initGitHubHeatmap();
    initFAQ();
    initContactSection();
    initSystemsVisualizer();
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
