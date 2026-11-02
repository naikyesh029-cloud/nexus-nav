/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        nx: {
          bg: '#04060f',
          panel: '#0a1020',
          cyan: '#22d3ee',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(34, 211, 238, 0.45)',
        'glow-violet': '0 0 40px -8px rgba(139, 92, 246, 0.5)',
      },
    },
  },
  plugins: [],
}
