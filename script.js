/**
 * Apple HIG-Inspired Portfolio Application Logic
 * Gliding Nav Indicator, Smooth Section Transitions, Drawer, Lightbox & Chatbot
 */

(function () {
  'use strict';

  // Valid Navigation Sections
  const VALID_SECTIONS = [
    'home',
    'about',
    'services',
    'projects',
    'stack',
    'credentials',
    'gallery',
    'experience',
    'testimonials',
    'contact'
  ];

  const SECTION_TITLES = {
    home: 'Home',
    about: 'About',
    services: 'Services',
    projects: 'Projects',
    stack: 'Tech Stack',
    credentials: 'Credentials',
    gallery: 'Gallery',
    experience: 'Experience',
    testimonials: 'Testimonials',
    contact: 'Contact'
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

    // Measure positions relative to scrollable sidebarNav
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
     2. NAVIGATION & SECTION TRANSITIONS
     ========================================================================== */

  function getActiveHash() {
    const raw = window.location.hash.replace(/^#/, '').toLowerCase().trim();
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
    const label = SECTION_TITLES[targetId] || 'Portfolio';
    document.title = `${label} — Renniel Salazar | Software Engineer & Founder`;

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

    const targetSection = href.replace(/^#/, '').toLowerCase().trim();
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
     3. MOBILE SIDEBAR DRAWER
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

    // Update indicator after drawer opens
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
     3b. COLLAPSIBLE DESKTOP SIDEBAR & FLOATING ACCESSIBLE TOOLTIPS
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

  // Floating accessible tooltip attached to body to prevent overflow clipping
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

    // Fallback timer ensures indicator aligns accurately if transitionend is missed
    setTimeout(function () {
      updateNavIndicator();
    }, 280);
  }

  function syncSidebarResponsive() {
    const width = window.innerWidth;
    if (width <= 768) {
      // Mobile drawer mode: ignore desktop collapsed preference, ensure standard drawer
      document.body.classList.remove('sidebar-collapsed');
      if (sidebar) sidebar.classList.remove('collapsed');
      hideSidebarTooltip();
    } else if (width <= 1024) {
      // Tablet mode (769px–1024px):
      // Respect explicit user choice if stored; otherwise default to compact
      const pref = getStoredSidebarPreference();
      if (pref !== null) {
        applySidebarState(pref, false);
      } else {
        applySidebarState(true, false);
      }
    } else {
      // Desktop mode (> 1024px):
      // Restore user choice if stored; otherwise default to expanded
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
     4. ACCESSIBLE LIGHTBOX
     ========================================================================== */

  window.openLightbox = function (src, alt) {
    if (!lightbox || !lbImg) return;
    lbImg.src = src;
    lbImg.alt = alt || 'Preview Image';
    if (lbCaption) lbCaption.textContent = alt || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
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

  /* Global Escape Key Listener */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox && lightbox.classList.contains('active')) {
        window.closeLightbox();
      }
      if (sidebar && sidebar.classList.contains('open')) {
        closeMobileSidebar();
      }
      if (chatWin && chatWin.classList.contains('active')) {
        toggleChat(false);
      }
    }
  });

  /* ==========================================================================
     5. AI CHATBOT INTEGRATION
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
        // Cold start in progress on Render free tier
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
    } else {
      chatWin.classList.remove('active');
    }
  }

  if (chatBtn) {
    chatBtn.addEventListener('click', () => toggleChat());
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => toggleChat(false));
  }

  // Safe DOM Content Formatter (XSS-safe text nodes + clickable anchors)
  function formatSafeContent(container, rawText) {
    const lines = (rawText || '').split('\n');
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        container.appendChild(document.createElement('br'));
      }

      // Match URLs or section hashes
      const tokenRegex = /(https?:\/\/[^\s)]+)|(#[a-zA-Z0-9_-]+)/g;
      let lastIdx = 0;
      let match;

      while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          container.appendChild(document.createTextNode(line.substring(lastIdx, match.index)));
        }

        const token = match[0];
        if (token.startsWith('#')) {
          // Internal section anchor
          const link = document.createElement('a');
          link.href = token;
          link.className = 'chat-link';
          link.textContent = token;
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSec = document.querySelector(token);
            if (targetSec) {
              const navLink = document.querySelector(`.nav-link[href="${token}"]`);
              if (navLink) navLink.click();
              else if (typeof showSection === 'function') showSection(token.replace('#', ''));
              if (window.innerWidth <= 768) {
                toggleChat(false);
              }
            }
          });
          container.appendChild(link);
        } else {
          // External URL
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

  // Send Message Handler
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

    // Render User Message
    appendChatMessage('user', userText);

    // Render Typing Indicator
    createTypingIndicator();

    // Cold-start notification timer for Render spin-down
    const coldStartTimer = setTimeout(() => {
      if (isSubmitting) {
        setChatStatus('starting');
        removeTypingIndicator();
        createTypingIndicator('Starting assistant…');
      }
    }, 5000);

    // AbortController with 45s timeout to gracefully accommodate Render cold starts
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

  // Suggested Prompt Chips (Clickable and keyboard focusable with smooth scroll)
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

  // Conversation Reset
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
     6. ACCESSIBLE FAQ ACCORDION
     ========================================================================== */

  function initFAQ() {
    const faqButtons = document.querySelectorAll('.faq-trigger');
    faqButtons.forEach(button => {
      button.addEventListener('click', function () {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const contentId = button.getAttribute('aria-controls');
        const content = document.getElementById(contentId);

        // Close other accordion items
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
     7. INITIALIZATION
     ========================================================================== */
  function initApp() {
    initSidebarCollapse();
    handleHashRoute();
    initFAQ();
    setChatStatus('connecting');
    checkBackendHealth();
    // Ensure initial alignment of selection capsule
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
