const express = require('express');
const router = express.Router();
const { readUsers, saveUsers } = require('../helpers/storage');

// This route handles the Airtime status callback from AT
// https://shawanda-unautographed-wrigglingly.ngrok-free.dev/airtime/status-callback
router.post('/status-callback', (req, res) => {
  res.status(200).send('OK'); // Acknowledge receipt quickly

  console.log('[AIRTIME CALLBACK] Received body:', req.body);

  // Expected fields, based on AT docs:
  // requestId, phoneNumber, status, maybe currencyCode, amount etc.
  const { requestId, phoneNumber, status, amount, currencyCode } = req.body;

  if (!phoneNumber) {
    console.error('[AIRTIME CALLBACK] phoneNumber missing in callback');
    return;
  }

  const users = readUsers();
  const user = users[phoneNumber];
  if (!user) {
    console.warn('[AIRTIME CALLBACK] No user found for phoneNumber:', phoneNumber);
    return;
  }

  // Save callback info on user
  user.airtimeTransaction = user.airtimeTransaction || {};
  user.airtimeTransaction.requestId = requestId;
  user.airtimeTransaction.status = status;
  if (amount) user.airtimeTransaction.amount = amount;
  if (currencyCode) user.airtimeTransaction.currencyCode = currencyCode;
  user.airtimeTransaction.updatedAt = new Date().toISOString();

  // Optionally: reset or deduct points or mark redeemed
  // e.g., only mark `redeemed = true` when status is "Success"
  if (status && status.toLowerCase() === 'success') {
    user.redeemed = true;
  } else {
    // If failed, notify or allow retry
    // e.g. user.redeemed = false;
  }

  users[phoneNumber] = user;
  saveUsers(users);

  console.log('[AIRTIME CALLBACK] Updated user:', phoneNumber, 'status:', status);
});

module.exports = router;
