import React, { useState } from 'react';
import { Track, InterviewItem, TrackCategory, DifficultyLevel, InterviewSession } from '../types';
import { TRACKS_DATA } from '../data/tracksData';
import { TrackIcon } from './TrackIcon';
import {
  Code,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Mic,
  SlidersHorizontal,
  CheckCircle2,
  ChevronRight,
  Award,
  Search,
  X,
} from 'lucide-react';

interface ExploreDashboardProps {
  onStartSetup: (track: Track, item: InterviewItem) => void;
  onViewSession: (session: InterviewSession) => void;
  recentSessions: InterviewSession[];
}

export const ExploreDashboard: React.FC<ExploreDashboardProps> = ({
  onStartSetup,
  onViewSession,
  recentSessions,
}) => {
  const [activeCategory, setActiveCategory] = useState<TrackCategory>('technical');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewItem | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTracks = TRACKS_DATA.filter((t) => {
    if (t.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.items.some((i) => i.title.toLowerCase().includes(q) || i.skillsCovered.some((s) => s.toLowerCase().includes(q)))
    );
  });

  // Latest session display (matching Screenshot 1)
  const latestSession = recentSessions.length > 0 ? recentSessions[0] : null;

  // If user selected an interview card, show the dedicated Overview screen (Screenshot 3)
  if (selectedTrack && selectedInterview) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
        <button
          onClick={() => setSelectedInterview(null)}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {selectedTrack.title}</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <TrackIcon type={selectedTrack.iconType} className="w-12 h-12 rounded-xl text-lg shadow-md" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedInterview.title}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedInterview.difficulty === 'Easy'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : selectedInterview.difficulty === 'Medium'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {selectedInterview.difficulty}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                  {selectedInterview.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartSetup(selectedTrack, selectedInterview)}
              className="shrink-0 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Interview</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>ESTIMATED DURATION</span>
              </div>
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {selectedInterview.durationMin} minutes
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                <Mic className="w-4 h-4 text-emerald-500" />
                <span>INTERVIEW FORMAT</span>
              </div>
              <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {selectedInterview.type}
              </p>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                <span>SKILLS COVERED</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedInterview.skillsCovered.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl">
            <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">
              What to expect
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {selectedInterview.instructions} You can speak aloud using your microphone or type in the live chat. For live coding questions, the Monaco code editor will open right after the introduction questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user selected a Track, show the track's list of interviews (Screenshot 2)
  if (selectedTrack) {
    const items =
      difficultyFilter === 'All'
        ? selectedTrack.items
        : selectedTrack.items.filter((i) => i.difficulty === difficultyFilter);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
        <button
          onClick={() => {
            setSelectedTrack(null);
            setDifficultyFilter('All');
          }}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Tracks</span>
        </button>

        {/* Track Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3.5">
            <TrackIcon type={selectedTrack.iconType} className="w-10 h-10 rounded-xl text-base shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedTrack.title}
                </h1>
                <span className="text-xs text-zinc-400 font-medium">
                  ({selectedTrack.items.length} interviews)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {selectedTrack.subtitle}
              </p>
            </div>
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  difficultyFilter === diff
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Interviews List */}
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedInterview(item)}
              className="group p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {item.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    item.difficulty === 'Easy'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : item.difficulty === 'Medium'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {item.difficulty}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.durationMin} min
                  </span>
                  <span className="text-xs text-zinc-400">
                    · {item.type}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.skillsCovered.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartSetup(selectedTrack, item);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
                >
                  Practice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: EXPLORE OVERVIEW (Screenshot 1)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Banner / Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-950 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Voice AI Mock Interviews</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Practice interviews. Build confidence by doing.
            </h1>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Choose a role, interview by voice or text, and get focused feedback while the experience is still fresh.
            </p>
          </div>

          {/* Right quick card: Latest session or Prompt */}
          {latestSession ? (
            <div
              onClick={() => onViewSession(latestSession)}
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/15 cursor-pointer transition max-w-sm shrink-0"
            >
              <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider flex items-center justify-between">
                <span>Latest session</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  Score {latestSession.evaluation?.overallScore || 70}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 truncate">
                {latestSession.title}
              </h4>
              <p className="text-xs text-blue-100/70 mt-0.5">
                {Math.round(latestSession.timeSpentSeconds / 60) || 3} min · {latestSession.category}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-300">
                <span>View Summary</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 max-w-sm shrink-0">
              <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
                Personalized Feedback
              </span>
              <p className="text-xs text-blue-100 mt-1">
                Complete your first interview to generate an interactive scorecard, skill breakdown, and AI hiring manager review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tracks Heading & Category Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Choose a practice track
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Select a domain to browse specialized questions and mock interview formats.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Quick Filter Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tracks & skills..."
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle pill */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit shrink-0">
            <button
              onClick={() => setActiveCategory('technical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeCategory === 'technical'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Technical</span>
            </button>

            <button
              onClick={() => setActiveCategory('non-technical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeCategory === 'non-technical'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>Non-technical</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Track Cards (Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTracks.map((track) => (
          <div
            key={track.id}
            onClick={() => setSelectedTrack(track)}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <TrackIcon type={track.iconType} className="w-9 h-9 rounded-xl text-sm shadow-sm" />
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {track.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {track.interviewCount} interviews
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                {track.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="truncate max-w-[200px] text-[11px] text-zinc-400">
                {track.subtitle}
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                Explore
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
