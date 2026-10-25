/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        calm: '0 8px 28px -6px rgba(24, 52, 46, 0.08), 0 2px 6px -1px rgba(24, 52, 46, 0.04)',
        soft: '0 2px 10px rgba(24, 52, 46, 0.05)',
      },
      colors: {
        paper: {
          DEFAULT: '#F5F3EC',
          warm: '#EEEBE1',
          card: '#FCFBF7',
          border: '#E5E1D5',
          strong: '#CEC8B8',
        },
        ink: {
          DEFAULT: '#162824',
          muted: '#495C57',
          soft: '#60736E',
        },
        civic: {
          DEFAULT: '#1C443D',
          mid: '#2C6456',
          dark: '#14332D',
          light: '#E2EFE8',
          tile: '#BFD8CC',
          border: '#9AC2B0',
        },
        sky: {
          tile: '#C8DCF0',
          light: '#EBF3FA',
          ink: '#214B6E',
          badge: '#2D5F8B',
        },
        lavender: {
          tile: '#D9D2EB',
          light: '#F1EEF8',
          ink: '#3F316B',
          badge: '#564787',
        },
        coral: {
          tile: '#F2C6C2',
          light: '#FCEAE8',
          ink: '#7D201B',
          badge: '#C83E37',
        },
        ochre: {
          DEFAULT: '#A9520B',
          light: '#FDF3DC',
          border: '#E9B96E',
        },
        urgent: {
          DEFAULT: '#B93832',
          dark: '#8F241F',
          light: '#FCEAE8',
          border: '#E07A74',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"Roboto Mono"',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
