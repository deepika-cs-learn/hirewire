export type TrackCategory = 'technical' | 'non-technical';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type InterviewType = 'Live coding' | 'Voice interview';

export interface TestCase {
  id: string;
  name: string;
  testCode: string;
  description?: string;
}

export interface InterviewItem {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  durationMin: number;
  type: InterviewType;
  description: string;
  skillsCovered: string[];
  starterCode: string;
  testCases: TestCase[];
  instructions: string;
  exampleCall?: string;
}

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'js' | 'python' | 'node' | 'typescript' | 'go' | 'sql' | 'behavioral' | 'resume' | 'communication' | 'product' | 'aptitude' | 'discussion';
  category: TrackCategory;
  description: string;
  interviewCount: number;
  items: InterviewItem[];
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: number;
}

export interface SkillScore {
  skill: string;
  score: number;
  status: 'Needs work' | 'Developing' | 'Strong' | 'Ready';
}

export interface AnswerScore {
  questionIndex: number;
  questionSummary: string;
  score: number;
  comment: string;
}

export interface EvaluationReport {
  overallScore: number;
  readiness: 'Needs work' | 'Developing' | 'Strong' | 'Ready';
  summary: string;
  whatWentWell: string[];
  focusAreas: string[];
  skillBreakdown: SkillScore[];
  strongestMoment: {
    quote: string;
    context: string;
    feedback: string;
  };
  metrics: {
    technicalSubstantive: string;
    concreteNumbers: string;
    clearStructure: string;
    shortResponses: string;
  };
  answerScores: AnswerScore[];
}

export interface InterviewSession {
  id?: string;
  userId: string;
  userEmail?: string;
  trackId: string;
  interviewId: string;
  title: string;
  category: string;
  persona: string;
  inputMode: 'voice' | 'chat';
  difficulty: DifficultyLevel;
  durationMinutes: number;
  timeSpentSeconds: number;
  code: string;
  transcript: string;
  evaluation?: EvaluationReport;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  targetRole?: string;
}
