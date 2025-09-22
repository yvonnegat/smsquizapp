const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const USERS_FILE = path.join(__dirname, 'users.json');

// helper functions for local storage
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return {};
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('readUsers error', e);
    return {};
  }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// --- Routes ---

// root check
app.get('/', (req, res) => {
  res.send('Hello, SMS Quizzz!');
});

// register a user
app.post('/register', (req, res) => {
  const { phone, name, grade, subjects } = req.body;

  if (!phone || !name) {
    return res.status(400).json({ error: 'phone and name are required' });
  }

  const users = readUsers();
  users[phone] = {
    phone,
    name,
    grade: grade || '',
    subjects: subjects || [],
    registeredAt: new Date().toISOString()
  };

  saveUsers(users);

  res.json({ message: 'User registered successfully', user: users[phone] });
});

// view all registered users
app.get('/admin/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
