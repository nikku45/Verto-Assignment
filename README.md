# Employee Manager (Fullstack CRUD)

A simple fullstack CRUD app to manage employees (name, email, position) using Node.js, Express, and SQLite with a static HTML/CSS/JS frontend.

## Tech Stack
- Backend: Node.js, Express, better-sqlite3 (SQLite)
- Frontend: Static HTML/CSS/JS
- Tests: Jest + Supertest

## Getting Started

### Prerequisites
- Node.js 18+

### Install
```bash
npm install
```

### Run (development)
```bash
npm run dev
```
Then open `http://localhost:3000`.

### Run (production)
```bash
npm start
```

### Test
```bash
npm test
```

## API
Base URL: `/api/employees`

- GET `/api/employees` — list employees (optional `?q=alice` to filter by name)
- GET `/api/employees/:id` — get one employee
- POST `/api/employees` — create `{ name, email, position }`
- PUT `/api/employees/:id` — update `{ name, email, position }`
- DELETE `/api/employees/:id` — delete by id

Notes:
- Email must be unique; server returns 409 on conflict.
- Validates required fields and basic email format.

## Project Structure
```
src/
  db.js                 # SQLite initialization and migrations
  server.js             # Express app, static frontend, routes
  routes/
    employees.js        # CRUD endpoints
public/
  index.html            # UI
  app.js                # UI logic (CRUD, modal, search, validation)
tests/
  employees.test.js     # Jest + Supertest CRUD tests
```

## Assumptions & Choices
- Used `better-sqlite3` for simplicity and sync operations.
- In tests, DB runs in-memory; prod/dev uses a file under `data/`.


## How to Use
- Add employees via the form.
- Edit using the modal in the table.
- Delete using the Delete button.
- Search by name with the top bar.

## License
MIT

