const express = require('express');
const router = express.Router();

const sendSms = require('../helpers/sms');
const { readUsers } = require('../helpers/storage');
const { startRegistration, completeRegistration } = require('../services/registration');
const { getNextQuestion, checkAnswer } = require('../services/quiz');
const { getLeaderboard, getUserRank } = require('../services/leaderboard');

router.post('/incoming', async (req, res) => {
  res.status(200).send(''); // ack quickly

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

module.exports = router;
