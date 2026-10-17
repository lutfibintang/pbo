import { assessmentDb } from './assessment';
export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-javalab-student' : 'javalab-student';
export async function tokenHash(token:string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export function sessionToken(request:Request) {
  return (request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';
}
export async function getStudentSession(request:Request) {
  const token=sessionToken(request);
  if(!/^[a-f0-9]{64}$/.test(token))return null;
  return assessmentDb().prepare('SELECT p.user_id AS "userId", p.nim, p.name, a.question_id AS "questionId" FROM student_sessions s JOIN students p ON p.user_id=s.user_id JOIN assignments a ON a.user_id=p.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await tokenHash(token),Date.now()).first<{userId:string;nim:string;name:string;questionId:number}>();
}
export function sessionCookie(token:string,maxAge:number) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;
}
