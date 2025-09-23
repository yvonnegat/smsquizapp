const { readUsers, saveUsers } = require('../helpers/storage');

function startRegistration(phone) {
  const users = readUsers();

  if (users[phone] && users[phone].state === 'playing') {
    return { alreadyRegistered: true, message: 'You are already registered!' };
  }

  users[phone] = { phone, state: 'awaiting_details' };
  saveUsers(users);

  return {
    alreadyRegistered: false,
    message: 'Welcome! To register, reply with: NAME Grade Subjects. Example: Alice Grade6 MATH,ENG'
  };
}

function completeRegistration(phone, text) {
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    return { error: 'Invalid format. Example: Alice Grade6 MATH,ENG' };
  }

  const name = parts.shift();
  let grade = parts.shift();

  // normalize grade (ensure space after "Grade")
  if (/^Grade\d+$/i.test(grade)) {
    grade = grade.replace(/^Grade(\d+)/i, 'Grade $1');
  }

  const subjects = parts.join(' ').split(/[,;\s]+/).filter(Boolean);

  const users = readUsers();

  const user = {
    phone,
    name,
    grade,
    subjects,
    registeredAt: new Date().toISOString(),
    points: 0,
    state: 'playing',
    lastQuestion: null,
    lastIndex: -1
  };

  users[phone] = user;
  saveUsers(users);

  return {
    success: `Thanks ${name}, you are registered! Grade: ${grade}, Subjects: ${subjects.join(', ')}`,
    user
  };
}

module.exports = {
  startRegistration,
  completeRegistration
};
