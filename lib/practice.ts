import bank from '@/data/questions.json';

export const questions = bank;
export type Question = (typeof bank)[number];
export type Draft = { code: string; seconds: number; passedCode?: string; attempts: number };
export type Progress = Record<number, Draft>;
export type ExecutionResult = {
  stdout: string; stderr: string; compiler: string; exitCode: number;
  elapsed: number; timedOut: boolean; signal: string; gradePassed?: boolean;
  gradeTestsPassed?: boolean; examplePassed?: boolean;
};
export const STORAGE_KEY = 'javalab-progress-foundation-plus-v1';
export const categories = ['Semua materi', 'Constructor', 'Method & Logika', 'Array & Loop', 'String', 'Static & Composition'];

export function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trimEnd();
}
export function matchesExample(result: ExecutionResult, expected: string) {
  return result.exitCode === 0 && !result.timedOut && !result.signal && normalizeOutput(result.stdout) === normalizeOutput(expected);
}
export function isPassed(draft?: Draft) { return Boolean(draft && draft.passedCode === draft.code); }
export function reusableResult(
  previous: { questionId: number; code: string; stdin: string; result?: ExecutionResult } | null,
  questionId: number, code: string, stdin: string,
): ExecutionResult | null {
  if (!previous || previous.questionId !== questionId || previous.code !== code || previous.stdin !== stdin) return null;
  const result = previous.result;
  return result && result.gradePassed !== undefined && result.exitCode === 0 && !result.timedOut && !result.signal ? result : null;
}
export function chooseRandom(pool: Question[], currentId: number, seen: number[], progress: Progress, random = Math.random) {
  const different = pool.filter(q => q.id !== currentId);
  const choices = different.length ? different : pool;
  const unfinished = choices.filter(q => !isPassed(progress[q.id]));
  const preferred = unfinished.length ? unfinished : choices;
  const fresh = preferred.filter(q => !seen.includes(q.id));
  const candidates = fresh.length ? fresh : preferred;
  return candidates.length ? candidates[Math.floor(random() * candidates.length)] : null;
}
export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
function removeLegacyPlaceholder(code: string) {
  return code.split(/(\r?\n)/).map(line => {
    if (line.trim() === 'throw new UnsupportedOperationException("Belum dikerjakan");') return '';
    if (line.trim() === '// Hapus baris throw dan tulis kodemu di sini.') {
      return line.replace('// Hapus baris throw dan tulis kodemu di sini.', '// Tulis kodemu di sini.');
    }
    return line;
  }).join('');
}
export function parseSavedProgress(value: unknown): { progress: Progress; current: number; seen: number[] } | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !raw.progress || typeof raw.progress !== 'object') return null;
  const progress: Progress = {};
  for (const q of questions) {
    const d = (raw.progress as Record<number, unknown>)[q.id];
    if (!d || typeof d !== 'object') continue;
    const v = d as Record<string, unknown>;
    if (typeof v.code !== 'string' || v.code.length > 60000) continue;
    progress[q.id] = {
      code: removeLegacyPlaceholder(v.code),
      seconds: typeof v.seconds === 'number' && Number.isFinite(v.seconds) ? Math.max(0, Math.floor(v.seconds)) : 0,
      attempts: typeof v.attempts === 'number' && Number.isFinite(v.attempts) ? Math.max(0, Math.floor(v.attempts)) : 0,
      ...(typeof v.passedCode === 'string' && v.passedCode.length <= 60000 ? { passedCode: removeLegacyPlaceholder(v.passedCode) } : {}),
    };
  }
  const current = typeof raw.current === 'number' && questions.some(q => q.id === raw.current) ? raw.current : 1;
  const seen = Array.isArray(raw.seen) ? raw.seen.filter((id): id is number => typeof id === 'number' && questions.some(q => q.id === id)) : [];
  return { progress, current, seen };
}
