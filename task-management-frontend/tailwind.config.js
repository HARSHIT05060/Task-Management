/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                mono: ['"DM Mono"', 'monospace'],
            },
            colors: {
                bg: {
                    primary: 'var(--bg-primary)',
                    surface: 'var(--bg-surface)',
                    surface2: 'var(--bg-surface2)',
                    surface3: 'var(--bg-surface3)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    inverse: 'var(--text-inverse)',
                },
                border: {
                    default: 'var(--border-default)',
                    strong: 'var(--border-strong)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                    light: 'var(--accent-light)',
                    text: 'var(--accent-text)',
                },
                green: {
                    DEFAULT: 'var(--green)',
                    light: 'var(--green-light)',
                    text: 'var(--green-text)',
                },
                amber: {
                    DEFAULT: 'var(--amber)',
                    light: 'var(--amber-light)',
                    text: 'var(--amber-text)',
                },
                red: {
                    DEFAULT: 'var(--red)',
                    light: 'var(--red-light)',
                    text: 'var(--red-text)',
                },
                purple: {
                    DEFAULT: 'var(--purple)',
                    light: 'var(--purple-light)',
                    text: 'var(--purple-text)',
                },
                teal: {
                    DEFAULT: 'var(--teal)',
                    light: 'var(--teal-light)',
                    text: 'var(--teal-text)',
                },
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            }
        },
    },
    plugins: [],
}
