import React, { useState, useEffect } from 'react';
import { Track, InterviewItem } from '../types';
import {
  X,
  Mic,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { TrackIcon } from './TrackIcon';

interface PreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  interviewItem: InterviewItem;
  onStartInterview: (config: {
    persona: string;
    inputMode: 'voice' | 'chat';
    resumeText?: string;
  }) => void;
}

export const PreflightModal: React.FC<PreflightModalProps> = ({
  isOpen,
  onClose,
  track,
  interviewItem,
  onStartInterview,
}) => {
  const [step, setStep] = useState<'config' | 'resume'>('config');
  const [persona, setPersona] = useState('Maya');
  const [inputMode, setInputMode] = useState<'voice' | 'chat'>('voice');
  const [resumeText, setResumeText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio testing preview
  useEffect(() => {
    let interval: any;
    if (isTestingAudio && inputMode === 'voice') {
      interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isTestingAudio, inputMode]);

  if (!isOpen) return null;

  const testVoiceSynthesis = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Hi, I'm ${persona}, and I'll be your interviewer today. Are you ready to begin?`
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const [resumeFileName, setResumeFileName] = useState('');

  const sampleProfiles = [
    {
      title: 'Full-Stack Developer',
      text: 'Senior Full-Stack Engineer with 4 years experience building distributed React, Node.js, and TypeScript applications. Led a microservices migration that reduced API latency by 40% and improved team delivery velocity. Passionate about clean code, positive team dynamics, and scalable cloud systems.',
    },
    {
      title: 'Project Lead & Manager',
      text: 'Technical Project Lead with 5+ years driving cross-functional engineering initiatives. Expert in Agile/Scrum, conflict de-escalation, psychological safety, and fostering team harmony. Successfully delivered 6 major product releases ahead of deadline while maintaining high team morale.',
    },
    {
      title: 'Frontend Specialist',
      text: 'Frontend Engineer specialized in modern JavaScript/TypeScript, React 18, and web performance. Optimized Core Web Vitals across a high-traffic e-commerce platform, achieving 99+ Lighthouse scores and smooth 60fps animations. Strong advocate for design systems and accessibility.',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = event.target?.result;
        if (typeof rawContent === 'string') {
          // Clean up binary or weird characters if pdf/doc was uploaded as text
          const cleaned = rawContent
            .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          setResumeText(cleaned.slice(0, 5000));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJoin = () => {
    onStartInterview({
      persona,
      inputMode,
      resumeText: resumeText.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 text-zinc-100 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <TrackIcon type={track.iconType} className="w-6 h-6 rounded" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{interviewItem.title}</h3>
              <p className="text-[11px] text-zinc-400">{track.title} · {interviewItem.difficulty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: CONFIGURATION */}
        {step === 'config' && (
          <div className="p-6 space-y-5">
            <div>
              <h4 className="text-lg font-bold text-zinc-100">Configure AI Interviewer</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose an interviewer style and your preferred response medium.
              </p>
            </div>

            {/* Persona Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Interviewer Persona
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'Maya',
                    name: 'Maya · Supportive Coach',
                    desc: 'Warm, encouraging guidance. Perfect for practice & learning.',
                  },
                  {
                    id: 'Alex',
                    name: 'Alex · FAANG Bar Raiser',
                    desc: 'Rigorous inquiries, big-O complexity, and edge-case drills.',
                  },
                  {
                    id: 'David',
                    name: 'David · Staff Architect',
                    desc: 'Focuses on maintainability, modularity, and trade-offs.',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={`flex items-start justify-between p-3 rounded-xl border text-left transition ${
                      persona === p.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100">{p.name}</span>
                        {persona === p.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Mode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Input Mode
                </label>
                <button
                  type="button"
                  onClick={testVoiceSynthesis}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Preview Voice</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                    inputMode === 'voice'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Voice (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('chat')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                    inputMode === 'chat'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat / Text Only</span>
                </button>
              </div>
            </div>

            {/* Notice / helper box */}
            <div className="p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300">
                We can hear and understand you using real-time browser speech recognition. You can switch between voice and chat at any time during the interview.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('resume')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RESUME CUSTOMIZATION (SCREENSHOT 5) */}
        {step === 'resume' && (
          <div className="p-6 text-center space-y-5">
            {/* Step Counter */}
            <div className="text-[10px] tracking-wider uppercase font-bold text-blue-400">
              BEFORE YOU BEGIN · STEP 2 OF 2
            </div>

            {/* Pulsing AI Orb */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-600/30 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-500 to-sky-400 shadow-[0_0_35px_rgba(59,130,246,0.6)] flex items-center justify-center border border-white/20">
                <div className="w-8 h-8 rounded-full bg-white/30 blur-xs" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-zinc-100">
                Personalize with your resume (optional)
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {persona} will tailor questions, scenario drills, and project inquiries directly to your actual experience.
              </p>
            </div>

            {/* Quick Profile Presets */}
            <div className="text-left">
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                Quick-load a profile or upload your own:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {sampleProfiles.map((sp) => (
                  <button
                    key={sp.title}
                    type="button"
                    onClick={() => {
                      setResumeText(sp.text);
                      setResumeFileName(sp.title);
                      setShowPasteBox(true);
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium transition text-center truncate ${
                      resumeFileName === sp.title
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-zinc-850 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {sp.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or Paste */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700 border-dashed rounded-xl cursor-pointer transition">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {resumeFileName ? `File: ${resumeFileName}` : 'Upload Resume (.txt, .md, .pdf, docs)'}
                  </span>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.pdf,.doc,.docx,.rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition"
                >
                  {showPasteBox ? 'Hide editor' : 'Paste / Edit'}
                </button>
              </div>

              {resumeText && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-300">
                        Resume attached ({resumeText.split(/\s+/).filter(Boolean).length} words)
                      </p>
                      <p className="text-[10px] text-emerald-400/80">
                        {persona} will personalize questions based on your background.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeText('');
                      setResumeFileName('');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {showPasteBox && (
                <div className="text-left space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Candidate Resume / Experience Details</span>
                    <span>{resumeText.length} / 5000 chars</span>
                  </div>
                  <textarea
                    rows={4}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="e.g. 4 years of software engineering experience leading microservice migrations, building React/Node applications, coordinating cross-functional Agile teams..."
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-500">
              No resume? Just click join — the interview works seamlessly without one.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep('config')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleJoin}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join interview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
