export type Photo = { data: string; contentType: 'image/jpeg' | 'image/png'; name: string; preview: string };
const MAX_WIRE_BYTES = 1_350_000;
/** Two optimized photos remain below the host's 4.5 MB request limit after base64. */
export async function readPhoto(file: File): Promise<Photo> {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Choose a JPG or PNG photo up to 8 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Choose a clear JPG or PNG photo.')); image.src = source; });
    const short = Math.min(image.width, image.height), long = Math.max(image.width, image.height);
    if (short < 384 || long > 4096) throw new Error('Choose a photo with a short side of at least 384 pixels and a long side up to 4096 pixels.');
    const scale = Math.min(1, Math.max(1536 / long, 384 / short));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Try another browser to prepare your preview.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.88, .78, .68, .56]) {
      const preview = canvas.toDataURL('image/jpeg', quality);
      const data = preview.split(',')[1];
      if (data.length * 3 / 4 <= MAX_WIRE_BYTES) return { data, contentType: 'image/jpeg', name: 'firstfit-photo.jpg', preview };
    }
    throw new Error('Choose a simpler photo so we can prepare a sharp, fast preview.');
  } finally { URL.revokeObjectURL(source); }
}
