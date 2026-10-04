import { continuation, vote, dilemmaRound, auction } from './rules.js';
import { createExpandedGames } from './expanded-games.js';

const app = document.querySelector('#app');
const games = [
  { id: 'pirates', title: '海盗分金', icon: '◈', color: 'gold', question: '100 枚金币，怎样让提案通过？', topic: '逆向归纳 · 投票', label: '约 2 分钟' },
  { id: 'dilemma', title: '囚徒困境', icon: '⇄', color: 'blue', question: '合作还是背叛？连续选择五次。', topic: '策略互动 · 信任', label: '约 1 分钟' },
  { id: 'auction', title: '密封报价拍卖', icon: '◇', color: 'mint', question: '你愿意为一件物品出多少钱？', topic: '机制设计 · 报价', label: '约 1 分钟' },
  { id: 'traveler', title: '旅行者困境', icon: '✦', color: 'blue', question: '同时报价，怎样得到更多赔偿？', topic: '纳什均衡 · 报价', label: '约 2 分钟' },
  { id: 'centipede', title: '蜈蚣博弈', icon: '↗', color: 'mint', question: '现在拿走，还是继续传递？', topic: '逆向归纳 · 信任', label: '约 2 分钟' },
  { id: 'beauty', title: '猜平均数 2/3', icon: '⅔', color: 'gold', question: '猜中大家所猜平均数的三分之二。', topic: '多层推理 · 预期', label: '约 2 分钟' },
  { id: 'nim', title: 'Nim 取石子', icon: '▦', color: 'blue', question: '三堆石子，取走最后一颗就赢。', topic: '必胜策略 · 异或', label: '约 2 分钟' },
  { id: 'dollar', title: '百元拍卖', icon: '¥', color: 'mint', question: '第一和第二名都要付款，你还加价吗？', topic: '沉没成本 · 升级', label: '约 2 分钟' }
];
const scenarios = [
  { value: 70, bids: [55, 60, 35] },
  { value: 45, bids: [30, 48, 12] },
  { value: 90, bids: [80, 65, 72] }
];
let currentGame = null;
let pirateResult = null;
let pirateAllocation = [100, 0, 0, 0, 0];
let pirateAttempts = [];
let pirateEnded = false;
let dilemmaHistory = [];
let dilemmaRuns = [];
let dilemmaEnded = false;
let auctionScenario = 0;
let auctionResult = null;
let auctionBid = 70;
let auctionAttempts = [];
let auctionEnded = false;
let pendingFinish = null;
const expanded = createExpandedGames(shell);
const actionLabel = choice => choice === 'C' ? '合作' : '背叛';

function selectGame(id) {
  currentGame = id;
  pirateResult = null;
  pirateAllocation = [100, 0, 0, 0, 0];
  pirateAttempts = [];
  pirateEnded = false;
  dilemmaHistory = [];
  dilemmaRuns = [];
  dilemmaEnded = false;
  auctionResult = null;
  auctionScenario = 0;
  auctionBid = scenarios[0].value;
  auctionAttempts = [];
  auctionEnded = false;
  pendingFinish = null;
  expanded.select(id);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function finishPrompt() {
  return `<div class="finish-prompt" role="group" aria-labelledby="finish-prompt-title">
    <h3 id="finish-prompt-title">确定结束游戏吗？</h3>
    <p>结束后会揭晓参考答案和原理。你也可以继续尝试。</p>
    <div class="actions"><button class="btn secondary" data-action="finish-cancel">继续尝试</button><button class="btn" data-action="finish-confirm">确认结束并揭晓</button></div>
  </div>`;
}

function shell(title, eyebrow, intro, content, goal, rules) {
  return `<div class="game-top"><button class="back" data-action="home">← 返回游戏馆</button><span class="badge">${eyebrow}</span></div>
    <div class="game-head"><h1>${title}</h1><p>${intro}</p></div>
    <div class="layout"><section class="panel">${content}${pendingFinish === currentGame ? finishPrompt() : ''}</section><aside class="rule-panel"><h2>任务目标</h2><p>${goal}</p><h2>本局规则</h2>${rules}</aside></div>`;
}

function home() {
  return `<section class="intro"><span class="eyebrow">INTERACTIVE LAB / 互动实验</span>
    <h1>先做选择，<br>再看选择背后的道理。</h1>
    <p>八场短小的决策实验。每次尝试立即看结果；决定不再尝试时，再揭晓参考答案与原理。</p></section>
    <div class="grid">${games.map(game => `<article class="card"><div class="glyph ${game.color}" aria-hidden="true">${game.icon}</div><h2>${game.title}</h2><p>${game.question}</p><small>${game.topic} · ${game.label}</small><button class="btn" data-game="${game.id}">开始游戏 →</button></article>`).join('')}</div>`;
}

function pirateKnowledge() {
  const rows = [1, 2, 3, 4, 5].map(n => `<tr><td>${n} 人</td><td>${continuation(n).join('、')}</td></tr>`).join('');
  return `<details class="knowledge"><summary>了解原理与知识：为什么 98 / 0 / 1 / 0 / 1 可行？</summary><div class="inner">
    <h3>第一步：把“反对”后的结果算出来</h3>
    <p>海盗不会只看眼前拿到多少，还会比较提案失败后，下一位海盗提出方案时自己能拿多少。按本局偏好，生存相同时，<strong>眼前的金币必须严格多于下一轮</strong>，才值得投赞成票；拿到一样多会投反对票。</p>
    <p>因此从只剩 1 人开始，逐步往前倒推。下表每行都从那一轮的提案者开始排列，不是始终指同五个人：</p>
    <table><thead><tr><th>剩余人数</th><th>从当前提案者起的分配</th></tr></thead><tbody>${rows}</tbody></table>
    <p>只剩 2 人时，规则是<strong>至少半数</strong>赞成即可通过，提案者自己的 1 票已经够了，所以可以独得 100。剩 3 人时需要 2 票：若失败，下一轮的第 2 位海盗得 0，给他 1 枚换票，提案者留 99。剩 4 人仍只需 2 票：挑一位在三人局拿 0 的海盗，给 1 枚即可，得到 99 / 0 / 1 / 0。</p>
    <h3>第二步：找到最省金币的两张票</h3>
    <p>五人局至少需要 3 票，提案者先有自己一票。若提案失败，四人局的方案是 99 / 0 / 1 / 0，分别属于原来的 2、3、4、5 号海盗。3 号和 5 号到时都得 0，眼前给他们各 1 枚，他们就会赞成；提案者留下 98 枚。给下一轮将得 1 或 99 枚的人争取一票，成本会更高。</p>
    <h3>这局体现什么知识？</h3>
    <p><strong>逆向归纳</strong>是先求最后一步的理性选择，再把它当作前一步的已知后果。这里也体现了<strong>子博弈精炼均衡</strong>的想法：不能只让开局方案看起来合理，还要让后续每个可能发生的局面也按同样的规则推得通。你每次尝试后看到的“若失败，下轮得多少”，就是每名海盗用来比较的备选结果。</p>
    <p class="lesson-takeaway">希望你记住：谈判时，决定一张赞成票是否“划算”的是对方<strong>拒绝你后能得到什么</strong>；投票门槛则决定你需要争取多少人。</p>
    <p class="subtle">适用条件：金币不可拆分、每人先保命再争金币、完全无差别时反对，且赞成票达到至少半数即通过。换一种投票门槛或偏好，参考答案就可能改变。</p>
  </div></details>`;
}

function pirates() {
  const record = pirateAttempts.length ? `<details class="knowledge"><summary>查看全部 ${pirateAttempts.length} 次尝试</summary><div class="inner"><ul class="round-list">${pirateAttempts.map((attempt, i) => `<li><span>第 ${i + 1} 次 · ${attempt.allocation.join(' / ')}</span><strong>${attempt.result.yesCount} 票 · ${attempt.result.passed ? '通过' : '未通过'}</strong></li>`).join('')}</ul></div></details>` : '';
  const body = pirateEnded ? `<h2>参考答案</h2><p class="result-lead">98 / 0 / 1 / 0 / 1：你保留 98 枚，给 3 号和 5 号各 1 枚，获得恰好 3 票。</p>${pirateResult ? pirateOutcome(pirateResult) : ''}${record}${pirateKnowledge()}<div class="actions"><button class="btn" data-action="pirate-restart">重新开始游戏</button></div>` : `<h2>你的分配方案</h2><p class="subtle">你是 1 号海盗。给五个人分配 100 枚金币，再交给他们投票。</p>
    <div class="fields">${Array.from({ length: 5 }, (_, i) => `<div class="field"><label for="pirate-${i}">${i + 1} 号${i === 0 ? '（你）' : ''}</label><input id="pirate-${i}" class="pirate-input" type="number" min="0" max="100" step="1" inputmode="numeric" value="${pirateAllocation[i]}"></div>`).join('')}</div>
    <div class="total"><span>已分配 / 应分配</span><strong id="coin-total">${pirateAllocation.reduce((a, b) => a + b, 0)} / 100</strong></div>
    <button class="btn" data-action="pirate-submit">提交方案，查看投票</button><div class="error" id="pirate-error" role="alert"></div>
    ${pirateResult ? pirateOutcome(pirateResult) : ''}${record}${pirateAttempts.length ? `<div class="actions"><button class="btn secondary" data-action="pirate-finish">结束游戏，揭晓参考答案</button></div>` : ''}`;
  return shell('海盗分金', '游戏 01 / 顺序决策', '你能让自己的方案通过，同时尽可能多地保留金币吗？', body,
    '争取至少 3 票让分配方案通过，并让自己保留尽可能多的金币。',
    '<p>5 名海盗、100 枚金币；提案者参与投票。至少 3 票赞成即通过。</p><p>失败则提案者出局，下一人提案。每个人先求生存，再求更多金币；两项都一样时投反对票。</p>');
}

function pirateOutcome(result) {
  return `<div class="result" aria-live="polite"><span class="eyebrow">投票结束</span><h2>${result.passed ? '方案通过' : '方案未通过'}</h2>
    <p class="result-lead">${result.yesCount} / 5 人赞成。${result.passed ? '你留在船上，按这份方案分金币。' : '你出局，2 号海盗将接着提出方案。'}</p>
    <ul class="vote-list">${result.votes.map(v => `<li><span>${v.index + 1} 号${v.index === 0 ? '（你）' : ''} · 得 ${v.amount} 枚</span><span><span class="pill ${v.yes ? '' : 'no'}">${v.yes ? '赞成' : '反对'}</span><br><span class="subtle">${v.index === 0 ? '自己提出的方案' : `若失败，下轮得 ${v.fallback} 枚`}</span></span></li>`).join('')}</ul>
    ${pirateEnded ? '' : '<div class="actions"><button class="btn secondary" data-action="pirate-reset">换个方案再试</button></div>'}</div>`;
}

function dilemmaKnowledge() {
  return `<details class="knowledge"><summary>了解原理与知识：为什么理性选择可能让双方都吃亏？</summary><div class="inner">
    <h3>先看单轮：背叛为什么有吸引力</h3>
    <p>如果对手合作，你背叛得 5 分，合作得 3 分；如果对手背叛，你背叛得 1 分，合作得 0 分。无论对手怎么选，单轮里背叛都让你得分更高，这叫<strong>严格占优策略</strong>。</p>
    <table><thead><tr><th>你的选择 / 对手的选择</th><th>合作</th><th>背叛</th></tr></thead><tbody><tr><td>合作</td><td>3 / 3</td><td>0 / 5</td></tr><tr><td>背叛</td><td>5 / 0</td><td>1 / 1</td></tr></tbody></table>
    <p>格子里的数字依次是“你的分数 / 对手的分数”。双方都背叛时，没有人能靠单独改成合作提高自己的单轮得分，因此（背叛，背叛）是<strong>纳什均衡</strong>。但双方合作可各得 3 分，比双方背叛各得 1 分更好：个体有利的选择可能带来对双方都较差的结果。</p>
    <h3>再看五轮：现在的选择会改变以后</h3>
    <p>本游戏的对手第一轮合作，此后复制你上一轮的行动。这叫<strong>以牙还牙</strong>策略：它会回应合作，也会回应背叛。你在某轮背叛可能立即多得分，却可能让对手下一轮背叛；持续合作时，双方每轮可各得 3 分，五轮各得 15 分。</p>
    <p>如果目标是<strong>在这个预设电脑面前最大化你自己的五轮总分</strong>，可以前四轮合作、最后一轮背叛：你得到 3 + 3 + 3 + 3 + 5 = 17 分。最后一轮背叛没有第六轮的回应代价。这是对已知电脑程序的最佳应对，不能据此断言真人之间也一定会这样选择。</p>
    <p class="lesson-takeaway">希望你记住：分析一场互动，要先问它是<strong>只进行一次，还是会反复进行</strong>；还要区分“我这一轮多得多少”与“我的行动会怎样影响下一轮”。</p>
    <p class="subtle">边界：对手在这里是固定程序，不会像完全理性的玩家那样重新规划。五轮记录说明这套策略会产生什么结果，不是五轮博弈均衡的证明；若双方都知道互动恰好五轮、只追求自己的分数且共同知道这一点，可以从最后一轮往前推，得到每轮都背叛的结论。</p>
  </div></details>`;
}

function dilemma() {
  const finished = dilemmaHistory.length === 5;
  const lastCompleted = dilemmaRuns.at(-1) ?? [];
  const playerTotal = dilemmaHistory.reduce((sum, round) => sum + round.playerPoints, 0);
  const opponentTotal = dilemmaHistory.reduce((sum, round) => sum + round.opponentPoints, 0);
  const history = dilemmaHistory.length ? `<ul class="round-list">${dilemmaHistory.map((r, i) => `<li><span>第 ${i + 1} 轮 · 你${actionLabel(r.player)}，对手${actionLabel(r.opponent)}</span><strong>+${r.playerPoints} / +${r.opponentPoints}</strong></li>`).join('')}</ul>` : '';
  const pastRuns = dilemmaRuns.length > (finished ? 1 : 0) ? `<details class="knowledge"><summary>查看之前的对局</summary><div class="inner"><ul class="round-list">${dilemmaRuns.slice(0, finished ? -1 : undefined).map((run, i) => `<li><span>第 ${i + 1} 局</span><strong>你 ${run.reduce((s, r) => s + r.playerPoints, 0)} 分 / 对手 ${run.reduce((s, r) => s + r.opponentPoints, 0)} 分</strong></li>`).join('')}</ul></div></details>` : '';
  const content = dilemmaEnded ? `<h2>五轮决策背后的原理</h2><p class="result-lead">单轮中双方背叛是纳什均衡；面对本游戏固定回应的电脑，你个人的五轮最高分是先合作四轮、最后背叛，共 17 分。</p>
    <div class="stats"><div class="stat"><strong>${lastCompleted.reduce((s, r) => s + r.playerPoints, 0)}</strong><span>最近完成的一局 · 你的总分</span></div><div class="stat"><strong>${lastCompleted.reduce((s, r) => s + r.opponentPoints, 0)}</strong><span>对手总分</span></div></div>
    <ul class="round-list">${lastCompleted.map((r, i) => `<li><span>第 ${i + 1} 轮 · 你${actionLabel(r.player)}，对手${actionLabel(r.opponent)}</span><strong>+${r.playerPoints} / +${r.opponentPoints}</strong></li>`).join('')}</ul>${dilemmaKnowledge()}${pastRuns}<div class="actions"><button class="btn" data-action="dilemma-restart">重新开始游戏</button></div>` : `<div class="progress" aria-label="已完成 ${dilemmaHistory.length} 轮，共 5 轮">${Array.from({ length: 5 }, (_, i) => `<span class="${i < dilemmaHistory.length ? 'done' : ''}"></span>`).join('')}</div>
    <h2>${finished ? '本局结算' : `第 ${dilemmaHistory.length + 1} 轮：你怎么选？`}</h2>
    <p class="subtle">你们同时决定合作或背叛；提交后才能看到对方这轮的行动。</p>
    ${finished ? `<div class="stats"><div class="stat"><strong>${playerTotal}</strong><span>你的总分</span></div><div class="stat"><strong>${opponentTotal}</strong><span>对手总分</span></div></div>` : `<div class="choice-row"><button class="btn" data-choice="C">选择合作</button><button class="btn warn" data-choice="D">选择背叛</button></div>`}
    ${history}${pastRuns}${finished ? `<div class="actions"><button class="btn secondary" data-action="dilemma-reset">再玩五轮</button><button class="btn" data-action="dilemma-finish">结束游戏，揭晓原理</button></div>` : dilemmaHistory.length ? `<p class="hint">上一轮结果已记录。继续做下一轮选择。</p>` : ''}${!finished && dilemmaRuns.length ? `<div class="actions"><button class="btn secondary" data-action="dilemma-finish">不再尝试，揭晓原理</button></div>` : ''}`;
  return shell('囚徒困境', '游戏 02 / 同时决策', '对方也在选择。五轮过后，你们会建立合作，还是互相背叛？', content,
    '连续做出 5 次合作或背叛的选择，争取更高的总分，并观察对手的回应。',
    '<p>双方合作：各得 3 分；一方背叛：背叛者 5 分、合作者 0 分；双方背叛：各得 1 分。</p><p>每局 5 轮，逐轮结算。对手的完整策略在结束游戏后公开。</p>');
}

function auctionKnowledge() {
  return `<details class="knowledge"><summary>了解原理与知识：拍卖规则怎样改变出价策略？</summary><div class="inner">
    <h3>先区分报价、付款和收益</h3>
    <p>在本局，出价最高者获得物品，但支付的是<strong>第二高报价</strong>，并非自己的报价。若物品对你值 70，其他人的最高报价为 60，你出 70 并赢得物品时支付 60，收益是 70 − 60 = 10。</p>
    <h3>为什么如实报价是弱占优策略？</h3>
    <p>设物品对你的价值为 v，其他人的最高报价为 m。如果 v 大于 m，赢下物品会得到正收益 v − m，报 v 能赢；如果 v 小于 m，赢下物品反而亏损，报 v 会避免这种结果；如果 v 等于 m，赢或输的收益都是 0。在本局“同价时对手优先”的规则下，这三种情况也成立。</p>
    <p>举个高报的风险：物品对你值 70，对手最高报 80；你若虚报 90，赢了要付 80，净亏 10。低报也有代价：物品值 70、对手最高报 60，你只报 50 会落选，错过原本能得到的 10。报 70 时会在该赢的情况赢，在该避开的情况避开。</p>
    <p>所以对<strong>任意固定的其他人报价</strong>，报出真实价值都不会比虚报更差，称为<strong>弱占优策略</strong>。报得更高有时结果不变，却可能让你在对手报价高于自身价值时亏损；报得更低有时结果不变，却可能错失有利交易。</p>
    <h3>这体现了什么机制设计知识？</h3>
    <p>机制设计研究如何设置分配和付款规则，使参与者按规则行动时出现我们希望的行为。第二价格拍卖是<strong>激励相容</strong>的直观例子：在上述条件下，真实报告价值对竞拍者有利，设计者不必靠劝说要求大家诚实。它和本站“百元拍卖”规则不同：这里<strong>仅赢家付款，且支付第二高报价</strong>；百元拍卖的前两名都支付自己的报价，不能把本局的诚实报价结论照搬过去。</p>
    <p class="lesson-takeaway">希望你记住：策略不只由玩家的性格决定，<strong>规则本身会改变玩家的激励</strong>；比较报价时还要看最终付款和实际收益。</p>
    <p class="subtle">适用条件：只拍一件物品、每人有自己的价值、收益等于价值减付款、无额外费用或外部影响。真实拍卖可能有保留价、费用或其他规则，不能直接套用这局结论。</p>
  </div></details>`;
}

function auctionGame() {
  const scene = scenarios[auctionScenario];
  const result = auctionResult;
  const record = auctionAttempts.length ? `<details class="knowledge"><summary>查看全部 ${auctionAttempts.length} 次尝试</summary><div class="inner"><ul class="round-list">${auctionAttempts.map((attempt, i) => `<li><span>第 ${i + 1} 次 · 场景 ${attempt.scenario + 1}，报价 ${attempt.bid}</span><strong>${attempt.result.playerWon ? '获胜' : '落选'} · 收益 ${attempt.result.profit}</strong></li>`).join('')}</ul></div></details>` : '';
  const content = auctionEnded ? `<h2>参考策略</h2><p class="result-lead">在本局的第二价格拍卖规则下，按物品对自己的真实价值报价是弱占优策略；这不保证每次都获胜。</p>${result ? `<div class="stats"><div class="stat"><strong>${result.price}</strong><span>最近一次成交价</span></div><div class="stat"><strong>${result.profit}</strong><span>最近一次收益</span></div></div>` : ''}${record}${auctionKnowledge()}<div class="actions"><button class="btn" data-action="auction-restart">重新开始游戏</button></div>` : `<span class="badge">场景 ${auctionScenario + 1} / ${scenarios.length}</span>
    <h2 style="margin-top:14px">这件物品对你值 <strong>${scene.value}</strong> 枚金币</h2>
    <p class="subtle">另外三位竞拍者也会同时提交报价，你现在看不到他们的数字。</p>
    <div class="bid-area"><label for="bid">你的密封报价<input id="bid" class="bid-input" type="number" min="0" max="100" step="1" inputmode="numeric" value="${auctionBid}"></label><button class="btn" data-action="auction-submit">提交报价，查看本局结果</button></div><div class="error" id="auction-error" role="alert"></div>
    ${result ? `<div class="result" aria-live="polite"><span class="eyebrow">拍卖结束</span><h2>${result.playerWon ? '你赢得了物品' : '物品被其他人拍走'}</h2>
      <div class="stats"><div class="stat"><strong>${result.price}</strong><span>赢家支付</span></div><div class="stat"><strong>${result.profit}</strong><span>你的收益</span></div></div>
      <ul class="bid-list">${result.bids.map((b, i) => `<li><span>${i === 0 ? '你' : `${i} 号竞拍者`}${result.winner === i ? ' · 获胜' : ''}</span><span>报价 ${b}</span></li>`).join('')}</ul>
      <p class="subtle">最高报价并列时，对手优先。你的收益 = ${result.playerWon ? `${scene.value}（个人价值）－ ${result.price}（支付）` : '0（未获胜）'}。</p>
      <div class="actions"><button class="btn secondary" data-action="auction-retry">同一件物品，换个报价</button><button class="btn" data-action="auction-next">${auctionScenario < scenarios.length - 1 ? '挑战下一件物品' : '回到第一件物品'}</button></div></div>` : ''}${record}${auctionAttempts.length ? `<div class="actions"><button class="btn secondary" data-action="auction-finish">结束游戏，揭晓参考策略</button></div>` : ''}`;
  return shell('密封报价拍卖', '游戏 03 / 机制设计', '你知道物品对自己的价值，却不知道其他人会出价多少。', content,
    '根据物品对你的价值报价，尽量提高自己的收益；你可以在同一场景反复尝试。',
    '<p>出价最高者获得物品，却只支付第二高的报价。若最高价并列，本局由对手优先。</p><p>赢家收益 = 自己对物品的价值 − 成交价；未获胜收益为 0。</p>');
}

function render() {
  app.innerHTML = currentGame === 'pirates' ? pirates() : currentGame === 'dilemma' ? dilemma() : currentGame === 'auction' ? auctionGame() : expanded.has(currentGame) ? expanded.view(currentGame) : home();
}

document.querySelector('#brand').addEventListener('click', () => { currentGame = null; render(); });
app.addEventListener('input', event => {
  if (event.target.classList.contains('pirate-input')) {
    if (pirateResult) { pirateResult = null; app.querySelector('.result')?.remove(); }
    const values = [...app.querySelectorAll('.pirate-input')].map(input => Number(input.value));
    app.querySelector('#coin-total').textContent = `${values.reduce((sum, x) => sum + x, 0)} / 100`;
    app.querySelector('#pirate-error').textContent = '';
  }
  if (event.target.id === 'bid') {
    if (auctionResult) { auctionResult = null; app.querySelector('.result')?.remove(); }
    app.querySelector('#auction-error').textContent = '';
  }
});
app.addEventListener('click', event => {
  const gameButton = event.target.closest('[data-game]');
  if (gameButton) return selectGame(gameButton.dataset.game);
  const nimButton = event.target.closest('[data-nim]');
  if (nimButton && currentGame === 'nim') {
    pendingFinish = null;
    expanded.nimTurn(nimButton.dataset.nim);
    render(); return;
  }
  const choiceButton = event.target.closest('[data-choice]');
  if (choiceButton && currentGame === 'dilemma' && !dilemmaEnded && dilemmaHistory.length < 5) {
    pendingFinish = null;
    dilemmaHistory.push(dilemmaRound(choiceButton.dataset.choice, dilemmaHistory.at(-1)?.player ?? null));
    if (dilemmaHistory.length === 5) dilemmaRuns.push([...dilemmaHistory]);
    render();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'finish-cancel') { pendingFinish = null; render(); return; }
  if (action === 'finish-confirm') {
    if (pendingFinish !== currentGame) return;
    if (currentGame === 'pirates' && pirateAttempts.length) pirateEnded = true;
    if (currentGame === 'dilemma' && dilemmaRuns.length) dilemmaEnded = true;
    if (currentGame === 'auction' && auctionAttempts.length) auctionEnded = true;
    if (expanded.has(currentGame) && expanded.canFinish(currentGame)) expanded.finish(currentGame);
    pendingFinish = null;
    render();
    return;
  }
  if (action === 'home') { pendingFinish = null; currentGame = null; }
  if (action === 'pirate-submit') {
    pendingFinish = null;
    const inputs = [...app.querySelectorAll('.pirate-input')];
    const values = inputs.map(input => input.value.trim() === '' ? NaN : Number(input.value));
    try {
      const result = vote(values);
      pirateResult = result;
      pirateAllocation = values;
      pirateAttempts.push({ allocation: [...values], result });
      render();
      app.querySelector('.result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      app.querySelector('#pirate-error').textContent = error.message;
      inputs.forEach((input, i) => input.setAttribute('aria-invalid', !Number.isInteger(values[i]) || values[i] < 0 ? 'true' : 'false'));
    }
    return;
  }
  if (action === 'pirate-reset') pirateResult = null;
  if (action === 'pirate-finish') {
    if (!pirateAttempts.length) return;
    pendingFinish = 'pirates'; render();
    app.querySelector('[data-action="finish-confirm"]')?.focus();
    return;
  }
  if (action === 'pirate-restart') return selectGame('pirates');
  if (action === 'dilemma-finish') {
    if (!dilemmaRuns.length) return;
    pendingFinish = 'dilemma'; render();
    app.querySelector('[data-action="finish-confirm"]')?.focus();
    return;
  }
  if (action === 'dilemma-reset') { pendingFinish = null; dilemmaHistory = []; }
  if (action === 'dilemma-restart') return selectGame('dilemma');
  if (action === 'auction-submit') {
    pendingFinish = null;
    const input = app.querySelector('#bid');
    const bid = input.value.trim() === '' ? NaN : Number(input.value);
    try {
      const scene = scenarios[auctionScenario];
      const result = auction(scene.value, bid, scene.bids);
      auctionResult = result;
      auctionBid = bid;
      auctionAttempts.push({ scenario: auctionScenario, bid, result });
      render();
      app.querySelector('.result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      app.querySelector('#auction-error').textContent = error.message;
      input.setAttribute('aria-invalid', 'true');
    }
    return;
  }
  if (action === 'auction-retry') auctionResult = null;
  if (action === 'auction-next') { auctionScenario = (auctionScenario + 1) % scenarios.length; auctionResult = null; auctionBid = scenarios[auctionScenario].value; }
  if (action === 'auction-finish') {
    if (!auctionAttempts.length) return;
    pendingFinish = 'auction'; render();
    app.querySelector('[data-action="finish-confirm"]')?.focus();
    return;
  }
  if (action === 'auction-restart') return selectGame('auction');
  if (expanded.has(currentGame) && action === `${currentGame}-finish`) {
    if (!expanded.canFinish(currentGame)) return;
    pendingFinish = currentGame; render();
    app.querySelector('[data-action="finish-confirm"]')?.focus();
    return;
  }
  if (expanded.has(currentGame) && expanded.action(action, app)) { pendingFinish = null; render(); return; }
  render();
});

render();

// Optional browser-agent controls mirror the same game state as the visible buttons.
if (document.modelContext?.registerTool) {
  const register = tool => {
    try { Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {}); } catch { /* unsupported browser */ }
  };
  register({
    name: 'submit_pirate_offer', title: '提交海盗分金方案',
    description: '提交五名海盗各得的整数金币，显示投票结果。',
    inputSchema: { type: 'object', properties: { allocation: { type: 'array', items: { type: 'integer', minimum: 0 }, minItems: 5, maxItems: 5 } }, required: ['allocation'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (pirateEnded) throw new RangeError('游戏已结束，请先重新开始');
      const result = vote(input?.allocation);
      currentGame = 'pirates'; pirateAllocation = [...input.allocation]; pirateResult = result;
      pirateAttempts.push({ allocation: [...input.allocation], result }); render();
      return { passed: result.passed, yesCount: result.yesCount, votes: result.votes.map(v => v.yes) };
    }
  });
  register({
    name: 'finish_pirate_game', title: '结束海盗分金游戏',
    description: '至少尝试一次后，在页面显示结束确认，不立即揭晓。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (!pirateAttempts.length) throw new RangeError('需要先提交一个方案');
      currentGame = 'pirates'; pendingFinish = 'pirates'; render();
      return { status: 'awaiting_confirmation' };
    }
  });
  register({
    name: 'play_dilemma_round', title: '玩一轮囚徒困境',
    description: '在当前五轮对局中选择合作 C 或背叛 D，并显示本轮结果。',
    inputSchema: { type: 'object', properties: { choice: { type: 'string', enum: ['C', 'D'] } }, required: ['choice'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (dilemmaEnded || dilemmaHistory.length === 5) throw new RangeError('当前一局已完成，请先重新开始五轮');
      const round = dilemmaRound(input?.choice, dilemmaHistory.at(-1)?.player ?? null);
      currentGame = 'dilemma'; dilemmaHistory.push(round);
      if (dilemmaHistory.length === 5) dilemmaRuns.push([...dilemmaHistory]);
      render();
      return { round: dilemmaHistory.length, ...round, finished: dilemmaHistory.length === 5 };
    }
  });
  register({
    name: 'retry_dilemma_game', title: '再玩五轮囚徒困境',
    description: '保留此前结算，开始新的一局五轮选择。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (dilemmaEnded || dilemmaHistory.length !== 5) throw new RangeError('先完成当前五轮');
      dilemmaHistory = []; render();
      return { status: 'new_run', completedRuns: dilemmaRuns.length };
    }
  });
  register({
    name: 'finish_dilemma_game', title: '结束囚徒困境',
    description: '至少完成一局后，在页面显示结束确认，不立即揭晓原理。每局结算无需结束即可查看。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (!dilemmaRuns.length) throw new RangeError('需要先完成五轮选择');
      currentGame = 'dilemma'; pendingFinish = 'dilemma'; render();
      return { status: 'awaiting_confirmation' };
    }
  });
  register({
    name: 'submit_auction_bid', title: '提交拍卖报价',
    description: '向当前场景提交 0–100 的整数报价，显示赢家和第二价格。',
    inputSchema: { type: 'object', properties: { bid: { type: 'integer', minimum: 0, maximum: 100 } }, required: ['bid'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (auctionEnded) throw new RangeError('游戏已结束，请先重新开始');
      const scene = scenarios[auctionScenario];
      const result = auction(scene.value, input?.bid, scene.bids);
      currentGame = 'auction'; auctionBid = input.bid; auctionResult = result;
      auctionAttempts.push({ scenario: auctionScenario, bid: input.bid, result }); render();
      return { scenario: auctionScenario + 1, value: scene.value, ...result };
    }
  });
  register({
    name: 'finish_auction_game', title: '结束拍卖游戏',
    description: '至少报价一次后，在页面显示结束确认，不立即揭晓参考策略。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (!auctionAttempts.length) throw new RangeError('需要先提交一次报价');
      currentGame = 'auction'; pendingFinish = 'auction'; render();
      return { status: 'awaiting_confirmation' };
    }
  });
  register({
    name: 'confirm_end_game', title: '确认结束并揭晓',
    description: '确认当前页面显示的结束选择，结束尝试并揭晓参考答案及原理。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (pendingFinish !== currentGame || !pendingFinish) throw new RangeError('请先选择结束游戏');
      if (currentGame === 'pirates') pirateEnded = true;
      if (currentGame === 'dilemma') dilemmaEnded = true;
      if (currentGame === 'auction') auctionEnded = true;
      pendingFinish = null; render();
      return { status: 'revealed', game: currentGame };
    }
  });
}
