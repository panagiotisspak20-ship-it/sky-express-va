/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          magenta: '#E1007E',
          navy: '#003366',
          cyan: '#4CC9F0'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    }
  },
  safelist: [
    {
      pattern: /(bg|text|border)-sky-(navy|magenta|cyan)/,
      variants: ['hover', 'focus'],
    },
    {
        pattern: /from-sky-(navy|magenta|cyan)/,
    },
    {
        pattern: /to-sky-(navy|magenta|cyan)/,
    },
    {
      pattern: /(bg|text|border)-(amber|yellow|cyan|rose|orange|slate|blue|green|red|purple)-[0-9]{1,3}/,
      variants: ['hover', 'focus'],
    },
    {
        pattern: /from-(amber|yellow|cyan|rose|orange|slate|blue|green|red|purple)-[0-9]{1,3}/,
    },
    {
        pattern: /to-(amber|yellow|cyan|rose|orange|slate|blue|green|red|purple)-[0-9]{1,3}/,
    },
    'shadow-lg',
    'shadow-md',
    'shadow-sm',
    'rounded-xl',
    'rounded-full',
    'rounded-lg',
    'border-4',
    'border-2',
    'border-b-2'
  ],
  plugins: []
}
