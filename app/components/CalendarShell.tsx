'use client';

import dynamic from 'next/dynamic';

const CalendarApp = dynamic(() => import('./CalendarApp'), {
  ssr: false,
  loading: () => (
    <main className="cal-root" aria-busy="true" aria-live="polite">
      <section className="cal-card cal-loading-card">
        <div className="cal-loading-copy">
          <p className="cal-loading-kicker">Paperframe Calendar</p>
          <h1 className="cal-loading-title">Preparing your wall calendar...</h1>
        </div>
      </section>
    </main>
  ),
});

export default function CalendarShell() {
  return <CalendarApp />;
}
