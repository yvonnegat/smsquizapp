const express = require('express');
const router = express.Router();

const sendSms = require('../helpers/sms');
const { readUsers } = require('../helpers/storage');
const { startRegistration, completeRegistration } = require('../services/registration');
const { getFirstQuestion } = require('../services/quiz');

router.post('/incoming', async (req, res) => {
  res.status(200).send(''); // ack quickly

  const from = req.body.from;
  const text = (req.body.text || '').trim();
  console.log('Inbound SMS:', from, text);

  const users = readUsers();
  const user = users[from];

  if (/^JOIN$/i.test(text)) {
    const msg = startRegistration(from);
    await sendSms(from, msg);
    return;
  }

  if (user && user.state === 'awaiting_details') {
    const result = completeRegistration(from, text);
    if (result.error) {
      await sendSms(from, result.error);
    } else {
      // 1️⃣ send confirmation
      await sendSms(from, result.success);

      // 2️⃣ send first question (separately)
      const question = getFirstQuestion(result.grade);
      await sendSms(from, question);
    }
    return;
  }

  await sendSms(from, 'Send JOIN to register.');
});

module.exports = router;
