import { pad } from '../utils/lottery';
import './HistoryList.css';

function formatMoney(n) {
  if (n >= 10000) {
    return (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + '万';
  }
  return n.toLocaleString();
}

function StatsPanel({ stats }) {
  return (
    <div className="stats-row">
      <div className="stat-item">
        <div className="stat-value">{stats.totalDraws || 0}</div>
        <div className="stat-label">累计开奖</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.totalWins || 0}</div>
        <div className="stat-label">中奖注数</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.winRate || '0'}%</div>
        <div className="stat-label">中奖率</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{stats.bestPrize || '-'}</div>
        <div className="stat-label">最高奖项</div>
      </div>
    </div>
  );
}

function FinancePanel({ stats }) {
  const totalCost = stats.totalCost || 0;
  const totalPrizeMoney = stats.totalPrizeMoney || 0;
  const profit = totalPrizeMoney - totalCost;
  const roi = stats.overallROI || '0';

  return (
    <div className="stats-row finance-row">
      <div className="stat-item">
        <div className="stat-value">¥{formatMoney(totalCost)}</div>
        <div className="stat-label">累计投入</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: totalPrizeMoney > 0 ? 'var(--gold-light)' : 'var(--text-dim)' }}>
          ¥{formatMoney(totalPrizeMoney)}
        </div>
        <div className="stat-label">累计中奖</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: profit >= 0 ? '#22c55e' : 'var(--danger)' }}>
          {profit >= 0 ? '+' : ''}¥{formatMoney(Math.abs(profit))}
        </div>
        <div className="stat-label">{profit >= 0 ? '盈利' : '亏损'}</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: parseFloat(roi) >= 100 ? '#22c55e' : parseFloat(roi) > 0 ? 'var(--gold)' : 'var(--danger)' }}>
          {parseFloat(roi) >= 100 ? '+' : ''}{roi}%
        </div>
        <div className="stat-label">回本率</div>
      </div>
    </div>
  );
}

export default function HistoryList({ history, stats, onClear }) {
  if (history.length === 0) {
    return (
      <div className="history-panel">
        <div className="panel-title">开奖历史</div>
        <div className="history-empty">暂无开奖记录，请先摇奖</div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="panel-title">
        开奖历史
        {onClear && (
          <button
            className="btn-clear-history"
            onClick={onClear}
            title="清除所有历史记录"
          >
            清除
          </button>
        )}
      </div>

      <FinancePanel stats={stats} />

      <StatsPanel stats={stats} />

      <div className="history-list" style={{ marginTop: 16 }}>
        <div className="history-item history-header">
          <span className="history-period">期号</span>
          <span className="history-balls" style={{ justifyContent: 'center' }}>开奖号码</span>
          <span className="history-prize">中奖</span>
          <span className="history-roi">回本率</span>
        </div>
        {history.map((h) => {
          const prizeText = h.prize.name;
          const batchInfo = h.batchSize > 1 ? ` (${h.winCount}/${h.batchSize})` : '';
          const roiVal = h.roi != null ? h.roi : 0;
          const roiColor = roiVal >= 100 ? '#22c55e' : roiVal > 0 ? 'var(--gold)' : 'var(--text-dim)';
          return (
            <div key={h.period} className="history-item">
              <span className="history-period">第{h.period}期</span>
              <span className="history-balls">
                {h.drawReds.map((n, i) => (
                  <div key={`r${i}`} className="history-ball red">{pad(n)}</div>
                ))}
                <div className="history-ball blue">{pad(h.drawBlue)}</div>
              </span>
              <span className={`history-prize${h.prize.matched ? ' win' : ' lose'}`}>
                {prizeText}{batchInfo}
              </span>
              <span className="history-roi" style={{ color: roiColor }}>
                {roiVal > 0 ? '+' : ''}{roiVal}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}