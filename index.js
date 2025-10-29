document.addEventListener('DOMContentLoaded', () => {


    // Initialize AOS
    if (typeof AOS !== 'undefined') AOS.init({ once: true, duration: 1000 });


    // Set current year
    const year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();


    // Element selectors
    const body = document.body;
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const sunIcons = document.querySelectorAll('.dark-theme-icon, .dark-theme-icon-mobile');
    const moonIcons = document.querySelectorAll('.light-theme-icon, .light-theme-icon-mobile');
    const bars = {
        top: document.querySelector('.menu-bar-top'),
        mid: document.querySelector('.menu-bar-middle'),
        bot: document.querySelector('.menu-bar-bottom')
    };


    // Typed.js animation
    if (document.getElementById('typed-text') && typeof Typed !== 'undefined') {
        new Typed('#typed-text', {
            strings: ["Full-Stack Developer", "Laravel Specialist", "Web Developer"],
            typeSpeed: 60,
            backSpeed: 30,
            loop: true,
            cursorChar: '|'
        });
    }


    // Theme toggle
    function setTheme(isDark) {
        body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        body.classList.toggle('dark-theme', isDark);
        body.classList.toggle('light-theme', !isDark);

        sunIcons.forEach(i => i.classList.toggle('hidden', !isDark));
        moonIcons.forEach(i => i.classList.toggle('hidden', isDark));

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const barColor = isDark ? '#fff' : 'rgb(31,41,55)';
        [bars.top, bars.mid, bars.bot].forEach(b => b.style.backgroundColor = barColor);
    }

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved ? saved === 'dark' : prefersDark);

    toggleBtns.forEach(btn => btn.addEventListener('click', () => {
        setTheme(!body.classList.contains('dark-theme'));
    }));


    // Profile hover effect
    const imgBox = document.getElementById('profile-img-container');
    const defPhoto = document.getElementById('default-photo');
    const hovPhoto = document.getElementById('hover-photo');
    if (imgBox && defPhoto && hovPhoto) {
        imgBox.addEventListener('mouseenter', () => {
            defPhoto.style.opacity = '0';
            hovPhoto.style.opacity = '1';
        });
        imgBox.addEventListener('mouseleave', () => {
            defPhoto.style.opacity = '1';
            hovPhoto.style.opacity = '0';
        });
    }


    // Mobile menu toggle
    function toggleMenu() {
        if (!mobileMenu || !menuToggle) return;

        const isClosed = mobileMenu.classList.contains('translate-x-full');
        mobileMenu.classList.toggle('translate-x-full', !isClosed);
        mobileMenu.classList.toggle('translate-x-0', isClosed);

        if (isClosed) {
            bars.top.style.transform = 'rotate(45deg) translate(4px, 5px)';
            bars.mid.style.opacity = '0';
            bars.bot.style.transform = 'rotate(-45deg) translate(4px, -5px)';
            body.classList.add('no-scroll');
        } else {
            bars.top.style.transform = '';
            bars.mid.style.opacity = '1';
            bars.bot.style.transform = '';
            body.classList.remove('no-scroll');
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
        menuItems.forEach(item => item.addEventListener('click', () => {
            if (mobileMenu.classList.contains('translate-x-0')) toggleMenu();
        }));
    }


    // Scroll-to-top button
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    window.addEventListener('scroll', () => {
        if (scrollBtn) scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    if (scrollBtn) scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});


// Chatbase Chatbot
(function() {
    if (!window.chatbase || typeof window.chatbase !== "function" || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args) => {
            if (!window.chatbase.q) window.chatbase.q = [];
            window.chatbase.q.push(args);
        };
        window.chatbase = new Proxy(window.chatbase, {
            get(target, prop) {
                if (prop === "q") return target.q;
                return (...args) => target(prop, ...args);
            }
        });
    }

    const onLoad = () => {
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = "pre02Htlz95QLkJgC1yD7"; // bot ID
        document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
        onLoad();
    } else {
        window.addEventListener("load", onLoad);
    }
})();
