import { useMemo } from 'react';
import { RED_COUNT, BLUE_COUNT, RED_PICK, BLUE_PICK, pad } from '../utils/lottery';
import './BallSelector.css';

export default function BallSelector({
  selectedRed, selectedBlue, currentMode, isDrawing,
  onToggleRed, onToggleBlue, onRandomRed, onRandomBlue, onClear, onSetMode,
}) {
  const redBalls = useMemo(() => Array.from({ length: RED_COUNT }, (_, i) => i + 1), []);
  const blueBalls = useMemo(() => Array.from({ length: BLUE_COUNT }, (_, i) => i + 1), []);

  const sortedRed = useMemo(() => [...selectedRed].sort((a, b) => a - b), [selectedRed]);
  const sortedBlue = useMemo(() => [...selectedBlue].sort((a, b) => a - b), [selectedBlue]);

  const isComplete = selectedRed.size === RED_PICK && selectedBlue.size === BLUE_PICK;

  return (
    <div className="ball-selector">
      <div className="mode-tabs">
        <button
          className={`mode-tab${currentMode === 'manual' ? ' active' : ''}`}
          onClick={() => onSetMode('manual')}
          disabled={isDrawing}
        >
          手动选号
        </button>
        <button
          className={`mode-tab${currentMode === 'random' ? ' active' : ''}`}
          onClick={() => onSetMode('random')}
          disabled={isDrawing}
        >
          机选号码
        </button>
      </div>

      <div className="section-header">
        <span className="section-label red">红球</span>
        <span className="section-hint">选6个 · 范围 01-33</span>
        <span className="count-badge"><span>{selectedRed.size}</span>/6</span>
      </div>

      <div className="ball-grid">
        {redBalls.map((n) => (
          <button
            key={`r${n}`}
            className={`ball red${selectedRed.has(n) ? ' selected' : ''}${currentMode === 'random' ? ' disabled' : ''}`}
            onClick={() => onToggleRed(n)}
            disabled={isDrawing || currentMode === 'random'}
          >
            {pad(n)}
          </button>
        ))}
      </div>

      <div className="divider-label">蓝 球 区</div>

      <div className="section-header">
        <span className="section-label blue">蓝球</span>
        <span className="section-hint">选1个 · 范围 01-16</span>
        <span className="count-badge"><span>{selectedBlue.size}</span>/1</span>
      </div>

      <div className="ball-grid">
        {blueBalls.map((n) => (
          <button
            key={`b${n}`}
            className={`ball blue${selectedBlue.has(n) ? ' selected' : ''}${currentMode === 'random' ? ' disabled' : ''}`}
            onClick={() => onToggleBlue(n)}
            disabled={isDrawing || currentMode === 'random'}
          >
            {pad(n)}
          </button>
        ))}
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={onRandomRed} disabled={isDrawing}>
          随机红球
        </button>
        <button className="btn btn-secondary" onClick={onRandomBlue} disabled={isDrawing}>
          随机蓝球
        </button>
        <button className="btn btn-danger" onClick={onClear} disabled={isDrawing}>
          清空选择
        </button>
      </div>

      {isComplete && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>
            我的投注
          </div>
          <div className="my-bets">
            {sortedRed.map((n) => (
              <div key={`br${n}`} className="my-bet-ball red">{pad(n)}</div>
            ))}
            {sortedBlue.map((n) => (
              <div key={`bb${n}`} className="my-bet-ball blue">{pad(n)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}