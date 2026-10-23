import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const TTL = 2 * 60 * 60 * 1000;
export interface TaskReceipt { providerId: string; created: number }
/** Authenticated, encrypted receipts let any instance resume a task without a database. */
export function taskTokens(secret: string) {
  const key = createHash('sha256').update('firstfit-task-v1\0').update(secret).digest();
  return {
    seal(receipt: TaskReceipt): string {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(receipt), 'utf8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
    },
    open(token: string, now = Date.now()): TaskReceipt | undefined {
      try {
        if (!/^[A-Za-z0-9_-]{40,2048}$/.test(token)) return;
        const bytes = Buffer.from(token, 'base64url');
        const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
        decipher.setAuthTag(bytes.subarray(12, 28));
        const receipt = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
        if (typeof receipt.providerId !== 'string' || !receipt.providerId || !Number.isFinite(receipt.created) || receipt.created > now + 60_000 || now - receipt.created > TTL) return;
        return receipt;
      } catch { return; }
    },
  };
}
