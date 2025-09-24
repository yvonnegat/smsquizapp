const cron = require('node-cron');
const { readUsers } = require('../helpers/storage');
const sendSms = require('../helpers/sms');
const { getRandomFact } = require('../helpers/facts');

let jobRunning = false;

function scheduleDailyFacts() {
  cron.schedule('* 9 * * *', async () => {
    if (jobRunning) {
      console.warn('⏱ Previous job still running, skipping this minute.');
      return;
    }
    jobRunning = true;

    console.log("📢 Running daily facts job...");
    const users = readUsers();
    const smsPromises = [];

    for (const phone in users) {
      const user = users[phone];
      if (!user || !user.subjects || !user.grade) continue;

      const subject = user.subjects[Math.floor(Math.random() * user.subjects.length)];
      const grade = `Grade${user.grade}`;
      const fact = getRandomFact(subject, grade);

      if (fact) {
        const message = `📘 Daily Fact (${subject}, ${grade}):\n${fact}`;
        smsPromises.push(
          sendSms(phone, message)
            .then(() => console.log(`✅ Sent fact to ${phone}`))
            .catch(err => console.error(`❌ Failed to send to ${phone}:`, err))
        );
      }
    }

    await Promise.all(smsPromises);
    jobRunning = false;
  });
}

module.exports = scheduleDailyFacts;
