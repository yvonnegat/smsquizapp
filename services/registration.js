const { readUsers, saveUsers } = require('../helpers/storage');

/**
 * Start the registration flow when user sends JOIN
 */
function startRegistration(phone) {
  const users = readUsers();
  users[phone] = { phone, state: 'awaiting_details' };
  saveUsers(users);
  return 'Welcome! To register, reply with: NAME Grade Subjects. Example: Alice Grade8 MATH,ENG';
}

/**
 * Complete the registration when user replies with details
 */
function completeRegistration(phone, text) {
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    return { error: 'Invalid format. Example: Alice Grade8 MATH,ENG' };
  }

  const name = parts.shift();
  const grade = parts.shift();
  const subjects = parts.join(' ').split(/[,;\s]+/).filter(Boolean);

  const users = readUsers();
  users[phone] = {
    phone,
    name,
    grade,
    subjects,
    registeredAt: new Date().toISOString()
  };
  saveUsers(users);

  return { success: `Thanks ${name}, you are registered! Grade: ${grade}, Subjects: ${subjects.join(', ')}` };
}

module.exports = {
  startRegistration,
  completeRegistration
};
