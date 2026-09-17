import { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw, ArrowLeft, Check, X, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { getCardsForDeck, getProgress, saveProgress, resetDeckProgress } from '@/lib/storage';
import { rate, createInitialProgress, isDue, isNew } from '@/lib/srs';
import type { Deck, StudyProgress, Rating, StudyStats } from '@/types';

interface ReviewerProps {
  deck: Deck;
  onExit: () => void;
}

export default function Reviewer({ deck, onExit }: ReviewerProps) {
  const cards = useMemo(() => getCardsForDeck(deck.id), [deck.id]);
  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [queue, setQueue] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<StudyStats>({ reviewed: 0, correct: 0, again: 0, startTime: Date.now() });
  const [finished, setFinished] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const existingProgress = getProgress(deck.id);
    setProgressMap(existingProgress);

    // Build queue: due cards and new cards
    const dueCardIds: number[] = [];
    const newCardIds: number[] = [];
    for (const card of cards) {
      const p = existingProgress[String(card.id)];
      if (!p || isNew(p)) {
        newCardIds.push(card.id);
      } else if (isDue(p)) {
        dueCardIds.push(card.id);
      }
    }

    // Interleave new and due cards
    const interleaved: number[] = [];
    const maxLen = Math.max(dueCardIds.length, newCardIds.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < dueCardIds.length) interleaved.push(dueCardIds[i]);
      if (i < newCardIds.length) interleaved.push(newCardIds[i]);
    }

    setQueue(interleaved);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ reviewed: 0, correct: 0, again: 0, startTime: Date.now() });
    setFinished(interleaved.length === 0);
  }, [deck.id, cards]);

  const currentCard = queue[currentIndex] != null
    ? cards.find((c) => c.id === queue[currentIndex])
    : undefined;

  const handleRate = useCallback((rating: Rating) => {
    if (!currentCard) return;
    const cardKey = String(currentCard.id);
    const currentProgress = progressMap[cardKey] ?? { ...createInitialProgress(), cardId: cardKey };
    const newProgress = rate(currentProgress, rating);
    saveProgress(deck.id, cardKey, newProgress);

    setProgressMap((prev) => ({ ...prev, [cardKey]: newProgress }));
    setStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: rating === 'good' || rating === 'easy' ? prev.correct + 1 : prev.correct,
      again: rating === 'again' ? prev.again + 1 : prev.again,
    }));

    // If "again", re-queue the card later in the session
    if (rating === 'again') {
      setQueue((prev) => {
        const newQueue = [...prev];
        // Insert ~5 cards later or at the end
        const reinsertPos = Math.min(currentIndex + 5, newQueue.length);
        newQueue.splice(reinsertPos, 0, currentCard.id);
        return newQueue;
      });
    }

    setIsFlipped(false);

    // Advance
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= queue.length) {
          setFinished(true);
          return prev;
        }
        return next;
      });
    }, 200);
  }, [currentCard, progressMap, deck.id, queue.length]);

  const handleReset = () => {
    resetDeckProgress(deck.id);
    setShowResetConfirm(false);
    onExit();
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (finished) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setIsFlipped((prev) => !prev);
    } else if (isFlipped) {
      if (e.key === '1') handleRate('again');
      else if (e.key === '2') handleRate('hard');
      else if (e.key === '3') handleRate('good');
      else if (e.key === '4') handleRate('easy');
    }
  }, [finished, isFlipped, handleRate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Completion screen
  if (finished) {
    const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-accent-50 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-accent-600" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-ink-900 mb-2">Session complete!</h2>
          <p className="text-ink-500 mb-8">Great work. Here's how you did:</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatBox label="Reviewed" value={stats.reviewed} />
            <StatBox label="Accuracy" value={`${accuracy}%`} />
            <StatBox label="To Review" value={stats.again} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onExit}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-ink-500">No cards to review right now.</p>
        <button
          onClick={onExit}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to decks
        </button>
      </div>
    );
  }

  const cardProgress = progressMap[String(currentCard.id)];
  const cardIsNew = !cardProgress || isNew(cardProgress);
  const progressPercent = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>
        <div className="text-sm text-ink-500">
          Card <span className="font-semibold text-ink-900">{currentIndex + 1}</span> of {queue.length}
        </div>
        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-error-600 text-white font-medium hover:bg-error-700 transition-colors"
            >
              Confirm reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-ink-100 text-ink-600 font-medium hover:bg-ink-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-error-600 transition-colors"
            title="Reset all progress for this deck"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-ink-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Card type badge */}
      {cardIsNew && (
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            New card
          </span>
        </div>
      )}

      {/* Flashcard */}
      <div
        className="relative min-h-[300px] sm:min-h-[360px] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="card-3d relative w-full h-full min-h-[300px] sm:min-h-[360px]"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="card-face absolute inset-0 rounded-2xl bg-white border border-ink-200 shadow-sm p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <p className="text-xs uppercase tracking-wider text-ink-400 font-semibold mb-4">Question</p>
            <div
              className="text-lg sm:text-xl text-ink-900 text-center whitespace-pre-wrap leading-relaxed max-w-xl"
              dangerouslySetInnerHTML={{ __html: formatCardText(currentCard.front) }}
            />
            <p className="absolute bottom-4 text-xs text-ink-400">
              Click or press Space to flip
            </p>
          </div>

          {/* Back */}
          <div
            className="card-face card-back absolute inset-0 rounded-2xl bg-ink-900 border border-ink-800 shadow-lg p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-4">Answer</p>
            <div
              className="text-lg sm:text-xl text-white text-center whitespace-pre-wrap leading-relaxed max-w-xl"
              dangerouslySetInnerHTML={{ __html: formatCardText(currentCard.back) }}
            />
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="mt-6 animate-slide-up">
          <p className="text-center text-sm text-ink-500 mb-3">How well did you know it?</p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <RatingButton
              rating="again"
              label="Again"
              hint="<1m"
              icon={X}
              color="error"
              onClick={() => handleRate('again')}
            />
            <RatingButton
              rating="hard"
              label="Hard"
              hint="1d"
              icon={AlertTriangle}
              color="warning"
              onClick={() => handleRate('hard')}
            />
            <RatingButton
              rating="good"
              label="Good"
              hint="3d"
              icon={Check}
              color="accent"
              onClick={() => handleRate('good')}
            />
            <RatingButton
              rating="easy"
              label="Easy"
              hint="4d+"
              icon={TrendingUp}
              color="primary"
              onClick={() => handleRate('easy')}
            />
          </div>
          <div className="hidden sm:flex justify-center gap-6 mt-4 text-xs text-ink-400">
            <span><kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">1</kbd> Again</span>
            <span><kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">2</kbd> Hard</span>
            <span><kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">3</kbd> Good</span>
            <span><kbd className="px-1.5 py-0.5 bg-ink-100 rounded font-mono">4</kbd> Easy</span>
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsFlipped(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink-100 text-ink-700 font-medium hover:bg-ink-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Show answer
          </button>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 rounded-2xl bg-ink-50 border border-ink-100">
      <p className="font-display font-extrabold text-3xl text-ink-900">{value}</p>
      <p className="text-sm text-ink-500 mt-1">{label}</p>
    </div>
  );
}

interface RatingButtonProps {
  rating: Rating;
  label: string;
  hint: string;
  icon: typeof Check;
  color: 'error' | 'warning' | 'accent' | 'primary';
  onClick: () => void;
}

function RatingButton({ label, hint, icon: Icon, color, onClick }: RatingButtonProps) {
  const colors = {
    error: 'bg-error-50 text-error-700 border-error-200 hover:bg-error-100 hover:border-error-300',
    warning: 'bg-warning-50 text-warning-700 border-warning-200 hover:bg-warning-100 hover:border-warning-300',
    accent: 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100 hover:border-accent-300',
    primary: 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:border-primary-300',
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl border font-medium transition-all ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
      <span className="text-xs opacity-60">{hint}</span>
    </button>
  );
}

function formatCardText(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return escaped;
}
