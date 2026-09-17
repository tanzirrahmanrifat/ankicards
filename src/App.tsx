import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import StudyPage from '@/pages/StudyPage';
import AboutPage from '@/pages/AboutPage';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-ink-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
