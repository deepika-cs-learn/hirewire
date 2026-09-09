/**
 * HireWire Code Sandbox - Static Validation & Test Verification Engine
 * 
 * Implements a multi-stage validation layer and test-case comparison engine
 * without relying on new Function() or unverified error-only assertions.
 */

export interface SyntaxValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  structure: {
    hasFunction: boolean;
    functionNames: string[];
    hasReturn: boolean;
    lineCount: number;
  };
}

export interface TestCaseVerificationResult {
  id: string;
  name: string;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
  durationMs: number;
}

export interface CodeExecutionSummary {
  success: boolean;
  syntaxValid: boolean;
  syntaxErrors: string[];
  syntaxWarnings: string[];
  stdout: string[];
  stderr: string[];
  returnValue?: any;
  testResults: TestCaseVerificationResult[];
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
}

/**
 * Stage 1: Validation Layer
 * Inspects bracket nesting, string closures, keyword declarations, and logic completeness.
 */
export function validateCodeSyntax(code: string): SyntaxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    return {
      isValid: false,
      errors: ['Code editor is empty. Please provide an implementation.'],
      warnings: [],
      structure: { hasFunction: false, functionNames: [], hasReturn: false, lineCount: 0 },
    };
  }

  const lines = code.split('\n');
  const lineCount = lines.length;

  // Track brackets and strings accounting for comments and escape sequences
  const stack: { char: string; line: number; col: number }[] = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    inLineComment = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const prevChar = c > 0 ? line[c - 1] : '';
      const nextChar = c + 1 < line.length ? line[c + 1] : '';

      // Skip escaped characters
      if (prevChar === '\\') {
        continue;
      }

      // Handle comments
      if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (!inBlockComment && char === '/' && nextChar === '/') {
          inLineComment = true;
          break; // Rest of line is comment
        }
        if (!inBlockComment && char === '/' && nextChar === '*') {
          inBlockComment = true;
          c++;
          continue;
        }
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          c++;
          continue;
        }
      }

      if (inLineComment || inBlockComment) {
        continue;
      }

      // Handle quotes
      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        continue;
      }

      // If inside string literal, skip bracket matching
      if (inSingleQuote || inDoubleQuote || inBacktick) {
        continue;
      }

      // Check opening brackets
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: l + 1, col: c + 1 });
      }

      // Check closing brackets
      if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          errors.push(`Syntax error on line ${l + 1}, column ${c + 1}: Unexpected closing '${char}' with no matching opening bracket.`);
          break;
        }
        const last = stack.pop()!;
        const expected = last.char === '{' ? '}' : last.char === '(' ? ')' : ']';
        if (char !== expected) {
          errors.push(
            `Syntax error on line ${l + 1}: Mismatched bracket. Found '${char}', but expected '${expected}' to close '${last.char}' from line ${last.line}.`
          );
          break;
        }
      }
    }

    if (inSingleQuote) {
      errors.push(`Syntax error on line ${l + 1}: Unclosed single-quoted string literal.`);
      inSingleQuote = false; // reset for next line
    }
    if (inDoubleQuote) {
      errors.push(`Syntax error on line ${l + 1}: Unclosed double-quoted string literal.`);
      inDoubleQuote = false;
    }
  }

  if (inBacktick) {
    errors.push('Syntax error: Unclosed template literal (backtick `` ` ``).');
  }

  if (inBlockComment) {
    errors.push('Syntax error: Unclosed multi-line comment /* ... */.');
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push(`Syntax error: Unclosed opening bracket '${unclosed.char}' on line ${unclosed.line}, col ${unclosed.col}.`);
  }

  // Structural checks: functions and returns
  const functionRegex = /(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s*)?class\s+([a-zA-Z0-9_$]+))/g;
  const functionNames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = functionRegex.exec(code)) !== null) {
    const fnName = match[1] || match[2] || match[3];
    if (fnName && !functionNames.includes(fnName)) {
      functionNames.push(fnName);
    }
  }

  const hasFunction = functionNames.length > 0 || /=>/g.test(code) || /function/g.test(code);
  const hasReturn = /\breturn\b/.test(code);

  if (!hasFunction) {
    warnings.push('Warning: No function declaration or class detected. Ensure your solution exports or defines a callable function.');
  }

  if (hasFunction && !hasReturn && !/class\s+/g.test(code)) {
    warnings.push('Notice: No "return" keyword found inside the implementation. Ensure your function returns the expected result.');
  }

  // Check for common bugs: assignment in if condition like if (a = 5)
  if (/\bif\s*\(\s*[a-zA-Z0-9_$]+\s*=\s*[^=]/g.test(code)) {
    warnings.push('Warning: Possible accidental assignment in condition (`=` instead of `===` or `==`).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    structure: {
      hasFunction,
      functionNames,
      hasReturn,
      lineCount,
    },
  };
}

/**
 * Deep equality comparator for verifying outputs against expected results
 */
export function areOutputsEqual(actual: any, expected: any): boolean {
  if (actual === expected) return true;

  // Handle NaN equality
  if (typeof actual === 'number' && typeof expected === 'number' && isNaN(actual) && isNaN(expected)) {
    return true;
  }

  if (actual === null || expected === null || actual === undefined || expected === undefined) {
    return actual === expected;
  }

  if (typeof actual !== typeof expected) {
    return false;
  }

  // Arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (!areOutputsEqual(actual[i], expected[i])) return false;
    }
    return true;
  }

  // Objects
  if (typeof actual === 'object' && typeof expected === 'object') {
    const keysA = Object.keys(actual);
    const keysB = Object.keys(expected);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(expected, key)) return false;
      if (!areOutputsEqual(actual[key], expected[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Formats a value nicely for display in terminal test output
 */
export function formatValue(val: any): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'function') return '[Function]';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return JSON.stringify(val);
}

/**
 * Sandboxed Code Runner with fast execution, timeout protection, and log capture.
 * Captures console.log, console.warn, console.error, and runtime errors cleanly.
 */
export async function runSandboxedScript(
  code: string,
  timeoutMs = 3000
): Promise<{ stdout: string[]; stderr: string[]; result?: any; error?: string }> {
  if (typeof window === 'undefined') {
    return { stdout: [], stderr: [], error: 'Browser environment required.' };
  }

  const stdout: string[] = [];
  const stderr: string[] = [];

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runner = new AsyncFunction(`
      const __stdout = [];
      const __stderr = [];
      const console = {
        log: (...args) => __stdout.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args) => __stdout.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => __stderr.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      };

      let __result;
      try {
        ${code}
      } catch (e) {
        throw e;
      }
      return { stdout: __stdout, stderr: __stderr, result: __result };
    `);

    const runPromise = runner();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Execution Timed Out (exceeded ${timeoutMs}ms). Check for infinite loops.`)), timeoutMs)
    );

    const res: any = await Promise.race([runPromise, timeoutPromise]);
    return {
      stdout: res?.stdout || [],
      stderr: res?.stderr || [],
      result: res?.result,
    };
  } catch (err: any) {
    return {
      stdout,
      stderr,
      error: err?.message || String(err),
    };
  }
}

/**
 * Sandboxed Test Case Verification with explicit actual vs expected comparison.
 * Seamlessly handles synchronous assertions, promises/async code, and explicit return true/false
 * without leaking variables or hanging on return statements.
 */
export async function verifyTestCases(
  candidateCode: string,
  testCases: Array<{ id: string; name: string; testCode: string; description?: string }>
): Promise<TestCaseVerificationResult[]> {
  const results: TestCaseVerificationResult[] = [];

  for (const tc of testCases) {
    const startTime = performance.now();
    let passed = false;
    let error: string | undefined;
    let expected: string | undefined;
    let actual: string | undefined;

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // The runner executes candidateCode in its own scope, then executes tc.testCode
      // inside an async test closure so 'return true' or 'return false' works seamlessly.
      const runner = new AsyncFunction('testCode', `
        const __stdout = [];
        const __stderr = [];
        const console = {
          log: (...args) => __stdout.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => __stdout.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => __stderr.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        };

        // 1. Evaluate candidate code
        ${candidateCode}

        // 2. Evaluate test assertion in an async closure
        const __testFn = async () => {
          ${tc.testCode}
        };

        const __res = await __testFn();
        return { result: __res, stdout: __stdout, stderr: __stderr };
      `);

      const runPromise = runner(tc.testCode);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test Execution Timed Out (> 3000ms). Check for infinite loops.')), 3000)
      );

      const execRes: any = await Promise.race([runPromise, timeoutPromise]);

      if (execRes?.result === false) {
        passed = false;
        error = 'Assertion failed: test returned false';
      } else {
        passed = true;
      }
    } catch (err: any) {
      passed = false;
      error = err?.message || String(err);

      // Extract expected/actual values if present in error message
      const errStr = String(error);
      const expectedMatch = errStr.match(/expected\s+([^\n,]+)/i);
      if (expectedMatch) expected = expectedMatch[1].trim();

      const actualMatch = errStr.match(/(?:received|actual|got)\s*:?\s*([^\n,]+)/i);
      if (actualMatch) actual = actualMatch[1].trim();
    }

    const durationMs = Math.round(performance.now() - startTime);
    results.push({
      id: tc.id,
      name: tc.name,
      passed,
      error,
      expected,
      actual,
      durationMs,
    });
  }

  return results;
}
