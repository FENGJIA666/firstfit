import { createApp } from './app.js';
const hosts = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL].filter(Boolean);
export default createApp({
  key: process.env.YOUCAM_API_KEY,
  liveEnabled: process.env.YOUCAM_LIVE_ENABLED === 'true',
  // Free public judging access: the local per-process demonstration cap is disabled.
  maxTasks: Infinity,
  allowedOrigins: [...hosts.map(host => `https://${host}`), ...(process.env.FIRSTFIT_PUBLIC_ORIGIN ? [process.env.FIRSTFIT_PUBLIC_ORIGIN] : [])],
  serveStatic: false,
});
