require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Add this if not present

// SQL Server connection config using .env
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

// Get all users from SQL Server
app.get('/users', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT customer_id, name, mobile FROM [user]');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new user to SQL Server
app.post('/users', async (req, res) => {
  const { customer_id, name, mobile, password } = req.body;
  if (!customer_id || !name || !mobile || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    await sql.connect(config);

    // Check if customer_id already exists
    const checkResult = await sql.query`
      SELECT customer_id FROM [user] WHERE customer_id = ${customer_id}
    `;
    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: 'Customer ID already exists' });
    }

    // Insert new member
    await sql.query`
      INSERT INTO [user] (customer_id, name, mobile, password)
      VALUES (${customer_id}, ${name}, ${mobile}, ${password})
    `;
    res.status(201).json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root endpoint for health check or welcome message
app.get('/', (req, res) => {
  res.send('API running');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});