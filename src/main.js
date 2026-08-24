import { focusTargetForDelete, getStorage, loadProducts, makeProduct, productsForSlot, saveProducts } from './core.js';

const $ = (selector) => document.querySelector(selector);
const form = $('#product-form');
const status = $('#status');
const storage = getStorage();
let products = loadProducts(storage);
let toastTimer;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function announce(message, kind = 'ok') {
  clearTimeout(toastTimer);
  status.textContent = message;
  status.dataset.kind = kind;
  status.classList.add('show');
  toastTimer = setTimeout(() => status.classList.remove('show'), 2400);
}

function persist(next, successMessage, afterRender) {
  try {
    saveProducts(storage, next);
    products = next;
    render();
    afterRender?.();
    announce(successMessage);
    return true;
  } catch {
    announce('Could not save your shelf. Check browser storage and try again.', 'error');
    return false;
  }
}

function emptyState(slot) {
  return `<div class="empty">
    <span class="empty-icon" aria-hidden="true">${slot === 'Morning' ? '☀' : '☾'}</span>
    <strong>Your ${slot.toLowerCase()} shelf is clear.</strong>
    <span>Add a product when it becomes part of this routine.</span>
  </div>`;
}

function productCard(product, routine) {
  const paused = product.active ? '' : ' paused';
  const statusText = product.active ? 'Active' : 'Paused';
  const actionText = product.active ? 'Pause' : 'Resume';
  return `<article class="product-card${paused}" data-routine="${routine}">
    <div class="product-top">
      <div class="bottle" aria-hidden="true"><span></span></div>
      <div class="product-meta">
        <span class="state-dot">${statusText}</span>
        <h4>${escapeHtml(product.name)}</h4>
        <p>${escapeHtml(product.brand)}</p>
      </div>
    </div>
    <div class="product-tags">
      <span>${escapeHtml(product.concern)}</span>
      <span>${escapeHtml(product.slot)}</span>
    </div>
    <div class="product-actions">
      <button type="button" data-action="toggle" data-id="${escapeHtml(product.id)}" aria-label="${actionText} ${escapeHtml(product.name)}">${actionText}</button>
      <button class="danger" type="button" data-action="delete" data-id="${escapeHtml(product.id)}" aria-label="Delete ${escapeHtml(product.name)}">Delete</button>
    </div>
  </article>`;
}

function renderRoutine(slot) {
  const items = productsForSlot(products, slot);
  const key = slot.toLowerCase();
  $(`#${key}-count`).textContent = items.length;
  $(`#${key}-list`).innerHTML = items.length ? items.map((product) => productCard(product, slot)).join('') : emptyState(slot);
}

function restoreActionFocus(id, action, routine) {
  const control = [...document.querySelectorAll('button[data-action]')].find((item) =>
    item.dataset.id === id && item.dataset.action === action && item.closest('[data-routine]')?.dataset.routine === routine
  );
  control?.focus();
}

function restoreDeleteFocus(nextProducts, routine) {
  const nextId = focusTargetForDelete(nextProducts, routine);
  if (nextId) restoreActionFocus(nextId, 'toggle', routine);
  else $('#name').focus();
}

function render() {
  $('#total-count').textContent = products.length;
  $('#active-count').textContent = products.filter((p) => p.active).length;
  $('#paused-count').textContent = products.filter((p) => !p.active).length;
  renderRoutine('Morning');
  renderRoutine('Evening');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const fields = ['name', 'brand', 'concern'];
  const empty = fields.find((name) => !String(data.get(name) ?? '').trim());
  if (empty) {
    const input = form.elements.namedItem(empty);
    input.setCustomValidity('Please enter a value.');
    input.reportValidity();
    input.focus();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }

  try {
    const product = makeProduct({
      name: data.get('name'),
      brand: data.get('brand'),
      concern: data.get('concern'),
      slot: data.get('slot'),
      active: data.get('active') === 'true'
    });
    if (persist([product, ...products], `${product.name} added to your shelf.`)) {
      form.reset();
      $('#name').focus();
    }
  } catch (error) {
    announce(error.message, 'error');
  }
});

document.querySelector('.shelf-area').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  const product = products.find((item) => item.id === id);
  if (!product) return;

  if (action === 'toggle') {
    const next = products.map((item) => item.id === id ? { ...item, active: !item.active } : item);
    const routine = button.closest('[data-routine]')?.dataset.routine;
    persist(next, `${product.name} ${product.active ? 'paused' : 'resumed'}.`, () => restoreActionFocus(id, action, routine));
  } else if (action === 'delete') {
    const routine = button.closest('[data-routine]')?.dataset.routine;
    const next = products.filter((item) => item.id !== id);
    persist(next, `${product.name} removed from your shelf.`, () => restoreDeleteFocus(next, routine));
  }
});

render();
