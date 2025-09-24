// Example fact bank
const facts = {
  Math: {
    Grade1: ["2 + 2 = 4", "1 is the only odd prime"],
    Grade2: ["10 is the first two-digit number", "100 is 10 squared"],
  },
  Science: {
    Grade1: ["Water freezes at 0°C", "The sun is a star"],
    Grade2: ["Plants make food using sunlight", "The Earth orbits the Sun"],
  },
};

function getRandomFact(subject, grade) {
  const subjectFacts = facts[subject]?.[grade];
  if (!subjectFacts || subjectFacts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * subjectFacts.length);
  console.log(`🔍 Looking for subject=${normalizedSubject}, grade=${grade}`);

  return subjectFacts[randomIndex];
}

module.exports = { getRandomFact };
