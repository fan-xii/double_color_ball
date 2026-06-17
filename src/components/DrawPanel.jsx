import { useState, useEffect, useRef, useCallback } from 'react';
import { RED_COUNT, BLUE_COUNT, RED_PICK, pad, checkPrize } from '../utils/lottery';
import './DrawPanel.css';

const CONFETTI_COLORS = ['#d4a853', '#f0d078', '#e63946', '#ff6b7a', '#1d4ed8', '#5b8def', '#22c55e', '#f97316'];

function spawnConfetti(container, count) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + '%';
    el.style.setProperty('--duration', (2 + Math.random() * 3) + 's');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    el.style.animationDelay = Math.random() * 0.8 + 's';
    el.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    frag.appendChild(el);
  }
  container.appendChild(frag);
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

export default function DrawPanel({
  periodNumber, isDrawing, drawResult, batchSize, drawProgress, stats,
  onDraw, onBatchSizeChange,
}) {
  const [rollingNums, setRollingNums] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lastRecord, setLastRecord] = useState(null);
  const [inputValue, setInputValue] = useState(String(batchSize));
  const rollRef = useRef(null);
  const sparkleRef = useRef(null);
  const confettiRef = useRef(null);
  const btnRef = useRef(null);

  const startRolling = useCallback(() => {
    setRevealed(false);
    setLastRecord(null);
    const initial = Array.from({ length: RED_PICK + 1 }, () => '??');
    setRollingNums(initial);

    rollRef.current = setInterval(() => {
      setRollingNums((prev) =>
        prev.map((_, i) => {
          const max = i < RED_PICK ? RED_COUNT : BLUE_COUNT;
          return pad(Math.floor(Math.random() * max) + 1);
        })
      );
    }, 80);

    if (btnRef.current) {
      sparkleRef.current = setInterval(() => {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.setProperty('--sx', (Math.random() * 60 - 30) + 'px');
        sparkle.style.setProperty('--sy', (Math.random() * -60 - 20) + 'px');
        btnRef.current.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
      }, 200);
    }
  }, []);

  const stopRolling = useCallback(() => {
    if (rollRef.current) {
      clearInterval(rollRef.current);
      rollRef.current = null;
    }
    if (sparkleRef.current) {
      clearInterval(sparkleRef.current);
      sparkleRef.current = null;
    }
  }, []);

  const handleDraw = useCallback(() => {
    if (isDrawing) return;
    startRolling();
    onDraw((record) => {
      stopRolling();
      setLastRecord(record);
      setRevealed(true);

      if (record.prize.matched) {
        const count = record.prize.level <= 3 ? 80 : 25;
        if (confettiRef.current) {
          spawnConfetti(confettiRef.current, count);
        }
      }
    });
  }, [isDrawing, onDraw, startRolling, stopRolling]);

  useEffect(() => {
    setInputValue(String(batchSize));
  }, [batchSize]);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value.replace(/,/g, '');
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1 && num <= 100000000) {
      onBatchSizeChange(num);
    }
  }, [onBatchSizeChange]);

  const handleInputBlur = useCallback(() => {
    const num = parseInt(inputValue.replace(/,/g, ''), 10);
    if (isNaN(num) || num < 1) {
      setInputValue('1');
      onBatchSizeChange(1);
    } else if (num > 100000000) {
      setInputValue('100000000');
      onBatchSizeChange(100000000);
    } else {
      setInputValue(String(num));
      onBatchSizeChange(num);
    }
  }, [inputValue, onBatchSizeChange]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRolling();
    };
  }, [stopRolling]);

  const renderBalls = () => {
    if (!isDrawing && !revealed) {
      return Array.from({ length: RED_PICK + 1 }, (_, i) => (
        <div key={i} className={`result-ball ${i < RED_PICK ? 'red' : 'blue'} placeholder`}>?</div>
      ));
    }

    if (isDrawing && rollingNums) {
      return rollingNums.map((num, i) => (
        <div key={i} className={`result-ball ${i < RED_PICK ? 'red' : 'blue'} rolling`}>
          {num}
        </div>
      ));
    }

    if (revealed && drawResult) {
      const balls = [];
      drawResult.reds.forEach((n, i) => {
        balls.push(
          <div key={`r${i}`} className="result-ball red" style={{ animationDelay: `${i * 0.1}s` }}>
            {pad(n)}
          </div>
        );
      });
      balls.push(
        <div key="blue" className="result-ball blue" style={{ animationDelay: `${RED_PICK * 0.1}s` }}>
          {pad(drawResult.blue)}
        </div>
      );
      return balls;
    }

    return null;
  };

  const renderPrize = () => {
    if (!revealed || !lastRecord) {
      return (
        <div className="prize-card">
          <div className="prize-level lose">等待开奖</div>
          <div className="prize-detail">请先选择号码，然后点击开奖</div>
        </div>
      );
    }

    const { prize, batchSize: bs, winCount, prizeCounts, userReds, userBlue } = lastRecord;
    const userDraw = checkPrize(userReds, userBlue, drawResult.reds, drawResult.blue);

    if (bs === 1) {
      if (prize.matched) {
        return (
          <div className="prize-card">
            <div className="prize-level win">🎉 {prize.name}</div>
            <div className="prize-detail">
              红球中 {userDraw.redMatch} 个 · 蓝球{userDraw.blueMatch ? '中' : '未中'}
            </div>
          </div>
        );
      }
      return (
        <div className="prize-card">
          <div className="prize-level lose">{prize.name}</div>
          <div className="prize-detail">
            红球中 {userDraw.redMatch} 个 · 蓝球未中
          </div>
        </div>
      );
    }

    const parts = [];
    for (let lv = 1; lv <= 6; lv++) {
      if (prizeCounts[lv] > 0) {
        const names = ['', '一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖'];
        parts.push(`${names[lv]} ×${prizeCounts[lv]}`);
      }
    }

    return (
      <div className="prize-card">
        <div className={`prize-level ${prize.matched ? 'win' : 'lose'}`}>
          {prize.matched ? `🎉 最佳: ${prize.name}` : prize.name}
        </div>
        <div className="prize-detail">
          {bs}注中 {winCount}注中奖
          {parts.length > 0 && `（${parts.join(' · ')}）`}
        </div>
      </div>
    );
  };

  return (
    <div className="draw-panel">
      <div className="panel-title">开奖结果</div>
      <div className="period-display">第 {periodNumber} 期</div>

      <div className="result-balls">
        {renderBalls()}
      </div>

      {renderPrize()}

      {isDrawing && batchSize > 100 && (
        <div className="progress-section">
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${drawProgress}%` }} />
          </div>
          <div className="progress-text">{drawProgress}%</div>
        </div>
      )}

      {isDrawing && batchSize > 100 && (
        <div className="worker-info">
          并行计算中 · {Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 16))} 个线程并行
        </div>
      )}

      <div className="batch-section">
        <div className="batch-label">批量模拟</div>
        <div className="batch-controls">
          <input
            type="range"
            className="batch-slider"
            min="1"
            max="100000000"
            value={batchSize}
            onChange={(e) => onBatchSizeChange(Number(e.target.value))}
            disabled={isDrawing}
          />
          <input
            type="text"
            className="batch-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={isDrawing}
          />
          <span className="batch-unit">注</span>
        </div>
      </div>

      <div className="lottery-btn-wrap">
        <button
          ref={btnRef}
          className={`lottery-btn${isDrawing ? ' running' : ''}`}
          onClick={handleDraw}
          disabled={isDrawing}
        >
          {isDrawing ? '摇 奖 中...' : '开 始 摇 奖'}
        </button>
      </div>

      <div className="confetti-container" ref={confettiRef} />
    </div>
  );
}