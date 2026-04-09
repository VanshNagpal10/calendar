'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_MONTH_ARTWORK } from '../default-art';
import {
  CalendarSelection,
  DayDataMap,
  DEFAULT_DAY_ENTRY,
  HOLIDAYS,
  isDayEntryEmpty,
  MonthImagesMap,
  MonthNotesMap,
  Theme,
  monthKey,
} from '../types';
import CalendarHeader from './CalendarHeader';
import DayModal from './DayModal';
import FocusTimer from './FocusTimer';
import MonthCalendar from './MonthCalendar';
import NotesPanel from './NotesPanel';
import ThemeToggle from './ThemeToggle';
import YearView from './YearView';

type SelectionStep = 'idle' | 'choosing-end';
type MonthTurnState = {
  token: number;
  direction: 'next' | 'prev';
  fromYear: number;
  fromMonth: number;
  fromSelection: CalendarSelection;
};

const MONTH_TURN_DURATION_MS = 520;

const STORAGE_KEYS = {
  theme: 'cal-theme',
  dayData: 'cal-daydata',
  monthNotes: 'cal-monthnotes',
  monthImages: 'cal-monthimages',
};

function readStoredJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const saved = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === 'light' || saved === 'dark') return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function persistJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/storage errors for the interview build.
  }
}

export default function CalendarApp() {
  const today = new Date();
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selection, setSelection] = useState<CalendarSelection>({ start: null, end: null });
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('idle');
  const [dayData, setDayData] = useState<DayDataMap>(() =>
    readStoredJSON<DayDataMap>(STORAGE_KEYS.dayData, {})
  );
  const [monthNotes, setMonthNotes] = useState<MonthNotesMap>(() =>
    readStoredJSON<MonthNotesMap>(STORAGE_KEYS.monthNotes, {})
  );
  const [monthImages, setMonthImages] = useState<MonthImagesMap>(() =>
    readStoredJSON<MonthImagesMap>(STORAGE_KEYS.monthImages, {})
  );
  const [showYearView, setShowYearView] = useState(false);
  const [activeDayModal, setActiveDayModal] = useState<string | null>(null);
  const [turnState, setTurnState] = useState<MonthTurnState | null>(null);
  const turnTokenRef = useRef(0);
  const turnTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore storage write failures.
    }
  }, [theme]);

  useEffect(() => {
    persistJSON(STORAGE_KEYS.dayData, dayData);
  }, [dayData]);

  useEffect(() => {
    persistJSON(STORAGE_KEYS.monthNotes, monthNotes);
  }, [monthNotes]);

  useEffect(() => {
    persistJSON(STORAGE_KEYS.monthImages, monthImages);
  }, [monthImages]);

  useEffect(() => {
    return () => {
      if (turnTimeoutRef.current) {
        window.clearTimeout(turnTimeoutRef.current);
      }
    };
  }, []);

  function clearSelection() {
    setSelection({ start: null, end: null });
    setSelectionStep('idle');
  }

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  function startMonthTurn(
    direction: 'next' | 'prev',
    nextYear: number,
    nextMonth: number,
    shouldCloseYearView = false
  ) {
    const token = turnTokenRef.current + 1;
    turnTokenRef.current = token;

    if (turnTimeoutRef.current) {
      window.clearTimeout(turnTimeoutRef.current);
    }

    setTurnState({
      token,
      direction,
      fromYear: currentYear,
      fromMonth: currentMonth,
      fromSelection: selection,
    });

    setCurrentYear(nextYear);
    setCurrentMonth(nextMonth);

    if (shouldCloseYearView) {
      setShowYearView(false);
    }

    clearSelection();

    turnTimeoutRef.current = window.setTimeout(() => {
      setTurnState((current) => (current?.token === token ? null : current));
      turnTimeoutRef.current = null;
    }, MONTH_TURN_DURATION_MS);
  }

  function navigate(direction: 'prev' | 'next') {
    const offset = direction === 'next' ? 1 : -1;
    const nextDate = new Date(currentYear, currentMonth + offset, 1);

    startMonthTurn(direction, nextDate.getFullYear(), nextDate.getMonth());
  }

  function goToMonth(year: number, month: number) {
    if (year === currentYear && month === currentMonth) {
      setShowYearView(false);
      return;
    }

    const direction =
      year > currentYear || (year === currentYear && month > currentMonth) ? 'next' : 'prev';

    startMonthTurn(direction, year, month, true);
  }

  function openDayModal(key: string) {
    setActiveDayModal(key);
  }

  function handleDaySelect(key: string) {
    if (!selection.start || (selection.start && selection.end) || selectionStep === 'idle') {
      setSelection({ start: key, end: null });
      setSelectionStep('choosing-end');
      return;
    }

    if (key === selection.start) {
      clearSelection();
      openDayModal(key);
      return;
    }

    if (key < selection.start) {
      setSelection({ start: key, end: null });
      setSelectionStep('choosing-end');
      return;
    }

    setSelection({ start: selection.start, end: key });
    setSelectionStep('idle');
  }

  function saveDayEntry(key: string, nextEntry: typeof DEFAULT_DAY_ENTRY) {
    const normalized = {
      ...nextEntry,
      notes: nextEntry.notes.trimEnd(),
      birthdayName: nextEntry.birthday ? nextEntry.birthdayName.trim() : '',
    };

    setDayData((current) => {
      const next = { ...current };

      if (isDayEntryEmpty(normalized)) {
        delete next[key];
      } else {
        next[key] = normalized;
      }

      return next;
    });
  }

  function saveMonthNotes(notes: string) {
    const key = monthKey(currentYear, currentMonth);
    setMonthNotes((current) => ({ ...current, [key]: notes }));
  }

  function saveMonthImage(key: string, dataUrl: string) {
    setMonthImages((current) => ({ ...current, [key]: dataUrl }));
  }

  function resetMonthImage(key: string) {
    setMonthImages((current) => {
      if (!(key in current)) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  const currentMonthKey = monthKey(currentYear, currentMonth);
  const currentNotes = monthNotes[currentMonthKey] ?? '';
  const heroImage = monthImages[currentMonthKey] ?? DEFAULT_MONTH_ARTWORK[currentMonth];
  const activeEntry = activeDayModal ? dayData[activeDayModal] ?? DEFAULT_DAY_ENTRY : null;

  return (
    <div className="cal-root">
      <main className="cal-card" role="main" aria-label="Interactive wall calendar">
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          heroImage={heroImage}
          imageKey={currentMonthKey}
          isCustomImage={Boolean(monthImages[currentMonthKey])}
          selection={selection}
          selectionStep={selectionStep}
          onNavigate={navigate}
          onYearNavigate={(direction) =>
            startMonthTurn(direction, currentYear + (direction === 'next' ? 1 : -1), currentMonth)
          }
          onYearView={() => setShowYearView(true)}
          onImageChange={saveMonthImage}
          onImageReset={resetMonthImage}
        />

        <div className="cal-body">
          <NotesPanel
            year={currentYear}
            month={currentMonth}
            notes={currentNotes}
            selection={selection}
            onChange={saveMonthNotes}
          />

          <MonthCalendar
            year={currentYear}
            month={currentMonth}
            selection={selection}
            dayData={dayData}
            holidays={HOLIDAYS}
            turnState={turnState}
            onDaySelect={handleDaySelect}
            onDayOpen={openDayModal}
            today={today}
          />
        </div>

        <footer className="cal-bottom-bar">
          <FocusTimer />
          <div className="bottom-bar-right">
            <p className="helper-copy">
              Click or tap to build a range. Double-click, right-click, or long-press to edit a
              specific day.
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </footer>
      </main>

      {showYearView ? (
        <YearView
          year={currentYear}
          currentMonth={currentMonth}
          dayData={dayData}
          holidays={HOLIDAYS}
          today={today}
          onSelectMonth={goToMonth}
          onClose={() => setShowYearView(false)}
        />
      ) : null}

      {activeDayModal && activeEntry ? (
        <DayModal
          key={activeDayModal}
          dateKey={activeDayModal}
          entry={activeEntry}
          holidays={HOLIDAYS}
          onSave={(entry) => saveDayEntry(activeDayModal, entry)}
          onClose={() => setActiveDayModal(null)}
        />
      ) : null}
    </div>
  );
}
