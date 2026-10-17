import type { ExecutionResult } from './practice';

const API_URL = 'https://wandbox.org/api/compile.json';
export class RunnerError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

/** Keep Main.java intact; Wandbox compiles its small entry file as prog.java. */
export function createCompilationRequest(code: string, stdin: string) {
  return {
    compiler: 'openjdk-jdk-21+35',
    code: 'class JavaLabRunner { public static void main(String[] args) throws Exception { Main.main(args); } }',
    codes: [{ file: 'Main.java', code }],
    stdin, save: false,
  };
}
export async function executeJava(code: string, stdin: string, fetcher: typeof fetch = fetch): Promise<ExecutionResult> {
  const start = Date.now();
  let response: Response;
  try {
    response = await fetcher(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createCompilationRequest(code, stdin)), signal: AbortSignal.timeout(35000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new RunnerError('Waktu tunggu compiler habis. Cek perulanganmu atau coba lagi sebentar.', 504);
    }
    throw new RunnerError('Layanan compiler belum dapat dihubungi. Kode tetap tersimpan; coba lagi sebentar.');
  }
  if (response.status === 429) throw new RunnerError('Compiler sedang ramai. Tunggu sebentar sebelum menjalankan lagi.', 429);
  if (!response.ok) throw new RunnerError('Layanan compiler sedang tidak tersedia. Coba lagi sebentar.');
  const raw = await response.json() as Record<string, unknown>;
  if (!('status' in raw) && !('signal' in raw)) throw new RunnerError('Compiler mengembalikan respons yang tidak dikenali.');
  const str = (key: string) => typeof raw[key] === 'string' ? (raw[key] as string).slice(0, 60000) : '';
  const signal = str('signal');
  const stderr = str('program_error');
  return {
    stdout: str('program_output'), stderr, compiler: str('compiler_message') || str('compiler_error'),
    exitCode: Number.isFinite(Number(raw.status)) ? Number(raw.status) : -1,
    elapsed: Date.now() - start, signal,
    timedOut: /CPU time|time limit|SIGXCPU/i.test(signal + stderr),
  };
}
