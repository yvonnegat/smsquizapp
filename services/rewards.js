// services/rewards.js

const { readUsers, saveUsers } = require('../helpers/storage');
const sendAirtime = require('../helpers/airtime');  // sdk version

const REDEEM_THRESHOLD = 30;  // points needed per redeem
const REDEEM_AIRTIME = 10;    // KES amount per redeem

function checkRedeemEligibility(phone) {
  const users = readUsers();
  const user = users[phone];
  if (!user) {
    return null;
  }

  const currentPoints = user.points || 0;

  if (currentPoints >= REDEEM_THRESHOLD) {
    return `🎉 You have ${currentPoints} points! Reply REDEEM to use ${REDEEM_THRESHOLD} points for KES ${REDEEM_AIRTIME} airtime.`;
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

  try {
    const response = await sendAirtime(phone, REDEEM_AIRTIME);
    // console.log('[DEBUG] airtime send response in rewards:', response);

    const respItem = response.responses && response.responses[0];
    const statusStr = respItem && respItem.status;
    console.log('[DEBUG] First response status:', statusStr);

    const goodStatuses = ['Sent', 'Success'];
    const isSuccess = statusStr && goodStatuses.includes(statusStr);

    if (isSuccess) {
      user.points = currentPoints - REDEEM_THRESHOLD;
      // optional: record history of redeems
      user.redeemHistory = user.redeemHistory || [];
      user.redeemHistory.push({
        amount: REDEEM_AIRTIME,
        date: new Date().toISOString()
      });

      saveUsers(users);

      return `✅ Airtime worth KES ${REDEEM_AIRTIME} has been sent. Your remaining points: ${user.points}`;
    } else {
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
