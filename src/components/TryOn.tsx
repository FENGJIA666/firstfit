import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ImagePlus, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import { type Look } from '../lib/catalog';
import { LookVisual } from './Art';
import { assetRoot, lookSourceLabel, recordedLooks, type LivePreview } from '../lib/demo-assets';
import { readPhoto, type Photo } from '../lib/photo';
export function TryOn({ look, liveEnabled, onClose, onSaveLive }: { look: Look; liveEnabled: boolean; onClose: () => void; onSaveLive: (preview: LivePreview) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stopped = useRef(false);
  const [mode, setMode] = useState<'illustrated' | 'live'>('illustrated');
  const [person, setPerson] = useState<Photo>();
  const [garment, setGarment] = useState<Photo>();
  const [category, setCategory] = useState('outer');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'uploading' | 'running' | 'success'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [savedLive, setSavedLive] = useState(false);
  const recorded = recordedLooks[look.id];
  useEffect(() => { dialog.current?.showModal(); return () => { stopped.current = true; }; }, []);
  async function selectPhoto(file: File | undefined, target: 'person' | 'garment') {
    if (!file) return;
    try { const photo = await readPhoto(file); target === 'person' ? setPerson(photo) : setGarment(photo); setError(''); setState('idle'); setResult(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Choose another photo to continue.'); }
  }
  async function useDemoPhotos() {
    const source = recorded?.source || 'firstfit-adult-model-oxford.png';
    const reference = recorded?.reference || 'signature-blazer-soft-olive.png';
    try {
      const load = async (name: string) => { const response = await fetch(assetRoot + name); if (!response.ok) throw new Error('Choose your own photos to begin.'); const blob = await response.blob(); return readPhoto(new File([blob], name, { type: blob.type })); };
      const [personPhoto, garmentPhoto] = await Promise.all([load(source), load(reference)]);
      setPerson(personPhoto); setGarment(garmentPhoto); setCategory(recorded?.category || 'outer'); setError(''); setConsent(false); setResult(''); setState('idle');
    } catch (e) { setError(e instanceof Error ? e.message : 'Choose your photos to begin.'); }
  }
  async function generate() {
    if (!person || !garment || !consent) return;
    setState('uploading'); setError(''); setResult(''); setSavedLive(false); stopped.current = false;
    try {
      const wirePhoto = (photo: Photo) => ({ data: photo.data, contentType: photo.contentType, name: photo.name });
      const response = await fetch('/api/tryons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person: wirePhoto(person), garment: wirePhoto(garment), category, consent }) });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error?.message || 'Please try again in a moment.');
      setState('running');
      for (let poll = 0; poll < 60; poll++) {
        await new Promise(resolve => setTimeout(resolve, 10_000));
        if (stopped.current) return;
        const statusResponse = await fetch(`/api/tryons/${encodeURIComponent(created.id)}`);
        const status = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(status.error?.message || 'Please try again in a moment.');
        if (status.status === 'success' && status.imageUrl) { setResult(status.imageUrl); setState('success'); return; }
        if (status.status === 'error') throw new Error('Let’s refresh the photos: one person facing forward, and a clear view of the garment.');
      }
      throw new Error('Your preview is taking extra time. Your capsule is saved in this session; return to explore it while you wait.');
    } catch (e) { if (!stopped.current) { setError(e instanceof Error ? e.message : 'Please try again in a moment.'); setState('idle'); } }
  }
  const busy = state === 'uploading' || state === 'running';
  return <dialog ref={dialog} className="studio-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="studio-title">
    <button className="dialog-close" aria-label="Close styling studio" onClick={onClose}><X size={20} /></button>
    <div className="studio-visual">{mode === 'live' && result ? <img src={showOriginal ? person?.preview : result} alt={showOriginal ? 'Your original photo' : 'Your live YouCam virtual try-on result'} referrerPolicy="no-referrer" /> : mode === 'live' && person ? <img src={person.preview} alt="Your chosen source photo" /> : recorded && showOriginal ? <img src={assetRoot + recorded.source} alt="Source photo used for this recorded YouCam result" /> : <LookVisual look={look} />}
      <span className="studio-badge">{mode === 'live' && result && !showOriginal ? 'YouCam AI · live result' : mode === 'live' && person ? 'Your source photo' : recorded && showOriginal ? 'Source for this YouCam result' : lookSourceLabel(look.id)}</span>
      {busy && <div className="studio-loading"><LoaderCircle className="spin" size={30} /><strong>{state === 'uploading' ? 'Preparing your studio' : 'Bringing your look to life'}</strong><span>Your YouCam preview is on its way.</span></div>}
      {((result && mode === 'live') || (recorded && mode === 'illustrated')) && <button className="compare-original" onClick={() => setShowOriginal(!showOriginal)}><RefreshCw size={15} />{showOriginal ? 'Show new look' : 'Compare source'}</button>}
    </div>
    <div className="studio-controls"><span className="eyebrow">THE FIRSTFIT STYLING STUDIO</span><h2 id="studio-title">See your<br /><em>next chapter.</em></h2><p className="studio-look-name">{look.name}</p>
      <div className="studio-tabs" role="group" aria-label="Preview type"><button className={mode === 'illustrated' ? 'active' : ''} onClick={() => setMode('illustrated')} disabled={busy}>{recorded ? 'Recorded YouCam demo' : 'Style preview'}</button><button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')} disabled={busy}>Live YouCam preview</button></div>
      {mode === 'illustrated' ? <div className="illustration-copy"><h3>{recorded ? 'A real preview. A fresh possibility.' : 'Explore the styling idea.'}</h3><p>{look.note}</p><p>{recorded ? 'This recorded result was generated by YouCam AI Clothes V4 using an original fictional adult model and our concept garment. Compare it with its source, then make a preview your own.' : 'This styling study shows the outfit combination. Add your photo and a garment photo in the live studio for a personalized YouCam preview.'}</p><button className="button primary" onClick={() => setMode('live')}>Make it personal <ArrowRight size={16} /></button></div> : <>
        <p className="studio-intro">Try one garment at a time. Add a clear, front-facing photo of yourself and the item you want to explore.</p>
        <button className="demo-photo-button" disabled={busy} onClick={useDemoPhotos}><Sparkles size={13} /> Use fictional demo model + matching garment</button>
        <div className="upload-grid">{(['person', 'garment'] as const).map(target => <label className="upload-box" key={target}>{(target === 'person' ? person : garment) ? <Check size={24} /> : <ImagePlus size={24} />}<strong>{target === 'person' ? 'Your photo' : 'Garment photo'}</strong><span>{(target === 'person' ? person : garment) ? 'Photo ready · change' : 'JPG or PNG · up to 8 MB'}</span><input type="file" accept="image/jpeg,image/png" aria-label={target === 'person' ? 'Upload your photo' : 'Upload garment photo'} disabled={busy} onChange={e => selectPhoto(e.target.files?.[0], target)} /></label>)}</div>
        <label className="category-label">What are you trying on?<select value={category} disabled={busy} onChange={e => setCategory(e.target.value)}><option value="outer">Outerwear · blazer or jacket</option><option value="upper_body">Top · shirt or knit</option><option value="lower_body">Lower body · worn reference</option><option value="full_body">Full outfit · worn reference</option><option value="shoes">Shoes</option><option value="auto">Let YouCam identify it</option></select></label>
        <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={busy} /><span>I have permission to use these photos and agree to send them to YouCam to create my preview.</span></label>
        <p className="privacy-note">Photos stay in this browser until you generate. YouCam then processes your selected photos. <a href="https://docs.perfectcorp.com/develop/file_retention_period" target="_blank" rel="noreferrer">See YouCam’s file retention policy.</a></p>
        {!liveEnabled && <p className="setup-note">Your illustrated studio is ready. Connect your YouCam account and units on the local server to activate personalized previews.</p>}
        <button className="button primary" disabled={!liveEnabled || !person || !garment || !consent || busy} onClick={generate}>{busy ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}{busy ? 'Creating your preview' : result ? 'Create another preview' : 'Generate my preview'}</button><p className="unit-note">Live previews are free to explore with FirstFit’s event credits.</p>
        {result && person && <button className="button save-live" disabled={savedLive} onClick={() => { onSaveLive({ id: crypto.randomUUID(), lookId: look.id, resultUrl: result, beforePreview: person.preview }); setSavedLive(true); }}><Check size={16} />{savedLive ? 'Saved for this session' : 'Save my preview'}</button>}
      </>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  </dialog>;
}
