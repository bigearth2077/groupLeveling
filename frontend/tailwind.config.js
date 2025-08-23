// @ts-nocheck
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    // v5: 必须显式写出要启用的主题
    themes: ["lemonade", "coffee"],
  },
}
