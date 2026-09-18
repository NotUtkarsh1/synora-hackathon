import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Heart,
  Bot,
  Apple,
  Sparkles,
  ShieldCheck,
  Activity,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore: () => void;
  onNavigateAiGuide: () => void;
  onNavigateNutrition: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExplore,
  onNavigateAiGuide,
  onNavigateNutrition,
  onLogin,
  onRegister,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToAbout = () => {
    const el = document.getElementById('wellora-about-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col bg-gradient-to-b from-[#F5F1E8] via-[#EDE9DE] to-[#E3EADE] text-wellness-dark overflow-x-hidden selection:bg-olive/20 selection:text-wellness-dark">
      {/* Dynamic Ambient Floating Shapes (Subtle, slow organic movements) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft pastel green organic blur */}
        <div className="absolute -top-32 -left-28 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full bg-[#8FA789]/20 blur-3xl animate-float-slow-1" />

        {/* Warm cream/tan subtle glow */}
        <div className="absolute top-1/4 right-0 w-80 h-80 sm:w-[550px] sm:h-[550px] rounded-full bg-[#E8DCC4]/35 blur-3xl animate-float-slow-2" />

        {/* Very subtle pastel blue calm note */}
        <div className="absolute bottom-10 left-1/4 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full bg-[#CCDDEC]/25 blur-3xl animate-float-slow-3" />

        {/* Subtle organic wavy contours in background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100,320 C320,480 500,120 900,280 C1200,400 1380,220 1600,350"
            stroke="#5F745B"
            strokeWidth="1.2"
            strokeDasharray="4 8"
          />
          <path
            d="M-50,650 C240,550 620,720 1000,580 C1300,480 1480,680 1650,600"
            stroke="#7B9177"
            strokeWidth="1"
            strokeDasharray="6 10"
          />
        </svg>
      </div>

      {/* Minimal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-cream-soft/75 border-b border-wellness-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group text-left cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
          >
            <div className="w-10 h-10 rounded-2xl bg-olive/15 border border-olive/30 flex items-center justify-center text-olive transition-colors group-hover:bg-olive group-hover:text-cream-soft shadow-xs">
              <span className="text-xl">🌿</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-display tracking-tight text-wellness-dark">
                WELLORA
              </span>
              <span className="text-xs sm:text-sm font-black font-mono tracking-widest text-olive bg-olive/10 px-2 py-0.5 rounded-md border border-olive/20">
                AI
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-wellness-muted">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-wellness-dark font-semibold transition-colors hover:text-olive cursor-pointer relative py-1"
            >
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-olive rounded-full" />
            </button>
            <button
              onClick={onNavigateAiGuide}
              className="transition-colors hover:text-wellness-dark cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-olive" />
              <span>AI Guide</span>
            </button>
            <button
              onClick={onNavigateNutrition}
              className="transition-colors hover:text-wellness-dark cursor-pointer flex items-center gap-1.5"
            >
              <Apple className="w-4 h-4 text-olive" />
              <span>Nutrition</span>
            </button>
            <button
              onClick={scrollToAbout}
              className="transition-colors hover:text-wellness-dark cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-semibold text-wellness-dark hover:text-olive transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={onRegister}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-olive hover:bg-olive-dark text-cream-soft shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98"
            >
              Register
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream/70 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-cream-soft/95 backdrop-blur-md border-b border-wellness-border shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-3 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-wellness-dark hover:bg-beige-cream/60"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateAiGuide();
                }}
                className="text-left px-3 py-2 rounded-xl text-sm font-medium text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream/60 flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-olive" />
                <span>AI Guide</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateNutrition();
                }}
                className="text-left px-3 py-2 rounded-xl text-sm font-medium text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream/60 flex items-center gap-2"
              >
                <Apple className="w-4 h-4 text-olive" />
                <span>Nutrition</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToAbout();
                }}
                className="text-left px-3 py-2 rounded-xl text-sm font-medium text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream/60"
              >
                About
              </button>
              <div className="pt-3 border-t border-wellness-border/70 flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-wellness-border font-semibold text-xs text-wellness-dark text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegister();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-olive text-cream-soft font-semibold text-xs text-center shadow-xs"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Full-Screen Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center max-w-5xl mx-auto my-auto w-full">
        {/* Subtle Wellness Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream-soft/80 border border-wellness-border/80 shadow-xs mb-8 transition-all duration-700 hover:border-olive/40 animate-fade-in-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-wellness-dark font-mono">
            Intelligent Health & Biomarker Intelligence
          </span>
        </div>

        {/* Hero Headline: Large, Elegant WELLORA AI Typography */}
        <div className="space-y-4 mb-6 animate-fade-in-1">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 sm:gap-x-5 gap-y-1 select-none">
            {/* WELLORA: Grand, prominent, modern rounded display sans-serif */}
            <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-display tracking-tight text-wellness-dark drop-shadow-xs">
              WELLORA
            </span>
            {/* AI: Harmonious, integrated, slightly smaller with distinctive tech-health badge cadence */}
            <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-mono tracking-wider text-olive relative -top-1 sm:-top-2.5">
              AI
            </span>
          </h1>

          {/* Tagline: Appears shortly after, calm & trustworthy */}
          <p className="text-lg sm:text-2xl md:text-3xl font-light text-wellness-dark/85 max-w-2xl mx-auto tracking-normal leading-relaxed font-sans animate-fade-in-2">
            Your intelligent companion for everyday wellness.
          </p>
        </div>

        {/* Minimal Call-To-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 w-full sm:w-auto animate-fade-in-3">
          {/* Primary CTA: Get Started */}
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-olive hover:bg-olive-dark text-cream-soft font-semibold text-base sm:text-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* Secondary CTA: Explore Wellora AI */}
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-cream-soft/80 hover:bg-cream-soft border border-wellness-border hover:border-olive/50 text-wellness-dark font-semibold text-base sm:text-lg shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Compass className="w-5 h-5 text-olive" />
            <span>Explore Wellora AI</span>
          </button>
        </div>

        {/* Three Micro-Pillars for Health-Tech Credibility */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-14 sm:mt-18 w-full max-w-3xl text-left animate-fade-in-3">
          <div className="p-4 rounded-2xl bg-cream-soft/70 border border-wellness-border/70 backdrop-blur-xs flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-wellness-dark">Real-Time Vitals</div>
              <div className="text-[11px] text-wellness-muted">Synchronized ECG rhythm</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream-soft/70 border border-wellness-border/70 backdrop-blur-xs flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-wellness-dark">Contextual AI Guide</div>
              <div className="text-[11px] text-wellness-muted">Holistic lifestyle insights</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cream-soft/70 border border-wellness-border/70 backdrop-blur-xs flex items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-wellness-dark">Clinical Safety Guard</div>
              <div className="text-[11px] text-wellness-muted">Biomarker anomaly triage</div>
            </div>
          </div>
        </div>

        {/* Subtle Scroll Down Prompt */}
        <div className="mt-12 sm:mt-16 text-wellness-muted/80 flex flex-col items-center gap-1.5 text-xs font-medium">
          <span>Scroll to explore dashboard & telemetry</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-olive" />
        </div>
      </main>

      {/* About Wellora AI Section */}
      <section
        id="wellora-about-section"
        className="relative z-10 w-full py-16 px-4 sm:px-6 lg:px-8 bg-cream-soft/85 border-t border-wellness-border/60"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive/10 text-olive text-xs font-bold uppercase tracking-wider font-mono">
            About Wellora AI
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display tracking-tight text-wellness-dark">
            Modern, calm intelligence crafted for your wellbeing.
          </h2>
          <p className="text-sm sm:text-base text-wellness-muted leading-relaxed max-w-2xl mx-auto">
            Wellora AI integrates physiological telemetry, conversational AI guidance, meal vision recognition,
            and nutritional science into a continuous, calm, and trustworthy health companion.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={onExplore}
              className="px-6 py-3 rounded-xl bg-olive text-cream-soft font-semibold text-sm hover:bg-olive-dark transition-all cursor-pointer shadow-xs"
            >
              Enter Wellness Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Landing Footer */}
      <footer className="relative z-10 py-6 px-4 sm:px-8 border-t border-wellness-border/50 bg-[#EDE9DE]/90 text-xs text-wellness-muted flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-wellness-dark">WELLORA AI</span>
          <span>© 2026 Holistic Health & Wellness Systems.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>HIPAA-Compliant Architecture</span>
          <span>•</span>
          <span>Adaptive Physiological Telemetry</span>
        </div>
      </footer>
    </div>
  );
};
