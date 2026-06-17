import { useState, useCallback, useRef, useEffect } from 'react';
import {
  RED_COUNT, BLUE_COUNT, RED_PICK, BLUE_PICK,
  randomPick, TICKET_COST,
} from '../utils/lottery';

const STORAGE_KEY_HISTORY = 'dcb_history';
const STORAGE_KEY_PERIOD = 'dcb_period';

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return fallback;
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* ignore */ }
}

function getWorkerCount() {
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(2, Math.min(cores, 16));
}

export function useLottery() {
  const [selectedRed, setSelectedRed] = useState(new Set());
  const [selectedBlue, setSelectedBlue] = useState(new Set());
  const [history, setHistory] = useState(() => loadFromStorage(STORAGE_KEY_HISTORY, []));
  const [periodNumber, setPeriodNumber] = useState(() => loadFromStorage(STORAGE_KEY_PERIOD, 2024001));
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMode, setCurrentMode] = useState('manual');
  const [drawResult, setDrawResult] = useState(null);
  const [batchSize, setBatchSize] = useState(1);
  const [drawProgress, setDrawProgress] = useState(0);

  const workersRef = useRef([]);
  const onCompleteRef = useRef(null);
  const drawStartTimeRef = useRef(0);
  const userSelectionRef = useRef(null);
  const MIN_ANIMATION_MS = 2000;

  useEffect(() => { saveToStorage(STORAGE_KEY_HISTORY, history); }, [history]);
  useEffect(() => { saveToStorage(STORAGE_KEY_PERIOD, periodNumber); }, [periodNumber]);

  const terminateAllWorkers = useCallback(() => {
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
  }, []);

  useEffect(() => {
    return () => terminateAllWorkers();
  }, [terminateAllWorkers]);

  const getUserSelection = useCallback(() => {
    if (currentMode === 'random') {
      const reds = randomPick(RED_COUNT, RED_PICK);
      const blues = randomPick(BLUE_COUNT, BLUE_PICK);
      setSelectedRed(new Set(reds));
      setSelectedBlue(new Set(blues));
      return { reds, blue: blues[0] };
    }
    return {
      reds: [...selectedRed].sort((a, b) => a - b),
      blue: [...selectedBlue][0],
    };
  }, [currentMode, selectedRed, selectedBlue]);

  const draw = useCallback((onComplete) => {
    const user = getUserSelection();
    if (!user.reds || user.reds.length !== RED_PICK || !user.blue) return false;

    setIsDrawing(true);
    setDrawResult(null);
    setDrawProgress(0);
    drawStartTimeRef.current = Date.now();
    onCompleteRef.current = onComplete;

    terminateAllWorkers();

    const userRedsSorted = [...user.reds].sort((a, b) => a - b);
    const userBlueVal = user.blue;
    userSelectionRef.current = { reds: userRedsSorted, blue: userBlueVal };

    const workerCount = getWorkerCount();
    const baseChunk = Math.floor(batchSize / workerCount);
    const remainder = batchSize % workerCount;

    const workers = [];
    const results = new Array(workerCount).fill(null);
    const progresses = new Array(workerCount).fill(0);

    const checkAllDone = () => {
      if (results.every((r) => r !== null)) {
        terminateAllWorkers();
        mergeResults(results);
      }
    };

    const mergeResults = (allResults) => {
      const elapsed = Date.now() - drawStartTimeRef.current;
      const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed);

      const finalize = () => {
        const merged = {
          prizeCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
          winCount: 0,
          totalPrizeMoney: 0,
          bestLevel: 7,
          bestPrizeName: '未中奖',
          lastDrawRed: null,
          lastDrawBlue: 0,
        };

        allResults.forEach((r) => {
          for (let lv = 1; lv <= 6; lv++) {
            merged.prizeCounts[lv] += r.prizeCounts[lv];
          }
          merged.winCount += r.winCount;
          merged.totalPrizeMoney += r.totalPrizeMoney;
          if (r.bestPrize.level < merged.bestLevel) {
            merged.bestLevel = r.bestPrize.level;
            merged.bestPrizeName = r.bestPrize.name;
          }
          if (r.lastDrawRed && r.lastDrawRed.length > 0) {
            merged.lastDrawRed = r.lastDrawRed;
            merged.lastDrawBlue = r.lastDrawBlue;
          }
        });

        const levelNames = ['', '一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖'];
        const bestPrize = merged.bestLevel <= 6
          ? { level: merged.bestLevel, name: levelNames[merged.bestLevel], matched: true }
          : { level: 0, name: '未中奖', matched: false };

        setDrawResult({ reds: merged.lastDrawRed, blue: merged.lastDrawBlue });

        const totalCost = batchSize * TICKET_COST;
        const roi = totalCost > 0 ? (merged.totalPrizeMoney / totalCost) * 100 : 0;

        const record = {
          period: periodNumber,
          userReds: userSelectionRef.current ? userSelectionRef.current.reds : [],
          userBlue: userSelectionRef.current ? userSelectionRef.current.blue : 0,
          drawReds: merged.lastDrawRed,
          drawBlue: merged.lastDrawBlue,
          prize: bestPrize,
          batchSize,
          winCount: merged.winCount,
          prizeCounts: merged.prizeCounts,
          totalCost,
          totalPrizeMoney: merged.totalPrizeMoney,
          roi: Math.round(roi * 100) / 100,
        };

        setHistory((prev) => [record, ...prev]);
        setPeriodNumber((p) => p + 1);
        setIsDrawing(false);
        setDrawProgress(0);

        if (onCompleteRef.current) {
          onCompleteRef.current(record);
          onCompleteRef.current = null;
        }
      };

      if (remaining > 0) {
        setTimeout(finalize, remaining);
      } else {
        finalize();
      }
    };

    const zeroResult = () => ({
      prizeCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      winCount: 0, totalPrizeMoney: 0,
      bestPrize: { level: 7, name: '未中奖', matched: false },
      lastDrawRed: [], lastDrawBlue: 0,
    });

    for (let w = 0; w < workerCount; w++) {
      const chunkSize = baseChunk + (w < remainder ? 1 : 0);
      if (chunkSize === 0) {
        results[w] = zeroResult();
        continue;
      }

      const worker = new Worker(
        new URL('../workers/drawWorker.js', import.meta.url),
        { type: 'module' }
      );

      const workerIndex = w;

      worker.onmessage = (e) => {
        const { type, processed, batchSize: total, result } = e.data;

        if (type === 'progress') {
          progresses[workerIndex] = processed / total;
          const avg = progresses.reduce((a, b) => a + b, 0) / workerCount;
          setDrawProgress(Math.round(avg * 100));
          return;
        }

        if (type === 'result') {
          results[workerIndex] = result;
          checkAllDone();
        }
      };

      worker.onerror = (err) => {
        console.error(`Worker ${w} error:`, err);
        results[workerIndex] = {
          prizeCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
          winCount: 0, totalPrizeMoney: 0,
          bestPrize: { level: 7, name: '未中奖', matched: false },
          lastDrawRed: [], lastDrawBlue: 0,
        };
        checkAllDone();
      };

      workers.push(worker);

      worker.postMessage({
        userReds: user.reds,
        userBlue: user.blue,
        batchSize: chunkSize,
      });
    }

    workersRef.current = workers;
    checkAllDone();
    return true;
  }, [getUserSelection, batchSize, periodNumber, terminateAllWorkers]);

  const toggleRed = useCallback((num) => {
    if (currentMode === 'random') return;
    setSelectedRed((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else if (next.size < RED_PICK) {
        next.add(num);
      }
      return next;
    });
  }, [currentMode]);

  const toggleBlue = useCallback((num) => {
    if (currentMode === 'random') return;
    setSelectedBlue((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.clear();
        next.add(num);
      }
      return next;
    });
  }, [currentMode]);

  const randomRed = useCallback(() => {
    const reds = randomPick(RED_COUNT, RED_PICK);
    setSelectedRed(new Set(reds));
  }, []);

  const randomBlue = useCallback(() => {
    const blues = randomPick(BLUE_COUNT, BLUE_PICK);
    setSelectedBlue(new Set(blues));
  }, []);

  const randomSelect = useCallback(() => {
    randomRed();
    randomBlue();
  }, [randomRed, randomBlue]);

  const clearSelection = useCallback(() => {
    setSelectedRed(new Set());
    setSelectedBlue(new Set());
  }, []);

  const setMode = useCallback((mode) => {
    setCurrentMode(mode);
    if (mode === 'random') {
      randomSelect();
    }
  }, [randomSelect]);

  const stats = {};
  let totalDraws = 0;
  let totalWins = 0;
  let totalCost = 0;
  let totalPrizeMoney = 0;
  let bestLevel = 7;

  history.forEach((h) => {
    totalDraws += h.batchSize || 1;
    totalWins += h.winCount || 0;
    totalCost += h.totalCost || (h.batchSize * TICKET_COST);
    totalPrizeMoney += h.totalPrizeMoney || 0;
    if (h.prize.matched && h.prize.level < bestLevel) {
      bestLevel = h.prize.level;
    }
  });

  stats.totalDraws = totalDraws;
  stats.totalWins = totalWins;
  stats.winRate = totalDraws > 0 ? ((totalWins / totalDraws) * 100).toFixed(2) : '0';
  const levelNames = ['', '一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖'];
  stats.bestPrize = bestLevel <= 6 ? levelNames[bestLevel] : null;
  stats.totalCost = totalCost;
  stats.totalPrizeMoney = totalPrizeMoney;
  stats.overallROI = totalCost > 0 ? ((totalPrizeMoney / totalCost) * 100).toFixed(2) : '0';

  const clearHistory = useCallback(() => {
    setHistory([]);
    setPeriodNumber(2024001);
  }, []);

  return {
    selectedRed,
    selectedBlue,
    history,
    periodNumber,
    isDrawing,
    currentMode,
    drawResult,
    batchSize,
    drawProgress,
    stats,
    toggleRed,
    toggleBlue,
    randomRed,
    randomBlue,
    randomSelect,
    clearSelection,
    setMode,
    setBatchSize,
    draw,
    clearHistory,
  };
}