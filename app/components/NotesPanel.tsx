'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarSelection } from '../types';

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

function formatSelection(selection: CalendarSelection): string {
  if (!selection.start) {
    return 'Monthly memo space for goals, errands, and quick planning notes.';
  }

  const formatter = (key: string) => {
    const [, month, day] = key.split('-');
    return `${MONTH_FORMATTER
      .format(new Date(2026, Number(month) - 1, 1))
      .split(' ')[0]
      .slice(0, 3)} ${Number(day)}`;
  };

  if (!selection.end) {
    return `Range anchor selected on ${formatter(selection.start)}.`;
  }

  return `Selected range: ${formatter(selection.start)} to ${formatter(selection.end)}.`;
}

interface Props {
  year: number;
  month: number;
  notes: string;
  selection: CalendarSelection;
  onChange: (value: string) => void;
}

export default function NotesPanel({ year, month, notes, selection, onChange }: Props) {
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const monthLabel = MONTH_FORMATTER.format(new Date(year, month, 1));

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleChange(nextValue: string) {
    onChange(nextValue);
    setShowSaved(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setShowSaved(false);
    }, 1400);
  }

  return (
    <aside className="notes-panel" aria-label={`${monthLabel} notes`}>
      <div>
        <p className="panel-label">Monthly Notes</p>
        <h2 className="notes-heading">{monthLabel}</h2>
        <p className="notes-summary">{formatSelection(selection)}</p>
      </div>

      <label className="panel-label" htmlFor="month-notes">
        Memo Pad
      </label>

      <textarea
        id="month-notes"
        className="notes-textarea"
        value={notes}
        maxLength={900}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Capture deadlines, travel plans, groceries, or anything you want to keep visible this month."
      />

      <div className="notes-footer">
        <span className={`notes-saved-badge${showSaved ? ' visible' : ''}`}>Auto-saved locally</span>
        <span className="notes-char-count">{notes.length}/900</span>
      </div>

      <div className="notes-lines" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} className="notes-line" />
        ))}
      </div>
    </aside>
  );
}
