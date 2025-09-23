const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}');
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Export both functions as named exports
module.exports = {
  readUsers,
  saveUsers
};
