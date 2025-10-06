const express = require('express');
const db = require('../db');

const router = express.Router();

function validateEmployee(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const position = typeof body.position === 'string' ? body.position.trim() : '';

  if (!name) errors.push('name is required');
  if (!email) errors.push('email is required');
  if (!position) errors.push('position is required');
  // Simple email format check
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email is invalid');

  return { errors, value: { name, email, position } };
}

router.get('/', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q && String(q).trim()) {
    const like = `%${String(q).trim()}%`;
    rows = db.prepare('SELECT * FROM employees WHERE name LIKE ? ORDER BY id DESC').all(like);
  } else {
    rows = db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { errors, value } = validateEmployee(req.body || {});
  if (errors.length) return res.status(400).json({ errors });
  try {
    const stmt = db.prepare('INSERT INTO employees (name, email, position) VALUES (?, ?, ?)');
    const info = stmt.run(value.name, value.email, value.position);
    const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('email')) {
      return res.status(409).json({ error: 'email already exists' });
    }
    res.status(500).json({ error: 'internal error' });
  }
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { errors, value } = validateEmployee(req.body || {});
  if (errors.length) return res.status(400).json({ errors });
  try {
    const stmt = db.prepare('UPDATE employees SET name = ?, email = ?, position = ? WHERE id = ?');
    stmt.run(value.name, value.email, value.position, id);
    const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    if (String(e.message).includes('UNIQUE') && String(e.message).includes('email')) {
      return res.status(409).json({ error: 'email already exists' });
    }
    res.status(500).json({ error: 'internal error' });
  }
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
  const info = stmt.run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

module.exports = router;


