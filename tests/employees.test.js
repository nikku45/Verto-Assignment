const request = require('supertest');
process.env.NODE_ENV = 'test';
const app = require('../src/server');
const db = require('../src/db');

describe('Employees API', () => {
  beforeEach(() => {
    db.exec('DELETE FROM employees; VACUUM;');
  });

  test('POST /api/employees validates input', async () => {
    const res = await request(app).post('/api/employees').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
  });

  test('CRUD flow', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/employees')
      .send({ name: 'Alice', email: 'alice@example.com', position: 'Engineer' });
    expect(createRes.status).toBe(201);
    const created = createRes.body;

    // Read list
    const listRes = await request(app).get('/api/employees');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);

    // Read one
    const getRes = await request(app).get(`/api/employees/${created.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.email).toBe('alice@example.com');

    // Update
    const updateRes = await request(app)
      .put(`/api/employees/${created.id}`)
      .send({ name: 'Alice B', email: 'aliceb@example.com', position: 'Senior Engineer' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Alice B');

    // Conflict email
    await request(app).post('/api/employees').send({ name: 'Bob', email: 'bob@example.com', position: 'PM' });
    const conflictRes = await request(app)
      .put(`/api/employees/${created.id}`)
      .send({ name: 'Alice B', email: 'bob@example.com', position: 'Senior Engineer' });
    expect(conflictRes.status).toBe(409);

    // Delete
    const delRes = await request(app).delete(`/api/employees/${created.id}`);
    expect(delRes.status).toBe(204);

    const notFound = await request(app).get(`/api/employees/${created.id}`);
    expect(notFound.status).toBe(404);
  });
});


