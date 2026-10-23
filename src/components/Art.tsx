import { byId, type Garment, type Look } from '../lib/catalog';
import { assetRoot, garmentPhotos, originalLooks, recordedLooks } from '../lib/demo-assets';

export function GarmentArt({ item, className = '' }: { item: Garment; className?: string }) {
  if (garmentPhotos[item.id]) return <img className={`garment-photo ${className}`} src={assetRoot + garmentPhotos[item.id]} alt={`${item.colorName} ${item.name} concept garment`} />;
  const c = item.color;
  return <svg className={className} viewBox="0 0 160 160" role="img" aria-label={`${item.colorName} ${item.name}`}>
    <ellipse cx="80" cy="140" rx="45" ry="5" fill="#293d31" opacity=".08" />
    {['shirt', 'tee', 'knit', 'blazer'].includes(item.kind) && <>
      <path d={item.kind === 'tee' ? 'M55 26 32 39 15 72 37 84 48 65 45 130 115 130 112 65 123 84 145 72 128 39 105 26Z' : 'M55 26 32 39 19 119 39 123 50 69 45 134 115 134 110 69 121 123 141 119 128 39 105 26Z'} fill={c} stroke="#353d36" strokeWidth="1.5" />
      {item.kind === 'tee' || item.kind === 'knit' ? <path d="M58 27Q80 51 102 27" fill="none" stroke="#353d36" opacity=".45" strokeWidth="2" /> : <><path d="M59 26 80 41 101 26 93 55 80 42 67 55Z" fill={item.kind === 'blazer' ? '#e8e3d8' : c} stroke="#353d36" strokeWidth="1" /><path d="M80 43V131" stroke="#353d36" opacity=".5" /><path d="M91 69h14v18H91" fill="none" stroke="#353d36" opacity=".4" /></>}
      {item.kind === 'blazer' && <><path d="M58 28 67 65 80 83 68 96 56 60 61 52 52 48Z" fill="#b3aa8a" /><path d="M102 28 93 65 80 83 92 96 104 60 99 52 108 48Z" fill="#b3aa8a" /></>}
    </>}
    {item.kind === 'trousers' && <><path d="M49 24h62l5 46-13 70H84L80 73l-4 67H57L44 70Z" fill={c} stroke="#353d36" strokeWidth="1.5" /><path d="M49 34h62M80 34v38M58 45 54 65M102 45l4 20" fill="none" stroke="#e5e0d1" opacity=".35" /><path d="M62 72 67 131M98 72l-5 59" stroke="#121f22" opacity=".25" /></>}
    {item.kind === 'skirt' && <><path d="M57 25h46l23 111H34Z" fill={c} stroke="#353d36" strokeWidth="1.5" /><path d="M56 36h49M64 42 53 129M95 42l12 87M80 42v88" stroke="#d3d9c9" opacity=".3" /></>}
    {(item.kind === 'sneakers' || item.kind === 'loafers') && <><path d="M28 69 56 72 69 98 91 108Q104 119 88 126H22Q12 120 19 105Z" fill={c} stroke="#353d36" strokeWidth="1.5" /><path d="M73 52 102 55 114 81 137 91Q149 103 132 110H68Q58 103 65 88Z" fill={c} stroke="#353d36" strokeWidth="1.5" /><path d="M19 118h74M64 102h74" stroke={item.kind === 'sneakers' ? '#fff' : '#32291f'} strokeWidth="8" />{item.kind === 'sneakers' ? <path d="m44 84 17 2m-14 6 18 3m23-28 18 3m-15 5 18 3" stroke="#fff" strokeWidth="3" /> : <path d="m24 93 37 10m9-27 37 10" stroke="#34291d" strokeWidth="6" />}</>}
  </svg>;
}

export function LookVisual({ look, className = '' }: { look: Look; className?: string }) {
  const recorded = recordedLooks[look.id];
  if (recorded) return <img className={`look-photo ${className}`} src={assetRoot + recorded.file} alt={`${look.name}: recorded YouCam virtual try-on on a fictional adult model`} />;
  if (originalLooks.includes(look.id)) return <img className={`look-photo ${className}`} src={assetRoot + 'firstfit-adult-model-oxford.png'} alt="Original fictional adult model wearing an Oxford shirt, tailored trousers and sneakers" />;
  return <LookArt look={look} className={className} />;
}

export function LookArt({ look, className = '', label = 'Illustrated styling preview' }: { look: Look; className?: string; label?: string }) {
  const top = look.items.map(id => byId[id]).find(i => ['tee', 'shirt', 'knit'].includes(i.kind));
  const bottom = look.items.map(id => byId[id]).find(i => ['trousers', 'skirt'].includes(i.kind));
  const outer = look.items.includes('blazer');
  const shoes = look.items.includes('loafers') ? '#644631' : '#eee8db';
  return <svg className={className} viewBox="0 0 360 470" role="img" aria-label={label}>
    <defs><pattern id={`grain-${look.id}`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#333" opacity=".05" /></pattern></defs>
    <rect width="360" height="470" fill={look.color} />
    <circle cx="194" cy="181" r="135" fill="#f8f6ef" opacity=".38" />
    <path d="M0 398 360 344v126H0Z" fill="#afb5a2" opacity=".25" />
    <ellipse cx="186" cy="443" rx="78" ry="11" fill="#293d31" opacity=".13" />
    <path d="M159 84h38l5 40-24 19-25-19Z" fill="#b58060" />
    <path d="M151 42q31-25 54 0l-1 37q-4 29-25 30-25-7-28-34Z" fill="#c99978" />
    <path d="M147 67q-8-40 18-46 31-10 47 18l-3 31-9-20q-17 1-30-13-1 21-23 30Z" fill="#33332e" />
    <path d="m162 74 7 1m20 0 7-1m-17 7-2 9 6 1m-14 8q10 5 19-1" fill="none" stroke="#7a4c3a" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M152 117 124 126 102 230l19 8 24-78 1 116h77l-8-116 26 75 20-8-30-102-29-9Z" fill={top?.color || '#e8e3d8'} stroke="#554f42" strokeWidth="1.1" />
    <path d="m155 116 23 21 23-21-7 30-16-9-17 9Z" fill="#f4efe6" stroke="#655f50" strokeWidth=".7" />
    <path d="M178 138v132" stroke="#9b9685" opacity=".5" />
    {outer && <><path d="M154 116 124 125 99 235l24 7 21-79-7 120h40l-2-100Z" fill="#827b60" stroke="#5b5949" /><path d="M201 116 230 125 259 230l-25 10-20-77 10 120h-41l-8-100Z" fill="#827b60" stroke="#5b5949" /><path d="m152 117 23 66-23-19-8-17 9-2-10-11Zm49 0-26 66 26-19 9-17-9-2 10-11Z" fill="#b0a788" /><path d="M146 246h22m25 0h22" stroke="#4d4d40" strokeWidth="2" /><circle cx="182" cy="220" r="2.5" fill="#454638" /></>}
    {bottom?.kind === 'skirt' ? <><path d="M145 270h76l19 118H126Z" fill={bottom.color} stroke="#303a34" /><path d="m147 384 5 43h16l5-43m27 0 3 43h16l6-43" fill="#b58060" /><path d="m158 281-13 95m60-95 16 95" stroke="#829181" opacity=".4" /></> : <><path d="M143 270h80l-4 71-10 87h-25l-5-111-8 111h-25l-11-87Z" fill={bottom?.color || '#38444c'} stroke="#2f393c" /><path d="M179 283v35m-24-28 4 120m44-120-6 120" stroke="#83908a" opacity=".4" /></>}
    <path d="m145 424 26 1-1 16-40 2q-6-4 0-9Zm39 1 25-1 18 10q7 9-3 9h-38Z" fill={shoes} stroke="#5a5346" />
    <path d="m101 233 20 6-4 24q-10 14-17-1Z" fill="#c99978" /><path d="m235 236 20-8 8 26q-1 15-13 10Z" fill="#c99978" />
    <rect width="360" height="470" fill={`url(#grain-${look.id})`} />
  </svg>;
}
