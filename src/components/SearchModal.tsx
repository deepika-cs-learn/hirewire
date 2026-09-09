import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Track, InterviewItem } from '../types';
import { TRACKS_DATA } from '../data/tracksData';
import { TrackIcon } from './TrackIcon';
import {
  Search,
  X,
  Clock,
  Code,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInterview: (track: Track, item: InterviewItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectInterview,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'non-technical'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Flatten all items with parent track reference
  const allInterviewItems = useMemo(() => {
    const list: { track: Track; item: InterviewItem }[] = [];
    TRACKS_DATA.forEach((track) => {
      track.items.forEach((item) => {
        list.push({ track, item });
      });
    });
    return list;
  }, []);

  // Filtered results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allInterviewItems.filter(({ track, item }) => {
      // Category filter
      if (selectedCategory !== 'all' && track.category !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && item.difficulty !== selectedDifficulty) {
        return false;
      }

      if (!q) return true;

      // Text query match
      const titleMatch = item.title.toLowerCase().includes(q);
      const trackMatch = track.title.toLowerCase().includes(q);
      const descMatch = item.description.toLowerCase().includes(q);
      const skillsMatch = item.skillsCovered.some((s) => s.toLowerCase().includes(q));

      return titleMatch || trackMatch || descMatch || skillsMatch;
    });
  }, [allInterviewItems, query, selectedCategory, selectedDifficulty]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, interview tracks, algorithms, communication..."
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-zinc-400">Filters:</span>

          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {(['all', 'technical', 'non-technical'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat === 'technical' ? 'Technical' : 'Non-Technical'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {diff === 'all' ? 'Any Level' : diff}
              </button>
            ))}
          </div>

          <span className="ml-auto text-[11px] text-zinc-400 font-medium">
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Quick popular tags when query is empty */}
        {!query && (
          <div className="px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1 shrink-0 font-medium">
              <Flame className="w-3 h-3 text-amber-500" /> Popular:
            </span>
            {['Frontend', 'DSA', 'Spoken English', 'System Design', 'React', 'Behavioral'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition shrink-0 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Search Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <Code className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No matching practice tracks found
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Try searching for broader keywords like "React", "Python", "Fluency", or reset filters.
              </p>
            </div>
          ) : (
            results.map(({ track, item }) => (
              <div
                key={`${track.id}-${item.id}`}
                onClick={() => {
                  onSelectInterview(track, item);
                  onClose();
                }}
                className="group p-3.5 rounded-xl bg-white dark:bg-zinc-850/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700/60 transition cursor-pointer flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <TrackIcon type={track.iconType} className="w-9 h-9 rounded-lg text-sm shrink-0 shadow-xs" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        {track.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          item.difficulty === 'Easy'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : item.difficulty === 'Medium'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.durationMin} min
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate mt-0.5">
                      {item.title}
                    </h4>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.skillsCovered.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition hidden sm:inline">
                    Practice
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
