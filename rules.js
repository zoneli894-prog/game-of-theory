export function continuation(n, coins = 100) {
  if (!Number.isInteger(n) || n < 1 || n > 5 || !Number.isInteger(coins) || coins < 0) throw new RangeError('无效的海盗人数或金币数');
  if (n === 1) return [coins];
  const next = continuation(n - 1, coins);
  const needed = Math.ceil(n / 2) - 1;
  const candidates = next.map((amount, index) => ({ index: index + 1, cost: amount + 1 }))
    .sort((a, b) => a.cost - b.cost || a.index - b.index);
  const selected = candidates.slice(0, needed);
  const spent = selected.reduce((sum, candidate) => sum + candidate.cost, 0);
  if (spent > coins) throw new RangeError('在这些条件下无法买到足够票数');
  const allocation = Array(n).fill(0);
  allocation[0] = coins - spent;
  for (const candidate of selected) allocation[candidate.index] = candidate.cost;
  return allocation;
}

export function vote(allocation) {
  if (!Array.isArray(allocation) || allocation.length !== 5 ||
      allocation.some(amount => !Number.isInteger(amount) || amount < 0) ||
      allocation.reduce((sum, amount) => sum + amount, 0) !== 100) {
    throw new RangeError('五名海盗的金币数须为非负整数，且总和为 100');
  }
  const fallback = continuation(4, 100);
  const votes = allocation.map((amount, index) => ({
    index,
    amount,
    fallback: index === 0 ? null : fallback[index - 1],
    yes: index === 0 || amount > fallback[index - 1]
  }));
  const yesCount = votes.filter(item => item.yes).length;
  return { votes, yesCount, passed: yesCount >= 3 };
}

const PAYOFFS = {
  CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1]
};

export function dilemmaRound(choice, previousPlayerChoice = null) {
  if (!['C', 'D'].includes(choice) || (previousPlayerChoice !== null && !['C', 'D'].includes(previousPlayerChoice))) {
    throw new RangeError('请选择合作或背叛');
  }
  const opponent = previousPlayerChoice ?? 'C';
  const [playerPoints, opponentPoints] = PAYOFFS[choice + opponent];
  return { player: choice, opponent, playerPoints, opponentPoints };
}

export function auction(value, bid, rivalBids) {
  if (![value, bid].every(x => Number.isInteger(x) && x >= 0 && x <= 100) ||
      !Array.isArray(rivalBids) || rivalBids.length !== 3 ||
      !rivalBids.every(x => Number.isInteger(x) && x >= 0 && x <= 100)) {
    throw new RangeError('估值和四份报价须为 0–100 的整数');
  }
  const bids = [bid, ...rivalBids];
  const ranked = bids.map((amount, index) => ({ amount, index }))
    .sort((a, b) => b.amount - a.amount || (a.index === 0 ? 1 : b.index === 0 ? -1 : a.index - b.index));
  const price = ranked[1].amount;
  const playerWon = ranked[0].index === 0;
  return { bids, winner: ranked[0].index, price, playerWon, profit: playerWon ? value - price : 0 };
}

export function traveler(player, rival) {
  if (![player, rival].every(x => Number.isInteger(x) && x >= 2 && x <= 100)) throw new RangeError('赔偿报价须为 2–100 的整数');
  const low = Math.min(player, rival);
  return { player, rival, playerPayoff: player === rival ? player : low + (player < rival ? 2 : -2), rivalPayoff: player === rival ? rival : low + (rival < player ? 2 : -2) };
}

const CENTIPEDE_PAYOFFS = [[4, 1], [2, 8], [16, 4], [8, 32], [64, 16], [32, 128], [128, 64]];
export function centipedeTake(node) {
  if (!Number.isInteger(node) || node < 0 || node > 6) throw new RangeError('无效的决策节点');
  return [...CENTIPEDE_PAYOFFS[node]];
}

export function beauty(guess, rivals) {
  if (!Number.isInteger(guess) || guess < 0 || guess > 100 || !Array.isArray(rivals) || rivals.length !== 4 || !rivals.every(x => Number.isInteger(x) && x >= 0 && x <= 100)) throw new RangeError('五个数字须为 0–100 的整数');
  const guesses = [guess, ...rivals];
  const mean = guesses.reduce((sum, x) => sum + x, 0) / 5;
  const target = mean * 2 / 3;
  const distance = guesses.map(x => Math.abs(x - target));
  const winner = distance.indexOf(Math.min(...distance));
  return { guesses, mean, target, winner, distance };
}

export function nimMove(heaps, index, count) {
  if (!Array.isArray(heaps) || heaps.length !== 3 || !heaps.every(x => Number.isInteger(x) && x >= 0) ||
      !Number.isInteger(index) || index < 0 || index >= 3 || !Number.isInteger(count) || count < 1 || count > heaps[index]) throw new RangeError('只能从一堆中取走 1 颗或更多石子');
  const next = [...heaps]; next[index] -= count;
  return next;
}

export function nimBot(heaps) {
  if (!Array.isArray(heaps) || heaps.length !== 3 || !heaps.every(x => Number.isInteger(x) && x >= 0) || heaps.every(x => x === 0)) throw new RangeError('棋局已经结束');
  const xor = heaps.reduce((x, n) => x ^ n, 0);
  const index = xor ? heaps.findIndex(n => (n ^ xor) < n) : heaps.findIndex(n => n > 0);
  const count = xor ? heaps[index] - (heaps[index] ^ xor) : 1;
  return { index, count, heaps: nimMove(heaps, index, count) };
}

export function dollarAuction(playerBid, rivalBid) {
  if (![playerBid, rivalBid].every(x => Number.isInteger(x) && x >= 0 && x <= 300) || playerBid === rivalBid) throw new RangeError('出价须不同，且均为 0–300 的整数');
  return { playerPayoff: (playerBid > rivalBid ? 100 : 0) - playerBid, rivalPayoff: (rivalBid > playerBid ? 100 : 0) - rivalBid, winner: playerBid > rivalBid ? 'player' : 'rival' };
}
