/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "src/**/*.stories.{tsx,jsx}",
  port: Number(process.env.LADLE_PORT) || 61000,
  viteConfig: ".ladle/vite.config.mjs",
};
