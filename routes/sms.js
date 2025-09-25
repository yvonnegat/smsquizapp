const express = require('express');
const router = express.Router();

const sendSms = require('../helpers/sms');
const { getRandomFact } = require('../helpers/facts');
const { readUsers } = require('../helpers/storage');
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

    // --- LEADERBOARD / SCORE ---
  if (/^(SCORE|RANK)$/i.test(text)) {
    const rankInfo = getUserRank(from);
    if (!rankInfo) {
      await sendSms(from, 'You are not registered. Send JOIN to start.');
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
  await sendSms(from, 'Send JOIN to register or answer with A, B, C, or D.');
});

router.get('/send-facts', async (req, res) => {
  const users = readUsers();

  for (const phone in users) {
    const user = users[phone];
    if (!user || !user.subjects || !user.grade) continue;

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
