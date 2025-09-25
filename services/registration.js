const { readUsers, saveUsers } = require('../helpers/storage');

const AVAILABLE_SUBJECTS = [
  "Mathematics",
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
  "🎓 Welcome to EduQuiz – the SMS Learning Challenge!\n\n" +
  "To get started, register with: NAME Grade Subjects\n" +
  "👉 Example: Alice Grade6 Math,English,Science\n\n" +
  "📚 Available subjects: " + AVAILABLE_SUBJECTS.join(', ') + "\n\n" +
  "✨ Extra Commands:\n" +
  "- Send RANK to see your position on the leaderboard.\n" +
  "- Send REDEEM to exchange your points for airtime rewards.\n\n" +
  "Ready to learn & win? Reply now to join the quiz! 🚀"

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
