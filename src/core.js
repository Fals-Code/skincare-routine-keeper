export const STORAGE_KEY = 'skincare-routine-keeper:v1';
const SLOTS = new Set(['Morning', 'Evening', 'Both']);

export function isProduct(value) {
  return Boolean(value && typeof value === 'object' &&
    typeof value.id === 'string' && value.id &&
    typeof value.name === 'string' && value.name.trim() &&
    typeof value.brand === 'string' && value.brand.trim() &&
    typeof value.concern === 'string' && value.concern.trim() &&
    SLOTS.has(value.slot) && typeof value.active === 'boolean');
}

export function normalizeProducts(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter((item) => {
    if (!isProduct(item) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).map((item) => ({
    id: item.id,
    name: item.name.trim(),
    brand: item.brand.trim(),
    concern: item.concern.trim(),
    slot: item.slot,
    active: item.active
  }));
}

export function loadProducts(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? normalizeProducts(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveProducts(storage, products) {
  storage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function productsForSlot(products, slot) {
  return products.filter((product) => product.slot === slot || product.slot === 'Both');
}

export function makeProduct(data, id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`) {
  const product = {
    id,
    name: String(data.name ?? '').trim(),
    brand: String(data.brand ?? '').trim(),
    concern: String(data.concern ?? '').trim(),
    slot: data.slot,
    active: data.active === true
  };
  if (!isProduct(product)) throw new Error('Please complete every product detail.');
  return product;
}
