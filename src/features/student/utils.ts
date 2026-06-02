import type { BadgeTone } from '@/src/components/ui/Badge';

export const studentQueryTimes = {
  dashboard: {
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30
  },
  housing: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  },
  food: {
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 2
  },
  jobs: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  },
  documents: {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10
  },
  arrival: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  },
  programs: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60
  },
  profile: {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10
  },
  support: {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10
  }
} as const;

export function formatCurrency(value: number | null | undefined, currency = 'EUR'): string {
  if (typeof value !== 'number') {
    return 'Price on request';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }

  return formatDate(value);
}

export function statusTone(status: string | null | undefined): BadgeTone {
  const normalized = status?.toLowerCase() ?? '';

  if (['approved', 'active', 'open', 'confirmed', 'complete', 'completed', 'paid'].includes(normalized)) {
    return 'success';
  }

  if (['pending', 'review', 'submitted', 'processing'].includes(normalized)) {
    return 'warning';
  }

  if (['cancelled', 'canceled', 'rejected', 'failed', 'closed'].includes(normalized)) {
    return 'error';
  }

  if (['applied', 'sent', 'booked'].includes(normalized)) {
    return 'info';
  }

  return 'default';
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

