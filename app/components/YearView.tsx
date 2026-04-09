'use client';

import { useEffect } from 'react';
import { DayDataMap, HolidayMap, dateKey } from '../types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildMiniMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ key: string; day: number; type: 'prev' | 'current' | 'next' }> = [];

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ key: dateKey(prevYear, prevMonth, day), day, type: 'prev' });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: dateKey(year, month, day), day, type: 'current' });
  }

  while (cells.length < 42) {
    const day = cells.length - (startOffset + daysInMonth) + 1;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({ key: dateKey(nextYear, nextMonth, day), day, type: 'next' });
  }

  return cells;
}

interface Props {
  year: number;
  currentMonth: number;
  dayData: DayDataMap;
  holidays: HolidayMap;
  today: Date;
  onSelectMonth: (year: number, month: number) => void;
  onClose: () => void;
}

export default function YearView({
  year,
  currentMonth,
  dayData,
  holidays,
  today,
  onSelectMonth,
  onClose,
}: Props) {
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="modal-sheet year-view-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="year-view-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-header-copy">
            <h2 className="modal-title" id="year-view-title">
              {year} Overview
            </h2>
            <p className="modal-subtitle">Jump to any month and preview notes, reminders, birthdays, and holidays.</p>
          </div>

          <button className="modal-close" type="button" onClick={onClose} aria-label="Close year view">
            ×
          </button>
        </header>

        <div className="year-grid">
          {MONTHS.map((label, monthIndex) => {
            const cells = buildMiniMonth(year, monthIndex);
            const currentMonthKeys = cells.filter((cell) => cell.type === 'current').map((cell) => cell.key);
            const noteCount = currentMonthKeys.filter((key) => dayData[key]?.notes.trim()).length;
            const birthdayCount = currentMonthKeys.filter((key) => dayData[key]?.birthday).length;

            return (
              <button
                key={label}
                className={`mini-month${currentMonth === monthIndex ? ' active-month' : ''}`}
                type="button"
                onClick={() => onSelectMonth(year, monthIndex)}
              >
                <div className="mini-month-header">
                  <span className="mini-month-name">{label}</span>
                  <span className="mini-month-meta">{noteCount + birthdayCount} highlights</span>
                </div>

                <div className="mini-cal-grid">
                  {WEEKDAY_LABELS.map((weekday) => (
                    <span key={`${label}-${weekday}`} className="mini-day mini-header">
                      {weekday}
                    </span>
                  ))}

                  {cells.map((cell, index) => {
                    const holidayLabels = holidays[cell.key] ?? [];
                    const hasNote = Boolean(dayData[cell.key]?.notes.trim());
                    const hasReminder = Boolean(dayData[cell.key]?.reminders.length);
                    const hasBirthday = Boolean(dayData[cell.key]?.birthday);
                    const isToday = cell.key === todayKey;

                    let className = 'mini-day';
                    if (cell.type !== 'current') className += ' mini-other';
                    if (index % 7 >= 5) className += ' mini-weekend';
                    if (isToday && cell.type === 'current') className += ' mini-today';

                    return (
                      <span key={`${cell.key}-${index}`} className={className}>
                        {cell.day}
                        {cell.type === 'current' && (hasNote || hasReminder || hasBirthday || holidayLabels.length) ? (
                          <span className="mini-indicators" aria-hidden="true">
                            {hasNote ? <span className="mini-indicator note" /> : null}
                            {hasReminder ? <span className="mini-indicator reminder" /> : null}
                            {hasBirthday ? <span className="mini-indicator birthday" /> : null}
                            {holidayLabels.length ? <span className="mini-indicator holiday" /> : null}
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
