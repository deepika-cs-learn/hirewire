import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { ExploreDashboard } from './components/ExploreDashboard';
import { PreflightModal } from './components/PreflightModal';
import { InterviewWorkspace } from './components/InterviewWorkspace';
import { SessionsDashboard } from './components/SessionsDashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { Track, InterviewItem, InterviewSession } from './types';
import { saveInterviewSessionToDb, getUserSessionsFromDb } from './firebase';
import { TRACKS_DATA } from './data/tracksData';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'my-interviews' | 'sessions'>('explore');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Persistent Dark/Light mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('hirewire_theme');
    return saved ? saved === 'dark' : true;
  });

  // Global Ctrl+K / Cmd+K listener for instant search access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preflight setup state
  const [preflightData, setPreflightData] = useState<{
    isOpen: boolean;
    track: Track | null;
    item: InterviewItem | null;
  }>({
    isOpen: false,
    track: null,
    item: null,
  });

  // Active Live Interview state
  const [activeInterview, setActiveInterview] = useState<{
    isActive: boolean;
    track: Track | null;
    item: InterviewItem | null;
    persona: string;
    inputMode: 'voice' | 'chat';
    resumeText?: string;
  }>({
    isActive: false,
    track: null,
    item: null,
    persona: 'Maya',
    inputMode: 'voice',
  });

  // Sessions from Firestore
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load sessions from Firestore
  const loadUserSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const docs = await getUserSessionsFromDb(user.uid);
      if (docs.length > 0) {
        setSessions(docs);
        if (!selectedSession) {
          setSelectedSession(docs[0]);
        }
      } else {
        // Seed an initial demo session to showcase analytics if none exist (matching Screenshot 1)
        const initialSampleSession: InterviewSession = {
          id: 'sample_sess_01',
          userId: user.uid,
          userEmail: user.email || 'candidate@hirewire.ai',
          trackId: 'communication',
          interviewId: 'comm-spoken-fluency',
          title: 'Spoken English fluency (Communication practice)',
          category: 'Non-technical',
          persona: 'Maya',
          inputMode: 'voice',
          difficulty: 'Easy',
          durationMinutes: 15,
          timeSpentSeconds: 180,
          code: '// Voice fluency session',
          transcript: `Maya: Hi, I'm Maya, and I'll be your interviewer today. Could you tell me a little about yourself?\n\nCandidate: Hello Maya, I am an engineer interested in full-stack web applications and scalable APIs.`,
          evaluation: {
            overallScore: 49,
            readiness: 'Developing',
            summary: 'Good conversational willingness. Enhance vocabulary diversity and give more specific examples.',
            whatWentWell: [
              'Spoke clearly with good baseline articulation.',
              'Answered promptly without hesitation.',
            ],
            focusAreas: [
              'Incorporate technical terminology and concrete examples.',
              'Expand sentence structures for richer responses.',
            ],
            skillBreakdown: [
              { skill: 'Pacing & Tone', score: 65, status: 'Developing' },
              { skill: 'Articulation', score: 55, status: 'Developing' },
              { skill: 'Vocabulary & Depth', score: 40, status: 'Needs work' },
            ],
            strongestMoment: {
              quote: 'I focus on building reliable systems for end users.',
              context: 'Opening greeting',
              feedback: 'Authentic user-centric mindset.',
            },
            metrics: {
              technicalSubstantive: '1 of 3 questions',
              concreteNumbers: '0 of 3 responses',
              clearStructure: '1 of 3 responses',
              shortResponses: '2 responses',
            },
            answerScores: [
              { questionIndex: 1, questionSummary: 'Self introduction', score: 52, comment: 'Clear, concise.' }
            ],
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        };
        setSessions([initialSampleSession]);
        setSelectedSession(initialSampleSession);
      }
    } catch (err) {
      console.warn('Could not load sessions from Firestore:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadUserSessions();
  }, [user]);

  // Handle starting Preflight setup
  const handleStartSetup = (track: Track, item: InterviewItem) => {
    setPreflightData({
      isOpen: true,
      track,
      item,
    });
  };

  // Launch live interview workspace
  const handleLaunchInterview = (config: {
    persona: string;
    inputMode: 'voice' | 'chat';
    resumeText?: string;
  }) => {
    if (!preflightData.track || !preflightData.item) return;

    setActiveInterview({
      isActive: true,
      track: preflightData.track,
      item: preflightData.item,
      persona: config.persona,
      inputMode: config.inputMode,
      resumeText: config.resumeText,
    });

    setPreflightData({ isOpen: false, track: null, item: null });
  };

  // On End Interview -> Save to Firestore & Open Sessions Dashboard
  const handleEndInterview = async (sessionData: InterviewSession) => {
    const sessionId = `sess_${Date.now()}`;
    const completeSession = { ...sessionData, id: sessionId };

    // Update in-memory state instantly
    setSessions((prev) => [completeSession, ...prev.filter((s) => s.id !== sessionId)]);
    setSelectedSession(completeSession);
    setActiveInterview({
      isActive: false,
      track: null,
      item: null,
      persona: 'Maya',
      inputMode: 'voice',
    });
    setActiveTab('sessions');

    // Persist to Firebase Firestore
    try {
      await saveInterviewSessionToDb(sessionId, completeSession);
    } catch (err) {
      console.warn('Firestore background save note:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top App Header */}
      {!activeInterview.isActive && (
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      )}

      {/* VIEW 1: LIVE INTERVIEW WORKSPACE (Full-Screen) */}
      {activeInterview.isActive && activeInterview.track && activeInterview.item ? (
        <InterviewWorkspace
          track={activeInterview.track}
          interviewItem={activeInterview.item}
          persona={activeInterview.persona}
          initialInputMode={activeInterview.inputMode}
          resumeText={activeInterview.resumeText}
          onEndInterview={handleEndInterview}
          onCancel={() =>
            setActiveInterview({
              isActive: false,
              track: null,
              item: null,
              persona: 'Maya',
              inputMode: 'voice',
            })
          }
        />
      ) : (
        /* MAIN DASHBOARD VIEWS */
        <main>
          {activeTab === 'explore' && (
            <ExploreDashboard
              onStartSetup={handleStartSetup}
              onViewSession={(sess) => {
                setSelectedSession(sess);
                setActiveTab('sessions');
              }}
              recentSessions={sessions}
            />
          )}

          {activeTab === 'my-interviews' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h1 className="text-xl font-bold">My Practice Queue</h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Jump directly back into your recommended practice sessions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TRACKS_DATA.slice(0, 3).map((track) => (
                  <div
                    key={track.id}
                    className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition cursor-pointer"
                    onClick={() => handleStartSetup(track, track.items[0])}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {track.title}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                        Ready
                      </span>
                    </div>
                    <h3 className="text-base font-bold mt-2 text-zinc-900 dark:text-zinc-100">
                      {track.items[0]?.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {track.items[0]?.description}
                    </p>
                    <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition">
                      Start Practice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <SessionsDashboard
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              onBackToExplore={() => setActiveTab('explore')}
              onRefresh={loadUserSessions}
              loading={loadingSessions}
            />
          )}
        </main>
      )}

      {/* Preflight Modal */}
      {preflightData.isOpen && preflightData.track && preflightData.item && (
        <PreflightModal
          isOpen={preflightData.isOpen}
          onClose={() => setPreflightData({ isOpen: false, track: null, item: null })}
          track={preflightData.track}
          interviewItem={preflightData.item}
          onStartInterview={handleLaunchInterview}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectInterview={(track, item) => {
          handleStartSetup(track, item);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
