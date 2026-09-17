import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileCheck2, Loader2, AlertCircle } from 'lucide-react';
import { parseApkg } from '@/lib/apkgParser';
import { saveDeck, saveCards } from '@/lib/storage';
import type { Deck } from '@/types';

interface UploaderProps {
  onUploaded: (decks: Deck[]) => void;
}

export default function Uploader({ onUploaded }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setError('Please upload a .apkg file.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsParsing(true);

    try {
      const { decks, cards } = await parseApkg(file);
      if (decks.length === 0 || cards.length === 0) {
        setError('No flashcards found in this file.');
        setIsParsing(false);
        return;
      }

      for (const deck of decks) {
        saveDeck(deck);
      }
      saveCards(cards);
      setIsParsing(false);
      onUploaded(decks);
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Could not parse this file. Make sure it is a valid .apkg file.');
      setIsParsing(false);
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isParsing && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-ink-300 bg-ink-50 hover:border-primary-400 hover:bg-primary-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".apkg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            <div>
              <p className="font-semibold text-ink-900">Parsing {fileName}...</p>
              <p className="text-sm text-ink-500 mt-1">Reading your flashcards</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-primary-600' : 'bg-white border border-ink-200'
            }`}>
              {fileName ? (
                <FileCheck2 className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-accent-600'}`} />
              ) : (
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-primary-600'}`} />
              )}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-ink-900">
                {isDragging ? 'Drop your file here' : 'Upload your .apkg file'}
              </p>
              <p className="text-sm text-ink-500 mt-1">
                Drag and drop or click to browse
              </p>
            </div>
            <p className="text-xs text-ink-400 mt-2">
              Your file is processed entirely in your browser. Nothing is uploaded to a server.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-error-50 border border-error-200 animate-slide-down">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error-900">Upload failed</p>
            <p className="text-sm text-error-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
