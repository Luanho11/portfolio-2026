// Theme: dark/light mode toggle

const Theme = (() => {
    let themeToggle = null;
    let themeIcon = null;

    function init() {
        themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        themeIcon = themeToggle.querySelector('i');

        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme === 'light');

        themeToggle.addEventListener('click', () => {
            const isLight = !document.body.classList.contains('light-mode');
            setTheme(isLight);
        });
    }

    function setTheme(isLight) {
        if (!document.body || !themeIcon) return;

        if (isLight) {
            document.body.classList.add('light-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    }

    function isLight() {
        return document.body ? document.body.classList.contains('light-mode') : false;
    }

    return { init, setTheme, isLight };
})();
