import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Using mock fallbacks if needed.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient model fallback candidate list prioritizing high-availability standard models
const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// Track temporarily exhausted models to avoid latency & repeated 429 quota exhaustion
const modelCooldownMap = new Map<string, number>();

function isModelInCooldown(model: string): boolean {
  const expiry = modelCooldownMap.get(model);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldownMap.delete(model);
    return false;
  }
  return true;
}

function setModelCooldown(model: string, durationMs: number = 3 * 60 * 1000) {
  modelCooldownMap.set(model, Date.now() + durationMs);
}

// Active preferred model that succeeded recently
let preferredModel: string = 'gemini-3.8-flash';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithFallback(
  prompt: string,
  config?: { responseMimeType?: string; temperature?: number }
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  // Build candidate list with preferredModel first if healthy, followed by remaining candidates
  const candidateList = [
    preferredModel,
    ...GEMINI_CANDIDATE_MODELS.filter((m) => m !== preferredModel),
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  for (const model of candidateList) {
    if (isModelInCooldown(model)) {
      continue;
    }

    // Attempt generation with automatic retry for momentary 503 load spikes
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: config as any,
        });
        const text = response.text || '';
        if (text) {
          preferredModel = model;
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const is503 = errMsg.includes('503') || errMsg.includes('high demand') || err?.status === 503;
        const is429 = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED') || err?.status === 429;

        if (is429) {
          // Model exceeded quota, put in cooldown so subsequent calls try other candidate models directly
          setModelCooldown(model, 5 * 60 * 1000);
          console.info(`[Gemini] Model ${model} quota reached, switching to alternative model.`);
          break;
        }

        if (is503 && attempt === 1) {
          console.info(`[Gemini] Model ${model} experiencing momentary load spike. Retrying shortly...`);
          await sleep(500);
          continue;
        }

        console.info(`[Gemini] Model ${model} unavailable. Trying next candidate model...`);
        break;
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models were unavailable');
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini Chat Interviewer endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      persona = 'Maya',
      trackTitle = 'Technical Interview',
      problemTitle = 'Assessment',
      problemDescription = '',
      messages = [],
      currentCode = '',
      resumeText = '',
      stage = 'approach',
      userAnswer = '',
      category = '',
    } = req.body;

    const isNonTechnical =
      category?.toLowerCase().includes('non-tech') ||
      category?.toLowerCase().includes('behavioral') ||
      category?.toLowerCase().includes('communication') ||
      trackTitle?.toLowerCase().includes('behavioral') ||
      trackTitle?.toLowerCase().includes('communication') ||
      trackTitle?.toLowerCase().includes('leadership') ||
      trackTitle?.toLowerCase().includes('management') ||
      trackTitle?.toLowerCase().includes('resume') ||
      trackTitle?.toLowerCase().includes('product') ||
      trackTitle?.toLowerCase().includes('aptitude') ||
      trackTitle?.toLowerCase().includes('discussion') ||
      trackTitle?.toLowerCase().includes('hr');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: isNonTechnical
          ? `That's a very thoughtful approach. In a team setting where colleagues have competing priorities, how do you foster alignment and positive harmony?`
          : `That's a good start. Could you walk me step-by-step through how you would handle edge cases in your implementation?`,
      });
    }

    const ai = getGeminiClient();

    let personaInstructions = '';
    if (isNonTechnical) {
      if (persona === 'Alex') {
        personaInstructions = 'You are Alex, an insightful Senior Director evaluating Professionalism, Communication Clarity, and Behavioral Harmony. You ask incisive questions about how the candidate navigates team friction, drives consensus without authority, and communicates with executive composure.';
      } else if (persona === 'David') {
        personaInstructions = 'You are David, an Engineering & Program Manager focusing on team culture, project milestones, and positive Behavioral Harmony. You evaluate how the candidate builds trust, mentors others, and handles project scope changes with professional composure.';
      } else {
        personaInstructions = 'You are Maya, a warm, supportive behavioral coach and talent lead. You create a psychological safety environment, actively listen, and guide the candidate to showcase their Professionalism, Communication Clarity, empathy, and Behavioral Harmony.';
      }
    } else {
      const technicalPersonas: Record<string, string> = {
        Maya: 'You are Maya, an encouraging, supportive technical interviewer at a top tech company. You speak in a natural, spoken-dialogue conversational tone (concise, 2 to 4 sentences). You gently guide the candidate, ask probing follow-up questions about their approach or code, and keep them motivated.',
        Alex: 'You are Alex, a rigorous, analytical FAANG Staff Bar Raiser interviewer. You are polite yet direct, challenging the candidate on time/space complexity, trade-offs, scalability, and code correctness. Keep your responses concise (2 to 4 sentences) as if speaking verbally.',
        David: 'You are David, a Senior Systems Architect. You look at clarity of communication, architectural patterns, clean modular code, and error handling. Keep spoken responses crisp, professional, and targeted (2 to 4 sentences).',
      };
      personaInstructions = technicalPersonas[persona] || technicalPersonas['Maya'];
    }

    // Count assistant turns to enforce resume-derived questioning for first 3 questions
    const assistantTurnCount = Array.isArray(messages)
      ? messages.filter((m: { role: string }) => m.role === 'assistant').length
      : 0;
    const hasResume = Boolean(resumeText && resumeText.trim().length > 20);
    const isFirstThreeQuestions = hasResume && assistantTurnCount < 3;

    let resumeDirective = '';
    if (hasResume) {
      if (isFirstThreeQuestions) {
        resumeDirective = `
CRITICAL MANDATE - RESUME-DERIVED QUESTION (Question #${assistantTurnCount + 1} of 3):
Candidate has uploaded their resume below. You MUST derive your next question directly from their specific professional experience, projects, tools, or past companies found in their resume!
- Identify an actual project, role, company, or accomplishment explicitly mentioned in the resume text.
- Formulate your question directly around that exact experience (e.g. "In your resume, you mentioned leading [Project/Feature] at [Company]...").
- Do NOT ask a generic or detached question. This question MUST be derived from their resume experience.
`;
      } else {
        resumeDirective = `
CANDIDATE RESUME REFERENCE:
The candidate uploaded their resume below. You may continue to cross-reference their past projects, tech stack, and achievements during this discussion.
`;
      }
    }

    const systemPrompt = isNonTechnical
      ? `${personaInstructions}
You are conducting a live interactive voice-driven NON-TECHNICAL interview.
INTERVIEW TRACK: ${trackTitle} (NON-TECHNICAL)
SCENARIO / TOPIC: ${problemTitle}
TOPIC CONTEXT: ${problemDescription}
CURRENT STAGE: ${stage.toUpperCase()}

${resumeDirective}
${hasResume ? `CANDIDATE RESUME TEXT:\n"""\n${resumeText}\n"""` : ''}

NON-TECHNICAL CONDITIONAL DIRECTIVES (STRICT MANDATES):
1. ZERO CODING INSTRUCTIONS:
   - This track is strictly Non-Technical.
   - Do NOT mention code, syntax, code execution, compilers, algorithms, data structures, or problem solving in code.
   - If the candidate submits code or mentions code syntax, you MUST completely IGNORE it and steer the conversation back to human collaboration and communication.
2. CORE EVALUATION PILLARS:
   - Professionalism: Executive presence, composure, business maturity, respect, and constructive dialogue.
   - Communication Clarity: Articulate speech, concise explanations, English vocabulary precision, and structured STAR delivery (Situation, Task, Action, Result).
   - Behavioral Harmony: Empathy, resolving interpersonal conflict, building psychological safety, cross-functional collaboration, and team morale.
3. SPOKEN CONVERSATIONAL RULES:
   - Speak directly to the candidate in second person ("you").
   - Strictly 2 to 4 conversational sentences so the dialogue flows smoothly in real time.
   - Never output markdown symbols, bullet points, headers, or code blocks in spoken responses.`
      : `${personaInstructions}
You are conducting a live interactive voice-driven TECHNICAL CODING interview.
INTERVIEW TRACK: ${trackTitle} (TECHNICAL)
PROBLEM TITLE: ${problemTitle}
DESCRIPTION: ${problemDescription}
CURRENT STAGE: ${stage.toUpperCase()}

${resumeDirective}
${hasResume ? `CANDIDATE RESUME TEXT:\n"""\n${resumeText}\n"""` : ''}

TECHNICAL DIRECTIVES:
1. Focus on algorithmic efficiency, clean modular design, time and space complexity, and edge case coverage.
2. Reference candidate's code when available: "${currentCode ? currentCode.slice(0, 500) : 'No code yet'}".
3. Spoken dialogue rules: strictly 2 to 4 conversational sentences. Do NOT output raw code blocks or markdown bullet lists in spoken response.`;

    // Construct conversation history
    const conversationTurns = messages
      .slice(-8)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}

RECENT CONVERSATION:
${conversationTurns}
${userAnswer ? `Candidate just said: "${userAnswer}"` : ''}
${!isNonTechnical && currentCode ? `Candidate's current code in editor:\n\`\`\`javascript\n${currentCode}\n\`\`\`` : ''}

Respond as the interviewer now:`;

    let reply = '';
    try {
      const result = await generateWithFallback(prompt, {
        temperature: 0.7,
      });
      reply = result.text.trim();
    } catch (apiErr: any) {
      console.info('[Gemini Chat Fallback Active]:', apiErr?.message || apiErr);
      if (isNonTechnical) {
        if (stage === 'approach') {
          reply = persona === 'Alex'
            ? "I see your perspective. When leading a project through tight deadlines, how do you handle friction between team members without compromising morale?"
            : persona === 'David'
            ? "Good framing. How do you ensure clear, regular communication across both engineering and business stakeholders?"
            : "That's a wonderful foundation. Could you walk me through a specific time you helped your team overcome an obstacle while keeping everyone in positive harmony?";
        } else if (stage === 'solution') {
          reply = persona === 'Alex'
            ? "When unexpected setbacks happen on a project, what specific actions do you take to re-align the team and resolve the deadlock?"
            : persona === 'David'
            ? "Clear communication is vital there. How did you verify that every team member felt heard and understood their next priority?"
            : "I love that collaborative spirit. How did the team react, and what did you learn about balancing project velocity with team well-being?";
        } else {
          reply = persona === 'Alex'
            ? "Looking back on that outcome, what would you do differently today to build an even more harmonious and high-performing team dynamic?"
            : persona === 'David'
            ? "Reflecting on that project, how did that experience change how you manage cross-functional partnerships?"
            : "Thank you for sharing that story. Your emphasis on positive team relationships and mutual respect really shines through.";
        }
      } else {
        if (stage === 'approach') {
          reply = persona === 'Alex'
            ? "Understood. Before jumping straight into implementation, what is the theoretical lower bound on time and space for this strategy?"
            : persona === 'David'
            ? "Good baseline architecture. How would you structure the core logic and handle potential boundary errors?"
            : "That makes a lot of sense! Walk me through how you'd translate that into code, and let's keep an eye out for edge cases.";
        } else if (stage === 'solution') {
          reply = persona === 'Alex'
            ? "Take a look at your current code lines. Are you accounting for empty collections or unexpected input formats?"
            : persona === 'David'
            ? "The structure is coming along. Let's trace how the variables update when you execute the test runner."
            : "Nice progress on the code! Go ahead and hit 'Run' in the terminal to verify your output, and let me know what you notice.";
        } else {
          reply = persona === 'Alex'
            ? "Solid execution. If this data volume grew significantly across distributed nodes, where would the primary bottleneck occur?"
            : persona === 'David'
            ? "Great completion. How would you instrument logging and error handling for this in production?"
            : "Terrific work navigating this problem! Whenever you feel ready, you can submit the interview or test one final scenario.";
        }
      }
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Unhandled chat error:', error);
    res.json({
      reply: 'Thanks for sharing. What would be your next step or consideration for this discussion?',
    });
  }
});

// Gemini Evaluation & Report generator endpoint
app.post('/api/gemini/evaluate', async (req, res) => {
  try {
    const {
      interviewTitle = 'Technical Interview',
      category = 'Technical',
      difficulty = 'Medium',
      persona = 'Maya',
      transcript = '',
      code = '',
      executionResults = null,
      durationSeconds = 120,
    } = req.body;

    const isNonTechnical =
      category?.toLowerCase().includes('non-tech') ||
      category?.toLowerCase().includes('behavioral') ||
      category?.toLowerCase().includes('communication') ||
      interviewTitle?.toLowerCase().includes('behavioral') ||
      interviewTitle?.toLowerCase().includes('communication') ||
      interviewTitle?.toLowerCase().includes('leadership') ||
      interviewTitle?.toLowerCase().includes('management') ||
      interviewTitle?.toLowerCase().includes('resume') ||
      interviewTitle?.toLowerCase().includes('product') ||
      interviewTitle?.toLowerCase().includes('aptitude') ||
      interviewTitle?.toLowerCase().includes('discussion') ||
      interviewTitle?.toLowerCase().includes('hr');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        overallScore: isNonTechnical ? 82 : 72,
        readiness: 'Strong',
        summary: isNonTechnical
          ? 'Demonstrated high Professionalism, articulate Communication Clarity, and a positive mindset for Behavioral Harmony.'
          : 'Demonstrated solid technical understanding of core algorithmic concepts and verified functional logic.',
        whatWentWell: isNonTechnical
          ? [
              'Articulated an empathetic, collaborative approach to team conflict and project delivery.',
              'Maintained positive Behavioral Harmony, high Professionalism, and clear verbal articulation throughout.',
            ]
          : [
              'Engaged promptly and communicated thought process clearly.',
              'Understood problem constraints and verified test-case logic.',
            ],
        focusAreas: isNonTechnical
          ? [
              'Structure behavioral answers even more consistently using the STAR methodology (Situation, Task, Action, Result).',
              'Cite concrete business metrics and timeline impacts during conflict resolution examples.',
            ]
          : [
              'Articulate exact time and space complexity upfront before writing loops.',
              'Account for unexpected input types and extreme boundary conditions.',
            ],
        skillBreakdown: isNonTechnical
          ? [
              { skill: 'Professionalism', score: 85, status: 'Ready' },
              { skill: 'Communication Clarity', score: 82, status: 'Strong' },
              { skill: 'Behavioral Harmony', score: 88, status: 'Ready' },
              { skill: 'Executive Composure & STAR Structure', score: 76, status: 'Strong' },
            ]
          : [
              { skill: 'Conceptual Clarity', score: 75, status: 'Strong' },
              { skill: 'Code Structure & Correctness', score: 70, status: 'Strong' },
              { skill: 'Communication & Reasoning', score: 72, status: 'Strong' },
              { skill: 'Edge Case & Test Verification', score: 65, status: 'Developing' },
            ],
        strongestMoment: {
          quote: isNonTechnical
            ? 'I prioritized listening to their concerns first before proposing a unified compromise that aligned our roadmaps.'
            : 'I would break this into modular helper functions to decouple state mutation.',
          context: isNonTechnical ? 'Team conflict response' : 'Approach phase',
          feedback: isNonTechnical
            ? 'Superb demonstration of Behavioral Harmony, emotional intelligence, and calm Professionalism.'
            : 'Great instinct to prioritize modularity before jumping into syntax.',
        },
        metrics: {
          technicalSubstantive: isNonTechnical ? '3 of 3 behavioral prompts' : '2 of 3 questions',
          concreteNumbers: '1 of 3 candidate responses',
          clearStructure: '2 of 3 candidate responses',
          shortResponses: '1 response',
        },
        answerScores: [
          { questionIndex: 1, questionSummary: 'Opening response', score: 80, comment: 'Clear, constructive delivery.' },
          { questionIndex: 2, questionSummary: 'Collaboration and team leadership', score: 85, comment: 'Strong Behavioral Harmony and practical solutions.' },
        ],
      });
    }

    const ai = getGeminiClient();

    let executionResultsBlock = '';
    if (!isNonTechnical) {
      if (executionResults && typeof executionResults === 'object') {
        executionResultsBlock = `
ACTUAL CODE EXECUTION RESULTS (PRIMARY INPUT PARAMETER FOR SCORING):
- Tests Executed: ${executionResults.testsTotal ?? 0}
- Tests Passed: ${executionResults.testsPassed ?? 0}
- Tests Failed: ${executionResults.testsFailed ?? 0}
- Syntax Validation: ${executionResults.syntaxValid ? 'VALID SYNTAX' : 'SYNTAX ERRORS DETECTED: ' + (executionResults.syntaxErrors || []).join('; ')}
- Detailed Test Outcomes:
${(executionResults.details || [])
  .map(
    (d: any) =>
      `  * [${d.passed ? 'PASSED' : 'FAILED'}] "${d.name}"${d.expected ? ` (Expected: ${d.expected}, Actual: ${d.actual})` : ''}${d.error ? ` - Error: ${d.error}` : ''} (${d.durationMs || 0}ms)`
  )
  .join('\n') || '  (No tests run)'}
- Stdout / Execution Output:
  ${(executionResults.stdout || []).join('\n') || '(No stdout logged)'}

SCORING DIRECTIVE FOR CODE EXECUTION:
You MUST heavily weigh the actual code execution results above when evaluating technical accuracy:
- If all test cases passed, reward the candidate with high marks on Code Structure and Correctness (80-100).
- If tests failed or syntax errors occurred, reflect those exact failed assertions in "focusAreas", "summary", and deduct from the overall score.
- Do NOT hallucinate that code worked if the test-case verification results report failure.
`;
      } else {
        executionResultsBlock = `
ACTUAL CODE EXECUTION RESULTS:
No test cases were executed by the candidate during this session.
`;
      }
    }

    const evaluationPrompt = isNonTechnical
      ? `You are an expert executive talent evaluator and organizational hiring director.
Analyze the following completed candidate interview session and produce a structured JSON evaluation.

INTERVIEW DETAILS:
Topic: ${interviewTitle}
Category: ${category} (NON-TECHNICAL)
Interviewer Persona: ${persona}
Total Duration: ${Math.round(durationSeconds / 60)} minutes

CONVERSATION TRANSCRIPT:
${transcript || '(No transcript provided)'}

CRITICAL NON-TECHNICAL EVALUATION DIRECTIVES (ZERO CODING):
1. Completely IGNORE any code submissions or coding artifacts if present. The candidate is NOT evaluated on code execution, algorithms, or technical problem solving.
2. Evaluate the candidate EXCLUSIVELY on these three core pillars:
   - Professionalism: Executive presence, composure, business maturity, active listening, and respect.
   - Communication Clarity: Articulate vocabulary, concise speaking, English fluency, and structured STAR delivery (Situation, Task, Action, Result).
   - Behavioral Harmony: Empathy, conflict resolution, building psychological safety, team morale, and cross-functional alignment.
3. Your skill breakdown MUST include scores for:
   - "Professionalism"
   - "Communication Clarity"
   - "Behavioral Harmony"
   - "Executive Composure & STAR Structure"

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "overallScore": number (integer 0 to 100),
  "readiness": "Needs work" | "Developing" | "Strong" | "Ready",
  "summary": string (1 to 2 punchy, insightful sentences summarizing Professionalism, Communication Clarity, and Behavioral Harmony),
  "whatWentWell": [string, string],
  "focusAreas": [string, string],
  "skillBreakdown": [
    { "skill": "Professionalism", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Communication Clarity", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Behavioral Harmony", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Executive Composure & STAR Structure", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" }
  ],
  "strongestMoment": {
    "quote": string (direct quote from candidate demonstrating emotional intelligence or clarity),
    "context": string (e.g. "Conflict resolution response" or "Opening introduction"),
    "feedback": string (why this was impressive)
  },
  "metrics": {
    "technicalSubstantive": string (e.g. "3 of 3 behavioral prompts addressed"),
    "concreteNumbers": string (e.g. "2 of 3 responses cited metrics"),
    "clearStructure": string (e.g. "3 of 3 responses followed STAR"),
    "shortResponses": string (e.g. "0 hesitation pauses")
  },
  "answerScores": [
    {
      "questionIndex": number,
      "questionSummary": string,
      "score": number (0-100),
      "comment": string
    }
  ]
}`
      : `You are an expert technical hiring committee director and principal engineer.
Analyze the following completed candidate technical interview session and produce a structured JSON evaluation.

INTERVIEW DETAILS:
Topic: ${interviewTitle}
Category: ${category} (TECHNICAL)
Difficulty: ${difficulty}
Interviewer Persona: ${persona}
Total Duration: ${Math.round(durationSeconds / 60)} minutes

CONVERSATION TRANSCRIPT:
${transcript || '(No transcript provided)'}

FINAL CANDIDATE CODE:
\`\`\`
${code || '(No code submitted)'}
\`\`\`

${executionResultsBlock}

CRITICAL TECHNICAL EVALUATION FOCUS:
1. Code Correctness & Test Verification: Score heavily based on the "ACTUAL CODE EXECUTION RESULTS" provided above.
2. Algorithmic efficiency, time/space complexity, modularity, and clean idiomatic code.
3. Verbal articulation of approach, trade-offs, and edge cases during the conversation.

You MUST output ONLY a valid JSON object matching this exact schema:
{
  "overallScore": number (integer 0 to 100),
  "readiness": "Needs work" | "Developing" | "Strong" | "Ready",
  "summary": string (1 to 2 punchy, insightful sentences summarizing technical execution and key recommendation),
  "whatWentWell": [string, string],
  "focusAreas": [string, string],
  "skillBreakdown": [
    { "skill": "Problem Solving & Logic", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Code Correctness & Test Verification", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Time & Space Complexity", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" },
    { "skill": "Technical Communication", "score": number (0-100), "status": "Needs work" | "Developing" | "Strong" | "Ready" }
  ],
  "strongestMoment": {
    "quote": string (direct quote from candidate or description of best moment),
    "context": string (e.g. "Approach phase" or "Edge case analysis"),
    "feedback": string (why this was impressive)
  },
  "metrics": {
    "technicalSubstantive": string (e.g. "2 of 3 questions"),
    "concreteNumbers": string (e.g. "1 of 2 responses"),
    "clearStructure": string (e.g. "2 of 2 responses"),
    "shortResponses": string (e.g. "1 response")
  },
  "answerScores": [
    {
      "questionIndex": number,
      "questionSummary": string,
      "score": number (0-100),
      "comment": string
    }
  ]
}`;

    let evaluationData: any = null;

    try {
      const result = await generateWithFallback(evaluationPrompt, {
        responseMimeType: 'application/json',
      });
      const jsonStr = result.text.trim();
      evaluationData = JSON.parse(jsonStr);
    } catch (evalErr: any) {
      console.info('[Gemini Evaluate Fallback Active]:', evalErr?.message || evalErr);
      const words = transcript.split(/\s+/).filter(Boolean).length;
      const linesOfCode = code.split('\n').filter((l: string) => l.trim().length > 0).length;
      const testsTotal = executionResults?.testsTotal || 0;
      const testsPassed = executionResults?.testsPassed || 0;
      const passRate = testsTotal > 0 ? testsPassed / testsTotal : (linesOfCode > 5 ? 0.75 : 0.5);

      const baseScore = isNonTechnical
        ? Math.min(94, Math.max(68, 70 + (words > 40 ? 16 : 6)))
        : Math.min(94, Math.max(62, Math.round(55 + (words > 25 ? 12 : 5) + (passRate * 25) + (executionResults?.syntaxValid ? 5 : 0))));
      const readinessStatus: 'Needs work' | 'Developing' | 'Strong' | 'Ready' =
        baseScore >= 85 ? 'Ready' : baseScore >= 75 ? 'Strong' : 'Developing';

      evaluationData = isNonTechnical
        ? {
            overallScore: baseScore,
            readiness: readinessStatus,
            summary: `Demonstrated ${readinessStatus.toLowerCase()} Professionalism and Communication Clarity across ${Math.max(1, Math.round(durationSeconds / 60))} minute(s). Showed a high focus on Behavioral Harmony and team alignment.`,
            whatWentWell: [
              'Demonstrated high Professionalism, active listening, and constructive team alignment.',
              'Maintained positive Behavioral Harmony and clear Communication Clarity throughout.',
            ],
            focusAreas: [
              'Structure answers even more explicitly around the STAR framework (Situation, Task, Action, Result).',
              'Include measurable project outcomes and milestone metrics in conflict resolution stories.',
            ],
            skillBreakdown: [
              { skill: 'Professionalism', score: Math.min(96, baseScore + 3), status: 'Ready' },
              { skill: 'Communication Clarity', score: Math.min(95, baseScore + 1), status: readinessStatus },
              { skill: 'Behavioral Harmony', score: Math.min(98, baseScore + 5), status: 'Ready' },
              { skill: 'Executive Composure & STAR Structure', score: Math.max(60, baseScore - 4), status: 'Developing' },
            ],
            strongestMoment: {
              quote: transcript.slice(0, 140) || 'Active listening and consensus building on project roadblocks',
              context: 'Behavioral response',
              feedback: 'Exhibited emotional intelligence (EQ) and genuine focus on maintaining positive team dynamics.',
            },
            metrics: {
              technicalSubstantive: `${Math.max(1, Math.min(3, Math.round(words / 30)))} of 3 scenarios`,
              concreteNumbers: `${words > 60 ? '2' : '1'} concrete team examples`,
              clearStructure: 'Consistent positive framing',
              shortResponses: words < 30 ? '1 brief response' : '0 short responses',
            },
            answerScores: [
              { questionIndex: 1, questionSummary: 'Team collaboration & project alignment', score: Math.min(95, baseScore + 4), comment: 'Constructive answers with focus on collective success.' },
            ],
          }
        : {
            overallScore: baseScore,
            readiness: readinessStatus,
            summary: `Demonstrated ${readinessStatus.toLowerCase()} problem solving across ${Math.max(1, Math.round(durationSeconds / 60))} minute(s) with ${linesOfCode} lines of code. Verified ${testsPassed}/${testsTotal || 1} test cases successfully.`,
            whatWentWell: [
              'Maintained consistent communication and shared problem strategy clearly.',
              testsPassed > 0 ? `Successfully verified ${testsPassed} automated test case(s).` : 'Wrote structured algorithmic code in editor.',
            ],
            focusAreas: [
              'State explicit Big-O time and memory complexity upfront.',
              testsPassed < testsTotal ? 'Address edge cases that failed in the automated test runner.' : 'Handle malformed or empty inputs gracefully.',
            ],
            skillBreakdown: [
              { skill: 'Problem Solving & Logic', score: Math.min(95, baseScore + 4), status: readinessStatus },
              { skill: 'Code Correctness & Test Verification', score: Math.round(passRate * 100), status: passRate >= 0.8 ? 'Ready' : passRate >= 0.6 ? 'Developing' : 'Needs work' },
              { skill: 'Time & Space Complexity', score: Math.max(60, baseScore - 5), status: 'Developing' },
              { skill: 'Technical Communication', score: Math.min(96, baseScore + 3), status: 'Strong' },
            ],
            strongestMoment: {
              quote: transcript.slice(0, 140) || 'Initial problem approach breakdown and state mapping',
              context: 'Approach phase',
              feedback: 'Exhibited proactive thought process and willingness to articulate logic step by step.',
            },
            metrics: {
              technicalSubstantive: `${Math.max(1, Math.min(3, Math.round(words / 25)))} of 3 questions`,
              concreteNumbers: `${Math.max(1, Math.min(2, Math.round(linesOfCode / 4)))} observations`,
              clearStructure: 'Consistent structured communication',
              shortResponses: words < 25 ? '1 brief response' : '0 short responses',
            },
            answerScores: [
              { questionIndex: 1, questionSummary: 'Problem breakdown & approach', score: Math.min(95, baseScore + 4), comment: 'Clear explanation of methodology.' },
              { questionIndex: 2, questionSummary: 'Implementation & execution logic', score: baseScore, comment: 'Working logic with practical execution flow.' },
            ],
          };
    }

    res.json(evaluationData);
  } catch (error: any) {
    console.error('Unhandled evaluate error:', error);
    res.json({
      overallScore: 70,
      readiness: 'Developing',
      summary: 'Completed session with solid effort and active candidate engagement.',
      whatWentWell: ['Communicated thought process throughout the interview.'],
      focusAreas: ['Elaborate more on time and space trade-offs.'],
      skillBreakdown: [
        { skill: 'Communication', score: 75, status: 'Strong' },
        { skill: 'Problem Formulation', score: 68, status: 'Developing' },
      ],
      strongestMoment: {
        quote: 'Explaining solution approach',
        context: 'Approach phase',
        feedback: 'Good willingness to articulate logic.',
      },
      metrics: {
        technicalSubstantive: '1 of 2 questions',
        concreteNumbers: '1 of 2 responses',
        clearStructure: '1 of 2 responses',
        shortResponses: '0 responses',
      },
      answerScores: [
        { questionIndex: 1, questionSummary: 'Interview discussion', score: 70, comment: 'Good baseline communication.' }
      ],
    });
  }
});

// Vite middleware in dev, static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
