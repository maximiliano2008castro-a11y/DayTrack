/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:         '#0e0e0e',
        surface:    '#141414',
        card:       '#1a1a1a',
        'card-2':   '#1e1e1e',
        border:     '#242424',
        'border-2': '#2e2e2e',
        accent:     '#2cb99a',
        'accent-d': '#1f8f78',
        hi:         '#e2e2e2',
        mid:        '#888888',
        lo:         '#505050',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
