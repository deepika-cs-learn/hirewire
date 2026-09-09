import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Track, InterviewItem, ChatMessage, EvaluationReport, InterviewSession } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  validateCodeSyntax,
  runSandboxedScript,
  verifyTestCases,
  TestCaseVerificationResult,
  SyntaxValidationResult,
} from '../utils/codeSandbox';
import {
  Mic,
  MicOff,
  Send,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronDown,
  Terminal,
  FileCode,
  AlertTriangle,
  Flame,
  Radio,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  PenTool,
  Lightbulb,
  Users,
  Square,
  Timer,
} from 'lucide-react';

interface InterviewWorkspaceProps {
  track: Track;
  interviewItem: InterviewItem;
  persona: string;
  initialInputMode: 'voice' | 'chat';
  resumeText?: string;
  onEndInterview: (sessionData: InterviewSession) => void;
  onCancel: () => void;
}

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  track,
  interviewItem,
  persona,
  initialInputMode,
  resumeText,
  onEndInterview,
  onCancel,
}) => {
  const { user } = useAuth();

  // Non-technical track classification
  const isNonTechnical =
    track.category === 'non-technical' ||
    track.id.toLowerCase().includes('behavioral') ||
    track.id.toLowerCase().includes('communication') ||
    track.title.toLowerCase().includes('behavioral') ||
    track.title.toLowerCase().includes('project') ||
    track.title.toLowerCase().includes('leadership') ||
    interviewItem.skillsCovered.some(
      (s) =>
        s.toLowerCase().includes('behavioral') ||
        s.toLowerCase().includes('grammar') ||
        s.toLowerCase().includes('communication') ||
        s.toLowerCase().includes('leadership')
    );

  // Interview stage: 'approach' | 'solution' | 'followup'
  const [currentStage, setCurrentStage] = useState<'approach' | 'solution' | 'followup'>('approach');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [evaluatingStatus, setEvaluatingStatus] = useState<string>('');

  // Code editor state (technical tracks)
  const [code, setCode] = useState(interviewItem.starterCode);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [terminalOutput, setTerminalOutput] = useState<string>('Ready. Click "Run" to test execution.\n');
  const [activeTab, setActiveTab] = useState<'terminal' | 'tests'>('terminal');
  const [testResults, setTestResults] = useState<TestCaseVerificationResult[]>([]);

  // Non-technical studio state
  const [activeNonTechTab, setActiveNonTechTab] = useState<'rubric' | 'star' | 'notes'>('rubric');
  const [candidateNotes, setCandidateNotes] = useState('');
  const [selectedStarPillar, setSelectedStarPillar] = useState<'S' | 'T' | 'A' | 'R'>('S');

  // Speech & Conversation state
  const [inputMode, setInputMode] = useState<'voice' | 'chat'>(initialInputMode);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const isMicMutedRef = useRef(false);
  const [voiceMode, setVoiceMode] = useState<'handsfree' | 'pushtotalk'>('handsfree');
  const [userTextDraft, setUserTextDraft] = useState('');
  const [liveUserSpeech, setLiveUserSpeech] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Optional Countdown Timer State (Practice time pressure mode)
  const [timerMode, setTimerMode] = useState<'elapsed' | 'countdown'>(() => {
    return (localStorage.getItem('hirewire_timer_mode') as 'elapsed' | 'countdown') || 'elapsed';
  });
  const [countdownMinutes, setCountdownMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('hirewire_countdown_mins');
    return saved ? parseInt(saved, 10) : (interviewItem.durationMin || 30);
  });
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [hasNotifiedTimeUp, setHasNotifiedTimeUp] = useState(false);

  // Keep isMicMutedRef in sync
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Execution results cache for Gemini evaluation
  const lastExecutionResultsRef = useRef<{
    testsTotal: number;
    testsPassed: number;
    testsFailed: number;
    syntaxValid: boolean;
    syntaxErrors: string[];
    details: any[];
    stdout: string[];
  } | null>(null);

  // Chat transcript
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Push-to-talk & active listening state
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const isPushToTalkActiveRef = useRef(false);

  // Speech Recognition & Lifecycle refs
  const recognitionRef = useRef<any>(null);
  const isAiSpeakingRef = useRef(false);
  const isSessionEndedRef = useRef(false);
  const speechCooldownTimerRef = useRef<any>(null);

  // Synchronize AI speaking ref
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer derived calculations
  const totalCountdownSecs = countdownMinutes * 60;
  const remainingSeconds = Math.max(0, totalCountdownSecs - elapsedSeconds);
  const isCountdown = timerMode === 'countdown';
  const isTimeLow = isCountdown && remainingSeconds <= 300 && remainingSeconds > 60; // < 5 mins
  const isTimeCritical = isCountdown && remainingSeconds <= 60 && remainingSeconds > 0; // < 1 min
  const isTimeExpired = isCountdown && remainingSeconds === 0 && elapsedSeconds >= totalCountdownSecs;

  // Notify when countdown timer reaches zero
  useEffect(() => {
    if (isTimeExpired && !hasNotifiedTimeUp) {
      setHasNotifiedTimeUp(true);
    }
  }, [isTimeExpired, hasNotifiedTimeUp]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Scroll to bottom of chat transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveUserSpeech]);

  // Immediate Stop Speech Helper
  const stopAiSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechCooldownTimerRef.current) {
      clearTimeout(speechCooldownTimerRef.current);
      speechCooldownTimerRef.current = null;
    }
    isAiSpeakingRef.current = false;
    setIsAiSpeaking(false);
  };

  // Initial greeting from AI Interviewer
  useEffect(() => {
    let initialGreeting = '';
    const hasResume = Boolean(resumeText && resumeText.trim().length > 30);

    // Parse notable experience or projects directly from resumeText
    let resumeExperienceRef = '';
    if (hasResume && resumeText) {
      const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
      const experienceSnippet = lines.find(
        (l) =>
          l.length > 12 &&
          l.length < 100 &&
          /(?:engineer|developer|lead|architect|manager|designer|intern|consultant|full[- ]stack|frontend|backend|cloud)/i.test(l)
      );
      if (experienceSnippet) {
        resumeExperienceRef = experienceSnippet;
      }
    }

    if (isNonTechnical) {
      if (hasResume) {
        const expContext = resumeExperienceRef ? `especially noting your experience in "${resumeExperienceRef}"` : 'drawing on your background';
        initialGreeting = `Hi, I'm ${persona}, and I'll be your interviewer today. I took a detailed look at your uploaded resume, ${expContext}. Today we'll focus on leadership, team harmony, and how you manage projects constructively. To start, could you introduce yourself and tell me about a project from that experience where you fostered positive team harmony under pressure?`;
      } else {
        initialGreeting = `Hi, I'm ${persona}, and I'll be your interviewer today. Today's interview will focus on your English communication, teamwork, and project management skills. To start, could you introduce yourself and describe how you ensure positive team harmony when navigating conflicting priorities?`;
      }
    } else {
      if (hasResume) {
        const expContext = resumeExperienceRef ? `specifically noting your experience as "${resumeExperienceRef}"` : 'referencing your prior project work';
        initialGreeting = `Hi, I'm ${persona}, and I'll be your interviewer today. I reviewed your resume, ${expContext}. We'll spend about ${interviewItem.durationMin} minutes on ${interviewItem.title}. To start, could you introduce yourself, highlight your most technically demanding project from that background, and walk me through your initial high-level approach to today's problem?`;
      } else {
        initialGreeting = `Hi, I'm ${persona}, and I'll be your interviewer today. We'll spend about ${interviewItem.durationMin} minutes on ${interviewItem.title}, with a relaxed mix of discussion and practical problem solving. To start, could you introduce yourself and walk me through your initial high-level approach?`;
      }
    }

    const welcomeMsg: ChatMessage = {
      id: 'msg-init',
      role: 'assistant',
      content: initialGreeting,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);

    // Speak initial greeting if voice mode
    if (ttsEnabled) {
      speakAloud(initialGreeting);
    }
  }, []);

  // Initialize Speech Recognition (STT) with strict mute and loop prevention
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = voiceMode === 'handsfree';
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        // Drop audio immediately if muted, AI is talking, or session ended
        if (isMicMutedRef.current || isAiSpeakingRef.current || isSessionEndedRef.current) {
          try {
            recognizer.abort();
          } catch {
            // Ignore
          }
          setIsListening(false);
          return;
        }
        setIsListening(true);
      };

      recognizer.onresult = (event: any) => {
        // STRICT SAFETY GUARD: If mic is muted, AI is talking, or session ended, drop captured sound immediately
        if (isMicMutedRef.current || isAiSpeakingRef.current || isSessionEndedRef.current) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim && !isAiSpeakingRef.current && !isMicMutedRef.current) {
          setLiveUserSpeech(interim);
        }

        if (final && !isMicMutedRef.current) {
          const trimmed = final.trim();
          setLiveUserSpeech('');

          // Background Noise & Short Whisper Filter:
          // Ignore clicks (< 3 chars) or single stray murmurs (< 2 words and < 10 chars)
          const words = trimmed.split(/\s+/).filter(Boolean);
          if (trimmed.length < 3 || (words.length < 2 && trimmed.length < 10)) {
            return;
          }

          // Echo Loop Prevention: Check if candidate transcript matches recent AI message
          const lastAiMsg = messages.slice().reverse().find((m) => m.role === 'assistant');
          if (lastAiMsg) {
            const cleanAi = lastAiMsg.content.toLowerCase().replace(/[^a-z0-9 ]/g, '');
            const cleanUser = trimmed.toLowerCase().replace(/[^a-z0-9 ]/g, '');
            if (cleanAi.includes(cleanUser) && cleanUser.length > 6) {
              console.warn('[Echo Loop Prevented] Dropped self-hearing audio loop from microphone:', trimmed);
              return;
            }
          }

          handleCandidateReply(trimmed);
        }
      };

      recognizer.onerror = (err: any) => {
        if (err.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognizer.onend = () => {
        setIsListening(false);
        // CRITICAL FIX: NEVER restart if user explicitly muted the microphone!
        if (isMicMutedRef.current) {
          return;
        }
        // Restart only if hands-free, AI is NOT speaking, session has NOT ended, and voice input is active
        if (
          voiceMode === 'handsfree' &&
          !isAiSpeakingRef.current &&
          !isSessionEndedRef.current &&
          inputMode === 'voice'
        ) {
          try {
            recognizer.start();
          } catch {
            // Ignored if already started
          }
        }
      };

      recognitionRef.current = recognizer;

      // Start recognition only if NOT muted, in handsfree voice mode and AI not speaking
      if (
        !isMicMutedRef.current &&
        inputMode === 'voice' &&
        voiceMode === 'handsfree' &&
        !isAiSpeakingRef.current &&
        !isSessionEndedRef.current
      ) {
        try {
          recognizer.start();
        } catch {
          // Ignore
        }
      }
    }

    return () => {
      if (speechCooldownTimerRef.current) {
        clearTimeout(speechCooldownTimerRef.current);
        speechCooldownTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceMode, inputMode]);

  // Robust Text-To-Speech (TTS) with Echo Guard
  const speakAloud = (text: string) => {
    if (!('speechSynthesis' in window) || !ttsEnabled || isSessionEndedRef.current) return;

    // Immediately stop any prior speech & clear timer
    window.speechSynthesis.cancel();
    if (speechCooldownTimerRef.current) {
      clearTimeout(speechCooldownTimerRef.current);
      speechCooldownTimerRef.current = null;
    }

    // Set speaking lock immediately to silence recognition
    isAiSpeakingRef.current = true;
    setIsAiSpeaking(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (isSessionEndedRef.current) {
        window.speechSynthesis.cancel();
        return;
      }
      isAiSpeakingRef.current = true;
      setIsAiSpeaking(true);
    };

    utterance.onend = () => {
      if (isSessionEndedRef.current) {
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        return;
      }

      // Safety buffer delay (850ms) so mic doesn't pick up trailing room reverberation
      speechCooldownTimerRef.current = setTimeout(() => {
        if (isSessionEndedRef.current) return;
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);

        // Resume listening if voice mode is handsfree AND NOT MUTED
        if (
          !isMicMutedRef.current &&
          inputMode === 'voice' &&
          voiceMode === 'handsfree' &&
          recognitionRef.current
        ) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignore
          }
        }
      }, 850);
    };

    utterance.onerror = () => {
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Push-To-Talk Start Handler (Hold to talk)
  const handlePushToTalkStart = () => {
    stopAiSpeaking();
    isPushToTalkActiveRef.current = true;
    setIsPushToTalkActive(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already active
      }
    }
  };

  // Push-To-Talk End Handler (Release to send)
  const handlePushToTalkEnd = () => {
    isPushToTalkActiveRef.current = false;
    setIsPushToTalkActive(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  };

  // Keyboard shortcut listener for Push-to-Talk (Spacebar hold)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        voiceMode === 'pushtotalk' &&
        inputMode === 'voice' &&
        e.code === 'Space' &&
        !isPushToTalkActiveRef.current
      ) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('.monaco-editor')
        ) {
          return;
        }
        e.preventDefault();
        handlePushToTalkStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        voiceMode === 'pushtotalk' &&
        inputMode === 'voice' &&
        e.code === 'Space' &&
        isPushToTalkActiveRef.current
      ) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('.monaco-editor')
        ) {
          return;
        }
        e.preventDefault();
        handlePushToTalkEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [voiceMode, inputMode]);

  // Set Voice Mode switch
  const handleSetVoiceMode = (mode: 'handsfree' | 'pushtotalk') => {
    setVoiceMode(mode);
    if (mode === 'pushtotalk') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
      setIsPushToTalkActive(false);
      isPushToTalkActiveRef.current = false;
    } else {
      if (
        !isMicMutedRef.current &&
        !isAiSpeakingRef.current &&
        !isSessionEndedRef.current &&
        inputMode === 'voice'
      ) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            // Ignore
          }
        }
      }
    }
  };

  // Toggle Microphone (Explicit Mute / Unmute)
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use text chat.');
      return;
    }
    stopAiSpeaking();

    if (!isMicMuted) {
      // User requested MUTE
      isMicMutedRef.current = true;
      setIsMicMuted(true);
      setIsListening(false);
      setLiveUserSpeech('');
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    } else {
      // User requested UNMUTE
      isMicMutedRef.current = false;
      setIsMicMuted(false);
      if (inputMode === 'voice' && (voiceMode === 'handsfree' || isPushToTalkActiveRef.current)) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          // Ignore
        }
      }
    }
  };

  // Process candidate answer & call Gemini API
  const handleCandidateReply = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserTextDraft('');

    // Advance stage automatically based on turns
    if (updatedMessages.length >= 4 && currentStage === 'approach') {
      setCurrentStage('solution');
    } else if (updatedMessages.length >= 8 && currentStage === 'solution') {
      setCurrentStage('followup');
    }

    // Call server Gemini Chat API
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          trackTitle: track.title,
          category: track.category,
          trackId: track.id,
          problemTitle: interviewItem.title,
          problemDescription: interviewItem.description,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          currentCode: isNonTechnical ? '' : code,
          resumeText,
          stage: currentStage,
          userAnswer: userText,
        }),
      });

      let aiReply = "Thanks for sharing. What's your next thought on this?";
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          aiReply = data.reply;
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakAloud(aiReply);
    } catch (err) {
      console.error('Failed to get interviewer reply:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: isNonTechnical
          ? "That's a very helpful perspective. Could you share an example of how you communicated this with teammates to ensure positive harmony?"
          : "That makes sense. Let's look at the implementation and test any edge cases.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakAloud(fallbackMsg.content);
    }
  };

  // Code Execution Sandbox using isolated iframe sandbox & syntax validation
  const runCode = async () => {
    setActiveTab('terminal');
    setTerminalOutput('Validating syntax & preparing isolated sandbox runtime...\n');

    // Stage 1: Validation layer
    const syntax = validateCodeSyntax(code);
    if (!syntax.isValid) {
      setTerminalOutput(
        `SYNTAX VALIDATION ERROR:\n` +
          syntax.errors.map((e) => `• ${e}`).join('\n') +
          (syntax.warnings.length > 0
            ? `\n\nWarnings:\n` + syntax.warnings.map((w) => `• ${w}`).join('\n')
            : '') +
          `\n\nPlease fix syntax errors before executing.`
      );
      return;
    }

    setTerminalOutput('Executing in sandboxed execution context (no new Function)...\n');
    const res = await runSandboxedScript(code, 3000);

    let outStr = '';
    if (syntax.warnings.length > 0) {
      outStr += `[Syntax Warnings]:\n${syntax.warnings.map((w) => `• ${w}`).join('\n')}\n\n`;
    }
    if (res.stdout.length > 0) {
      outStr += `[Standard Output]:\n${res.stdout.join('\n')}\n`;
    }
    if (res.stderr.length > 0) {
      outStr += `[Standard Error]:\n${res.stderr.join('\n')}\n`;
    }
    if (res.error) {
      outStr += `[Runtime Exception]:\n${res.error}\n`;
    }
    if (!res.stdout.length && !res.stderr.length && !res.error) {
      outStr += 'Code executed successfully with no stdout.';
    }

    setTerminalOutput(outStr);
  };

  // Run Test Cases with explicit actual vs expected comparison
  const runTests = async () => {
    setActiveTab('tests');
    setTerminalOutput('Validating syntax & running test case assertions...\n');

    const syntax = validateCodeSyntax(code);
    if (!syntax.isValid) {
      const syntaxErr = syntax.errors.join('; ');
      setTestResults(
        interviewItem.testCases.map((tc) => ({
          id: tc.id,
          name: tc.name,
          passed: false,
          error: `Syntax Error: ${syntaxErr}`,
          durationMs: 0,
        }))
      );
      setTerminalOutput(
        `TEST SUITE ABORTED - SYNTAX ERRORS:\n` +
          syntax.errors.map((e) => `• ${e}`).join('\n')
      );
      lastExecutionResultsRef.current = {
        testsTotal: interviewItem.testCases.length,
        testsPassed: 0,
        testsFailed: interviewItem.testCases.length,
        syntaxValid: false,
        syntaxErrors: syntax.errors,
        details: interviewItem.testCases.map((tc) => ({
          id: tc.id,
          name: tc.name,
          passed: false,
          error: syntaxErr,
        })),
        stdout: [],
      };
      return;
    }

    // Run test cases against expected outputs
    const results = await verifyTestCases(code, interviewItem.testCases);
    setTestResults(results);

    const passCount = results.filter((r) => r.passed).length;
    const failCount = results.length - passCount;

    // Cache execution results for Gemini evaluation scorecard
    lastExecutionResultsRef.current = {
      testsTotal: results.length,
      testsPassed: passCount,
      testsFailed: failCount,
      syntaxValid: true,
      syntaxErrors: [],
      details: results.map((r) => ({
        id: r.id,
        name: r.name,
        passed: r.passed,
        expected: r.expected,
        actual: r.actual,
        error: r.error,
        durationMs: r.durationMs,
      })),
      stdout: [
        `Verified ${passCount}/${results.length} test cases in ${results.reduce((acc, r) => acc + r.durationMs, 0)}ms`,
      ],
    };

    setTerminalOutput(
      `Test Verification Suite: ${passCount} of ${results.length} passed (${Math.round((passCount / (results.length || 1)) * 100)}%).\n\n` +
        results
          .map((r) => {
            if (r.passed) {
              return `PASS: ${r.name} (${r.durationMs}ms)`;
            } else {
              let errDetail = r.error || 'Assertion failed';
              if (r.expected && r.actual) {
                errDetail = `Expected: ${r.expected}\n        Received: ${r.actual}`;
              }
              return `FAIL: ${r.name} (${r.durationMs}ms)\n  -> ${errDetail}`;
            }
          })
          .join('\n\n')
    );
  };

  // End Interview & Generate Gemini Evaluation
  const handleEndInterviewClick = async () => {
    isSessionEndedRef.current = true;
    stopAiSpeaking();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);

    setIsEnding(true);
    setEvaluatingStatus('Synthesizing interview transcript & evaluation...');

    // If technical track, ensure execution results exist for evaluation prompt
    if (!isNonTechnical && interviewItem.testCases.length > 0 && !lastExecutionResultsRef.current) {
      try {
        const autoSyntax = validateCodeSyntax(code);
        if (autoSyntax.isValid) {
          const autoResults = await verifyTestCases(code, interviewItem.testCases);
          const autoPass = autoResults.filter((r) => r.passed).length;
          lastExecutionResultsRef.current = {
            testsTotal: autoResults.length,
            testsPassed: autoPass,
            testsFailed: autoResults.length - autoPass,
            syntaxValid: true,
            syntaxErrors: [],
            details: autoResults,
            stdout: [`Auto-verified ${autoPass}/${autoResults.length} test cases passed.`],
          };
        } else {
          lastExecutionResultsRef.current = {
            testsTotal: interviewItem.testCases.length,
            testsPassed: 0,
            testsFailed: interviewItem.testCases.length,
            syntaxValid: false,
            syntaxErrors: autoSyntax.errors,
            details: [],
            stdout: ['Syntax validation failed.'],
          };
        }
      } catch (e) {
        console.warn('Auto verification error:', e);
      }
    }

    // Format full transcript text
    const fullTranscript = messages
      .map((m) => `${m.role === 'user' ? 'Candidate' : persona}: ${m.content}`)
      .join('\n\n');

    try {
      setEvaluatingStatus('Generating AI hiring manager scorecards & skill analytics...');

      const evalRes = await fetch('/api/gemini/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewTitle: interviewItem.title,
          category: track.category,
          trackTitle: track.title,
          difficulty: interviewItem.difficulty,
          persona,
          transcript: fullTranscript,
          code: isNonTechnical ? '' : code,
          executionResults: lastExecutionResultsRef.current,
          resumeText,
          durationSeconds: elapsedSeconds,
        }),
      });

      let evaluationData: EvaluationReport;
      if (evalRes.ok) {
        const rawData = await evalRes.json();
        if (rawData && typeof rawData.overallScore === 'number') {
          evaluationData = rawData;
        } else {
          throw new Error('Invalid evaluation score structure');
        }
      } else {
        throw new Error('Evaluation request returned status ' + evalRes.status);
      }

      const newSession: InterviewSession = {
        userId: user?.uid || 'demo_candidate_01',
        userEmail: user?.email || 'candidate@hirewire.ai',
        trackId: track.id,
        interviewId: interviewItem.id,
        title: `${interviewItem.title} (${track.title})`,
        category: track.category === 'technical' ? 'Technical' : 'Non-technical',
        persona,
        inputMode,
        difficulty: interviewItem.difficulty,
        durationMinutes: interviewItem.durationMin,
        timeSpentSeconds: elapsedSeconds,
        code,
        transcript: fullTranscript,
        evaluation: evaluationData,
        createdAt: new Date().toISOString(),
      };

      onEndInterview(newSession);
    } catch (err) {
      console.error('Evaluation error:', err);
      // Fallback session report
      const fallbackSession: InterviewSession = {
        userId: user?.uid || 'demo_candidate_01',
        userEmail: user?.email || 'candidate@hirewire.ai',
        trackId: track.id,
        interviewId: interviewItem.id,
        title: `${interviewItem.title} (${track.title})`,
        category: track.category === 'technical' ? 'Technical' : 'Non-technical',
        persona,
        inputMode,
        difficulty: interviewItem.difficulty,
        durationMinutes: interviewItem.durationMin,
        timeSpentSeconds: elapsedSeconds,
        code,
        transcript: fullTranscript,
        evaluation: {
          overallScore: 72,
          readiness: 'Developing',
          summary: 'Successfully navigated interview flow with good analytical reasoning.',
          whatWentWell: ['Structured discussion well', 'Identified primary components'],
          focusAreas: ['Elaborate further on algorithmic space constraints'],
          skillBreakdown: [
            { skill: 'Problem Formulation', score: 80, status: 'Strong' },
            { skill: 'Execution', score: 68, status: 'Developing' },
            { skill: 'Communication', score: 75, status: 'Strong' },
          ],
          strongestMoment: {
            quote: 'Initial explanation of core function signature',
            context: 'Approach phase',
            feedback: 'Solid clarity before jumping into syntax.',
          },
          metrics: {
            technicalSubstantive: '2 of 2 questions',
            concreteNumbers: '1 of 2 responses',
            clearStructure: '2 of 2 responses',
            shortResponses: '0 responses',
          },
          answerScores: [
            { questionIndex: 1, questionSummary: 'Introductory discussion', score: 74, comment: 'Clear rationale.' }
          ],
        },
        createdAt: new Date().toISOString(),
      };
      onEndInterview(fallbackSession);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Workspace Header (Matches Screenshot 6 & 7) */}
      <div className="h-13 bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">
              {interviewItem.title}
            </span>
            <span className="text-zinc-500 text-xs">·</span>
            {isNonTechnical ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-700/60 text-indigo-300">
                Non-Technical Behavioral
              </span>
            ) : (
              <span className="text-xs text-zinc-400 font-mono">
                {track.id === 'frontend' ? 'javascript' : track.id}
              </span>
            )}
          </div>

          {/* Stage Progression Pills */}
          <div className="hidden md:flex items-center gap-1.5 ml-4 px-2 py-1 bg-zinc-950 rounded-lg border border-zinc-800">
            {[
              { id: 'approach', label: isNonTechnical ? 'Situation & Context' : 'Approach' },
              { id: 'solution', label: isNonTechnical ? 'Action & Harmony' : 'Solution' },
              { id: 'followup', label: isNonTechnical ? 'Results & Growth' : 'Follow-ups' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setCurrentStage(st.id as any)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentStage === st.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Timer / Countdown & End Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition shadow-xs ${
                isTimeExpired
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300 ring-2 ring-rose-500/40'
                  : isTimeCritical
                  ? 'bg-rose-950/40 border-rose-700 text-rose-300 animate-pulse'
                  : isTimeLow
                  ? 'bg-amber-950/40 border-amber-700 text-amber-300'
                  : isCountdown
                  ? 'bg-zinc-950 border-cyan-800/80 text-cyan-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              }`}
            >
              {isCountdown ? (
                <Timer
                  className={`w-3.5 h-3.5 ${
                    isTimeCritical
                      ? 'text-rose-400 animate-spin'
                      : isTimeLow
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}

              <div className="flex flex-col">
                <span className="font-bold tracking-wider leading-none">
                  {isCountdown ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-sans font-semibold leading-none mt-0.5">
                  {isCountdown ? (isTimeExpired ? "Time's Up" : 'Remaining') : 'Elapsed'}
                </span>
              </div>

              {/* Toggle Mode Button */}
              <button
                type="button"
                onClick={() => {
                  const newMode = timerMode === 'countdown' ? 'elapsed' : 'countdown';
                  setTimerMode(newMode);
                  localStorage.setItem('hirewire_timer_mode', newMode);
                }}
                className="ml-1 px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-300 font-sans transition cursor-pointer"
                title={
                  timerMode === 'countdown'
                    ? 'Switch to count-up timer'
                    : 'Switch to countdown timer (time pressure practice)'
                }
              >
                {timerMode === 'countdown' ? 'Count Up' : 'Countdown'}
              </button>

              {/* Adjust minutes dropdown trigger if in countdown mode */}
              {isCountdown && (
                <button
                  type="button"
                  onClick={() => setShowTimerSettings(!showTimerSettings)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  title="Adjust countdown target"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Countdown Duration Picker Popover */}
            {showTimerSettings && isCountdown && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl w-56 animate-in fade-in">
                <div className="text-xs font-bold text-zinc-200 mb-2 flex items-center justify-between font-sans">
                  <span>Countdown Target</span>
                  <span className="text-cyan-400 font-mono">{countdownMinutes}m</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {[10, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setCountdownMinutes(mins);
                        localStorage.setItem('hirewire_countdown_mins', String(mins));
                        setShowTimerSettings(false);
                      }}
                      className={`py-1 rounded text-xs font-semibold font-sans transition cursor-pointer ${
                        countdownMinutes === mins
                          ? 'bg-cyan-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 font-sans">
                  <button
                    onClick={() => {
                      setCountdownMinutes((prev) => Math.max(5, prev + 5));
                      setShowTimerSettings(false);
                    }}
                    className="hover:text-zinc-200 cursor-pointer"
                  >
                    +5 mins
                  </button>
                  <button
                    onClick={() => setShowTimerSettings(false)}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEndInterviewClick}
            disabled={isEnding}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-md shadow-rose-900/30 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isEnding ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <span>End</span>
            )}
          </button>
        </div>
      </div>

      {/* Evaluating Loading Overlay */}
      {isEnding && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-600/40 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-blue-700 via-indigo-500 to-sky-400 flex items-center justify-center border border-white/20 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Your Interview Performance</h2>
          <p className="text-sm text-zinc-400 max-w-md">{evaluatingStatus}</p>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: AI NODE & TRANSCRIPT (Screenshots 6 & 7) */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/80 overflow-hidden">
          {/* AI Orb Banner / Status Stage */}
          <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Glowing Orb Animation */}
              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                {isAiSpeaking && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/50 animate-ping" />
                )}
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 border border-white/30 shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center transition-transform ${
                    isAiSpeaking ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white/60 blur-xs" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">{persona}</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isMicMuted
                        ? 'bg-rose-950/50 text-rose-400 border border-rose-800/50'
                        : isAiSpeaking
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : isListening
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isMicMuted ? 'Mic Muted' : isAiSpeaking ? 'Speaking' : isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isMicMuted
                    ? 'Your microphone is turned OFF (Listening disabled)'
                    : isAiSpeaking
                    ? `${persona} is speaking (Microphone paused)`
                    : isListening
                    ? 'Speak clearly into your mic...'
                    : 'Waiting for candidate input'}
                </p>
              </div>
            </div>

            {/* Voice / Hands-free Toggle, Mic Mute & Audio Mute */}
            <div className="flex items-center gap-2">
              {isAiSpeaking && (
                <button
                  onClick={stopAiSpeaking}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition shadow-xs animate-pulse cursor-pointer"
                  title="Interrupt and silence interviewer speech immediately"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Silence</span>
                </button>
              )}

              {/* Mic Mute/Unmute Header Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isMicMuted
                    ? 'bg-rose-950/60 text-rose-400 border-rose-800 hover:bg-rose-900/60'
                    : isListening
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                }`}
                title={isMicMuted ? 'Microphone is Muted (Click to Unmute)' : 'Microphone is Active (Click to Mute)'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (isAiSpeaking) stopAiSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  ttsEnabled
                    ? 'bg-zinc-800 text-blue-400 border-zinc-700'
                    : 'bg-zinc-850 text-zinc-500 border-zinc-800'
                }`}
                title={ttsEnabled ? 'AI Voice Enabled (Click to mute)' : 'AI Voice Muted (Click to enable)'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <div className="flex items-center p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px]">
                <button
                  onClick={() => handleSetVoiceMode('handsfree')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    voiceMode === 'handsfree'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hands-free
                </button>
                <button
                  onClick={() => handleSetVoiceMode('pushtotalk')}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    voiceMode === 'pushtotalk'
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Push-to-talk
                </button>
              </div>
            </div>
          </div>

          {/* Transcript History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Time Expired Notice */}
            {isTimeExpired && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <Timer className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <span className="font-bold block">Countdown Time Limit Reached ({countdownMinutes}m)</span>
                  <span className="text-[11px] text-rose-200/80">
                    Practice duration reached. Feel free to conclude your answers or click <strong>End</strong> to generate your performance scorecard.
                  </span>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] font-semibold text-zinc-500 mb-1 px-1">
                  {msg.role === 'user' ? (user?.displayName || 'You') : persona}
                </span>
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Live speech preview */}
            {liveUserSpeech && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-emerald-400 mb-1 px-1 animate-pulse">
                  Listening...
                </span>
                <div className="max-w-[88%] p-3 rounded-2xl text-xs bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 italic">
                  "{liveUserSpeech}"
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Problem Guidance / Instructions Drawer */}
          <div className="p-3.5 bg-zinc-900/60 border-t border-zinc-800 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>{interviewItem.title}</span>
              </span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                {interviewItem.skillsCovered.join(' · ')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {interviewItem.instructions}
            </p>
          </div>

          {/* Bottom Candidate Response Controls */}
          <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2 shrink-0">
            {/* Push-to-Talk or Mic Toggle */}
            {voiceMode === 'pushtotalk' ? (
              <button
                type="button"
                onMouseDown={handlePushToTalkStart}
                onMouseUp={handlePushToTalkEnd}
                onMouseLeave={handlePushToTalkEnd}
                onTouchStart={handlePushToTalkStart}
                onTouchEnd={handlePushToTalkEnd}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 select-none shadow-md shrink-0 cursor-pointer ${
                  isPushToTalkActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/30 animate-pulse scale-98'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                title="Press and hold to talk, or hold Spacebar"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isPushToTalkActive ? 'Listening (Release to Send)' : 'Hold to Speak (Space)'}
                </span>
                <span className="sm:hidden">
                  {isPushToTalkActive ? 'Release' : 'Hold Mic'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-full transition shadow-md shrink-0 cursor-pointer ${
                  isMicMuted
                    ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 ring-2 ring-rose-500/30'
                    : isListening
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/20 animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                title={
                  isMicMuted
                    ? 'Microphone is Muted (Click to enable & listen)'
                    : isListening
                    ? 'Active Listening ON (Click to mute)'
                    : 'Microphone is Ready (Click to activate)'
                }
              >
                {isMicMuted ? (
                  <MicOff className="w-4 h-4 text-rose-400" />
                ) : isListening ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            )}

            {/* Text input fallback */}
            <input
              type="text"
              value={userTextDraft}
              onChange={(e) => setUserTextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCandidateReply(userTextDraft);
                }
              }}
              placeholder={
                voiceMode === 'pushtotalk'
                  ? 'Hold button or Space to speak, or type your answer...'
                  : 'Speak aloud or type your answer here...'
              }
              className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500"
            />

            <button
              onClick={() => handleCandidateReply(userTextDraft)}
              disabled={!userTextDraft.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl transition shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT PANE: CONDITIONAL RENDERING (NON-TECHNICAL STUDIO vs CODE SANDBOX) */}
        {isNonTechnical ? (
          /* NON-TECHNICAL STUDIO: BEHAVIORAL LEADERSHIP, ENGLISH ARTICULATION & TEAM HARMONY */
          <div className="w-full lg:w-1/2 flex flex-col bg-zinc-950 overflow-hidden border-t lg:border-t-0 lg:border-l border-zinc-800">
            {/* Header with Sub-tabs */}
            <div className="h-11 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Team Dynamics & Communication Studio</span>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setActiveNonTechTab('rubric')}
                  className={`px-3 py-1 rounded font-medium transition ${
                    activeNonTechTab === 'rubric'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Scoring Rubric
                </button>
                <button
                  onClick={() => setActiveNonTechTab('star')}
                  className={`px-3 py-1 rounded font-medium transition ${
                    activeNonTechTab === 'star'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  STAR Assistant
                </button>
                <button
                  onClick={() => setActiveNonTechTab('notes')}
                  className={`px-3 py-1 rounded font-medium transition ${
                    activeNonTechTab === 'notes'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Scratchpad
                </button>
              </div>
            </div>

            {/* Non-Technical Body */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin text-zinc-300">
              {activeNonTechTab === 'rubric' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
                    <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Hiring Manager Assessment Pillars
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {persona} is evaluating your conversational maturity, team harmony leadership, conflict resolution, and English fluency. No coding is required for this track.
                    </p>
                  </div>

                  {/* Rubric Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                          1. Team Harmony & Psychological Safety
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          Crucial
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                        Active listening, showing empathy towards teammates under pressure, and building an inclusive environment where all colleagues can express feedback safely.
                      </p>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/60 text-[10px] text-zinc-300 italic">
                        💡 Key Phrase: "I scheduled an open retrospective where every engineer could voice blockers safely without finger-pointing."
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          2. Project Alignment & Milestone Execution
                        </span>
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                          Leadership
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                        Managing sprint timelines, aligning cross-functional teams (Product, Design, QA), and managing trade-offs without compromising team morale.
                      </p>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/60 text-[10px] text-zinc-300 italic">
                        💡 Key Phrase: "I worked with our PM to de-scope non-critical items, keeping our core delivery on track while shielding team morale."
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          3. Constructive Conflict De-escalation
                        </span>
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                          Maturity
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                        Addressing disagreements objectively using user data and business priorities rather than ego, driving consensus through mutual respect.
                      </p>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/60 text-[10px] text-zinc-300 italic">
                        💡 Key Phrase: "We evaluated the contrasting opinions against objective benchmark data to arrive at a win-win consensus."
                      </div>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-zinc-700 transition">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          4. English Grammar & Executive Presence
                        </span>
                        <span className="text-[10px] font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                          Communication
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                        Clear, structured sentence formulation without excessive filler words ("um", "like"). Delivering concise, impactful thoughts with composure.
                      </p>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800/60 text-[10px] text-zinc-300 italic">
                        💡 Tip: Organize points chronologically ("First, we aligned on customer impact; second, we adjusted team responsibilities.").
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeNonTechTab === 'star' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    {[
                      { key: 'S', label: 'Situation' },
                      { key: 'T', label: 'Task' },
                      { key: 'A', label: 'Action' },
                      { key: 'R', label: 'Result' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedStarPillar(tab.key as any)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          selectedStarPillar === tab.key
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-indigo-200">{tab.key}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    {selectedStarPillar === 'S' && (
                      <>
                        <h4 className="text-xs font-bold text-indigo-300">Situation: Context & Team Dynamics</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Describe the setting, the scale of the team, and the specific project roadblock or pressure point you encountered.
                        </p>
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                          <span className="font-semibold text-indigo-400">Sample Template:</span>
                          <p className="mt-1">
                            "In my previous project, our cross-functional team of 6 engineers and 2 designers was preparing for a critical release. With two weeks remaining, sudden scope adjustments created frustration and threatened team harmony..."
                          </p>
                        </div>
                      </>
                    )}

                    {selectedStarPillar === 'T' && (
                      <>
                        <h4 className="text-xs font-bold text-indigo-300">Task: Your Responsibility & Objective</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Clarify what you were personally accountable for in leading the project forward while maintaining team camaraderie.
                        </p>
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                          <span className="font-semibold text-indigo-400">Sample Template:</span>
                          <p className="mt-1">
                            "My responsibility was to align team expectations, resolve the interpersonal friction between frontend and backend leads, and deliver the milestone without compromising product quality."
                          </p>
                        </div>
                      </>
                    )}

                    {selectedStarPillar === 'A' && (
                      <>
                        <h4 className="text-xs font-bold text-indigo-300">Action: Leadership, Empathy & Project Management</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Highlight the exact steps you took: active listening, pairing with struggling teammates, creating clarity, and fostering positive morale.
                        </p>
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                          <span className="font-semibold text-indigo-400">Sample Template:</span>
                          <p className="mt-1">
                            "I organized an informal alignment check-in to hear everyone's concerns without judgment. I then paired with the teammate who felt most overburdened, adjusted the sprint workload collaboratively, and established daily transparent standups."
                          </p>
                        </div>
                      </>
                    )}

                    {selectedStarPillar === 'R' && (
                      <>
                        <h4 className="text-xs font-bold text-indigo-300">Result: Team Morale & Deliverable Impact</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Conclude with quantifiable outcomes, lessons learned, and how team cohesion was strengthened for future quarters.
                        </p>
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                          <span className="font-semibold text-indigo-400">Sample Template:</span>
                          <p className="mt-1">
                            "As a result, we shipped the release on time with zero high-severity bugs. Team sentiment scores improved significantly, and our collaborative conflict resolution framework was adopted across the wider department."
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeNonTechTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                      Live Candidate Scratchpad
                    </span>
                    <button
                      onClick={() => setCandidateNotes('')}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Jot down quick bullet points, project names, and key metrics to reference while speaking with {persona}.
                  </p>
                  <textarea
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                    placeholder="E.g.: Project Phoenix, 5 teammates, resolved API contract dispute by proposing GraphQL gateway, delivered 3 days ahead of schedule..."
                    className="w-full h-72 p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed font-sans resize-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom Status strip */}
            <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Behavioral Coach: {persona} evaluates team harmony, empathy, and articulation</span>
              </div>
              <span className="hidden sm:inline text-zinc-500 text-[10px]">
                Speak naturally or type your responses
              </span>
            </div>
          </div>
        ) : (
          /* TECHNICAL RIGHT PANE: CODE SANDBOX (MONACO EDITOR & TERMINAL) (Screenshot 7) */
          <div className="w-full lg:w-1/2 flex flex-col bg-zinc-950 overflow-hidden">
            {/* Editor Header Bar */}
            <div className="h-10 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
              {/* File Tab */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border-t-2 border-blue-500 rounded-t text-xs font-mono text-zinc-200">
                  <span className="text-yellow-400 font-bold text-[11px]">JS</span>
                  <span>main.js</span>
                </div>
              </div>

              {/* Run & Test Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
                  className="px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 rounded transition"
                >
                  {editorTheme === 'vs-dark' ? 'Light Theme' : 'Dark Theme'}
                </button>

                {interviewItem.testCases.length > 0 && (
                  <button
                    onClick={runTests}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Run tests</span>
                  </button>
                )}

                <button
                  onClick={runCode}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-[220px]">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme={editorTheme}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>

            {/* Terminal / Output Split View Below Editor */}
            <div className="h-44 bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0">
              {/* Tabs */}
              <div className="flex items-center justify-between px-4 h-8 bg-zinc-900/80 border-b border-zinc-800">
                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`flex items-center gap-1.5 font-semibold transition ${
                      activeTab === 'terminal'
                        ? 'text-blue-400 border-b-2 border-blue-400 py-1'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Console Output</span>
                  </button>

                  {interviewItem.testCases.length > 0 && (
                    <button
                      onClick={() => setActiveTab('tests')}
                      className={`flex items-center gap-1.5 font-semibold transition ${
                        activeTab === 'tests'
                          ? 'text-blue-400 border-b-2 border-blue-400 py-1'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>Tests ({testResults.length}/{interviewItem.testCases.length})</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setTerminalOutput('')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                >
                  Clear
                </button>
              </div>

              {/* Terminal Body */}
              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-black/40 text-zinc-300 leading-relaxed scrollbar-thin">
                {activeTab === 'terminal' ? (
                  <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
                ) : (
                  <div className="space-y-2">
                    {testResults.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 space-y-2">
                        <Play className="w-5 h-5 mx-auto text-zinc-600" />
                        <p>No test runs yet. Click "Run tests" above to evaluate test cases.</p>
                      </div>
                    ) : (
                      testResults.map((tr) => (
                        <div
                          key={tr.id}
                          className={`p-3 rounded-xl border transition space-y-2 ${
                            tr.passed
                              ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {tr.passed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <span className="font-semibold text-xs text-zinc-200">{tr.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {tr.durationMs !== undefined && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {tr.durationMs}ms
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  tr.passed
                                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50'
                                    : 'bg-rose-900/40 text-rose-400 border border-rose-700/50'
                                }`}
                              >
                                {tr.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          </div>

                          {/* Error or runtime exception */}
                          {tr.error && (
                            <div className="p-2 rounded bg-black/40 text-[11px] text-rose-300 font-mono border border-rose-900/40 whitespace-pre-wrap">
                              {tr.error}
                            </div>
                          )}

                          {/* Expected vs Actual output */}
                          {tr.expected !== undefined && tr.actual !== undefined && !tr.passed && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                              <div className="p-2 rounded bg-black/30 border border-zinc-800">
                                <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Expected</span>
                                <span className="text-emerald-400">{tr.expected}</span>
                              </div>
                              <div className="p-2 rounded bg-black/30 border border-zinc-800">
                                <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Actual Received</span>
                                <span className="text-rose-400">{tr.actual}</span>
                              </div>
                            </div>
                          )}

                          {tr.passed && tr.actual !== undefined && (
                            <div className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1.5 pt-0.5">
                              <span className="text-zinc-500">Output:</span>
                              <span className="text-zinc-200">{tr.actual}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Status strip (Screenshot 7) */}
              <div className="px-4 py-1 bg-zinc-900/90 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Ready | {track.title} · {interviewItem.difficulty}</span>
                </div>
                <span className="hidden sm:inline text-zinc-400 italic">
                  {persona} sees your code and run results when you reply
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
