const { readUsers } = require('../helpers/storage');

function getLeaderboard(limit = 5) {
  const users = readUsers();
  const all = Object.values(users).filter(u => u.state === 'playing');

  // sort by points desc
  const sorted = all.sort((a, b) => (b.points || 0) - (a.points || 0));

  return sorted.slice(0, limit);
}

function getUserRank(phone) {
  const users = readUsers();
  const all = Object.values(users).filter(u => u.state === 'playing');

  const sorted = all.sort((a, b) => (b.points || 0) - (a.points || 0));
  const index = sorted.findIndex(u => u.phone === phone);

  if (index === -1) return null;

  return {
    rank: index + 1,
    total: sorted.length,
    user: sorted[index]
  };
}

module.exports = {
  getLeaderboard,
  getUserRank
};
