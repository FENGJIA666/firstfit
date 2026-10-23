import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog, looks, type Scene } from '../src/lib/catalog';
import { makePlan, exportPlan, type Plan } from '../src/lib/optimizer';

const ids = catalog.map(item => item.id);
const allScenes: Scene[] = ['interview', 'office', 'social'];
const prices = new Map(catalog.map(item => [item.id, item.price]));
type Objective = [number, number, number, number];
const objective = (plan: Pick<Plan, 'covered' | 'purchases' | 'cost' | 'looks'>): Objective =>
  [-plan.covered.length, plan.purchases.length, plan.cost, -new Set(plan.looks.map(look => [...look.items].sort().join("|"))).size];
const compare = (a: Objective, b: Objective) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

/** Independent oracle enumerates one witness outfit (or none) per occasion,
 * rather than enumerating purchase subsets as the production solver does.
 * Any minimum-cardinality optimal basket is the union of its witness outfits.
 */
function oracle(ownedInput: string[], requested: Scene[], budget: number): Objective {
  const owned = new Set(ownedInput.filter(id => ids.includes(id)));
  const desired = [...new Set(requested)];
  const allowance = Number.isFinite(budget) ? Math.max(0, budget) : 0;
  const baskets = new Map<string, string[]>();
  function choose(index: number, items: string[]) {
    if (index === desired.length) {
      const purchases = [...new Set(items)].filter(id => !owned.has(id)).sort();
      baskets.set(purchases.join('|'), purchases);
      return;
    }
    choose(index + 1, items);
    for (const look of looks.filter(look => look.scene === desired[index])) {
      choose(index + 1, [...items, ...look.items]);
    }
  }
  choose(0, []);
  const scores: Objective[] = [];
  for (const purchases of baskets.values()) {
    const cost = purchases.reduce((sum, id) => sum + prices.get(id)!, 0);
    if (cost > allowance) continue;
    const available = new Set([...owned, ...purchases]);
    const matching = looks.filter(look => desired.includes(look.scene) && look.items.every(id => available.has(id)));
    const covered = new Set(matching.map(look => look.scene));
    scores.push([-covered.size, purchases.length, cost, -new Set(matching.map(look => [...look.items].sort().join("|"))).size]);
  }
  return scores.sort(compare)[0];
}

function assertCoherent(plan: Plan, budget: number) {
  assert.equal(new Set(plan.purchases).size, plan.purchases.length, 'purchase SKUs are unique');
  assert.ok(plan.purchases.every(id => ids.includes(id) && !plan.owned.includes(id)));
  assert.equal(plan.cost, plan.purchases.reduce((sum, id) => sum + prices.get(id)!, 0));
  assert.ok(plan.cost <= Math.max(0, budget), 'selected basket respects the budget');
  const available = new Set([...plan.owned, ...plan.purchases]);
  assert.ok(plan.looks.every(look => plan.requested.includes(look.scene) && look.items.every(id => available.has(id))));
  assert.deepEqual([...new Set(plan.looks.map(look => look.scene))].sort(), [...plan.covered].sort());
}

test('independent outfit-union oracle agrees across 539 wardrobe / occasion / budget combinations', () => {
  const wardrobes = [[], ['shirt', 'trousers', 'sneakers'], ['tee', 'skirt', 'sneakers'],
    ['shirt', 'trousers', 'blazer'], ['loafers'], ['knit', 'linen', 'sneakers'], ids];
  const budgets = [0, 15, 28, 42, 58, 59, 60, 100, 101, 150, 336];
  let checked = 0;
  for (const owned of wardrobes) for (let sceneMask = 1; sceneMask < 8; sceneMask++) {
    const requested = allScenes.filter((_, index) => sceneMask & 2 ** index);
    for (const budget of budgets) {
      const actual = makePlan(owned, requested, budget);
      assert.deepEqual(objective(actual), oracle(owned, requested, budget), JSON.stringify({ owned, requested, budget }));
      assertCoherent(actual, budget);
      checked++;
    }
  }
  assert.equal(checked, 539);
});

test('S$101 completes three occasions with exactly a blazer and loafers', () => {
  const plan = makePlan(['shirt', 'trousers', 'sneakers'], allScenes, 101);
  assert.deepEqual(plan.purchases.slice().sort(), ['blazer', 'loafers']);
  assert.equal(plan.cost, 101);
  assert.equal(plan.covered.length, 3);
  assert.equal(plan.looks.length, 5);
  assert.equal(plan.uniqueCombinations, 4);
  assert.equal(plan.reuseCount, 3);
});

test('a S$1 budget boundary and existing blazer change the basket exactly', () => {
  const owned = ['shirt', 'trousers', 'sneakers'];
  const under = makePlan(owned, allScenes, 100);
  assert.deepEqual(under.purchases, []);
  assert.equal(under.covered.length, 2);
  const reuse = makePlan([...owned, 'blazer'], allScenes, 42);
  assert.deepEqual(reuse.purchases, ['loafers']);
  assert.equal(reuse.cost, 42);
  assert.equal(reuse.covered.length, 3);
});

test('more budget preserves the smallest completed capsule and owned inventory covers zero-budget plans', () => {
  const standard = makePlan(['shirt', 'trousers', 'sneakers'], allScenes, 250);
  assert.deepEqual(standard.purchases.slice().sort(), ['blazer', 'loafers']);
  assert.equal(standard.cost, 101);
  const complete = makePlan(['shirt', 'trousers', 'sneakers', 'blazer', 'loafers'], allScenes, 0);
  assert.equal(complete.covered.length, 3);
  assert.deepEqual(complete.purchases, []);
  assert.equal(complete.cost, 0);
});

test('selection order and duplicate inputs preserve optimal objective and coherent SKU ownership', () => {
  const normal = makePlan(['shirt', 'trousers', 'sneakers'], allScenes, 101);
  const reordered = makePlan(['sneakers', 'shirt', 'trousers', 'shirt', 'missing'], ['social', 'interview', 'office', 'office'], 101);
  assert.deepEqual(objective(reordered), objective(normal));
  assert.deepEqual(reordered.purchases.slice().sort(), normal.purchases.slice().sort());
  assert.equal(reordered.owned.length, 3);
});

test('increasing budget and adding owned clothes never reduce available occasion coverage', () => {
  for (const owned of [[], ['shirt'], ['shirt', 'trousers', 'sneakers']]) {
    let previous = 0;
    for (const budget of [0, 20, 40, 60, 80, 100, 101, 140, 200]) {
      const plan = makePlan(owned, allScenes, budget);
      assert.ok(plan.covered.length >= previous);
      previous = plan.covered.length;
      for (const added of ids) assert.ok(makePlan([...owned, added], allScenes, budget).covered.length >= plan.covered.length);
    }
  }
});

test('empty occasions produce no purchase and invalid numeric budgets cannot create funded baskets', () => {
  assert.deepEqual(makePlan([], [], 1000).purchases, []);
  for (const budget of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const plan = makePlan([], allScenes, budget);
    assert.equal(plan.cost, 0, `invalid budget ${budget}`);
    assert.deepEqual(plan.purchases, []);
  }
});

test('prototype property names cannot become wardrobe SKUs', () => {
  const plan = makePlan(['constructor', '__proto__', 'toString', 'shirt'], allScenes, 0);
  assert.deepEqual(plan.owned, ['shirt']);
});

test('an empty zero-budget export does not claim complete coverage', () => {
  const text = exportPlan(makePlan([], allScenes, 0), 0);
  assert.match(text, /Occasions covered: 0\/3/);
  assert.doesNotMatch(text, /Your current pieces cover the selected plan\./);
});
