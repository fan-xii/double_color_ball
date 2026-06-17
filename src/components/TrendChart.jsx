import { useState, useMemo } from 'react';
import { RED_COUNT, BLUE_COUNT, pad } from '../utils/lottery';
import './TrendChart.css';

const DISPLAY_OPTIONS = [
  { label: '最近 10 期', value: 10 },
  { label: '最近 20 期', value: 20 },
  { label: '最近 50 期', value: 50 },
  { label: '全部', value: 0 },
];

export default function TrendChart({ history }) {
  const [displayCount, setDisplayCount] = useState(20);

  const visibleHistory = useMemo(() => {
    if (displayCount === 0) return history;
    return history.slice(0, displayCount);
  }, [history, displayCount]);

  const freqData = useMemo(() => {
    const redFreq = new Array(RED_COUNT).fill(0);
    const blueFreq = new Array(BLUE_COUNT).fill(0);

    visibleHistory.forEach((h) => {
      h.drawReds.forEach((n) => redFreq[n - 1]++);
      blueFreq[h.drawBlue - 1]++;
    });

    const redMax = Math.max(...redFreq, 1);
    const blueMax = Math.max(...blueFreq, 1);

    return { redFreq, blueFreq, redMax, blueMax };
  }, [visibleHistory]);

  const missingData = useMemo(() => {
    const redMissing = new Array(RED_COUNT).fill(0);
    const blueMissing = new Array(BLUE_COUNT).fill(0);

    for (let i = 0; i < RED_COUNT; i++) {
      let miss = 0;
      for (let j = 0; j < visibleHistory.length; j++) {
        if (visibleHistory[j].drawReds.includes(i + 1)) break;
        miss++;
      }
      redMissing[i] = miss;
    }

    for (let i = 0; i < BLUE_COUNT; i++) {
      let miss = 0;
      for (let j = 0; j < visibleHistory.length; j++) {
        if (visibleHistory[j].drawBlue === i + 1) break;
        miss++;
      }
      blueMissing[i] = miss;
    }

    return { redMissing, blueMissing };
  }, [visibleHistory]);

  if (history.length === 0) {
    return (
      <div className="trend-chart">
        <div className="trend-header">
          <span className="trend-title">号码走势图</span>
        </div>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          暂无开奖数据，请先摇奖
        </div>
      </div>
    );
  }

  const { redFreq, blueFreq, redMax, blueMax } = freqData;
  const { redMissing, blueMissing } = missingData;

  return (
    <div className="trend-chart">
      <div className="trend-header">
        <span className="trend-title">号码走势图</span>
        <div className="trend-legend">
          <span><span className="legend-dot hit" /> 出现</span>
          <span><span className="legend-dot freq" /> 高频</span>
        </div>
      </div>

      <div className="trend-toolbar">
        {DISPLAY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`btn-sm${displayCount === opt.value ? ' active' : ''}`}
            onClick={() => setDisplayCount(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        <span className="display-count">
          共 {visibleHistory.length} 期
        </span>
      </div>

      <div className="trend-scroll">
        <table className="trend-table">
          <thead>
            <tr>
              <th className="period-col">期号</th>
              {Array.from({ length: RED_COUNT }, (_, i) => (
                <th key={`rh${i}`} className="col-red col-num">{pad(i + 1)}</th>
              ))}
              <th className="col-sep" />
              {Array.from({ length: BLUE_COUNT }, (_, i) => (
                <th key={`bh${i}`} className="col-blue col-num">{pad(i + 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleHistory.map((h) => (
              <tr key={h.period}>
                <td className="period-col">
                  <span className="draw-period">第{h.period}期</span>
                </td>
                {Array.from({ length: RED_COUNT }, (_, i) => {
                  const hit = h.drawReds.includes(i + 1);
                  return (
                    <td key={`r${i}`} className={`cell${hit ? ' hit red-cell' : ' miss'}`}>
                      <div className="cell-inner">
                        {!hit && <span>·</span>}
                      </div>
                    </td>
                  );
                })}
                <td className="col-sep" style={{ background: 'var(--bg-deep)' }} />
                {Array.from({ length: BLUE_COUNT }, (_, i) => {
                  const hit = h.drawBlue === i + 1;
                  return (
                    <td key={`b${i}`} className={`cell${hit ? ' hit blue-cell' : ' miss'}`}>
                      <div className="cell-inner">
                        {!hit && <span>·</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="missing-row">
              <td className="period-col freq-row">遗漏</td>
              {redMissing.map((v, i) => {
                let cls = 'miss-low';
                if (v >= 8) cls = 'miss-high';
                else if (v >= 4) cls = 'miss-mid';
                return (
                  <td key={`mr${i}`} className={cls}>
                    {v || '-'}
                  </td>
                );
              })}
              <td style={{ background: 'var(--bg-deep)' }} />
              {blueMissing.map((v, i) => {
                let cls = 'miss-low';
                if (v >= 8) cls = 'miss-high';
                else if (v >= 4) cls = 'miss-mid';
                return (
                  <td key={`mb${i}`} className={cls}>
                    {v || '-'}
                  </td>
                );
              })}
            </tr>

            <tr className="freq-row">
              <td className="period-col freq-row">频次</td>
              {redFreq.map((v, i) => {
                let cls = 'freq-cold';
                if (v >= redMax * 0.7) cls = 'freq-hot';
                else if (v >= redMax * 0.4) cls = 'freq-red';
                return (
                  <td key={`fr${i}`} className={cls}>
                    {v}
                  </td>
                );
              })}
              <td style={{ background: 'var(--bg-deep)' }} />
              {blueFreq.map((v, i) => {
                let cls = 'freq-cold';
                if (v >= blueMax * 0.7) cls = 'freq-hot';
                else if (v >= blueMax * 0.4) cls = 'freq-blue';
                return (
                  <td key={`fb${i}`} className={cls}>
                    {v}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}