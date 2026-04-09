'use client';

import { useRef } from 'react';
import { CalendarSelection, DayDataMap, HolidayMap, dateKey } from '../types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKEND_INDICES = [5, 6];

interface CalendarCell {
  key: string;
  day: number;
  type: 'prev' | 'current' | 'next';
}

interface MonthTurnState {
  token: number;
  direction: 'next' | 'prev';
  fromYear: number;
  fromMonth: number;
  fromSelection: CalendarSelection;
}

function getDaysMatrix(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

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

function isRangeDay(key: string, selection: CalendarSelection): boolean {
  return Boolean(selection.start && selection.end && key > selection.start && key < selection.end);
}

interface Props {
  year: number;
  month: number;
  selection: CalendarSelection;
  dayData: DayDataMap;
  holidays: HolidayMap;
  turnState: MonthTurnState | null;
  onDaySelect: (key: string) => void;
  onDayOpen: (key: string) => void;
  today: Date;
}

export default function MonthCalendar({
  year,
  month,
  selection,
  dayData,
  holidays,
  turnState,
  onDaySelect,
  onDayOpen,
  today,
}: Props) {
  const pressTimerRef = useRef<number | null>(null);
  const ignoreClickRef = useRef<string | null>(null);
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const isTurning = Boolean(turnState);

  function clearLongPress() {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  function queueLongPress(key: string, pointerType: string) {
    if (pointerType !== 'touch') return;

    clearLongPress();
    pressTimerRef.current = window.setTimeout(() => {
      ignoreClickRef.current = key;
      onDayOpen(key);
    }, 420);
  }

  function renderSheet(
    renderYear: number,
    renderMonth: number,
    renderSelection: CalendarSelection,
    options: {
      interactive: boolean;
      layerClassName?: string;
      keyPrefix: string;
      ariaHidden?: boolean;
    }
  ) {
    const cells = getDaysMatrix(renderYear, renderMonth);

    return (
      <div
        key={`${options.keyPrefix}-${renderYear}-${renderMonth}`}
        className={`page-turn-layer${options.layerClassName ? ` ${options.layerClassName}` : ''}`}
        aria-hidden={options.ariaHidden}
      >
        <div className="cal-sheet">
          <div className="cal-sheet-face cal-sheet-face-front">
            <div className="cal-weekdays" role="row">
              {WEEKDAYS.map((label, index) => (
                <div
                  key={`${options.keyPrefix}-${label}`}
                  className={`cal-weekday${WEEKEND_INDICES.includes(index) ? ' weekend' : ''}`}
                  role="columnheader"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="cal-days" role="grid" aria-label={`Calendar grid for ${renderMonth + 1}/${renderYear}`}>
              {cells.map((cell, index) => {
                const isCurrentMonth = cell.type === 'current';
                const isToday = cell.key === todayKey && isCurrentMonth;
                const isStart = renderSelection.start === cell.key;
                const isEnd = renderSelection.end === cell.key;
                const inRange = isCurrentMonth && isRangeDay(cell.key, renderSelection);
                const isRangeStartEdge = inRange && index % 7 === 0;
                const isRangeEndEdge = inRange && index % 7 === 6;
                const entry = dayData[cell.key];
                const holidayLabels = holidays[cell.key] ?? [];
                const isWeekend = WEEKEND_INDICES.includes(index % 7);
                const hasNote = Boolean(entry?.notes.trim());
                const hasReminder = Boolean(entry?.reminders.length);
                const hasBirthday = Boolean(entry?.birthday);
                const hasContent = hasNote || hasReminder || hasBirthday || holidayLabels.length > 0;

                let className = 'day-cell';
                if (!isCurrentMonth) className += ' other-month';
                if (isWeekend) className += ' weekend';
                if (isToday) className += ' today';
                if (inRange) className += ' in-range';
                if (isRangeStartEdge) className += ' range-start-edge';
                if (isRangeEndEdge) className += ' range-end-edge';
                if (isStart) className += ' selected-start';
                if (isEnd) className += ' selected-end';
                if (hasContent) className += ' has-content';
                if (!options.interactive) className += ' non-interactive';

                return (
                  <div
                    key={`${options.keyPrefix}-${cell.key}-${index}`}
                    className={className}
                    role="gridcell"
                    aria-disabled={!isCurrentMonth || !options.interactive}
                    aria-label={`${cell.day}${isToday ? ', today' : ''}${holidayLabels.length ? `, ${holidayLabels.join(', ')}` : ''}${hasBirthday ? ', birthday' : ''}${hasReminder ? ', reminder' : ''}${hasNote ? ', note' : ''}`}
                    tabIndex={options.interactive && isCurrentMonth ? 0 : -1}
                    onClick={
                      options.interactive
                        ? () => {
                            if (!isCurrentMonth) return;
                            if (ignoreClickRef.current === cell.key) {
                              ignoreClickRef.current = null;
                              return;
                            }
                            onDaySelect(cell.key);
                          }
                        : undefined
                    }
                    onDoubleClick={
                      options.interactive
                        ? () => {
                            if (isCurrentMonth) onDayOpen(cell.key);
                          }
                        : undefined
                    }
                    onContextMenu={
                      options.interactive
                        ? (event) => {
                            if (!isCurrentMonth) return;
                            event.preventDefault();
                            onDayOpen(cell.key);
                          }
                        : undefined
                    }
                    onPointerDown={
                      options.interactive
                        ? (event) => {
                            if (isCurrentMonth) queueLongPress(cell.key, event.pointerType);
                          }
                        : undefined
                    }
                    onPointerUp={options.interactive ? clearLongPress : undefined}
                    onPointerLeave={options.interactive ? clearLongPress : undefined}
                    onPointerCancel={options.interactive ? clearLongPress : undefined}
                    onKeyDown={
                      options.interactive
                        ? (event) => {
                            if (!isCurrentMonth) return;

                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onDaySelect(cell.key);
                            }
                          }
                        : undefined
                    }
                  >
                    <span className="day-num">{cell.day}</span>

                    {hasContent ? (
                      <div className="day-dots" aria-hidden="true">
                        {hasNote ? <span className="dot dot-note" /> : null}
                        {hasReminder ? <span className="dot dot-reminder" /> : null}
                        {hasBirthday ? <span className="dot dot-birthday" /> : null}
                        {holidayLabels.length ? <span className="dot dot-holiday" /> : null}
                      </div>
                    ) : null}

                    {holidayLabels.length ? (
                      <div className="holiday-tooltip" role="tooltip">
                        {holidayLabels.join(' / ')}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend" aria-label="Calendar legend">
              <span className="legend-item">
                <span className="legend-swatch note" />
                Notes
              </span>
              <span className="legend-item">
                <span className="legend-swatch reminder" />
                Reminders
              </span>
              <span className="legend-item">
                <span className="legend-swatch birthday" />
                Birthdays
              </span>
              <span className="legend-item">
                <span className="legend-swatch holiday" />
                Holidays
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectionHint = !selection.start
    ? 'Select a start date to highlight a planning range.'
    : selection.end
      ? 'Range locked. Choose another date to start a fresh selection.'
      : 'Choose an end date, or open the same day to add notes and reminders.';

  return (
    <section className="cal-grid-wrap" aria-label="Calendar dates">
      <p className="selection-hint" role="status" aria-live="polite">
        {selectionHint}
      </p>

      <div className={`page-turn-stage${isTurning ? ' is-turning' : ''}`}>
        {turnState ? (
          <>
            {renderSheet(turnState.fromYear, turnState.fromMonth, turnState.fromSelection, {
              interactive: false,
              layerClassName: `outgoing turn-${turnState.direction}`,
              keyPrefix: `outgoing-${turnState.token}`,
              ariaHidden: true,
            })}

            {renderSheet(year, month, selection, {
              interactive: false,
              layerClassName: `incoming turn-${turnState.direction}`,
              keyPrefix: `incoming-${turnState.token}`,
            })}
          </>
        ) : (
          renderSheet(year, month, selection, {
            interactive: true,
            layerClassName: 'static',
            keyPrefix: 'current',
          })
        )}
      </div>
    </section>
  );
}
