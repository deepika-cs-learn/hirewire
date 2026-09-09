import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Settings,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  ChevronDown,
  UserCheck,
  Shield,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'explore' | 'my-interviews' | 'sessions';
  onTabChange: (tab: 'explore' | 'my-interviews' | 'sessions') => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenAuth,
  onOpenSettings,
  onOpenSearch,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Top Primary Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onTabChange('explore')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-500">
                Hire<span className="text-indigo-500 dark:text-indigo-400">Wire</span>
              </span>
            </div>
          </div>

          {/* Quick Search Bar (Desktop) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden md:flex items-center relative w-72 text-left bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 transition cursor-pointer group"
          >
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition shrink-0 mr-2.5" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex-1">
              Search tracks, algorithms, roles...
            </span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
              Ctrl K
            </span>
          </button>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search interviews"
            title="Search tracks & interviews (Ctrl+K)"
            className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Mode Switch) */}
          <button
            onClick={onToggleDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-500 transition" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 hover:text-blue-700 transition" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Application Settings"
            title="Application Settings"
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Account / Avatar Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition cursor-pointer"
              >
                <img
                  src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user.displayName || 'Candidate'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500"
                />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[130px] truncate hidden sm:inline">
                  {user.displayName || 'Candidate'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {user.email || 'Candidate Account'}
                    </p>
                    {user.targetRole && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 truncate max-w-full">
                        {user.targetRole}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onTabChange('sessions');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>My Evaluation Reports</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Interview & Audio Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>Switch Profile or Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Sub-nav: AI Interviewer Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              AI Interviewer
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-sm">
              BETA
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            <button
              onClick={() => onTabChange('explore')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'explore'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Explore
            </button>

            <button
              onClick={() => onTabChange('my-interviews')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'my-interviews'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              My Interviews
            </button>

            <button
              onClick={() => onTabChange('sessions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'sessions'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              My Sessions
            </button>
          </nav>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Powered by Gemini 3.8 Flash</span>
        </div>
      </div>
    </header>
  );
};
