import React from 'react';
import { Home, Radio, Trophy, Receipt, User } from 'lucide-react';
import { useBetting } from '../context/BettingContext';

/**
 * High-Density Sportsbook Mobile Bottom Bar (SportyBet / 1xBet mobile style)
 * Clean, tactile, fixed bottom bar with zero floaty bubbles.
 */
const tabs = [
  { key: 'home', label: 'Sports', icon: Home },
  { key: 'live', label: 'Live', icon: Radio },
  { key: 'matches', label: 'Leagues', icon: Trophy },
  { key: 'mybets', label: 'My Bets', icon: Receipt },
  { key: 'account', label: 'Account', icon: User },
];

export default function BottomNav() {
  const { currentView, setCurrentView, activeBets, openAccount } = useBetting();

  const handleTabPress = (key) => {
    if (key === 'account') {
      openAccount('profile');
      return;
    }
    setCurrentView(key);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#121824] border-t border-[#1F2B3E]">
      <nav className="max-w-md mx-auto px-2 py-1" aria-label="Main navigation">
        <ul className="flex items-center justify-around" role="tablist">
          {tabs.map(({ key, label, icon: Icon }) => {
            const isActive = currentView === key;
            const hasBadge = key === 'mybets' && activeBets.length > 0;

            return (
              <li key={key} className="flex-1 text-center" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabPress(key)}
                  className={[
                    'w-full flex flex-col items-center justify-center py-1 transition-colors select-none relative',
                    isActive
                      ? 'text-[#00E676] font-bold'
                      : 'text-slate-400 hover:text-white',
                  ].join(' ')}
                >
                  <span className="relative">
                    <Icon className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
                    {hasBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-mono font-black px-0.5">
                        {activeBets.length > 99 ? '99+' : activeBets.length}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] tracking-tight leading-tight mt-0.5 uppercase font-bold">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
