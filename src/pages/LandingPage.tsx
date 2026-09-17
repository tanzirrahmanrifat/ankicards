import { Link } from 'react-router-dom';
import { Upload, Brain, BarChart3, FileCheck2, ArrowRight, Zap, ShieldCheck, Monitor } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 grid-pattern" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6 animate-slide-down">
              <Zap className="w-3.5 h-3.5" />
              No accounts needed — just upload and study
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-tight tracking-tight">
              Study your purchased{' '}
              <span className="text-primary-600">.apkg flashcards</span>{' '}
              right in your browser
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-2xl mx-auto">
              Upload the flashcard deck you bought, and start studying instantly.
              Spaced repetition, progress tracking, and zero setup — all running locally on your device.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/study"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 text-white font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/25 transition-all"
              >
                <Upload className="w-5 h-5" />
                Upload & Study
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-ink-700 font-semibold border border-ink-200 hover:border-ink-300 hover:bg-ink-50 transition-all"
              >
                How it works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Upload}
            title="Upload .apkg files"
            desc="Drop the flashcard deck you purchased and it loads instantly. No installation, no plugins — just open and study."
          />
          <FeatureCard
            icon={Brain}
            title="Spaced repetition"
            desc="Smart scheduling shows you cards at the perfect time for long-term retention, just like Anki's algorithm."
          />
          <FeatureCard
            icon={BarChart3}
            title="Track your progress"
            desc="Your study progress is saved on your device. Come back anytime and pick up exactly where you left off."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-ink-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="font-display font-bold text-3xl text-ink-900 text-center mb-12">
            Three steps to start studying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              num="1"
              icon={FileCheck2}
              title="Get your deck"
              desc="Purchase flashcard decks from our WooCommerce store. You'll receive a .apkg file to download."
            />
            <StepCard
              num="2"
              icon={Upload}
              title="Upload it here"
              desc="Go to the Study page and upload your .apkg file. It's parsed entirely in your browser — nothing is sent to a server."
            />
            <StepCard
              num="3"
              icon={Brain}
              title="Study and retain"
              desc="Review cards with spaced repetition. Rate each card and the system schedules the next review automatically."
            />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <TrustBadge
            icon={ShieldCheck}
            title="Private by design"
            desc="Your flashcards and study progress never leave your browser. Everything runs locally."
          />
          <TrustBadge
            icon={Monitor}
            title="Works anywhere"
            desc="Use it on any device with a modern browser — desktop, tablet, or phone."
          />
          <TrustBadge
            icon={Zap}
            title="Instant setup"
            desc="No accounts, no downloads, no configuration. Upload and start studying in seconds."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-ink-800 px-8 py-16 text-center">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Ready to start studying?
            </h2>
            <p className="text-ink-300 mb-8 max-w-xl mx-auto">
              Upload your .apkg file and begin your first session in under a minute.
            </p>
            <Link
              to="/study"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-ink-900 font-semibold hover:bg-ink-100 transition-all"
            >
              <Upload className="w-5 h-5" />
              Go to Study
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: typeof Upload; title: string; desc: string }) {
  return (
    <div className="group p-8 rounded-2xl bg-white border border-ink-200 hover:border-primary-200 hover:shadow-lg transition-all">
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, icon: Icon, title, desc }: { num: string; icon: typeof Upload; title: string; desc: string }) {
  return (
    <div className="relative p-8 rounded-2xl bg-ink-50 border border-ink-100">
      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-primary-600 text-white font-display font-bold text-lg flex items-center justify-center shadow-lg">
        {num}
      </div>
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-5 border border-ink-200">
        <Icon className="w-6 h-6 text-ink-700" />
      </div>
      <h3 className="font-display font-bold text-lg text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-600 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function TrustBadge({ icon: Icon, title, desc }: { icon: typeof Upload; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-accent-600" />
      </div>
      <h3 className="font-semibold text-ink-900 mb-2">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}
