// helpers/airtime.js

const AfricasTalking = require('africastalking')({
  apiKey: 'atsk_d811cdc0047b0ee38773e41072cd8541cbc2971cbb8d7af04b0b1670f64d1e07fc78e89e',
  username: process.env.AT_USERNAME
});
const airtime = AfricasTalking.AIRTIME;
async function sendAirtimeSdk(phone, amount) {
  console.log('[DEBUG SDK] username:', process.env.AT_USERNAME);
  console.log('[DEBUG SDK] using API key starts with:', process.env.AT_API_KEY?.slice(0, 10));
  console.log('[DEBUG SDK] phone:', phone, 'amount:', amount);

  const options = {
    recipients: [
      {
        phoneNumber: phone,
        currencyCode: "KES",
        amount: amount.toString()
      }
    ]
  };

  try {
    const response = await airtime.send(options);
    console.log('[DEBUG SDK] Airtime send response:', response);
    return response;
  } catch (err) {
    console.error('[ERROR SDK] Airtime SDK error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = sendAirtimeSdk;
