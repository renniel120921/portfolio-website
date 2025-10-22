document.addEventListener('DOMContentLoaded', () => {

    // Initialize AOS
    if (typeof AOS !== 'undefined') AOS.init({ once: true, duration: 1000 });

    // Set current year
    const year = document.getElementById('current-year');
    if (year) year.textContent = new Date().getFullYear();

    // Elements
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
            strings: ["Full-Stack Developer", "React Specialist", "Node.js Engineer", "Web Developer"],
            typeSpeed: 60, backSpeed: 30, loop: true, cursorChar: '|'
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

    // Profile hover
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

    // Mobile menu
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

    // Scroll to top button
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    window.addEventListener('scroll', () => {
        if (scrollBtn) scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    if (scrollBtn) scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
// ChatBot ni boss
document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotBox = document.getElementById('chatbot-box');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', () => {
        chatbotBox.classList.toggle('hidden');
    });

    // Close chatbot
    chatbotClose.addEventListener('click', () => {
        chatbotBox.classList.add('hidden');
    });

    // Function to append messages
    function appendMessage(sender, text, id = null) {
        const msg = document.createElement('div');
        msg.className = sender === 'user' ? 'text-right mb-2' : 'text-left mb-2';
        if (id) msg.id = id;

        msg.innerHTML = `
            <span class="inline-block px-3 py-1 rounded-lg ${sender === 'user'
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}">
                ${text}
            </span>
        `;

        chatbotMessages.appendChild(msg);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return msg;
    }

    // Function to send message to Chatbase
    async function sendMessageToBot(message) {
        // Add "typing" indicator
        const typingId = 'bot-typing';
        const typingMsg = appendMessage('bot', 'Bot is typing...', typingId);

        try {
            const response = await fetch('https://www.chatbase.co/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ed16b2c9-3eac-493f-9b12-8fa8ffe6a53f'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: message }],
                    chatbotId: '17ab15ef-6736-4749-9330-5c236d212dfb',
                    stream: false
                })
            });

            const data = await response.json();
            const typingElement = document.getElementById(typingId);
            if (typingElement) typingElement.remove();

            // Handle different possible responses
            let botReply = 'Sorry, I didn’t understand that.';
            if (data && data.output && Array.isArray(data.output) && data.output.length > 0) {
                botReply = data.output[0].content || data.output[0].text || botReply;
            }

            appendMessage('bot', botReply);

        } catch (err) {
            const typingElement = document.getElementById(typingId);
            if (typingElement) typingElement.remove();
            console.error('Chatbot Error:', err);
            appendMessage('bot', 'Error connecting to AI server.');
        }
    }

    // Send message on Enter key
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatbotInput.value.trim();
            if (!message) return;

            appendMessage('user', message);
            chatbotInput.value = '';
            sendMessageToBot(message);
        }
    });
});
