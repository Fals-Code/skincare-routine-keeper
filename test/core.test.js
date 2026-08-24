import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, loadProducts, makeProduct, normalizeProducts, productsForSlot, saveProducts } from '../src/core.js';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
}

const product = (overrides = {}) => ({
  id: 'a',
  name: 'Barrier Cream',
  brand: 'Kind Skin',
  concern: 'Hydration',
  slot: 'Morning',
  active: true,
  ...overrides
});

test('Both products belong to morning and evening shelves', () => {
  const both = product({ slot: 'Both' });
  assert.deepEqual(productsForSlot([both], 'Morning'), [both]);
  assert.deepEqual(productsForSlot([both], 'Evening'), [both]);
});

test('storage round-trip preserves shelf data', () => {
  const storage = new MemoryStorage();
  const items = [product(), product({ id: 'b', slot: 'Evening', active: false })];
  saveProducts(storage, items);
  assert.deepEqual(loadProducts(storage), items);
});

test('malformed storage fails closed to an empty shelf', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{bad json');
  assert.deepEqual(loadProducts(storage), []);
});

test('normalization rejects invalid and duplicate records', () => {
  const valid = product();
  assert.deepEqual(normalizeProducts([valid, { ...valid }, { id: 'x' }]), [valid]);
});

test('product creation trims fields and validates required data', () => {
  const made = makeProduct({ name: '  Serum ', brand: ' Glow ', concern: ' Acne ', slot: 'Evening', active: false }, 'id-1');
  assert.equal(made.name, 'Serum');
  assert.equal(made.active, false);
  assert.throws(() => makeProduct({ name: '', brand: 'A', concern: 'B', slot: 'Morning', active: true }, 'id-2'));
});
