const path = require('path');
const fs = require('fs');
const { readUsers, saveUsers } = require('../helpers/storage');

const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'questions.json');

function loadQuestions() {
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  return JSON.parse(raw);
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, '');
}

function getNextQuestion(phone) {
  const users = readUsers();
  const user = users[phone];
  if (!user) return null;

  const questions = loadQuestions().filter(
    q => normalize(q.grade) === normalize(user.grade)
  );

  if (!questions.length) {
    console.log('[DEBUG] No questions found for grade:', user.grade);
    return null;
  }

  const nextIndex = user.lastIndex + 1;
  if (nextIndex >= questions.length) {
    return { finished: true, text: '🎉 You have completed all questions for your grade!' };
  }

  const q = questions[nextIndex];

  user.lastQuestion = q;
  user.lastIndex = nextIndex;
  saveUsers(users);

  console.log('[DEBUG] Sending question index', nextIndex, 'to', phone);
  return { question: q, text: formatQuestion(q) };
}

function formatQuestion(q) {
  return `Q: ${q.question}\n\n${q.options.join('\n')}\n\nReply with A, B, C or D.`;
}

function checkAnswer(phone, answer) {
  const users = readUsers();
  const user = users[phone];
  if (!user || !user.lastQuestion) {
    return { error: 'No active question. Please wait for the next one.' };
  }

  const correct = user.lastQuestion.answer.toUpperCase() === answer.toUpperCase();

  if (correct) {
    user.points = (user.points || 0) + 10;
    saveUsers(users);
    return { correct: true, message: `✅ Correct! You now have ${user.points} points.` };
  } else {
    saveUsers(users);
    return { correct: false, message: `❌ Wrong. The correct answer was ${user.lastQuestion.answer}. Total points: ${user.points}` };
  }
}

module.exports = {
  getNextQuestion,
  checkAnswer
};
