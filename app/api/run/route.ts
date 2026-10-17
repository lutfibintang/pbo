import { sameOrigin } from '@/lib/request-origin';
export const runtime = 'nodejs';
export const maxDuration = 60;
import { getStudentSession } from '@/lib/student-session';
import { assessmentDb } from '@/lib/assessment';
import { executeJava, RunnerError } from '@/lib/java-runner';
import { buildGradingCode, extractGradingResult } from '@/lib/grading';
import bank from '@/data/questions.json';

function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trimEnd();
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Permintaan harus berasal dari JavaLab.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Gunakan format JSON.' }, { status: 415 });
  let submissionId: string | null = null;
  try {
    const body = await request.text();
    if (body.length > 80000) return Response.json({ error: 'Kode terlalu panjang. Maksimal 50.000 karakter.' }, { status: 413 });
    let input: { code?: unknown; stdin?: unknown; questionId?: unknown; studentNim?: unknown };
    try { input = JSON.parse(body); } catch { return Response.json({ error: 'Format permintaan tidak valid.' }, { status: 400 }); }
    if (!input || typeof input.code !== 'string' || !input.code.trim() || input.code.length > 50000) return Response.json({ error: 'Isi kode Java terlebih dahulu (maksimal 50.000 karakter).' }, { status: 400 });
    if (input.stdin !== undefined && (typeof input.stdin !== 'string' || input.stdin.length > 10000)) return Response.json({ error: 'Input maksimal 10.000 karakter.' }, { status: 400 });
    if (!Number.isInteger(input.questionId) || Number(input.questionId) < 1 || Number(input.questionId) > 40) return Response.json({ error: 'Nomor soal tidak valid.' }, { status: 400 });
    const nonce = crypto.randomUUID().replaceAll('-', '');
    let gradingCode: string;
    try { gradingCode = buildGradingCode(input.code, Number(input.questionId), nonce); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Kode soal tidak dapat diuji.' }, { status: 400 }); }
    const user = await getStudentSession(request);
    if (!user) return Response.json({error:'Masuk terlebih dahulu.'}, {status:401});
    if (input.studentNim !== user.nim) return Response.json({error:'Sesi praktikan berubah. Muat ulang halaman sebelum mengirim kode.'}, {status:409});
    if (Number(input.questionId) !== user.questionId) return Response.json({error:'Kamu hanya dapat mengerjakan soal yang ditetapkan.'}, {status:403});
    const db = assessmentDb();
    const student = await db.prepare('SELECT user_id FROM students WHERE user_id = ?').bind(user.userId).first();
    if (!student) return Response.json({error:'Lengkapi identitas praktikan terlebih dahulu.'}, {status:409});
    submissionId = crypto.randomUUID();
    await db.prepare('INSERT INTO submissions (id,user_id,question_id,code,stdin,status,created_at,duration_seconds) SELECT ?,?,?,?,?,?,?,GREATEST(0,FLOOR(EXTRACT(EPOCH FROM (clock_timestamp()-started_at))))::integer FROM assignments WHERE user_id=?').bind(submissionId,user.userId,Number(input.questionId),input.code,typeof input.stdin === 'string' ? input.stdin : '', 'processing',new Date().toISOString(),user.userId).run();
    const result = await executeJava(gradingCode, typeof input.stdin === 'string' ? input.stdin : '');
    const extracted = extractGradingResult(result.stdout, nonce);
    const expected = bank.find(question => question.id === Number(input.questionId))!.expected;
    const examplePassed = normalizeOutput(extracted.stdout) === normalizeOutput(expected);
    const responseResult = { ...result, ...extracted, gradeTestsPassed: extracted.gradePassed, examplePassed, gradePassed: result.exitCode === 0 && !result.timedOut && !result.signal && extracted.gradePassed && examplePassed };
    await db.prepare('UPDATE submissions SET status = ?, score = ?, result = ? WHERE id = ?').bind('graded',responseResult.gradePassed ? 100 : 0,JSON.stringify(responseResult),submissionId).run();
    return Response.json({...responseResult, submissionId}, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (submissionId) {
      try { await assessmentDb().prepare('UPDATE submissions SET status = ?, result = ? WHERE id = ?').bind('error',JSON.stringify({error:error instanceof RunnerError ? error.message : 'Eksekusi atau penyimpanan hasil gagal. Silakan ulangi.'}),submissionId).run(); } catch { /* Original code remains saved as processing. */ }
    }
    const known = error instanceof RunnerError;
    return Response.json({ error: known ? error.message : 'Terjadi gangguan saat menjalankan kode. Silakan coba lagi.' }, { status: known ? error.status : 500 });
  }
}
