require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const AfricasTalking = require('africastalking')({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});
const sms = AfricasTalking.SMS;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const USERS_FILE = path.join(__dirname, 'users.json');

// helpers
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}');
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}
async function sendSms(to, message) {
  try {
    await sms.send({ to, message });
    console.log('Sent SMS:', message);
  } catch (err) {
    console.error('SMS error:', err);
  }
}

// --- Routes ---
app.get('/', (req, res) => res.send('Hello, SMS Quiz!'));

app.get('/admin/users', (req, res) => {
  res.json(readUsers());
});

// AT will post inbound SMS here
app.post('/sms/incoming', async (req, res) => {
  res.status(200).send(''); // ack quickly

  const from = req.body.from;
  const text = (req.body.text || '').trim();
  console.log('Inbound SMS:', from, text);

  const users = readUsers();
  const user = users[from];

  if (/^JOIN$/i.test(text)) {
    // New user started registration
    users[from] = { phone: from, state: 'awaiting_details' };
    saveUsers(users);

    await sendSms(from, 'Welcome! To register, reply with: NAME Grade Subjects. Example: Alice Grade8 MATH,ENG');
    return;
  }

  if (user && user.state === 'awaiting_details') {
    // parse details
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendSms(from, 'Invalid format. Example: Alice Grade8 MATH,ENG');
      return;
    }

    const name = parts.shift();
    const grade = parts.shift();
    const subjects = parts.join(' ').split(/[,;\s]+/).filter(Boolean);

    users[from] = {
      phone: from,
      name,
      grade,
      subjects,
      registeredAt: new Date().toISOString()
    };
    saveUsers(users);

    await sendSms(from, `Thanks ${name}, you are registered! Grade: ${grade}, Subjects: ${subjects.join(', ')}`);
    return;
  }

  // fallback
  await sendSms(from, 'Send JOIN to register.');
});

// start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
