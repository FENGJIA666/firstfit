import { useEffect, useRef, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { byId, looks, scenes } from '../lib/catalog';
import { LookVisual } from './Art';
import { lookSourceLabel, type LivePreview } from '../lib/demo-assets';
export function SavedLooks({ saved, livePreviews, onClose, onRemove, onRemoveLive }: { saved: string[]; livePreviews: LivePreview[]; onClose: () => void; onRemove: (id: string) => void; onRemoveLive: (id: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="saved-dialog" aria-labelledby="saved-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><button className="dialog-close" aria-label="Close saved looks" onClick={onClose}><X size={20} /></button><span className="eyebrow">YOUR PERSONAL SHORTLIST</span><h2 id="saved-title">Looks worth keeping.</h2><p className="saved-intro">Compare your favorites side by side. Personal live previews stay in this open session; your styling shortlist stays in this browser.</p>{saved.length + livePreviews.length ? <div className="saved-grid">{livePreviews.map(preview => <LiveCard key={preview.id} preview={preview} onRemove={() => onRemoveLive(preview.id)} />)}{saved.map(id => looks.find(look => look.id === id)).filter(x => !!x).map(look => <article key={look.id}><LookVisual look={look} /><span className="source-label">{lookSourceLabel(look.id)}</span><span className="eyebrow">{scenes.find(s => s.id === look.scene)?.short}</span><h3>{look.name}</h3><p>{look.items.map(id => byId[id].name).join(' + ')}</p><button className="text-button" onClick={() => onRemove(look.id)}>Remove from saved</button></article>)}</div> : <div className="empty-state"><Bookmark size={26} /><h3>Start your personal shortlist.</h3><p>Tap the bookmark on any look, or save a live preview from your styling studio.</p><button className="button primary" onClick={onClose}>Explore my looks</button></div>}<p className="catalog-note">Recorded YouCam examples use an original fictional adult model. Personal previews are labeled “Your live preview”.</p></dialog>;
}

function LiveCard({ preview, onRemove }: { preview: LivePreview; onRemove: () => void }) {
  const [showingSource, setShowingSource] = useState(false);
  const look = looks.find(look => look.id === preview.lookId);
  return <article><img className="look-photo" src={showingSource ? preview.beforePreview : preview.resultUrl} alt={showingSource ? 'Your original source photo' : 'Your saved live YouCam preview'} referrerPolicy="no-referrer" /><span className="source-label">Your live preview · this session</span><h3>{look?.name || 'My next look'}</h3><p>A personal YouCam result, ready to compare with your shortlist.</p><button className="text-button" onClick={() => setShowingSource(!showingSource)}>{showingSource ? 'Show my preview' : 'Compare my source'}</button><button className="text-button remove-live" onClick={onRemove}>Remove this preview</button></article>;
}
