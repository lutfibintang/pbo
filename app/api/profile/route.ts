import { sameOrigin } from '@/lib/request-origin';
import { assessmentDb } from '@/lib/assessment';
import { getStudentSession,sessionCookie,sessionToken,tokenHash } from '@/lib/student-session';
import roster from '@/data/roster.json';
export async function GET(request:Request) {
  try {
    const student=await getStudentSession(request);
    const profile=student?{nim:student.nim,name:student.name,questionId:student.questionId}:null;
    return Response.json({profile},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Sesi belum dapat dimuat. Coba lagi.'},{status:503});}
}
export async function POST(request:Request) {
  if(!sameOrigin(request))return Response.json({error:'Permintaan tidak diizinkan.'},{status:403});
  try {
    const raw=await request.text();
    if(raw.length>200)return Response.json({error:'Kode NPM tidak valid.'},{status:400});
    let input;try{input=JSON.parse(raw);}catch{return Response.json({error:'Kode NPM tidak valid.'},{status:400});}
    const code=typeof input?.code==='string'?input.code.trim():'';
    const entry=roster.find(p=>p.code===code);
    if(!entry)return Response.json({error:'Kode NPM tidak terdaftar. Gunakan dua digit, atau tiga digit untuk nomor 100 ke atas.'},{status:400});
    const db=assessmentDb();
    await db.prepare("INSERT INTO students (user_id,nim,name,class_name,created_at) VALUES (?,?,?,'',?) ON CONFLICT(nim) DO UPDATE SET name=excluded.name").bind('npm:'+entry.nim,entry.nim,entry.name,new Date().toISOString()).run();
    const student=await db.prepare('SELECT user_id AS "userId" FROM students WHERE nim=?').bind(entry.nim).first<{userId:string}>();
    if(!student)throw new Error('Identity not saved');
    await db.prepare('INSERT INTO assignments (user_id,question_id) VALUES (?,?) ON CONFLICT(user_id) DO NOTHING').bind(student.userId,entry.questionId).run();
    const assigned=await db.prepare('SELECT question_id AS "questionId" FROM assignments WHERE user_id=?').bind(student.userId).first<{questionId:number}>();
    const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
    const old=sessionToken(request);
    if(old)await db.prepare('DELETE FROM student_sessions WHERE token_hash=?').bind(await tokenHash(old)).run();
    await db.prepare('INSERT INTO student_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await tokenHash(token),student.userId,Date.now()+12*60*60*1000).run();
    return Response.json({profile:{nim:entry.nim,name:entry.name,questionId:assigned!.questionId}},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie(token,43200)}});
  }catch{return Response.json({error:'Login belum berhasil. Coba lagi.'},{status:503});}
}
export async function DELETE(request:Request) {
  if(!sameOrigin(request))return Response.json({error:'Permintaan tidak diizinkan.'},{status:403});
  try {
    const token=sessionToken(request);
    if(token)await assessmentDb().prepare('DELETE FROM student_sessions WHERE token_hash=?').bind(await tokenHash(token)).run();
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie('',0)}});
  }catch{return Response.json({error:'Sesi belum berhasil ditutup. Coba lagi sebelum mengganti praktikan.'},{status:503});}
}
