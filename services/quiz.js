// services/quiz.js

const path = require('path');
const fs = require('fs');
const { readUsers, saveUsers } = require('../helpers/storage');

const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'questions.json');

function loadQuestions() {
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  return JSON.parse(raw);
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '');
}

// Fisher-Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNextQuestion(phone) {
  const users = readUsers();
  const user = users[phone];
  if (!user) return null;

  const allQuestions = loadQuestions();

  // Filter by grade AND subject(s)
  const eligible = allQuestions.filter(q =>
    normalize(q.grade) === normalize(user.grade)
    && user.subjects.some(s => normalize(q.subject) === normalize(s))
  );

  if (!eligible.length) {
    console.log('[DEBUG] No eligible questions for user:', phone, 'grade:', user.grade, 'subjects:', user.subjects);
    return {
      finished: true,
      text: 'Sorry, no questions found for your chosen subject(s) and grade. 🎓'
    };
  }

  // Initialize askedQuestions if not there
  user.askedQuestions = user.askedQuestions || [];

  // Filter out already asked
  const notAsked = eligible.filter(q => !user.askedQuestions.includes(q.question));

  let nextQ;
  if (notAsked.length > 0) {
    // Shuffle notAsked so it's random
    const shuffled = shuffle(notAsked);
    nextQ = shuffled[0];
  } else {
    // All questions asked, optionally reset or finish
    // Here we'll treat as finished
    return {
      finished: true,
      text: '🎉 You have completed all questions for your chosen subject(s).'
    };
  }

  // Mark it as asked
  user.askedQuestions.push(nextQ.question);

  // Also update lastQuestion, etc.
  user.lastQuestion = nextQ;
  // lastIndex might not matter now, but you could track
  saveUsers(users);

  console.log('[DEBUG] Next question chosen for', phone, 'subject:', nextQ.subject);

  return { question: nextQ, text: formatQuestion(nextQ) };
}

function formatQuestion(q) {
  return `${q.subject} (${q.grade})\n\n${q.question}\n\n${q.options.join('\n')}\n\nReply with A, B, C or D.`;
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
