/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Neo-brutalist palette — driven by CSS vars so the AI image
        //    generator can re-theme the whole site at runtime ──
        'surface':                   'rgb(var(--paper-rgb) / <alpha-value>)',
        'surface-dim':               '#e6e1d4',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#faf7f0',
        'surface-container':         '#ffffff',
        'surface-container-high':    '#fdfbf6',
        'surface-container-highest': '#ffffff',
        'on-surface':                'rgb(var(--ink-rgb) / <alpha-value>)',
        'on-surface-variant':        '#3d3a33',
        'outline':                   'rgb(var(--ink-rgb) / <alpha-value>)',
        'outline-variant':           '#c9c2b2',
        'primary':                   'rgb(var(--ink-rgb) / <alpha-value>)',
        'on-primary':                'rgb(var(--paper-rgb) / <alpha-value>)',
        'primary-container':         'rgb(var(--acid-rgb) / <alpha-value>)',
        'secondary':                 '#3d3a33',
        'on-secondary':              '#ffffff',
        'secondary-container':       'rgb(var(--acid-rgb) / <alpha-value>)',
        'background':                'rgb(var(--paper-rgb) / <alpha-value>)',
        'on-background':             'rgb(var(--ink-rgb) / <alpha-value>)',
        'surface-variant':           '#e6e1d4',
        // accents
        'acid':                      'rgb(var(--acid-rgb) / <alpha-value>)',
        'punch':                     'rgb(var(--punch-rgb) / <alpha-value>)',
        'volt':                      'rgb(var(--volt-rgb) / <alpha-value>)',
        'ink':                       'rgb(var(--ink-rgb) / <alpha-value>)',
        'paper':                     'rgb(var(--paper-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', '"Noto Sans TC"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'brut':    '6px 6px 0 rgb(var(--ink-rgb))',
        'brut-sm': '3px 3px 0 rgb(var(--ink-rgb))',
        'brut-lg': '10px 10px 0 rgb(var(--ink-rgb))',
        'brut-acid': '6px 6px 0 rgb(var(--acid-rgb))',
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
