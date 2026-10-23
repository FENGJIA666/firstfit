import { byId, catalog, looks, type Look, type Scene } from './catalog';
export interface Plan { owned: string[]; purchases: string[]; cost: number; looks: Look[]; uniqueCombinations: number; covered: Scene[]; requested: Scene[]; reuseCount: number; examined: number }
export const countCombinations = (items: Look[]) => new Set(items.map(look => [...look.items].sort().join('|'))).size;
/** Exhaustive set-cover search over the ten-piece concept catalog. Priority is:
 * covered scenes, fewer new pieces, lower spend, then more unique clothing combinations. */
export function makePlan(ownedInput: string[], requested: Scene[], budget: number): Plan {
  const owned = [...new Set(ownedInput)].filter(id => Object.hasOwn(byId, id));
  const desired = [...new Set(requested)];
  const safeBudget = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0;
  const candidates = catalog.filter(item => !owned.includes(item.id));
  let best: Plan = { owned, purchases: [], cost: 0, looks: [], uniqueCombinations: 0, covered: [], requested: desired, reuseCount: 0, examined: 0 };
  let examined = 0;
  for (let mask = 0; mask < 2 ** candidates.length; mask++) {
    const purchases = candidates.filter((_, index) => mask & (1 << index)).map(item => item.id);
    const cost = purchases.reduce((sum, id) => sum + byId[id].price, 0);
    if (cost > safeBudget) continue;
    examined++;
    const available = new Set([...owned, ...purchases]);
    const matching = looks.filter(look => desired.includes(look.scene) && look.items.every(id => available.has(id)));
    const covered = desired.filter(scene => matching.some(look => look.scene === scene));
    const plan: Plan = { owned, purchases, cost, looks: matching, uniqueCombinations: countCombinations(matching), covered, requested: desired, reuseCount: owned.filter(id => matching.some(look => look.items.includes(id))).length, examined: 0 };
    const better = covered.length > best.covered.length ||
      (covered.length === best.covered.length && (purchases.length < best.purchases.length ||
      (purchases.length === best.purchases.length && (cost < best.cost ||
      (cost === best.cost && plan.uniqueCombinations > best.uniqueCombinations)))));
    if (better || mask === 0) best = plan;
  }
  return { ...best, examined };
}
export function exportPlan(plan: Plan, budget: number): string {
  return ['# Your FirstFit capsule', '', 'Make your first impression yours.', '',
    `Budget: ${money(budget)} | New pieces: ${plan.purchases.length} | Planned spend: ${money(plan.cost)}`,
    `Occasions covered: ${plan.covered.length}/${plan.requested.length} | Unique combinations: ${plan.uniqueCombinations} | Occasion looks: ${plan.looks.length}`, '',
    '## Build on what you own', ...plan.owned.map(id => `- ${byId[id].name}`), '',
    '## Your next pieces', ...(plan.purchases.length ? plan.purchases.map(id => `- ${byId[id].name} (${byId[id].colorName}) — ${money(byId[id].price)}`) : [plan.requested.length && plan.covered.length === plan.requested.length ? '- Your current pieces cover every selected occasion.' : '- Your plan starts with the pieces you own. Add wardrobe items or adjust your budget to unlock more occasions.']), '',
    '## Your lookbook', ...plan.looks.map(look => `- ${look.name}: ${look.items.map(id => byId[id].name).join(' + ')}. ${look.note}`), '',
    '## How this plan was selected',
    `FirstFit compared ${plan.examined} within-budget combinations, prioritized occasion coverage, then fewer new pieces, lower spend, and more unique clothing combinations.`,
    'This is a curated concept catalog with illustrative Singapore-dollar prices. Use the item descriptions as a shopping checklist and confirm the retailer’s current price and sizing.',
    'YouCam live previews are generated from the photos you choose. Illustrated previews are labeled separately.', '',
  ].join('\n');
}
function money(amount: number) { return `S$${amount}`; }
