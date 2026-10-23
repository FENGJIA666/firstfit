import 'dotenv/config';
import { createApp } from './app';
const port = Number(process.env.PORT) || 5194;
createApp({ key: process.env.YOUCAM_API_KEY, liveEnabled: process.env.YOUCAM_LIVE_ENABLED === 'true', maxTasks: Number(process.env.YOUCAM_MAX_TASKS_PER_SESSION) || 10 }).listen(port, '127.0.0.1', () => console.log(`FirstFit studio listening at http://127.0.0.1:${port}`));
