import assert from 'node:assert/strict';
import test from 'node:test';
import { taskTokens } from '../server/task-token';
test('receipts expire after two hours and cannot be forged or moved to another key', () => {
  const codec = taskTokens('test-only-secret');
  const receipt = { providerId: 'task-id', created: 100_000 };
  const token = codec.seal(receipt);
  assert.deepEqual(codec.open(token, 100_001), receipt);
  assert.equal(codec.open(token, 100_000 + 2 * 60 * 60 * 1000 + 1), undefined);
  assert.equal(codec.open(token, 1), undefined);
  assert.equal(codec.open('not-a-task', 100_001), undefined);
  assert.equal(taskTokens('other').open(token, 100_001), undefined);
});
