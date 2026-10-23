// Run only with authorization to consume the displayed YouCam units.
// Uses original fictional-adult assets. Never writes credentials or signed URLs.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'http://127.0.0.1:5194';
const assets = 'public/assets/generated/';
const hash = data => createHash('sha256').update(data).digest('hex');
const photo = async name => { const bytes = await readFile(assets + name); return { data: bytes.toString('base64'), contentType: bytes[0] === 255 ? 'image/jpeg' : 'image/png', name }; };
const steps = [
  { name: 'meeting-ready', category: 'shoes', source: 'firstfit-adult-model-oxford.png', reference: 'city-loafer-espresso.png', output: 'youcam-meeting-ready.jpg' },
  { name: 'first-impression', category: 'outer', source: 'youcam-meeting-ready.jpg', reference: 'signature-blazer-soft-olive.png', output: 'youcam-first-impression.jpg' },
];
const evidence = await readFile('evidence/youcam-live-validation.json', 'utf8').then(JSON.parse).catch(() => ({ recordedAt: new Date().toISOString(), provider: 'YouCam AI Clothes V4', route: '/s2s/v2.0/task/cloth-v4', verifiedUnitsPerResult: 2, origin: 'Original image-generated fictional adult and concept garments', steps: [] }));
for (const step of steps) {
  const previous = evidence.steps.find(record => record.name === step.name && record.status === 'success');
  if (previous) {
    const existing = await readFile(assets + previous.output);
    if (hash(existing) !== previous.outputSha256) throw new Error(`Recorded output hash changed for ${step.name}; review the artifact before generating again.`);
    console.log(JSON.stringify({ step: step.name, status: 'already-verified' })); continue;
  }
  const start = Date.now();
  const response = await fetch(`${base}/api/tryons`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5193' }, body: JSON.stringify({ person: await photo(step.source), garment: await photo(step.reference), category: step.category, consent: true }) });
  const created = await response.json();
  if (!response.ok) throw new Error(`Create ${step.name}: HTTP ${response.status}, ${created.error?.code}`);
  console.log(JSON.stringify({ step: step.name, status: 'accepted', provenance: created.provenance }));
  let completed = false;
  for (let poll = 0; poll < 60; poll++) {
    await new Promise(resolve => setTimeout(resolve, 10_000));
    const statusResponse = await fetch(`${base}/api/tryons/${encodeURIComponent(created.id)}`);
    const result = await statusResponse.json();
    if (!statusResponse.ok) throw new Error(`Status ${step.name}: HTTP ${statusResponse.status}, ${result.error?.code}`);
    if (result.status === 'error') throw new Error(`YouCam processing failed for ${step.name}`);
    if (result.status !== 'success') continue;
    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) throw new Error(`Download ${step.name}: HTTP ${imageResponse.status}`);
    const image = Buffer.from(await imageResponse.arrayBuffer());
    await writeFile(assets + step.output, image);
    evidence.steps.push({ name: step.name, category: step.category, source: step.source, sourceSha256: hash(await readFile(assets + step.source)), reference: step.reference, referenceSha256: hash(await readFile(assets + step.reference)), output: step.output, outputSha256: hash(image), bytes: image.length, taskFingerprint: hash(created.id), status: 'success', elapsedMs: Date.now() - start, unitsAtPublishedCost: 2, provenance: result.provenance });
    await writeFile('evidence/youcam-live-validation.json', JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ step: step.name, status: 'success', output: step.output, elapsedSeconds: Math.round((Date.now() - start) / 1000), bytes: image.length }));
    completed = true; break;
  }
  if (!completed) throw new Error(`Timed out waiting for ${step.name}; no additional request was submitted.`);
}
