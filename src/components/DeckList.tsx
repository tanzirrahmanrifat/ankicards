import { useState, useEffect } from 'react';
import { Trash2, ChevronRight, BookOpen, Layers, RefreshCw, Clock } from 'lucide-react';
import { getDecks, deleteDeck, getCardsForDeck, getProgress, getAllProgress } from '@/lib/storage';
import { getDueCount } from '@/lib/srs';
import type { Deck } from '@/types';

interface DeckListProps {
  onStudy: (deck: Deck) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function DeckList({ onStudy, refreshKey, onRefresh }: DeckListProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const allDecks = getDecks();
    setDecks(allDecks);
    const counts: Record<string, number> = {};
    for (const deck of allDecks) {
      const cards = getCardsForDeck(deck.id);
      const cardIds = cards.map((c) => String(c.id));
      const progress = getProgress(deck.id);
      counts[deck.id] = getDueCount(progress, cardIds);
    }
    setDueCounts(counts);
  }, [refreshKey]);

  const handleDelete = (deck: Deck) => {
    deleteDeck(deck.id);
    onRefresh();
  };

  if (decks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-ink-400" />
        </div>
        <h3 className="font-display font-bold text-lg text-ink-900 mb-2">No decks yet</h3>
        <p className="text-ink-500">Upload an .apkg file above to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-ink-900">Your decks</h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {decks.map((deck) => {
          const due = dueCounts[deck.id] ?? 0;
          return (
            <div
              key={deck.id}
              className="group p-5 rounded-2xl bg-white border border-ink-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-ink-900 truncate">{deck.name}</h3>
                    <p className="text-sm text-ink-500 mt-0.5">{deck.cardCount} cards</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(deck)}
                  className="flex-shrink-0 p-2 rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {due > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-50 text-warning-700 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      {due} due
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-medium">
                      All caught up
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onStudy(deck)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Study
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
