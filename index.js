'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // Helper to safely get element or return null
    const getEl = (id) => document.getElementById(id);

    // Initialize AOS 🚀
    // Check if AOS is defined globally before calling init
    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, duration: 1000 });
    }

    // Set current year
    const yearEl = getEl('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Element selectors
    const { body } = document;
    const menuToggle = getEl('menu-toggle');
    const mobileMenu = getEl('mobile-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const sunIcons = document.querySelectorAll('.dark-theme-icon, .dark-theme-icon-mobile');
    const moonIcons = document.querySelectorAll('.light-theme-icon, .light-theme-icon-mobile');

    // Hamburger Bar elements - Filter out nulls for safe destructuring
    const bars = [
        document.querySelector('.menu-bar-top'),
        document.querySelector('.menu-bar-middle'),
        document.querySelector('.menu-bar-bottom')
    ].filter(Boolean); // Boolean filters out any falsy values (like null)

    const [barTop, barMid, barBot] = bars;

    // Typed.js animation
    if (getEl('typed-text') && typeof Typed !== 'undefined') {
        new Typed('#typed-text', {
            strings: ["Full-Stack Developer", "Laravel Specialist", "Web Developer"],
            typeSpeed: 60,
            backSpeed: 30,
            loop: true,
            cursorChar: '|'
        });
    }

    // --- Theme Toggle ☀️🌙 ---
    function setTheme(isDark) {
        // Apply transition effects for smooth theme change
        body.style.transition = 'background-color 0.5s ease, color 0.5s ease';

        body.classList.toggle('dark-theme', isDark);
        body.classList.toggle('light-theme', !isDark);

        sunIcons.forEach(i => i.classList.toggle('hidden', !isDark));
        moonIcons.forEach(i => i.classList.toggle('hidden', isDark));

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Update mobile menu bar colors based on the new theme (Ensures the 'X' is visible)
        const barColor = isDark ? '#fff' : 'rgb(31,41,55)';
        bars.forEach(b => b.style.backgroundColor = barColor);
    }

    // Initial theme load
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialIsDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setTheme(initialIsDark);

    // Attach theme toggle listeners
    toggleBtns.forEach(btn => btn.addEventListener('click', () => {
        setTheme(!body.classList.contains('dark-theme'));
    }));

    // --- Profile Hover Effect 🖼️ ---
    const imgBox = getEl('profile-img-container');
    const defPhoto = getEl('default-photo');
    const hovPhoto = getEl('hover-photo');

    if (imgBox && defPhoto && hovPhoto) {
        // Use CSS transitions for smoothness if not already in CSS
        defPhoto.style.transition = hovPhoto.style.transition = 'opacity 0.3s ease';

        const toggleOpacity = (def, hov) => {
            defPhoto.style.opacity = def;
            hovPhoto.style.opacity = hov;
        };

        imgBox.addEventListener('mouseenter', () => toggleOpacity('0', '1'));
        imgBox.addEventListener('mouseleave', () => toggleOpacity('1', '0'));
    }

    // --- Mobile Menu Toggle ☰ ---
    function toggleMenu() {
        if (!mobileMenu || !menuToggle || bars.length < 3) return;

        const isClosed = mobileMenu.classList.contains('translate-x-full');

        // Toggle menu visibility
        mobileMenu.classList.toggle('translate-x-full', !isClosed);
        mobileMenu.classList.toggle('translate-x-0', isClosed);

        // Animate hamburger icon and toggle body scroll
        if (isClosed) {
            barTop.style.transform = 'rotate(45deg) translate(4px, 5px)';
            barMid.style.opacity = '0';
            barBot.style.transform = 'rotate(-45deg) translate(4px, -5px)';
            body.classList.add('no-scroll');
        } else {
            barTop.style.transform = '';
            barMid.style.opacity = '1';
            barBot.style.transform = '';
            body.classList.remove('no-scroll');
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);

        // Close menu on item click
        menuItems.forEach(item => item.addEventListener('click', () => {
            // Check if the menu is open before closing it
            if (!mobileMenu.classList.contains('translate-x-full')) toggleMenu();
        }));
    }

    // --- Scroll-to-top Button ⬆️ ---
    const scrollBtn = getEl('scroll-to-top-btn');

    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            // Use ternary operator for concise style update
            scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});


// --- Chatbase Chatbot Integration 🤖 ---
(function() {
    'use strict';

    // Check if chatbase is initialized or needs setup
    if (typeof window.chatbase !== "function" || window.chatbase("getState") !== "initialized") {

        // Proxy setup for command queuing (ensures commands run once script loads)
        window.chatbase = new Proxy(
            (...args) => {
                if (!window.chatbase.q) window.chatbase.q = [];
                window.chatbase.q.push(args);
            },
            {
                get(target, prop) {
                    if (prop === "q") return target.q;
                    return (...args) => target(prop, ...args);
                }
            }
        );
    }

    const onLoad = () => {
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = "pre02Htlz95QLkJgC1yD7"; // bot ID
        // Appending to head is generally preferred for scripts
        document.head.appendChild(script);
    };

    // Load the script after the DOM is ready or immediately if it's already complete
    if (document.readyState === "complete") {
        onLoad();
    } else {
        window.addEventListener("load", onLoad);
    }
})();
