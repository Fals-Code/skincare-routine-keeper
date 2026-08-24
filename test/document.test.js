import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('page declares an inline favicon instead of requesting a missing default icon', async () => {
  const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(page, /<link rel="icon" href="data:image\/svg\+xml,/);
});
