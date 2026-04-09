'use client';

import { useRef, useState } from 'react';
import { CalendarSelection } from '../types';

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

function formatRange(selection: CalendarSelection): string {
  if (!selection.start) return 'Start by choosing a date in the grid below.';

  const formatter = (key: string) => {
    const [, month, day] = key.split('-');
    return `${MONTHS[Number(month) - 1].slice(0, 3)} ${Number(day)}`;
  };

  if (!selection.end) {
    return `Anchor selected on ${formatter(selection.start)}. Choose an end date to finish the range.`;
  }

  return `${formatter(selection.start)} to ${formatter(selection.end)}`;
}

function SpiralBinding() {
  const loops = 24;

  return (
    <svg
      width="100%"
      height="36"
      viewBox={`0 0 ${loops * 28} 36`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {Array.from({ length: loops }, (_, index) => {
        const centerX = index * 28 + 14;
        return (
          <g key={index}>
            <path
              d={`M ${centerX - 8} 12 A 8 8 0 0 0 ${centerX + 8} 12`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.25"
            />
            <path
              d={`M ${centerX - 8} 12 A 8 12 0 0 1 ${centerX + 8} 12`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.78"
            />
          </g>
        );
      })}
    </svg>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function optimizeImage(file: File): Promise<string> {
  const raw = await readFileAsDataUrl(file);

  if (file.type === 'image/svg+xml') {
    return raw;
  }

  try {
    const image = await loadImage(raw);
    const maxSide = 1600;
    const longestSide = Math.max(image.width, image.height);

    if (longestSide <= maxSide && raw.length < 1_600_000) {
      return raw;
    }

    const scale = Math.min(1, maxSide / longestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return raw;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  } catch {
    return raw;
  }
}

interface Props {
  year: number;
  month: number;
  heroImage: string;
  imageKey: string;
  isCustomImage: boolean;
  selection: CalendarSelection;
  selectionStep: 'idle' | 'choosing-end';
  onNavigate: (direction: 'prev' | 'next') => void;
  onYearNavigate: (direction: 'prev' | 'next') => void;
  onYearView: () => void;
  onImageChange: (key: string, dataUrl: string) => void;
  onImageReset: (key: string) => void;
}

export default function CalendarHeader({
  year,
  month,
  heroImage,
  imageKey,
  isCustomImage,
  selection,
  selectionStep,
  onNavigate,
  onYearNavigate,
  onYearView,
  onImageChange,
  onImageReset,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleIncomingFile(file?: File) {
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);

    try {
      const optimized = await optimizeImage(file);
      onImageChange(imageKey, optimized);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  const rangeLabel =
    selectionStep === 'choosing-end' ? 'Select an end date to complete the range.' : formatRange(selection);

  return (
    <>
      <div className="spiral-bar" aria-hidden="true">
        <span className="spiral-hook" />
        <SpiralBinding />
      </div>

      <section
        className={`cal-hero${dragActive ? ' drag-active' : ''}`}
        role="img"
        aria-label={`${MONTHS[month]} ${year} hero artwork`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          void handleIncomingFile(event.dataTransfer.files[0]);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-image" src={heroImage} alt={`${MONTHS[month]} calendar artwork`} />

      
        <div className="hero-actions">
          <button
            className="hero-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload custom artwork"
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>

          {isCustomImage ? (
            <button
              className="hero-button hero-button-secondary"
              type="button"
              onClick={() => onImageReset(imageKey)}
            >
              Use Default
            </button>
          ) : null}
        </div>

        <p className={`hero-drop-hint${dragActive ? ' visible' : ''}`}>
          Drop an image anywhere on the poster to set artwork for this month.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hero-upload-input"
          onChange={(event) => {
            void handleIncomingFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </section>

      <section className="cal-banner">
        <div className="banner-left">
          <p className="banner-year">{year}</p>
          <h1 className="banner-month">{MONTHS[month]}</h1>
          <p className="banner-range" aria-live="polite">
            {rangeLabel}
          </p>
        </div>

        <div className="banner-right">
          <button
            className="nav-btn year-shift-btn"
            type="button"
            onClick={() => onYearNavigate('prev')}
            aria-label="Previous year"
            title="Previous year"
          >
            <span aria-hidden="true">«</span>
          </button>

          <button className="year-view-btn" type="button" onClick={onYearView}>
            Year View
          </button>

          <button className="nav-btn" type="button" onClick={() => onNavigate('prev')} aria-label="Previous month">
            <span aria-hidden="true">‹</span>
          </button>

          <button className="nav-btn" type="button" onClick={() => onNavigate('next')} aria-label="Next month">
            <span aria-hidden="true">›</span>
          </button>

          <button
            className="nav-btn year-shift-btn"
            type="button"
            onClick={() => onYearNavigate('next')}
            aria-label="Next year"
            title="Next year"
          >
            <span aria-hidden="true">»</span>
          </button>
        </div>
      </section>
    </>
  );
}
