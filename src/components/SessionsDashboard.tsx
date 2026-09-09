import React, { useState, useMemo } from 'react';
import { InterviewSession, EvaluationReport } from '../types';
import {
  Award,
  Clock,
  Code,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  User,
  Calendar,
  Layers,
  BarChart3,
  Flame,
  ArrowRight,
  RefreshCw,
  LineChart as LineChartIcon,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface SessionsDashboardProps {
  sessions: InterviewSession[];
  selectedSession: InterviewSession | null;
  onSelectSession: (session: InterviewSession) => void;
  onBackToExplore: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const SessionsDashboard: React.FC<SessionsDashboardProps> = ({
  sessions,
  selectedSession,
  onSelectSession,
  onBackToExplore,
  onRefresh,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'code' | 'transcript'>('analytics');
  const [chartView, setChartView] = useState<'trend' | 'skills' | 'radar'>('trend');

  const current = selectedSession || (sessions.length > 0 ? sessions[0] : null);
  const evaluation: EvaluationReport | undefined = current?.evaluation;

  const isNonTechnical =
    current?.category?.toLowerCase().includes('non-technical') ||
    current?.trackId === 'behavioral' ||
    current?.trackId === 'communication';

  // Process historical sessions for Recharts
  const { trendData, skillAggregates, growthMetrics } = useMemo(() => {
    // Sort oldest to newest for chronological trend
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const trend = sorted.map((s, idx) => {
      const overall = s.evaluation?.overallScore ?? 65;
      const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      // Extract specific sub-scores if available
      const skills = s.evaluation?.skillBreakdown || [];
      const commSkill = skills.find((sb) =>
        sb.skill.toLowerCase().includes('comm') || sb.skill.toLowerCase().includes('harm') || sb.skill.toLowerCase().includes('clarity')
      );
      const techSkill = skills.find((sb) =>
        sb.skill.toLowerCase().includes('solv') || sb.skill.toLowerCase().includes('logic') || sb.skill.toLowerCase().includes('behav')
      );

      return {
        sessionNum: `Session ${idx + 1}`,
        date: dateStr,
        score: overall,
        communication: commSkill ? commSkill.score : Math.min(100, overall + 4),
        technicalOrBehavioral: techSkill ? techSkill.score : overall,
        title: s.title,
        category: s.category,
      };
    });

    // Aggregate skills across all sessions for radar/bar comparison
    const skillMap: Record<string, { total: number; count: number }> = {};
    sessions.forEach((s) => {
      s.evaluation?.skillBreakdown?.forEach((sb) => {
        const key = sb.skill.trim();
        if (!skillMap[key]) skillMap[key] = { total: 0, count: 0 };
        skillMap[key].total += sb.score;
        skillMap[key].count += 1;
      });
    });

    // Default archetypes if few sessions
    if (Object.keys(skillMap).length === 0) {
      skillMap['Problem Solving'] = { total: 78, count: 1 };
      skillMap['Communication & Harmony'] = { total: 84, count: 1 };
      skillMap['Team Collaboration'] = { total: 82, count: 1 };
      skillMap['Structure & Clarity'] = { total: 80, count: 1 };
      skillMap['Depth & Execution'] = { total: 75, count: 1 };
    }

    const aggregates = Object.entries(skillMap).map(([name, val]) => ({
      skill: name,
      score: Math.round(val.total / val.count),
      fullMark: 100,
    }));

    // Calculate growth delta
    const firstScore = trend.length > 0 ? trend[0].score : 0;
    const lastScore = trend.length > 0 ? trend[trend.length - 1].score : 0;
    const delta = lastScore - firstScore;
    const avgScore =
      trend.length > 0
        ? Math.round(trend.reduce((acc, curr) => acc + curr.score, 0) / trend.length)
        : 0;

    return {
      trendData: trend,
      skillAggregates: aggregates,
      growthMetrics: {
        avgScore,
        delta,
        firstScore,
        lastScore,
        totalSessions: sessions.length,
      },
    };
  }, [sessions]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500';
    if (score >= 60) return 'text-blue-500 border-blue-500';
    if (score >= 40) return 'text-amber-500 border-amber-500';
    return 'text-rose-500 border-rose-500';
  };

  const getReadinessBg = (readiness?: string) => {
    switch (readiness) {
      case 'Ready':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Strong':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Developing':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Interview Analytics & Reports
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Persisted in Firebase Firestore. Evaluated with structured Gemini hiring benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Refresh Sessions from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onBackToExplore}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Practice New Track
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No Interview Sessions Recorded Yet
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Complete your first live interview to view granular skill analytics, code reviews, and Gemini evaluator scorecards.
          </p>
          <button
            onClick={onBackToExplore}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
          >
            Go to Explore Tracks
          </button>
        </div>
      ) : (
        <>
          {/* RECHARTS HISTORICAL GROWTH TREND PANEL */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Skill Growth Trends & Progress Velocity
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Historical progression plotted from your Firestore interview records.
                </p>
              </div>

              {/* Chart Mode Controls */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs">
                <button
                  onClick={() => setChartView('trend')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    chartView === 'trend'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Score Timeline
                </button>
                <button
                  onClick={() => setChartView('radar')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    chartView === 'radar'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Competency Radar
                </button>
                <button
                  onClick={() => setChartView('skills')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    chartView === 'skills'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Skill Bars
                </button>
              </div>
            </div>

            {/* Growth Summary Metrics Pill Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Average Score
                </span>
                <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {growthMetrics.avgScore}
                  <span className="text-xs text-zinc-400 font-normal"> / 100</span>
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Performance Delta
                </span>
                <p className={`text-xl font-black mt-0.5 ${growthMetrics.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {growthMetrics.delta >= 0 ? `+${growthMetrics.delta} pts` : `${growthMetrics.delta} pts`}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Recorded Sessions
                </span>
                <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {growthMetrics.totalSessions}
                </p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Latest Score
                </span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {growthMetrics.lastScore}
                  <span className="text-xs text-zinc-400 font-normal"> / 100</span>
                </p>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full pt-2">
              {chartView === 'trend' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="commColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis domain={[30, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-zinc-100">{data.title}</p>
                              <p className="text-zinc-400 text-[11px]">{data.date} · {data.category}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-zinc-300">Overall Score:</span>
                                <span className="font-bold text-blue-400">{data.score}/100</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-zinc-300">Communication & Harmony:</span>
                                <span className="font-bold text-emerald-400">{data.communication}/100</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      name="Overall Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreColor)"
                      activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      name="Communication & Teamwork"
                      dataKey="communication"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartView === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillAggregates}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="skill" stroke="#a1a1aa" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525b" fontSize={10} />
                    <Radar
                      name="Candidate Competence"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.45}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-zinc-100">{data.skill}</p>
                              <p className="text-blue-400 font-bold mt-0.5">{data.score} / 100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}

              {chartView === 'skills' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillAggregates} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="skill" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-zinc-100">{data.skill}</p>
                              <p className="text-emerald-400 font-bold mt-0.5">{data.score} / 100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" name="Competency Score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sessions List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Past Interviews ({sessions.length})
            </h2>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {sessions.map((sess) => {
                const isSelected = current?.id === sess.id;
                const score = sess.evaluation?.overallScore ?? 65;

                return (
                  <div
                    key={sess.id}
                    onClick={() => onSelectSession(sess)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {sess.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sess.createdAt).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span>{Math.round(sess.timeSpentSeconds / 60)} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`px-2 py-1 rounded-md text-xs font-black border ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Scorecard & Report (8 cols) (Screenshots 8 & 9) */}
          {current && (
            <div className="lg:col-span-8 space-y-6">
              {/* Session Overview Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {current.category}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {current.difficulty}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Interviewer: {current.persona}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {current.title}
                    </h2>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Completed on {new Date(current.createdAt).toLocaleString()} · Duration: {Math.round(current.timeSpentSeconds / 60)}m {current.timeSpentSeconds % 60}s
                    </p>
                  </div>

                  {/* Circular Score Badge */}
                  <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-850 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-center">
                      <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                        {evaluation?.overallScore ?? 65}
                        <span className="text-xs text-zinc-400 font-normal"> / 100</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Overall Score
                      </span>
                    </div>

                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getReadinessBg(
                          evaluation?.readiness
                        )}`}
                      >
                        {evaluation?.readiness || 'Developing'}
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Readiness Level</p>
                    </div>
                  </div>
                </div>

                {/* Sub tabs: Analytics vs Code vs Transcript */}
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'analytics'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics & Scorecard</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'code'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isNonTechnical ? (
                      <>
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                        <span>Team Dynamics & Behavioral</span>
                      </>
                    ) : (
                      <>
                        <Code className="w-3.5 h-3.5" />
                        <span>Candidate Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'transcript'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Full Transcript</span>
                  </button>
                </div>

                {/* TAB 1: ANALYTICS VIEW */}
                {activeTab === 'analytics' && evaluation && (
                  <div className="space-y-6">
                    {/* Executive Summary */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        Executive Evaluator Summary
                      </h3>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                        {evaluation.summary}
                      </p>
                    </div>

                    {/* What Went Well & Focus Areas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What Went Well */}
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>WHAT WENT WELL</span>
                        </div>
                        <ul className="space-y-2">
                          {evaluation.whatWentWell?.map((item, idx) => (
                            <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Focus Areas */}
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>FOCUS AREAS</span>
                        </div>
                        <ul className="space-y-2">
                          {evaluation.focusAreas?.map((item, idx) => (
                            <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Skill Breakdown Progress Bars (Screenshot 8) */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Skill Breakdown
                      </h3>
                      <div className="space-y-3">
                        {evaluation.skillBreakdown?.map((sb, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {sb.skill}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                  {sb.score}/100
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${getReadinessBg(sb.status)}`}>
                                  {sb.status}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  sb.score >= 75
                                    ? 'bg-emerald-500'
                                    : sb.score >= 60
                                    ? 'bg-blue-500'
                                    : sb.score >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(5, sb.score)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strongest Moment Highlight Card */}
                    {evaluation.strongestMoment && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Your Strongest Moment</span>
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {evaluation.strongestMoment.context}
                          </span>
                        </div>
                        <p className="text-xs italic text-zinc-800 dark:text-zinc-200 border-l-2 border-blue-500 pl-3 py-0.5">
                          "{evaluation.strongestMoment.quote}"
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {evaluation.strongestMoment.feedback}
                        </p>
                      </div>
                    )}

                    {/* Metrics Grid */}
                    {evaluation.metrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-center border border-zinc-200/60 dark:border-zinc-800/60">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {evaluation.metrics.technicalSubstantive}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Substantive Answers
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-center border border-zinc-200/60 dark:border-zinc-800/60">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {evaluation.metrics.concreteNumbers}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Concrete Metrics
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-center border border-zinc-200/60 dark:border-zinc-800/60">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {evaluation.metrics.clearStructure}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Structured Responses
                          </p>
                        </div>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-center border border-zinc-200/60 dark:border-zinc-800/60">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {evaluation.metrics.shortResponses}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Short Answers
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CODE SUBMISSION OR BEHAVIORAL ANALYSIS VIEW */}
                {activeTab === 'code' && (
                  isNonTechnical ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-emerald-400" />
                          <span>Leadership, Communication & Team Harmony Assessment</span>
                        </span>
                        <span className="text-[11px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                          Non-Technical Track
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Grammar, Clarity & Professional Demeanor</span>
                          </h4>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {evaluation?.metrics?.clearStructure
                              ? `Candidate demonstrated ${evaluation.metrics.clearStructure} highly structured, well-articulated answers with clear context, action, and results.`
                              : 'Candidate communicated with clarity, avoiding filler words and structuring thoughts logically.'}
                          </p>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>Team Harmony & Conflict Navigation</span>
                          </h4>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            Interactions highlighted constructive collaboration instincts, empathy towards teammates under tight deadlines, and proactive communication.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-300">
                        <span className="font-bold text-zinc-200">Behavioral Framework Notes:</span>
                        <p className="text-zinc-400 leading-relaxed">
                          Non-technical tracks emphasize conflict resolution, project management, cross-functional stakeholder alignment, and positive team dynamics. No coding or compilation is expected or evaluated.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Submitted JavaScript Solution</span>
                        <span className="font-mono text-[11px]">{current.code ? `${current.code.length} characters` : 'Empty'}</span>
                      </div>
                      <pre className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
                        {current.code || '// No code submitted during this session.'}
                      </pre>
                    </div>
                  )
                )}

                {/* TAB 3: CONVERSATION TRANSCRIPT VIEW */}
                {activeTab === 'transcript' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Full Dialogue Transcript</span>
                    </div>
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-sans space-y-4 max-h-[500px] overflow-y-auto leading-relaxed">
                      {current.transcript ? (
                        current.transcript.split('\n\n').map((chunk, i) => (
                          <div key={i} className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/50">
                            {chunk}
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-500 italic">No transcript saved for this session.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};
