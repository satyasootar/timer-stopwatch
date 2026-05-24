import { useEffect, useState, useRef, useCallback, type UIEvent } from 'react';

const WheelPicker = ({ 
  max, 
  value, 
  onChange, 
  label, 
  disabled 
}: { 
  max: number, 
  value: number, 
  onChange?: (val: number) => void, 
  label: string, 
  disabled?: boolean 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammatic = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedValue = useRef(value);
  const ITEM_HEIGHT = 60;

  useEffect(() => {
    if (!containerRef.current) return;
    
    // If the value update was caused by the user's manual scroll, don't interrupt it!
    // We let native CSS scroll-snapping take the wheel smoothly.
    if (value === lastReportedValue.current) return;

    // Otherwise, this is an external change (Reset button, Timer ticking).
    // We update our ref and force a programmatic smooth scroll.
    lastReportedValue.current = value;
    const targetScroll = value * ITEM_HEIGHT;
    
    isProgrammatic.current = true;
    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    // Wait for the smooth scroll to finish before removing the programmatic lock
    scrollTimeout.current = setTimeout(() => {
      isProgrammatic.current = false;
    }, 500);
  }, [value]);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    if (disabled || !onChange || isProgrammatic.current) return;
    const scrollY = e.currentTarget.scrollTop;
    const index = Math.round(scrollY / ITEM_HEIGHT);
    const safeIndex = Math.max(0, Math.min(index, max));
    
    if (safeIndex !== value) {
      lastReportedValue.current = safeIndex; 
      onChange(safeIndex);
    }
  }, [value, max, disabled, onChange]);

  return (
    <div className="wheel-column">
      <div className="wheel-label">{label}</div>
      <div className="wheel-container-wrapper">
        <div className="wheel-selection-overlay" />
        <div 
          className={`wheel-container ${disabled ? 'disabled' : ''}`}
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div className="wheel-spacer" />
          {Array.from({ length: max + 1 }).map((_, i) => (
            <div key={i} className={`wheel-item ${i === value ? 'active' : ''}`}>
              {i.toString().padStart(2, '0')}
            </div>
          ))}
          <div className="wheel-spacer" />
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'stopwatch'>('timer');

  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  const timerH = Math.floor(timerTotalSeconds / 3600);
  const timerM = Math.floor((timerTotalSeconds % 3600) / 60);
  const timerS = timerTotalSeconds % 60;

  const updateTimer = (type: 'h'|'m'|'s', val: number) => {
    setTimerTotalSeconds(prev => {
      const h = Math.floor(prev / 3600);
      const m = Math.floor((prev % 3600) / 60);
      const s = prev % 60;
      if (type === 'h') return val * 3600 + m * 60 + s;
      if (type === 'm') return h * 3600 + val * 60 + s;
      return h * 3600 + m * 60 + val;
    });
  };

  const [stopwatchTotalSeconds, setStopwatchTotalSeconds] = useState(0);
  const [stopwatchStarted, setStopwatchStarted] = useState(false);

  const stopH = Math.floor(stopwatchTotalSeconds / 3600);
  const stopM = Math.floor((stopwatchTotalSeconds % 3600) / 60);
  const stopS = stopwatchTotalSeconds % 60;

  useEffect(() => {
    if (!timerStarted) return;
    if (timerTotalSeconds === 0) {
      setTimerStarted(false);
      return;
    }
    const interval = setInterval(() => {
      setTimerTotalSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStarted, timerTotalSeconds]);

  useEffect(() => {
    if (!stopwatchStarted) return;
    const interval = setInterval(() => {
      setStopwatchTotalSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stopwatchStarted]);

  return (
    <div className="layout">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          Timer
        </button>
        <button 
          className={`tab ${activeTab === 'stopwatch' ? 'active' : ''}`}
          onClick={() => setActiveTab('stopwatch')}
        >
          Stopwatch
        </button>
      </div>

      {activeTab === 'timer' && (
        <div className="tab-content">
          <div className="wheel-group">
            <WheelPicker max={99} value={timerH} onChange={(v) => updateTimer('h', v)} label="h" disabled={timerStarted} />
            <WheelPicker max={59} value={timerM} onChange={(v) => updateTimer('m', v)} label="m" disabled={timerStarted} />
            <WheelPicker max={59} value={timerS} onChange={(v) => updateTimer('s', v)} label="s" disabled={timerStarted} />
          </div>
          <div className="controls">
            <button className="btn btn-primary" onClick={() => {
              if (timerTotalSeconds > 0 || timerStarted) setTimerStarted(prev => !prev);
            }}>
              {timerStarted ? 'Pause' : 'Start'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setTimerStarted(false); setTimerTotalSeconds(0); }}>
              Reset
            </button>
          </div>
        </div>
      )}

      {activeTab === 'stopwatch' && (
        <div className="tab-content">
          <div className="wheel-group">
            <WheelPicker max={99} value={stopH} label="h" disabled={true} />
            <WheelPicker max={59} value={stopM} label="m" disabled={true} />
            <WheelPicker max={59} value={stopS} label="s" disabled={true} />
          </div>
          <div className="controls">
            <button className="btn btn-primary" onClick={() => setStopwatchStarted(prev => !prev)}>
              {stopwatchStarted ? 'Pause' : 'Start'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setStopwatchStarted(false); setStopwatchTotalSeconds(0); }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
