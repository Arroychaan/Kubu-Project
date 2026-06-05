import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom KUBU theme colors
                left: "var(--color-left)",
                right: "var(--color-right)",
                "card-bg": "var(--card-bg)",
                "card-border": "var(--card-border)",
                success: "var(--success)",
                error: "var(--error)",
                muted: "var(--text-muted)",
            },
            boxShadow: {
                'neon': 'var(--neon-glow)',
            },
            animation: {
                shake: 'shake 0.3s ease-in-out',
                shimmer: 'shimmer 2s infinite',
            },
            keyframes: {
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
