export type Scene = 'interview' | 'office' | 'social';
export type GarmentKind = 'shirt' | 'tee' | 'trousers' | 'blazer' | 'knit' | 'sneakers' | 'loafers' | 'skirt';
export interface Garment { id: string; name: string; color: string; colorName: string; price: number; kind: GarmentKind; note: string }
export interface Look { id: string; name: string; scene: Scene; items: string[]; note: string; color: string }
export const scenes: { id: Scene; name: string; short: string; note: string }[] = [
  { id: 'interview', name: 'The interview', short: 'Interview', note: 'Make your introduction count.' },
  { id: 'office', name: 'The workday', short: 'Workday', note: 'Settle into your next chapter.' },
  { id: 'social', name: 'After hours', short: 'After hours', note: 'Bring your whole self along.' },
];
export const catalog: Garment[] = [
  { id: 'shirt', name: 'Everyday Oxford', color: '#e8e3d8', colorName: 'Warm white', price: 28, kind: 'shirt', note: 'A crisp foundation for every introduction.' },
  { id: 'trousers', name: 'Tailored trouser', color: '#38444c', colorName: 'Midnight', price: 36, kind: 'trousers', note: 'Easy structure, from nine to whenever.' },
  { id: 'sneakers', name: 'Everyday sneaker', color: '#e7e5de', colorName: 'Chalk', price: 32, kind: 'sneakers', note: 'Your familiar pair, ready for a new setting.' },
  { id: 'tee', name: 'Essential tee', color: '#e9dfc8', colorName: 'Oat', price: 15, kind: 'tee', note: 'An effortless starting point.' },
  { id: 'blazer', name: 'Signature blazer', color: '#827b60', colorName: 'Soft olive', price: 59, kind: 'blazer', note: 'One layer. A whole new first impression.' },
  { id: 'loafers', name: 'City loafer', color: '#694c39', colorName: 'Espresso', price: 42, kind: 'loafers', note: 'The finishing touch for your next step.' },
  { id: 'knit', name: 'Lightweight knit', color: '#8c9b87', colorName: 'Sage', price: 29, kind: 'knit', note: 'An easy layer for air-conditioned days.' },
  { id: 'linen', name: 'Relaxed trouser', color: '#c7b795', colorName: 'Sand', price: 34, kind: 'trousers', note: 'A fresh silhouette for a full calendar.' },
  { id: 'blue-shirt', name: 'Breezy shirt', color: '#9bacb3', colorName: 'Mist blue', price: 26, kind: 'shirt', note: 'A little color, a lot of possibility.' },
  { id: 'skirt', name: 'Everyday midi', color: '#4b5751', colorName: 'Forest', price: 35, kind: 'skirt', note: 'A flowing alternative with a tailored finish.' },
];
export const looks: Look[] = [
  { id: 'first-impression', name: 'The first impression', scene: 'interview', items: ['shirt', 'trousers', 'blazer', 'loafers'], note: 'A crisp shirt, structured layer and polished shoes create a coordinated interview look.', color: '#d9ddd0' },
  { id: 'fresh-perspective', name: 'A fresh perspective', scene: 'interview', items: ['blue-shirt', 'trousers', 'blazer', 'loafers'], note: 'Mist blue adds personality to the same tailored foundations.', color: '#d7e0e1' },
  { id: 'new-chapter', name: 'The new chapter', scene: 'interview', items: ['shirt', 'skirt', 'blazer', 'loafers'], note: 'A midi silhouette brings movement to a structured interview outfit.', color: '#d6dacf' },
  { id: 'day-one', name: 'Ready for day one', scene: 'office', items: ['shirt', 'trousers', 'sneakers'], note: 'Your familiar essentials come together for a smart-casual workplace.', color: '#e8dfce' },
  { id: 'meeting-ready', name: 'Meeting-ready', scene: 'office', items: ['shirt', 'trousers', 'loafers'], note: 'Switch the shoes and the same outfit takes on a more polished mood.', color: '#e1ddd2' },
  { id: 'creative-monday', name: 'Creative Monday', scene: 'office', items: ['blue-shirt', 'trousers', 'sneakers'], note: 'A color change makes your core pieces feel fresh.', color: '#dae2df' },
  { id: 'layer-up', name: 'A little extra polish', scene: 'office', items: ['shirt', 'trousers', 'blazer', 'sneakers'], note: 'The blazer adds structure while your sneakers keep the mood relaxed.', color: '#e4dfd1' },
  { id: 'soft-structure', name: 'Soft structure', scene: 'office', items: ['knit', 'trousers', 'loafers'], note: 'Light layers and tailored trousers make a comfortable workday pairing.', color: '#dbe2d6' },
  { id: 'midi-monday', name: 'A moving start', scene: 'office', items: ['shirt', 'skirt', 'loafers'], note: 'Three versatile pieces create an easy, coordinated workday.', color: '#d4dfd5' },
  { id: 'after-five', name: 'See you after five', scene: 'social', items: ['shirt', 'trousers', 'sneakers'], note: 'Keep the foundations, roll the sleeves, and take your day a little further.', color: '#ead9ca' },
  { id: 'weekend-energy', name: 'Weekend energy', scene: 'social', items: ['tee', 'trousers', 'sneakers'], note: 'A soft tee gives your tailored trousers a whole new rhythm.', color: '#e9dfc9' },
  { id: 'coffee-club', name: 'The coffee club', scene: 'social', items: ['knit', 'linen', 'sneakers'], note: 'Soft tones and relaxed layers for a slower kind of afternoon.', color: '#dce1d0' },
  { id: 'gallery-hours', name: 'Gallery hours', scene: 'social', items: ['tee', 'skirt', 'sneakers'], note: 'A flowing silhouette with the comfort of your favorite sneakers.', color: '#dfd8ca' },
];
export const byId = Object.fromEntries(catalog.map(item => [item.id, item])) as Record<string, Garment>;
export const money = (amount: number) => `S$${amount}`;
