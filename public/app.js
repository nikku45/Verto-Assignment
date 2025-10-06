const apiBase = '/api/employees';

const els = {
  rows: document.getElementById('rows'),
  count: document.getElementById('count'),
  search: document.getElementById('search'),
  refresh: document.getElementById('refresh'),
  createForm: document.getElementById('create-form'),
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  position: document.getElementById('position'),
  nameErr: document.getElementById('name-error'),
  emailErr: document.getElementById('email-error'),
  positionErr: document.getElementById('position-error'),
  // Edit modal
  editBackdrop: document.getElementById('edit-backdrop'),
  editForm: document.getElementById('edit-form'),
  editId: document.getElementById('edit-id'),
  editName: document.getElementById('edit-name'),
  editEmail: document.getElementById('edit-email'),
  editPosition: document.getElementById('edit-position'),
  editNameErr: document.getElementById('edit-name-error'),
  editEmailErr: document.getElementById('edit-email-error'),
  editPositionErr: document.getElementById('edit-position-error'),
  editCancel: document.getElementById('edit-cancel'),
};

function setErrors(scope, errors) {
  const map = scope === 'create'
    ? { name: els.nameErr, email: els.emailErr, position: els.positionErr }
    : { name: els.editNameErr, email: els.editEmailErr, position: els.editPositionErr };
  Object.values(map).forEach((n) => (n.textContent = ''));
  for (const err of errors || []) {
    if (err.includes('name')) map.name.textContent = 'Name is required';
    if (err.includes('email is required')) map.email.textContent = 'Email is required';
    if (err.includes('email is invalid')) map.email.textContent = 'Enter a valid email';
    if (err.includes('position')) map.position.textContent = 'Position is required';
  }
}

async function fetchEmployees(q) {
  const u = new URL(apiBase, window.location.origin);
  if (q) u.searchParams.set('q', q);
  const res = await fetch(u);
  if (!res.ok) throw new Error('Failed to fetch employees');
  return res.json();
}

function renderRows(items) {
  els.count.textContent = `${items.length} record${items.length === 1 ? '' : 's'}`;
  els.rows.innerHTML = items
    .map((e) => `
      <tr>
        <td>${e.id}</td>
        <td>${e.name}</td>
        <td>${e.email}</td>
        <td>${e.position}</td>
        <td class="actions">
          <button data-action="edit" data-id="${e.id}">Edit</button>
          <button data-action="delete" data-id="${e.id}">Delete</button>
        </td>
      </tr>
    `)
    .join('');
}

async function load(q) {
  const items = await fetchEmployees(q);
  renderRows(items);
}

async function createEmployee(data) {
  const res = await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 400) {
    const body = await res.json();
    setErrors('create', body.errors);
    return null;
  }
  if (res.status === 409) {
    setErrors('create', ['email is invalid']);
    els.emailErr.textContent = 'Email already exists';
    return null;
  }
  if (!res.ok) throw new Error('Create failed');
  return res.json();
}

async function updateEmployee(id, data) {
  const res = await fetch(`${apiBase}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 400) {
    const body = await res.json();
    setErrors('edit', body.errors);
    return null;
  }
  if (res.status === 409) {
    setErrors('edit', ['email is invalid']);
    els.editEmailErr.textContent = 'Email already exists';
    return null;
  }
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

async function deleteEmployee(id) {
  const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error('Delete failed');
  return true;
}

function openEditModal(row) {
  els.editId.value = row.id;
  els.editName.value = row.name;
  els.editEmail.value = row.email;
  els.editPosition.value = row.position;
  setErrors('edit', []);
  els.editBackdrop.style.display = 'flex';
}

function closeEditModal() { els.editBackdrop.style.display = 'none'; }

function serializeForm(scope) {
  if (scope === 'create') {
    return { name: els.name.value.trim(), email: els.email.value.trim(), position: els.position.value.trim() };
  }
  return { name: els.editName.value.trim(), email: els.editEmail.value.trim(), position: els.editPosition.value.trim() };
}

// Client-side validation
function validateClient(data) {
  const errors = [];
  if (!data.name) errors.push('name is required');
  if (!data.email) errors.push('email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('email is invalid');
  if (!data.position) errors.push('position is required');
  return errors;
}

async function init() {
  await load();

  els.refresh.addEventListener('click', () => load(els.search.value.trim()));
  els.search.addEventListener('input', () => load(els.search.value.trim()));

  els.createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = serializeForm('create');
    const errs = validateClient(data);
    setErrors('create', errs);
    if (errs.length) return;
    const created = await createEmployee(data);
    if (created) {
      els.createForm.reset();
      await load(els.search.value.trim());
    }
  });

  els.rows.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute('data-id');
    if (!id) return;
    if (target.getAttribute('data-action') === 'edit') {
      // fetch the row to ensure latest data
      const res = await fetch(`${apiBase}/${id}`);
      if (res.ok) openEditModal(await res.json());
    }
    if (target.getAttribute('data-action') === 'delete') {
      if (confirm('Delete this employee?')) {
        const ok = await deleteEmployee(id);
        if (ok) await load(els.search.value.trim());
      }
    }
  });

  els.editCancel.addEventListener('click', () => closeEditModal());
  els.editBackdrop.addEventListener('click', (e) => { if (e.target === els.editBackdrop) closeEditModal(); });
  els.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = els.editId.value;
    const data = serializeForm('edit');
    const errs = validateClient(data);
    setErrors('edit', errs);
    if (errs.length) return;
    const updated = await updateEmployee(id, data);
    if (updated) {
      closeEditModal();
      await load(els.search.value.trim());
    }
  });
}

document.addEventListener('DOMContentLoaded', init);


