import { Check, ArrowUpRight, BriefcaseBusiness, Coffee, GraduationCap, Minus, Plus, Sparkles } from 'lucide-react';
import { catalog, money, scenes, type Scene } from '../lib/catalog';
import type { Plan } from '../lib/optimizer';
import { GarmentArt } from './Art';
const sceneIcons = { interview: GraduationCap, office: BriefcaseBusiness, social: Coffee };
export function Planner({ owned, setOwned, selectedScenes, setScenes, budget, setBudget, plan, onExplore }: {
  owned: string[]; setOwned: (value: string[]) => void; selectedScenes: Scene[]; setScenes: (value: Scene[]) => void;
  budget: number; setBudget: (value: number) => void; plan: Plan; onExplore: () => void;
}) {
  function toggleOwned(id: string) { setOwned(owned.includes(id) ? owned.filter(x => x !== id) : [...owned, id]); }
  function toggleScene(id: Scene) { setScenes(selectedScenes.includes(id) ? selectedScenes.filter(x => x !== id) : [...selectedScenes, id]); }
  return <section id="planner" className="planner section-wrap" aria-labelledby="planner-title">
    <div className="section-heading"><div><span className="eyebrow">01 / START WITH YOU</span><h2 id="planner-title">A wardrobe with a game plan.</h2></div><p>Your next chapter starts with the pieces<br className="desktop" /> you already love.</p></div>
    <div className="planner-layout">
      <div className="planner-inputs">
        <fieldset className="occasion-field"><legend>Where are you heading?</legend><div className="occasion-grid">{scenes.map(scene => { const Icon = sceneIcons[scene.id]; return <button key={scene.id} className={`occasion ${selectedScenes.includes(scene.id) ? 'selected' : ''}`} aria-pressed={selectedScenes.includes(scene.id)} onClick={() => toggleScene(scene.id)}><Icon size={21} /><span>{scene.short}</span>{selectedScenes.includes(scene.id) && <Check className="occasion-check" size={13} />}</button>; })}</div></fieldset>
        <div className="budget-field"><div className="field-heading"><label htmlFor="budget">Your budget for new pieces</label><div className="budget-number"><span>S$</span><input type="number" aria-label="Budget in Singapore dollars" min="0" max="250" step="1" value={budget} onChange={e => setBudget(Math.min(250, Math.max(0, Math.floor(Number(e.target.value)) || 0)))} /></div></div><input id="budget" type="range" min="0" max="250" step="1" value={budget} onChange={e => setBudget(Number(e.target.value))} /><div className="range-labels"><span>S$0 · work with what I own</span><span>S$250</span></div></div>
        <fieldset><legend>What is already in your wardrobe? <span className="count-label">{owned.length} selected</span></legend><p className="field-note">Choose your closest matches. Each one starts at S$0.</p><div className="wardrobe-grid">{catalog.map(item => <button className={`wardrobe-item ${owned.includes(item.id) ? 'selected' : ''}`} key={item.id} onClick={() => toggleOwned(item.id)} aria-pressed={owned.includes(item.id)} aria-label={`${item.name}, ${owned.includes(item.id) ? 'already owned' : 'add to wardrobe'}`}><div className="item-image"><GarmentArt item={item} /><span className="item-check">{owned.includes(item.id) ? <Check size={12} /> : <Plus size={12} />}</span></div><span>{item.name}</span></button>)}</div></fieldset>
      </div>
      <aside className="plan-summary" aria-live="polite">
        <div className="summary-top"><span className="eyebrow">YOUR CAPSULE, CALCULATED</span><Sparkles size={21} /></div>
        <h3>{plan.covered.length === selectedScenes.length && selectedScenes.length ? 'Big possibilities. Thoughtful additions.' : selectedScenes.length ? 'Your next look starts here.' : 'Choose your next occasion.'}</h3>
        <div className="summary-numbers"><div><strong>{plan.uniqueCombinations}</strong><span>unique combinations</span></div><div><strong>{plan.purchases.length}</strong><span>new pieces</span></div></div><p className="occasion-count">{plan.looks.length} occasion looks · familiar pieces styled for each moment</p>
        <div className="coverage-list">{scenes.filter(s => selectedScenes.includes(s.id)).map(scene => <div key={scene.id}><span>{scene.name}</span><span>{plan.covered.includes(scene.id) ? <><Check size={14} /> Ready to explore</> : 'Add pieces to unlock'}</span></div>)}</div>
        <div className="spend-row"><span>Your new-piece total</span><strong>{money(plan.cost)}</strong></div>
        <div className="budget-track"><span style={{ width: `${budget ? Math.min(100, plan.cost / budget * 100) : 0}%` }} /></div>
        <p className="remaining">{money(budget - plan.cost)} stays in your budget.</p>
        <button className="button light" onClick={onExplore} disabled={!plan.looks.length}>Explore your capsule <ArrowUpRight size={18} /></button>
        <details className="why-plan"><summary>Why this plan works</summary><p>We compared {plan.examined} combinations in your budget. Your plan prioritizes occasion coverage, then fewer new pieces, lower spend and more unique clothing combinations.</p><p>{plan.reuseCount} of your existing pieces feature in these looks. Styling rules come from our curated concept catalog. One combination can suit several occasions.</p></details>
      </aside>
    </div>
  </section>;
}
