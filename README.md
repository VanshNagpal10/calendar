# Paperframe Calendar

Paperframe Calendar is an interview-ready interactive wall calendar built with Next.js 16, React 19, and client-side persistence. The experience starts from a physical hanging calendar aesthetic and adds modern interactions without needing any backend or external APIs.

## Highlights

- Custom monthly hero artwork with drag-and-drop or file upload, plus reset-to-default
- Day range selection with clear start, end, and in-between states
- Monthly memo pad for broader planning notes
- Per-day modal for notes, reminders, and birthdays
- Whole-year overview overlay for quick month navigation
- Dark and light mode
- Compact live clock and focus countdown timer
- Fully client-side persistence with `localStorage`
- Responsive layout tuned for desktop and touch devices

## Design Choices

- The main view stays month-focused so the wall-calendar aesthetic remains strong.
- A full-year overlay gives fast navigation without overcrowding the primary layout.
- Default artwork is generated locally as inline SVG so the project still works without external image or font requests.
- State stays in one client component and is passed to presentational children through plain props.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For verification:

```bash
npm run lint
npm run build
```

## Persistence Notes

This project intentionally avoids a backend. It stores the following in `localStorage`:

- Theme preference
- Month-level notes
- Day-level notes, reminders, and birthday flags
- Uploaded month artwork

If stored data becomes invalid, the app falls back gracefully to empty/default state.

## Project Structure

- `app/page.tsx`: server entry point that loads the interactive calendar
- `app/components/CalendarApp.tsx`: single client-side state owner
- `app/components/MonthCalendar.tsx`: main date grid and range interactions
- `app/components/DayModal.tsx`: per-day editing for notes, reminders, and birthdays
- `app/components/YearView.tsx`: year overview overlay
- `app/default-art.ts`: offline-safe default month artwork

## Demo Walkthrough Checklist

Use this for the required screen recording:

1. Show the desktop layout and wall-calendar aesthetic.
2. Upload a custom image for a month, then reset it back to the default.
3. Select a date range and point out the visual states.
4. Open a day, add notes, reminders, and a birthday, then show the dots in the month and year views.
5. Edit the monthly notes panel.
6. Toggle dark mode.
7. Show the focus timer running.
8. Resize to mobile width and demonstrate range selection, day editing, and the stacked layout.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- CSS with custom properties and no backend dependencies
