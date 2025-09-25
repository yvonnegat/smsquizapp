// services/facts.js

const path = require('path');
const fs = require('fs');
const { readUsers } = require('../helpers/storage');
const sendSms = require('../helpers/sms');

const FACTS_FILE = path.join(__dirname, '..', 'data', 'facts.json');

function loadFacts() {
  const raw = fs.readFileSync(FACTS_FILE, 'utf8');
  return JSON.parse(raw);
}

function pickRandomFact() {
  const facts = loadFacts();
  if (!facts.length) return null;
  const idx = Math.floor(Math.random() * facts.length);
  return facts[idx];
}

/**
 * Send fact to all registered users (or some subset)
 */
function broadcastFact() {
  const users = readUsers();
  const fact = pickRandomFact();
  if (!fact) return;

  Object.values(users).forEach(user => {
    // Optionally only send to users in 'playing' state, or some filter
    if (user.state === 'playing') {
      sendSms(user.phone, `📘 Fact: ${fact}`);
    }
  });
}

module.exports = { broadcastFact };
