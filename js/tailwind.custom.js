/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // For HTML files in the root directory
    "./js/**/*.js", // For JS files in the js directory and its subdirectories
    // Add other paths if your HTML/JS files are located elsewhere
  ],
  theme: {
    extend: {
      colors: {
        // It's common to define base colors here if they are not already CSS variables
        // For example, if --primary and --secondary are from the original script's logic:
        // primary: '#f9c78b',
        // secondary: '#7e7267',
        // Or, if they are defined in a CSS file like css/custom.css,
        // you can reference them conceptually or decide to duplicate them here.
        // For now, assuming they might be used as CSS vars:
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      },
      borderColor: {
        // Preserving primary and secondary as per instruction
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        // Adding new region-specific border colors
        'region-taiwan': 'var(--color-region-taiwan)',
        'region-hkmo': 'var(--color-region-hkmo)',
        'region-neasia': 'var(--color-region-neasia)',
        'region-seasia': 'var(--color-region-seasia)',
        'region-namerica': 'var(--color-region-namerica)',
      }
    },
  },
  plugins: [
    // You might eventually use a plugin to read from the original js/settings.js
    // or the CSS variables in css/custom.css if you want a more dynamic config.
    // For now, this is a static configuration per the task.
  ],
};