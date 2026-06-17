export const RED_COUNT = 33;
export const BLUE_COUNT = 16;
export const RED_PICK = 6;
export const BLUE_PICK = 1;

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function randomPick(max, count) {
  const arr = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count).sort((a, b) => a - b);
}

export function checkPrize(userReds, userBlue, drawReds, drawBlue) {
  const redMatch = userReds.filter((r) => drawReds.includes(r)).length;
  const blueMatch = userBlue === drawBlue ? 1 : 0;

  if (redMatch === 6 && blueMatch === 1) return { level: 1, name: '一等奖', matched: true, redMatch, blueMatch };
  if (redMatch === 6 && blueMatch === 0) return { level: 2, name: '二等奖', matched: true, redMatch, blueMatch };
  if (redMatch === 5 && blueMatch === 1) return { level: 3, name: '三等奖', matched: true, redMatch, blueMatch };
  if ((redMatch === 5 && blueMatch === 0) || (redMatch === 4 && blueMatch === 1)) return { level: 4, name: '四等奖', matched: true, redMatch, blueMatch };
  if ((redMatch === 4 && blueMatch === 0) || (redMatch === 3 && blueMatch === 1)) return { level: 5, name: '五等奖', matched: true, redMatch, blueMatch };
  if (blueMatch === 1 && (redMatch === 2 || redMatch === 1 || redMatch === 0)) return { level: 6, name: '六等奖', matched: true, redMatch, blueMatch };
  return { level: 0, name: '未中奖', matched: false, redMatch, blueMatch };
}

export const PRIZE_MONEY = {
  1: 5000000,
  2: 200000,
  3: 3000,
  4: 200,
  5: 10,
  6: 5,
};

export const TICKET_COST = 2;

export function getPrizeMoney(level) {
  return PRIZE_MONEY[level] || 0;
}

export function generateDraw() {
  return {
    reds: randomPick(RED_COUNT, RED_PICK),
    blue: randomPick(BLUE_COUNT, BLUE_PICK)[0],
  };
}