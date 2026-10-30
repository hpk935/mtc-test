'use client';

import { useSyncExternalStore } from 'react';
import { BUSINESS_TIME_ZONE } from '@/lib/dates';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: BUSINESS_TIME_ZONE,
  });
}

function formatTime(date: Date) {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: BUSINESS_TIME_ZONE,
    })
    .toLowerCase();
}

let currentMinute = getMinuteKey();

function getMinuteKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

function subscribe(callback: () => void) {
  const interval = setInterval(() => {
    const key = getMinuteKey();
    if (key !== currentMinute) {
      currentMinute = key;
      callback();
    }
  }, 1_000);
  return () => clearInterval(interval);
}

function getSnapshot() {
  return currentMinute;
}

function getServerSnapshot() {
  return '';
}

export function DateDisplay() {
  const minute = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!minute) return null;

  const now = new Date();

  return (
    <span className="text-muted-foreground text-sm">
      {formatDate(now)} {formatTime(now)}
    </span>
  );
}
