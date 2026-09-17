import type { StudyProgress, Deck } from '@/types';

const DECKS_KEY = 'flashstudy:decks';
const PROGRESS_KEY = 'flashstudy:progress';
const CARDS_KEY = 'flashstudy:cards';

export function saveDeck(deck: Deck): void {
  const decks = getDecks();
  const existing = decks.findIndex((d) => d.id === deck.id);
  if (existing >= 0) {
    decks[existing] = deck;
  } else {
    decks.push(deck);
  }
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getDecks(): Deck[] {
  const raw = localStorage.getItem(DECKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Deck[];
  } catch {
    return [];
  }
}

export function getDeck(id: string): Deck | undefined {
  return getDecks().find((d) => d.id === id);
}

export function deleteDeck(id: string): void {
  const decks = getDecks().filter((d) => d.id !== id);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  const cards = getAllCards();
  const filtered = cards.filter((c) => c.deckId !== id);
  localStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
  const progress = getAllProgress();
  for (const key of Object.keys(progress)) {
    if (key.startsWith(id + ':')) delete progress[key];
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function saveCards(cards: { id: number; deckId: string; front: string; back: string; tags: string[] }[]): void {
  const existing = getAllCards();
  const byKey = new Map(existing.map((c) => [`${c.deckId}:${c.id}`, c]));
  for (const c of cards) {
    byKey.set(`${c.deckId}:${c.id}`, c);
  }
  localStorage.setItem(CARDS_KEY, JSON.stringify([...byKey.values()]));
}

export function getAllCards(): { id: number; deckId: string; front: string; back: string; tags: string[] }[] {
  const raw = localStorage.getItem(CARDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getCardsForDeck(deckId: string): { id: number; deckId: string; front: string; back: string; tags: string[] }[] {
  return getAllCards().filter((c) => c.deckId === deckId);
}

export function getProgress(deckId: string): Record<string, StudyProgress> {
  const all = getAllProgress();
  const result: Record<string, StudyProgress> = {};
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith(deckId + ':')) {
      const cardId = key.slice(deckId.length + 1);
      result[cardId] = val;
    }
  }
  return result;
}

export function getAllProgress(): Record<string, StudyProgress> {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, StudyProgress>;
  } catch {
    return {};
  }
}

export function saveProgress(deckId: string, cardId: string, progress: StudyProgress): void {
  const all = getAllProgress();
  all[`${deckId}:${cardId}`] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function resetDeckProgress(deckId: string): void {
  const all = getAllProgress();
  for (const key of Object.keys(all)) {
    if (key.startsWith(deckId + ':')) delete all[key];
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}
