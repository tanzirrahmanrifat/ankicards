export interface Flashcard {
  id: number;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
}

export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  description: string;
  createdAt: number;
}

export interface StudyProgress {
  cardId: string;
  ease: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  lastStudied: number | null;
}

export interface StudyStats {
  reviewed: number;
  correct: number;
  again: number;
  startTime: number;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  progress: Record<string, StudyProgress>;
  stats: StudyStats;
  currentIndex: number;
  queue: number[];
  finished: boolean;
}
