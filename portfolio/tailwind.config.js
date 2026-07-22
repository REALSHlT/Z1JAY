/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Neo-brutalist palette ──
        'surface':                   '#f3efe6', // warm paper canvas
        'surface-dim':               '#e6e1d4',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#faf7f0',
        'surface-container':         '#ffffff',
        'surface-container-high':    '#fdfbf6',
        'surface-container-highest': '#ffffff',
        'on-surface':                '#111111', // ink
        'on-surface-variant':        '#3d3a33',
        'outline':                   '#111111',
        'outline-variant':           '#c9c2b2',
        'primary':                   '#111111', // ink is the brand
        'on-primary':                '#f3efe6',
        'primary-container':         '#ffd43a',
        'secondary':                 '#3d3a33',
        'on-secondary':              '#ffffff',
        'secondary-container':       '#ffd43a',
        'background':                '#f3efe6',
        'on-background':             '#111111',
        'surface-variant':           '#e6e1d4',
        // accents
        'acid':                      '#ffd43a', // yellow — evolved from the old gold
        'punch':                     '#ff5227', // red-orange
        'volt':                      '#3b6cff', // blue
        'ink':                       '#111111',
        'paper':                     '#f3efe6',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', '"Noto Sans TC"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'brut':    '6px 6px 0 #111111',
        'brut-sm': '3px 3px 0 #111111',
        'brut-lg': '10px 10px 0 #111111',
        'brut-acid': '6px 6px 0 #ffd43a',
      },
      maxWidth: {
        'container-max-width': '1280px',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        brut: {
          "primary":          "#111111",
          "primary-content":  "#f3efe6",
          "secondary":        "#ff5227",
          "secondary-content":"#ffffff",
          "accent":           "#ffd43a",
          "accent-content":   "#111111",
          "neutral":          "#111111",
          "neutral-content":  "#f3efe6",
          "base-100":         "#f3efe6",
          "base-200":         "#e6e1d4",
          "base-300":         "#ffffff",
          "base-content":     "#111111",
          "--rounded-box":    "0rem",
          "--rounded-btn":    "0rem",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
