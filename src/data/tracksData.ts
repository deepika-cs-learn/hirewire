import { Track } from '../types';

export const TRACKS_DATA: Track[] = [
  // --- TECHNICAL TRACKS ---
  {
    id: 'frontend',
    title: 'Frontend',
    subtitle: 'JS, React, CSS, browser internals',
    iconType: 'js',
    category: 'technical',
    description: 'Master JavaScript engine internals, closures, modern React 18 patterns, CSS architecture, and browser DOM rendering performance.',
    interviewCount: 4,
    items: [
      {
        id: 'fe-js-fundamentals',
        title: 'JavaScript fundamentals',
        difficulty: 'Easy',
        durationMin: 20,
        type: 'Live coding',
        description: 'Core language questions with two short coding exercises covering lexical scope, closures, and Promises.',
        skillsCovered: ['Closures', 'Async', 'Event loop'],
        starterCode: `function makeCounter() {
  // TODO: return an independent counter function that increments an internal count on each call

}

function delay(ms) {
  // TODO: return a Promise that resolves after ms milliseconds

}

// Test your solution:
const c = makeCounter();
if (typeof c === 'function') {
  console.log('c():', c(), c(), c());
}`,
        testCases: [
          {
            id: 'tc-1',
            name: 'Counters stay independent',
            testCode: `if (typeof makeCounter !== 'function') throw new Error("makeCounter is not defined");
const c1 = makeCounter();
const c2 = makeCounter();
if (typeof c1 !== 'function' || typeof c2 !== 'function') throw new Error("makeCounter must return a function");
const v1 = c1();
const v2 = c1();
const v3 = c2();
if (v1 === 1 && v2 === 2 && v3 === 1) return true;
throw new Error("Counters failed: expected [1, 2, 1] but received [" + v1 + ", " + v2 + ", " + v3 + "]");`,
            description: 'Verifies that multiple instances retain separate closure memory.'
          },
          {
            id: 'tc-2',
            name: 'Delay returns a Promise',
            testCode: `if (typeof delay !== 'function') throw new Error("delay is not defined");
const p = delay(10);
if (p instanceof Promise) return true;
throw new Error("delay(ms) must return a Promise instance");`,
            description: 'Checks Promise instantiation.'
          }
        ],
        instructions: 'Implement `makeCounter()` so each call returns an independent counter function that increments on each call. Implement `delay(ms)` returning a Promise that resolves after `ms` milliseconds. Talk through your reasoning as you go.',
        exampleCall: 'const c = makeCounter();\nc(); // 1\nc(); // 2\nawait delay(100);'
      },
      {
        id: 'fe-css-layout',
        title: 'CSS & layout deep-dive',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Voice interview',
        description: 'Conversational deep-dive — no heavy coding, pure architectural reasoning on layout models and rendering optimization.',
        skillsCovered: ['Flexbox', 'Grid', 'Specificity', 'Reflows'],
        starterCode: `/* Discuss CSS Stacking Contexts and Flex vs Grid */
// Question: How does CSS Specificity calculate cascade hierarchy?
// What triggers reflow versus repaint in modern browser engines?`,
        testCases: [],
        instructions: 'The interviewer will ask questions regarding modern responsive layout models, BEM vs Utility CSS, CSS containment, and performance debugging in Chrome DevTools.',
      },
      {
        id: 'fe-react-patterns',
        title: 'React component patterns',
        difficulty: 'Medium',
        durationMin: 30,
        type: 'Live coding',
        description: 'Build and reason about custom hooks, concurrent rendering, and resilient component composition.',
        skillsCovered: ['Hooks', 'State', 'Rendering', 'Memoization'],
        starterCode: `// Implement a custom debounce utility
function debounce(fn, waitMs) {
  // TODO: Return a function that cancels prior timers and invokes fn after waitMs of silence

}

// Example usage:
const log = debounce(() => console.log('Called!'), 50);
log();`,
        testCases: [
          {
            id: 'tc-deb-1',
            name: 'Debounce cancels intermediate rapid calls',
            testCode: `if (typeof debounce !== 'function') throw new Error("debounce is not defined");
let invocationCount = 0;
const debounced = debounce(() => { invocationCount++; }, 40);
if (typeof debounced !== 'function') throw new Error("debounce must return a wrapped function");
debounced();
debounced();
debounced();
if (invocationCount !== 0) throw new Error("Debounce invoked target function immediately instead of waiting for delay");
return true;`,
            description: 'Verifies debounce delays invocation and batches rapid successive calls.'
          }
        ],
        instructions: 'Implement a debounce function in pure JavaScript that batches rapid events into a single invocation after the specified delay.',
      },
      {
        id: 'fe-browser-perf',
        title: 'Browser performance & DOM',
        difficulty: 'Hard',
        durationMin: 30,
        type: 'Voice interview',
        description: 'Core Web Vitals, Virtual DOM diffing algorithms, Web Workers, and memory leak analysis.',
        skillsCovered: ['LCP', 'CLS', 'FID/INP', 'Garbage Collection'],
        starterCode: `// Architecture Notes:
// 1. Largest Contentful Paint (LCP) optimization strategies
// 2. Offloading heavy compute to Web Workers`,
        testCases: [],
        instructions: 'Articulate strategies to diagnose 60 FPS frame drops, identify memory leaks in closures, and optimize critical rendering path.'
      }
    ]
  },
  {
    id: 'dsa',
    title: 'DSA / Problem solving',
    subtitle: 'Data structures, algorithms, complexity',
    iconType: 'python',
    category: 'technical',
    description: 'Ace algorithmic coding interviews covering arrays, hash tables, trees, dynamic programming, and big-O efficiency.',
    interviewCount: 4,
    items: [
      {
        id: 'dsa-two-sum',
        title: 'Two Sum & Hash Maps',
        difficulty: 'Easy',
        durationMin: 20,
        type: 'Live coding',
        description: 'Classic algorithmic problem: find two indices whose elements add up to a target with O(n) runtime.',
        skillsCovered: ['Arrays', 'Hash Maps', 'Time Complexity'],
        starterCode: `function twoSum(nums, target) {
  // TODO: Return indices [i, j] of the two numbers that add up to target in O(n) time
  // Example: twoSum([2, 7, 11, 15], 9) -> [0, 1]

}

// Example execution:
console.log('twoSum([2, 7, 11, 15], 9):', twoSum([2, 7, 11, 15], 9));`,
        testCases: [
          {
            id: 'tc-dsa-1',
            name: 'Finds complementary indices correctly',
            testCode: `if (typeof twoSum !== 'function') throw new Error("twoSum is not defined");
const res1 = twoSum([2, 7, 11, 15], 9);
if (!Array.isArray(res1) || res1.length !== 2) throw new Error("Expected array of 2 indices, received: " + JSON.stringify(res1));
const sorted1 = [...res1].sort((a, b) => a - b);
if (sorted1[0] !== 0 || sorted1[1] !== 1) throw new Error("Failed test case 1: expected [0, 1] for target 9, received: " + JSON.stringify(res1));

const res2 = twoSum([3, 2, 4], 6);
if (!Array.isArray(res2) || res2.length !== 2) throw new Error("Expected array of 2 indices, received: " + JSON.stringify(res2));
const sorted2 = [...res2].sort((a, b) => a - b);
if (sorted2[0] !== 1 || sorted2[1] !== 2) throw new Error("Failed test case 2: expected [1, 2] for target 6, received: " + JSON.stringify(res2));

const res3 = twoSum([3, 3], 6);
const sorted3 = [...res3].sort((a, b) => a - b);
if (sorted3[0] !== 0 || sorted3[1] !== 1) throw new Error("Failed test case 3: expected [0, 1] for duplicates, received: " + JSON.stringify(res3));

return true;`,
            description: 'Returns correct indices for basic and duplicate matches.'
          }
        ],
        instructions: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Aim for O(n) time complexity.'
      },
      {
        id: 'dsa-valid-parentheses',
        title: 'Valid Parentheses & Stack',
        difficulty: 'Easy',
        durationMin: 20,
        type: 'Live coding',
        description: 'Verify matching brackets using a stack data structure with O(n) time and O(n) space.',
        skillsCovered: ['Stack', 'Strings', 'Boundary Conditions'],
        starterCode: `function isValid(s) {
  // TODO: Return true if all brackets in s are closed by matching pairs in the correct order
  // Example: isValid("()[]{}") -> true, isValid("(]") -> false

}

// Example execution:
console.log('isValid("()[]{}"):', isValid("()[]{}"));`,
        testCases: [
          {
            id: 'tc-dsa-stack',
            name: 'Validates bracket nesting and ordering',
            testCode: `if (typeof isValid !== 'function') throw new Error("isValid is not defined");
if (isValid("()") !== true) throw new Error('Failed on simple pair "()"');
if (isValid("()[]{}") !== true) throw new Error('Failed on multi-pair "()[]{}"');
if (isValid("(]") !== false) throw new Error('Failed on mismatched pair "(]" (expected false)');
if (isValid("([)]") !== false) throw new Error('Failed on interleaved brackets "([)]" (expected false)');
if (isValid("{[]}") !== true) throw new Error('Failed on nested brackets "{[]}" (expected true)');
if (isValid("[") !== false) throw new Error('Failed on unclosed bracket "[" (expected false)');
return true;`,
            description: 'Tests balanced vs unbalanced vs unclosed bracket sequences.'
          }
        ],
        instructions: 'Determine if the input string has valid matching parentheses and brackets.'
      },
      {
        id: 'dsa-binary-tree-level-order',
        title: 'Tree BFS & Level Order',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Live coding',
        description: 'Breadth-First Search traversal across binary tree levels using a queue.',
        skillsCovered: ['Trees', 'BFS', 'Queues'],
        starterCode: `function levelOrder(root) {
  // TODO: Return 2D array representing nodes at each level from left to right

}

// Tree node definition: { val: number, left?: node, right?: node }`,
        testCases: [
          {
            id: 'tc-tree-1',
            name: 'Level traversal structure and empty check',
            testCode: `if (typeof levelOrder !== 'function') throw new Error("levelOrder is not defined");
if (JSON.stringify(levelOrder(null)) !== '[]') throw new Error("Failed on empty/null root: expected []");
const sample = { val: 3, left: { val: 9 }, right: { val: 20, left: { val: 15 }, right: { val: 7 } } };
const res = levelOrder(sample);
const expected = JSON.stringify([[3], [9, 20], [15, 7]]);
if (JSON.stringify(res) !== expected) throw new Error("Failed BFS level order: expected " + expected + " but received " + JSON.stringify(res));
return true;`,
            description: 'Returns array of arrays grouped by level depth.'
          }
        ],
        instructions: 'Traverse a binary tree in level order from top to bottom, grouping values per level.'
      }
    ]
  },
  {
    id: 'backend',
    title: 'Backend',
    subtitle: 'APIs, services, data modeling, caching',
    iconType: 'node',
    category: 'technical',
    description: 'Design robust server architectures with Node.js, Express, async concurrency, connection pooling, and caching.',
    interviewCount: 3,
    items: [
      {
        id: 'be-rate-limiter',
        title: 'Token Bucket Rate Limiter',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Live coding',
        description: 'Implement an in-memory token bucket algorithm to protect endpoints against traffic spikes.',
        skillsCovered: ['Rate Limiting', 'Algorithms', 'API Security'],
        starterCode: `class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  allowRequest() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

const bucket = new TokenBucket(3, 1);
console.log('Req 1:', bucket.allowRequest());
console.log('Req 2:', bucket.allowRequest());
console.log('Req 3:', bucket.allowRequest());
console.log('Req 4 (should be false):', bucket.allowRequest());`,
        testCases: [
          {
            id: 'tc-rl-1',
            name: 'Enforces capacity ceiling',
            testCode: `const b = new TokenBucket(2, 1); b.allowRequest(); b.allowRequest(); if (b.allowRequest() === false) return true; throw new Error("Rate limiter did not throttle excess request");`,
            description: 'Blocks calls when bucket has zero tokens.'
          }
        ],
        instructions: 'Build a token bucket rate limiter class with `capacity` and `refillRatePerSec`. The `allowRequest()` method must return true if tokens exist, otherwise false.'
      },
      {
        id: 'be-cache-redis',
        title: 'Caching Strategies & Redis',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Voice interview',
        description: 'Compare Cache-Aside, Write-Through, Write-Behind, cache invalidation, and mitigating cache stamps.',
        skillsCovered: ['Redis', 'Cache-Aside', 'TTL', 'Cache Stampede'],
        starterCode: `// Architecture Discussion:
// 1. Cache-Aside vs Write-Through
// 2. Cache Invalidation and Bloom Filters`,
        testCases: [],
        instructions: 'Walk the interviewer through how you would architect a multi-tiered caching layer with Redis to protect a high-throughput PostgreSQL cluster.'
      }
    ]
  },
  {
    id: 'fullstack',
    title: 'Fullstack',
    subtitle: 'TypeScript, React, Node, End-to-End',
    iconType: 'typescript',
    category: 'technical',
    description: 'Connect client state, type safety, server API orchestration, and resilient authentication systems.',
    interviewCount: 3,
    items: [
      {
        id: 'fs-type-safe-event-emitter',
        title: 'Type-Safe Event Emitter',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Live coding',
        description: 'Create an event emitter in TypeScript / JS supporting on, off, and emit patterns with memory safety.',
        skillsCovered: ['TypeScript', 'Design Patterns', 'Event-Driven'],
        starterCode: `class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listener);
    }
  }

  emit(event, ...args) {
    if (this.events.has(event)) {
      for (const listener of this.events.get(event)) {
        listener(...args);
      }
    }
  }
}

const ee = new EventEmitter();
const unsubscribe = ee.on('login', (user) => console.log('User logged in:', user));
ee.emit('login', { name: 'Alice' });
unsubscribe();
ee.emit('login', { name: 'Bob' }); // should not trigger listener`,
        testCases: [
          {
            id: 'tc-ee-1',
            name: 'Listener subscription & unsubscribe',
            testCode: `const e = new EventEmitter(); let c = 0; const un = e.on('x', () => c++); e.emit('x'); un(); e.emit('x'); if (c === 1) return true; throw new Error("Unsubscribe failed");`,
            description: 'Unsubscribe stops further listener calls.'
          }
        ],
        instructions: 'Implement an EventEmitter class with `on`, `off`, and `emit`. Ensure `on` returns an unsubscribe callback.'
      }
    ]
  },
  {
    id: 'system-design',
    title: 'System Design',
    subtitle: 'Go, distributed systems, caching, scaling',
    iconType: 'go',
    category: 'technical',
    description: 'Architect large-scale distributed systems handling millions of queries per second with high availability.',
    interviewCount: 3,
    items: [
      {
        id: 'sd-tinyurl',
        title: 'URL Shortener (TinyURL)',
        difficulty: 'Medium',
        durationMin: 35,
        type: 'Voice interview',
        description: 'Design a scalable URL shortening service: 100M URLs created/day, high read:write ratio, low latency.',
        skillsCovered: ['Base62 Hashing', 'Database Sharding', 'CDN', 'Consistency'],
        starterCode: `// Architecture Notes:
// Capacity Planning:
// 100M writes/day -> ~1,160 writes/sec
// 10:1 Read:Write ratio -> ~11,600 reads/sec
// Storage requirement for 5 years...`,
        testCases: [],
        instructions: 'Walk through capacity estimation, API endpoints, schema design, hash generation algorithms (Base62 vs MD5 pre-generator), and caching layers.'
      }
    ]
  },
  {
    id: 'sql',
    title: 'SQL / Databases',
    subtitle: 'Queries, indexing, normalization, transactions',
    iconType: 'sql',
    category: 'technical',
    description: 'Master relational data modeling, query optimization, ACID transactions, and index mechanics.',
    interviewCount: 3,
    items: [
      {
        id: 'sql-query-tuning',
        title: 'SQL Queries & Aggregations',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Live coding',
        description: 'Filter, aggregate, and rank customer transactions using JavaScript simulated in-memory SQL operations.',
        skillsCovered: ['Joins', 'Aggregation', 'Window Functions', 'Sorting'],
        starterCode: `// Simulate SQL: SELECT department, AVG(salary) as avg_sal FROM employees GROUP BY department HAVING avg_sal > 80000
const employees = [
  { id: 1, name: 'Alice', department: 'Engineering', salary: 120000 },
  { id: 2, name: 'Bob', department: 'Engineering', salary: 100000 },
  { id: 3, name: 'Charlie', department: 'Design', salary: 70000 },
  { id: 4, name: 'Dana', department: 'Sales', salary: 85000 },
  { id: 5, name: 'Eli', department: 'Design', salary: 65000 },
];

function getHighPayingDepartments(data) {
  // your code here: group by department and filter average salary > 80000
  const groups = {};
  for (const emp of data) {
    if (!groups[emp.department]) groups[emp.department] = [];
    groups[emp.department].push(emp.salary);
  }

  const result = [];
  for (const [dept, salaries] of Object.entries(groups)) {
    const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    if (avg > 80000) {
      result.push({ department: dept, avgSalary: Math.round(avg) });
    }
  }
  return result;
}

console.log('Result:', getHighPayingDepartments(employees));`,
        testCases: [
          {
            id: 'tc-sql-1',
            name: 'Groups and calculates averages accurately',
            testCode: `const res = getHighPayingDepartments(employees); if (res.length === 2) return true; throw new Error("Aggregation failed");`,
            description: 'Correctly isolates departments exceeding salary threshold.'
          }
        ],
        instructions: 'Implement the aggregation function to group employees by department, compute average salary, and filter out departments where average salary <= 80,000.'
      }
    ]
  },

  // --- NON-TECHNICAL TRACKS ---
  {
    id: 'behavioral',
    title: 'Behavioral / HR',
    subtitle: 'STAR method, leadership, culture fit',
    iconType: 'behavioral',
    category: 'non-technical',
    description: 'Master behavioral storytelling using the Situation-Task-Action-Result (STAR) technique for FAANG and top startup culture interviews.',
    interviewCount: 4,
    items: [
      {
        id: 'beh-star-method',
        title: 'Conflict Resolution & STAR',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Voice interview',
        description: 'Describe a situation where you had a significant disagreement with a teammate or stakeholder on technical direction.',
        skillsCovered: ['STAR Method', 'Empathy', 'Communication', 'Ownership'],
        starterCode: `// Behavioral Outline:
// S - Situation: What was the context and challenge?
// T - Task: What was your specific responsibility?
// A - Action: What concrete actions did you take to resolve it?
// R - Result: What was the measurable business or team outcome?`,
        testCases: [],
        instructions: 'Maya will ask you about managing conflict, prioritizing competing roadmaps, and recovering from production incidents.'
      }
    ]
  },
  {
    id: 'resume',
    title: 'Resume walkthrough',
    subtitle: 'Projects, architecture, past impact',
    iconType: 'resume',
    category: 'non-technical',
    description: 'Defend your architectural choices, explain project milestones, and articulate personal contributions with crisp authority.',
    interviewCount: 3,
    items: [
      {
        id: 'res-deep-dive',
        title: 'Flagship Project Walkthrough',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Voice interview',
        description: 'An in-depth inquiry into your most complex project: trade-offs, technologies chosen, and performance bottlenecks overcome.',
        skillsCovered: ['Technical Articulation', 'Impact Metrics', 'Trade-offs'],
        starterCode: `// Discussion Points:
// 1. Architecture of your primary project
// 2. What would you build differently today with what you learned?`,
        testCases: [],
        instructions: 'Upload your resume or paste project notes in the preflight screen to let the AI tailor specific questions to your background.'
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication practice',
    subtitle: 'Spoken fluency, conciseness, pacing',
    iconType: 'communication',
    category: 'non-technical',
    description: 'Sharpen your verbal delivery, eliminate filler words, organize spontaneous answers, and practice spoken English fluency.',
    interviewCount: 4,
    items: [
      {
        id: 'comm-spoken-fluency',
        title: 'Spoken English fluency',
        difficulty: 'Easy',
        durationMin: 15,
        type: 'Voice interview',
        description: 'Rapid conversational back-and-forth designed to test clarity, verbal confidence, tone, and pacing.',
        skillsCovered: ['Pacing', 'Pronunciation', 'Confidence', 'Clarity'],
        starterCode: `// Verbal practice session:
// Speak naturally into your microphone when the AI completes each turn.`,
        testCases: [],
        instructions: 'Engage in a friendly verbal dialogue about technology trends, team collaboration, and daily engineering routines.'
      }
    ]
  },
  {
    id: 'product',
    title: 'Product / Case study',
    subtitle: 'Product sense, metrics, trade-offs',
    iconType: 'product',
    category: 'non-technical',
    description: 'Tackle product management and system feasibility cases: user journeys, North Star metrics, and growth hypotheses.',
    interviewCount: 3,
    items: [
      {
        id: 'prod-feature-launch',
        title: 'Design an Elevator System',
        difficulty: 'Medium',
        durationMin: 30,
        type: 'Voice interview',
        description: 'Design elevator scheduling algorithms and user experience for a 100-story skyscraper with peak morning traffic.',
        skillsCovered: ['Product Sense', 'Constraint Optimization', 'User Empathy'],
        starterCode: `// Case parameters:
// - 100 floors, 10 elevator shafts
// - Morning rush: 80% ascending from Ground to higher floors`,
        testCases: [],
        instructions: 'Walk through customer segmentation, edge cases (disabled access, VIP express), algorithmic dispatching, and failure modes.'
      }
    ]
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Reasoning',
    subtitle: 'Mental math, logic puzzles, probability',
    iconType: 'aptitude',
    category: 'non-technical',
    description: 'Sharpen your problem framing and quantitative reasoning with estimation questions and probabilistic brainteasers.',
    interviewCount: 3,
    items: [
      {
        id: 'apt-estimation',
        title: 'Fermi Estimation & Logic',
        difficulty: 'Medium',
        durationMin: 20,
        type: 'Voice interview',
        description: 'Estimate market size and solve probability riddles by breaking ambiguous problems into verifiable assumptions.',
        skillsCovered: ['Fermi Estimation', 'Probability', 'Mental Math'],
        starterCode: `// Example: How many tennis balls can fit inside an airplane?
// Document your dimensional breakdown and packing density estimates.`,
        testCases: [],
        instructions: 'Work out the problem step-by-step aloud so the interviewer can evaluate your structured thinking.'
      }
    ]
  },
  {
    id: 'discussion',
    title: 'Group discussion',
    subtitle: 'Persuasion, active listening, debate',
    iconType: 'discussion',
    category: 'non-technical',
    description: 'Practice leading technical debates, synthesizing diverse opinions, and championing balanced decisions.',
    interviewCount: 3,
    items: [
      {
        id: 'gd-microservices-monolith',
        title: 'Monolith vs Microservices Debate',
        difficulty: 'Medium',
        durationMin: 25,
        type: 'Voice interview',
        description: 'Present balanced arguments on whether an early-stage startup should transition from a modular monolith to microservices.',
        skillsCovered: ['Debate', 'Active Listening', 'Pragmatism', 'Total Cost of Ownership'],
        starterCode: `// Key debate dimensions:
// 1. Operational overhead vs Team autonomy
// 2. Distributed transactions vs ACID ease`,
        testCases: [],
        instructions: 'Take a reasoned stand, answer counter-arguments presented by the AI interviewer, and summarize a balanced action plan.'
      }
    ]
  }
];
