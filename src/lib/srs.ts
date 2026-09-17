import type { StudyProgress, Rating } from '@/types';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MS_DAY = 86400000;

export function createInitialProgress(): StudyProgress {
  return {
    cardId: '',
    ease: DEFAULT_EASE,
    interval: 0,
    due: Date.now(),
    reps: 0,
    lapses: 0,
    lastStudied: null,
  };
}

export function rate(progress: StudyProgress, rating: Rating): StudyProgress {
  let { ease, interval, reps, lapses } = progress;
  const now = Date.now();

  if (rating === 'again') {
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0;
    reps = 0;
  } else if (rating === 'hard') {
    ease = Math.max(MIN_EASE, ease - 0.15);
    interval = Math.max(1, interval === 0 ? 1 : Math.round(interval * 1.2));
    reps += 1;
  } else if (rating === 'good') {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }
    reps += 1;
  } else if (rating === 'easy') {
    ease += 0.15;
    if (interval === 0) {
      interval = 2;
    } else if (interval === 1) {
      interval = 4;
    } else {
      interval = Math.round(interval * ease * 1.3);
    }
    reps += 1;
  }

  return {
    cardId: progress.cardId,
    ease,
    interval,
    due: now + interval * MS_DAY,
    reps,
    lapses,
    lastStudied: now,
  };
}

export function isDue(progress: StudyProgress): boolean {
  return progress.due <= Date.now();
}

export function getDueCount(progressMap: Record<string, StudyProgress>, cardIds: string[]): number {
  return cardIds.filter((id) => {
    const p = progressMap[id];
    if (!p) return true;
    return isDue(p);
  }).length;
}

export function isNew(progress: StudyProgress | undefined): boolean {
  return !progress || progress.reps === 0;
}
