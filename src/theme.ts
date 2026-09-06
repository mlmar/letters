const STORAGE_KEY = 'letters-theme';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return null;
}

function getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
    if (toggle) {
        toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
        toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

export function initTheme() {
    applyTheme(getStoredTheme() ?? getSystemTheme());

    const toggle = document.querySelector('[data-theme-toggle]');
    toggle?.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        const next: Theme = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    });
}
