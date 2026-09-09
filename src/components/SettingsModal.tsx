import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Sliders,
  Volume2,
  Mic,
  Code2,
  Sparkles,
  User,
  Moon,
  Sun,
  Check,
  RotateCcw,
  Shield,
  Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export interface AppSettings {
  ttsEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  defaultVoiceMode: 'handsfree' | 'pushtotalk';
  defaultPersona: string;
  editorFontSize: number;
  editorTabSize: number;
  autoValidateSyntax: boolean;
  feedbackStrictness: 'balanced' | 'rigorous' | 'encouraging';
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ttsEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  defaultVoiceMode: 'handsfree',
  defaultPersona: 'Maya',
  editorFontSize: 13,
  editorTabSize: 2,
  autoValidateSyntax: true,
  feedbackStrictness: 'balanced',
};

const SETTINGS_STORAGE_KEY = 'hirewire_app_settings';

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_APP_SETTINGS;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { user, updateCandidateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'voice' | 'editor' | 'ai' | 'profile'>('voice');
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Senior Full-Stack Engineer');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setTargetRole(user.targetRole || 'Senior Full-Stack Engineer');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    if (user && (displayName !== user.displayName || targetRole !== user.targetRole)) {
      await updateCandidateProfile({ displayName, targetRole });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_APP_SETTINGS));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Application & Interview Settings
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Configure voice speech, editor preferences, and AI rubrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'voice'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Persona</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Candidate Profile</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: Voice & Audio */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Interviewer Text-to-Speech (TTS)</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Spoken voice playback through your speakers or headphones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, ttsEnabled: !s.ttsEnabled }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    settings.ttsEnabled ? 'bg-blue-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block"></span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Default Microphone Interaction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, defaultVoiceMode: 'handsfree' }))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      settings.defaultVoiceMode === 'handsfree'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> Hands-Free
                    </p>
                    <p className="text-[10px] text-zinc-400 font-normal mt-0.5">
                      Active continuous speech detection with auto-send on silence.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, defaultVoiceMode: 'pushtotalk' }))}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      settings.defaultVoiceMode === 'pushtotalk'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Push-To-Talk
                    </p>
                    <p className="text-[10px] text-zinc-400 font-normal mt-0.5">
                      Hold Spacebar or hold button while speaking (prevents background noise).
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Speech Playback Speed ({settings.speechRate}x)
                  </label>
                  <span className="text-[10px] text-zinc-400">Normal is 1.0x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.4"
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) => setSettings((s) => ({ ...s, speechRate: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Dark mode switcher within settings */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Interface Theme</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Currently in {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-bold text-xs transition cursor-pointer"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                  <span>Switch to {isDarkMode ? 'Light' : 'Dark'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Code Sandbox */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Editor Font Size ({settings.editorFontSize}px)
                </label>
                <div className="flex items-center gap-2">
                  {[12, 13, 14, 16].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, editorFontSize: size }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.editorFontSize === size
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tab Indentation Size
                </label>
                <div className="flex items-center gap-2">
                  {[2, 4].map((tabs) => (
                    <button
                      key={tabs}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, editorTabSize: tabs }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        settings.editorTabSize === tabs
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {tabs} spaces
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">Auto-Validate JavaScript Syntax</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Validates bracket closures, keyword placement, and syntax before execution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, autoValidateSyntax: !s.autoValidateSyntax }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    settings.autoValidateSyntax ? 'bg-blue-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block"></span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AI Persona */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Default Interviewer Persona
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Maya', role: 'Staff Principal Engineer', style: 'Engaging, thoughtful & empathetic' },
                    { name: 'Alex', role: 'Pragmatic Tech Lead', style: 'Direct, focused on system trade-offs' },
                    { name: 'Sarah', role: 'Engineering Manager', style: 'Focuses on team harmony & ownership' },
                    { name: 'David', role: 'Algorithms Specialist', style: 'Deep dive on Big-O & edge cases' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, defaultPersona: p.name }))}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        settings.defaultPersona === p.name
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                    >
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{p.role}</p>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{p.style}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Scorecard Evaluation Strictness
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'encouraging', label: 'Encouraging', desc: 'Positive & supportive' },
                    { id: 'balanced', label: 'Balanced', desc: 'Standard FAANG rubric' },
                    { id: 'rigorous', label: 'Rigorous', desc: 'High bar, strict edge-case grading' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSettings((st) => ({ ...st, feedbackStrictness: s.id as any }))}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        settings.feedbackStrictness === s.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <p className="font-bold text-xs">{s.label}</p>
                      <p className="text-[10px] text-zinc-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Candidate Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Candidate Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Interview Track / Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <img
                  src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.displayName || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user?.email || 'Guest Candidate'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
