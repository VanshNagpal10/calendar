'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_DAY_ENTRY, DayEntry, HolidayMap, Reminder, parseKey } from '../types';

type DayTab = 'notes' | 'reminders' | 'birthday';

function formatDateLabel(key: string): { title: string; subtitle: string } {
  const { year, month, day } = parseKey(key);
  const date = new Date(year, month, day);

  return {
    title: date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    subtitle: date.toLocaleDateString('en-US', {
      year: 'numeric',
    }),
  };
}

function createReminderId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `reminder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface Props {
  dateKey: string;
  entry: DayEntry;
  holidays: HolidayMap;
  onSave: (entry: DayEntry) => void;
  onClose: () => void;
}

export default function DayModal({ dateKey, entry, holidays, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DayTab>('notes');
  const [draft, setDraft] = useState<DayEntry>({
    notes: entry.notes,
    reminders: [...entry.reminders],
    birthday: entry.birthday,
    birthdayName: entry.birthdayName,
  });
  const [reminderText, setReminderText] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');

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

  const labels = formatDateLabel(dateKey);
  const holidayLabels = holidays[dateKey] ?? [];

  function updateDraft(nextValues: Partial<DayEntry>) {
    setDraft((current) => ({ ...current, ...nextValues }));
  }

  function addReminder() {
    const trimmed = reminderText.trim();
    if (!trimmed) return;

    const nextReminder: Reminder = {
      id: createReminderId(),
      text: trimmed,
      time: reminderTime || '09:00',
    };

    updateDraft({ reminders: [...draft.reminders, nextReminder] });
    setReminderText('');
  }

  function removeReminder(id: string) {
    updateDraft({ reminders: draft.reminders.filter((reminder) => reminder.id !== id) });
  }

  function saveAndClose() {
    const normalized: DayEntry = {
      notes: draft.notes,
      reminders: draft.reminders,
      birthday: draft.birthday,
      birthdayName: draft.birthday ? draft.birthdayName : '',
    };

    onSave(normalized);
    onClose();
  }

  function clearDay() {
    onSave(DEFAULT_DAY_ENTRY);
    onClose();
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="modal-sheet day-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="day-modal-top">
          <div>
            <h2 className="day-modal-date" id="day-modal-title">
              {labels.title}
            </h2>
            <p className="day-modal-sub">{labels.subtitle}</p>
            {holidayLabels.length ? (
              <div className="holiday-list">
                {holidayLabels.map((label) => (
                  <span key={label} className="holiday-chip">
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <button className="modal-close" type="button" onClick={onClose} aria-label="Close day editor">
            ×
          </button>
        </header>

        <div className="day-modal-tabs" role="tablist" aria-label="Day entry tabs">
          {(['notes', 'reminders', 'birthday'] as DayTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`day-modal-tab${activeTab === tab ? ' active' : ''}`}
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'notes' ? 'Notes' : tab === 'reminders' ? 'Reminders' : 'Birthday'}
            </button>
          ))}
        </div>

        <div className="day-modal-body">
          {activeTab === 'notes' ? (
            <textarea
              className="day-note-textarea"
              value={draft.notes}
              onChange={(event) => updateDraft({ notes: event.target.value })}
              placeholder="Capture meeting context, errands, trip details, or ideas tied to this day."
            />
          ) : null}

          {activeTab === 'reminders' ? (
            <>
              <div className="reminder-input-row">
                <input
                  className="reminder-input"
                  type="time"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                  aria-label="Reminder time"
                />
                <input
                  className="reminder-input"
                  type="text"
                  value={reminderText}
                  onChange={(event) => setReminderText(event.target.value)}
                  placeholder="Add reminder text"
                  aria-label="Reminder text"
                />
                <button className="add-btn" type="button" onClick={addReminder}>
                  Add
                </button>
              </div>

              <div className="reminder-list">
                {draft.reminders.length ? (
                  draft.reminders.map((reminder) => (
                    <div key={reminder.id} className="reminder-item">
                      <span className="reminder-time">{reminder.time}</span>
                      <span className="reminder-text">{reminder.text}</span>
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={() => removeReminder(reminder.id)}
                        aria-label={`Delete reminder ${reminder.text}`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="notes-summary">No reminders yet. Add a quick time-based prompt for this day.</p>
                )}
              </div>
            </>
          ) : null}

          {activeTab === 'birthday' ? (
            <>
              <div className="birthday-toggle-row">
                <div>
                  <p className="birthday-toggle-label">Mark this as a birthday</p>
                  <p className="notes-summary">Turn on the birthday flag so the date stands out in month and year views.</p>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={draft.birthday}
                    onChange={(event) => updateDraft({ birthday: event.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <input
                className="birthday-name-input"
                type="text"
                value={draft.birthdayName}
                disabled={!draft.birthday}
                onChange={(event) => updateDraft({ birthdayName: event.target.value })}
                placeholder="Whose birthday is it?"
              />
            </>
          ) : null}
        </div>

        <footer className="modal-footer">
          <p className="modal-footer-note">Saved locally in your browser for this interview build.</p>
          <div className="modal-actions">
            <button className="secondary-btn" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="danger-btn" type="button" onClick={clearDay}>
              Clear
            </button>
            <button className="primary-btn" type="button" onClick={saveAndClose}>
              Save Changes
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
