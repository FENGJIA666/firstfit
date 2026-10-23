import express from 'express';
import { randomBytes } from 'node:crypto';
import { taskTokens } from './task-token.js';
import { resolve } from 'node:path';
import { ApiError, parsePhoto, YouCamClient, type GarmentCategory } from './youcam.js';
interface Config { key?: string; liveEnabled?: boolean; maxTasks?: number; client?: YouCamClient; allowedOrigins?: string[]; serveStatic?: boolean }
export function createApp(config: Config = {}) {
  const app = express();
  const jobs = new Map<string, { providerId: string; created: number; lastPoll: number; result?: { status: string; imageUrl?: string } }>();
  const client = config.client || new YouCamClient(config.key || '');
  const enabled = Boolean(config.key && config.liveEnabled);
  const tokens = taskTokens(config.key || randomBytes(32).toString('hex'));
  const allowedOrigins = new Set(config.allowedOrigins || ['http://localhost:5193', 'http://127.0.0.1:5193', 'http://localhost:5194', 'http://127.0.0.1:5194']);
  let createdTasks = 0;
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.get('origin');
    if (req.path.startsWith('/api') && req.method !== 'GET' && origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: { code: 'ORIGIN', message: 'Open FirstFit in this browser to create your preview.' } });
    next();
  });
  app.use(express.json({ limit: '4mb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, liveEnabled: enabled, provider: 'YouCam AI Clothes V4', version: '0.1.0' }));
  app.post('/api/tryons', async (req, res) => {
    if (!enabled) throw new ApiError(503, 'LIVE_SETUP', 'Explore the illustrated lookbook while your live studio is being connected.');
    if (req.body?.consent !== true) throw new ApiError(400, 'CONSENT_REQUIRED', 'Confirm that you have permission to use these photos.');
    const category = req.body?.category as GarmentCategory;
    if (!['full_body', 'upper_body', 'lower_body', 'outer', 'shoes', 'auto'].includes(category)) throw new ApiError(400, 'CATEGORY', 'Choose the part of your outfit to preview.');
    const person = parsePhoto(req.body?.person);
    const garment = parsePhoto(req.body?.garment);
    if (createdTasks >= (config.maxTasks || 10)) throw new ApiError(429, 'SESSION_LIMIT', 'This studio session is complete. Restart the server when you’re ready for more previews.');
    // Reserve a slot before awaiting so parallel requests cannot overspend the cap.
    createdTasks++;
    const providerId = await client.create(person, garment, category);
    const receipt = { providerId, created: Date.now() };
    const id = tokens.seal(receipt);
    // This bounded cache is optional: encrypted receipts remain valid on a new instance.
    if (jobs.size >= 200) jobs.delete(jobs.keys().next().value!);
    jobs.set(id, { ...receipt, lastPoll: 0 });
    res.status(202).json({ id, status: 'running', provenance: 'youcam-live', pollAfterMs: 10_000 });
  });
  app.get('/api/tryons/:id', async (req, res) => {
    const receipt = tokens.open(req.params.id);
    if (!receipt) { jobs.delete(req.params.id); throw new ApiError(404, 'PREVIEW_EXPIRED', 'Create a fresh preview to see your next look.'); }
    const job = jobs.get(req.params.id) || { ...receipt, lastPoll: 0, result: undefined };
    if (jobs.size >= 200) jobs.delete(jobs.keys().next().value!);
    jobs.set(req.params.id, job);
    if (job.result) return res.json({ id: req.params.id, ...job.result, provenance: 'youcam-live' });
    if (Date.now() - job.lastPoll < 9_000) return res.json({ id: req.params.id, status: 'running', provenance: 'youcam-live', pollAfterMs: 10_000 });
    job.lastPoll = Date.now();
    const result = await client.status(job.providerId);
    if (result.status !== 'running') job.result = result;
    res.json({ id: req.params.id, ...result, provenance: 'youcam-live', pollAfterMs: 10_000 });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Choose a FirstFit action to continue.' } }));
  if (config.serveStatic !== false) {
    app.use(express.static(resolve('dist')));
    app.get('/', (_req, res) => res.sendFile(resolve('dist/index.html')));
  }
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PHOTO_SIZE', message: 'Choose a smaller photo so we can prepare your preview.' } });
    const known = error instanceof ApiError;
    res.status(known ? error.status : 500).json({ error: { code: known ? error.code : 'REQUEST_RETRY', message: known ? error.message : 'Let’s try that again. Your wardrobe plan is ready to explore.' } });
  });
  return app;
}
