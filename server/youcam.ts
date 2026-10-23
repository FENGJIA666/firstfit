const BASE = 'https://yce-api-01.makeupar.com';
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export type GarmentCategory = 'full_body' | 'upper_body' | 'lower_body' | 'outer' | 'shoes' | 'auto';
export type Photo = { data: string; contentType: 'image/jpeg' | 'image/png'; name: string };
export function parsePhoto(value: unknown): Photo {
  if (!value || typeof value !== 'object') throw new ApiError(400, 'PHOTO_REQUIRED', 'Choose a JPG or PNG image to continue.');
  const photo = value as Partial<Photo>;
  if (typeof photo.data !== 'string' || !['image/jpeg', 'image/png'].includes(photo.contentType || '') || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.data)) throw new ApiError(400, 'PHOTO_FORMAT', 'Choose a JPG or PNG image to continue.');
  const bytes = Buffer.from(photo.data, 'base64');
  if (bytes.length > 8 * 1024 * 1024 || bytes.length < 24) throw new ApiError(400, 'PHOTO_SIZE', 'Choose an image between 24 bytes and 8 MB.');
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isJpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((photo.contentType === 'image/png' && !isPng) || (photo.contentType === 'image/jpeg' && !isJpg)) throw new ApiError(400, 'PHOTO_FORMAT', 'Choose a valid JPG or PNG photo.');
  return { data: photo.data, contentType: photo.contentType as Photo['contentType'], name: photo.contentType === 'image/png' ? 'firstfit-photo.png' : 'firstfit-photo.jpg' };
}
export function safeProviderUrl(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(502, 'PROVIDER_RESPONSE', 'Your preview needs another moment. Please try again.');
  let url: URL;
  try { url = new URL(value); } catch { throw new ApiError(502, 'PROVIDER_RESPONSE', 'Your preview needs another moment. Please try again.'); }
  const allowed = ['amazonaws.com', 'cloudfront.net', 'makeupar.com', 'perfectcorp.com'];
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowed.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new ApiError(502, 'PROVIDER_RESPONSE', 'Your preview needs another moment. Please try again.');
  return url.toString();
}
export class YouCamClient {
  constructor(private key: string, private fetcher: typeof fetch = fetch) {}
  private async request(path: string, body?: unknown): Promise<any> {
    let response: Response;
    try { response = await this.fetcher(`${BASE}${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45_000), redirect: 'error' }); }
    catch { throw new ApiError(502, 'PROVIDER_CONNECTION', 'Let’s reconnect your preview. Try again in a moment.'); }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new ApiError(503, 'API_CONFIGURATION', 'Your preview connection is ready for a server-side account check.');
      if (response.status === 429) throw new ApiError(429, 'PROVIDER_BUSY', 'Your styling studio is busy. Try again in a moment.');
      throw new ApiError(502, 'PROVIDER_REQUEST', 'Let’s give your preview another go. Check your photos and try again.');
    }
    try { return await response.json(); } catch { throw new ApiError(502, 'PROVIDER_RESPONSE', 'Your preview needs another moment. Please try again.'); }
  }
  async upload(photo: Photo): Promise<string> {
    const bytes = Buffer.from(photo.data, 'base64');
    const result = await this.request('/s2s/v2.0/file', { files: [{ content_type: photo.contentType, file_name: photo.name, file_size: bytes.length }] });
    const file = result?.data?.files?.[0];
    const upload = file?.requests?.[0];
    if (typeof file?.file_id !== 'string' || !upload || upload.method !== 'PUT') throw new ApiError(502, 'PROVIDER_RESPONSE', 'Please try your photo upload again.');
    const url = safeProviderUrl(upload.url);
    const uploadHeaders: Record<string, string> = { 'Content-Type': photo.contentType };
    if (upload.headers && typeof upload.headers === 'object') for (const [name, value] of Object.entries(upload.headers)) {
      if (typeof value === 'string' && ['content-type', 'content-length'].includes(name.toLowerCase())) uploadHeaders[name] = value;
    }
    const response = await this.fetcher(url, { method: 'PUT', headers: uploadHeaders, body: bytes, signal: AbortSignal.timeout(45_000), redirect: 'error' });
    if (!response.ok) throw new ApiError(502, 'UPLOAD_RETRY', 'Please try your photo upload again.');
    return file.file_id;
  }
  async create(person: Photo, garment: Photo, category: GarmentCategory): Promise<string> {
    const source = await this.upload(person);
    const reference = await this.upload(garment);
    const result = await this.request('/s2s/v2.0/task/cloth-v4', { src_file_id: source, ref_file_id: reference, garment_category: category, change_shoes: category === 'shoes', filter_multi_person: 'strict' });
    if (typeof result?.data?.task_id !== 'string') throw new ApiError(502, 'PROVIDER_RESPONSE', 'Please try creating your preview again.');
    return result.data.task_id;
  }
  async status(taskId: string): Promise<{ status: 'running' | 'success' | 'error'; imageUrl?: string }> {
    const result = await this.request(`/s2s/v2.0/task/cloth-v4/${encodeURIComponent(taskId)}`);
    const status = result?.data?.task_status;
    if (status === 'success') return { status, imageUrl: safeProviderUrl(result?.data?.results?.url) };
    if (status === 'error') return { status };
    if (!['running', 'pending', 'queued', 'waiting'].includes(status)) throw new ApiError(502, 'PROVIDER_RESPONSE', 'Your preview needs another moment. Please try again.');
    return { status: 'running' };
  }
}
