'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Initialize AOS (Animate On Scroll) 🚀 ---
    if (typeof AOS !== 'undefined') {
        AOS.init({
            once: true,
            offset: 50,
            duration: 800,
            easing: 'ease-out-cubic',
        });
    }

    // --- 2. Mobile Menu Logic 📱 ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const body = document.body;

    function toggleMenu() {
        // Check if menu exists to prevent errors
        if (!mobileMenu) return;

        const isClosed = mobileMenu.classList.contains('translate-x-full');

        if (isClosed) {
            // Open Menu
            mobileMenu.classList.remove('translate-x-full');
            body.style.overflow = 'hidden'; // Disable scrolling
        } else {
            // Close Menu
            mobileMenu.classList.add('translate-x-full');
            body.style.overflow = 'auto'; // Enable scrolling
        }
    }

    // Event Listeners for Menu
    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // --- 3. Scroll-to-Top Button ⬆️ ---
    const scrollBtn = document.getElementById('scroll-to-top');

    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            // Show button after scrolling down 300px
            if (window.scrollY > 300) {
                scrollBtn.classList.remove('opacity-0', 'translate-y-10');
            } else {
                scrollBtn.classList.add('opacity-0', 'translate-y-10');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 4. Dynamic Year 📅 ---
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});

// --- 5. Chatbase Chatbot Integration 🤖 ---
(function() {
    'use strict';

    if (typeof window.chatbase !== "function" || window.chatbase("getState") !== "initialized") {
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
        // Ensure this ID matches the one in your dashboard
        script.id = "iw2ja0xpfdkirthq6amr0e9pc4t7pgcz";
        document.head.appendChild(script);
    };

    if (document.readyState === "complete") {
        onLoad();
    } else {
        window.addEventListener("load", onLoad);
    }
})();
