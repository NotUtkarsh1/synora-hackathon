import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccessfulAuth?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccessfulAuth,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Smooth simulated authentication feedback
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSuccessfulAuth) {
          onSuccessfulAuth();
        }
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-wellness-dark/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-cream-soft border border-wellness-border shadow-2xl p-6 sm:p-8 text-wellness-dark overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-olive/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-sage-light/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream/80 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive/10 border border-olive/20 text-olive text-xs font-semibold mb-3">
            <span className="font-display font-bold tracking-tight">WELLORA</span>
            <span className="font-mono text-[10px] text-olive-dark font-black">AI</span>
          </div>
          <h3 className="text-2xl font-bold font-display tracking-tight text-wellness-dark">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-wellness-muted mt-1 max-w-xs mx-auto">
            {mode === 'login'
              ? 'Sign in to access your intelligent health guide and personalized telemetry'
              : 'Join Wellora AI for continuous holistic wellness intelligence'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-2xl bg-beige-cream/80 border border-wellness-border/70 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-cream-soft text-wellness-dark shadow-xs'
                : 'text-wellness-muted hover:text-wellness-dark'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-cream-soft text-wellness-dark shadow-xs'
                : 'text-wellness-muted hover:text-wellness-dark'
            }`}
          >
            Register
          </button>
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-wellness-dark font-display">
              {mode === 'login' ? 'Authenticated Successfully' : 'Account Created!'}
            </h4>
            <p className="text-xs text-wellness-muted">Redirecting to your wellness dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-wellness-muted mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-wellness-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-dark placeholder:text-wellness-muted/60 focus:outline-none focus:border-olive transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-wellness-muted mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-wellness-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@wellness.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-dark placeholder:text-wellness-muted/60 focus:outline-none focus:border-olive transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-wellness-muted uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-[11px] text-olive hover:underline font-medium cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-wellness-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-dark placeholder:text-wellness-muted/60 focus:outline-none focus:border-olive transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-olive hover:bg-olive-dark text-cream-soft font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : mode === 'login' ? 'Sign In to Wellora' : 'Start Journey'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-wellness-border/60 text-center flex items-center justify-center gap-1.5 text-[11px] text-wellness-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-olive" />
          <span>Encrypted HIPAA-ready physiological data privacy</span>
        </div>
      </div>
    </div>
  );
};
