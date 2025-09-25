const express = require('express');
const router = express.Router();

const sendSms = require('../helpers/sms');
const { getRandomFact } = require('../helpers/facts');
const { readUsers, saveUsers } = require('../helpers/storage');
const { startRegistration, completeRegistration } = require('../services/registration');
const { getNextQuestion, checkAnswer } = require('../services/quiz');
const { getLeaderboard, getUserRank } = require('../services/leaderboard');

router.post('/incoming', async (req, res) => {
  res.status(200).send('');

  const from = req.body.from;
  const text = (req.body.text || '').trim();
  console.log('Inbound SMS:', from, text);

  const users = readUsers();
  const user = users[from];

 // --- STOP FLOW ---
if (/^STOP$/i.test(text)) {
  if (user) {
    delete users[from]; // 🚨 Remove the user completely
    saveUsers(users);   // Save changes to users.json
    await sendSms(from, '✅ You have unsubscribed from EduQuiz. All your data has been deleted. Send JOIN anytime to start fresh.');
  } else {
    await sendSms(from, 'ℹ️ You are not registered. Send JOIN to start.');
  }
  return;
}

// If user is deleted (not found in users.json), treat them as unregistered
if (!user && !/^JOIN$/i.test(text)) {
  await sendSms(from, 'ℹ️ You are not registered. Send JOIN to start.');
  return;
}


  // --- LEADERBOARD / SCORE ---
  if (/^(SCORE|RANK)$/i.test(text)) {
    const rankInfo = getUserRank(from);
    if (!rankInfo) {
      await sendSms(from, 'ℹ️ You are not registered. Send JOIN to start.');
      return;
    }

    const leaderboard = getLeaderboard(5);
    let msg = `🏆 Leaderboard:\n`;
    leaderboard.forEach((u, i) => {
      msg += `${i + 1}. ${u.name} - ${u.points || 0} pts\n`;
    });

    msg += `\nYour Rank: ${rankInfo.rank}/${rankInfo.total} (${rankInfo.user.points} pts)`;
    await sendSms(from, msg);

    // ✅ also check if they are due for next question
    if (user && user.state === 'playing') {
      const nextQ = getNextQuestion(from);
      if (nextQ && !nextQ.finished) {
        await sendSms(from, `\nHere’s your next question:\n\n${nextQ.text}`);
      }
    }
    return;
  }

  // --- REGISTRATION FLOW ---
  if (/^JOIN$/i.test(text)) {
    if (user && user.state === 'stopped') {
      user.state = 'awaiting_details';
      saveUsers(users);
      await sendSms(from, '👋 Welcome back! Please register again with: NAME Grade Subjects');
      return;
    }

    const result = startRegistration(from);

    if (result.alreadyRegistered) {
      await sendSms(from, result.message);

      // send next question immediately
      const nextQ = getNextQuestion(from);
      if (nextQ && !nextQ.finished) {
        await sendSms(from, nextQ.text);
      }
      return;
    }

    await sendSms(from, result.message);
    return;
  }

  if (user && user.state === 'awaiting_details') {
    const result = completeRegistration(from, text);
    if (result.error) {
      await sendSms(from, result.error);
    } else {
      // ✅ confirmation SMS
      await sendSms(from, result.success);

      // ✅ send first question right after registration
      const nextQ = getNextQuestion(from);
      if (nextQ && !nextQ.finished) {
        await sendSms(from, nextQ.text);
      }
    }
    return;
  }

  // --- ANSWER FLOW ---
  if (user && user.state === 'playing' && /^[A-D]$/i.test(text)) {
    const result = checkAnswer(from, text);
    await sendSms(from, result.message);

    // schedule next question
    setTimeout(async () => {
      const nextQ = getNextQuestion(from);
      if (nextQ && !nextQ.finished) {
        await sendSms(from, nextQ.text);
      }
    }, 60 * 1000); // 1 min for testing (use 24h in prod)

    return;
  }

  // fallback
  await sendSms(from, 'ℹ️ Send JOIN to register or answer with A, B, C, or D.');
});

router.get('/send-facts', async (req, res) => {
  const users = readUsers();

  for (const phone in users) {
    const user = users[phone];
    if (!user || !user.subjects || !user.grade) continue;
    if (user.state === 'stopped') continue; // skip unsubscribed users

    const subject = user.subjects[Math.floor(Math.random() * user.subjects.length)];
    const grade = `Grade${user.grade}`;
    const fact = getRandomFact(subject, grade);

    if (fact) {
      const message = `📘 Daily Fact (${subject}, ${grade}):\n${fact}`;
      await sendSms(phone, message);
      console.log(`✅ Sent fact to ${phone}`);
    }
  }

  res.send("✅ Facts sent successfully!");
});

module.exports = router;
