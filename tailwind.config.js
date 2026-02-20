/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,njk,md}"],
  theme: {
    fontFamily: {
      serif: [
        "Spectral",
        "Source Serif Pro",
        "Apple Garamond",
        "Baskerville",
        "Libre Baskerville",
        "Droid Serif",
        "Times New Roman",
        "Times",
        "serif",
        "ui-serif",
        "Noto Emoji",
        "Quivira",
      ],
      sans: [
        "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
      ],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
      ],
    },
    screens: {
      desktop: "1400px",
      tablet: "600px",
    },
    extend: {
      colors: {
        'background': '#FFFCF0', /* Flexoki light background */
        'text': '#100F0F',       /* Flexoki dark text */
        'link': '#100F0F',       /* Flexoki black link */
        'link-hover': '#24837B', /* Flexoki cyan hover */
        'ui-normal': '#CECDC3',   /* Flexoki faint gray */

        /* Charles O'Neill Custom Pill Colors */
        'ai-bg': '#e8f4f8',      /* AI Button Background */
        'ai-text': '#1e5a7d',    /* AI Button Text */
        'other-bg': '#fdf6e8',   /* Other Button Background */
        'other-text': '#b8860b'  /* Other Button Text */
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#100F0F', // Matching our text color
            a: {
              color: '#100F0F', // Matching our link color
              textDecorationColor: '#CECDC3', // Faint gray underline
              '&:hover': {
                color: '#24837B', // Matching our hover color
              },
            },
            h1: {
              color: '#100F0F',
              fontWeight: '600',
            },
            h2: {
              color: '#100F0F',
              fontWeight: '600',
            },
            strong: {
              color: '#100F0F',
            },
            code: {
              color: '#100F0F',
            },
            figcaption: {
              color: '#878580', // Flexoki mutted text
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};