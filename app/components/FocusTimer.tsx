'use client';

import { useEffect, useState } from 'react';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function clampMinutes(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 25;
  return Math.min(180, Math.max(1, Math.round(parsed)));
}

export default function FocusTimer() {
  const [now, setNow] = useState(() => new Date());
  const [minutesInput, setMinutesInput] = useState('25');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const clockId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(clockId);
    };
  }, []);

  useEffect(() => {
    if (!running) return;

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          setRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [running]);

  function syncMinutes(value: string) {
    const normalized = clampMinutes(value);
    setMinutesInput(String(normalized));

    if (!running) {
      setRemainingSeconds(normalized * 60);
    }
  }

  function toggleRunning() {
    if (!running && remainingSeconds === 0) {
      setRemainingSeconds(clampMinutes(minutesInput) * 60);
    }

    setRunning((current) => !current);
  }

  function resetTimer() {
    const normalized = clampMinutes(minutesInput);
    setRunning(false);
    setRemainingSeconds(normalized * 60);
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="timer-section" aria-label="Focus timer">
      <div className="clock-stack">
        <span className="clock-display">{timeLabel}</span>
        <span className="clock-date">{dateLabel}</span>
      </div>

      <span className="timer-divider" aria-hidden="true" />

      <div className="timer-display">
        <span className="timer-label">Focus</span>
        <span className={`timer-num${running ? ' active' : ''}`}>
          {pad(minutes)}:{pad(seconds)}
        </span>
        <input
          className="timer-input-small"
          type="number"
          min="1"
          max="180"
          inputMode="numeric"
          aria-label="Focus timer minutes"
          value={minutesInput}
          onChange={(event) => setMinutesInput(event.target.value)}
          onBlur={(event) => syncMinutes(event.target.value)}
        />
        <div className="timer-controls">
          <button className="timer-btn primary" type="button" onClick={toggleRunning}>
            {running ? 'Pause' : 'Start'}
          </button>
          <button className="timer-btn" type="button" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
