const path = require('path');
const fs = require('fs');

const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'questions.json');

function loadQuestions() {
  const raw = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  return JSON.parse(raw);
}

function getFirstQuestion(grade) {
  const questions = loadQuestions();
  const q = questions.find(q => q.grade.toLowerCase() === grade.toLowerCase()) || questions[0];
  return formatQuestion(q);
}

function formatQuestion(q) {
  return `Q: ${q.question}\n\n${q.options.join('\n')}\n\nReply with A, B, C or D.`;
}

module.exports = {
  getFirstQuestion
};
