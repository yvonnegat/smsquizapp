// services/rewards.js

const { readUsers, saveUsers } = require('../helpers/storage');
const sendAirtime = require('../helpers/airtime');  // your SDK version

const REDEEM_THRESHOLD = 30;  // points needed
const REDEEM_AIRTIME = 10;    // KES amount

function checkRedeemEligibility(phone) {
  const users = readUsers();
  const user = users[phone];
  if (!user) {
    return null;
  }

  if ((user.points || 0) >= REDEEM_THRESHOLD && !user.redeemed) {
    return `🎉 You have ${user.points} points! Reply REDEEM to get KES ${REDEEM_AIRTIME} airtime.`;
  }

  return null;
}

async function redeemPoints(phone) {
  const users = readUsers();
  const user = users[phone];
  if (!user) {
    return 'You are not registered. Send JOIN to start.';
  }

  const currentPoints = user.points || 0;

  if (currentPoints < REDEEM_THRESHOLD) {
    return `You need at least ${REDEEM_THRESHOLD} points to redeem. You have ${currentPoints}.`;
  }

  if (user.redeemed) {
    return 'You already redeemed your airtime reward.';
  }

  try {
    const response = await sendAirtime(phone, REDEEM_AIRTIME);
    // console.log('[DEBUG] airtime send response in rewards:', response);  // response from SDK

    // Grab first response
    const respItem = response.responses && response.responses[0];
    const statusStr = respItem && respItem.status;
    console.log('[DEBUG] First response status:', statusStr);

    // Accept either "Sent" or "Success" as good, depending on what the SDK returns
    const goodStatuses = ['Sent', 'Success'];
    const isSuccess = statusStr && goodStatuses.includes(statusStr);

    if (isSuccess) {
      // subtract points
      user.points = currentPoints - REDEEM_THRESHOLD;
      user.redeemed = true;
      saveUsers(users);
      return `✅ Airtime worth KES ${REDEEM_AIRTIME} has been sent. Your remaining points: ${user.points}`;
    } else {
      // not success
      return `❌ Redemption failed. Status: ${statusStr || 'unknown'}. Please try again.`;
    }
  } catch (err) {
    console.error('[ERROR] redeemPoints sendAirtime failure:', err.response?.data || err.message);
    return '❌ Airtime redemption failed. Please try again later.';
  }
}

module.exports = {
  checkRedeemEligibility,
  redeemPoints
};
