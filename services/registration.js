const { readUsers, saveUsers } = require('../helpers/storage');

const AVAILABLE_SUBJECTS = [
  "Math",
  "Science",
  "English",
  "Kiswahili",
  "Social Studies",
  "ICT",
  "Arts & Design",
  "Business Studies",
  "Agriculture",
  "Life Skills / Health Education"
];

function startRegistration(phone) {
  const users = readUsers();

  if (users[phone] && users[phone].state === 'playing') {
    return { alreadyRegistered: true, message: 'You are already registered!' };
  }

  users[phone] = { phone, state: 'awaiting_details' };
  saveUsers(users);

  return {
    alreadyRegistered: false,
    message:
      'Welcome! To register, reply with: NAME Grade Subject(s).\n' +
      'Example: Alice Grade6 Mathematics,English\n\n' +
      'Available subjects: ' + AVAILABLE_SUBJECTS.join(', ')
  };
}

function completeRegistration(phone, text) {
  const parts = text.split(/\s+/);
  if (parts.length < 2) {
    return { error: 'Invalid format. Example: Alice Grade6 Mathematics,English' };
  }

  const name = parts.shift();
  let grade = parts.shift();

  // normalize grade
  if (/^Grade\d+$/i.test(grade)) {
    grade = grade.replace(/^Grade(\d+)/i, 'Grade $1');
  }

  // subjects: join remaining text, then split ONLY by commas/semicolons
  const subjectsRaw = parts.join(' ').trim();
  const subjects = subjectsRaw.split(/[,;]+/).map(s => s.trim()).filter(Boolean);

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
  completeRegistration,
  AVAILABLE_SUBJECTS
};
