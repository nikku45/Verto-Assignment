const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initialize DB
const employeesRouter = require('./routes/employees');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API routes
app.use('/api/employees', employeesRouter);

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

module.exports = app;


