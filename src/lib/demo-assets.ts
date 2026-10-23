// Recorded examples are produced by the real YouCam API from an original,
// fictional adult model. Provenance is recorded in evidence/youcam-live-validation.json.
export const assetRoot = '/assets/generated/';
export interface LivePreview { id: string; lookId: string; resultUrl: string; beforePreview: string }
export const garmentPhotos: Record<string, string> = {
  shirt: 'everyday-oxford-warm-white.png', trousers: 'tailored-trouser-midnight.png',
  sneakers: 'everyday-sneaker-chalk.png', blazer: 'signature-blazer-soft-olive.png',
  loafers: 'city-loafer-espresso.png',
};
export const recordedLooks: Record<string, { file: string; source: string; reference: string; category: string }> = {
  'meeting-ready': { file: 'youcam-meeting-ready.jpg', source: 'firstfit-adult-model-oxford.png', reference: 'city-loafer-espresso.png', category: 'shoes' },
  'first-impression': { file: 'youcam-first-impression.jpg', source: 'youcam-meeting-ready.jpg', reference: 'signature-blazer-soft-olive.png', category: 'outer' },
};
export const originalLooks = ['day-one', 'after-five'];
export function lookSourceLabel(id: string) { return recordedLooks[id] ? 'Recorded YouCam result' : originalLooks.includes(id) ? 'Original fictional model' : 'Style illustration'; }
