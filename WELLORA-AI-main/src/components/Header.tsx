import React from 'react';
import { Search, Bell, User, Menu, Activity } from 'lucide-react';
import { UserHealthProfile } from '../types';

interface HeaderProps {
  title: string;
  onToggleMobileMenu: () => void;
  onGoHome?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  userProfile?: UserHealthProfile;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onToggleMobileMenu,
  onGoHome,
  onOpenAuth,
  userProfile,
}) => {
  const activeConstraints = [];
  if (userProfile) {
    if (userProfile.conditions.length > 0) activeConstraints.push(...userProfile.conditions);
    if (userProfile.allergies.length > 0) activeConstraints.push(...userProfile.allergies);
  }

  return (
    <header
      id="main-header"
      className="h-20 bg-cream-soft border-b border-wellness-border/70 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-wellness-dark tracking-tight">
              {title}
            </h2>
            {onGoHome && (
              <button
                onClick={onGoHome}
                title="Return to Welcome / Landing page"
                className="hidden sm:inline-flex text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-beige-cream text-wellness-muted hover:text-wellness-dark border border-wellness-border cursor-pointer transition-colors"
              >
                ← Welcome Page
              </button>
            )}
          </div>
          <div className="h-1 w-8 bg-olive rounded-full mt-0.5" />
        </div>
      </div>

      {/* Center: Active Profile Constraints */}
      {userProfile && activeConstraints.length > 0 && (
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-wellness-muted tracking-wider">
            Active Constraints:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeConstraints.map((constraint, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-semibold capitalize flex items-center gap-1 shadow-2xs">
                <Activity className="w-3 h-3" />
                {constraint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Right: Search, Notifications, Profile (No sample text / personal data) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search placeholder */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="w-4 h-4 text-wellness-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            disabled
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-dark placeholder:text-wellness-muted/70 focus:outline-none cursor-default"
          />
        </div>

        {/* Search icon button for mobile */}
        <button
          disabled
          aria-label="Search"
          className="md:hidden p-2.5 rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-muted cursor-default"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Icon with status placeholder dot */}
        <button
          disabled
          aria-label="Notifications"
          className="relative p-2.5 rounded-xl bg-beige-cream/60 border border-wellness-border text-wellness-muted cursor-default"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-olive border-2 border-cream-soft" />
        </button>

        {/* User / Profile Area */}
        <button
          onClick={() => onOpenAuth && onOpenAuth('login')}
          title="Account / Authentication"
          className="flex items-center gap-2.5 pl-2 border-l border-wellness-border/70 hover:opacity-90 transition-opacity cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-olive/15 border border-olive/30 flex items-center justify-center text-olive-dark shadow-xs hover:bg-olive hover:text-cream-soft transition-colors">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-wellness-dark font-display leading-none">
              Account
            </span>
            <span className="text-[10px] text-wellness-muted font-medium mt-0.5">
              Sign in / Join
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
