import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Activity,
  Camera,
  Dumbbell,
  Apple,
  Settings,
  X,
  Sparkles,
  GitFork,
  Home,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS = [
  { id: 'landing', label: 'Welcome / Home', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'monitor', label: 'Health Overview', icon: Activity },
  { id: 'ai-guide', label: 'AI Health Guide', icon: Bot },
  { id: 'meal-scanner', label: 'Meal Scanner', icon: Camera },
  { id: 'intent-routing', label: 'Intent Routing', icon: GitFork },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'fitness-coach', label: 'Fitness Coach', icon: Sparkles },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-wellness-dark/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-cream-soft border-r border-wellness-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-wellness-border/60">
          <button
            onClick={() => {
              onSelectTab('landing');
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-olive flex items-center justify-center text-cream-soft shadow-sm group-hover:bg-olive-dark transition-colors">
              <span className="text-xl">🌿</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-base font-bold text-wellness-dark tracking-tight leading-none font-display">
                  WELLORA
                </h1>
                <span className="text-[11px] font-black text-olive font-mono tracking-wider">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-medium text-wellness-muted tracking-wider uppercase block mt-0.5">
                Everyday Wellness
              </span>
            </div>
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-wellness-muted hover:text-wellness-dark hover:bg-beige-cream lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-4 overflow-y-auto">
          <div className="px-3 mb-3 text-[11px] font-semibold text-wellness-muted/80 uppercase tracking-wider">
            Navigation
          </div>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-olive text-cream-soft shadow-sm shadow-olive/20'
                      : 'text-wellness-dark/80 hover:text-wellness-dark hover:bg-beige-cream/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-cream-soft' : 'text-wellness-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-wellness-border/60">
          <div className="p-3.5 rounded-2xl bg-beige-cream/70 border border-wellness-border/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-olive/15 flex items-center justify-center text-olive">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-3 w-20 bg-wellness-border/70 rounded-full mb-1.5" />
              <div className="h-2 w-14 bg-wellness-border/40 rounded-full" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
