export interface Reminder {
  id: string;
  text: string;
  time: string;
}

export interface DayEntry {
  notes: string;
  reminders: Reminder[];
  birthday: boolean;
  birthdayName: string;
}

export type Theme = "light" | "dark";
export type FlipDirection = "next" | "prev";

export interface CalendarSelection {
  start: string | null;
  end: string | null;
}

export type DayDataMap = Record<string, DayEntry>;
export type MonthNotesMap = Record<string, string>;
export type MonthImagesMap = Record<string, string>;
export type HolidayMap = Record<string, string[]>;

export const DEFAULT_DAY_ENTRY: DayEntry = {
  notes: "",
  reminders: [],
  birthday: false,
  birthdayName: "",
};

export const HOLIDAYS: HolidayMap = {
  "2025-01-01": ["New Year's Day"],
  "2025-01-14": ["Makar Sankranti"],
  "2025-01-26": ["Republic Day"],
  "2025-03-17": ["Holi"],
  "2025-04-14": ["Dr. Ambedkar Jayanti"],
  "2025-04-18": ["Good Friday"],
  "2025-05-01": ["Labour Day"],
  "2025-06-15": ["Father's Day"],
  "2025-08-15": ["Independence Day"],
  "2025-10-02": ["Gandhi Jayanti", "Dussehra"],
  "2025-10-20": ["Diwali"],
  "2025-11-05": ["Guru Nanak Jayanti"],
  "2025-12-25": ["Christmas Day"],
  "2026-01-01": ["New Year's Day"],
  "2026-01-26": ["Republic Day"],
  "2026-03-06": ["Holi"],
  "2026-04-03": ["Good Friday"],
  "2026-05-01": ["Labour Day"],
  "2026-08-15": ["Independence Day"],
  "2026-10-02": ["Gandhi Jayanti"],
  "2026-12-25": ["Christmas Day"],
};

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function parseKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function isDayEntryEmpty(entry: DayEntry): boolean {
  return (
    entry.notes.trim().length === 0 &&
    entry.reminders.length === 0 &&
    !entry.birthday &&
    entry.birthdayName.trim().length === 0
  );
}
