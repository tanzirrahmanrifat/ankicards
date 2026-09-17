import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-ink-900">FlashStudy</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-ink-500">
            <Link to="/" className="hover:text-ink-900 transition-colors">Home</Link>
            <Link to="/study" className="hover:text-ink-900 transition-colors">Study</Link>
            <Link to="/about" className="hover:text-ink-900 transition-colors">About</Link>
          </div>

          <p className="text-sm text-ink-400">
            Study your purchased flashcards online.
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-ink-100 text-center text-xs text-ink-400">
          FlashStudy is an independent study tool and is not affiliated with or endorsed by Anki.
        </div>
      </div>
    </footer>
  );
}
