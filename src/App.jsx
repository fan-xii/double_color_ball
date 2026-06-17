import { useState, useCallback, useRef } from 'react';
import { useLottery } from './hooks/useLottery';
import BallSelector from './components/BallSelector';
import DrawPanel from './components/DrawPanel';
import TrendChart from './components/TrendChart';
import HistoryList from './components/HistoryList';
import './App.css';

const TABS = [
  { key: 'draw', label: '选号 & 开奖' },
  { key: 'trend', label: '走势图' },
  { key: 'history', label: '历史记录' },
];

export default function App() {
  const lottery = useLottery();
  const [activeTab, setActiveTab] = useState('draw');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleDraw = useCallback((onComplete) => {
    const success = lottery.draw(onComplete);
    if (!success) {
      showToast('请先完成选号（红球6个 + 蓝球1个）');
    }
  }, [lottery, showToast]);

  return (
    <div className="app">
      <header className="header">
        <div className="logo-balls">
          <div className="logo-ball red" style={{ animationDelay: '0s' }} />
          <div className="logo-ball red" style={{ animationDelay: '0.15s' }} />
          <div className="logo-ball red" style={{ animationDelay: '0.3s' }} />
          <div className="logo-ball red" style={{ animationDelay: '0.45s' }} />
          <div className="logo-ball red" style={{ animationDelay: '0.6s' }} />
          <div className="logo-ball blue" style={{ animationDelay: '0.75s' }} />
        </div>
        <h1>双 色 球</h1>
        <p className="subtitle">中国福利彩票 · 模拟摇奖器</p>
      </header>

      <nav className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'draw' && (
        <div className="main-grid">
          <BallSelector
            selectedRed={lottery.selectedRed}
            selectedBlue={lottery.selectedBlue}
            currentMode={lottery.currentMode}
            isDrawing={lottery.isDrawing}
            onToggleRed={lottery.toggleRed}
            onToggleBlue={lottery.toggleBlue}
            onRandomRed={lottery.randomRed}
            onRandomBlue={lottery.randomBlue}
            onClear={lottery.clearSelection}
            onSetMode={lottery.setMode}
          />
          <DrawPanel
            periodNumber={lottery.periodNumber}
            isDrawing={lottery.isDrawing}
            drawResult={lottery.drawResult}
            batchSize={lottery.batchSize}
            drawProgress={lottery.drawProgress}
            stats={lottery.stats}
            onDraw={handleDraw}
            onBatchSizeChange={lottery.setBatchSize}
          />
        </div>
      )}

      {activeTab === 'trend' && (
        <TrendChart history={lottery.history} />
      )}

      {activeTab === 'history' && (
        <HistoryList history={lottery.history} stats={lottery.stats} onClear={lottery.clearHistory} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}