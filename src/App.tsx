import { ArrowDown, ArrowUpRight, Bookmark, Check, Leaf, MoveUpRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { looks, type Look, type Scene } from './lib/catalog';
import { exportPlan, makePlan } from './lib/optimizer';
import { LookVisual } from './components/Art';
import { Planner } from './components/Planner';
import { Lookbook } from './components/Lookbook';
import { TryOn } from './components/TryOn';
import { SavedLooks } from './components/SavedLooks';
import type { LivePreview } from './lib/demo-assets';

export default function App() {
  const [owned, setOwned] = useState(['shirt', 'trousers', 'sneakers']);
  const [selectedScenes, setScenes] = useState<Scene[]>(['interview', 'office', 'social']);
  const [budget, setBudget] = useState(140);
  const [saved, setSaved] = useState<string[]>(() => { try { const data = JSON.parse(localStorage.getItem('firstfit-saved') || '[]'); return Array.isArray(data) ? data.filter((id: unknown) => looks.some(look => look.id === id)) : []; } catch { return []; } });
  const [activeLook, setActiveLook] = useState<Look>();
  const [showSaved, setShowSaved] = useState(false);
  const [livePreviews, setLivePreviews] = useState<LivePreview[]>([]);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [toast, setToast] = useState('');
  const plan = useMemo(() => makePlan(owned, selectedScenes, budget), [owned, selectedScenes, budget]);
  useEffect(() => { fetch('/api/health').then(r => r.json()).then(data => setLiveEnabled(data.liveEnabled === true)).catch(() => {}); }, []);
  useEffect(() => { try { localStorage.setItem('firstfit-saved', JSON.stringify(saved)); } catch { /* The current browser session still supports saved looks. */ } }, [saved]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3000); return () => clearTimeout(id); }, [toast]);
  function toggleSaved(id: string) { setSaved(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]); }
  function download() {
    const url = URL.createObjectURL(new Blob([exportPlan(plan, budget)], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'My-FirstFit-Capsule.md'; link.click(); URL.revokeObjectURL(url); setToast('Your capsule plan is ready to take with you.');
  }
  return <>
    <a className="skip-link" href="#planner">Skip to wardrobe planner</a>
    <header className="site-header"><a className="wordmark" href="#"><span className="brand-icon">f<span>f</span></span>firstfit</a><nav aria-label="Main navigation"><a href="#planner">My wardrobe</a><a href="#lookbook">My lookbook</a><a href="#shopping-plan">My plan</a></nav><button className="header-save" onClick={() => setShowSaved(true)}><Bookmark size={17} /><span>Saved</span><b>{saved.length + livePreviews.length}</b></button></header>
    <main>
      <section className="hero section-wrap" aria-labelledby="hero-title"><div className="hero-copy"><span className="pill"><span /> YOUR NEXT CHAPTER, STYLED BY YOU</span><h1 id="hero-title">Big first step.<br /><em>Perfectly you.</em></h1><p>Turn the wardrobe you own into the confidence you take with you. A few thoughtful pieces. A whole world of first impressions.</p><div className="hero-actions"><a className="button primary" href="#planner">Build my first capsule <ArrowUpRight size={18} /></a><button className="text-button" onClick={() => setActiveLook(looks[0])}>Explore a look <ArrowUpRight size={16} /></button></div><div className="hero-proof"><span><Check size={15} /> Your wardrobe first</span><span><Check size={15} /> Your budget, respected</span></div></div>
      <div className="hero-art"><div className="hero-photo"><LookVisual look={looks[0]} /><span className="art-note">FIRSTFIT / STYLE STUDY 001</span></div><div className="hero-sticker"><Sparkles size={18} /><span>One new chapter.<br /><strong>So many ways to show up.</strong></span></div><div className="floating-label"><span className="round-arrow"><MoveUpRight size={17} /></span><div><strong>Build on what’s already you.</strong><span>Familiar pieces. Fresh possibilities.</span></div></div><span className="hero-art-caption">Recorded YouCam result · fictional adult model</span></div></section>
      <div className="value-strip"><div><Leaf size={18} /><span>Start with what you own</span></div><span className="strip-dot">✦</span><div><span>Make every new piece count</span></div><span className="strip-dot">✦</span><div><span>See it with YouCam AI</span><ArrowUpRight size={16} /></div></div>
      <Planner owned={owned} setOwned={setOwned} selectedScenes={selectedScenes} setScenes={setScenes} budget={budget} setBudget={setBudget} plan={plan} onExplore={() => document.getElementById('lookbook')?.scrollIntoView({ behavior: 'smooth' })} />
      <Lookbook plan={plan} saved={saved} liveSavedCount={livePreviews.length} onSave={toggleSaved} onTry={setActiveLook} onExport={download} onCompare={() => setShowSaved(true)} />
      <section className="closing-note section-wrap"><span className="eyebrow">YOUR OPPORTUNITY. YOUR STYLE.</span><h2>You bring the ambition.<br /><em>We’ll help with the outfit.</em></h2><a href="#planner" className="circle-link" aria-label="Back to wardrobe planner"><ArrowUpRight size={28} /></a></section>
    </main>
    <footer className="site-footer"><a className="wordmark" href="#">firstfit.</a><p>A thoughtful start, from wardrobe to workday.</p><span>Built with YouCam AI Clothes V4</span></footer>
    {activeLook && <TryOn look={activeLook} liveEnabled={liveEnabled} onClose={() => setActiveLook(undefined)} onSaveLive={preview => { setLivePreviews(current => [...current, preview]); setToast('Your live preview is saved for this session.'); }} />}
    {showSaved && <SavedLooks saved={saved} livePreviews={livePreviews} onClose={() => setShowSaved(false)} onRemove={toggleSaved} onRemoveLive={id => setLivePreviews(current => current.filter(preview => preview.id !== id))} />}
    {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
  </>;
}
