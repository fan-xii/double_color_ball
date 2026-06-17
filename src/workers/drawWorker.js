const RED_COUNT = 33;
const BLUE_COUNT = 16;
const RED_PICK = 6;
const BLUE_PICK = 1;

const PRIZE_MONEY = { 1: 5000000, 2: 200000, 3: 3000, 4: 200, 5: 10, 6: 5 };

function randomPick(max, count) {
  const arr = new Array(max);
  for (let i = 0; i < max; i++) arr[i] = i + 1;
  for (let i = max - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  const result = arr.slice(0, count);
  result.sort((a, b) => a - b);
  return result;
}

function checkPrize(userReds, userBlue, drawReds, drawBlue) {
  const userSet = new Set(userReds);
  let redMatch = 0;
  for (let i = 0; i < RED_PICK; i++) {
    if (userSet.has(drawReds[i])) redMatch++;
  }
  const blueMatch = userBlue === drawBlue ? 1 : 0;

  if (redMatch === 6 && blueMatch === 1) return { level: 1, matched: true, redMatch, blueMatch };
  if (redMatch === 6 && blueMatch === 0) return { level: 2, matched: true, redMatch, blueMatch };
  if (redMatch === 5 && blueMatch === 1) return { level: 3, matched: true, redMatch, blueMatch };
  if ((redMatch === 5 && blueMatch === 0) || (redMatch === 4 && blueMatch === 1)) return { level: 4, matched: true, redMatch, blueMatch };
  if ((redMatch === 4 && blueMatch === 0) || (redMatch === 3 && blueMatch === 1)) return { level: 5, matched: true, redMatch, blueMatch };
  if (blueMatch === 1 && (redMatch === 2 || redMatch === 1 || redMatch === 0)) return { level: 6, matched: true, redMatch, blueMatch };
  return { level: 0, matched: false, redMatch, blueMatch };
}

const CHUNK_SIZE = 50000;

self.onmessage = function (e) {
  const { userReds, userBlue, batchSize } = e.data;

  const prizeCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let winCount = 0;
  let totalPrizeMoney = 0;
  let bestLevel = 7;
  let lastDrawRed = null;
  let lastDrawBlue = 0;

  let processed = 0;
  while (processed < batchSize) {
    const chunkEnd = Math.min(processed + CHUNK_SIZE, batchSize);

    for (let i = processed; i < chunkEnd; i++) {
      const drawRed = randomPick(RED_COUNT, RED_PICK);
      const drawBlue = randomPick(BLUE_COUNT, BLUE_PICK)[0];

      const prize = checkPrize(userReds, userBlue, drawRed, drawBlue);
      if (prize.matched) {
        winCount++;
        prizeCounts[prize.level]++;
        totalPrizeMoney += PRIZE_MONEY[prize.level] || 0;
        if (prize.level < bestLevel) {
          bestLevel = prize.level;
        }
      }

      lastDrawRed = drawRed;
      lastDrawBlue = drawBlue;
    }

    processed = chunkEnd;
    self.postMessage({ type: 'progress', processed, batchSize });
  }

  const levelNames = ['', '一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖'];
  const bestPrize = bestLevel <= 6
    ? { level: bestLevel, name: levelNames[bestLevel], matched: true }
    : { level: 0, name: '未中奖', matched: false };

  self.postMessage({
    type: 'result',
    result: {
      prizeCounts,
      winCount,
      totalPrizeMoney,
      bestPrize,
      lastDrawRed,
      lastDrawBlue,
    },
  });
};