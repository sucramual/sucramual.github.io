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
          'background': '#FFFAF0',
          'text': '#1e3a8a',    // Deep navy blue
          'link': '#2563eb',    // Vibrant blue
          'link-hover': '#1d4ed8' // Darker blue for hover
        },
        typography: {
          DEFAULT: {
            css: {
              color: '#1e3a8a', // Matching our text color
              a: {
                color: '#2563eb', // Matching our link color
                '&:hover': {
                  color: '#1d4ed8', // Matching our hover color
                },
              },
              h1: {
                color: '#1e3a8a',
                fontWeight: '600',
              },
              h2: {
                color: '#1e3a8a',
                fontWeight: '600',
              },
              strong: {
                color: '#1e3a8a',
              },
              code: {
                color: '#1e3a8a',
              },
              figcaption: {
                color: '#475569', // A softer gray for secondary text
              },
            },
          },
        },
      },
    },
    plugins: [require("@tailwindcss/typography")],
  };