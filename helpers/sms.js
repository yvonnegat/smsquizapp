// helpers/sms.js
const sms = require('../config/africastalking');

async function sendSms(to, message) {
  try {
    await sms.send({ to, message });
    console.log('Sent SMS:', to, message);
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
  }
}

module.exports = sendSms;

console.log('[DEBUG] helpers/sms.js exports:', module.exports);
