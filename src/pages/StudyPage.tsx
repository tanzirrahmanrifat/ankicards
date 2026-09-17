import { useState, useEffect } from 'react';
import { UploadCloud, BookOpen } from 'lucide-react';
import Uploader from '@/components/Uploader';
import DeckList from '@/components/DeckList';
import Reviewer from '@/components/Reviewer';
import type { Deck } from '@/types';

export default function StudyPage() {
  const [view, setView] = useState<'browse' | 'review'>('browse');
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploaded = (decks: Deck[]) => {
    setRefreshKey((k) => k + 1);
  };

  const handleStudy = (deck: Deck) => {
    setActiveDeck(deck);
    setView('review');
  };

  const handleExit = () => {
    setActiveDeck(null);
    setView('browse');
    setRefreshKey((k) => k + 1);
  };

  if (view === 'review' && activeDeck) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-ink-50">
        <Reviewer deck={activeDeck} onExit={handleExit} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Study session
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink-900">
            Upload & study your flashcards
          </h1>
          <p className="mt-3 text-ink-500 max-w-xl mx-auto">
            Upload the .apkg file you purchased, then pick a deck to start studying.
          </p>
        </div>

        {/* Upload section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="w-5 h-5 text-primary-600" />
            <h2 className="font-display font-bold text-lg text-ink-900">Upload</h2>
          </div>
          <Uploader onUploaded={handleUploaded} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-ink-200 flex-1" />
          <span className="text-sm text-ink-400 font-medium">or study an existing deck</span>
          <div className="h-px bg-ink-200 flex-1" />
        </div>

        {/* Deck list */}
        <DeckList onStudy={handleStudy} refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
      </div>
    </div>
  );
}
