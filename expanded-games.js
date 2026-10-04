import { traveler, centipedeTake, beauty, nimMove, nimBot, dollarAuction } from './rules.js';

const opponents = [80, 100, 2];
const groups = [[50, 40, 30, 20], [33, 24, 15, 6], [12, 9, 6, 3]];
const boards = [[3, 4, 5], [1, 3, 5], [2, 4, 7]];
const ids = ['traveler', 'centipede', 'beauty', 'nim', 'dollar'];
const controls = id => `<div class="actions"><button class="btn secondary" data-action="${id}-finish">结束游戏，揭晓参考策略</button></div>`;
const lesson = (title, content) => `<details class="knowledge"><summary>知识与原理：${title}</summary><div class="inner">${content}</div></details>`;
const records = (items, render) => items.length ? `<details class="knowledge"><summary>查看全部 ${items.length} 次尝试</summary><div class="inner"><ul class="round-list">${items.map(render).join('')}</ul></div></details>` : '';

export function createExpandedGames(shell) {
  let s = {};
  function reset(id) {
    if (id === 'traveler') s.traveler = { scenario: 0, result: null, attempts: [], ended: false };
    if (id === 'centipede') s.centipede = { node: 0, log: [], attempts: [], payoff: null, ended: false };
    if (id === 'beauty') s.beauty = { scenario: 0, result: null, attempts: [], ended: false };
    if (id === 'nim') s.nim = { board: 0, heaps: [...boards[0]], log: [], attempts: [], winner: null, ended: false };
    if (id === 'dollar') s.dollar = { player: 0, rival: 5, log: [], attempts: [], payoff: null, ended: false };
  }
  const has = id => ids.includes(id);
  const canFinish = id => has(id) && (s[id]?.attempts.length > 0 || s[id]?.log?.length > 0);
  const finish = id => { s[id].ended = true; };

  function travelerView() {
    const x = s.traveler;
    const last = x.result;
    const history = records(x.attempts, (a, i) => `<li><span>第 ${i + 1} 次 · 你报 ${a.player}，对手报 ${a.rival}</span><strong>你得 ${a.playerPayoff} / 对手 ${a.rivalPayoff}</strong></li>`);
    const result = last ? `<div class="result" aria-live="polite"><h2>本次结算</h2><p class="result-lead">你报 ${last.player}，对手报 ${last.rival}。你得到 <strong>${last.playerPayoff}</strong>，对手得到 <strong>${last.rivalPayoff}</strong>。</p><p class="subtle">${last.player === last.rival ? '报价相同，各按自己的报价获得赔偿。' : `以较低报价 ${Math.min(last.player, last.rival)} 为基数；低报者多得 2，高报者少得 2。`}</p></div>` : '';
    const knowledge = lesson('为什么最后可能都报 2？', `<h3>先看你这一局</h3><p>两人同时报 2–100 的整数。报得相同，各拿所报金额；报价不同时，两人都以较低报价为基数，低报者加 2，高报者减 2。例如对手报 80：你报 80 得 80，报 79 得 81，对手只得 77。</p><h3>再问对手会怎样回应</h3><p>如果双方约好报 100，任何一人改报 99 都会从 100 增到 101。因此双报 100 不稳定；对手如果也预料你会降到 99，就可能再降到 98。这个“再降一格”的推理可以一直往下进行。到下界 2 时，再也不能压低；面对对手报 2，自己报 2 得 2，报高至少 1 格则得 0。（2，2）构成此规则下的纳什均衡。</p><h3>你应该学到什么</h3><p>纳什均衡说的是<strong>给定别人不改变，自己单独改主意无法变得更好</strong>，不代表两人合计收益最高：双报 100 会让双方各得 100。你在游戏中面对的是固定报价的模拟对手，单次最佳应对可能很高；别把“面对已知对手的最佳应对”与“两名理性玩家共同推导出的均衡”混为一谈。</p><p class="lesson-takeaway">带走一个问题：一个看起来对双方更好的约定，是否经得起其中一人偷偷改变策略？</p><p class="subtle">上述结论依赖报价范围、整数步长和奖罚都为 2。改变奖金、可报区间或参与人数，需要重新计算。</p>`);
    return shell('旅行者困境', '游戏 04 / 同时报价', '行李损坏后，你和另一位旅行者分别向航空公司报价。', x.ended ? `<h2>参考答案</h2><p class="result-lead">两名同样理性的玩家反复预判时，本局规则的纳什均衡为双方都报 2；固定对手的单次最优报价未必是 2。</p>${result}${history}${knowledge}<div class="actions"><button class="btn" data-action="traveler-restart">重新开始游戏</button></div>` : `<h2>你要报多少？</h2><p class="subtle">对手同时报数，提交后才会看到其报价和你们各自得到的金额。共三种对手报价，可在同一场景重试。</p><div class="bid-area"><label for="claim">你的索赔报价<input id="claim" class="bid-input" type="number" min="2" max="100" step="1" value="${last?.player ?? 80}"></label><button class="btn" data-action="traveler-submit">提交并结算</button></div><div class="error" id="traveler-error" role="alert"></div>${result}${last ? `<div class="actions"><button class="btn secondary" data-action="traveler-retry">同一对手再试</button><button class="btn" data-action="traveler-next">下一位对手</button></div>` : ''}${history}${canFinish('traveler') ? controls('traveler') : ''}`,
      '在不知道对手报价的情况下选择索赔金额，观察你自己的收益，以及对手因你的报价受到的影响。',
      '<p>双方分别报 2–100 的整数；相同则各得所报金额。不同则以较低报价为基数，低报者多得 2，高报者少得 2。</p><p>三个场景的模拟对手报价预先固定；可反复挑战同一个对手。</p>');
  }

  function centipedeView() {
    const x = s.centipede;
    const log = x.log.length ? `<div class="result" aria-live="polite"><h2>本轮记录</h2><ul class="round-list">${x.log.map(line => `<li><span>${line}</span></li>`).join('')}</ul>${x.payoff ? `<p class="result-lead">本局结算：你得 ${x.payoff[0]}，电脑得 ${x.payoff[1]}。</p>` : ''}</div>` : '';
    const history = records(x.attempts, (a, i) => `<li><span>第 ${i + 1} 局</span><strong>你 ${a[0]} / 电脑 ${a[1]}</strong></li>`);
    const knowledge = lesson('为什么倒推会在第一步拿走？', `<h3>从最后一步开始</h3><p>六个决策节点，奇数步轮到你，偶数步轮到电脑。最后第 6 步电脑若拿走，获得 128；若继续到终点，只得 64，因此选择拿走。知道这一点，你在第 5 步继续只能得 32，不如当场拿走得 64。继续往前推，电脑第 4 步会拿走得 32，而不是继续后得 16；你第 3 步拿走得 16，而不是继续后得 8；电脑第 2 步拿走得 8，而不是继续后得 4；于是你第 1 步拿走得 4，而不是继续后得 2。</p><h3>为什么实际试玩可能走得更远</h3><p>这段逆向归纳假定双方都只在乎自己的分数，完全理解收益表，并确信对方也会在每个后续节点按这个逻辑行动。本局电脑故意采用“前两次继续，最后一次拿走”的固定策略，供你观察继续传递可能带来更大共同收益；它<strong>不是</strong>上述完全理性的对手。</p><h3>你应该学到什么</h3><p>顺序博弈不能只看当前“继续会让总分变大”，还要追问<strong>下一位玩家到了自己的回合会怎么选</strong>。如果现实中存在信任、利他或行为不确定性，预测会改变；但不能直接用一次继续传递否定逆向归纳的条件结论。</p><p class="lesson-takeaway">先想最后一轮，再倒推到现在；同时分清“理论对手”与游戏里预设的对手。</p>`);
    const steps = `<div class="step-track">${Array.from({ length: 6 }, (_, i) => `<span class="${i < x.node ? 'done' : ''}">第 ${i + 1} 步</span>`).join('')}</div>`;
    return shell('蜈蚣博弈', '游戏 05 / 顺序决策', '每继续一次，之后可分配的总分就变大；但下一次可能由对手决定。', x.ended ? `<h2>参考策略</h2><p class="result-lead">如果双方在所有节点都严格按自己的分数最大化并完全预见后续行为，逆向归纳会在第 1 步拿走。</p>${log}${history}${knowledge}<div class="actions"><button class="btn" data-action="centipede-restart">重新开始游戏</button></div>` : `${steps}<h2>${x.payoff ? '本局结算' : `第 ${x.node + 1} 步，轮到你`}</h2><p class="subtle">${x.payoff ? '你可以再玩一局，比较何时拿走。' : `现在拿走：你得 ${centipedeTake(x.node)[0]}，对手得 ${centipedeTake(x.node)[1]}。继续：下一步的选择权交给对手。`}</p>${x.payoff ? `<button class="btn" data-action="centipede-retry">再玩一局</button>` : `<div class="choice-row"><button class="btn" data-action="centipede-take">现在拿走</button><button class="btn secondary" data-action="centipede-pass">继续传递</button></div>`}${log}${history}${canFinish('centipede') ? controls('centipede') : ''}`,
      '选择何时拿走分数，观察让对手决定下一步会带来什么后果。可以多次尝试不同的停止时间。',
      '<p>你先行动，双方轮流选择“拿走”或“继续”；拿走立即结束。下表中的分数依次为你 / 电脑，后续收益在做决定前就公开。</p><table><thead><tr><th>拿走的步数</th><th>双方得分</th></tr></thead><tbody><tr><td>第 1 / 2 步</td><td>4 / 1；2 / 8</td></tr><tr><td>第 3 / 4 步</td><td>16 / 4；8 / 32</td></tr><tr><td>第 5 / 6 步</td><td>64 / 16；32 / 128</td></tr><tr><td>第 6 步仍继续</td><td>128 / 64</td></tr></tbody></table><p>本局电脑的回应策略在结束游戏后解释；每次拿走立即显示双方得分。</p>');
  }

  function beautyView() {
    const x = s.beauty, r = x.result;
    const outcome = r ? `<div class="result" aria-live="polite"><h2>本次结算</h2><p class="result-lead">五人平均数 ${r.mean.toFixed(1)}；目标数 = 平均数 × 2/3 = <strong>${r.target.toFixed(2)}</strong>。${r.winner === 0 ? '你最接近目标数。' : `${r.winner} 号模拟玩家最接近目标数。`}</p><ul class="bid-list">${r.guesses.map((n, i) => `<li><span>${i === 0 ? '你' : `${i} 号模拟玩家`}${i === r.winner ? ' · 获胜' : ''}</span><strong>${n}（差 ${r.distance[i].toFixed(2)}）</strong></li>`).join('')}</ul><p class="subtle">距离相同时，你优先；其余模拟玩家按编号优先。</p></div>` : '';
    const history = records(x.attempts, (a, i) => `<li><span>第 ${i + 1} 次 · 你猜 ${a.guesses[0]}，目标 ${a.target.toFixed(2)}</span><strong>${a.winner === 0 ? '命中最近' : '未获胜'}</strong></li>`);
    const knowledge = lesson('为什么理性推导趋向 0？', `<h3>先算一次目标数</h3><p>把你与四位对手的数字相加除以 5，再乘 2/3。你自己的数字也进入平均数，因此改变自己的数字会改变目标数。本局会显示每个人离目标差多少；最接近者获胜。</p><h3>再猜别人怎样猜</h3><p>所有人最多报 100，目标数必不超过约 66.67，因此高于这个范围通常没有竞争力；若人人据此往下报，下一轮对目标的预估还会下降。设所有人都完全理性、知道别人也理性，并且能一直重复这种推理，最终会收敛到大家都报 0 的均衡。</p><h3>为什么实战不一定要报 0</h3><p>你眼前四名模拟玩家的报价是<strong>预先固定</strong>的，不会跟着你一起做无限层推理。你想赢一局，应该猜他们这次报多少，再把自己对平均数的影响也算进去。报 0 的均衡推导说的是另一个情境：全部玩家都相互推断。一次失败不能说明你不理性，也可能是对别人会怎么想的预期不同。</p><p class="lesson-takeaway">策略取决于对别人的预期；“给定这群对手该报什么”与“所有人都理性时最后会怎样”是两个问题。</p><p class="subtle">不同数字范围、取整规则、是否计入自己的报价、平局规则都会影响精确计算。</p>`);
    return shell('猜平均数 2/3', '游戏 06 / 预期推理', '与你同场的还有四位模拟玩家，谁更接近目标数？', x.ended ? `<h2>参考思路</h2><p class="result-lead">面对固定的模拟报价，应估计目标数并计入自己的影响；全员互相推理的理论均衡则是都猜 0。</p>${outcome}${history}${knowledge}<div class="actions"><button class="btn" data-action="beauty-restart">重新开始游戏</button></div>` : `<h2>你猜几？</h2><p class="subtle">输入 0–100 的整数。其他四人的数字在提交后公开；同一组可以反复挑战。</p><div class="bid-area"><label for="guess">你的数字<input id="guess" class="bid-input" type="number" min="0" max="100" step="1" value="${r?.guesses[0] ?? 20}"></label><button class="btn" data-action="beauty-submit">提交并计算目标数</button></div><div class="error" id="beauty-error" role="alert"></div>${outcome}${r ? `<div class="actions"><button class="btn secondary" data-action="beauty-retry">挑战同一组</button><button class="btn" data-action="beauty-next">换一组模拟玩家</button></div>` : ''}${history}${canFinish('beauty') ? controls('beauty') : ''}`,
      '猜一个数字，尽量接近五人所猜数字平均数的 2/3，并试着预判其他人的猜法。',
      '<p>五人各报 0–100 的整数；你的数字也计入平均数。离平均数的 2/3 最近者获胜。</p><p>对手是四名预设报价的模拟玩家，不代表真人实验结果；完全相同距离时你优先。</p>');
  }

  function nimView() {
    const x = s.nim;
    const log = x.log.length ? `<div class="result" aria-live="polite"><h2>本轮记录</h2><ul class="round-list">${x.log.map(t => `<li><span>${t}</span></li>`).join('')}</ul>${x.winner ? `<p class="result-lead">本局结算：${x.winner === 'player' ? '你取走了最后一颗，获胜！' : '电脑取走了最后一颗，获胜。'}</p>` : ''}</div>` : '';
    const history = records(x.attempts, (a, i) => `<li><span>第 ${i + 1} 局 · 初始 ${a.board.join(' / ')}</span><strong>${a.winner === 'player' ? '你赢了' : '电脑赢了'}</strong></li>`);
    const knowledge = lesson('三堆石子怎样找必胜走法？', `<h3>先从小局面观察</h3><p>轮到你走时，石子总数为 0 意味着上一个玩家已经取走最后一颗，你输了。只剩一堆时直接取光即可获胜；多堆时，单看总数却不够。</p><h3>用异或给局面分类</h3><p>将三堆数量写成二进制，按位计算异或 XOR：同位相同得 0，不同得 1。例如 3、4、5 分别是 011、100、101，异或结果 010，即 2。若异或不为 0，存在一步只改动一堆，使异或变成 0：这一步就把对手送入不利局面。若异或为 0，只取一堆的任何合法走法都会变成非零，对手就有机会再归零。</p><h3>这局体现什么知识</h3><p>这是<strong>完全信息、轮流行动、没有运气因素</strong>的游戏。“必胜”指双方后续都正确应对时可以保证赢，并非电脑每一步都能保证赢：如果你先把局面变成异或 0，电脑就只能等待你犯错。</p><p class="lesson-takeaway">分析策略游戏时，寻找一种能随每一步更新、又能区分有利与不利局面的量。</p><p class="subtle">本局规定每次只从一堆取至少一颗，取走最后一颗者获胜。若改成最后一颗者输，结论须调整。</p>`);
    const piles = `<div class="piles">${x.heaps.map((n, i) => `<div class="pile"><strong>第 ${i + 1} 堆 · ${n} 颗</strong><div class="stone-row" aria-label="${n} 颗石子">${'●'.repeat(n)}</div><div class="actions">${[1, 2, 3, n].filter((count, pos, arr) => count <= n && arr.indexOf(count) === pos).map(count => `<button class="btn secondary" data-nim="${i}:${count}">取 ${count} 颗</button>`).join('')}</div></div>`).join('')}</div>`;
    return shell('Nim 取石子', '游戏 07 / 必胜策略', '你先走，从三堆石子里取；电脑会在你每一步后回应。', x.ended ? `<h2>参考策略</h2><p class="result-lead">每次尽量把三堆的异或值变成 0。若一开始异或不为 0，先手存在必胜走法。</p>${log}${history}${knowledge}<div class="actions"><button class="btn" data-action="nim-restart">重新开始游戏</button></div>` : `<h2>${x.winner ? '本局结算' : '轮到你取石子'}</h2><p class="subtle">每次只能从同一堆取走至少 1 颗；取走最后一颗获胜。</p>${piles}${x.winner ? `<div class="actions"><button class="btn" data-action="nim-retry">重玩这一局</button><button class="btn secondary" data-action="nim-next">换一组石堆</button></div>` : ''}${log}${history}${canFinish('nim') ? controls('nim') : ''}`,
      '从三堆中选一堆取石子，在电脑也按策略取石子的情况下，争取拿走最后一颗。',
      '<p>你先走，双方轮流从一堆中取走任意正整数颗。每步结算并展示电脑的回应，最后取石子的人获胜。</p><p>当前棋盘可以重玩；不同棋盘可轮换挑战。</p>');
  }

  function dollarView() {
    const x = s.dollar;
    const log = x.log.length ? `<div class="result" aria-live="polite"><h2>${x.payoff ? '本局结算' : '本轮报价结算'}</h2><p class="result-lead">当前最高报价：${Math.max(x.player, x.rival)} 元；你报 ${x.player} 元，电脑报 ${x.rival} 元。</p><p>如果现在结束，${x.player > x.rival ? '你赢得 100 元，但支付自己的报价' : '你是第二名，仍需支付自己的报价'}。${x.payoff ? `最终：你收益 ${x.payoff.playerPayoff} 元，电脑收益 ${x.payoff.rivalPayoff} 元。` : `你此刻退出的收益为 −${x.player} 元。`}</p><ul class="round-list">${x.log.map(t => `<li><span>${t}</span></li>`).join('')}</ul></div>` : '';
    const history = records(x.attempts, (a, i) => `<li><span>第 ${i + 1} 局</span><strong>你 ${a.playerPayoff} / 电脑 ${a.rivalPayoff}</strong></li>`);
    const knowledge = lesson('为什么越怕亏，反而越可能加价？', `<h3>先算赢和输各付多少</h3><p>普通第二价格拍卖只有赢家付款；这里完全不同：第一名获得 100 元，却支付<strong>自己的报价</strong>，第二名也支付自己的报价，却得不到标的。例如你报 105，电脑报 110，若你退出就亏 105；再报 115 而电脑退出，你拿到 100 仍亏 15。−15 比 −105 好，但继续叫价也可能引起下一轮反击。</p><h3>从眼前决策到损失升级</h3><p>过去报出的价会让第二名不甘心直接认亏；为了避免马上损失，双方可能轮流加价，最终报价超过物品的 100 元价值。这叫<strong>升级承诺</strong>。已经承诺或付出的损失也提醒我们辨认<strong>沉没成本</strong>：未来决策应比较从现在起每个可行选择的后果，而不只是想“前面已经投入多少”。但本局规则让第二名的既有报价在退出时仍须支付，所以它同时构成真实的退出损失，不能简单说成完全无关。</p><h3>这局体现什么机制设计知识</h3><p>把第二名也设为付款者，便改变了退出的代价和继续竞价的激励。没有一个适用于所有人、所有对手策略的固定“最优加价次数”：应考虑预算、退出损失、对方是否会跟价与最终净收益。本局电脑在一定报价内跟价，是为了展示升级过程，不能代表真人行为。</p><p class="lesson-takeaway">比较下一步时，请写下“我现在停”和“我再走一步而对手继续”的两种净收益，而不只是盯着能否获胜。</p>`);
    return shell('百元拍卖', '游戏 08 / 规则与激励', '竞拍一张价值 100 元的奖券：第一名和第二名最终都要付款。', x.ended ? `<h2>参考策略</h2><p class="result-lead">不要把“赢得奖券”当成获利；比较继续、退出及对手跟价后的净收益。这里不存在不看对手策略的固定最优叫价次数。</p>${log}${history}${knowledge}<div class="actions"><button class="btn" data-action="dollar-restart">重新开始游戏</button></div>` : `<h2>${x.payoff ? '本局已结束' : '你要加价吗？'}</h2><p class="subtle">电脑先报 5 元。每次加价到超过对手 5 元；电脑可能跟价。最终第一和第二名均需支付自己的报价。</p><div class="stats"><div class="stat"><strong>${x.player}</strong><span>你当前的报价</span></div><div class="stat"><strong>${x.rival}</strong><span>电脑当前的报价</span></div></div>${x.payoff ? `<button class="btn" data-action="dollar-retry">再玩一局</button>` : `<div class="choice-row"><button class="btn" data-action="dollar-raise">加价到 ${x.rival + 5} 元</button><button class="btn secondary" data-action="dollar-quit">退出并结算</button></div>`}${log}${history}${canFinish('dollar') ? controls('dollar') : ''}`,
      '在竞价中尝试提高自己的最终净收益：观察领先、退出与对手继续加价分别意味着多少损失。',
      '<p>奖券价值 100 元；电脑先报 5 元。你每次比电脑高报 5 元，电脑可能再加 5 元。</p><p>退出或电脑停止跟价即结算：第一名获 100 元、付自己的报价；第二名也付自己的报价且没有奖券。</p>');
  }

  const views = { traveler: travelerView, centipede: centipedeView, beauty: beautyView, nim: nimView, dollar: dollarView };
  const complete = (id, payoff) => { s[id].payoff = payoff; s[id].attempts.push(id === 'nim' ? { board: [...boards[s.nim.board]], winner: s.nim.winner } : payoff); };
  function nimTurn(move) {
    const x = s.nim;
    if (x.ended || x.winner) return;
    const [pile, count] = move.split(':').map(Number);
    try { x.heaps = nimMove(x.heaps, pile, count); } catch { return; }
    x.log.push(`你从第 ${pile + 1} 堆取 ${count} 颗，剩下 ${x.heaps.join(' / ')}。`);
    if (x.heaps.every(n => n === 0)) { x.winner = 'player'; complete('nim'); return; }
    const bot = nimBot(x.heaps);
    x.heaps = bot.heaps;
    x.log.push(`电脑从第 ${bot.index + 1} 堆取 ${bot.count} 颗，剩下 ${x.heaps.join(' / ')}。`);
    if (x.heaps.every(n => n === 0)) { x.winner = 'rival'; complete('nim'); }
  }
  function action(a, app) {
    const id = ids.find(n => a.startsWith(`${n}-`));
    if (!id || !s[id]) return false;
    if (a === `${id}-restart`) { reset(id); return true; }
    if (s[id].ended) return false;
    const x = s[id];
    if (id === 'traveler') {
      if (a === 'traveler-submit') { try { const raw = app.querySelector('#claim')?.value; x.result = traveler(raw?.trim() ? Number(raw) : NaN, opponents[x.scenario]); x.attempts.push(x.result); } catch (e) { const err = app.querySelector('#traveler-error'); if (err) err.textContent = e.message; return false; } }
      else if (a === 'traveler-retry') x.result = null;
      else if (a === 'traveler-next') { x.scenario = (x.scenario + 1) % opponents.length; x.result = null; }
      else return false;
    } else if (id === 'beauty') {
      if (a === 'beauty-submit') { try { const raw = app.querySelector('#guess')?.value; x.result = beauty(raw?.trim() ? Number(raw) : NaN, groups[x.scenario]); x.attempts.push(x.result); } catch (e) { const err = app.querySelector('#beauty-error'); if (err) err.textContent = e.message; return false; } }
      else if (a === 'beauty-retry') x.result = null;
      else if (a === 'beauty-next') { x.scenario = (x.scenario + 1) % groups.length; x.result = null; }
      else return false;
    } else if (id === 'centipede') {
      if (a === 'centipede-retry') { x.node = 0; x.log = []; x.payoff = null; }
      else if (!x.payoff && a === 'centipede-take') { x.payoff = centipedeTake(x.node); x.log.push(`第 ${x.node + 1} 步，你选择拿走。`); complete('centipede', x.payoff); }
      else if (!x.payoff && a === 'centipede-pass') { x.log.push(`第 ${x.node + 1} 步，你选择继续。`); x.node++; if (x.node === 5) { x.log.push('第 6 步，电脑选择了拿走。'); complete('centipede', centipedeTake(5)); } else { x.log.push(`第 ${x.node + 1} 步，电脑选择了继续。`); x.node++; } }
      else return false;
    } else if (id === 'nim') {
      if (a === 'nim-retry' || a === 'nim-next') { if (a === 'nim-next') x.board = (x.board + 1) % boards.length; x.heaps = [...boards[x.board]]; x.log = []; x.winner = null; }
      else return false;
    } else if (id === 'dollar') {
      if (a === 'dollar-retry') { x.player = 0; x.rival = 5; x.log = []; x.payoff = null; }
      else if (!x.payoff && a === 'dollar-raise') { x.player = x.rival + 5; x.log.push(`你报 ${x.player} 元。`); if (x.player <= 110) { x.rival = x.player + 5; x.log.push(`电脑跟价到 ${x.rival} 元。`); } else { x.log.push('电脑停止跟价。'); complete('dollar', dollarAuction(x.player, x.rival)); } }
      else if (!x.payoff && a === 'dollar-quit') { x.log.push('你退出，双方结算。'); complete('dollar', dollarAuction(x.player, x.rival)); }
      else return false;
    }
    return true;
  }
  return { has, select: reset, view: id => views[id](), action, nimTurn, canFinish, finish };
}
